# Institutional Relationship Graph

**Domain B of the lifelong citizen administration platform.** Source models:
`InstitutionRelationship`, `SourceSync`, plus the already-existing `Connector` and
`Integration` models (Legacy & Succession domain, reused here rather than duplicated).
See `docs/TERMINOLOGY.md` §4 for the vocabulary and `docs/DATA_MODEL.md` for the
full entity-relationship narrative.

## 1. What problem this domain solves

A citizen's life is distributed across dozens of institutions — a government identity
record, a driving licence, three or four bank accounts, an employer, an insurer, a
mutual fund folio, an electricity connection, a business registration. Today each of
these lives only inside that institution's own system, and the citizen has no single
place to see the whole set, notice that one of them has gone stale, or understand what
"active" even means for something they haven't touched in six years.

The Institutional Relationship Graph is Suvidha's answer: **one row per (citizen,
institution) relationship**, regardless of what kind of relationship it is, sitting
underneath every other domain (service requests, life events, documents, communication
all hang off this graph). It is explicitly a **read/reference layer**, not a system of
record — the institution's own system remains authoritative; see the "One citizen-
controlled command centre, multiple authoritative systems of record" principle in
`docs/PRODUCT_VISION.md`.

## 2. The `InstitutionRelationship` model

| Field | Type | Purpose |
|---|---|---|
| `personId` / `institutionId` | FK | The two ends of the relationship |
| `relationshipType` | string | See §3 below |
| `label` | string | Human display name, e.g. `"HDFC Bank Savings Account"` |
| `referenceNumberMasked` | string? | Masked reference (never a raw identifier — see §4) |
| `identifierUsed` | string? | Which `PersonIdentifier.idType` was used to establish/match the relationship (e.g. `aadhaar_last4`, `pan`) |
| `linkedAssetId` | string? (unique) | Optional 1:1 link to an `Asset` row — see §5 |
| `status` | string | `active \| inactive \| dormant \| closed \| under_verification` |
| `registeredAddressSnapshot` | string? | Last-known address on file *at that institution*, as a point-in-time snapshot |
| `registeredNomineeSummary` | string? | Human-readable summary, e.g. `"Spouse — 100%"`; the structured record lives in `Nomination` (Legacy & Succession domain) when the relationship is a financial holding |
| `renewalDueAt` | DateTime? | Next known renewal/expiry milestone for licences and similar relationships |
| `connectorId` | FK? | Which `Connector` type integrates this relationship — see §6 |
| `consentRecordId` | FK? | Which `ConsentRecord` authorised establishing/syncing this relationship |
| `verificationStatus` | string | `unverified \| verified \| verification_failed` |
| `lastSyncedAt` | DateTime? | Timestamp of the most recent sync attempt that touched this relationship |
| `scenarioTag` | string? | Demo-seeding aid |

Note the distinction between two verification concepts that are easy to conflate:
`InstitutionRelationship.verificationStatus` describes whether *the relationship
itself* (the fact that this citizen has this account/licence/registration at this
institution) has been confirmed, whereas `ProfileFieldValue.provenance` (Domain A,
see `docs/MASTER_PROFILE_AND_DISCREPANCIES.md`) describes whether one *field value*
sourced from that relationship has been confirmed. A relationship can be `verified`
while individual field values sourced from it are still `user_entered` (e.g. the
citizen linked the account correctly but typed the registered address themselves
before the first sync completed).

## 3. `relationshipType` taxonomy

| Value | Meaning | Typical `label` examples |
|---|---|---|
| `government_identity` | A foundational identity record | Aadhaar, PAN |
| `government_licence` | A licence or registration issued by government | Driving Licence, Vehicle Registration (RC) |
| `financial_account` | A bank, depository, mutual fund, insurance, or retirement holding | Savings Account, Demat Account, Life Insurance Policy, EPF Account |
| `employer` | An employment relationship | "Employer: Acme Pvt Ltd" |
| `utility` | A utility connection | Electricity Connection, Piped Gas Connection |
| `business` | A business registration the citizen owns/operates | GST Registration, Shop & Establishment Licence |
| `education` | An education-institution relationship | University enrolment record, alumni record |

Only `financial_account` (and occasionally `business`, when the business interest is
itself a tracked holding) relationships are expected to carry a `linkedAssetId`. A
`government_identity` or `employer` relationship has no corresponding `Asset` — there
is nothing there to value, inherit, or claim against.

## 4. What the graph surfaces to a citizen

The citizen-facing relationship card shows exactly the fields designed for that
purpose, never a raw identifier:

| Surfaced field | Source field | Note |
|---|---|---|
| Institution name | `Institution.name` | |
| Relationship type | `relationshipType` | Shown as a plain-language label, e.g. "Bank Account" |
| Masked reference number | `referenceNumberMasked` | Never the real account/policy number — matches the "no full identifiers" safety principle |
| Status | `status` | active / inactive / dormant / closed / under verification |
| Registered address on file | `registeredAddressSnapshot` | Explicitly labelled as "last known at this institution," not the citizen's current address |
| Registered nominee (summary) | `registeredNomineeSummary` | Summary only; full nominee detail requires the underlying `Nomination` record and appropriate consent scope |
| Renewal / expiry due | `renewalDueAt` | Feeds `Deadline` rows and reminders |
| Verification status | `verificationStatus` | Communicates trust level of the relationship itself |
| Last synced | `lastSyncedAt` | Always shown with a timestamp, never presented as "live" |

## 5. `linkedAssetId` — one holding, two domain views

Rather than let the Legacy & Succession domain's estate/asset inventory and the
lifelong-administration domain's relationship graph each keep their own copy of "my
HDFC savings account," a `financial_account` relationship optionally points at the
pre-existing `Asset` model via a unique `linkedAssetId` foreign key (and `Asset`
carries the inverse `institutionRelationship` back-relation). This means:

- **One underlying record.** The account's category (`bank_deposit`, `mutual_fund`,
  `life_insurance`, ...), masked account number, institution, and provenance
  (`self_reported \| connector_verified \| document_verified`) live once, on `Asset`.
  `AssetHolding`, `Nomination`, `JointHolder`, and `BeneficiaryDesignation` all still
  hang off that same `Asset` row exactly as they did before this domain existed.
- **Two lenses on the same fact.** The Legacy & Succession domain reads the `Asset`
  when building an estate inventory or a claim (`ClaimAsset`); the lifelong-
  administration domain reads the same `Asset` through `InstitutionRelationship` when
  showing the citizen's day-to-day account list, sync status, or when generating a
  `ServiceRequest` (e.g. an address-correction request against that specific account).
- **No dual-maintenance risk.** A nominee update processed through a `ServiceRequest`
  updates the one `Nomination` row the `Asset` already owns; both domains see it
  immediately because both point at the same `Asset`, not at two independent copies.

A `government_identity`, `government_licence`, `employer`, `utility`, or `education`
relationship simply leaves `linkedAssetId` null — there is no holding to consolidate.

## 6. `Connector` / `Integration` — how a relationship actually syncs

`Connector` (already defined in the Legacy & Succession half of the schema) is the
catalog of integration *types* — `bank`, `depository`, `mutual_fund`, `insurance`,
`epfo`, `account_aggregator`, `digilocker`, `land_records`, `vehicle_records`,
`employer_benefits`, and so on — each carrying an honest `integrationLabel`
(`real_public_integration_documented \| regulated_partner_integration_required \|
institution_specific_integration_required \| manual_assisted_workflow \|
prototype_simulation \| future_policy_dependency`). See `docs/INTEGRATIONS.md` for the
per-connector real-vs-mocked classification.

`Integration` is the institution-specific activation of a `Connector`
(`active \| disabled \| sandbox`), and `InstitutionRelationship.connectorId` records
which connector type actually supplies sync data for that particular relationship.
This is why the graph's sync behaviour differs relationship by relationship: a
`financial_account` relationship synced through a `regulated_partner_integration_required`
connector behaves very differently in the UI from a `government_licence` relationship
synced through a `manual_assisted_workflow` connector (the latter typically means "the
citizen keeps this current by re-confirming it themselves periodically," not "this
refreshes automatically").

## 7. `SourceSync` and graceful partial-sync failure

Every sync attempt against a relationship's connector is logged as a `SourceSync` row:

| Field | Meaning |
|---|---|
| `status` | `success \| partial_failure \| failed` |
| `startedAt` / `completedAt` | Attempt window |
| `recordsSynced` | How many fields/records were actually refreshed this run |
| `failureReason` | Human-readable cause, when applicable |

The design principle: **a sync failure never wipes or fabricates data.**

- On `success`, the relationship's `registeredAddressSnapshot`,
  `registeredNomineeSummary`, `status`, and any sourced `ProfileFieldValue` rows are
  refreshed, and `lastSyncedAt` advances to `completedAt`.
- On `partial_failure` (e.g. the connector returned account status and balance
  category successfully but the nominee-detail sub-call timed out), only the fields
  actually returned are refreshed; everything else keeps its last known value with its
  *old* `lastSyncedAt`-derived staleness intact. The UI shows a soft warning ("Nominee
  details last confirmed 94 days ago — retry sync") rather than silently presenting
  stale data as current.
- On `failed`, nothing changes and `lastSyncedAt` does not advance; the relationship
  card shows the previous good state with an explicit "last synced" timestamp so the
  citizen can judge staleness themselves. The platform never guesses or interpolates
  a value it could not actually retrieve.

This mirrors the platform-wide rule that Suvidha never silently modifies a record or
presents an unverified inference as fact.

## 8. Worked example: "State Bank of India — Savings Account"

**`InstitutionRelationship` row**

| Field | Value |
|---|---|
| `person` | Anita Rao |
| `institution` | State Bank of India |
| `relationshipType` | `financial_account` |
| `label` | "State Bank of India — Savings Account" |
| `referenceNumberMasked` | `"XXXXXXXX4821"` |
| `identifierUsed` | `pan` |
| `linkedAssetId` | → `Asset` (category `bank_deposit`, `maskedAccountNumber` `"...4821"`, `provenance` `connector_verified`) |
| `status` | `active` |
| `registeredAddressSnapshot` | "Flat 12B, Sunrise Apartments, Andheri East, Mumbai 400069" |
| `registeredNomineeSummary` | "Spouse — 100%" |
| `renewalDueAt` | `null` (savings accounts do not expire) |
| `connectorId` | → `Connector(key="bank", integrationLabel="regulated_partner_integration_required")` |
| `consentRecordId` | → `ConsentRecord(purpose="asset_discovery", status="granted")` |
| `verificationStatus` | `verified` |
| `lastSyncedAt` | 2026-07-19 06:02 IST |

**Recent `SourceSync` history for this relationship**

| Started | Status | Records synced | Note |
|---|---|---|---|
| 2026-07-19 06:00 | `success` | 4 | Address, status, balance band, nominee summary all refreshed |
| 2026-07-12 06:00 | `partial_failure` | 2 | `failureReason`: "Nominee sub-service timeout"; address and status still refreshed |
| 2026-07-05 06:00 | `success` | 4 | — |

**What the citizen sees on the relationship card:** institution name and a bank icon,
"Savings Account," reference ending in `4821`, an "Active" pill, the registered
address with a "last confirmed 19 Jul 2026" caption, "Nominee: Spouse — 100%" with the
same caption, a verified badge, and a small "Synced 3 hours ago" line. Nothing on the
card claims to be a live balance feed or a legally authoritative record — it is a
faithful, timestamped mirror of what SBI's own systems most recently reported through
the `bank` connector.
