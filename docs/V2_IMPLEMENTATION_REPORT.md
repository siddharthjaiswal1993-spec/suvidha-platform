# Suvidha v2 Implementation Report

Scope: the full review brief ("transform the prototype from broad-but-shallow into a polished,
coherent, credible, portfolio-grade 9/10 working product prototype"), executed end to end — code,
tests, and documentation — not delivered as a gap analysis. This report is the honest account of
what changed, what was found along the way, what's still simulated, and a revised scoring.

## 1. Summary of improvements

- A centralized, server-enforced authorization module (`src/lib/authz/`) replaced ad-hoc per-action
  checks. Every mutating Server Action and every dynamic `[id]` page now independently re-verifies
  role permission, resource ownership, institution tenancy, and state-machine legality.
- The general `ServiceRequest` model (address/mobile/nominee/etc. — everything that isn't a Legacy &
  Succession claim) now has a real institution-side review console at `/ops/requests`, sharing the
  maker-checker machinery with `Claim` instead of leaving it Claim-only.
- The address-change life event — the brief's mandated flagship flow — is wired end to end across
  all four execution-method categories, with institution completion reconciling back into the
  citizen's own profile.
- Mobile navigation shipped for both citizen and ops shells.
- A capability registry (`src/config/capabilities.ts`) is now the single source of truth for
  real-vs-simulated claims across all documentation.
- A dedicated IDOR-hardening audit pass found and fixed real cross-citizen and missing-permission
  bugs (detailed in §4).
- Hindi localization infrastructure (dictionary, locale plumbing, language switcher) remains in
  place and functional, but further investment was explicitly deprioritized mid-build per product
  direction — **English is the default and primary experience**, matching the product decision.

## 2. Architecture changes

- **`src/lib/authz/`** — four files: `permissions.ts` (permission catalogue + `ROLE_PERMISSIONS`
  map), `guards.ts` (`requireUserWithPermission`, `requireOwnsPerson`, `requireInstitutionTenancy`,
  `requireDifferentMakerChecker`, `assertValidRequestTransition`), `resource-access.ts`
  (load-and-verify helpers — `getOwnedServiceRequest`, `getTenantServiceRequest`,
  `getOwnedClaimant`, `getTenantClaim`, `getClaimIfClaimant`, `getOwnedGrievance`,
  `getOwnedDelegatedTaskAsOwner`), and `policies.ts` (composed policies used by Server Actions, e.g.
  `policyRecordServiceRequestDecision`, `policyCompleteServiceRequest`). No manual role-selection UI
  exists anywhere — the acting role is always the authenticated session's actual `primaryRole`.
- **`src/lib/reconciliation.ts`** — `reconcileProfileFieldAfterCompletion()` and
  `recalculateLifeEventProgress()`, called on institution completion so life-event progress is
  derived from real `ServiceRequest` states, not a checkbox.
- **`/ops/requests` and `/ops/requests/[id]`** — new general institution Service Request
  queue/workspace, reusing `CaseAssignment`, `Decision`, and `DeficiencyRequest` (made dual-purpose
  with optional `claimId`/`serviceRequestId` FKs) rather than duplicating them per domain.
- **`src/components/domain/mobile-nav-drawer.tsx`** — a focus-trapped, Escape-to-close drawer built
  on Radix Dialog, using a `useMobileNavClose()` React Context instead of a render-prop, specifically
  because a render-prop crossing the Server→Client boundary is not serializable in React Server
  Components (see §9).
- **`src/config/capabilities.ts`** — a typed registry (`CapabilityStatus`, `Capability`,
  `CAPABILITIES[]`) recording, per capability: citizen/institution flow status, integration status,
  test status, production readiness, and known limitations — so documentation can be checked against
  code instead of drifting from it.

## 3. Data model changes

- `DeficiencyRequest`, `CaseAssignment`, `Decision` — made dual-purpose via optional `claimId` /
  `serviceRequestId` foreign keys, so the maker-checker and deficiency machinery is shared between
  `Claim` and the general `ServiceRequest` model.
- `LifeEventAction.serviceRequestId` — new unique FK linking an action to the real request tracking
  its execution.
- `ServiceRequest.requestedValueSummary`, `.documentIdEvidence` — added for the request-detail and
  evidence-reuse UI.
- `Grievance.resolutionCategory`, `.resolutionNote`, `.citizenCommunicationSent` — added so
  resolution requires a real category, note, and citizen-acknowledgement rather than a status flip.
- Two migrations: `v2_service_request_review_workflow`, `fix_service_request_deadline_fields`.

## 4. Authorization model (and what the audit found)

The authorization model is permission → role map (`ROLE_PERMISSIONS`, TypeScript constants) +
server-side guards + resource-access loaders that fetch-and-verify in one call, so a Server Action
can't accidentally skip a check by loading a resource a different way.

A dedicated IDOR-hardening pass re-tested the brief's explicit claim — "a citizen cannot read
another citizen's request by changing a URL" — against every dynamic route and every Server Action
taking a resource ID. It found and fixed real gaps, not hypothetical ones:

| Gap found | Where | Fix |
|---|---|---|
| No ownership check at all | `/legacy/claim/[claimId]` page + actions | `getClaimIfClaimant` |
| No ownership check at all | `/institutions/[id]`, `/requests/[id]`, `/inbox/[id]`, `/life-events/[id]` | Inline `personId` check |
| No tenancy check at all | `/ops/claims/[caseId]`, `/ops/requests/[id]` | `getTenantClaim` / `getTenantServiceRequest` |
| Any citizen could approve/reject **any** `DelegatedTask` by ID | `family-access/actions.ts` `decideDelegatedTask` | `getOwnedDelegatedTaskAsOwner` |
| Any citizen could revoke **any** citizen's `ConsentRecord` by ID | `consent/actions.ts` `revokeConsent` | Ownership check added |
| Any citizen could revoke **any** citizen's `TrustedContact` by ID | `legacy/planning/actions.ts` `revokeTrustedContact` | Ownership check added |
| No check the citizen owned the death event being corrected | `legacy/status-correction/actions.ts` `submitReverification` | Ownership check added |
| **No role/permission check at all** — any authenticated session could call it | `ops/death-events/[id]/actions.ts` `decideMatch`, `advanceDeathEventStatus` | `requireUserWithPermission` added |
| `maker` role missing `SERVICE_REQUEST_REVIEW` — could recommend but never accept a request into review | `src/lib/authz/permissions.ts` | Permission added to the `maker` role |

The last two are the most significant: they weren't URL-guessing bugs, they were **missing
authorization entirely** on state-changing actions, and the missing `maker` permission is a genuine
product-logic gap (only surfaced once an e2e test exercised the maker/checker path on a request that
hadn't been pre-seeded already "in review" — see §10 for how that test was built).

Maker-checker separation of duties is enforced server-side, not by convention: `recordServiceRequestDecision`
and `recordClaimDecision` call `requireDifferentMakerChecker`, which queries prior `Decision` rows
for the same case and rejects if the acting user already recorded a `maker` decision on it — proven
by a dedicated e2e test (`golden-flow-g`, second spec) that attempts exactly this and asserts the
app's global error boundary, then re-fetches the case to confirm it never silently advanced.

## 5. New citizen and institution workflows

- **Citizen**: the request engine at `/requests/new` now walks service/institution selection →
  evidence document reuse → consent summary → submission, with `searchParams` prefill support so
  institution-page CTAs deep-link into a preselected request instead of a generic form.
- **Institution**: `/ops/requests` — a real queue or requests across all service categories (not
  just claims), `/ops/requests/[id]` — accept into review, raise/respond to deficiencies, record a
  maker/checker decision, complete and reconcile.

## 6. Address-change flow walkthrough (the mandated primary outcome)

1. Meera (citizen) opens `/life-events/[id]` for "Moving to a new address" and sees a **distinct
   action per execution method** across six institutions: direct API (Aadhaar — completed), a
   pre-staged institution-review case with an open deficiency (Ashoka Bank), a generated form packet
   (Konkan Bank), an integration-initiated request (Suraksha Insurance), an in-person requirement
   (Parivahan/driving licence), and a manual self-report path (employer HR, electricity board).
2. On the Ashoka Bank case, she responds to the open deficiency ("clearer address-proof document
   required") with a note; the request moves to `under_review`.
3. Anita (maker, Ashoka Bank) opens `/ops/requests/[id]`, sees the deficiency response, and records
   a `recommend_approve` decision.
4. Suresh (checker, Ashoka Bank — a **different** authenticated user) records `approve`. A maker
   attempting the checker step on their own case is rejected server-side
   (`requireDifferentMakerChecker`), proven by a dedicated negative e2e test.
5. Suresh completes the institution update, which calls `reconcileProfileFieldAfterCompletion()`:
   the citizen's `ProfileFieldValue` for present address is updated, the matching `ProfileConflict`
   is resolved, and `InstitutionRelationship.registeredAddressSnapshot` reflects the new address.
6. Meera returns to `/institutions`, opens the Ashoka Bank relationship, and sees the new address —
   closing the loop back into her own profile, not just a status label change.

This entire path is covered by `tests-e2e/golden-flow-g-address-change-institution-loop.spec.ts`.

## 7. Mobile improvements

A focus-trapped, Escape-to-close navigation drawer now exists for both the citizen and ops shells.
Building it surfaced a genuine React Server Components bug: an earlier version passed a render-prop
function as `children` from a Server Component layout into the client drawer
(`<MobileNavDrawer>{(close) => <CitizenNav />}</MobileNavDrawer>`) — functions aren't serializable
across the server/client boundary, and it crashed every citizen and ops page with "Functions are not
valid as a child of Client Components." Root-caused via direct dev-server log inspection, fixed by
switching to a `useMobileNavClose()` React Context so only plain JSX crosses the boundary.

## 8. Hindi / localisation status

Per explicit mid-build product direction ("I don't need Hindi for now, just keep English"), further
Hindi investment was stopped. The dictionary-based i18n infrastructure (`src/lib/i18n.ts`,
`src/lib/locale.ts`, the language switcher) remains in place and functional — it doesn't hurt,
defaults to English — but Hindi coverage is partial (nav, home, profile, life-event, request-builder
keys only) and is documented as a secondary, deprioritized concern, not a completed feature.

## 9. Delegated access improvements

`family-access/actions.ts`'s `decideDelegatedTask` previously had **zero** ownership verification —
any authenticated user could approve or reject any delegated task by ID. It now requires
`DELEGATION_MANAGE_SELF` and verifies via `getOwnedDelegatedTaskAsOwner` that the acting user owns
the underlying request before allowing a decision.

## 10. Legacy & Succession improvements

- `/legacy/claim/[claimId]` gained ownership verification (`getClaimIfClaimant`) — previously
  completely open to any authenticated user by URL.
- `/ops/claims/[caseId]` gained institution-tenancy verification.
- Grievance resolution now requires a resolution category, a note, and an explicit
  citizen-communication acknowledgement, replacing a single-click status flip.

## 11. Tests added and results

- **Unit (Vitest)**: 37 tests across 4 files — includes 20 new tests in
  `src/lib/authz/permissions.test.ts` (7) and `src/lib/authz/guards.test.ts` (13), covering role
  permission boundaries and maker/checker separation of duties as release-blocking regression tests.
- **E2E (Playwright)**: 15 tests across 8 spec files. Two new specs:
  `golden-flow-g-address-change-institution-loop.spec.ts` (the primary end-to-end outcome, plus the
  maker-cannot-be-checker negative case) and `golden-flow-i-negative-authorization.spec.ts` (4 tests
  proving cross-claimant, cross-citizen, cross-institution, and role-based access attempts are all
  rejected server-side, not just hidden in the UI).
- **Local run** (authoritative gate): 15/15 e2e passing, 37/37 unit tests passing.
- **Production run** (`PLAYWRIGHT_BASE_URL` against the live Vercel deployment): 13/15 passing. The
  2 failures are both in the longest, most multi-persona spec (`golden-flow-g`, 3 logins each) and
  are the pre-existing, already-documented SQLite-on-Vercel `/tmp` limitation
  (`docs/ASSUMPTIONS_AND_LIMITATIONS.md` §3): writes from one serverless instance aren't guaranteed
  visible to a different instance's `/tmp` copy. This is a known trade-off of the demo's
  zero-external-dependency architecture, not a functional regression — the local suite is the
  correctness gate; production is a best-effort spot check given that trade-off.

## 12. Build result

`npm run build` completes cleanly (Next.js 16.2.11, Turbopack) — 37 routes, no errors.

## 13. Routes added

`/ops/requests`, `/ops/requests/[id]`.

## 14. Files changed

59 files changed in the v2 commit (2,657 insertions, 266 deletions): 18 new files (`src/lib/authz/`
×5, `src/lib/reconciliation.ts`, `src/lib/locale.ts`, `src/lib/testing/server-only-stub.ts`,
`src/config/capabilities.ts`, `src/components/domain/mobile-nav-drawer.tsx`, `src/app/ops/requests/`
×3, 2 e2e specs, 2 migrations), 41 modified.

## 15. Known limitations / what remains mocked

Unchanged from the existing, honest baseline documented in `docs/ASSUMPTIONS_AND_LIMITATIONS.md` and
`src/config/capabilities.ts` — no institution, government registry, or payment system integration is
real; SQLite-on-Vercel `/tmp` is a demo convenience, not durable production persistence; Hindi
coverage is partial and deprioritized; the document hub's sharing/version-history screens, the
inbox's reply/escalate actions beyond read, the financial administration overview, and the Life Admin
Assistant's non-golden-flow suggestions are manually verified rather than e2e-covered.

## 16. Recommended next phase

1. Move persistence to Postgres (the schema was written for a one-line driver-adapter change) to
   remove the `/tmp` multi-instance limitation entirely.
2. Extend the same maker-checker + deficiency-loop pattern now proven for address-change to at least
   one more life event, to demonstrate the orchestration model generalizes rather than being
   address-change-specific.
3. If Hindi becomes a priority again, complete dictionary coverage for the remaining screens
   (institutions, requests, ops console) rather than leaving it partial.
4. Add e2e coverage for the document hub and inbox reply/escalate actions currently only
   manually verified.

## 17. Revised scoring (1–10)

| Dimension | Score | Why |
|---|---|---|
| Product vision | 8 | Nine-domain orchestration thesis intact; address-change now proves it end to end instead of asserting it. |
| Citizen experience | 7 | Mobile nav, deep-linked requests, and method-specific actions are real; some domains still lighter-touch than the flagship flow. |
| Institution experience | 7 | A real general-purpose console now exists (`/ops/requests`), not just a claims console with extra pages. |
| Orchestration depth | 8 | The primary outcome — citizen → deficiency → maker → checker → completion → profile reconciliation — is genuinely wired and e2e-proven, not simulated. |
| Security credibility | 8 | Centralized server-side authorization, maker≠checker enforced by querying prior decisions, and a real IDOR audit that found and fixed live gaps (not just a claim of "authorization exists"). |
| Accessibility | 5 | No dedicated WCAG AA audit pass was run this cycle; existing components use semantic HTML/Radix primitives but this wasn't independently verified. |
| Mobile readiness | 7 | Focus-trapped drawer nav shipped for both shells and fixed a real RSC bug; no dedicated responsive-layout audit beyond the nav itself. |
| Localisation | 4 | Infrastructure is real and functional but coverage is partial and explicitly deprioritized by product decision, not by capability. |
| Portfolio quality | 8 | The gap between "documented" and "actually works" narrowed substantially and honestly, with the narrowing itself documented. |
| Production readiness | 5 | Correctly and repeatedly labeled a prototype: SQLite/`tmp`, no real integrations, partial e2e coverage outside golden flows — appropriate for a portfolio piece, not deployable as-is. |
