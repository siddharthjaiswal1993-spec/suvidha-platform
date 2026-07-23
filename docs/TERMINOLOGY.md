# Terminology

Suvidha uses precise, consistent terminology throughout the product, the codebase, and this
documentation. This file is the single source of truth for that vocabulary. If a screen, a
Prisma model, or a doc uses a term not defined here, that is a bug — fix the term, not this file,
unless the new term genuinely doesn't fit an existing category.

Two eras of terminology exist in this repository because the product's scope was corrected
partway through design (see `CORRECTED_PRODUCT_THESIS.md`): the original **Legacy, Incapacity,
Bereavement & Succession** vocabulary (Sections 2–3 below), and the broader **lifelong citizen
administration** vocabulary the corrected thesis added (Section 4). Both are current — the first
describes one product domain, the second describes the whole platform around it.

---

## 1. Product identity

- **Suvidha** — the product name. Hindi/pan-Indian word for convenience, ease, and facility;
  chosen because it reads calmly across literacy levels and languages, carries no
  death/inheritance connotation (important because Legacy & Succession is one domain among many,
  not the whole product), and evokes ease-of-service rather than bureaucracy. See
  `PRODUCT_VISION.md` for the full naming rationale. It is a common descriptive word, not a
  coined brand — a real launch would need trademark clearance and a distinct visual identity;
  the prototype uses it as a working name.
- **Citizen** — the general term for a living person using the platform in the lifelong
  administration sense. Narrower role-specific terms (Estate Planner, Claimant, etc.) are used
  wherever the specific context demands precision.

---

## 2. Living-person roles (Legacy & Succession domain)

- **Estate Planner** — user-facing umbrella term for a living person preparing their estate.
- **Asset Owner** — generic product term for anyone who owns a tracked asset.
- **Account Holder**, **Depositor**, **Investor**, **Subscriber**, **Policyholder**,
  **Property Owner**, **Vehicle Owner**, **Business Owner** — precise terms used only in the
  context of the specific asset/product type they describe.
- **Testator** — only once the person has made a will.
- **Settlor** — only where a trust is involved.
- **Data Principal** — only in the data-protection/consent context.

## 3. Post-death and claims roles (Legacy & Succession domain)

- **Deceased Person**, **Estate of the Deceased**.
- **Informant** — the person reporting the death to the registrar.
- **Trusted Contact** (a.k.a. **Digital Legacy Contact**) — a **platform access role only**. It
  is never nomination, executorship, ownership, or legal authority. See the prohibited-terms list
  below.
- **Nominee** — an asset-specific nomination.
- **Beneficiary** — a person entitled under a policy, will, trust, or similar instrument.
- **Surviving Joint Holder**, **Executor** (appointed under a will), **Administrator** (appointed
  by a competent authority or court), **Legal Heir**, **Successor**, **Claimant**,
  **Legal Representative**, **Guardian** (acting for a minor or dependent claimant),
  **Authorised Representative** (only where the relevant authority survives and is legally
  applicable).

## Institution roles (shared across domains)

- **Registrar of Births and Deaths**, **Issuing Authority**, **Participating Institution**,
  **Record Custodian**, **Financial Information Provider**, **Claims Officer**, **Case Officer**,
  **Verification Officer**, **Maker**, **Checker**, **Adjudicator**, **Nodal Officer**,
  **Grievance Officer**, **Integration Administrator**, **Auditor**.

## Legacy & Succession process terms

Death registration · Death-event verification · Deceased-status notification · Record matching ·
Claim settlement · Transmission of securities · Succession · Estate administration · Probate ·
Letters of administration · Succession certificate · Legal-heir certificate ·
Surviving-member certificate · Mutation of property · Transfer of ownership · Account closure ·
Entitlement payout · Record cessation · Record correction · False-death reactivation ·
Intestate succession · Testamentary succession · **Unified claim packet**.

---

## 4. Lifelong citizen administration roles (added by the corrected thesis)

- **Independent Citizen** — a person managing their own records, institutions, requests,
  documents, deadlines, and life events.
- **Family Administrator** — a family member helping a parent, child, spouse, or dependant with
  permitted administrative work. Distinct from a Trusted Contact (a Legacy & Succession-specific
  access role) and from a Professional Representative (below).
- **Assisted Citizen** — an older adult, a person with a disability, or a low-digital-literacy
  user who delegates limited assistance to a Family Administrator or Professional Representative.
- **Parent or Guardian** — managing records and services for a minor or dependant.
- **Professional Representative** — a Chartered Accountant, lawyer, adviser, or other authorised
  service provider handling specifically delegated tasks under an explicit permission tier
  (see Section 5). Never implies power of attorney unless a `CourtOrder`/`AuthorityCredential`
  record backs it.
- **Government Service Officer**, **Financial Institution Operations Officer**,
  **Institution Administrator**, **Verification Officer**, **Grievance Officer**,
  **Auditor / Regulator** — institution-side personas across every domain, not just claims.

## Lifelong administration process terms

- **Institutional Relationship** — the umbrella term for any relationship between a Person and an
  Institution (a government identity record, a licence, a financial account, an employer
  relationship, a utility connection, a business registration). Not the same as an **Asset**
  (an Institutional Relationship *may* link to an Asset when it is a financial holding — see
  `docs/DATA_MODEL.md`'s consolidation notes).
- **Profile Field / Profile Field Value / Profile Conflict** — the master-profile vocabulary:
  a *field* (e.g. "present address") has multiple *values* reported by different sources, and a
  *conflict* is a detected disagreement between two values. The platform never auto-declares a
  winning value — see `docs/MASTER_PROFILE_AND_DISCREPANCIES.md`.
- **Service Request** — the citizen-facing unified request object, regardless of institution or
  category. Its **normalised status** is shown alongside — never instead of — the institution's
  own **raw/official status**.
- **Execution Method** — the classification every Service Request and Life Event Action must
  carry: `executable via API`, `initiable via integration`, `deep-link redirect`,
  `generated form/document packet`, `assisted digital workflow`, `in-person required`,
  `requires institution/legal approval`, or `unsupported`. Never implied to be "instant" when it
  is not.
- **Life Event** — an instance of a citizen going through a defined life-event template (address
  change, marriage, job change, bereavement, ...), which generates a plan of
  **Life Event Actions** across affected Institutional Relationships.
- **Inbox Thread / Message / Notice** — the unified communication centre vocabulary. A Notice is
  a Message with additional structured fields (notice number, response deadline) for
  regulator/tax/insurance notices specifically.
- **Consent Scope / Data Share** — a Consent Record's specific, purpose-limited grant, and the
  durable log of what was actually disclosed under it.
- **Delegated Task** — a specific task given to a Family Administrator or Professional
  Representative, carrying one of six **permission tiers** (view, assist, prepare, submit, sign,
  receive communication) that is never treated as legal authority or ownership.

---

## 5. Explicitly prohibited terms

Never use these anywhere in the product, code, or documentation — they misrepresent what the
platform actually does or what a role actually means:

- Post-death owner · Universal nominee · Master nominee · Automatic inheritor ·
  Nominee login to the deceased account · Transfer of the deceased person's password ·
  Automatic ownership transfer · Aadhaar-based universal asset access ·
  Aadhaar/PAN as a "master key" to all records · Platform "owns" or "controls" citizen funds ·
  AI "approves" a request (only institutions and their officers approve requests) ·
  Platform directly edits a government/institution database.

A platform permission must never be represented as legal ownership, inheritance entitlement, or
official government authority.
