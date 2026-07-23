# Legacy, Incapacity, Bereavement & Succession — Domain Overview

**Domain I of the lifelong citizen administration platform.** This is a bridge/
overview document. The deep operational detail for this domain lives in (or will
live in) `docs/AUTHORITY_RULES.md` (the authority/entitlement decision logic) and
`docs/WORKFLOWS.md` (claim and case-processing workflows) — written by a separate
workstream; this document does not depend on their contents existing yet. For the
full living vocabulary of this domain, see `docs/TERMINOLOGY.md` §2–3.

## 1. What this domain is

This is the *original* product design — the estate-planning, bereavement, succession,
and claims product Suvidha was first conceived as, before the product thesis was
broadened to cover the whole of lifelong citizen administration (see the schema's own
framing comment: two eras, two halves, one platform). It is retained **in full**, not
as a legacy artifact kept for nostalgia but as one first-class domain among nine
(A–I), because bereavement remains one of the highest-stakes, highest-friction
moments any citizen's family will face with institutions, and nothing about the
broader platform reduces that need.

Its shape, in brief:

- **`EstatePlan`** — the living Estate Planner's pre-death preparation: a
  completeness-based (never balance-based) `readinessScore`, review reminders, and
  plain-language emergency instructions for family.
- **`TrustedContact`, `AccessGrant`, `AccessPolicy`** — a platform-access-only role
  that activates around death or incapacity, never nomination, executorship, or
  ownership (see `docs/DELEGATED_ACCESS.md` §7 for how this is explicitly
  distinguished from the everyday `DelegatedTask` mechanism).
- **The `DeathEvent` lifecycle** — a ten-state progression:
  `reported → evidence_submitted → registrar_verified → identity_match_pending →
  matched → partially_matched → contested → corrected → cancelled → finalised`,
  supported by `DeathEventEvidence` (documents submitted), `DeathEventMatch` (per-
  institution candidate matching with an explainable `confidenceScore` and
  `matchFactors`), and `DeathEventCorrection` (the false-death challenge/reactivation
  path, detailed in §4 below).
- **`Claimant` roles** — `trusted_contact \| nominee \| beneficiary \|
  surviving_joint_holder \| executor \| administrator \| legal_heir \| guardian \|
  other_claimant`, each carrying `identityVerified` and `wasPreAuthorised` flags so the
  system distinguishes an invited Trusted Contact stepping into a claim from an
  uninvited family member asserting a claim for the first time.
- **Unified claim packets** — `SubmittedEvidence.reusedFromClaimId` is the concrete
  mechanism: once a document is verified for one institution's claim, it can be
  reused for another institution's claim on the same estate without re-collecting it,
  so a family assembles evidence once rather than once per institution.
- **Institution claim processing with maker-checker** — `CaseAssignment` (`maker \|
  checker \| adjudicator \| verification_officer`) and `Decision`
  (`recommend_approve \| recommend_reject \| approve \| reject \| partial_approve \|
  escalate \| request_more_info`) give every claim decision a segregated-duties trail,
  the same discipline any regulated institution would require internally.
- **Authority/entitlement decision support that never declares final ownership** —
  `Rule`/`RuleVersion` (a versioned, auditable decision matrix — see
  `docs/AUTHORITY_RULES.md`) drives `ClaimAsset.recommendedPathway`, explicitly
  labelled a *recommendation*, and `AuthorityCredential` records real legal
  instruments (succession certificate, probate, letters of administration, legal-heir
  certificate, and others) with their own independent `verificationStatus`. Suvidha's
  engine recommends a pathway; only a court, registrar, or institution's own
  adjudication actually confers entitlement.
- **False-death correction and reactivation** — `DeathEventCorrection` runs its own
  lifecycle (`challenge_initiated → reverification_in_progress → registrar_corrected →
  agencies_notified → resolved`), and `Person.lifeStatus` itself includes
  `deceased_disputed` and `deceased_corrected` states precisely so an erroneous
  match can be walked back cleanly, with every institution that was notified also
  formally re-notified.

## 2. Why this is a bridge doc, not the full spec

This document intentionally stays at overview depth (see §1's summary above) because
the granular decision logic — exactly which `Rule` conditions produce which
`recommendedPathway` for which asset category, and the precise step-by-step workflow
each `ClaimWorkflow.templateKey` runs — belongs in `docs/AUTHORITY_RULES.md` and
`docs/WORKFLOWS.md` respectively. Those documents are expected from a separate
workstream and are referenced here by filename only.

## 3. How this domain reuses shared platform infrastructure

The single most important architectural fact about this domain is that it is **not a
bolt-on system with its own parallel infrastructure** — it was built first, and the
lifelong-administration domains (A–H) were built to share its foundations rather than
duplicate them. Concretely:

| Shared foundation | How Legacy & Succession uses it | How lifelong administration uses it |
|---|---|---|
| **`Person`** | The Deceased Person, the Estate Planner, every Claimant | Every Independent Citizen, Family Administrator, Professional Representative |
| **`Institution`** | Every claim-processing institution | Every `InstitutionRelationship` counterpart |
| **`LegalDocument`** | Wills, trust deeds, death certificates, court orders | Extended (not duplicated) by `DocumentProfile` for everyday documents — see `docs/DOCUMENT_AND_EVIDENCE_MODEL.md` |
| **`ConsentRecord` / `ConsentScope` / `DataShare`** | Asset-discovery and document-fetch consent during claims | Profile-sync, tax-notice-access, and delegated-access consent — same purpose-limited, revocable, logged architecture throughout |
| **`Grievance`** | Claim-related grievances, escalations, appeals | Service-request-related grievances — the same `Grievance` model, `serviceRequestId` used instead of `claimId` |
| **`Payment`** | Claim settlements (`purpose=claim_settlement`) | Service fees (`purpose=service_fee`) — one `Payment` model, one `amountBand`-first, never-exact-balance display discipline |
| **`AuditEvent`** | Every claim decision, access grant, and death-event state change | Every service request status change, delegated task decision — the same append-only, entity-agnostic audit log |
| **Masked-identifier architecture** | `PersonIdentifier.maskedValue`/`valueHash` used for death-event identity matching | The same masked identifiers used for `InstitutionRelationship.referenceNumberMasked` and profile matching |
| **Institution ops console shell** | Maker/checker/adjudicator claim-processing queues | Service-request and grievance-handling queues for the same institution officers — a different module/queue inside the same console, not a separate application |
| **Normalized-status philosophy** | `Claim.status` (`draft \| submitted \| under_review \| deficiency_pending \| escalated \| approved \| partially_approved \| rejected \| fraud_hold \| court_hold \| settled \| closed`) | `ServiceRequest.normalizedStatus` — a parallel, independently-evolved status vocabulary reflecting the same underlying discipline (citizen-facing normalized status shown alongside institution-specific detail), a good example of the schema's own "two eras of terminology, one platform" framing in `docs/TERMINOLOGY.md` |

The practical implication for anyone extending either domain: before adding a new
model, check whether `Person`, `Institution`, `LegalDocument`, `ConsentRecord`,
`Grievance`, `Payment`, or `AuditEvent` already covers the need. The schema's own
consolidation notes in `docs/DATA_MODEL.md` document every deliberate merge made for
exactly this reason — the two domains are one platform's two chapters, not two
platforms sharing a login page.
