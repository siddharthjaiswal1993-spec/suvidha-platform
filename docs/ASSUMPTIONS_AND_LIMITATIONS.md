# Assumptions and Limitations

This document is the single place that states, plainly, what this prototype does not do, why it
was scoped that way, and what would need to change for any part of it to become a real production
system. Where a claim elsewhere in this documentation could be misread as "this works today
against real institutions," this document is the correction.

**The authoritative, structured version of this document is `src/config/capabilities.ts`** — a
per-capability registry (citizen-flow status, institution-flow status, integration status, test
coverage, and a one-line limitation) that every other doc, including this one, should trace back
to rather than restate independently. If this document and the registry ever disagree, the
registry is correct and this document is stale.

## -1. What changed in the v3 pass (capability completion)

A follow-up review found that most of the 12 tracked capabilities in `src/config/capabilities.ts`
were still `interface_prototype` — a real screen rendering real seeded data, but no working action
behind it. This pass closed that gap for every capability that could honestly be closed without
fabricating a real integration:

- **Document hub**: upload (`uploadDocument`), a detail page (`/documents/[id]`) with verification
  history and reuse history, sharing with revocation (`DocumentShare`), and deletion are all real
  writes now, not just a read-only card grid.
- **Inbox**: reply (`replyToThread`, a real citizen-authored `Message` row), escalate a thread
  straight into a tracked `Grievance` (`Grievance.sourceInboxThreadId` traces it back), and report a
  message as suspicious (`Message.reportedSuspiciousAt`) are all wired. A phishing-style seeded
  message (`senderVerified: false`, `fraudWarning: true`) exists so the fraud-warning UI treatment
  has something to demonstrate against — it previously had zero seeded cases.
- **Delegated access**: a citizen can invite a new assistant, always scoped to one of their own open
  requests (never blanket access, matching `DelegatedTask`'s own design) rather than only being able
  to approve/reject pre-seeded invitations.
- **Institutional relationships**: a citizen can connect a new institution themselves, modelled as a
  genuine two-step process (`under_verification` → citizen-confirmed `active`) instead of an instant
  unexplained "verified" badge — see `docs/INTEGRATIONS.md` for why this stays simulated.
- **Grievances**: a `/help/[id]` detail page now supports escalation (to a simulated Nodal Officer)
  and appeal (against a resolved grievance), where previously the citizen side was create-and-track
  only.
- **Master profile**: a "Check for updates" action re-confirms verified field values'
  `lastVerifiedAt` timestamps (deliberately *not* fabricating a new discrepancy, since there's no
  live connector to actually detect one), plus a new "Field history" tab shows every historical
  value per field, not just the current one and open conflicts.
- **Service request engine, generalized**: `completeServiceRequestAndReconcile` previously hardcoded
  `fieldKey: "present_address"` regardless of what service was actually being completed — a latent
  bug that only mattered once a non-address request (e.g. a nominee update) reached completion.
  `src/lib/reconciliation.ts`'s new `SERVICE_CATEGORY_FIELD_MAP` maps `serviceCategory` →
  profile-field key generically, shared between the life-event flow and the general engine, and a
  "requested change" step was added to `/requests/new` so a citizen's actual entered value (not just
  a seeded one) flows through to reconciliation. Proven end to end for a *mobile-number* change, not
  just address, by `tests-e2e/golden-flow-j-capability-completion.spec.ts`.
- **A second, pre-existing institution-attribution bug was found and fixed**: a nominee-update
  request against a Konkan Cooperative Bank fixed deposit was wired to Ashoka National Bank's
  nominee-update `ServiceDefinition` (the only one that existed) — the same class of bug fixed for
  address-change in v2, now fixed the same way (one `ServiceDefinition` per participating
  institution) and generalized in `/requests/new`'s deep-link preselection logic, which previously
  matched a service by category alone and could silently preselect the wrong institution's service.
- **A real documentation-vs-reality gap was found and closed**: `docs/TEST_PLAN.md` claimed an
  axe-core accessibility scan and a keyboard-only pass existed on every golden e2e flow. Neither
  existed anywhere in the repository. A real axe-core scan and keyboard-tab-order check were added
  to `golden-flow-a`, and the document's wording was corrected to say plainly that only one flow
  carries it, rather than re-describing the aspiration as fact.
- **`EmptyState` was documented in `docs/DESIGN_SYSTEM.md` as a component but never implemented** —
  also found and fixed; it's now a real component (`src/components/domain/empty-state.tsx`) used on
  the Documents and Family & Delegated Access pages.
- **A GitHub Actions CI workflow** (`.github/workflows/ci.yml`) now runs typecheck, lint, unit
  tests, e2e tests, and the production build on every push and pull request — previously nothing
  ran automatically.
- **Not extended this pass, and documented as such rather than left ambiguous**: maker-checker
  separation of duties was not extended to grievance resolution or death-event match decisions
  (still `ServiceRequest` and `Claim` only); the address-change life event's "new address" value is
  still fixed at seed time (the general request engine's citizen-entered value applies to requests
  created via `/requests/new`, not yet the life-event flow itself); legal-name (PAN) correction uses
  the identical reconciliation mechanism proven for mobile number but isn't separately e2e-covered.

## 0. What changed in the v2 pass (orchestration-depth review)

An initial build demonstrated breadth (nine domains, dozens of screens) with several domains as
read-only dashboards rather than complete workflows, and an institution console that was
effectively a death-claims console with a few extra pages. A follow-up review corrected the
imbalance:

- **Server-enforced authorization** (`src/lib/authz/`) replaced ad-hoc per-action checks: every
  Server Action now independently re-verifies role permission, resource ownership, institution
  tenancy, and state-machine legality — not just what the UI happens to hide. Maker and checker are
  enforced as different users at the database-decision level, not just by convention.
- **The general Service Request workflow now has a real institution side**
  (`/ops/requests`, `/ops/requests/[id]`) — previously, `ServiceRequest` (the citizen-facing
  address/mobile/nominee/etc. request object) had no institution review screen at all; only the
  Legacy & Succession `Claim` model did. `CaseAssignment`, `Decision`, and `DeficiencyRequest` are
  now shared across both `Claim` and `ServiceRequest` rather than being Claim-only.
- **The address-change life event is now genuinely wired end to end**, not a set of checkboxes:
  starting an action creates a real `ServiceRequest` with the correct execution method and the
  correct institution's `ServiceDefinition` (a real bug — every action was previously attributed to
  whichever institution's service definition happened to be seeded first — was found and fixed
  while building this). Completion reconciles the change back into `ProfileFieldValue` and
  `InstitutionRelationship.registeredAddressSnapshot`, and resolves the matching `ProfileConflict`.
- **Mobile navigation** was added for both the citizen and ops shells via a focus-trapped,
  Escape-to-close drawer (`src/components/domain/mobile-nav-drawer.tsx`, built on Radix Dialog).
  Building this surfaced a genuine React Server Components bug worth naming: an earlier version
  passed a render-prop function as `children` from a Server Component layout into the client-side
  drawer, which is not serializable across the server/client boundary and crashed every citizen and
  ops page. It's fixed via a `useMobileNavClose()` context hook instead of a function prop — a good
  example of an RSC constraint that's easy to violate without an explicit runtime error until you
  actually render the page.
- **Grievance resolution now requires a category, a note, and a citizen-notification
  acknowledgement** — it was previously a single-click status flip.
- **An explicit IDOR-hardening pass** re-audited every dynamic `[id]` page and every Server Action
  accepting a resource ID, specifically re-testing the claim from Section 4 of the review brief that
  "a citizen cannot read another citizen's request by changing a URL." This found and fixed several
  genuine gaps beyond the ones already covered by `src/lib/authz/resource-access.ts`: `/life-events/[id]`
  had no ownership check at all; `revokeConsent` and `revokeTrustedContact` (citizen Server Actions)
  let any authenticated user revoke *any* citizen's consent record or trusted contact by ID, not just
  their own; `submitReverification` didn't verify the acting citizen owned the death event being
  corrected; and the `/ops/death-events/[id]` Server Actions (`decideMatch`,
  `advanceDeathEventStatus`) had no role/permission check at all — any authenticated session, citizen
  or officer, could call them directly. All are now covered by an ownership check or
  `requireUserWithPermission`. Separately, the `maker` role was found to be missing
  `SERVICE_REQUEST_REVIEW` — makers could recommend a decision but not accept a request into review
  in the first place — a real permission-model gap only surfaced once an e2e test exercised the
  Ashoka Bank maker/checker path on a request that hadn't been pre-seeded already "in review."

## 1. Scope reductions from the full spec to the actual MVP build

The full nine-domain, thirteen-persona, eight-golden-flow specification is broad by design — it
documents the whole product thesis. The prototype that is actually built (or, as of this writing,
being built — see `00_EXECUTIVE_SUMMARY.md` for current status) is deliberately narrower. Every
reduction below is a considered scope decision, not an oversight:

| Full spec | Actual MVP build | Rationale |
|---|---|---|
| Every institution category in India | 2 banks, 1 insurer, 1 investment/mutual-fund provider, Income Tax, 1 identity service (Aadhaar/DigiLocker-style), 1 vehicle/licence service (Parivahan-style), plus the fuller Legacy & Succession institution set for claims scenarios | A small, representative set is enough to prove the orchestration and tracking mechanics without the effort of modelling every institution category India has; the graph and request engine are built to generalise, but the seeded data is intentionally bounded. |
| All life events (25+ templates modelled in `LifeEventTemplate.eventKey`) | Address change, marriage/name change, death & succession | These three cover the range from routine (address) to identity-affecting (marriage/name) to highest-stakes (death), which is enough to demonstrate the orchestration pattern across difficulty levels without building out every template. |
| All access roles | Self, Family Administrator, Trusted Contact (Legacy & Succession-specific) | These three demonstrate the permission-tier model (independent, delegated, and post-death access) without building every persona's console in full — Professional Representative and Parent/Guardian access follow the same `DelegatedTask`/`ConsentScope` mechanism and are documented but not built as separate UI in this pass. |
| Five original post-death claims scenarios | Three, condensed: prepared smooth claim, no-will legal-heir claim, false-death correction | This condensed set still covers the easy case, the hard case, and the error-correction case — the three qualitatively different paths a claim can take — while reducing build effort relative to five separate narrative scenarios. |
| All 13 personas with dedicated screens | Golden-flow coverage across the personas each flow's steps naturally touch (see `PERSONAS_AND_JTBD.md`'s "golden flows touched" per persona) | Not every persona needs a unique screen to be represented meaningfully; several (Auditor/Regulator, Grievance Officer) are demonstrated primarily through the institution ops console and audit trail rather than a dedicated citizen-facing UI. |

## 2. The four-tier feasibility framework

Every connector and integration claim in this product is classified into one of four feasibility
tiers, used consistently across this documentation:

| Tier | Meaning | Maps to `Connector.integrationLabel` in the schema |
|---|---|---|
| **Present-day feasible** | A real, documented public integration exists today and could be built against directly, or the workflow is feasible today as a manual/assisted process even without an API. | `real_public_integration_documented`, `manual_assisted_workflow` |
| **Partner-institution-required** | Technically and legally possible, but requires a specific institution's cooperation, a bespoke integration agreement, or participation in a regulated intermediary framework (e.g., Account Aggregator). | `regulated_partner_integration_required`, `institution_specific_integration_required` |
| **Policy-or-legislation-required** | Not achievable through partnership alone — requires a policy change, a new regulatory framework, or legislative action (e.g., a formal cross-institution death-notification mandate). | `future_policy_dependency` |
| **Prototype-only-simulation** | Built and demonstrated in this prototype using entirely synthetic data and logic, with no real external system involved at all. | `prototype_simulation` |

**Confirmation.** No connector, integration, or institution in this prototype is ever presented in
the UI, seed data, or documentation as a real, currently available API or live data source. Every
one is either explicitly labelled as simulated (in the `Connector.integrationLabel` field and in
any UI derived from it) or, where a real public integration genuinely exists and is documented
(present-day feasible tier), is still not actually called from this prototype — the prototype does
not make live calls to any third-party or government system.

## 3. SQLite-on-Vercel `/tmp` limitation

**The limitation.** This prototype uses SQLite (via `better-sqlite3` and Prisma's SQLite
connector) as its only datastore, for local development and for the deployed demo alike. On
Vercel, the filesystem is read-only at the deployed function's normal working directory, so the
SQLite database file is copied into `/tmp` at cold start to make it writable for the demo. This
means:

- Writes made during one serverless invocation are not guaranteed to be visible to a different
  concurrent instance, since each cold start gets its own fresh copy of the file.
- Data written during a demo session is not durable across deployments or, in general, across
  Vercel's automatic scaling of function instances — this is a demo convenience, not a persistence
  guarantee.
- This is explicitly **not** a production-grade persistence strategy and is never represented as
  one anywhere in this documentation.

**Why Postgres wasn't used directly.** The deliberate trade-off was to keep local development
completely self-contained: `npm run db:seed && npm run dev` works from a clean clone with no
external account, no connection string to obtain, and no hosted database dependency, which matters
for a portfolio prototype meant to be cloned and run by anyone. The schema was written specifically
to make the eventual move to Postgres a one-line `datasource` and driver-adapter change rather than
a schema rewrite:

- No native Prisma `enum` types are used anywhere (SQLite's Prisma connector doesn't support them);
  every status field is a plain, Zod-validated `String`, which behaves identically on Postgres.
- No native array or `Json` column types are relied on; repeatable data uses join tables, and
  flexible structured data (rule conditions, permission scopes, JSON-serialized arrays) is stored
  as a JSON-serialized `String` column with helpers in `src/lib/json.ts`, which works unchanged on
  either engine.

A real deployment of this product would migrate to Postgres (e.g., via a Vercel Postgres or
Neon-backed datasource) specifically to get durable, concurrent-safe writes; that migration is
designed for and documented, but intentionally not implemented in this prototype.

## 4. Known gaps

- **Not every institution category in India is modeled.** The MVP's institution set (Section 1
  above) is representative, not exhaustive. Categories such as GST/business registration, housing
  society records, and most utility connections are named in `PROBLEM_STATEMENT.md` and the data
  model's `Asset.category` and `InstitutionRelationship.relationshipType` enums as concepts the
  schema can represent, but are not populated with seeded institutions or dedicated flows in this
  build.
- **Hindi localization is deprioritised, not a current product focus.** `CitizenProfile.preferredLanguage`
  supports `en`/`hi`, the dictionary-based i18n architecture (see `docs/ACCESSIBILITY.md`) works and
  covers primary navigation plus a handful of key screens, and the language switcher in Settings is
  functional — but English is the primary, default, and actively maintained experience going
  forward, per explicit product direction. Treat any Hindi string as a bonus, not a coverage
  commitment.
- **The AI assistant is a planned, templated simulation, not a live LLM integration, in this
  prototype.** As of this writing, there is no AI/LLM integration code anywhere in this
  codebase — no `src/lib/ai*` module, no model API client, no prompt templates exist yet. Wherever
  this documentation or the product design describes an "AI assistant" (plain-language notice
  summaries, suggested next actions, plain-language conflict explanations), that capability is
  planned as a rule-based/templated simulation for demonstration purposes: deterministic,
  pattern-matched summaries and suggestions generated from structured data already in the schema
  (e.g., `Message.plainLanguageSummary`, `Message.suggestedNextAction`), not a live generative model
  call. If a live LLM integration is added in a future pass, this document must be updated to
  reflect that change explicitly rather than left to imply it retroactively. Regardless of
  implementation, the product principle holds without exception: **an AI-generated response is
  never an official decision** — only institutions and their officers approve or reject requests.
- **The audit and consent model is designed, not load-tested.** `AuditEvent` is documented as
  append-only "from the application layer," but SQLite itself cannot enforce immutability — this is
  an application-layer discipline, not a database-enforced guarantee, and has not been tested under
  concurrent write load.
- **No real identity verification occurs anywhere.** `IdentityRecord.method` values like
  `digilocker_simulated` and `video_kyc_simulated` are explicit about being simulations; no real
  DigiLocker, video-KYC, or government verification call is made or planned to be made within this
  prototype.

## 5. Legal disclaimer

This product, including its Legacy, Incapacity, Bereavement & Succession domain, is a design and
engineering demonstration. Nothing in this repository, its documentation, or any deployed instance
of it constitutes legal advice, tax advice, or financial advice. Statements about succession
pathways, claim eligibility, nomination effect, or document requirements reflect a simplified,
illustrative model of Indian institutional and legal processes for product-design purposes, and
must not be relied upon for an actual legal, tax, or inheritance decision. Final determinations of
legal heirship, succession, tax liability, or claim entitlement always require review by, and
authority vested in, the relevant human institution officer, government authority, or court — this
product tracks and organises that process, and at no point in its design does it substitute for
it. Anyone facing a real succession, bereavement, tax, or legal-authority situation should consult
a qualified professional (a lawyer, Chartered Accountant, or the relevant institution directly)
rather than treat any output of this prototype as authoritative.
