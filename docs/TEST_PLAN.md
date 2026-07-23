# Test Plan

## Status note

This document now describes the test suite as actually implemented, not a target contract for
future work — 37 Vitest unit tests across `src/lib/engines/` and `src/lib/authz/`, and 23 Playwright
tests across 9 spec files under `tests-e2e/`. Run `npm test` and `npm run test:e2e` to reproduce the numbers below;
`src/config/capabilities.ts` records per-capability test status if this document and reality ever
drift apart. A GitHub Actions workflow (`.github/workflows/ci.yml`) runs all of the above plus the
production build on every push and pull request against `main`.

**A note on how this document was corrected once already**: an earlier version of this section
claimed axe-core accessibility scans and keyboard-only passes existed on all five/eight golden
flows. They didn't — a later review caught the gap between the claim and the code. Rather than
repeat that mistake, the "Accessibility smoke checks" section below states plainly which flow
actually carries the scan and which don't, instead of describing an aspirational target as if it
were already true everywhere.

## Test strategy overview

Suvidha's testing effort is deliberately weighted toward the parts of the system where a bug is
either invisible-but-serious (an authority/permission rule silently granting the wrong access) or
where honesty guarantees live (execution-method labeling, normalized-vs-raw status). Broad UI-only
coverage is explicitly de-prioritized relative to that; see "Coverage decisions and why" below.

## 1. Vitest unit tests

Run via `npm run test` (`vitest run`) / `npm run test:watch`. Target: `src/lib/**` — the pure logic
layer, kept deliberately framework-agnostic and easy to test in isolation from React/Next.js.

### Authority / rule engine (`src/lib/authority-engine.ts` and `Rule`/`RuleVersion`/`EligibilityRule`)

This is the highest-priority unit-test target in the codebase: it decides who is eligible for a
service, what pathway a claim recommends, and it is versioned specifically so decisions are
auditable — a regression here has real consequences.

- Given a `RuleVersion.definition` (JSON-serialized condition/output pairs), evaluating a matching
  input returns the expected output; evaluating a non-matching input returns no match, not a
  false-positive default.
- Only the `isActive` `RuleVersion` for a given `ruleId` is evaluated; an older, superseded version
  is never silently applied.
- Claim-pathway recommendation (`ClaimAsset.recommendedPathway`) is deterministic for a given input
  fact pattern — the same holding type, nomination status, and claimant role always recommend the
  same pathway (e.g. `nominee_bank_deposit` vs. `legal_heir_no_will`).
- Eligibility-rule evaluation (`EligibilityRule.conditionDefinition`) correctly gates a
  `ServiceDefinition` from appearing as available when the citizen's facts don't satisfy the
  condition, and correctly surfaces it when they do.
- Malformed or missing rule-condition JSON fails closed (treated as "not eligible" / "no
  recommendation," logged for investigation) rather than failing open or throwing an unhandled
  exception that crashes the request-creation flow.

### Permission / access-grant logic (`AccessGrant`, `AccessPolicy`, `DelegatedTask`, `ConsentScope`)

- A `DelegatedTask` with `permissionTier: "permission_to_prepare"` can update a `ServiceRequest`
  draft but is rejected from calling the submit action — the prepare/submit boundary from
  `docs/SEQUENCE_DIAGRAMS.md` §(c) is enforced in code, not only in UI copy.
- An `AccessGrant` under an `AccessPolicy` with `timingRule: "after_verified_death"` denies access
  before `Person.lifeStatus` reaches `deceased_verified`, and grants it only after.
- Revoking a `TrustedContact` (`status: "revoked"`) immediately invalidates every `AccessGrant`
  under it — no grant remains active after the parent relationship is revoked, and this is checked
  with a test that revokes mid-session and asserts the very next permission check fails.
- A `ProfessionalRepresentative` with `status: "revoked"` can no longer act on any `DelegatedTask`
  tied to it, even one created before the revocation.
- Checker/Maker separation: a `recordCheckerDecision` call is rejected when the acting user matches
  the `decidedByUserId` on the referenced Maker `Decision` — this specific test is treated as a
  security-critical regression test, not an ordinary unit test, given its role in the maker-checker
  control described in `docs/API_CONTRACTS.md`.
- Consent-scope boundary: a `ConsentScope` limited to `purposeKey: "address_verification"` does not
  authorize a connector call under a different purpose, even for the same institution.

### Normalization helpers (`src/lib/json.ts` and status-normalization logic)

- `src/lib/json.ts`'s serialize/deserialize helpers round-trip correctly for every JSON-backed
  column in the schema (`matchFactors`, `scopeConfig`, `permittedUses`, `fieldsShared`,
  `conditionDefinition`, etc.), including empty-array and empty-object edge cases.
- Malformed stored JSON (simulating drift/corruption) is handled by returning a safe default and
  logging, never by throwing inside a render path.
- `InstitutionStatusMapping` correctly maps an institution's `rawStatusLabel` to the expected
  `normalizedStatus`; an unmapped raw label falls back to a defined "unmapped" normalized state
  (never silently dropped or mis-mapped to `completed`).
- Masking helpers (identifier masking, amount-banding for `amountBand`/`outstandingAmountBand`)
  never leak the raw underlying value in their output, tested with adversarial-length and
  edge-case inputs.

## 2. Playwright end-to-end tests

Run via `npm run test:e2e` / `npm run test:e2e:ui`. Nine spec files under `tests-e2e/`, run serially
(`workers: 1`) against a real dev server (or, via `PLAYWRIGHT_BASE_URL`, against the deployed Vercel
instance — used to verify the live demo after each deploy):

| # | Spec file | Golden flow | Why it's e2e-covered |
|---|---|---|---|
| 1 | `golden-flow-a-onboarding-and-planning.spec.ts` | Estate Planner onboarding, profile discrepancies, institutions, estate readiness, Trusted Contact revocation | The activation path every other citizen flow depends on. Also carries the suite's accessibility smoke check (see below). |
| 2 | `golden-flow-b-life-event.spec.ts` | Address-change life event: direct-API completion and manual self-report with reference number/date | Two of the four execution-method paths a citizen can take. |
| 3 | `golden-flow-c-family-assisted-access.spec.ts` | Owner approves a Family Administrator's delegated task | The prepare/approve permission boundary — exactly the kind of bug a unit test alone would miss. |
| 4 | `golden-flow-d-claimant-and-ops.spec.ts` | Claimant tracks a claim; Claims Officer reviews it and records a decision | Covers both the citizen and institution-officer surfaces for Legacy & Succession claims. |
| 5 | `golden-flow-e-false-death-correction.spec.ts` | Challenge → re-verification → correction → restoration | A safety-critical reversal path that must never regress silently. |
| 6 | `golden-flow-f-no-will-claimant.spec.ts` | Uninvited claimant, intestate succession, open deficiency | The harder claimant path — no prior Trusted Contact relationship. |
| 7 | `golden-flow-g-address-change-institution-loop.spec.ts` | **The primary end-to-end outcome**: citizen deficiency response → maker recommendation → a *different* checker's approval → institution completion → profile reconciliation; plus the negative case of a maker attempting to also act as checker on their own case | Proves the whole cross-domain thesis — a life event resolved through real institution review, closing the loop back into the citizen's own profile — actually works, not just that each screen renders. Also carries two accessibility smoke checks (see below). |
| 8 | `golden-flow-i-negative-authorization.spec.ts` | Cross-citizen, cross-institution, and role-based access attempts, all rejected server-side | Proves `src/lib/authz/` is load-bearing, not just documented — see `docs/ACCESS_CONTROL_MATRIX.md`. |
| 9 | `golden-flow-j-capability-completion.spec.ts` | Document upload/sharing, inbox reply/escalate/report-suspicious, delegated-access invitation, connecting a new institution, non-address requests (mobile number and PAN name correction) reconciling correctly, grievance escalation, and the Life Admin Assistant's expanded question set | Proves the capabilities that were previously `interface_prototype` (real screen, no real action behind it) in `src/config/capabilities.ts` actually write state now, not just render — the same category of gap the IDOR/authorization audit found in v2, applied to feature-completeness instead of security. |

**Manually verified, not under full e2e** (see `src/config/capabilities.ts` for the authoritative
list): the financial administration overview's read-only views. This is lower-frequency and
lower-risk relative to the authorization and cross-domain-orchestration paths that get full e2e
investment, consistent with this being a time-boxed prototype rather than a production QA program.

**A note on dev-server flakiness this suite surfaced (and fixed) during development**: two real
bugs were only caught by running this suite, not by manual clicking — (1) Next.js blocks a dev
server's HMR websocket for a cross-origin test runner by default, which silently broke all
client-side interactivity (radio/tab clicks) until `allowedDevOrigins` was set in `next.config.ts`;
(2) `loginAs()` in `tests-e2e/helpers.ts` now explicitly waits for the post-login redirect to land
before the next navigation, because occasionally proceeding immediately after the click raced ahead
of the session cookie being committed under load, surfacing as a null-user crash on whichever page
loaded next. Both are worth knowing if this suite ever becomes flaky again.

### Empty, loading, and error state testing expectations

For each golden e2e flow, the following states are explicitly exercised, not left to incidental
coverage:

- **Empty state**: a new citizen with no institutions/documents/requests sees the `EmptyState`
  pattern (`docs/DESIGN_SYSTEM.md`) with a specific next action, not a blank or broken screen.
- **Loading state**: slow/pending connector responses (simulated via a deliberate delay in the
  connector mock) render the `Skeleton` pattern rather than a layout jump or blank flash.
- **Error state**: a simulated connector failure (`status: "failed"`) surfaces the honest,
  execution-method-aware error copy from `docs/CONTENT_GUIDELINES.md`, and the affected
  `ServiceRequest`/`InstitutionRelationship` is left in an accurate, non-fabricated status rather
  than being marked complete or silently retried without user visibility.
- **Partial failure**: for flow #4 (claim processing) and #5 (false-death correction), at least one
  test scenario includes an institution that fails to acknowledge propagation, verifying the UI
  shows per-institution status rather than a single misleading aggregate (per `docs/EVENT_MODEL.md`
  §7).

### Accessibility smoke checks

**Honest status, corrected after an earlier version of this document overclaimed it**: three pages
across two spec files currently carry an automated `@axe-core/playwright` scan (critical/serious
violations fail the test) — `golden-flow-a`'s `/home` citizen dashboard, and `golden-flow-g`'s
citizen request-detail page (`/requests/[id]`, form-heavy) and institution ops-console page
(`/ops/requests/[id]`, the first ops screen ever scanned). `golden-flow-a` also carries a
keyboard-tab-order check confirming focus lands on a real interactive element without a mouse. The
other seven spec files carry neither. **Extending the scan to a second flow immediately found a
real WCAG AA violation**, not a hypothetical one: the `warning` badge variant (used for statuses
like "Awaiting institution decision") had 4.23:1 contrast against white text against a 4.5:1
minimum — fixed by darkening `--warning` in `globals.css` to 5.17:1. A check that every icon-only
control has an accessible name, and that execution-method badges carry accessible text, is not
automated anywhere — both are still manual-review items against `docs/ACCESSIBILITY.md` and
`docs/DESIGN_SYSTEM.md`. Extending the scan to the remaining seven flows is a recommended next
step, not claimed as done.

## 3. Gates before considering a change complete

No change is considered complete until all of the following pass locally and in CI
(`.github/workflows/ci.yml`, which runs on every push and pull request against `main`):

1. **Lint** — `npm run lint` (ESLint via `eslint.config.mjs` / `eslint-config-next`), zero errors.
2. **Typecheck** — `npm run typecheck` (`tsc --noEmit`), zero errors — particularly important given
   the amount of Zod-validated `string` status/JSON-serialized data flowing through the schema,
   where TypeScript alone can't catch a mismatched status string but *can* catch a wrong shape being
   passed between a Server Action and its caller.
3. **Unit tests** — `npm run test` (`vitest run`), all passing, with the authority-engine,
   permission/access-grant, and normalization-helper suites treated as release-blocking, not
   optional.
4. **Build** — `npm run build`, completing without error (catches Server Component/Server Action
   boundary mistakes, and any Prisma-adapter driver misconfiguration, that typecheck alone can miss).
5. **E2E** — `npm run test:e2e`, all nine spec files passing, before a change touching any of those
   flows' underlying models or Server Actions is merged.
6. **Manual smoke pass** — for changes touching the financial administration overview (the only
   remaining manually-verified surface, per `src/config/capabilities.ts`) or any ops-console screen
   not yet under e2e, a documented manual walkthrough, recorded in the PR description,
   substitutes for automated e2e coverage.

A change that fails any of these gates is not complete, regardless of whether the underlying feature
"works" in an ad hoc manual check — these gates exist specifically so that a working demo today
doesn't silently regress as later domains are built on top of it.
