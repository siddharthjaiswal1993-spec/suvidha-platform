# Document & Evidence Model

**Implementation status** (authoritative record: `src/config/capabilities.ts`
→ `document_evidence_hub`): upload, a document detail page (verification history, renewal,
reuse-as-evidence history), sharing with revocation, and deletion are all real, e2e-tested writes
at `/documents` and `/documents/[id]`. No real file bytes are ever stored (`LegalDocument.isDemoDocument`)
and there is no DigiLocker fetch.

**Domain C of the lifelong citizen administration platform.** Source models:
`DocumentProfile`, `DocumentShare`, `Renewal`, `Signature` — all extending the
already-existing `LegalDocument` model from the Legacy & Succession domain rather than
duplicating a second document store. See `docs/TERMINOLOGY.md` §4 and
`docs/SERVICE_REQUEST_ENGINE.md` for how `RequiredDocumentRule` consumes this domain.

## 1. Why this extends `LegalDocument` instead of replacing it

`LegalDocument` already existed for the estate/succession domain — a will, a trust
deed, a death certificate, a court order. Rather than build a second, competing
"document" concept for everyday life-administration paperwork (a PAN card, a rent
agreement, an insurance policy schedule, a payslip), Suvidha extends the same model
with a 1:1 companion, `DocumentProfile`, that adds the metadata everyday documents need
and estate documents mostly don't (issuer, expiry, sharing history, renewal tracking).

```
LegalDocument (existing)                    DocumentProfile (new, 1:1)
  id, ownerPersonId, documentType,    ──►      issuer, issueDate, expiryDate,
  fileLabel, isDemoDocument,                   documentCategory, digitalSignatureStatus,
  uploadedAt, deletedAt                        permittedUses
                                                   │
                                    ┌──────────────┼──────────────┐
                                    ▼              ▼              ▼
                              DocumentShare     Renewal        (Signature attaches
                           (sharing/revocation  (expiry →       to either the
                              history)          renewal SR       LegalDocument or a
                                                 lifecycle)       ServiceRequest)
```

A `LegalDocument` used purely in the estate/succession domain (a will referenced by a
`WillRecord`, a death certificate referenced by `DeathEventEvidence`) simply has no
`DocumentProfile` row — the extension is optional, added only when a document
participates in everyday life-administration flows.

## 2. `DocumentProfile` fields

| Field | Purpose |
|---|---|
| `issuer` | Who issued it, e.g. "UIDAI", "Income Tax Department", "HDFC Life" |
| `issueDate` / `expiryDate` | Drives the `Renewal` lifecycle (§4) |
| `documentCategory` | One of the 15 categories in §3 |
| `digitalSignatureStatus` | `signed_simulated \| unsigned \| not_applicable` |
| `permittedUses` | JSON array of purpose keys — which purposes this document is allowed to be shared for (ties into `ConsentPurpose`, Domain H) |

## 3. Document categories

| Category | Typical examples |
|---|---|
| `identity` | Aadhaar, PAN, voter ID card |
| `address` | Utility bill, rent agreement (as address proof) |
| `tax` | Form 16, ITR acknowledgement, tax notice response |
| `banking` | Bank statement, KYC form |
| `investments` | Demat CMR copy, mutual fund folio statement |
| `insurance` | Policy schedule, premium receipt |
| `employment` | Offer letter, relieving letter, payslip |
| `education` | Degree certificate, marksheet |
| `property` | Sale deed, property tax receipt |
| `vehicle` | Registration certificate (RC), insurance certificate |
| `health` | Discharge summary, health insurance card |
| `business` | GST certificate, shop licence |
| `family` | Marriage certificate, birth certificate |
| `legal` | Court order, affidavit |
| `estate` | Will, succession certificate — the bridge category to the Legacy & Succession domain |

## 4. `DocumentShare`, `Renewal`, `Signature`

### `DocumentShare` — every disclosure, logged and revocable

| Field | Purpose |
|---|---|
| `sharedWithLabel` | Human label, e.g. `"HDFC Bank — address update request"` or `"Daughter (Family Assistant)"` |
| `purpose` | Why it was shared |
| `sharedAt` / `revokedAt` | Durable audit trail — a share is never deleted, only marked revoked |

This is the document-specific counterpart to the general `DataShare` audit log in
Domain H (`docs/DELEGATED_ACCESS.md`) — the same "log every disclosure, allow
revocation, never silently retract data already sent" discipline applied specifically
to document-level sharing (e.g. sharing a PAN card image for one service request).

### `Renewal` — expiry-to-renewal lifecycle

| Field | Purpose |
|---|---|
| `dueDate` | When the document expires |
| `status` | `upcoming \| requested \| completed \| overdue` |
| `serviceRequestId` | Once the citizen acts, links to the `ServiceRequest` that carries the actual renewal application (`serviceCategory = document_renewal` or `licence_renewal`) |

A `Renewal` row is created once a `DocumentProfile.expiryDate` comes within a
configured lead window. It sits `upcoming` until the citizen starts the renewal
(`requested`, now linked to a `ServiceRequest`), then tracks through to `completed`
once that request's `normalizedStatus` reaches `completed`. If the due date passes
with no linked request, it flips to `overdue` and feeds a `Deadline` (Domain F).

### `Signature` — self-attestation and simulated e-sign

| Field | Purpose |
|---|---|
| `legalDocumentId` / `serviceRequestId` | Optional — a signature can attach to either a document or a specific service request |
| `signedByPersonId` | Who signed |
| `method` | `self_attestation_simulated \| esign_simulated` |
| `signedAt` | Timestamp |

Both methods are explicitly named `*_simulated` in the schema — this prototype does
not integrate with a real e-signature or Aadhaar e-sign provider. A `Signature` row
represents "the citizen affirmed this is true / authorised this submission," which is
a legitimate and common requirement across many `ServiceDefinition`s, without claiming
cryptographic non-repudiation the prototype doesn't actually implement.

## 5. The document-rules-engine concept

`RequiredDocumentRule` (Domain D, attached to a `ServiceDefinition`) declares, for a
given service, which `documentCategory` is required and its `reusePolicy`
(`reusable_if_verified_and_current \| always_fresh_required`). The document hub's job
is to answer, for each required category, one of five outcomes when a
`ServiceRequest` is being assembled:

| Outcome | Condition | What happens next |
|---|---|---|
| **Reusable** | An existing `DocumentProfile` of the required category exists, is not expired (`expiryDate` in the future or null), was verified by a source (not just self-declared), and `reusePolicy = reusable_if_verified_and_current` | Attached automatically; citizen just confirms |
| **Outdated** | A matching document exists but `expiryDate` has passed, or its underlying `issueDate` predates the service's own freshness threshold | Citizen prompted to renew (creates a `Renewal`) or fetch a fresh copy before proceeding |
| **Inconsistent** | A matching document exists, is current, but a field it attests to (e.g. the address printed on it) is the losing side of an open `ProfileConflict` | Citizen prompted to resolve the underlying conflict (`docs/MASTER_PROFILE_AND_DISCREPANCIES.md`) before the document can be treated as reliable evidence |
| **Needs self-attestation** | No institution-verified document exists, but the service accepts a citizen affidavit for this category | A `Signature` (`self_attestation_simulated`) is collected instead of a hard document |
| **Needs a fresh original** | `reusePolicy = always_fresh_required`, or no matching document of any vintage exists | Citizen directed to obtain/upload a new original, often meaning `requiresInPerson` or a `generated_form_packet` execution method for that step |

This logic is what lets a `ServiceRequest`'s checklist say, correctly, "we already have
your verified address proof from March, no need to re-upload" in one case and "this
service always needs a fresh, dated original — please obtain one" in another, rather
than asking for every document fresh every time or, worse, silently reusing something
stale.

## 6. DigiLocker-style integration is simulated, not live

`Connector` includes a `digilocker` key, and `IdentityRecord.method` includes
`digilocker_simulated`. **This prototype does not call a real DigiLocker API.** Every
document "fetched via DigiLocker" in a demo scenario is a seeded, synthetic record —
`LegalDocument.isDemoDocument` defaults to `true` and no real file bytes are ever
stored (`fileLabel` is a synthetic filename only). Wherever the product surface
suggests "Fetch from DigiLocker," the underlying behaviour is a scripted simulation
of what that integration would return, clearly labelled as such in
`docs/INTEGRATIONS.md`'s real-vs-mocked table. A production build of Suvidha would
need an actual DigiLocker API partnership (or an equivalent verified-document
exchange), which is a real, documented integration path — just not one this prototype
implements.
