# Product Vision

## 1. The problem, restated

Every citizen accumulates institutional relationships over a lifetime — a government identity, a
licence, a bank account, an insurance policy, an employer, a utility connection — and every one of
those relationships is held, updated, and reasoned about entirely separately by the institution
that owns it. There is no single place where a citizen can see all of these relationships at once,
notice when they've drifted out of sync with each other, or track a request across more than one
of them at a time. See `PROBLEM_STATEMENT.md` for the full breakdown of who is affected and how.

## 2. The corrected thesis

> **Update your life once, understand everywhere it matters, complete every required institutional
> action, and track the entire journey from one place.**

This is deliberately not a promise that any single request instantly and automatically rewrites
every downstream record. It is a promise about **visibility, orchestration, and traceability**:
the citizen updates their own master profile once; Suvidha shows them everywhere that update
matters (which institutions hold a now-outdated value); it helps them complete whatever action
each institution actually requires, however that institution actually requires it; and it tracks
every one of those actions through to completion in one unified view. See
`CORRECTED_PRODUCT_THESIS.md` for the full pivot rationale from the platform's original, narrower
framing.

The architectural principle underneath the thesis: **one citizen-controlled command centre,
multiple authoritative systems of record.** The bank remains the system of record for the bank
account. The government registry remains the system of record for the government record. Suvidha
is never a system of record for anything an institution or government body owns — it is the
system of engagement: consent, delegation, communication, document reuse, request tracking, and
life-event coordination layered over those systems, controlled at all times by the citizen it
belongs to.

Because "update everywhere" cannot legally or technically mean "one click changes every database,"
every downstream action Suvidha helps initiate carries an explicit **execution method** label so
the citizen always knows what kind of action they are actually taking:

| # | Execution method | What it means for the citizen |
|---|---|---|
| 1 | Executable via API | An authorised, real-time integration completes the action directly. |
| 2 | Initiable via integration | A supported integration starts the action; the institution still processes and confirms it. |
| 3 | Deep-link redirect | The citizen is sent to the institution's own portal with context prefilled — the institution's system remains the site of action. |
| 4 | Generated form/document packet | Suvidha assembles the correct form and supporting documents; the citizen still files it themselves. |
| 5 | Assisted digital workflow | A guided, step-by-step flow inside Suvidha prepares everything short of the institution's own final action. |
| 6 | In-person required | The action can only be completed at a branch, office, or counter; Suvidha prepares the visit. |
| 7 | Requires institution/government approval | The institution or authority must review and decide; Suvidha tracks the decision. |
| 8 | Requires legal/regulatory intervention | Only a court, regulator, or legal process can resolve this; Suvidha tracks status, it cannot resolve it. |
| 9 | Unsupported | Not yet modelled in this product; shown honestly rather than hidden. |

## 3. Eight ways to describe Suvidha

The same product reads differently depending on which lens is applied. All eight are accurate
descriptions of the same underlying system, not eight different products:

1. **Citizen Life Administration OS** — the operating layer for the paperwork and record-keeping
   side of an adult life: identity, documents, renewals, and requests, organised in one place.
2. **Personal Institutional Relationship Manager** — a CRM, but for the citizen's own relationships
   with the institutions that hold their records, not the other way around.
3. **Unified Service Request & Case Tracking Platform** — every application, correction, renewal,
   or grievance a citizen has open with any institution, tracked with one consistent status model.
4. **Life-Event Orchestration Network** — a structured plan of institutional actions generated the
   moment a citizen reports a real-world event (a move, a marriage, a death), sequenced and tracked
   until every mandatory action is complete.
5. **Consent & Delegated Authority Manager** — a durable, revocable, purpose-limited record of who
   may see or act on what, for family members and professional representatives alike.
6. **Verified Records & Documentation Layer** — a document hub that tracks provenance, expiry, and
   reuse eligibility for every proof a citizen has already supplied somewhere, so it doesn't have to
   be supplied again from scratch.
7. **Citizen-to-Institution Communication Hub** — a single inbox for every notice, reminder, and
   status update from every institution, with plain-language summaries and fraud-warning flags.
8. **Legacy & Succession Readiness Platform** — the full estate-planning, bereavement, and
   inheritance-claims domain (Domain I), built to the same depth as if it were a standalone
   product, because it is the highest-stakes life event the platform coordinates.

## 4. The nine product domains (A–I)

| Domain | Name | What it covers |
|---|---|---|
| A | My Identity & Master Profile | The citizen's own canonical profile — name, address, contact details, family relationships — with every reported value's source, and every detected disagreement between sources surfaced as a conflict the citizen resolves, never one the platform silently overwrites. |
| B | My Institutions & Accounts | The institutional relationship graph: every government identity record, licence, financial account, employer relationship, utility connection, and business registration the citizen has linked, each with its own status, renewal date, and registered details as last synced. |
| C | Document & Evidence Hub | Every document the citizen has supplied to any institution or uploaded for their own records, with issuer, expiry, verification status, and a reuse policy so a verified document doesn't have to be resubmitted from scratch to a second institution. |
| D | Unified Request & Case Management | Every service request — a new application, a correction, a renewal, a closure — represented as one object with a normalised status shown alongside, never instead of, the institution's own raw status. |
| E | Unified Communication & Notification Centre | One inbox for every notice, reminder, and update from every institution, with plain-language summaries, suggested next actions, and explicit fraud warnings. |
| F | Life-Event Orchestration | A structured plan of institutional actions generated for a defined life event (address change, marriage, job change, bereavement, and others), each action sequenced, prioritised, and labelled with its execution method. |
| G | Financial & Compliance Administration | Tax notices, filings, nominations, and other compliance-adjacent administrative work that spans the financial institutions in Domain B. |
| H | Consent, Access & Representation | The permission layer: purpose-limited consent grants, a durable log of what was actually shared under each grant, and delegated tasks for Family Administrators and Professional Representatives — never treated as legal authority or ownership. |
| I | Legacy, Incapacity, Bereavement & Succession | The full original estate-planning and death-claims design: death-event reporting and verification, estate administration, claims across every asset category, wills, trusts, authority credentials, disputes, and fraud detection — built as one domain inside the platform, reusing every other domain's identity graph, institution graph, document hub, permission model, and audit system rather than duplicating them. |

Domain I is the deepest and most mature domain in this specification because it began as the
platform's entire original scope (see `CORRECTED_PRODUCT_THESIS.md`). It was not cut down when the
thesis broadened — it was kept in full and re-homed as one domain among nine, because bereavement
is the single highest-stakes, highest-coordination-cost life event a citizen's family will ever go
through, and the underlying institutional-relationship, document, consent, and audit machinery the
rest of the platform needs is exactly the machinery Domain I already required.

## 5. Differentiation from adjacent categories

Suvidha is frequently mistaken, on first description, for one of several existing product
categories. It borrows from all of them and is fully none of them:

| # | Adjacent category | Why Suvidha is not that |
|---|---|---|
| 1 | Government-services directory (a list of "how to apply for X") | A directory tells a citizen where to go; Suvidha tracks the citizen's own request through to completion and remembers what they already hold. |
| 2 | Deep-link collection (a bookmarked set of portal links) | A deep-link is stateless; Suvidha's deep-links are one execution method among nine, always attached to a tracked request with status history. |
| 3 | Document wallet (store and retrieve documents) | A wallet stores files; Suvidha's document hub tracks provenance, expiry, verification status, and cross-institution reuse eligibility, and drives renewal reminders from it. |
| 4 | Personal-finance dashboard (net worth, spend tracking) | A finance dashboard aggregates balances; Suvidha deliberately avoids exposing exact balances in shared views and is not built around monetary tracking as its central metric — see `ROADMAP.md`'s success-metrics framework. |
| 5 | Help chatbot (answer questions about a service) | A chatbot answers a question and forgets; Suvidha's communication centre and request tracker persist state across the citizen's entire relationship with every institution, and any AI-generated response is explicitly never treated as an official decision. |
| 6 | CRM (an institution's record of its customers) | A CRM is owned by and serves the institution; Suvidha is owned by and serves the citizen, and no institution can see more of a citizen's data than that citizen has explicitly consented to share. |
| 7 | Grievance portal (file and track a single complaint) | A grievance portal is single-institution and single-case; Suvidha's grievance handling is one request type among many, inside the same unified tracker as every other institutional interaction. |
| 8 | Password manager / account aggregator | An aggregator logs in on the citizen's behalf using stored credentials; Suvidha never collects a password for an external portal and never impersonates the citizen to a third-party system. |
| 9 | Identity-verification / KYC utility | A KYC utility exists to prove identity once, for one relying party; Suvidha never treats Aadhaar or PAN as a universal key to a citizen's other records — identifiers are used only where legally permitted, consented, and supported for a specific, scoped purpose. |
| 10 | Legal/estate-planning SaaS (will-drafting tools) | A will-drafting tool ends at the document; Suvidha's Legacy & Succession domain carries the estate through the entire post-death institutional claims process across every asset category the citizen held, using the same institutional graph the citizen already built while living. |

## 6. Naming rationale: why "Suvidha"

The product name needed to satisfy several constraints at once, given the corrected, broader
thesis:

- **No death or inheritance connotation.** Legacy & Succession is one domain among nine, not the
  platform's identity. A name that evoked bereavement, wills, or inheritance would have
  mis-anchored the whole product in the public's mind, the same mistake the original narrow scope
  made structurally.
- **Reads calmly across literacy levels and languages.** "Suvidha" (सुविधा) is a common Hindi and
  pan-Indian word meaning convenience, ease, or facility. It is already familiar — used in the
  names of government helplines, application counters, and citizen-service windows across India —
  so it requires no explanation and carries no intimidating bureaucratic weight.
- **Evokes ease-of-service, not bureaucracy or surveillance.** A platform whose core promise is
  "update once, track everywhere" needs a name that signals help and convenience, not a name that
  sounds like a government database or a compliance system.
- **Neutral enough to sit above every domain equally.** The name needed to work as comfortably for
  a mobile-number update as for a post-death succession claim, since both are represented in the
  same unified request tracker.

**Trademark-clearance caveat.** "Suvidha" is a common descriptive word, not a coined or invented
brand, and it is already in use by multiple unrelated government schemes, helplines, and private
products in India. This prototype uses it as a working name for documentation and demonstration
purposes only. A real product launch under this name would require a full trademark clearance
search across relevant classes and jurisdictions, and should be expected to require a distinct
visual identity or a modified/coined name if clearance fails — the same diligence any serious
product launch would apply before committing to a brand.
