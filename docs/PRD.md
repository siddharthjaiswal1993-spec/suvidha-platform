# Product Requirements Document — Suvidha

> This PRD is the connective tissue between the deep-dive docs. Where a section below is a
> summary, it links to the doc that has the full detail rather than repeating it.

## Executive summary

See `docs/00_EXECUTIVE_SUMMARY.md`. In short: Suvidha is a unified citizen life-administration
platform for India — one consent-driven layer over the fragmented set of government, financial,
employment, and utility relationships a person accumulates over a lifetime, with a full estate/
bereavement/succession module (Legacy & Succession) as one domain within it, not a separate
product.

## Product vision & thesis

See `docs/PRODUCT_VISION.md` and `docs/CORRECTED_PRODUCT_THESIS.md`.

## Problem statement

See `docs/PROBLEM_STATEMENT.md`.

## Target users, personas, JTBD

See `docs/PERSONAS_AND_JTBD.md` (13 personas) and `docs/TERMINOLOGY.md` for exact role vocabulary.

## Principles

1. Institutions remain the system of record; Suvidha is the system of engagement, orchestration,
   consent, and communication (`docs/PRODUCT_VISION.md`).
2. Every downstream action discloses its execution method honestly — never implies something is
   instant when it is assisted, in-person, or approval-gated (`docs/SERVICE_REQUEST_ENGINE.md`).
3. Aadhaar/PAN are identity-resolution attributes, never universal keys (`docs/TERMINOLOGY.md` §5).
4. Death is an event with a defined verification lifecycle, not an instant account-freeze command;
   false-positive correction is mandatory (`docs/WORKFLOWS.md`, the `DeathEvent.status` machine).
5. Consent is purpose-limited, revocable, and never equated with legal authority
   (`docs/DELEGATED_ACCESS.md`, `docs/PRIVACY.md`).
6. No dark patterns; no celebratory/gamified language, especially in the Legacy & Succession domain
   (`docs/CONTENT_GUIDELINES.md`).
7. Minimise disclosure; reveal information progressively by verified role, purpose, and authority
   (`docs/ACCESS_CONTROL_MATRIX.md`).

## Scope

**In scope for this prototype** (see `docs/ASSUMPTIONS_AND_LIMITATIONS.md` for the full, honest
list): master profile with discrepancy detection; an institutional relationship graph across 13
institutions (government identity, tax, licensing, 2 banks, an insurer, an investment provider, a
depository, EPFO, a property registry, an employer, a utility); a document hub with renewal
tracking; a unified service-request engine with normalized + raw status; a life-event orchestrator
fully worked for "address change"; a unified inbox with a tax notice example; consent scopes and
data-share logging; family-assisted delegated access; the full Legacy & Succession domain (estate
planning, Trusted Contacts, death-event lifecycle, claims, authority-pathway engine, maker-checker,
false-death correction) across three seeded estates.

**Out of scope for this prototype:** live LLM-backed AI assistant (see `docs/AI_ASSISTANT.md`);
real external API integrations of any kind (see `docs/INTEGRATIONS.md` — every connector is either
labeled and mocked, or explicitly marked a future policy dependency); a production-grade auth
system (real credentials, MFA, step-up verification); every Indian institution category (a
representative slice, not an exhaustive catalogue); full Hindi translation of every string
(primary navigation and key surfaces only — see `docs/ACCESSIBILITY.md`).

## Functional requirements

Organized by domain in `docs/USER_STORIES.md` (MoSCoW-tagged). Data-level requirements in
`docs/DATA_MODEL.md`. Workflow-level requirements (Legacy & Succession) in `docs/WORKFLOWS.md`.

## Non-functional requirements

- **Accessibility:** semantic HTML, keyboard navigation, screen-reader labels, high contrast, large
  tap targets, plain language, save-and-resume, printable summaries — `docs/ACCESSIBILITY.md`.
- **Security & privacy:** masked identifiers, consent receipts, tamper-evident-by-convention audit
  log, maker-checker, threat model — `docs/SECURITY.md`, `docs/PRIVACY.md`, `docs/THREAT_MODEL.md`.
- **Internationalisation:** dictionary-based English/Hindi, extensible — `docs/ARCHITECTURE.md`.
- **Portability:** SQLite-to-Postgres migration path with no schema rewrite — `docs/ARCHITECTURE.md`.

## Integration requirements

See `docs/INTEGRATIONS.md` (per-connector real-vs-mocked labeling) and
`docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` (the underlying research, 51 official sources cited in
`docs/OFFICIAL_SOURCES.md`).

## Legal & regulatory assumptions

Every mocked integration is visibly labeled as simulated. No real government API is ever
represented as live. No mocked integration is ever presented as a real available API. See
`docs/ASSUMPTIONS_AND_LIMITATIONS.md` for the full four-tier feasibility framework and its mapping
onto `Connector.integrationLabel`.

## Risks & dependencies

See the per-phase risk tables in `docs/ROADMAP.md` and the consolidated threat list in
`docs/THREAT_MODEL.md`.

## Success metrics

See `docs/ANALYTICS_AND_METRICS.md` for the instrumentation plan and `docs/ROADMAP.md` for the
citizen/institution/platform-trust metrics families. Monetary estate value is never a primary
metric anywhere in this product.

## MVP → pilot → national scale

See `docs/ROADMAP.md`, Phases 0–5.

## Open questions

- Default sub-score/readiness weighting: one model for all citizens, or configurable by
  institution partner policy?
- Where the line sits between "assisted digital workflow" and "in-person required" for licence
  renewals that vary by state RTO digitisation level.
- Whether a future real AI assistant should be scoped to a single LLM provider or run through a
  provider-neutral gateway, given the grounding/citation requirements in `docs/AI_ASSISTANT.md`.
- How Family Administrator delegated-task permissions should interact with a future
  ProfessionalRepresentative multi-client dashboard (not modeled in this prototype).
