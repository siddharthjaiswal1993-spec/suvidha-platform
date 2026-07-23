# Executive Summary

## What Suvidha is

Suvidha — the Unified Citizen Life Administration and Institutional Service Orchestration
Platform — is a citizen-controlled layer that sits above the many separate institutions a person
deals with over a lifetime: government identity systems, tax authorities, banks, insurers,
investment platforms, retirement funds, employers, utilities, and more. It does not replace any of
these institutions or their systems of record. It gives a citizen one place to see what is true
about their own official and financial life across all of them, to act on that information, and to
track every request through to completion.

The product is a portfolio-quality demonstration of product and engineering judgment applied to a
real, well-understood Indian problem. It is not a government project, not affiliated with any
government body or company named in this documentation, and not a production service. Every claim
in this documentation about what the system does is qualified by whether that capability is real,
partner-dependent, policy-dependent, or simulated for demonstration purposes — see
`ASSUMPTIONS_AND_LIMITATIONS.md` for the complete, honest accounting.

## The problem

A person's official and financial identity is fragmented by design. Aadhaar, PAN, Income Tax
records, Voter ID, Passport, Driving Licence, vehicle registration, bank accounts, insurance
policies, mutual fund and demat holdings, EPF/NPS accounts, employer records, DigiLocker documents,
telecom connections, and utility accounts are each held by a different institution with its own
login, its own copy of the citizen's name/address/mobile number, its own nominee or beneficiary
record, its own document requirements, and its own status vocabulary.

When a citizen moves house, changes a phone number, gets married, has a child, changes jobs, or
dies, that single real-world event has to be re-reported, separately, to a dozen or more
institutions — each with different forms, different proof requirements, and no visibility into
whether the others have caught up. The result: missed renewal deadlines, notices that go unread,
applications whose status nobody can find, addresses and names that quietly drift out of sync
across records, nominee details left pointing at people who are no longer the right choice, and — in
the worst case — a bereaved family with no organised picture of what the deceased held or how to
claim it.

Institutions carry the mirror image of this cost: incomplete applications, high volumes of "what is
the status of my request" contact-centre traffic, duplicate paperwork for information they already
verified last year, and manual reconciliation work that a shared, consented record could remove.

## The corrected thesis

Suvidha was originally scoped narrowly, as a death-claims and succession platform. That scope was
correct in its depth but wrong in its frame: bereavement is one moment in a much longer citizen
journey, and the same fragmentation, the same institutional graph, and the same need for a
trusted, consented, one-place-to-manage-it-all layer exist for every other life event too. The
product was corrected to its current, broader thesis (full rationale in
`CORRECTED_PRODUCT_THESIS.md`):

> Update your life once, understand everywhere it matters, complete every required institutional
> action, and track the entire journey from one place.

This does not mean Suvidha can silently change a bank record, a government database, or a tax
filing on the citizen's behalf. Every action the platform helps a citizen take is explicitly
labelled by how it is actually executed — from a fully automated API call, down through supported
integrations, deep-link redirects, generated form packets, assisted digital workflows, and
in-person visits, to actions that require institutional or legal approval or are not yet supported
at all. The architectural principle that keeps this honest is: **one citizen-controlled command
centre, multiple authoritative systems of record.** The institution always remains the system of
record; Suvidha is the system of engagement, consent, tracking, and coordination around it.

## Who it is for

Thirteen personas are designed for across two broad groups (full detail in
`PERSONAS_AND_JTBD.md`):

- **Citizens and their circle** — the Independent Citizen, Family Administrator, Assisted Citizen,
  Parent/Guardian, Professional Representative, Estate Planner, and Claimant/Legal Representative.
- **Institution and oversight roles** — the Government Service Officer, Financial Institution
  Operations Officer, Institution Administrator, Verification Officer, Grievance Officer, and
  Auditor/Regulator.

## What's real vs. simulated in this prototype

| Layer | Status |
|---|---|
| Data model | Real. A complete Prisma schema (~65+ models) covering identity, institutional relationships, documents, service requests, life events, communication, consent/delegation, and the full Legacy & Succession domain is designed and migrated. |
| Application/UI | In build-out. The scaffold exists; the golden-flow screens, seed data, and business-logic engines described in this documentation are the next construction phase, sequenced in `ROADMAP.md`. |
| Institutions and integrations | Entirely simulated. All banks, insurers, government registries, and connectors in this prototype are synthetic and clearly labelled as such — see the `Connector.integrationLabel` taxonomy in `ASSUMPTIONS_AND_LIMITATIONS.md`. No real institution's API, portal, or data is accessed. |
| Identity data | Synthetic only. No real Aadhaar, PAN, or other government identifiers are collected, stored, or processed anywhere in this codebase. |
| AI assistant | Planned as a rule-based/templated simulation for this prototype, not a live LLM integration — stated explicitly rather than implied. |
| Deployment | Vercel-hosted demo with a documented non-durable SQLite-on-`/tmp` limitation; a real deployment path to Postgres is designed but not required for local development. |

## Current status

As of this writing, the Prisma schema is complete and migrated, the terminology is finalised, and
this product-documentation set is being written to specify the eight golden demo flows and the
domain-by-domain product design that the application layer will implement next. No citizen-facing
screens, seed data, or business-logic engines exist yet beyond the default framework scaffold — the
build-out follows the phased plan in `ROADMAP.md`, starting with the master profile and document
hub (Phase 1).
