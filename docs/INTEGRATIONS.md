# Integrations

## What this document is

This is the connector-by-connector integration architecture reference for Suvidha. It exists to
answer, honestly and specifically, for every entry in the `Connector.key` catalogue in
`prisma/schema.prisma`:

1. What the connector does in the product.
2. Its `integrationLabel` (one of the six values defined on the `Connector` model), and why.
3. What a **real** production integration would actually require — which real body, API, licence,
   or partnership, grounded in `docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md`.
4. What the **prototype** actually does — a mock adapter returning a realistic, clearly-synthetic
   response shape.

**No real credentials are ever requested or stored anywhere in this codebase. No authenticated
government system, bank portal, or regulator database is ever scraped, queried, or logged into.
Every mocked integration is visibly labelled as simulated in the UI** (see the `verificationSource`,
`method`, and `*_simulated` string conventions already present throughout `prisma/schema.prisma` —
e.g. `IdentityRecord.method` values like `digilocker_simulated`, `Payment.method` values like
`bank_transfer_simulated`). This document does not introduce new deception surface; it explains the
pattern that already exists in the schema.

### The six `integrationLabel` values — working definitions

The schema enum names these six values but does not define them in prose. The definitions below are
the explicit, honest interpretation used consistently across this documentation set (also stated in
`docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md`):

| Label | Meaning |
|---|---|
| `real_public_integration_documented` | A genuinely public, documented API/integration surface exists that an organisation can register for and use largely as published. |
| `regulated_partner_integration_required` | A real integration mechanism exists, but only for entities holding a specific regulatory licence/registration. |
| `institution_specific_integration_required` | No unified government-mandated API; a real integration needs bespoke, one-by-one agreements with each institution. |
| `manual_assisted_workflow` | A citizen self-service channel exists but no machine API for third parties; a real product generates/pre-fills paperwork and guides the citizen through the official channel. |
| `prototype_simulation` | No real integration is claimed or planned even in a production future; exists to demonstrate the concept only. |
| `future_policy_dependency` | No current legal/technical basis exists for this to be an automated third-party service; a policy or regulatory change would be needed first. |

**Every connector's implementation in the running prototype is, without exception, `prototype_simulation`
at the code level** — a synchronous TypeScript function that returns seeded/randomised canned data,
never a network call to anything real. The `integrationLabel` field captures something additional:
what category of *real-world path* a production successor would need to follow, so that a reader (or
a future engineering team) knows which connectors are "just waiting for someone to sign a partner
agreement" versus which ones don't have a real path yet at all. See each section below.

---

## 1. `death_registry`

**What it does in the product:** Represents a death event as reported to and verified by a civil
registrar. Backs the `DeathEvent`/`DeathEventEvidence`/`DeathEventMatch` models — the trigger for
the entire estate/succession module and for the "propagate a death across a citizen's institutional
graph" concept at the heart of the product thesis.

**integrationLabel: `future_policy_dependency`.** The one-directional RGI→UIDAI CRS data-sharing
arrangement (see `docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §1.1–1.2) is real evidence that
death-registry data *can* flow to a consuming institution — but it is a narrow, bilateral,
government-to-government arrangement, not a general-purpose API any platform, public or private, can
subscribe to. For Suvidha to receive a real, verified death event and legally act on it across
multiple institutions, a policy change (e.g. a government-sanctioned "death notification API" that
licensed platforms could subscribe to, analogous to how DigiLocker exposes documents) would need to
exist first. It does not today.

**What a REAL production integration would require:** Either (a) the Government of India/RGI
building and opening a "unified death notification" service comparable in openness to DigiLocker's
Issuer/Requester model, which does not currently exist even as a stated roadmap item found in public
sources, or (b) Suvidha operating purely as a document- and checklist-driven layer where the citizen
or claimant uploads a death certificate obtained through the ordinary CRS process and Suvidha treats
that upload, plus its own verification workflow, as the trigger — i.e. never a machine-to-machine
feed at all, by design.

**What the PROTOTYPE actually does:** A seeded, synchronous mock: given a `personId`, it returns a
canned `DeathEvent`-shaped object with a synthetic `registrationNumber` (clearly not a real CRS
number format claim), a `status` progressed through the lifecycle described in the schema comment
(`reported → evidence_submitted → registrar_verified → ... → matched`), and a fixed or seeded-random
`confidenceScore` on any `DeathEventMatch` rows it also seeds. No real registrar, state CRS instance,
or UIDAI system is contacted.

---

## 2. Identity verification (PAN/Aadhaar-style) — maps to the `pan_verification` connector key

**Note on naming:** the schema's `Connector.key` enumeration does not include a literal
`identity_verification` key; PAN/Aadhaar-style identity verification is represented by the
`pan_verification` connector key plus the `IdentityRecord` model (`method` values
`digilocker_simulated | manual_document_review | video_kyc_simulated`) and the `PersonIdentifier`
model's masked-value/salted-hash pattern. This section documents that combined surface.

**What it does in the product:** Verifies that a claimed identity (a claimant, a nominee, an
estate planner) is who they say they are, using PAN and/or Aadhaar-style identifiers, without ever
storing the raw identifier.

**integrationLabel: `regulated_partner_integration_required`.** Both real underlying mechanisms —
UIDAI's Aadhaar authentication/e-KYC APIs (AUA/KUA-gated) and the Income Tax Department's PAN
verification/bulk-verification APIs (gated to specified/registered external agencies) — are real,
documented, and actively used across India's fintech/regtech ecosystem, but neither is open to an
arbitrary consumer platform without holding, or partnering with an entity that holds, the relevant
regulatory status (see `docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §1.2–1.3).

**What a REAL production integration would require:** Suvidha (or a KYC-as-a-service partner it
contracts, several of which exist commercially, e.g. Setu, Signzy, Decentro-style aggregators sitting
on top of the same regulated access) would need AUA/KUA status for Aadhaar e-KYC and registered
external-agency status for PAN verification, plus the attendant compliance obligations (data
localisation, audit, grievance-redressal) that come with holding that status.

**What the PROTOTYPE actually does:** A synchronous function takes a masked identifier input
(`maskedValue` already redacted before it ever reaches this function — see the schema comment "Raw
values are never stored") and returns one of `verified | rejected | inconclusive` with a seeded
`confidence` float, tagging `verificationSource` as `"DigiLocker (simulated)"` or `"Manual review"` per
the existing `PersonIdentifier.verificationSource` convention. No Aadhaar number, PAN, or other raw
identifier is ever transmitted, logged, or persisted — only its masked display value and a salted
hash used purely for equality matching.

---

## 3. `digilocker`

**What it does in the product:** Simulates fetching a government-issued document (e.g. a death
certificate, PAN card image, marksheet) into Suvidha's document hub with the citizen's consent.

**integrationLabel: `real_public_integration_documented`.** This is the one connector in the whole
catalogue where a genuinely open, documented government API exists — the DigiLocker Issuer/Requester
API specification published via API Setu (see `docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §1.8). Third
parties commonly integrate as Requesters today, including via commercial aggregators that wrap the
same government spec. "Open" here means a published, standard onboarding path — registering as a
Requester on API Setu still requires organisational approval, not anonymous/instant access.

**What a REAL production integration would require:** Registering as a Requester organisation on API
Setu, implementing the OAuth-style consent flow DigiLocker specifies, and calling the Requester API
to pull a specific document type once the citizen has approved the request in their own DigiLocker
account. This is the most realistically buildable connector in the catalogue if Suvidha were ever
built for real.

**What the PROTOTYPE actually does:** A synchronous mock that, given a requested `documentType`,
returns a canned `LegalDocument`-shaped response with `fileLabel` set to a synthetic filename (per
the schema's explicit "no real file bytes stored in the prototype" rule), `isDemoDocument: true`, and
a simulated consent-receipt reference. No real DigiLocker account, OTP, or document is ever fetched.

---

## 4. `account_aggregator`

**What it does in the product:** Represents a consented pull of financial account information
(balances, holdings, transaction summaries) across a citizen's institutions in one flow, modelled on
India's real Account Aggregator (AA) framework.

**integrationLabel: `regulated_partner_integration_required`.** The AA framework (RBI Master
Direction — NBFC-Account Aggregator Directions, 2016, now with Sahamati recognised as its SRO) is
real, large-scale, and live — but consuming AA data requires the consuming entity to be a licensed
Financial Information User (FIU), which means being a regulated financial entity or partnering with
one; a generic citizen-life-administration platform cannot become an FIU purely to power a
convenience feature (see `docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §2.7).

**What a REAL production integration would require:** Either Suvidha's parent entity obtaining FIU
status through a regulated financial-services licence, or contracting with an existing licensed FIU
to pull data on Suvidha's behalf under the citizen's own AA-app consent — the AA framework's
architecture requires the consent to run through the citizen's own linked AA app regardless.

**What the PROTOTYPE actually does:** A synchronous mock returns a canned "consent artefact" receipt
number and a fixed/seeded set of account summaries (masked account numbers, balance *bands* rather
than exact figures, per the schema's `Payment.amountBand`/`Liability.outstandingAmountBand`
convention) as if an AA pull had completed. No real AA app, NBFC-AA, or financial institution is ever
contacted.

---

## 5. `ckyc`

**What it does in the product:** Simulates checking whether a person's KYC is already on file
somewhere in the financial system (via their CKYC number), to reduce repeat document collection.

**integrationLabel: `regulated_partner_integration_required`.** CKYC Search/Upload APIs are real and
CERSAI-documented, but restricted to registered "reporting entities" under PMLA rules — banks, NBFCs,
insurers, depository participants, AMCs (see `docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §2.8).

**What a REAL production integration would require:** Reporting-entity registration with CERSAI (a
status realistically only available to a regulated financial institution, not a life-administration
platform directly), or a partnership with one that would query CKYCR on Suvidha's behalf under
appropriate authorisation.

**What the PROTOTYPE actually does:** A synchronous mock returns a canned 14-digit-shaped (but
clearly synthetic, e.g. prefixed/patterned so it cannot be mistaken for a real KIN) CKYC reference
and a `found | not_found` status. No real CERSAI system is ever queried.

---

## 6. `bank`

**What it does in the product:** Represents a citizen's bank account/FD/RD/locker relationship —
balance signalling, nomination status, and the death-claim workflow trigger for a bank asset.

**integrationLabel: `institution_specific_integration_required`.** There is no RBI-mandated
universal bank-data API outside the Account Aggregator framework (which itself requires regulated
FIU status, connector 4). A real integration would otherwise need a bilateral technical agreement
with each individual bank — India has dozens of scheduled commercial banks plus a long tail of
cooperative/small-finance/payment banks, each with its own systems (see
`docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §2.1–2.4).

**What a REAL production integration would require:** Either per-bank "API banking" partnership
agreements (commercially available at several large banks under bilateral commercial terms, not a
public spec), or routing through the Account Aggregator framework as a licensed FIU.

**What the PROTOTYPE actually does:** A synchronous mock returns, per bank asset: a masked account
number (e.g. `"XXXX XXXX 4821"`), a **balance band** rather than an exact balance (e.g. `"₹1,00,000 –
₹5,00,000"`, matching the schema's real-world rule that unauthorised viewers never see an exact
figure), a `holdingType` (sole/joint mandate), nomination summary, and a `syncStatus` of
`success | partial_failure | failed` seeded to demonstrate the platform's graceful degradation UX.
No real bank, net-banking session, or account number is ever contacted or stored.

---

## 7. `depository`

**What it does in the product:** Represents a demat account (NSDL/CDSL, via a Depository
Participant) — securities holdings and the transmission-on-death workflow.

**integrationLabel: `institution_specific_integration_required`.** NSDL/CDSL themselves do not offer
a public consumer API; each Depository Participant (broker/bank) exposes its own trading/holdings API
under individual commercial terms (see `docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §3.1).

**What a REAL production integration would require:** A bilateral integration with each DP whose
customers use Suvidha (e.g. Zerodha Kite Connect, Angel One SmartAPI, or equivalent), or — for the
death-claim workflow specifically — no API at all, since real transmission-on-death requires
physical/notarised documents submitted to the DP regardless of any API access.

**What the PROTOTYPE actually does:** A synchronous mock returns a masked demat client ID, a seeded
list of security holdings (instrument label + quantity band, never exact market value), and whether
a nominee is on file. The transmission-workflow steps are simulated as `Requirement`/`WorkflowStep`
rows referencing the real document list (death certificate, transmission form, CML/CMR) without any
of it ever being submitted anywhere real.

---

## 8. `mutual_fund`

**What it does in the product:** Represents a mutual fund folio — holdings and the
transmission-on-death workflow via the folio's AMC/RTA.

**integrationLabel: `institution_specific_integration_required`.** No open public API exists at
CAMS/KFintech/MF Central for third-party platforms; each RTA's data feeds to AMCs and to commercial
partners are under individual agreement (see `docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §3.2).

**What a REAL production integration would require:** A commercial data-sharing agreement with CAMS
and/or KFintech (the two RTAs that between them service the large majority of Indian mutual fund
folios), or per-AMC integration.

**What the PROTOTYPE actually does:** A synchronous mock returns a seeded folio number (masked),
scheme/unit-count summary, nomination status, and — when a claim is in flight — a simulated
transmission timeline (`application_filed → field_verification_pending → approved` style progression
borrowed from the schema's `Mutation.status` pattern) with a randomised-but-plausible turnaround
within the ranges documented in the landscape doc. No real RTA or AMC system is contacted.

---

## 9. `insurance`

**What it does in the product:** Represents a life/health/motor policy — nomination vs. assignment
status, and the claim-intimation-through-settlement workflow.

**integrationLabel: `institution_specific_integration_required`.** IRDAI mandates process/timeline
rules but does not itself expose a citizen- or third-party-facing data API; each insurer runs its own
systems (see `docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §4.1–4.3).

**What a REAL production integration would require:** A bilateral integration/partnership with each
insurer, or — if and when IRDAI's **Bima Sugam** platform matures beyond its current (2026) phased,
product-purchase-only rollout into a live claims/data-sharing exchange — a single integration with
Bima Sugam instead. This is explicitly a `future_policy_dependency` consideration layered on top of
today's `institution_specific_integration_required` reality; see
`docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §4.4 for why Bima Sugam must not be treated as already live
for claims.

**What the PROTOTYPE actually does:** A synchronous mock returns a masked policy number, cover-amount
band, and — critically, since this is a core piece of Suvidha's authority-determination logic — an
explicit `nomination` vs. `assignment` designation matching the schema's `Nomination`/
`BeneficiaryDesignation` distinction, plus a seeded claim-status progression. No real insurer system
is contacted.

---

## 10. `epfo`

**What it does in the product:** Represents EPF/EPS/EDLI balance and nomination status, and the
composite death-claim workflow.

**integrationLabel: `manual_assisted_workflow`.** EPFO's Unified Member Portal is a real, live
citizen/employer self-service system (including an online Composite Death Claim), but there is no
public third-party API (see `docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §5.1).

**What a REAL production integration would require:** No API path exists to build toward today; a
real product would pre-fill the Composite Death Claim's data fields from what the citizen has already
told it and generate a guided walkthrough of the UAN portal's own claim submission — an
assisted-workflow product, not an integration, even in a mature future version.

**What the PROTOTYPE actually does:** A synchronous mock returns a masked UAN, seeded PF/EPS/EDLI
balance bands, e-Nomination status (`filed | not_filed`), and — when a claim exists — a seeded
progression through the real-world timeline bands documented in the landscape doc (PF ~7–15 days,
EDLI ~30–45 days). No real EPFO portal or UAN is contacted.

---

## 11. `nps`

**What it does in the product:** Represents an NPS Tier I/II balance and the death-claim withdrawal
workflow.

**integrationLabel: `manual_assisted_workflow`.** No public CRA API exists for third parties; death
claims specifically require Nodal Office/CRA-mediated processing even for the citizen themselves (see
`docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §5.2).

**What a REAL production integration would require:** As with EPFO, no realistic API path exists
today; a mature product would generate the death-claim form and required-document checklist and
guide the claimant to the Nodal Office/CRA process by hand.

**What the PROTOTYPE actually does:** A synchronous mock returns a masked PRAN, a seeded corpus band,
nominee status, and — for a death claim — the annuitisation-vs-lump-sum branching logic described in
the landscape doc (80% annuity rule, ₹5 lakh full-withdrawal threshold for government-sector
subscribers) applied to seeded numbers. No real CRA or PFRDA system is contacted.

---

## 12. `iepf`

**What it does in the product:** Surfaces likely exposure to unclaimed shares/dividends transferred
to the Investor Education and Protection Fund, and helps prepare a Form IEPF-5 claim.

**integrationLabel: `manual_assisted_workflow`.** `iepf.gov.in` is a citizen self-service search and
claim-filing portal with no public API (see `docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §3.5).

**What a REAL production integration would require:** No API to integrate with; a real product would
pre-fill Form IEPF-5 (SRN, claimant KYC fields, entitlement proof references) from data the citizen
has already provided and guide them through the actual filing, which remains a slow (4–6 month),
document-heavy, human-adjudicated process regardless of how well the form is pre-filled.

**What the PROTOTYPE actually does:** A synchronous mock returns a seeded "possible unclaimed
holding" hit (company name, share/dividend band) against a demo person, and a simulated Form IEPF-5
checklist with each requirement's status. No real IEPF portal is queried.

---

## 13. `land_records`

**What it does in the product:** Represents a property holding's state land-record entry — Record of
Rights status and mutation-on-death eligibility.

**integrationLabel: `manual_assisted_workflow`.** Land records are a state subject with 28+
independent state portals (Bhulekh, Bhoomi, Dharani, etc.) and no national API (see
`docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §7.1).

**What a REAL production integration would require:** In the best case, per-state integration with
whichever states publish structured open-data extracts (rare and inconsistent); in the general case,
no integration is realistically possible — a real product generates the mutation-application packet
and points the citizen at their specific state's portal or sub-registrar office.

**What the PROTOTYPE actually does:** A synchronous mock returns a seeded khasra/khata-style
reference (clearly synthetic), current Record-of-Rights holder name, and a mutation-application
status progression (`application_filed → field_verification_pending → approved → mutated`, matching
`Mutation.status` in the schema) tagged with a fictional "authority name" per the schema's own
`authorityName String // sub-registrar / development authority (simulated)` comment.

---

## 14. `property_registration`

**What it does in the product:** Represents the registered-deed side of a property (as distinct from
the Record-of-Rights side in `land_records`) — sub-registrar registration status and property tax.

**integrationLabel: `manual_assisted_workflow`.** Same fragmentation as `land_records` — sub-registrar
systems are state/district-run with no national API (see
`docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §7.1–7.2).

**What a REAL production integration would require:** Same as `land_records` — no unified path
exists; assisted-workflow document generation is the realistic ceiling for the foreseeable future.

**What the PROTOTYPE actually does:** A synchronous mock returns a seeded deed-registration reference
and property-tax-account status, mirroring the same simulated-authority pattern as `land_records`.

---

## 15. `vehicle_records`

**What it does in the product:** Represents a vehicle's RC/DL-adjacent record — ownership-transfer
status on the owner's death.

**integrationLabel: `manual_assisted_workflow`.** Parivahan/Vahan-Sarathi supports online
initiation of ownership transfer, but there is no public API for third-party platforms to submit or
query on a citizen's behalf (see `docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §1.6).

**What a REAL production integration would require:** No API to build against; a real product
generates the Form 31 packet (transfer of ownership on death, filed within 3 months per Rule 81 CMVR
1989) and required-document checklist, and deep-links to Parivahan for the citizen to submit and book
an RTO appointment themselves.

**What the PROTOTYPE actually does:** A synchronous mock returns a masked RC number, vehicle
description, and a Form-31-style transfer-status progression seeded against the real document
checklist (death certificate, legal heir/succession certificate). No real Parivahan/Vahan record is
contacted.

---

## 16. `employer_benefits`

**What it does in the product:** Represents employer-administered benefits on an employee's death —
gratuity (Payment of Gratuity Act, 1972), any group term life cover, and final-settlement dues —
distinct from the statutory `epfo`/`nps` connectors.

**integrationLabel: `manual_assisted_workflow`.** There is no government API here at all — gratuity
and other employer benefits are employer-internal HR/payroll processes governed by statute but
administered privately per employer (see `docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §5.3).

**What a REAL production integration would require:** Bespoke integration with each employer's HRMS
(there is no standard API even in principle, since this is not a government system) — realistically
this connector stays assisted-workflow indefinitely unless a specific enterprise/employer partnership
were negotiated.

**What the PROTOTYPE actually does:** A synchronous mock returns a seeded gratuity-amount band, a
group-life-cover flag, and a final-settlement checklist status, tagged against a fictional employer
institution record.

---

## 17. `postal_savings`

**What it does in the product:** Represents PPF/NSC/KVP/SCSS/POSB/Sukanya Samriddhi accounts and
their death-claim settlement workflow.

**integrationLabel: `manual_assisted_workflow`.** Where held at a bank, some self-service exists for
nomination updates (post-2025 rule change), but death-claim settlement is fundamentally branch/post-
office based with no public API (see `docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` §6.1–6.3).

**What a REAL production integration would require:** No API path exists; a real product generates
the scheme-specific claim form (e.g. Form G for PPF) and required-document checklist and guides the
claimant to their bank branch or post office.

**What the PROTOTYPE actually does:** A synchronous mock returns a masked account/certificate number,
scheme type, nomination status, and a seeded settlement-timeline estimate reflecting the
landscape doc's documented distinction (e.g. PPF's ECS-exclusion caveat vs. NSC/KVP/SCSS's inclusion)
where the seed data chooses to model that level of detail.

---

## 18. `court_legal_document`

**What it does in the product:** Represents court-issued authority instruments — succession
certificates, probate, letters of administration, court orders restraining or determining an estate
— that the platform's authority engine consumes as inputs, never issues.

**integrationLabel: `prototype_simulation`.** There is no real-world "API" for court orders or
succession certificates in any jurisdiction Suvidha models against — these are physical/court-e-filing
documents by nature, and Suvidha's role is purely to store and reference them, never to originate,
verify authenticity against a live court database (no such database exists for third-party query at
present), or represent that it has done so.

**What a REAL production integration would require:** Nothing changes this connector's fundamental
nature — even a mature production Suvidha would only ever *store and reference* an uploaded
court-issued document (with human verification of the physical/certified copy), never treat a court
order as machine-verifiable data from an API. This is the correct honest ceiling, not a temporary
prototype limitation.

**What the PROTOTYPE actually does:** A synchronous mock accepts a synthetic document reference
(`fileLabel`, per the "no real file bytes stored" schema rule) and a manually-set
`verificationStatus` (`pending | verified | rejected`) as if a human reviewer had checked a physical
certified copy — because in any real version, a human reviewer is exactly what would have happened.

---

## 19. `notification`

**What it does in the product:** Represents outbound communication to a citizen or claimant —
in-app, email, or SMS — about a status change, deadline, or required action.

**integrationLabel: `prototype_simulation`.** Notification delivery itself is not a regulated or
government system — it is ordinary application infrastructure (an email/SMS provider) that any real
product would simply purchase (e.g. a transactional email service, an SMS gateway) rather than
"integrate with" in the sense the other connectors describe. It is included in the connector catalogue
because the schema models it as an institutional-communication surface, not because it represents any
external authority.

**What a REAL production integration would require:** A commercial transactional-email/SMS provider
account — genuinely trivial compared to every other connector in this document, and not
policy-gated, licence-gated, or institution-specific in any interesting way.

**What the PROTOTYPE actually does:** A synchronous function creates a `Notification` row with
`channel` set to `in_app | email_simulated | sms_simulated` (per the existing schema comment) and
never actually sends a real email or SMS — the UI renders the notification from the database row
directly, clearly labelled as a simulated channel wherever `email_simulated`/`sms_simulated` appears.

---

## Event-driven architecture: production intention vs. prototype reality

The rest of this document has described, connector by connector, what a real integration would need.
This section describes the **surrounding architecture** — how these connectors would be orchestrated
in a production system — and is explicit throughout about which parts are architectural intentions
for a future build versus what the prototype's code actually implements today.

### Production-intention architecture (not implemented in the prototype)

A real Suvidha, integrating with even a handful of the institution-specific and regulated-partner
connectors above, would need:

- **Idempotent event processing** — every inbound signal (a webhook from a bank, a CRA callback, an
  AA data-fetch completion) carries an idempotency key so a retried delivery never double-processes
  a death claim or double-credits a status change.
- **Webhook retry with backoff** — institutions that call back into Suvidha asynchronously (e.g. "your
  Form 31 has been approved") get a retry policy (exponential backoff, dead-letter queue after N
  attempts) rather than a single at-most-once delivery assumption.
- **Correlation IDs** — a single citizen action (e.g. "report a death") that fans out into multiple
  downstream institutional workflows carries one correlation ID through every resulting `ServiceRequest`,
  `Claim`, and `AuditEvent`, so the full fan-out can be reconstructed and audited as one logical
  transaction even though it touches many rows and, in production, many external systems.
- **Schema versioning** — since institutions change their own status vocabularies and document
  requirements over time (already modelled conceptually in `InstitutionStatusMapping`, which maps an
  institution's raw status text to Suvidha's normalised status set), inbound event payloads would
  carry a schema version so older institution integrations don't silently break newer ones.
- **Reconciliation** — a scheduled job comparing Suvidha's last-known state of an institutional
  relationship against a fresh pull (where a real pull is even possible, per each connector's label
  above) and surfacing drift rather than silently trusting stale cached state — the conceptual
  ancestor of the `SourceSync`/`lastSyncedAt` fields already in the schema.
- **Manual fallback** — every automated path has a human-in-the-loop equivalent, because so many of
  the connectors above are `manual_assisted_workflow` or `institution_specific_integration_required`
  by nature, not by current limitation — manual fallback is a permanent architectural feature of this
  product, not a temporary gap to be automated away.
- **Full auditability** — every state change, automated or manual, writes an immutable `AuditEvent`
  row (already implemented as an application-layer append-only convention on the `AuditEvent` model),
  so a regulator, institution, or family member can reconstruct exactly what happened, when, and on
  whose authority.

### What the prototype's mock adapters actually implement today

None of the above queueing, retry, or reconciliation infrastructure exists in the running prototype.
Concretely, per `docs/API_CONTRACTS.md`'s description of the Route Handler surface:

- Each connector is a **simple synchronous function call** dressed as a route handler under
  `/api/connectors/[connectorKey]/...` — there is no message queue, no broker, no background worker,
  and no retry logic. A call either returns a canned/seeded-random response immediately or it doesn't
  happen at all.
- **No real queue** exists anywhere in the stack — SQLite (the prototype's database, per the schema's
  own design-choice comments) has no native queueing primitive, and none is layered on top for this
  prototype.
- Data returned is **canned or randomised-but-seeded** (using a fixed seed so the same demo scenario
  produces the same result on every run — important for a portfolio demo's reproducibility) rather
  than genuinely reflecting any real external system's current state, because no real external system
  is ever contacted.
- The one webhook-style endpoint category described in `docs/API_CONTRACTS.md`
  (`/api/webhooks/institution-status/...`) exists to demonstrate the *shape* of an idempotent,
  correlation-ID-bearing inbound event contract in code, but its "institution" caller is itself
  simulated — there is no real institution anywhere that could actually call it.
- `AuditEvent` writes are real and do happen on every state-changing mutation, in the same
  transaction as the mutation — this is the one piece of the "production intention" list above that
  the prototype actually implements in full, because it costs nothing extra to do correctly even
  without real external integrations.

This gap — real audit logging today, versus queueing/retry/reconciliation infrastructure that is
described but not built — is deliberate and should be represented as such in any conversation about
this prototype: the parts of the architecture that are genuinely about product/data integrity
(auditability, masked identifiers, banded balances, explicit provenance) are implemented now; the
parts that are genuinely about *scale and real external integration* (queues, retries, reconciliation
against live institutional systems) are designed and documented, not built, because building them
against connectors that don't yet call anything real would not demonstrate anything true.
