# User Stories

This file organizes Suvidha's user stories by the nine product domains (A–I) defined in
`docs/00_EXECUTIVE_SUMMARY.md` and `docs/TERMINOLOGY.md`, plus a closing section of cross-cutting
institution/ops-console stories that span multiple domains (queues, maker-checker, SLA dashboards,
audit-log explorer, integration monitoring). Every story uses the canonical persona names from
`docs/TERMINOLOGY.md` — do not invent role names not defined there.

Each story is tagged with a MoSCoW priority:

- **MUST** — required for the domain's golden demo flow to work at all.
- **SHOULD** — materially strengthens the domain but the flow is coherent without it.
- **COULD** — a nice-to-have that could slip past the prototype's time-boxed scope (see
  `ASSUMPTIONS_AND_LIMITATIONS.md`).

Status-quo note: as of this writing the Prisma schema is complete but the application layer
(screens, seed data, business-logic engines) has not yet been built beyond scaffold — see
`docs/00_EXECUTIVE_SUMMARY.md`'s "What's real vs. simulated" table. These stories specify what the
build-out phases in `ROADMAP.md` are working toward.

---

## Domain A — Master Profile

1. As an **Independent Citizen**, I want to see one consolidated profile (legal name, addresses,
   contact details, family, employment) drawn from every institution I've connected, so that I stop
   having to remember which record is current where. **(MUST)**
2. As an **Independent Citizen**, I want the platform to show me every value reported for a field
   (e.g. three different "present address" values from three institutions) side by side with its
   source and last-verified date, so that I can see exactly where I'm out of sync. **(MUST)**
3. As an **Independent Citizen**, I want to be told when two sources disagree on a profile field
   (a Profile Conflict), rather than have the platform silently pick one as "correct," so that I
   retain the decision about which record needs correcting. **(MUST)**
4. As an **Independent Citizen**, I want to acknowledge a detected conflict and either start a
   correction request or dismiss it as "not actually a conflict" (e.g. a legitimately different
   correspondence address), so that my profile reflects reality without false alarms. **(SHOULD)**
5. As an **Assisted Citizen**, I want my Master Profile explained in plain language with large text
   and simple visual cues (not raw source-system jargon), so that I can understand my own records
   without help. **(MUST)**
6. As a **Family Administrator**, I want to view (not edit) the profile of the parent I assist, within
   the scope I've been granted, so that I can help spot discrepancies without exceeding my
   permission tier. **(MUST)**
7. As a **Government Service Officer**, I want to see which of my institution's records a citizen has
   flagged as inconsistent with another source, so that I can prioritize which correction requests
   are genuine versus noise. **(SHOULD)**
8. As an **Auditor/Regulator**, I want every profile field value to retain its provenance
   (`user_entered` vs `verified_by_source`) permanently, so that I can audit whether an institution
   over-relied on unverified citizen self-reporting. **(SHOULD)**
9. As an **Independent Citizen**, I want to add a profile field value manually before any connector
   verifies it, so that I can start using the platform even for institutions I haven't linked yet.
   **(COULD)**
10. As a **Professional Representative**, I want to see a client's profile conflict history when
    preparing a compliance filing on their behalf, so that I can flag mismatches the client may not
    have noticed. **(COULD)**

## Domain B — Institutional Relationship Graph

1. As an **Independent Citizen**, I want a single graph/list of every institution I have a
   relationship with — government identity records, licences, financial accounts, my employer,
   utilities, business registrations — so that I never lose track of "what do I even hold, and
   where." **(MUST)**
2. As an **Independent Citizen**, I want to connect a new institutional relationship (simulated) and
   see its status move from `under_verification` to `verified`, so that I trust the graph reflects
   reality rather than my own unverified claims. **(MUST)**
3. As an **Independent Citizen**, I want to see the last-synced time and outcome (success, partial
   failure, failed) for each connected relationship, so that I know when to trust a stale-looking
   record versus when the platform genuinely couldn't reach the source. **(MUST)**
4. As an **Independent Citizen**, I want to see renewal deadlines (licence expiry, KYC re-verification
   due) surfaced against the relevant relationship, so that I don't discover a lapse only when I try
   to use the service. **(SHOULD)**
5. As an **Independent Citizen**, I want to mark a relationship as `closed` or `dormant` when I no
   longer use that institution, so that my active graph stays a true, current picture. **(SHOULD)**
6. As a **Financial Institution Operations Officer**, I want to see which of my institution's account
   relationships a citizen has linked and verified through Suvidha, so that I can understand adoption
   without gaining any new access to the citizen's own view. **(COULD)**
7. As an **Institution Administrator**, I want to configure which relationship types my institution
   exposes to the graph (e.g. only `financial_account`, not internal staff records), so that I
   control my institution's exposure precisely. **(SHOULD)**
8. As an **Auditor/Regulator**, I want every relationship's `identifierUsed` and `connectorId` logged,
   so that I can trace exactly how a match between citizen and institution record was established.
   **(MUST)**
9. As an **Independent Citizen**, I want a relationship that failed verification to say clearly why
   (execution-method and failure reason), rather than fail silently, so that I know whether to retry,
   visit in person, or wait. **(MUST)**
10. As a **Parent or Guardian**, I want to add institutional relationships on behalf of a minor
    dependant (e.g. school registration, minor's bank account), so that I can manage their
    administrative life until they come of age. **(COULD)**

## Domain C — Document & Evidence Hub

1. As an **Independent Citizen**, I want to upload a document once and see it categorized (identity,
   address, tax, banking, ...) with issuer and expiry captured, so that I don't re-enter the same
   metadata for every institution that needs it. **(MUST)**
2. As an **Independent Citizen**, I want to reuse an already-verified document across multiple
   service requests instead of re-uploading it, so that repeat paperwork is eliminated wherever an
   institution's reuse policy allows it. **(MUST)**
3. As an **Independent Citizen**, I want to see which documents are expiring this year, ranked by
   urgency, so that I can renew them before they lapse. **(MUST)**
4. As an **Independent Citizen**, I want to see exactly who I've shared a document with and revoke
   that share, so that document sharing is never silent or permanent. **(MUST)**
5. As an **Assisted Citizen**, I want a large-print, plain-language document list with icons instead
   of only file names, so that I can find the right document without reading small system labels.
   **(SHOULD)**
6. As a **Verification Officer**, I want to mark a submitted document `verified`, `rejected`, or
   `needs_original` with a note, so that the citizen gets an actionable, specific reason rather than
   a bare rejection. **(MUST)**
7. As a **Verification Officer**, I want to see whether a document was already verified by another
   institution before I verify it again, so that I can accelerate genuinely low-risk reuse cases.
   **(SHOULD)**
8. As an **Institution Administrator**, I want to define which document categories my institution's
   services require and whether they're `reusable_if_verified_and_current` or `always_fresh_required`,
   so that reuse doesn't bypass my institution's actual compliance requirements. **(MUST)**
9. As an **Auditor/Regulator**, I want a durable log of every document share and its purpose, so that
   I can confirm data was disclosed only for the purpose it was consented to. **(MUST)**
10. As an **Independent Citizen**, I want a self-attestation / simulated e-sign flow for documents that
    don't require in-person notarization, so that I can complete more of a request digitally.
    **(COULD)**

## Domain D — Unified Service Request Engine

1. As an **Independent Citizen**, I want to browse a single catalogue of services across all my
   institutions (address update, nominee update, refund request, certificate request, ...), so that
   I don't need to know which institution's portal to visit first. **(MUST)**
2. As an **Independent Citizen**, I want every service to show its execution method (API, deep-link,
   generated packet, assisted workflow, in-person, requires approval, unsupported) before I start,
   so that I know upfront what effort is actually involved. **(MUST)**
3. As an **Independent Citizen**, I want to create a service request and see a generated checklist of
   required fields and documents before I submit, so that I don't submit an incomplete request and
   wait days just to be told what's missing. **(MUST)**
4. As an **Independent Citizen**, I want to check the status of any request in one place, seeing both
   the platform's normalized status and the institution's own raw status text, so that I never
   have to guess what "under process" actually means for a given institution. **(MUST)**
5. As an **Independent Citizen**, I want a full status history/timeline for each request, so that I
   can see exactly when it moved from submitted to under-verification to approved. **(SHOULD)**
6. As an **Independent Citizen**, I want to be notified of information requests (deficiency notices)
   against my request with a clear explanation of what's missing, so that I can respond quickly
   instead of the request silently stalling. **(MUST)**
7. As a **Government Service Officer**, I want a queue of incoming service requests for my
   institution, filterable by service type and normalized status, so that I can triage efficiently.
   **(MUST)**
8. As a **Financial Institution Operations Officer**, I want to raise a deficiency request against an
   incomplete service request with a structured reason, so that the citizen gets an actionable,
   trackable ask rather than an informal phone call. **(MUST)**
9. As an **Institution Administrator**, I want to configure eligibility rules and required
   fields/documents per service definition, so that the request engine enforces my institution's
   actual requirements without hand-coding them into the UI. **(SHOULD)**
10. As an **Auditor/Regulator**, I want every request's execution-method label and status-mapping
    history retained, so that I can verify institutions are not silently reclassifying delays.
    **(SHOULD)**

## Domain E — Communication & Inbox

1. As an **Independent Citizen**, I want every notice, request update, reminder, and security alert
   from every institution to land in one inbox, so that I stop missing things buried in five
   different SMS/email streams. **(MUST)**
2. As an **Independent Citizen**, I want a plain-language summary alongside the original notice text,
   so that I can understand what a dense regulatory or tax notice actually requires without a
   translator or a CA on standby. **(MUST)**
3. As an **Independent Citizen**, I want a notice's response deadline extracted and shown against my
   deadlines list, so that I don't miss a statutory response window buried in paragraph three.
   **(MUST)**
4. As an **Independent Citizen**, I want messages flagged when the sender can't be verified as
   genuine, so that I'm protected from phishing dressed up as an official notice. **(MUST)**
5. As an **Independent Citizen**, I want a suggested next action attached to a message (e.g. "file a
   correction," "no action needed"), clearly marked as a suggestion and not an official
   determination, so that I know what to do without mistaking a suggestion for a ruling. **(SHOULD)**
6. As an **Assisted Citizen**, I want messages read aloud or shown in large, simple text, so that I
   can act on notices independently. **(SHOULD)**
7. As a **Government Service Officer**, I want confirmation that a citizen actually opened a notice
   (read receipt), so that I have evidence of delivery for compliance purposes. **(SHOULD)**
8. As a **Grievance Officer**, I want inbox threads linked to the grievance or service request they
   concern, so that I have full conversational context in one place when I respond. **(MUST)**
9. As an **Independent Citizen**, I want to search my inbox across all institutions and time periods,
   so that I can find an old notice quickly instead of digging through separate mailboxes.
   **(COULD)**
10. As an **Auditor/Regulator**, I want every message's sender-verification status retained
    permanently, so that fraud-pattern analysis remains possible after the fact. **(COULD)**

## Domain F — Life-Event Orchestration

1. As an **Independent Citizen**, I want to start a life event (address change, marriage, job change)
   from a single template and get a generated plan of every affected institutional relationship, so
   that I don't have to work out for myself who needs to know. **(MUST)**
2. As an **Independent Citizen**, I want each life-event action tagged mandatory, recommended, or
   optional, with a sequence and dependency order, so that I do things in the order that actually
   works (e.g. update Aadhaar before the bank will accept the new address). **(MUST)**
3. As an **Independent Citizen**, I want to see overall progress through a life event as a percentage
   and a list of remaining actions, so that I know how much is left without re-deriving it myself.
   **(MUST)**
4. As an **Independent Citizen**, I want each life-event action to inherit the same execution-method
   labeling as a standalone service request, so that the honesty guarantee holds even inside a
   guided flow. **(MUST)**
5. As an **Independent Citizen**, I want to pause a life event and resume it later without losing
   progress, so that a multi-week process (e.g. after marriage) doesn't force me to start over.
   **(SHOULD)**
6. As a **Parent or Guardian**, I want a "turning 18" life-event template that surfaces the identity
   and account actions a young adult needs to take, so that I can prepare them for their first
   independent administrative responsibilities. **(COULD)**
7. As an **Assisted Citizen**, I want a Family Administrator to be able to view my life-event plan
   and prepare (but not submit) actions on my behalf, so that I get help without losing control of
   what actually gets submitted. **(MUST)**
8. As a **Government Service Officer**, I want to see life-event-driven request volume by event type,
   so that my institution can anticipate load around common events like address changes. **(COULD)**
9. As an **Independent Citizen**, I want to mark a life event abandoned if my circumstances change, so
   that stale, irrelevant action lists don't clutter my dashboard. **(SHOULD)**
10. As an **Auditor/Regulator**, I want life-event action completion timestamps retained, so that SLA
    and adoption analysis can be performed per life-event type. **(COULD)**

## Domain G — Financial & Compliance Administration

1. As an **Independent Citizen**, I want to see every financial holding I've connected (bank, demat,
   mutual fund, insurance, EPF/NPS, pension) in one place alongside its nominee status, so that I
   have a single financial picture without a spreadsheet. **(MUST)**
2. As an **Independent Citizen**, I want to see which holdings have no nominee, an outdated nominee,
   or a disputed nominee, so that I can fix nomination gaps proactively rather than my family
   discovering them during a claim. **(MUST)**
3. As an **Independent Citizen**, I want tax and regulatory notices routed into the same unified
   deadlines list as everything else, so that compliance deadlines don't live in a separate mental
   category from my other obligations. **(MUST)**
4. As an **Independent Citizen**, I want a generated checklist for responding to an income-tax notice,
   grounded in the notice's own extracted fields, so that I know exactly what's being asked without
   independently interpreting tax language. **(SHOULD)**
5. As an **Independent Citizen**, I want amounts shown as bands (e.g. "₹1,00,000–₹5,00,000") in any
   shared or family-visible view, and my exact balance never exposed to anyone I haven't explicitly
   authorized, so that financial privacy is preserved even during family assistance. **(MUST)**
6. As a **Family Administrator**, I want to see nomination-coverage gaps for a parent I assist (without
   seeing exact balances) within my granted scope, so that I can help close genuinely important gaps
   without unnecessary financial visibility. **(SHOULD)**
7. As a **Financial Institution Operations Officer**, I want a queue of nominee-update requests, so
   that I can process a well-known, high-volume, low-risk request type efficiently. **(MUST)**
8. As an **Institution Administrator**, I want to configure service fees per service definition (e.g.
   "late renewal penalty"), so that citizens see accurate fee expectations before submitting.
   **(SHOULD)**
9. As an **Auditor/Regulator**, I want confirmation that Suvidha never displays or claims to compute
   a citizen's total net worth or estate value as a platform metric, so that the product stays within
   its administrative-coordination mandate. **(MUST)**
10. As an **Independent Citizen**, I want a liability (loan, credit card, tax dues) shown alongside
    the relevant holding so I understand my full institutional relationship, not just what I own.
    **(COULD)**

## Domain H — Delegated Access & Consent

1. As an **Independent Citizen**, I want to invite a Family Administrator or Professional
   Representative and choose a permission tier (view, assist, prepare, submit, sign, receive
   communication) for a specific task, so that I control precisely how much authority I hand over.
   **(MUST)**
2. As an **Independent Citizen**, I want every delegated task to require my explicit approval before
   anything is submitted on my behalf, so that "prepare" is never silently upgraded to "submit."
   **(MUST)**
3. As an **Independent Citizen**, I want to grant, view, and revoke consent scopes purpose by purpose
   (asset discovery, document fetch, profile sync), so that I never grant broader access than a
   specific task requires. **(MUST)**
4. As an **Independent Citizen**, I want a durable receipt (Consent Artefact) for every consent I
   grant, retained even after I revoke it, so that I have proof of exactly what I agreed to and when.
   **(MUST)**
5. As a **Family Administrator**, I want to see exactly which tasks I've been granted and their current
   permission tier, so that I never act outside what's actually been delegated to me. **(MUST)**
6. As an **Assisted Citizen**, I want a simplified approval screen ("Your daughter has prepared this
   request — do you want to submit it?") in plain language, so that I retain final control without
   needing to understand the underlying permission-tier mechanics. **(MUST)**
7. As a **Professional Representative**, I want delegated tasks scoped to a specific service request
   rather than blanket access to a client's whole profile, so that my access matches what my
   engagement actually requires. **(SHOULD)**
8. As an **Independent Citizen**, I want to revoke a Trusted Contact's or Professional
   Representative's access immediately and see the revocation take effect across every scope they
   held, so that trust changes are never partial or delayed. **(MUST)**
9. As an **Auditor/Regulator**, I want every data share under a consent scope logged with the fields
   shared (never raw values) and the recipient, so that consent enforcement is independently
   verifiable. **(MUST)**
10. As an **Independent Citizen**, I want to see a plain-language distinction that a Trusted Contact or
    Family Administrator role is a platform permission only — never legal ownership, inheritance, or
    government authority — so that I never misunderstand what I've granted. **(MUST)**

## Domain I — Legacy, Incapacity, Bereavement & Succession

1. As an **Estate Planner**, I want a readiness score based on completeness of my estate
   plan (nominations current, will referenced, Trusted Contact set up) — never based on the size of
   my assets — so that I'm encouraged to prepare without the platform valuing my wealth. **(MUST)**
2. As an **Estate Planner**, I want to designate a Trusted Contact with an explicit access policy
   (e.g. emergency-contacts-only, full-inventory-no-balances) and timing rule (immediate, after
   verified death, after a waiting period), so that I control exactly what my family can see and
   when. **(MUST)**
3. As an **Informant**, I want to report a death and attach evidence (death certificate, hospital
   discharge summary) through a calm, dignified flow with no urgency-manufacturing language, so that
   I can complete a painful task without added pressure. **(MUST)**
4. As a **Claimant**, I want the platform to identify which institutions likely hold assets for the
   deceased and pre-fill a unified claim packet from documents I've already provided, so that I don't
   re-submit the same death certificate and identity proof to every institution separately. **(MUST)**
5. As a **Claimant**, I want to see each claim's real, current status (draft, submitted,
   deficiency-pending, approved, settled, ...) without euphemism or manufactured optimism, so that I
   have an honest picture during an already difficult time. **(MUST)**
6. As a **Verification Officer**, I want to review death-event evidence and identity documents before
   a claim proceeds, so that fraud and misidentification are caught before any payout step. **(MUST)**
7. As a **Maker**, I want to recommend approval or rejection of a claim with rationale, and as a
   **Checker**, I want to independently approve, reject, or escalate that recommendation, so that no
   single officer can unilaterally settle a claim. **(MUST)**
8. As a **Claims Officer**, I want a queue of claims segmented by status and SLA risk, so that I can
   prioritize claims approaching a deadline. **(MUST)**
9. As a **Legal Representative**, I want to challenge a false-death record and see it move through
   re-verification, registrar correction, and agency-by-agency reactivation acknowledgement, so that
   a wrongly-flagged living person is restored across every institution, not just corrected in one
   place. **(MUST)**
10. As an **Auditor/Regulator**, I want fraud signals (duplicate claims, payout-account changes,
    forged-document suspicion) logged and investigable independent of the claim's outcome, so that
    fraud patterns can be studied even in claims that were ultimately legitimate. **(SHOULD)**
11. As an **Estate Planner**, I want reminders to review my estate plan periodically, phrased as calm
    check-ins rather than countdowns or urgency prompts, so that planning feels like ordinary
    administration, not a memento mori. **(SHOULD)**
12. As a **Grievance Officer**, I want to see a claimant's grievance and appeal history against a
    claim in one place, so that I can respond with full context rather than starting from scratch on
    each escalation. **(COULD)**

---

## Institution & Ops Console — Cross-Cutting Stories

These stories span multiple domains and describe the separate institution-side console (service-
request queues, case workspaces, document verification, maker-checker approval, grievance queues,
SLA dashboards, audit-log explorer, integration monitoring, and the Legacy & Succession claims
queue).

1. As an **Institution Administrator**, I want role-based access so Maker, Checker, Verification
   Officer, and Grievance Officer users see only the queues and actions relevant to their role, so
   that separation of duties is enforced by the platform, not by policy alone. **(MUST)**
2. As a **Case Officer**, I want a unified case workspace showing a request's documents, status
   history, communications, and delegated-access context in one screen, so that I don't context-switch
   across systems to make a decision. **(MUST)**
3. As a **Maker**, I want my recommendation and its rationale permanently recorded before a Checker
   acts, so that the two-person control is auditable, not just procedural. **(MUST)**
4. As a **Checker**, I want to see the Maker's full rationale and the underlying evidence before I
   approve, reject, or escalate, so that my decision is genuinely independent and informed. **(MUST)**
5. As an **Institution Administrator**, I want an SLA dashboard showing target-vs-actual days for
   each process type (death-event acknowledgement, claim first response, claim settlement), so that
   I can manage service levels proactively rather than reactively. **(MUST)**
6. As an **Auditor/Regulator**, I want an append-only audit-log explorer across every entity type and
   action, filterable by actor, entity, and correlation ID, so that any decision can be traced to
   who did what, when, and why. **(MUST)**
7. As an **Integration Administrator**, I want a monitoring view of each connector's sync health
   (success / partial failure / failed) across institutions, so that I can catch systemic connector
   problems before they generate a wave of citizen complaints. **(MUST)**
8. As a **Grievance Officer**, I want a queue of open grievances and escalations tagged by SLA
   breach risk, so that I address the most time-critical cases first. **(MUST)**
9. As a **Verification Officer**, I want a document-verification queue that surfaces whether a
   document was already verified elsewhere, so that I avoid redundant re-verification of low-risk,
   already-trusted documents. **(SHOULD)**
10. As an **Institution Administrator**, I want to see adoption and completion metrics for my
    institution's services (requests completed, average time-to-completion), so that I can identify
    which of my own services are hardest for citizens to complete. **(SHOULD)**
11. As an **Auditor/Regulator**, I want confirmation that no ops-console screen displays a raw,
    unmasked citizen identifier anywhere, so that operational staff exposure to sensitive identifiers
    is minimized structurally, not just by policy. **(MUST)**
12. As a **Nodal Officer**, I want escalations routed to me with the full grievance and prior
    institution-response history attached, so that I can resolve escalations without re-litigating
    facts the citizen already established. **(COULD)**
