# Test Plan

## Status note

As of this writing, `src/lib/engines/` is an empty directory and no test files exist yet in the
repository — the schema and terminology are finalized but the business-logic engines, UI, and their
tests are the next construction phase (`docs/00_EXECUTIVE_SUMMARY.md`, `ROADMAP.md`). This document
specifies the test strategy the build-out must implement and is written as the target contract for
that work, using the real toolchain already configured in `package.json` (`vitest`, `@playwright/test`,
`@testing-library/react`, `jsdom`).

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

Run via `npm run test:e2e` / `npm run test:e2e:ui`. Golden flows, mapped to the personas and
sequence diagrams elsewhere in this doc set:

| # | Golden flow | Coverage status | Why |
|---|---|---|---|
| 1 | Unified onboarding (signup → profile setup → first institution connected) | **Full e2e** | The activation path every other flow depends on; regressions here block everything downstream. |
| 2 | Address-change life event (start → checklist → submit → status → inbox notification) | **Full e2e** | Maps directly to `docs/SEQUENCE_DIAGRAMS.md` §(a); the canonical demonstration of Domains D/E/F working together. |
| 3 | Family-assisted access (invite → grant scope → assistant prepares → owner approves → submit) | **Full e2e** | Maps to §(c); the prepare/submit permission boundary is exactly the kind of subtle bug e2e coverage catches that a unit test alone might miss (real form state, real navigation). |
| 4 | Post-death smooth claim processing by an institution claims officer (report → verify → match → claim → maker-checker → payout) | **Full e2e** | Maps to §(b); the highest-stakes flow in the product, covering the citizen, verification-officer, and claims-officer surfaces in one continuous test. |
| 5 | False-death correction (challenge → re-verification → registrar correction → agency acknowledgements → restoration) | **Full e2e** | Maps to §(d); a safety-critical reversal path that must never be allowed to regress silently. |
| 6 | Profile conflict detection and resolution | **Manual verification only** | Time-boxed prototype scope; the underlying rule (never auto-resolve) is unit-tested via the normalization/authority logic above, and the UI is smoke-tested manually per release rather than under full e2e, per `ASSUMPTIONS_AND_LIMITATIONS.md`. |
| 7 | Institution ops console: service-request queue triage and deficiency requests | **Manual verification only** | Same reasoning — unit-tested at the logic layer (eligibility, status normalization), manually smoke-tested at the UI layer given the time-boxed scope. |
| 8 | Grievance and appeal escalation | **Manual verification only** | Lower-frequency flow for the demo's purposes; covered by manual smoke testing and by the `Escalation`/`Appeal` unit tests around status transitions rather than a dedicated e2e spec. |

**Why the split**: this is a time-boxed portfolio prototype (see `ASSUMPTIONS_AND_LIMITATIONS.md`),
not a production program with an open-ended QA budget. The five flows with full e2e coverage are
chosen because they are (a) the flows this documentation set's sequence diagrams describe in detail,
(b) the flows most central to the product's core promise and safety guarantees, and (c) the flows
most likely to have subtle multi-actor, multi-step regressions that only a real browser session
would catch. The remaining flows are lower-frequency, lower-risk, or sufficiently covered by
unit-level logic tests plus manual release-checklist verification that full e2e investment would be
disproportionate to the risk it retires.

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

Each of the five fully e2e-covered golden flows includes, as part of its Playwright spec (not a
separate suite that can silently rot):

- An automated accessibility scan (e.g. axe-core integration) at each major step, asserting zero
  critical/serious violations.
- A keyboard-only pass through the flow's primary path (tab order reaches every interactive
  element; the flow can be completed without a mouse).
- A check that every icon-only control encountered has an accessible name (`docs/ACCESSIBILITY.md`).
- A check that the execution-method badge is present and has the expected accessible text wherever
  a request/action is rendered.

## 3. Gates before considering a change complete

No change is considered complete until all of the following pass locally (and in CI, once CI is
configured):

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
5. **E2E** — `npm run test:e2e`, all five golden-flow specs passing, before a change touching any of
   those flows' underlying models or Server Actions is merged.
6. **Manual smoke pass** — for changes touching flows #6–#8 (manual-verification-only flows) or any
   ops-console screen, a documented manual walkthrough against the relevant golden-flow checklist,
   recorded in the PR description, substitutes for automated e2e coverage.

A change that fails any of these gates is not complete, regardless of whether the underlying feature
"works" in an ad hoc manual check — these gates exist specifically so that a working demo today
doesn't silently regress as later domains are built on top of it.
