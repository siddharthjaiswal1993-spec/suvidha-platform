# Corrected Product Thesis

This document records a real scope correction made during this product's design, in the same
detail a product-strategy pivot would be explained to stakeholders. It exists so that anyone
reading this repository understands why two eras of terminology, and a data model with a very
deep "claims" half and a broader "life administration" half, coexist deliberately rather than by
accident.

## 1. What the product was originally framed as

Suvidha began as a narrowly scoped **death-claims and succession platform**: a system to help a
family, after a death in the household, discover what the deceased person held across banks,
insurers, investment platforms, and other institutions; verify the death against each institution's
records; and carry one or more claimants through each institution's claim-settlement process to a
payout, ownership transfer, or account closure.

That framing produced a genuinely deep design: the full death-event lifecycle (reported through
matched, disputed, and corrected), an estate container, claimant and claim modelling across every
major Indian asset category (bank deposits, demat securities, mutual funds, insurance, EPF/EPS/NPS,
government pensions, property, vehicles, and more), maker-checker claim processing, fraud-signal
detection, dispute and court-order handling, and a "unified claim packet" concept for reusing
verified evidence across institutions. This work was correct in its depth and is preserved in full
as Domain I of the corrected platform — none of it was discarded.

## 2. Why that framing was incomplete

Three problems surfaced once the death-claims design was stress-tested against the realities it was
meant to serve:

- **The underlying problem is not death-specific.** Every mechanism the claims design needed —
  an institutional-relationship graph, a document hub with provenance and reuse, a permission model
  for someone acting on another person's behalf, a unified request tracker, an audit trail — is
  exactly what a citizen needs *while alive*, for far more common events: moving house, changing a
  phone number, getting married, changing jobs, renewing a licence, responding to a tax notice.
  Building all of that machinery and then only ever triggering it at death wastes nearly all of its
  value.
- **Bereavement readiness depends on lifelong data quality.** A smooth claim after death depends
  entirely on whether nominee details, addresses, and account records were kept current and
  consistent *before* death. A platform that only appears at the moment of death has no way to
  improve any of that — it inherits whatever mess the fragmented institutions already produced. The
  only way to make succession genuinely smoother is to also be the platform that keeps the living
  citizen's records consistent in the first place.
- **A narrow death-claims framing over-promises and under-delivers on trust.** A product whose only
  reason to exist is bereavement asks a citizen to hand over sensitive institutional access for an
  event most users hope stays hypothetical for decades. A product that is useful every month — for
  renewals, address changes, and tracked requests — earns the trust and the up-to-date data that
  make the bereavement case work well when it eventually matters.

In short: the original scope solved a real and important problem, but solved it in a way that could
only ever be as good as the fragmented, un-orchestrated years that preceded it, and gave citizens no
reason to engage with the platform until the worst moment of their life.

## 3. What corrected it

The correction was a reframing exercise: instead of asking "how do we handle a death well," the
question became "what is death, structurally, as an event?" The answer — it is one of many
**life events** that ripple across a citizen's institutional relationships, each life event
requiring the same underlying capabilities: know which institutions are affected, know what each
one requires, track the action through to completion, and keep the citizen's family or
representative appropriately informed. Address changes, marriages, name corrections, job changes,
and bereavement all decompose into the same shape: a person, a set of affected institutional
relationships, a plan of required actions, and a tracked outcome per action.

This reframing generalised the death-claims machinery upward rather than replacing it:

| Death-claims-era concept | Generalised platform concept |
|---|---|
| Estate / Claim | Service Request (Domain D) — the death-claims Claim becomes one category of Service Request, not a separate object |
| Death Event | Life Event (Domain F) — bereavement becomes one Life Event Template among many |
| Trusted Contact | One access role among several in Domain H — Family Administrator and Professional Representative sit alongside it, all under the same Consent/Delegated Task model |
| LegalDocument + verification | Document & Evidence Hub (Domain C) — the same document, provenance, and reuse model now serves every domain, not only claims evidence |
| Institution + Integration + Connector | Institutional Relationship Graph (Domain B) — the same institution and connector catalog now represents every relationship type, not only asset-holding institutions |
| AuditEvent | The platform-wide audit system (unchanged in kind, now logging every domain's actions, not only claims) |

## 4. The full corrected thesis

> A person's official and financial life is distributed across numerous disconnected systems —
> Aadhaar, PAN, Income Tax, Voter ID, Passport, Driving Licence, vehicle registration, banks,
> insurers, investment platforms, EPF, NPS, employers, DigiLocker, telecom, utilities, and more.
> Each institution has its own login, profile, identity verification, nominee information,
> documents, deadlines, and status language. A citizen who updates information in one place stays
> outdated in many others, misses renewals, loses track of applications, and leaves their family
> without an organised record.
>
> Suvidha creates a unified, citizen-controlled layer over these fragmented systems. Its central
> promise: **update your life once, understand everywhere it matters, complete every required
> institutional action, and track the entire journey from one place.**
>
> This does not mean one request can legally or technically alter every record automatically —
> every downstream action is classified by execution method (executable via API, initiable via
> integration, deep-link redirect, generated form/document packet, assisted digital workflow,
> in-person required, requires institutional/government approval, requires legal/regulatory
> intervention, or unsupported), and the platform always shows the citizen which category applies
> to the action in front of them.

The architectural principle that keeps this promise honest under scrutiny: **one
citizen-controlled command centre, multiple authoritative systems of record.** The institution or
government department is always the system of record for its own data. Suvidha is the system of
engagement, orchestration, consent, delegated access, communication, document reuse, request
tracking, and life-event coordination around those systems — never a replacement for them, and
never a shortcut around the legal process each of them requires. Identifiers like Aadhaar and PAN
are used only as identity-resolution attributes, where legally permitted and consented, for a
specific scoped purpose — never as a universal key that opens every record a citizen has anywhere.

## 5. What did not change

- Domain I (Legacy, Incapacity, Bereavement & Succession) retains the **entire** original design —
  every model, every status lifecycle, every safety rule (no automatic ownership transfer, no
  nominee login to a deceased person's account, Trusted Contact as an access role only, never as
  inheritance) carries forward unchanged. It is now one domain, built to full depth, inside a
  nine-domain platform, rather than the platform's sole purpose.
- The non-negotiable safety principles (no universal database access via Aadhaar/PAN, no silent
  record modification, no bulk sharing without explicit purpose, consent never equals legal
  authority, AI responses are never official decisions, and the rest listed in `TERMINOLOGY.md`'s
  prohibited-terms list) applied to the original claims design and now apply, unchanged, across all
  nine domains.

## 6. What this correction means for how the rest of the documentation reads

Any document in this repository that appears to describe "two products" — a lifelong
administration platform and a separate death-claims system — is describing one platform whose
scope was corrected in place, not two products that were merged. `TERMINOLOGY.md` names this
explicitly as "two eras of terminology," both current, describing one domain (Section 2–3) inside
the whole platform (Section 4). This document is the definitive record of why that is the right
way to read it.
