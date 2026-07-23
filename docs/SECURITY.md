# Security Design

This document specifies Suvidha's security architecture for the Legacy, Incapacity, Bereavement &
Succession domain (principles apply platform-wide). It is written honestly for a portfolio-quality
prototype: where the current SQLite/mock-auth implementation falls short of what a real deployment
would require, that gap is stated plainly rather than implied away.

## 1. Field-level protection design for sensitive records

The schema's design already does most of the field-level protection work structurally, not just
procedurally:

- **Identifiers are never stored raw.** `PersonIdentifier` holds only `maskedValue` (e.g.
  `"XXXX XXXX 1234"`) and `valueHash` (a salted hash used purely for equality matching). There is
  no column anywhere in the schema for a raw Aadhaar, PAN, passport, or driving-licence number.
  This is a structural control, not a policy one — the field to hold a raw value simply does not
  exist.
- **Balances are banded, not exact, in shared contexts.** `Liability.outstandingAmountBand` and
  `Payment.amountBand` store display bands (e.g. "₹1,00,000 – ₹5,00,000") rather than exact
  figures for any view that is not the account holder's own private, fully-authorised view.
  (A real deployment would additionally need an exact-figure store reserved for the institution's
  own system of record and the settlement pipeline, with the banded value the only thing that ever
  reaches a shared/claimant-facing surface — the prototype's schema already keeps the banded field
  separate from anything that could leak an exact figure to an under-authorised viewer.)
- **Account/policy/reference numbers are masked or tokenised.** `Asset.maskedAccountNumber`,
  `ExternalRecordReference.externalIdToken`, `InstitutionRelationship.referenceNumberMasked` —
  none of these carry the real external number; the token is meaningful only to the integration
  that issued it.
- **Documents are never raw file bytes in this prototype.** `LegalDocument.fileLabel` is a
  synthetic filename; `isDemoDocument` defaults `true`. A real deployment would need envelope
  encryption of actual uploaded files (see §2) plus virus/malware scanning and content-type
  validation before storage — none of which is meaningful to build against synthetic filenames,
  so it is documented here as a requirement rather than implemented.
- **Deceased status is never publicly exposed.** `DeathEvent.isPubliclyVisible` defaults `false`
  and the application layer must never flip it; there is no query path in the intended design that
  serves death-event data to an unauthenticated or under-authorised caller.
- **Audit metadata is scrubbed of raw identifiers.** `AuditEvent.metadata` is documented in-schema
  as carrying "no sensitive raw identifiers" — audit logs record *that* an identifier was checked
  or matched, and against what masked/hashed value, never the raw value itself.

## 2. Encryption in transit and at rest

**Architectural intent for a real deployment:**

- **In transit:** TLS 1.2+ everywhere — browser-to-app, app-to-database, app-to-any institution
  integration. HSTS enabled. No plaintext fallback for any authenticated route.
- **At rest:** Postgres with disk-level encryption (cloud-provider-managed keys at minimum,
  customer-managed keys for a regulated deployment) for the primary database. Column-level
  application encryption (envelope encryption via a KMS) for any field that, in a production
  design, would need to hold something more sensitive than this prototype's masked/banded/
  tokenised fields already reduce it to — for example, if a future version stored actual document
  file bytes, those would be encrypted client-side or server-side before persistence, with keys
  held in a KMS separate from the database, never alongside it.
- **Key management:** a managed KMS (cloud-native or HSM-backed) with key rotation, separate keys
  per environment (prod/staging/demo), and no application code path that can export a raw key.
- **Backups:** encrypted at rest with the same key management discipline as the primary store, and
  access-logged separately from normal database access.

**What this SQLite prototype actually does:**

- The datasource is a single SQLite file (`provider = "sqlite"`, chosen explicitly per the schema's
  own header comment for a zero-setup local/demo experience). SQLite as configured here provides
  **no encryption at rest** — the `.db` file is plain bytes on disk. This is acceptable *only*
  because the schema's field-level design (§1) means there is nothing genuinely sensitive to
  encrypt: no raw Aadhaar/PAN, no raw account numbers, no real document bytes, all synthetic seed
  data.
  This is precisely why field-level minimisation (masking, hashing, banding, tokenising) is load-
  bearing here, not decorative: it is the actual control standing in for at-rest encryption in this
  prototype, and it is a control that must remain even after a real encrypted datastore is added,
  not one that encryption would make redundant.
- Transport security in the deployed prototype (Vercel-hosted) is TLS via the platform's standard
  HTTPS termination — real, not simulated — but there is no additional column-level encryption
  layer in application code.
- **Gap, stated plainly:** a production deployment handling real citizen data on this schema would
  require migrating to Postgres with disk encryption and a KMS-backed envelope-encryption layer for
  any field a future scope decision adds that isn't already reduced to masked/banded/tokenised form.
  This is designed, not implemented, consistent with `00_EXECUTIVE_SUMMARY.md`'s "what's real vs.
  simulated" framing.

## 3. RBAC / ABAC and least privilege

Suvidha combines role-based access control (coarse gate) with attribute-based access control (the
actual per-record decision):

- **RBAC layer:** `User.primaryRole` (`estate_planner`, `trusted_contact`, `claimant`,
  `registrar_officer`, `institution_officer`, `verification_officer`, `maker`, `checker`,
  `adjudicator`, `grievance_officer`, `auditor`, `integration_admin`) plus the lifelong-
  administration personas gates *which screens/API routes a user can reach at all*. A `claimant`
  role can never reach the Maker/Checker decision endpoints regardless of any other attribute.
- **ABAC layer:** within a role-permitted screen, the actual rows a user may see or act on are
  filtered by attributes evaluated per request: is this `Claimant.personId` the caller's own
  verified person; does an `active` `AccessGrant`/`TrustedContact` exist scoping this specific
  asset/document category to this caller; is this `CaseAssignment` actually assigned to this
  officer; does this `Institution` match the caller's own `institutionId` (tenant isolation, §9).
  See `docs/ACCESS_CONTROL_MATRIX.md` for the full role × capability table this produces.
- **Least privilege in practice:**
  - A Verification Officer at Institution A can never see a `Claim`, `DeathEventMatch`, or
    `Asset` belonging to Institution B — every claims/institution-scoped query carries an
    `institutionId` filter derived from the authenticated officer's own `institutionId`, never
    from a client-supplied parameter.
  - Maker and Checker are structurally distinct roles on `CaseAssignment.role` and
    `Decision.makerCheckerRole` — the same `User` should never be permitted to record both the
    Maker and the Checker decision on the same `Claim` (an application-layer invariant the schema
    supports by keying `Decision` to `decidedByUserId` per row, letting the app enforce
    maker ≠ checker on the same claim).
  - A Trusted Contact's visibility is bounded by `AccessPolicy.visibilityLevel` — from `none`
    up to `full_inventory_no_balances` — never to raw balances, and never to a level implying
    ownership or executorship (structurally, no `AccessPolicy.visibilityLevel` value in the schema
    grants that).
- **Gap, stated plainly:** this prototype's mock authentication (`isDemoAccount` defaulting
  `true`) does not implement a real production-grade authorisation middleware with policy
  evaluation caching, row-level security at the database engine, or a dedicated policy-decision
  service. A real deployment should additionally consider Postgres row-level security as a
  defence-in-depth layer beneath the application-layer ABAC checks described above, so a bug in
  application logic cannot alone leak cross-tenant data.

## 4. Step-up authentication for sensitive actions

**Where step-up authentication would trigger in a real deployment:**

- Reporting a death (family-reported path).
- Accepting a Trusted Contact invitation, or any grantor action that widens an `AccessPolicy`
  scope.
- Submitting a claim, or any action that adds/edits `ClaimAsset`, `AuthorityCredential`, or
  payout-account details.
- A Maker/Checker/Adjudicator `Decision` on any claim above an institution's high-value threshold.
- Changing a payout account mid-claim (a specific fraud vector, see `docs/THREAT_MODEL.md`
  "fraudulent payout-account substitution").
- Initiating or responding to a `DeathEventCorrection` challenge.
- Any bulk asset-discovery request (§ "unauthorised bulk asset discovery" in
  `docs/THREAT_MODEL.md`).
- Institution Administrator or Integration Administrator actions that touch `Rule`/`RuleVersion`
  activation, `Connector`/`Integration` configuration, or SLA thresholds.

For each of these, a real deployment would require re-authentication (password/OTP/biometric
re-prompt) and/or a second factor beyond the standing session, with the step-up event itself
logged as its own `AuditEvent`.

**Honest gap statement:** this prototype's mock authentication layer does not implement real
step-up authentication at all — there is no OTP/biometric re-prompt flow, and no session-risk
scoring. The list above is the specification a production build would implement against; the
demo instead relies on the front door (initial login) and the ABAC checks in §3 to gate access,
which is materially weaker than a real deployment needs for the sensitive-action list above. This
gap is called out explicitly rather than silently assumed away, and would be one of the first
hardening items in any path from prototype to production.

## 5. Session and device management

**Intended design for a real deployment:**

- Short-lived access tokens with refresh rotation; refresh-token reuse detection (a reused/replayed
  refresh token immediately revokes the whole token family).
- Device/session listing visible to the user, with per-session revocation ("sign out this device").
- New-device / new-location login triggers a notification to the user (and, for a Trusted Contact
  or Claimant context, is itself a candidate for step-up per §4).
- Session invalidation on password change, on Trusted Contact revocation (holder's active sessions
  tied to that access should be invalidated, not merely have future requests denied), and on
  suspected compromise.

**What the prototype actually does:** a single mock session per `User` with no device fingerprint,
no session list, and no revoke-this-device control. This is a known, stated gap consistent with
the `isDemoAccount` flag on every seeded user — the prototype demonstrates the *data model and
workflow* around sensitive actions, not a hardened session-management stack.

## 6. Download / export logging

- Every document view, download, or export of a `LegalDocument`, `SubmittedEvidence`, or any
  export of claim/estate data must record an `AuditEvent` (`action` values such as
  `document.viewed`, `document.downloaded`, `claim.exported`) carrying `actorUserId`, `actorRole`,
  `entityType`/`entityId`, and a `correlationId` tying it to the originating request.
- Bulk exports (e.g. an Auditor pulling a full case file, or an Institution Administrator running a
  claims report) are treated as higher-sensitivity than single-record views and should additionally
  record the row count/scope of the export in `metadata` (scrubbed of raw identifiers per §1) so an
  unusually broad export is detectable after the fact.
- The download/export log is part of the same append-only `AuditEvent` stream as every other
  action (§7) — there is no separate, lower-rigour log for "just viewing," because in a
  bereavement/claims context, viewing itself can be the sensitive act.

## 7. Maker-checker controls

Maker-checker is enforced structurally, not just procedurally, via three schema features:

1. **Separate role fields:** `CaseAssignment.role` and `Decision.makerCheckerRole` are independent
   strings (`maker`/`checker`/`adjudicator`/`verification_officer`) — a claim's decision trail is
   a sequence of `Decision` rows, each tagged with who made it and in what capacity.
2. **No self-checking invariant (application-enforced):** the application layer must reject a
   Checker `Decision` where `decidedByUserId` equals the Maker `Decision.decidedByUserId` for the
   same `claimId`. The schema supports this check (both fields are queryable per claim) but does
   not itself constrain it at the database level in SQLite — this is documented as an
   application-layer invariant that a production build should additionally enforce with a database
   constraint or trigger where the engine supports it.
3. **Adjudicator as a distinct, higher tier:** used specifically for Maker/Checker disagreement or
   institution-threshold-triggered cases (see `docs/WORKFLOWS.md` §3.4), never bypassed by a Maker
   or Checker acting alone.

This maker-checker pattern is applied specifically to: claim decisions (§3.4 of `WORKFLOWS.md`),
death-event match confirmation (a Verification Officer reviews, a second check applies to
high-value or ambiguous matches per institution policy), and rule-version activation (an
Institution/Integration Administrator proposing a `RuleVersion` change should require a second
approver before `isActive` flips in a production deployment — the prototype schema supports
recording who activated a version via `AuditEvent` even though it does not yet enforce dual
control on that specific action).

## 8. Tamper-evident audit log design

- `AuditEvent` is documented in-schema as **append-only by application convention**: "never update
  or delete a row, only insert." The application layer never issues an `UPDATE` or `DELETE` against
  this table.
- **Honest limitation:** SQLite (and, unmodified, Postgres) cannot itself enforce true
  immutability — a sufficiently privileged database user could still update or delete rows at the
  storage layer, and the schema comment says as much ("even though SQLite cannot enforce
  immutability itself"). Application convention is a real control against ordinary application
  bugs and normal-privilege misuse, but it is not cryptographic tamper-evidence and does not defend
  against a malicious DBA/insider with raw database access.
- **What a production hardening path looks like:**
  - **Hash-chaining:** each `AuditEvent` row includes a hash of the previous row's hash plus its
    own content, so any retroactive edit or deletion breaks the chain and is detectable by
    recomputation. This is the natural next step and does not require changing the row shape, only
    adding a `previousHash`/`hash` column pair.
  - **Write-once storage:** periodically (or in real time) mirroring `AuditEvent` rows to a
    write-once object store (e.g. object-lock/WORM-configured cloud storage) or a dedicated
    append-only log service, so even a compromised database cannot rewrite history that has
    already been externally committed.
  - **Database-level constraints:** a Postgres deployment can additionally revoke `UPDATE`/`DELETE`
    privileges on the `AuditEvent` table from the application's own database role, requiring a
    separate, more tightly controlled role (or no role at all, via a trigger-enforced rule) to
    perform any modification — raising the bar even for a compromised application credential.
  - Neither of these is implemented in the current prototype; they are the specified next steps
    the schema comment already flags as necessary for a genuine immutability guarantee.

## 9. Institution/tenant data isolation

- Every institution-scoped model (`Claim`, `DeathEventMatch`, `CaseAssignment`, `SLA`,
  `Grievance`, `Institution Relationship`, `ServiceCatalogue`, and their descendants) carries an
  explicit `institutionId` foreign key.
- The intended isolation model is **row-level multi-tenancy within a shared schema**: every query
  issued on behalf of an institution-side actor (`institution_officer`, `verification_officer`,
  `maker`, `checker`, `adjudicator`) must be scoped by that actor's own `User.institutionId`,
  applied server-side, never trusted from client input.
- A single citizen's `Estate` can legitimately span multiple institutions' `Claim` rows — that is
  the point of the platform — but each institution's officers see only their own institution's
  claims and case assignments on that estate, never a competitor institution's claim detail, even
  though they share the same underlying `Estate`/`Person`.
- **Gap, stated plainly:** the current prototype relies entirely on application-layer query
  scoping for this isolation; it does not additionally implement database-level row-level security
  policies. For a real multi-institution deployment (effectively a regulated, multi-tenant SaaS
  serving competing banks/insurers from the same database), Postgres row-level security scoped to
  `institutionId` is a recommended defence-in-depth addition, not a decorative one — the
  consequence of a scoping bug here is one bank seeing another bank's claims data, which is a
  severe, reputationally fatal failure mode for this specific product category.

## 10. Data-retention and deletion policy

- Soft-deletion is modelled explicitly where it matters: `Person.deletedAt`, `Asset.deletedAt`,
  `Liability.deletedAt`, `LegalDocument.deletedAt` — records are marked deleted, not physically
  removed, preserving referential integrity for any claim/audit history that depended on them.
- **Retention classes (see also `docs/PRIVACY.md` §"Retention classification"):**
  - Audit and claim-decision records: retained per applicable regulatory retention periods for
    financial/claims records (institution- and regulator-specific — RBI/SEBI/IRDAI/PFRDA each set
    their own norms), never deleted early even if the underlying `Person`/`Claim` is soft-deleted.
  - Consent artefacts (`ConsentArtefact`) are explicitly "kept even after revocation" per the
    schema comment — a consent receipt is itself a durable record of what was once authorised,
    independent of current validity.
  - Demo/seed data (`isDemoAccount`, `isDemoDocument`, `scenarioTag`) is understood to be freely
    disposable — it carries no real citizen data and no retention obligation.
- **Deletion request handling:** a living user's request to delete their own non-mandatory-
  retention data (e.g. an abandoned `EstatePlan` draft, an unused `Asset` entry) should be honoured
  via soft-delete plus, on a defined schedule, physical purge — except where a record is subject to
  an active `Claim`, `Dispute`, `CourtOrder`, or legal hold (§12), in which case deletion is
  deferred and the requester is told why.

## 11. Breach-response workflow outline

1. **Detection:** anomalous access pattern (unusual export volume, off-hours bulk queries,
   repeated failed step-up attempts) surfaces via monitoring — not implemented in this prototype,
   specified here as the production requirement.
2. **Containment:** affected credentials/sessions revoked (per §5's session-management design);
   affected `Integration`/`Connector` disabled (`Integration.status → "disabled"`) if the breach
   vector is a compromised institution integration.
3. **Assessment:** scope determined via the `AuditEvent` trail — which `entityType`/`entityId`
   rows were touched, by which `actorUserId`, over what window (this is exactly what the
   append-only audit design in §8 exists to make possible).
4. **Notification:** affected citizens notified per applicable Indian data-protection law
   (Digital Personal Data Protection Act, 2023, and sectoral regulator requirements where
   financial data is involved) and, where a regulated institution is implicated, that
   institution's own regulator (RBI/SEBI/IRDAI/PFRDA) notified per its breach-reporting timeline.
5. **Remediation:** root cause fixed; if the root cause is a scoping/isolation bug (§9), affected
   queries audited platform-wide for the same pattern, not just the specific instance found.
6. **Post-incident review:** documented, feeding back into the threat model
   (`docs/THREAT_MODEL.md`) and this security design.

This is a specification, not a tested runbook — no breach-response tooling (alerting pipeline,
incident-management integration) exists in the current prototype.

## 12. Legal-hold support (concept)

- A `CourtOrder` or an open `Dispute`/`FraudSignal` on an `Estate` or `Claim` functions as a
  de facto legal hold in the current design: standard retention/deletion schedules (§10) must be
  suppressed for any record connected to that `estateId`/`claimId` until the hold is lifted
  (`Dispute.resolvedAt` set, `FraudSignal.resolvedAt` set, or the `CourtOrder`'s relevance
  otherwise concluded).
- A production build should make this an explicit, first-class flag (e.g. a `legalHold` boolean or
  a dedicated `LegalHold` model referencing the held entity) rather than relying on the presence of
  a `Dispute`/`CourtOrder` row alone — the current schema supports the *behaviour* (nothing conflicts
  with holding these records) but does not yet have a dedicated model to make "this specific record
  is under legal hold, for this reason, since this date" independently queryable and reportable to
  an Auditor. This is noted as a near-term schema addition, not a redesign.

## 13. Summary of stated gaps (for transparency)

| Area | Real in this prototype | Gap requiring production hardening |
|---|---|---|
| Field-level minimisation (masking/hashing/banding/tokenising) | Yes — structural | Extending the same discipline to any new field added later |
| Encryption in transit | Yes (Vercel/TLS) | N/A |
| Encryption at rest | No (SQLite, plain file) | Postgres + disk encryption + KMS envelope encryption |
| RBAC | Yes (`primaryRole` gating) | Formal policy-decision service, database row-level security |
| ABAC | Yes (per-request attribute checks) | Same as above |
| Step-up authentication | No | Full step-up flow for the sensitive-action list in §4 |
| Session/device management | No (single mock session) | Full session lifecycle, device list, revocation |
| Maker-checker separation | Structural fields exist | Database-enforced self-check prevention, dual control on rule activation |
| Audit-log append-only-ness | Application convention | Hash-chaining or write-once mirror for true tamper-evidence |
| Tenant isolation | Application-layer query scoping | Database row-level security as defence-in-depth |
| Legal hold | Implicit via Dispute/CourtOrder presence | Dedicated `LegalHold` model |
