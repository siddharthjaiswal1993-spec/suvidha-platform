# Privacy Design

This document specifies how Suvidha's Legacy, Incapacity, Bereavement & Succession domain handles
personal data: consent receipts, purpose limitation, data minimisation, progressive disclosure,
identifier masking, grievance/correction handling, retention classification, and this prototype's
synthetic-data-only policy. It complements `docs/SECURITY.md` (which covers protection mechanisms)
and `docs/TERMINOLOGY.md` (which is the vocabulary source of truth — this document uses
**Data Principal** only in this data-protection context, per that file's guidance).

## 1. Consent receipts

Every consent-based data flow produces a durable, inspectable receipt — not just a boolean flag:

- **`ConsentRecord`** — the grant itself: `personId` (whose data), `purpose`, optional
  `connectorId` (which integration it applies to), `status` (`granted`/`revoked`/`expired`),
  `grantedAt`/`revokedAt`/`expiresAt`.
- **`ConsentArtefact`** — the durable receipt representation of a consent event: a unique
  `receiptNumber`, a `scopeSummary` in plain language, and `issuedAt`. Per the schema's own
  comment, this is "kept even after revocation" — a citizen (or an Auditor) can always answer "what
  did I actually consent to, and when" even years later, independent of whether that consent is
  still active.
- **`ConsentScope`** — the granular, purpose-specific scoping of a `ConsentRecord`: which
  `ConsentPurpose` (e.g. `asset_discovery`, `tax_notice_access`, `document_fetch`,
  `profile_sync`), which institution, which specific entity (`scopedEntityLabel` — display only,
  never a raw identifier), and a validity window (`validFrom`/`validTo`).
- **`DataShare`** — the actual disclosure log: what was shared, with whom (`sharedWithLabel`),
  which fields (`fieldsShared` — a JSON array of field *keys*, never raw values), and when. This is
  the record that lets a citizen (or a grievance investigation) answer not just "what did I
  consent to" but "what was actually disclosed under that consent, to whom, and exactly which
  fields" — the two questions are deliberately kept separate because consent scope and actual
  disclosure can diverge (e.g. a scope permits three fields but only one was ever actually shared).

A consent receipt is generated at the moment consent is granted, not retroactively constructed if
someone later asks — `ConsentArtefact.issuedAt` should always be contemporaneous with
`ConsentRecord.grantedAt`.

## 2. Purpose limitation

- Every `ConsentRecord` and `ConsentScope` carries an explicit `purpose`/`ConsentPurpose` — data
  accessed under a `document_fetch` consent is not repurposed for, say, marketing or unrelated
  cross-selling, and the schema has no field anywhere that would let a purpose-scoped grant be
  silently reused for a different purpose without a new `ConsentScope`.
- Death-event identity matching (`DeathEventMatch`) and institution propagation
  (`docs/WORKFLOWS.md` §2.3–2.4) are treated as a distinct, narrower legal basis from ordinary
  consent — registrar/institution death-verification is a legitimate function in its own right,
  but the data resolved through it is used **only** for death-event resolution and claims
  processing, never repurposed for unrelated profiling, marketing, or credit decisioning.
- Asset-discovery (`docs/WORKFLOWS.md` §3.2) is explicitly bounded: it draws only on relationships
  already established (the deceased's own prior linkage, or a confirmed `DeathEventMatch`), not an
  open search of the financial system under the umbrella of "the family reported a death" — this is
  purpose limitation applied structurally, not just as a stated policy, since the discovery query
  itself only ever traverses existing linked rows.

## 3. Data minimisation

- **Identifiers:** `PersonIdentifier` never stores a raw Aadhaar/PAN/passport/driving-licence/
  voter-ID/ration-card/demat-client-ID value — only `maskedValue` for display and `valueHash` for
  matching (§4 elaborates). This is the single most load-bearing minimisation control in the
  schema.
- **Balances:** `Liability.outstandingAmountBand` and `Payment.amountBand` store bands, not exact
  figures, in every context except the account holder's own fully-authorised view and the actual
  institution-side settlement pipeline.
- **Document reuse over re-collection:** `SubmittedEvidence.reusedFromClaimId` lets a claimant's
  already-verified, still-current document satisfy a second institution's requirement without
  re-uploading and re-exposing it — minimising both the number of copies in existence and the
  number of times the claimant must re-transmit sensitive material.
- **Audit metadata scrubbing:** `AuditEvent.metadata` is documented as carrying "no sensitive raw
  identifiers" — an audit trail proves that a check happened and against what masked/hashed
  reference, without itself becoming a second, less-guarded copy of the sensitive data.
- **`DataShare.fieldsShared` is field *keys*, never values** — the disclosure log proves what
  categories of information moved without duplicating the information itself into yet another
  table.

## 4. Masked identifiers everywhere

- **What is stored:** `PersonIdentifier.maskedValue` (e.g. `"XXXX XXXX 1234"`) for display, and
  `PersonIdentifier.valueHash` — a **salted** hash — for equality matching during identity
  resolution and death-event matching. The raw identifier is never persisted anywhere in the
  schema; it exists only transiently at the point of entry (verification API call, DigiLocker
  fetch simulation) and is discarded once the masked value and hash are derived.
- **Why salted, not plain hash:** a plain (unsalted) hash of a highly structured, relatively
  low-entropy identifier like a PAN would be vulnerable to precomputation/dictionary attack given
  how few realistic PAN values exist in a bounded search space; salting per record (or per tenant)
  defeats that.
- **Matching, not authentication:** `valueHash` is used strictly for probabilistic/deterministic
  identity-resolution matching (`docs/AUTHORITY_RULES.md` dimension "required legal instrument" and
  `docs/WORKFLOWS.md` §2.3's confidence scoring) — it is never used as a login credential, and
  Aadhaar/PAN are never treated as a "master key" granting access to records (an explicitly
  prohibited framing per `docs/TERMINOLOGY.md` §5).
- **Display everywhere else:** any screen that shows an identifier at all — to the identifier's own
  owner, to a Verification Officer reviewing a match, to an Auditor — shows `maskedValue`, never a
  reconstructed or looked-up raw value, because no raw value exists to look up.

## 5. Granular disclosure / progressive reveal

Suvidha does not grant "all-or-nothing" visibility once someone is recognised as having *some*
legitimate interest in an estate. Disclosure widens only as verified role and specific consent/
authority basis widen:

| Stage | What is visible |
|---|---|
| Informant reporting a death (`docs/WORKFLOWS.md` §2.2) | Nothing about the deceased's holdings — reporting a death is not itself a disclosure trigger |
| Trusted Contact under a narrow `AccessPolicy` (e.g. `emergency_contacts_only`) | Only what that specific policy scopes — never balances, never full inventory |
| Trusted Contact under `full_inventory_no_balances` | Asset categories and institution names, explicitly never balances (the policy name states this constraint directly) |
| Uninvited family-member claimant, identity/relationship verified but role not yet institution-confirmed | General process guidance, document checklists; not the deceased's specific holdings beyond what discovery already scoped to a legitimate basis (see `docs/WORKFLOWS.md` §3.2) |
| Claimant with a confirmed role on a specific `Claim` | Full detail of *that claim's* asset(s) only |
| Executor/Administrator overseeing the whole estate, once confirmed | Estate-wide summary, still without exposing unrelated claimants' personal verification detail beyond what the executor role legitimately needs |
| Auditor | Full audit trail (`AuditEvent`), for oversight purposes only — not a general browsing right over citizen content |

A claimant does **not** automatically see all balances just by reporting a death — this is a
structural, not merely stated, property: no query path in the intended design serves exact balance
figures to a party whose role/consent basis has not specifically been confirmed to justify it, and
even then, the served figure is the banded value by default.

## 6. Grievance and correction workflow

- **Data-quality grievance/correction (Data Principal rights):** a citizen may challenge an
  incorrect field on their own record (a wrong address, a stale nomination, an incorrect
  relationship record) through the standard `Grievance` model (`subject`, `description`,
  `status: open → in_progress → resolved/escalated`), with `Escalation`/`Appeal` available for
  unresolved cases (escalated to a Nodal Officer/Ombudsman-equivalent, per
  `escalationType = "grievance_escalation"`, or a formal `Appeal` with `groundsForAppeal`).
- **The specific, higher-stakes correction case — false-death reactivation:** handled by the
  dedicated `DeathEventCorrection` model and workflow (`docs/WORKFLOWS.md` §4.3), not the general
  `Grievance` path, because of its severity and time-sensitivity — a living person incorrectly
  marked deceased needs an expedited, clearly-signposted channel to a human reviewer, not a queue
  shared with routine complaints.
- **Profile-level correction (lifelong-administration domain):** `ProfileConflict` records a
  detected disagreement between two `ProfileFieldValue` rows and is never auto-resolved by the
  platform picking a winner — resolution proceeds via `resolved_via_correction_request`, meaning a
  citizen actively corrects the record at the source (or the platform helps them raise that
  correction with the institution whose value is wrong), consistent with the platform's rule that
  it never edits a government/institution database directly.
- **Grievance officer role:** a dedicated persona (`Grievance Officer`) exists specifically so that
  correction/complaint handling is not left to the same officer deciding claims — separating
  "did we get this right" oversight from "should this claim be approved" decision-making.

## 7. Retention classification

| Class | Examples | Retention approach |
|---|---|---|
| Regulatory/audit-critical | `AuditEvent`, `Decision`, `Payment`, `Transfer`, `Mutation`, `ConsentArtefact` | Retained per applicable financial/claims-record regulatory periods (RBI/SEBI/IRDAI/PFRDA-specific, institution-configured); never deleted early, survives soft-deletion of the underlying `Person`/`Claim` |
| Legal-hold-eligible | Anything tied to an open `Dispute`, `CourtOrder`, or unresolved `FraudSignal` | Retention deferred until the hold is lifted (see `docs/SECURITY.md` §12) |
| User-controlled, non-mandatory | Draft `EstatePlan` content, unused `Asset`/`Liability` entries, `ReviewReminder`s | Soft-deleted on request (`deletedAt` set), physically purged on a defined schedule absent a hold |
| Consent history | `ConsentRecord` (even once `revoked`/`expired`), `ConsentArtefact`, `DataShare` | Retained as a durable receipt/disclosure history regardless of current consent validity — this is deliberate: proving what was once consented to and disclosed is itself a privacy-protective function |
| Demo/synthetic | Anything with `isDemoAccount`, `isDemoDocument`, or `scenarioTag` set | Freely disposable; carries no real citizen data and no retention obligation |

## 8. Synthetic-data-only policy for this demo

This prototype's data is entirely synthetic, and this is treated as a hard product rule, not an
incidental fact:

- **No real Aadhaar, PAN, bank account, policy, or demat account numbers anywhere** — in seed data,
  in documentation examples, in screenshots, or in test fixtures. Every example identifier in this
  documentation set (e.g. `"XXXX XXXX 1234"`) is illustrative formatting, not a real value.
- **`isDemoAccount` on `User`** (default `true`) and **`isDemoDocument` on `LegalDocument`**
  (default `true`) mark demo content structurally, so the application layer can — and, in a real
  deployment path, must — visibly distinguish demo data from anything real, rather than relying on
  developers to remember.
- **Required UI treatment (specification for the application layer):** any screen displaying demo
  data must carry a clear, persistent "Demo Data" indicator — not a one-time toast, not fine print —
  so a viewer (including a prospective employer or reviewer of this portfolio project) can never
  mistake a seeded scenario for a real citizen record. This is a requirement the application layer
  is expected to implement wherever `isDemoAccount`/`isDemoDocument`/`scenarioTag` is `true`, which,
  in this prototype, is everywhere.
- **No live external data sources:** per `00_EXECUTIVE_SUMMARY.md`, all institutions and connectors
  are synthetic; no real institution's API, portal, or data is ever accessed by this codebase.
- **Consequence for this document's own examples:** every masked value, band, or scenario named
  anywhere in this documentation set is fictional and should not be mistaken for guidance about any
  real person's actual identifiers or holdings.

## 9. Summary: privacy properties this design guarantees structurally (not just by policy)

1. A raw Aadhaar/PAN/other government identifier cannot be retrieved from this database, because it
   was never written to it (`PersonIdentifier`).
2. An exact balance cannot be served to an unauthorised viewer via the shared-view fields, because
   those fields only ever hold a band (`amountBand`, `outstandingAmountBand`).
3. A death cannot become publicly visible through normal application behaviour, because the
   controlling flag defaults to and must remain `false` (`isPubliclyVisible`).
4. A consent's history cannot be lost on revocation, because the receipt (`ConsentArtefact`) is
   retained independent of the grant's current status.
5. A claimant cannot see the whole estate merely by asserting a role, because visibility is scoped
   per confirmed role/claim, not per estate, until a broader role (e.g. executor) is itself
   confirmed.
