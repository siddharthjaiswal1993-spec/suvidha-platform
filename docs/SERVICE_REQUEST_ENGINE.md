# Service Request Engine

**Domain D of the lifelong citizen administration platform — the platform's main
differentiator.** Source models: `ServiceCatalogue`, `ServiceDefinition`,
`EligibilityRule`, `RequiredField`, `RequiredDocumentRule`, `ServiceChannel`,
`ServiceFee`, `InstitutionStatusMapping`, `ServiceRequest`, `Application`,
`RequestStatus`, `Submission`, `Appointment`, `InPersonTask`. See
`docs/TERMINOLOGY.md` §4 for the vocabulary and `docs/LIFE_EVENT_ORCHESTRATION.md`
for how a life event generates a batch of these.

## 1. Why this is the differentiator

Every institution already has its own way of taking a request — a portal, a branch
form, a call centre, an app. What none of them have is a shared, honest, citizen-owned
view of "everything I've asked any institution to do, and exactly where each one
stands." The Service Request Engine is that shared view: one `ServiceRequest` model
regardless of institution or category, always paired with the institution's own
untouched raw status, and always labelled with how it will actually get done
(`executionMethod`) rather than implying every request is a same-day digital action.

## 2. The full model chain

```
ServiceCatalogue (per institution)
      │
      ▼
ServiceDefinition ── EligibilityRule
      │              RequiredField
      │              RequiredDocumentRule
      │              ServiceChannel
      │              ServiceFee
      │              InstitutionStatusMapping
      │
      ▼
ServiceRequest (citizen-facing — carries normalizedStatus AND executionMethod)
      │
      ├── Application (institution-side: application number + raw official status)
      ├── RequestStatus[] (append-only timeline)
      ├── Submission[] (attempt log)
      ├── Appointment[] / InPersonTask[] (when in-person is required)
      ├── Renewal[], Signature[], Grievance[], Payment[], DelegatedTask[]
      └── InboxThread (1:1 — the request's own communication thread)
```

### `ServiceCatalogue` → `ServiceDefinition`

An institution publishes a `ServiceCatalogue` (e.g. "SBI Retail Banking Services"),
containing many `ServiceDefinition`s — one per distinct service the institution
offers, each carrying its own `serviceCategory`, `title`, `description`, `feeBand`,
`publishedSlaDays`, and `requiresInPerson` flag.

### The five things attached to a `ServiceDefinition`

| Child model | Purpose |
|---|---|
| `EligibilityRule` | A described + machine-evaluable condition (`conditionDefinition`, JSON, evaluated by helpers in the style of `src/lib/authority-engine.ts`) gating whether a citizen can even start this service |
| `RequiredField` | The data fields the request form needs (`fieldKey`, `label`, `isMandatory`) |
| `RequiredDocumentRule` | Which document categories are required and their `reusePolicy` — see `docs/DOCUMENT_AND_EVIDENCE_MODEL.md` §5 |
| `ServiceChannel` | The channels this service can be conducted through (`online_portal \| api \| deep_link \| in_person \| post \| agent_assisted`), one flagged `isPrimary` |
| `ServiceFee` | `label`, `amountBand`, `isMandatory` — banded, never a misleadingly exact figure at catalogue level |
| `InstitutionStatusMapping` | The design-time dictionary mapping this institution's own raw status strings onto our normalized vocabulary — see §4 |

## 3. `ServiceRequest` — the citizen-facing object

| Field | Purpose |
|---|---|
| `personId` | Whose request this is |
| `institutionRelationshipId` | Optional — which relationship (Domain B) this acts against |
| `serviceDefinitionId` | Which catalogue service this instantiates |
| `lifeEventId` | Optional — set when this request was generated as part of a `LifeEvent` plan |
| `title` | Citizen-facing summary |
| `normalizedStatus` | See §5 |
| `executionMethod` | See §6 |
| `userDeadlineAt` / `institutionDeadlineAt` | Two independent deadlines — the citizen's own target and the institution's SLA-derived one, which may differ |

## 4. Raw status is always preserved — never overwritten

This is the engine's central promise. Three places carry raw institutional status,
and none of them is ever discarded in favour of the normalized value:

1. **`InstitutionStatusMapping`** (design time) — the dictionary that says, e.g., SBI's
   raw string `"KYC Update In Process"` maps to normalized `under_verification`.
2. **`Application.officialStatusRaw`** (current state) — the institution's own latest
   status text for this specific request, refreshed as the institution reports
   changes, sitting right next to `normalizedStatus` on the same `ServiceRequest`.
3. **`RequestStatus.officialStatusRaw`** (history) — every entry in the append-only
   timeline carries both the normalized status *and* the raw text that produced it, so
   a citizen (or an auditor) can always see exactly what the institution actually said
   at each point, not just Suvidha's interpretation of it.

This matters because normalization is a UX convenience, not a claim of authority — if
an institution's raw status is ambiguous, contradictory, or simply worded oddly,
Suvidha shows both, and never lets the citizen believe an institution said something
it didn't.

## 5. Normalized status vocabulary

| Status | Meaning |
|---|---|
| `draft` | Citizen has started but not yet completed the request form |
| `information_required` | Missing a required field or document before it can be submitted |
| `ready_to_submit` | All required fields/documents present; awaiting citizen action to submit |
| `submitted` | Sent to the institution via the selected channel |
| `acknowledged` | Institution has confirmed receipt |
| `under_verification` | Institution is checking submitted information/documents |
| `additional_information_required` | Institution has asked for more — analogous to a deficiency request |
| `under_review` | Substantive review in progress |
| `approved` | Institution has approved the request |
| `rejected` | Institution has declined it |
| `partially_completed` | Some but not all of what was requested has been actioned |
| `completed` | Fully actioned |
| `escalated` | Raised beyond normal handling (SLA breach, citizen escalation) |
| `disputed` | Citizen disputes the outcome or the institution's stated status |
| `cancelled` | Citizen withdrew the request |
| `expired` | Request lapsed without action (e.g. missed a required window) |

## 6. Execution method vocabulary

Every `ServiceRequest` (and every `LifeEventAction`) carries exactly one of:

| Value | Meaning |
|---|---|
| `executable_via_api` | Suvidha can complete the action directly through a live, documented institution API |
| `initiable_via_integration` | Suvidha can start/track the action through a regulated partner integration, though the institution still performs the actual change |
| `deep_link_redirect` | Citizen is sent, prefilled where possible, to the institution's own portal/app to finish it |
| `generated_form_packet` | Suvidha generates the correct form/document packet; the citizen submits it (in person, by post, or via upload) |
| `assisted_digital_workflow` | A guided, multi-step digital process combining Suvidha screens and institution-side steps, without a single API completing it |
| `in_person_required` | No digital path exists; a branch/office visit is required |
| `requires_institution_approval` | The institution must exercise discretionary approval beyond simple processing |
| `requires_legal_intervention` | Only resolvable through a legal/court process outside Suvidha's scope |
| `unsupported` | Not currently supported by the platform for this institution/service combination |

`executionMethod` is never allowed to imply speed or certainty it can't back up — a
request marked `assisted_digital_workflow` is presented with realistic expectations,
not as "instant."

## 7. Service-request categories (`ServiceDefinition.serviceCategory`)

| # | Category | Typical use |
|---|---|---|
| 1 | `new_application` | Opening a new account, applying for a fresh licence |
| 2 | `correction` | General field correction not covered by a more specific category |
| 3 | `address_update` | Change of address on a specific institution's record |
| 4 | `name_update` | Legal name correction (marriage, spelling, court order) |
| 5 | `contact_update` | Mobile/email update |
| 6 | `nominee_update` | Change/add a nominee |
| 7 | `joint_holder_update` | Add/remove a joint holder |
| 8 | `account_closure` | Close an account/policy/connection |
| 9 | `account_reopening` | Reactivate a dormant/closed account |
| 10 | `document_renewal` | Renew an expiring document (non-licence) |
| 11 | `record_linking` | Link two records (e.g. PAN–Aadhaar, account–mobile) |
| 12 | `duplicate_resolution` | Resolve a duplicate record at an institution |
| 13 | `refund_request` | Request a refund |
| 14 | `benefit_application` | Apply for a scheme/benefit |
| 15 | `tax_rectification` | Correct a tax filing/assessment error |
| 16 | `grievance` | File a grievance |
| 17 | `appeal` | Appeal a decision |
| 18 | `complaint` | General complaint |
| 19 | `claim` | An insurance/benefit claim (living-person context; distinct from the Legacy & Succession `Claim` model, see `docs/LEGACY_AND_SUCCESSION.md`) |
| 20 | `transmission` | Transfer of securities/holdings between living parties |
| 21 | `property_mutation` | Update property records after a transaction |
| 22 | `licence_renewal` | Renew a government licence |
| 23 | `certificate_request` | Request an official certificate |
| 24 | `service_cancellation` | Cancel a previously requested service |

## 8. Worked example, end to end: address update at a bank

**Setup — `ServiceDefinition`**

| Field | Value |
|---|---|
| Catalogue | "State Bank of India — Retail Banking Services" |
| `serviceCategory` | `address_update` |
| `title` | "Update registered address" |
| `feeBand` | "Free" |
| `publishedSlaDays` | 7 |
| `requiresInPerson` | `false` |

- `RequiredField`: new address line 1/2, city, state, pincode (all mandatory)
- `RequiredDocumentRule`: `documentCategory=address`, mandatory,
  `reusePolicy=reusable_if_verified_and_current`
- `ServiceChannel`: `online_portal` (primary), `in_person`
- `EligibilityRule`: "Account must be active, not dormant or closed"
- `InstitutionStatusMapping` examples: `"Request Received"` → `acknowledged`;
  `"KYC Update In Process"` → `under_verification`; `"Address Updated Successfully"` →
  `completed`

**Instance — `ServiceRequest`**

- `institutionRelationshipId` → the citizen's SBI Savings Account relationship
  (Domain B)
- `executionMethod` = `initiable_via_integration` (SBI's `bank` connector is
  `regulated_partner_integration_required` — Suvidha can initiate and track the
  request, but SBI's own KYC team performs the actual update)
- `title` = "Update address — SBI Savings Account"

**Timeline (`RequestStatus`, oldest first)**

| `occurredAt` | `normalizedStatus` | `officialStatusRaw` | Note |
|---|---|---|---|
| Day 0 | `draft` | — | Citizen started the form |
| Day 0 | `information_required` | — | Missing address proof; resolved by reusing a current, verified Aadhaar document per the document-rules engine |
| Day 0 | `ready_to_submit` | — | All fields and documents present |
| Day 0 | `submitted` | — | `Submission` row logged, `channelUsed="online_portal"`, `outcome="simulated_success"` |
| Day 1 | `acknowledged` | "Request Received" | `Application.applicationNumber` assigned, e.g. `SBI-ADR-2026-118432` |
| Day 3 | `under_verification` | "KYC Update In Process" | |
| Day 6 | `completed` | "Address Updated Successfully" | |

**`Application`**

| Field | Value |
|---|---|
| `applicationNumber` | `SBI-ADR-2026-118432` |
| `officialStatusRaw` | "Address Updated Successfully" (mirrors the final `RequestStatus` entry) |
| `channelUsed` | `online_portal` |

Once `completed`, the citizen is prompted to confirm, which — if this address change
was raised in response to an open `ProfileConflict` — advances that conflict to
`resolved_via_correction_request` (`docs/MASTER_PROFILE_AND_DISCREPANCIES.md`), and the
next successful `SourceSync` on the SBI relationship refreshes
`registeredAddressSnapshot` with a fresh `ProfileFieldValue`
(`provenance=verified_by_source`).
