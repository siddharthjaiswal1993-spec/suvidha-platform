# Threat Model — Legacy, Incapacity, Bereavement & Succession

This document threat-models the attack and abuse scenarios specific to a bereavement/succession
platform. For each threat: why it matters specifically here, and the mitigation already reflected
in the schema/design (cited to the actual model/field), plus, where the mitigation is only
partially built in this prototype, an honest note on the gap (cross-referenced to
`docs/SECURITY.md` where a fuller gap discussion already exists).

## 1. False death reporting

- **Description:** Someone falsely reports a living person's death — maliciously (to trigger
  premature account actions, distress a family, or as a step toward a fraud scheme) or through
  genuine confusion (misidentification, a same-name/same-DOB collision).
- **Why it matters here specifically:** a false death report can trigger institution risk actions
  (freezes, flags) against a living person's real accounts, and the reputational/personal harm of
  a wrongful "you are recorded as deceased" episode is severe and specific to this product domain.
- **Mitigation reflected in schema/design:** `DeathEvent.status` requires progression through
  `reported → evidence_submitted → registrar_verified → identity_match_pending → matched` before
  any institution acts — a bare report alone (`"reported"`) triggers no institution-facing
  propagation (`docs/WORKFLOWS.md` §2.2, §2.4). `DeathEventEvidence.verificationStatus` gates
  advancement; unverified/rejected evidence halts the pipeline. Ambiguous identity matches route to
  `DeathEventMatch.status = "needs_human_review"` rather than auto-confirming
  (`docs/WORKFLOWS.md` §2.3). The dedicated `DeathEventCorrection` model and its
  `challenge_initiated → ... → resolved` lifecycle exist specifically to reverse a false report
  quickly (`docs/WORKFLOWS.md` §4.3).

## 2. Identity theft

- **Description:** An attacker uses a stolen identity (the deceased's, a claimant's, or a Trusted
  Contact's) to gain unauthorised access or to file a fraudulent claim.
- **Why it matters here specifically:** bereavement is a moment of reduced vigilance for a grieving
  family and heightened institutional risk-tolerance for "helping the family," which attackers can
  exploit; a stolen claimant identity can redirect a real payout.
- **Mitigation reflected in schema/design:** every claimant authenticates with their **own**
  verified identity — never the deceased's credentials (`Claimant.identityVerified`,
  `IdentityRecord.method`/`outcome`/`confidence`); a claimant's asserted role and relationship are
  independently verified (`Relationship.verified`, backed by `evidenceDocumentId`) before
  disclosure widens (`docs/WORKFLOWS.md` §3.1, Path B). `FraudSignal.signalType =
  "claimant_identity_mismatch"` exists specifically to flag this pattern.
- **Gap:** real step-up authentication and device/session hardening at claim-submission time are
  not implemented in this prototype's mock auth layer (`docs/SECURITY.md` §4–5).

## 3. Obituary fraud

- **Description:** An attacker uses a published obituary (name, date of death, family names,
  relationships) to craft a convincing false claim or social-engineering approach.
- **Why it matters here specifically:** obituaries are public and rich in exactly the relationship
  detail a claim requires, making them a natural social-engineering input.
- **Mitigation reflected in schema/design:** `DeathEvent.isPubliclyVisible` defaults `false` and
  must stay `false` — Suvidha itself never becomes a second, platform-native source of public
  death confirmation that could corroborate an obituary-based social-engineering attempt. Genuine
  claim verification always requires the claimant's own identity and relationship evidence
  (`Relationship.verified`), which an obituary alone cannot satisfy — knowing public facts about a
  death does not shortcut identity/relationship verification anywhere in the workflow.

## 4. Forged death certificates

- **Description:** A fabricated or altered death certificate submitted as evidence.
- **Why it matters here specifically:** the death certificate is the single most load-bearing
  document in the entire domain — it gates the DeathEvent lifecycle and, downstream, every claim.
- **Mitigation reflected in schema/design:** `DeathEventEvidence.verificationStatus` (`pending →
  verified/rejected`) requires explicit verification, not mere presence of a document;
  cross-checking against the Registrar's own record (`registrar_verified` status, corroborated by
  `Jurisdiction`/`registrationNumber`) is a distinct, stronger check than evidence upload alone.
  Repeated rejected/suspicious submissions can raise `FraudSignal.signalType =
  "forged_document_suspected"` (`docs/WORKFLOWS.md` §2.2).
- **Gap:** this prototype does not implement actual forensic document-authenticity checking
  (watermark/hologram detection, issuing-authority API cross-check beyond the simulated CRS check)
  — `DocumentVerification.outcome` is recorded by a human reviewer or a simulated check, not a real
  computer-vision/liveness pipeline. Documented as a production integration requirement, not built.

## 5. Forged wills

- **Description:** A fabricated will, or a genuine will altered to change beneficiaries/executor.
- **Why it matters here specifically:** a will directly determines the recognised distribution
  pathway (`docs/AUTHORITY_RULES.md` §4.3) — a forged will can redirect an entire estate.
- **Mitigation reflected in schema/design:** `WillRecord.registrationStatus` distinguishes
  `unregistered` from `registered_with_sub_registrar` — a registered will carries independent
  third-party corroboration a claimed-only will does not. `WillRecord.version` /
  `isLatestKnownVersion` preserve full version history so a later-discovered will can supersede
  without destroying the record of what was previously relied on. Any dispute over authenticity
  routes to `Dispute` (`disputeType = "forged_document"`) and, where needed, court review via
  `CourtOrder` (`docs/WORKFLOWS.md` §4.1) — Suvidha never itself adjudicates a will's authenticity.
  `DocumentVerification` applies to the will document itself before an executor claim proceeds.
- **Gap:** as with death certificates, forensic document authentication is not implemented; the
  platform's structural mitigation is procedural gating (registration status, version history,
  mandatory human/legal review on dispute), not automated forgery detection.

## 6. Fake legal-heir documents

- **Description:** A fabricated legal-heir certificate, succession certificate, or similar
  authority credential.
- **Why it matters here specifically:** this is the exact document class the intestate-succession
  pathway depends on when no will/nomination exists (`docs/AUTHORITY_RULES.md` §4.4).
- **Mitigation reflected in schema/design:** `AuthorityCredential.verificationStatus` (`pending →
  verified/rejected`) requires explicit verification against the `issuingAuthority` before the
  credential is relied upon; the multi-heir pathway's authority-rules row sets
  `requiresHumanReview = true` unconditionally, regardless of claimed value, specifically because
  this document class is a known forgery target and deserves mandatory human scrutiny rather than
  automated acceptance.

## 7. Nominee impersonation

- **Description:** Someone impersonates the registered nominee to claim a payout that is not
  theirs.
- **Why it matters here specifically:** the nominee pathway (`docs/AUTHORITY_RULES.md` §4.1) is the
  fastest, lowest-friction claim path — exactly the property an impersonator would target.
- **Mitigation reflected in schema/design:** `Claimant.identityVerified` and matching against
  `Nomination.nomineePersonId`/`nomineeNameOnRecord` are required before the nominee pathway
  applies; a nominee whose asserted identity does not match the institution's registered record
  does not get the fast-track output — the authority-rules engine's nominee row explicitly
  conditions on the claimant's role being the verified, registered nominee, not merely someone
  asserting to be them.

## 8. SIM-swap attacks

- **Description:** An attacker takes control of a victim's mobile number (via a fraudulent SIM
  reissue) to intercept OTPs and impersonate them.
- **Why it matters here specifically:** a SIM swap targeting either the deceased's own number (to
  intercept notifications and pre-empt a legitimate family claim) or a claimant's number (to hijack
  their claim or redirect payout) is a realistic, high-value attack given the financial stakes.
- **Mitigation reflected in schema/design:** `ContactMethod.verified` distinguishes a verified
  contact channel from an unverified one, and multiple `PersonIdentifier`/`ContactMethod` factors
  feed `DeathEventMatch.matchFactors` and identity verification rather than relying on a single
  mobile-number-based OTP as the sole factor. Sensitive actions (accepting a Trusted Contact
  invitation, submitting a claim, changing a payout account) are the exact list flagged for
  step-up authentication in `docs/SECURITY.md` §4.
- **Gap:** real step-up authentication (which would include out-of-band verification resistant to
  SIM-swap, e.g. app-based push rather than SMS OTP alone) is not implemented in this prototype —
  explicitly called out in `docs/SECURITY.md` §4 as a stated gap.

## 9. Email takeover

- **Description:** An attacker compromises a citizen's or claimant's email account to intercept
  notifications, reset credentials, or impersonate them in claim correspondence.
- **Why it matters here specifically:** email is a primary channel for `Notification` and
  `Communication` records in claims processing; a compromised email account could let an attacker
  silently observe or redirect a claim's progress.
- **Mitigation reflected in schema/design:** `ContactMethod.verified` and multi-factor identity
  checks (rather than email possession alone) gate sensitive actions; `Communication.direction`
  (institution_to_claimant / claimant_to_institution / system) creates a durable record so a
  claimant can later compare what they actually sent/received against what a compromised channel
  might have shown them, aiding post-incident detection.
- **Gap:** no dedicated anomaly detection for notification-channel takeover is implemented; this
  would be a monitoring/detection capability layered on top of the schema in a production build.

## 10. Elder coercion

- **Description:** A family member or acquaintance coerces an elderly or vulnerable Estate Planner
  into granting excessive Trusted Contact access, altering nominations, or signing a will/consent
  under duress.
- **Why it matters here specifically:** the Assisted Citizen persona and the elder-heavy user base
  of a bereavement/succession product make coercion a realistic, high-impact threat distinct from
  purely technical attacks.
- **Mitigation reflected in schema/design:** `AccessPolicy.timingRule` supports
  `requires_co_approvalFromHolderId` and waiting-period gating (`waitingPeriodDays`) so a coerced,
  hasty grant is not instantly and irrevocably in effect; `TrustedContact.status` and
  `AccessGrant.status` are always independently revocable by the grantor at any time
  (`docs/WORKFLOWS.md` §1.3) — including, implicitly, once coercion ends and the grantor regains
  agency. No `AccessPolicy.visibilityLevel` grants ownership/executorship, limiting the ceiling of
  what any single coerced grant can hand over.
- **Gap:** the platform cannot detect coercion itself (no behavioural/velocity anomaly detection
  around access-grant creation is implemented) — this is fundamentally a human-protection problem
  that product design (waiting periods, clear plain-language explanation of what a grant does and
  does not confer, a friction point before wide-scope grants) can reduce but not eliminate.

## 11. Malicious Trusted Contact

- **Description:** A person legitimately granted Trusted Contact status abuses that access —
  browsing more than intended, pressuring the grantor to widen scope, or acting maliciously once
  the grantor has died.
- **Why it matters here specifically:** the Trusted Contact role is deliberately designed to be
  useful in exactly the moment (bereavement) when oversight is hardest, making abuse both easier
  and more damaging.
- **Mitigation reflected in schema/design:** access is strictly bounded by `AccessPolicy`
  (`visibilityLevel`, `timingRule`) and further scoped by `AccessGrant.scopeConfig`/`purposeTags` —
  a Trusted Contact never gets more than the named policy allows, never balances under any policy,
  and never login-as-grantor capability (structurally impossible — there is no such access path in
  the schema). `docs/PRIVACY.md` §5's progressive-reveal table applies specifically to bound this.
  Every view/access by a Trusted Contact should be logged (`docs/SECURITY.md` §6 download/export
  logging applies here too).
- **Gap:** fine-grained, per-view audit logging of exactly what a Trusted Contact viewed (versus
  what they were merely entitled to view) is a monitoring capability the current prototype
  specifies but does not fully instrument.

## 12. Collusion among claimants

- **Description:** Multiple claimants coordinate to present a false consensus (e.g. fabricated NOC,
  agreed-but-inaccurate heir list) to extract a faster or larger settlement than legitimately due.
- **Why it matters here specifically:** the multi-heir/no-will pathway (`docs/AUTHORITY_RULES.md`
  §4.4) specifically relies on claimant-provided consensus (NOC) as part of the simplified process,
  which is exactly the point collusion would target.
- **Mitigation reflected in schema/design:** the authority-rules row for "no will, no nomination,
  multiple heirs" sets `requiresHumanReview = true` unconditionally — a human reviewer, not an
  automated NOC check, evaluates multi-claimant consensus. `Dispute.disputeType =
  "competing_claimants"` and the broader `Dispute` model exist for any later-emerging heir or
  challenge to reopen a settlement believed final (`docs/WORKFLOWS.md` §7.4's "failure/exception"
  note on a newly discovered heir).

## 13. Institution insider abuse

- **Description:** An institution's own officer (Maker, Checker, Verification Officer) abuses their
  access — approving a fraudulent claim, browsing citizen data without cause, or leaking
  information.
- **Why it matters here specifically:** institution officers have the deepest legitimate access in
  the system; insider abuse is often harder to detect than external attack because the access
  itself is authorised.
- **Mitigation reflected in schema/design:** maker-checker separation is structural
  (`CaseAssignment.role`, `Decision.makerCheckerRole`) — no single officer can unilaterally approve
  a claim (`docs/SECURITY.md` §7); `AuditEvent` records every decision and view with `actorUserId`/
  `actorRole`, enabling after-the-fact detection; tenant isolation (`institutionId`-scoped queries,
  `docs/SECURITY.md` §9) limits any one officer's reach to their own institution.
- **Gap:** the maker≠checker-same-person invariant is application-enforced, not database-enforced,
  in this prototype (`docs/SECURITY.md` §7) — a production deployment should add a database-level
  constraint/trigger as defence-in-depth against a compromised or colluding application layer.

## 14. Unauthorised bulk asset discovery

- **Description:** A party (a claimant, an institution, or an attacker with elevated access) runs
  discovery far beyond what a specific death event/claim legitimately justifies — effectively an
  Aadhaar/PAN-keyed sweep of the citizen's entire financial footprint.
- **Why it matters here specifically:** the "unified claim packet"/discovery convenience the
  platform is built around is precisely the capability that, unbounded, becomes a surveillance
  risk — the same feature that helps a bereaved family is the feature an attacker would want.
- **Mitigation reflected in schema/design:** asset discovery (`docs/WORKFLOWS.md` §3.2) is
  explicitly bounded to relationships already established through legitimate prior linkage or a
  confirmed `DeathEventMatch` — it is structurally not a general search, because the query only
  ever traverses existing linked rows, never an open identifier-based sweep across all
  institutions. Aadhaar/PAN function only as `PersonIdentifier.valueHash` matching inputs, never as
  a standalone key unlocking a broad record set (a `valueHash` match still requires an underlying
  legitimate relationship/context to surface anything).
- **Gap:** bulk-export/discovery-volume anomaly detection (§ "download/export logging" in
  `docs/SECURITY.md` §6) is specified but not fully instrumented in this prototype; a production
  deployment should alert on unusually broad discovery requests specifically.

## 15. Scraping of deceased records

- **Description:** An attacker or unauthorised party attempts to systematically enumerate or scrape
  death-event/deceased-status records — e.g. to build a targeting list for follow-on fraud (fake
  claim solicitation, "we can help you claim your late relative's assets" scams) or for
  unauthorised commercial use (data brokers, obituary-scraping services).
- **Why it matters here specifically:** deceased-status data is uniquely attractive to fraud
  operators specifically because it identifies moments of family vulnerability and financial
  transition.
- **Mitigation reflected in schema/design:** `DeathEvent.isPubliclyVisible` defaults `false` and
  there is no public/unauthenticated read path to `DeathEvent`/`DeathEventMatch`/`Estate` data
  anywhere in the intended design — deceased status is never publicly exposed, full stop. All reads
  require an authenticated, role/attribute-checked session (`docs/SECURITY.md` §3).
- **Gap:** rate-limiting and anti-scraping controls (bot detection, request throttling per
  authenticated session) at the API layer are a production requirement not built into this
  prototype; the primary mitigation here is the absence of any public surface to scrape at all,
  which is a stronger control than rate-limiting a public endpoint would be, but authenticated-
  session scraping by a legitimate-looking but abusive account is still a residual risk a
  production deployment should monitor for.

## 16. Improper Aadhaar/PAN use

- **Description:** Aadhaar/PAN used beyond its legitimate identity-resolution purpose — as a login
  credential, as a blanket authorisation key, or retained/exposed in raw form.
- **Why it matters here specifically:** this is an explicitly named anti-pattern in
  `docs/TERMINOLOGY.md` §5 ("Aadhaar-based universal asset access", "Aadhaar/PAN as a master key")
  precisely because it is a realistic design temptation in an Indian identity-resolution context
  and a serious legal/regulatory exposure if implemented.
- **Mitigation reflected in schema/design:** raw Aadhaar/PAN values are never stored — only
  `maskedValue` and a salted `valueHash` for matching (`PersonIdentifier`) — so there is no raw
  value in the system to misuse in the first place. `valueHash` is used strictly for probabilistic/
  deterministic matching as one factor among several (`docs/AUTHORITY_RULES.md` dimension list),
  never as a stand-alone authorisation credential.

## 17. Cross-tenant data leakage

- **Description:** One institution's officer, or a bug in query scoping, exposes another
  institution's claim/citizen data.
- **Why it matters here specifically:** Suvidha's core value proposition requires multiple
  competing institutions (banks, insurers, depositories) to operate against the same underlying
  `Estate`/`Person` — the exact structure that makes cross-tenant leakage both possible and
  severely damaging (a competitive-intelligence and regulatory problem, not just a privacy one).
- **Mitigation reflected in schema/design:** every institution-scoped model carries an explicit
  `institutionId`; the intended query pattern scopes every institution-side read to the
  authenticated officer's own `User.institutionId`, never a client-supplied value
  (`docs/SECURITY.md` §9).
- **Gap:** this is application-layer scoping only in the current prototype; no database-level row-
  level security is implemented, which `docs/SECURITY.md` §9 flags as the priority hardening item
  for this specific threat given its severity.

## 18. Duplicate claims

- **Description:** The same claimant (or colluding claimants) files functionally the same claim
  more than once — across institutions, or against the same institution twice — seeking duplicate
  payout.
- **Why it matters here specifically:** the platform's own document-reuse convenience
  (`SubmittedEvidence.reusedFromClaimId`) that speeds up legitimate multi-institution claims is
  exactly the pattern a duplicate-claim attempt would also produce, making the two initially
  hard to distinguish without deliberate design.
- **Mitigation reflected in schema/design:** `FraudSignal.signalType = "duplicate_claim"` exists as
  a named, first-class detection category; `Claim.claimNumber` is unique per claim, and a claim's
  `estateId`/`claimantId`/`institutionId` combination is the natural key an automated duplicate
  check evaluates before a second claim is allowed to proceed unflagged.

## 19. Claim redirection

- **Description:** An attacker alters an in-flight claim's details (recipient, relationship
  assertion, or workflow routing) to redirect its outcome.
- **Why it matters here specifically:** a claim can be in review for days-to-weeks
  (`docs/WORKFLOWS.md` §3.4), a long window during which an attacker with any access foothold could
  attempt to quietly alter routing rather than create an obviously new fraudulent claim.
- **Mitigation reflected in schema/design:** every material claim field change should generate an
  `AuditEvent`, making any redirection attempt reconstructable after the fact; maker-checker
  separation means a single compromised actor changing claim details still needs to pass an
  independent Checker review before any payout proceeds (`docs/WORKFLOWS.md` §3.4).

## 20. Fraudulent payout-account substitution

- **Description:** An attacker changes the destination account for an approved or in-review claim's
  payout, redirecting funds.
- **Why it matters here specifically:** this is the single highest-value, most direct fraud outcome
  in the entire domain — a successful substitution converts a legitimate claim into a direct
  financial loss.
- **Mitigation reflected in schema/design:** `FraudSignal.signalType = "payout_account_change"` is a
  named, first-class detection category, specifically flagged in `docs/SECURITY.md` §4 as a
  sensitive action that would trigger step-up authentication in a real deployment. A payout-account
  change mid-claim should always re-open Maker/Checker review rather than silently updating an
  already-approved `Payment.payeePersonId`.
- **Gap:** real step-up authentication for this specific action is not implemented in this
  prototype's mock auth (`docs/SECURITY.md` §4) — this is the single gap most worth prioritising
  first in any hardening path, given the direct financial impact.

## 21. False-positive death matching

- **Description:** A living person is incorrectly matched to a `DeathEvent` that belongs to someone
  else (a same-name/same-DOB collision, a data-entry error), triggering unwarranted institution
  action against their real, living accounts.
- **Why it matters here specifically:** this is the harm the false-death-correction workflow exists
  specifically to remedy, and it is the single most personally damaging failure mode the platform
  can produce if it happens without a fast, clear remedy.
- **Mitigation reflected in schema/design:** `DeathEventMatch.confidenceScore` and `matchFactors`
  make every match explainable, not a black-box score; medium/ambiguous-confidence matches route
  to mandatory `needs_human_review` rather than auto-confirming (`docs/WORKFLOWS.md` §2.3); the
  dedicated `DeathEventCorrection` model provides an expedited, clearly-signposted remedy path
  (`docs/WORKFLOWS.md` §4.3), distinct from the general `Grievance` queue, precisely because this
  harm needs faster handling than a routine complaint.

## 22. Malicious reactivation request

- **Description:** Someone falsely claims a genuinely deceased person is actually alive — e.g. to
  reopen and disrupt a legitimately progressing/settled claim, delay a rightful claimant's payout,
  or as a harassment vector against a grieving family.
- **Why it matters here specifically:** the false-death-correction workflow's necessarily fast,
  low-friction design (because getting a real false-positive wrong is so damaging) is itself a
  potential abuse surface if a malicious reactivation claim could pause a legitimate estate's
  processing on a bare assertion alone.
- **Mitigation reflected in schema/design:** `DeathEventCorrection.status` requires progression
  through `challenge_initiated → reverification_in_progress → registrar_corrected →
  agencies_notified → resolved` — a bare challenge does not itself flip the death record; it
  requires the challenger to produce strong proof-of-life evidence during
  `reverification_in_progress` (`docs/WORKFLOWS.md` §4.3), held to a deliberately high bar. The
  `DeathEvent.status → "contested"` transition that a challenge triggers pauses downstream
  processing precisely so it *can* be investigated properly, but resolution requires the registrar
  to actually correct the record (`registrar_corrected`) — a malicious challenger who cannot
  produce proof-of-life cannot force resolution in their favour; the case remains
  `reverification_in_progress` and is escalated to human/registrar review rather than defaulted
  either way, per the workflow's stated failure condition.
- **Gap:** distinguishing a malicious reactivation attempt from a genuine but slow-to-evidence one
  is fundamentally a human-judgment call for the registrar/Verification Officer; the schema
  supports holding the case open pending real evidence but does not itself detect bad faith —
  repeated unfounded challenges against the same estate could reasonably raise a `FraudSignal` in a
  production build, which is not currently a distinct named `signalType` and is noted here as a
  candidate schema addition.

## Summary table

| # | Threat | Primary schema mitigation | Status |
|---|---|---|---|
| 1 | False death reporting | `DeathEvent.status` lifecycle gating, `DeathEventCorrection` | Implemented in design |
| 2 | Identity theft | `Claimant.identityVerified`, `Relationship.verified` | Implemented; step-up gap noted |
| 3 | Obituary fraud | `isPubliclyVisible = false`, independent verification requirement | Implemented in design |
| 4 | Forged death certificates | `DeathEventEvidence.verificationStatus`, registrar cross-check | Partial — no forensic check |
| 5 | Forged wills | `WillRecord.registrationStatus`/versioning, `Dispute`/`CourtOrder` routing | Partial — no forensic check |
| 6 | Fake legal-heir documents | `AuthorityCredential.verificationStatus`, mandatory human review | Implemented in design |
| 7 | Nominee impersonation | Identity match against `Nomination.nomineePersonId` | Implemented in design |
| 8 | SIM-swap attacks | Multi-factor `PersonIdentifier`/`ContactMethod` verification | Partial — step-up gap |
| 9 | Email takeover | `ContactMethod.verified`, `Communication.direction` audit trail | Partial — no anomaly detection |
| 10 | Elder coercion | `AccessPolicy.timingRule` co-approval/waiting period, revocability | Partial — no coercion detection |
| 11 | Malicious Trusted Contact | `AccessPolicy`/`AccessGrant` strict scoping | Partial — per-view logging gap |
| 12 | Collusion among claimants | Mandatory human review on multi-heir rule row | Implemented in design |
| 13 | Institution insider abuse | Maker-checker separation, tenant isolation, `AuditEvent` | Partial — DB-level enforcement gap |
| 14 | Unauthorised bulk asset discovery | Discovery bounded to existing linked relationships | Partial — volume-anomaly gap |
| 15 | Scraping of deceased records | No public read path; `isPubliclyVisible = false` | Partial — rate-limiting gap |
| 16 | Improper Aadhaar/PAN use | No raw value ever stored; masked + hashed only | Implemented structurally |
| 17 | Cross-tenant data leakage | `institutionId` scoping | Partial — no DB row-level security |
| 18 | Duplicate claims | `FraudSignal.signalType = duplicate_claim`, unique `claimNumber` | Implemented in design |
| 19 | Claim redirection | `AuditEvent` trail, maker-checker | Implemented in design |
| 20 | Fraudulent payout-account substitution | `FraudSignal.signalType = payout_account_change` | Partial — step-up gap (priority) |
| 21 | False-positive death matching | Confidence scoring + mandatory human review | Implemented in design |
| 22 | Malicious reactivation request | High-bar proof-of-life requirement in correction workflow | Partial — no bad-faith detection |

Every "Partial" row above has its underlying gap already documented in `docs/SECURITY.md` (chiefly
§§3–9) rather than newly invented here — this table exists to connect each threat to the specific
mitigation and gap, not to restate the security design in full.
