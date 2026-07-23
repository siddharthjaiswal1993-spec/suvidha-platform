# Authority Rules — The Entitlement Decision-Support Engine

## 1. What this engine is, and what it is not

The `Rule` / `RuleVersion` models store a configurable, versioned, JSON-serialised decision matrix
(`RuleVersion.definition`, evaluated by helpers conceptually grouped under
`src/lib/authority-engine.ts`) that Suvidha's claims workflows consult at defined points. It is
**decision support for institution officers and claimants, never a legal determination**.

Explicitly, the engine never:

- Declares who legally owns or inherits an asset.
- Grants, revokes, or bypasses any legal right.
- Substitutes for a court, a registrar, a probate authority, or personal-law interpretation.
- Auto-approves a payout, transfer, mutation, or closure — every output the engine produces is a
  **recommendation** that a human Maker/Checker/Adjudicator at the institution reviews and, where
  applicable, an officer or court formally decides.
- Infers religion, personal law, or succession scheme from a person's name, location, or language.
  Where a legal path genuinely depends on personal-law considerations (e.g. which succession
  statute applies to an intestate estate), the engine asks only for the fact the law requires (e.g.
  "was there a will", "is there a surviving spouse/child", "what personal law governs this
  estate — as declared by the claimant or evidenced by a legal document") and routes ambiguous or
  contested cases to human/legal review rather than guessing.

What the engine *does* determine, per asset-and-claim context, is a bounded set of **outputs**
(Section 3) from a bounded set of **inputs** (Section 2) — always labelled as a recommended
pathway, never a final grant.

Because rule definitions live in `RuleVersion.definition` (JSON) rather than in UI component code,
a rule change is a data change: it is versioned (`RuleVersion.version`), only one version is
`isActive` per `Rule` at a time, and every version remains in the database so a claim can always be
traced back to the exact rule logic that was active when its recommendation was produced — this is
itself an audit requirement, not just an engineering convenience.

## 2. Decision matrix — input dimensions

Each `RuleVersion.definition` is a set of condition→output rows evaluated over some subset of these
dimensions. A rule need not use every dimension; most rules key on five or six of them.

| # | Dimension | Example values | Primary source |
|---|---|---|---|
| 1 | Asset category | `bank_deposit`, `demat_securities`, `life_insurance`, `epf`, `property`, `vehicle`, ... | `Asset.category` |
| 2 | Product type | "Savings Account", "ULIP", "PPF", "SGB" | `Asset.productType` |
| 3 | Individual vs. joint ownership | sole / joint | `AssetHolding.holdingType`, `JointHolder` presence |
| 4 | Joint-operation mandate | `either_or_survivor`, `former_or_survivor`, `jointly` | `JointHolder.mandate` |
| 5 | Nomination status | none / active / outdated / disputed | `Nomination.status` |
| 6 | Beneficiary status | none / designated / disputed | `BeneficiaryDesignation` presence + status |
| 7 | Will status | no will / will referenced only / will uploaded / will registered | `WillRecord.storageStatus`, `registrationStatus` |
| 8 | Executor status | none appointed / appointed, identity-verified / appointed, unverified | `ExecutorAppointment` + `Claimant.identityVerified` |
| 9 | Trust status | none / settlor deceased, trust active | `TrustRecord` presence |
| 10 | Claimant role (asserted) | `nominee`, `beneficiary`, `surviving_joint_holder`, `executor`, `administrator`, `legal_heir`, `guardian`, `trusted_contact`, `other_claimant` | `Claimant.claimedRole` |
| 11 | Relationship to deceased | spouse / child / parent / sibling / other | `Relationship.relationType`, `Claimant.relationToDeceased` |
| 12 | Minor / adult claimant or beneficiary | minor / adult | `Nomination.isMinor`, `Person.dateOfBirth` |
| 13 | Number of claimants asserted | single / multiple | count of `Claimant` rows on the `Estate` |
| 14 | Institution threshold | amount band vs. institution's simplified-process threshold | `Payment.amountBand` vs. institution policy (not schema-held; institution-configured) |
| 15 | Court order present | none / restraint / succession-determination / other | `CourtOrder.orderType` |
| 16 | Dispute status | none / open / escalated to court | `Dispute.status` |
| 17 | Death location | in India / outside India | `DeathEvent.countryOfDeath` |
| 18 | Residency status (of deceased or claimant) | resident / NRI / foreign national | `CitizenProfile.residencyStatus` |
| 19 | Missing-person status | not applicable / presumption-of-death proceeding pending | `CourtOrder.orderType = "other"` carrying a presumption-of-death order; no dedicated field — flagged via `Dispute`/`CourtOrder` and always routed to human review |
| 20 | Required legal instrument (as determined by earlier dimensions) | succession certificate / probate / letters of administration / legal-heir certificate / surviving-member certificate / none required | derived, echoed to `AuthorityCredential.credentialType` once obtained |
| 21 | Institution-specific policy overlay | e.g. an insurer's own small-claim affidavit-in-lieu policy | institution-configured parameter layered on top of the base rule |

## 3. Decision matrix — possible outputs

Every rule row resolves to exactly one primary output (occasionally plus secondary flags):

1. **Pay to nominee, subject to applicable rights** — nominee receives the asset from the
   institution as a trustee/receiver for the legal heirs under the governing statute; this is not a
   statement that the nominee is the final legal owner.
2. **Transfer to surviving joint holder** — per the registered joint-operation mandate.
3. **Process through executor** — under a valid, verified will with an appointed executor.
4. **Require administrator** — no valid will/executor; a court-appointed administrator is needed.
5. **Require legal-heir documentation** — no will, no nomination dispute; legal-heir certificate or
   equivalent needed to identify who may claim.
6. **Require succession certificate** — typically for movable assets/securities absent a will.
7. **Require probate / letters of administration** — typically where a will exists but requires
   court validation (jurisdiction/asset-type/institution-dependent), or where there is no will and
   letters of administration are the applicable route.
8. **Require indemnity / NOC** — e.g. small-value claims via indemnity bond, or a no-objection
   certificate from co-claimants.
9. **Require guardian documentation** — minor nominee/beneficiary/heir; guardian certificate or
   natural-guardian proof required, funds typically held for the minor's benefit.
10. **Require court / legal review** — dispute, contested nomination, or any condition the engine
    cannot resolve into a bounded pathway.
11. **Place temporary hold** — pending verification, evidence, or resolution of a flagged
    `FraudSignal` or `DeathEventMatch` needing human review.
12. **Reject as insufficiently authorised** — the asserted claimant role/relationship/documents do
    not support any recognised pathway as submitted.
13. **Request additional evidence** — the case is close to resolvable but a specific document or
    fact is missing (feeds `DeficiencyRequest`).

## 4. Worked example rule rows

These are illustrative `RuleVersion.definition` rows in table form. In storage each row is a JSON
object `{ conditions: {...}, output: {...}, requiresHumanReview: boolean, notes: string }`.

### 4.1 Nominee, no dispute

| Condition | Value |
|---|---|
| Asset category | `bank_deposit` |
| Nomination status | active, single nominee, adult |
| Dispute status | none |
| Number of claimants | single (only the nominee has claimed) |
| Claimant role | `nominee`, identity-verified |

**Output:** Pay to nominee, subject to applicable rights. No legal-heir documentation required for
release; institution communication must state that the nominee holds the amount as a trustee for
the legal heirs, not as final owner. `requiresHumanReview = false` (Maker/Checker sign-off still
applies as standard process, not because the engine flags anything).

### 4.2 Surviving joint holder

| Condition | Value |
|---|---|
| Asset category | `bank_deposit` or `fixed_deposit` |
| Ownership | joint |
| Joint-operation mandate | `either_or_survivor` or `former_or_survivor` |
| Claimant role | `surviving_joint_holder` |
| Dispute status | none |

**Output:** Transfer to surviving joint holder — process as account modification (deceased holder
removed) rather than a claim against the estate, per standard banking practice for either/or or
former/survivor mandates. `requiresHumanReview = false`.

### 4.3 Valid will with executor

| Condition | Value |
|---|---|
| Will status | uploaded or registered |
| Executor status | appointed, identity-verified |
| Beneficiary status | designated under the will, no dispute |
| Dispute status | none |
| Court order | none |

**Output:** Process through executor. Required legal instrument: probate, where the asset
class/jurisdiction requires it (institution-specific policy overlay decides whether probate is
mandatory or the will alone suffices, e.g. many banks accept an unprobated will with indemnity
below their threshold). `requiresHumanReview = false` unless institution threshold exceeded.

### 4.4 No will, no nomination, multiple heirs

| Condition | Value |
|---|---|
| Will status | no will |
| Nomination status | none |
| Beneficiary status | none |
| Number of claimants | multiple (e.g. spouse + two children asserting legal-heir status) |
| Dispute status | none (heirs agree on shares) |

**Output:** Require legal-heir documentation (legal-heir certificate / succession certificate
depending on asset category and institution threshold) plus NOC from all co-claimants before
payout to a single claimant, or direct proportional payout to all identified heirs. Required legal
instrument determined by asset category: succession certificate for securities/deposits above
threshold, legal-heir certificate + indemnity for smaller bank balances. `requiresHumanReview =
true` — multiple heirs always gets a human review checkpoint even absent an active dispute.

### 4.5 Minor nominee

| Condition | Value |
|---|---|
| Nomination status | active, single nominee |
| Minor/adult | minor |
| Guardian documentation | not yet submitted |

**Output:** Require guardian documentation. Funds are payable to the natural guardian or
court-appointed guardian for the minor's benefit, typically into a guardian/minor account with
withdrawal restrictions per institution policy; the minor is never made to log in or execute
documents themselves. `requiresHumanReview = true` — always, regardless of amount.

### 4.6 Conflicting nominations

| Condition | Value |
|---|---|
| Nomination status | disputed (e.g. two nomination forms on file, or nomination contradicts will) |
| Dispute status | open |
| Number of claimants | multiple, asserting different roles |

**Output:** Place temporary hold, then require court/legal review. No payout proceeds until the
conflict is resolved via `Dispute` → possibly `CourtOrder`. `requiresHumanReview = true`;
institution must not apply any risk action beyond a hold (see `docs/WORKFLOWS.md` §
"Institution propagation & acknowledgement" for the distinction between a hold and a freeze).

## 5. How outputs are consumed downstream

An engine output populates `ClaimAsset.recommendedPathway` at the moment an asset is added to a
`Claim`, and typically instantiates a `ClaimWorkflow` from a `templateKey` (e.g.
`nominee_bank_deposit`, `legal_heir_no_will`, `executor_led_estate`) whose `WorkflowStep` /
`Requirement` rows enumerate the actual document checklist. A `Decision` row recorded by a Maker,
Checker, or Adjudicator (`Decision.makerCheckerRole`, `Decision.outcome`) is the institution's own
act of approving, rejecting, partially approving, or escalating — the engine's recommendation is
input to that decision, never a replacement for it.

## 6. Governance of rule changes

- Every edit to a rule creates a new `RuleVersion` rather than mutating an existing one.
- Exactly one `RuleVersion` per `Rule` carries `isActive = true` at a time.
- `AuditEvent` records `rule_version.activated` / `rule_version.deactivated` actions so a claim
  processed under an old rule can always be reconstructed.
- Rule authorship in a real deployment would sit with a compliance/legal function per institution
  or per regulator category (RBI/SEBI/IRDAI/PFRDA/EPFO/IEPFA/State Registrar General), not with
  engineering — this prototype seeds illustrative rules only and does not encode actual current
  Indian succession law in full generality.
