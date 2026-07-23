# Roadmap

This roadmap sequences Suvidha from a self-contained prototype toward a version that could, in
principle, be piloted with real institutions. It is written as an honest planning document, not a
committed delivery schedule — legal, partnership, and policy dependencies in Phases 3 onward are
outside what any product or engineering team can unilaterally deliver, and are called out as such.

## Success-metrics framework

Three metric families are tracked from Phase 1 onward. **Monetary estate value is never the
primary success metric anywhere in this framework** — Suvidha measures organisation, completion,
and trust, not the size of what a citizen holds.

### Citizen value metrics
- Institutional relationships organised (count of relationships linked and kept current)
- Discrepancies identified and resolved (profile conflicts surfaced vs. resolved)
- Requests completed (service requests reaching a terminal completed status)
- Time saved (estimated vs. baseline manual process time per request type)
- Document-reuse count (verified documents reused across institutions instead of resubmitted)
- Deadlines met on time (renewals and response deadlines met vs. missed)
- Nomination coverage (share of asset-holding relationships with a current, non-stale nomination)
- Life-event completion rate (life events reaching 100% of mandatory actions completed)
- Branch visits avoided (in-person-required actions successfully narrowed or prepared in advance)
- Grievance resolution rate (grievances resolved within target timeframe)

### Institution value metrics
- Digital completion rate (requests completed without a manual/in-person fallback)
- Incomplete-application reduction (rework cycles avoided vs. baseline)
- Document duplication reduction (resubmission requests avoided via reuse)
- Status-enquiry reduction (contact-centre/branch status queries avoided)
- Processing time (median time from submission to resolution, by service type)
- SLA adherence (share of requests resolved within the institution's published SLA)
- Fraud detection (fraud signals correctly identified vs. missed, false-positive rate)
- Maker-checker turnaround (median time from maker recommendation to checker decision)

### Platform trust metrics
- Consent revocation success (share of revocations that provably stop access immediately)
- Unauthorised-access attempts blocked
- False record-match rate (death-event or identity matches later found incorrect)
- AI factual-error rate (rate of incorrect AI-generated summaries/suggestions, once the AI
  assistant is implemented — see `ASSUMPTIONS_AND_LIMITATIONS.md`)
- Source-citation coverage (share of AI-generated statements traceable to a specific source)
- Security incidents (count and severity)
- Accessibility completion rate (task completion rate for users with declared accessibility needs)

---

## Phase 0 — Research & policy validation

**Goal.** Establish whether, and under what legal and partnership conditions, each domain is
actually buildable beyond prototype simulation.

**Features.** None shipped — this phase is research, legal review, and institution conversations.

**Dependencies.** None (this is the starting phase).

**Legal/regulatory approvals needed.** Data-protection counsel review (DPDP Act, 2023 and sector
regulations from RBI/SEBI/IRDAI/PFRDA as applicable); assessment of what a citizen-consented data
share actually requires versus what would need an Account Aggregator-style regulated framework.

**Partners.** None yet — exploratory conversations only.

**Risks.** Underestimating how much of the "unified" thesis depends on regulatory frameworks
(Account Aggregator, DigiLocker APIs, death-registration data-sharing rules) that are outside the
product's control to accelerate.

**KPIs.** Not applicable — this phase produces findings, not usage metrics.

**Exit criteria.** A documented, domain-by-domain feasibility classification (see the four-tier
framework in `ASSUMPTIONS_AND_LIMITATIONS.md`) that the rest of the roadmap can be sequenced
against.

---

## Phase 1 — Citizen master profile & document hub (no live discovery)

**Goal.** Prove the core "one place, self-declared" value proposition without depending on any
external integration.

**Features.** Master profile (Domain A) with manually entered profile fields and conflict
detection between self-declared values; document & evidence hub (Domain C) with manual upload,
expiry tracking, and category tagging; mock cookie-based demo auth with role switching.

**Dependencies.** None beyond the existing Prisma schema and Next.js scaffold.

**Legal/regulatory approvals needed.** None — no real citizen data is processed; all data is
self-declared and synthetic in the prototype.

**Partners.** None.

**Risks.** Building a "unified" experience that looks unified only because there is no live data
to disagree with yet — mitigated by seeding deliberately conflicting synthetic source values.

**KPIs.** Profile completeness rate; conflicts correctly detected in seeded scenarios; document
expiry reminders correctly generated.

**Exit criteria.** A citizen can build a complete profile and document set manually, see any
seeded conflicts surfaced (never auto-resolved), and receive expiry reminders — end to end, in the
UI, backed by the existing data model.

---

## Phase 2 — Institution pilot (2 banks + 1 insurer + 1 investment provider)

**Goal.** Prove the institutional-relationship graph and service-request tracker against a
realistic, bounded set of institution types.

**Features.** Institutional relationship graph (Domain B) for the four pilot institution types;
service catalogue and unified request engine (Domain D) for their published services (address
update, mobile update, nomination update); institution ops console (maker-checker, deficiency
management) for these four institutions.

**Dependencies.** Phase 1's master profile and document hub (a service request needs a profile and
documents to draw from).

**Legal/regulatory approvals needed.** None for the prototype (institutions are simulated); a real
pilot would require each participating institution's own data-sharing and integration approval, and
likely a sandbox/testing agreement.

**Partners.** None in the prototype; a real pilot would need at minimum one willing bank, one
insurer, and one investment platform under a pilot agreement.

**Risks.** Each real institution's actual system integration effort is likely to be non-trivial and
inconsistent in shape across institutions — the prototype's uniform `Connector` abstraction is a
simplification that a real integration would need to validate institution by institution.

**KPIs.** Service requests completed per institution type; digital completion rate; document
duplication reduction (reuse across the four institutions).

**Exit criteria.** A citizen can raise an address-update, mobile-update, and nomination-update
request against each of the four pilot institution types, see it processed through the ops
console's maker-checker flow, and track normalised status alongside the institution's raw status.

---

## Phase 3 — Consent-based discovery & life-event orchestration

**Goal.** Move from manually entered relationships to consent-based, semi-automated discovery, and
prove multi-institution life-event orchestration for common, non-bereavement events.

**Features.** Consent, access & representation (Domain H) — consent scopes, data shares, delegated
tasks for Family Administrators and Professional Representatives; life-event orchestration (Domain
F) for address change, mobile-number change, and nomination readiness across the pilot
institutions; unified communication centre (Domain E) for notices and reminders tied to these
events.

**Dependencies.** Phase 2's institutional relationship graph and service-request engine.

**Legal/regulatory approvals needed.** A real "consent-based discovery" mechanism able to resolve a
citizen's identity across institutions typically implies an Account Aggregator-style regulated
framework, or bespoke bilateral data-sharing agreements per institution — both require regulatory
and/or partner sign-off well beyond what a product team can decide alone.

**Partners.** The Phase 2 pilot institutions, plus (for a real deployment) an Account
Aggregator-licensed intermediary or equivalent regulated data-sharing mechanism.

**Risks.** This is the phase most exposed to policy dependency — see the four-tier feasibility
framework in `ASSUMPTIONS_AND_LIMITATIONS.md`. The prototype demonstrates the citizen-facing
experience with simulated consent flows regardless of whether the underlying regulated mechanism
exists yet.

**KPIs.** Life-event completion rate; consent revocation success; delegated-task completion rate;
time saved per life event vs. baseline manual process.

**Exit criteria.** A citizen can complete the address-change, mobile-number-change, and
nomination-readiness golden flows end to end, including at least one delegated task performed by a
Family Administrator under an explicit permission tier, with a durable consent/data-share audit
trail.

---

## Phase 4 — Government death-notification network & full Legacy & Succession domain

**Goal.** Extend orchestration to the platform's highest-stakes life event, activating Domain I in
full alongside the rest of the platform.

**Features.** Full death-event lifecycle (reported through matched, disputed, corrected); estate
and claims processing across every asset category already modelled; trusted-contact access;
authority-credential handling (succession certificates, probate, legal-heir certificates); the full
post-death succession golden flow (prepared smooth claim, no-will legal-heir claim, false-death
correction).

**Dependencies.** Phases 1–3 (the identity graph, institutional relationships, document hub,
consent model, and communication centre this domain reuses rather than duplicates).

**Legal/regulatory approvals needed.** A real government death-notification network requires formal
data-sharing agreements with civil registration authorities (State Registrars of Births and
Deaths) and, for cross-institution deceased-status propagation, sector regulator cooperation
(RBI/IRDAI/SEBI/PFRDA) — a legislative or policy-level dependency, not a partnership a single
product team can secure unilaterally.

**Partners.** Civil registration authorities; the Phase 2 pilot institutions extended to handle
claims rather than only living-citizen service requests; ideally a broader set of banks, insurers,
and depositories to make the claims scenarios representative.

**Risks.** False-positive death matches carry real harm (a living person's accounts frozen in
error) — the false-death correction scenario exists specifically to demonstrate that this risk is
designed for, not assumed away. Fraud risk (competing claimants, forged documents) is highest in
this domain.

**KPIs.** False record-match rate; claim settlement time vs. institution SLA; fraud signals
correctly resolved; false-death corrections resolved within target time.

**Exit criteria.** All three post-death succession sub-scenarios (prepared smooth claim, no-will
legal-heir claim, false-death correction) run end to end against the pilot institution set, with
full maker-checker, audit, and fraud-signal handling exercised.

---

## Phase 5 — Broader ecosystem expansion

**Goal.** Extend coverage beyond the pilot institution set and the core life events into the
remaining institution categories and jurisdictional complexity of a full national rollout.

**Features.** Property mutation and land-records integration; employer-benefits and gratuity
coordination; pension body integration (EPFO/NPS/government pension) beyond the pilot; unclaimed
and dormant asset discovery (IEPF-style); court-linked process tracking (probate, succession
disputes) beyond status tracking into structured case support; state-level and multi-jurisdiction
expansion of the government death-notification network.

**Dependencies.** Phase 4's full Legacy & Succession domain and government notification network.

**Legal/regulatory approvals needed.** Extensive — each new institution category and each new
state jurisdiction plausibly requires its own data-sharing framework, regulatory sign-off, or
legislative change. This phase is explicitly the platform's long-horizon, policy-dependent frontier
rather than a near-term engineering plan.

**Partners.** A materially larger set of banks, insurers, depositories, pension bodies, land-records
authorities, and employer benefit administrators than any earlier phase.

**Risks.** Scope and jurisdictional complexity growth outpacing what a single product/engineering
team can validate; the greatest risk of over-promising automated "everywhere" coverage that the
execution-method labelling (see `PRODUCT_VISION.md`) exists specifically to guard against.

**KPIs.** Institution categories covered vs. India's full institutional landscape; state
jurisdictions covered; all citizen/institution/trust metrics tracked at national scale.

**Exit criteria.** Not defined at prototype-design time — this phase's exit criteria depend on
policy and partnership outcomes outside this document's control, and would be re-scoped once
Phase 4 is complete and real-world partner and regulatory conversations have occurred.
