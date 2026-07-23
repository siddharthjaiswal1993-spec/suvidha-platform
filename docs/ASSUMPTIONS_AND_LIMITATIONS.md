# Assumptions and Limitations

This document is the single place that states, plainly, what this prototype does not do, why it
was scoped that way, and what would need to change for any part of it to become a real production
system. Where a claim elsewhere in this documentation could be misread as "this works today
against real institutions," this document is the correction.

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
- **Hindi localization covers key surfaces, not every string.** `CitizenProfile.preferredLanguage`
  supports `en`/`hi`, and the i18n architecture (see `docs/ACCESSIBILITY.md`) is designed to
  localise the golden-flow screens a citizen actually uses. It does not claim complete Hindi
  coverage of every administrative or institution-console string in the prototype.
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
