# Suvidha — Unified Citizen Life Administration Platform

> **Prototype.** All data is synthetic. No real Aadhaar, PAN, passport, bank, or policy
> information is used or stored anywhere in this repository. See
> [`docs/ASSUMPTIONS_AND_LIMITATIONS.md`](docs/ASSUMPTIONS_AND_LIMITATIONS.md) for the full,
> honest account of what's real vs. simulated in this build.

Suvidha is one secure command centre through which a person can discover, organise, manage, and
track their lifelong relationships, records, documents, requests, obligations, and life-event
changes across India's government departments, banks, insurers, investment providers, employers,
and utilities — with a full estate-planning and bereavement-claims journey (**Legacy &
Succession**) as one domain inside the platform, not a separate product.

The product was originally scoped narrowly as a death-claims platform and then deliberately
broadened; see [`docs/CORRECTED_PRODUCT_THESIS.md`](docs/CORRECTED_PRODUCT_THESIS.md) for that
pivot and why the Legacy & Succession work was kept, not discarded.

Start here:
- [`docs/00_EXECUTIVE_SUMMARY.md`](docs/00_EXECUTIVE_SUMMARY.md) — the whole product in two pages
- [`docs/PRD.md`](docs/PRD.md) — the requirements document, linking out to every deep-dive doc
- [`docs/TERMINOLOGY.md`](docs/TERMINOLOGY.md) — the exact vocabulary used throughout, and the
  terms this product deliberately never uses (a platform permission is never legal ownership)

---

## Architecture summary

- **Nine product domains** (A–I), sharing one identity graph, institution graph, document hub,
  consent model, and audit system rather than being nine disconnected features — see
  [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md).
- **Institutions remain the system of record.** Suvidha is the system of engagement —
  orchestration, consent, delegated access, communication, and request tracking. It never claims
  to silently edit a government or bank database, and every request/action discloses its real
  **execution method** (API / integration / deep-link / generated packet / assisted workflow /
  in-person / approval-required / unsupported) — see
  [`docs/SERVICE_REQUEST_ENGINE.md`](docs/SERVICE_REQUEST_ENGINE.md).
- **Server-enforced authorization**, not just hidden UI. `src/lib/authz/` (permissions, guards,
  resource-access, policies) independently re-verifies role, ownership, institution tenancy, and
  state-machine legality on every Server Action — a citizen changing a URL, or an officer from the
  wrong institution, gets rejected server-side even though the UI never offers them the action in
  the first place. Maker and checker are enforced as different users. See
  [`docs/ACCESS_CONTROL_MATRIX.md`](docs/ACCESS_CONTROL_MATRIX.md).
- **The address-change life event is the flagship, fully-wired cross-domain journey**: it creates
  real per-institution `ServiceRequest`s with a genuine mix of execution methods (one instant API
  completion, one simulated integration, one manual self-report, and one that goes through real
  institution review — deficiency → citizen response → maker recommendation → a *different*
  checker's approval → institution completion), and completion reconciles the change back into
  the citizen's profile and institution-relationship views. See
  [`docs/LIFE_EVENT_ORCHESTRATION.md`](docs/LIFE_EVENT_ORCHESTRATION.md).
- **~105 Prisma models** across the Legacy & Succession domain (estate planning, death-event
  lifecycle, claims, maker-checker) and the lifelong-administration domain (master profile,
  institutional relationships, service requests, life events, inbox, delegated access) — sharing
  `CaseAssignment`/`Decision`/`DeficiencyRequest` across both rather than duplicating them.
- **`src/config/capabilities.ts`** is the single source of truth for what's actually
  functional vs. interface-only vs. documented-only per feature — every "known limitations" claim
  in this README traces back to it, so the two can't silently drift apart.

## Technology stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS v4, hand-rolled Radix-UI-based component primitives (`src/components/ui/`) |
| Forms | React Hook Form + Zod |
| Data | Prisma ORM v7 + SQLite, via the `@prisma/adapter-better-sqlite3` driver adapter (Prisma 7 requires an explicit adapter — see `src/lib/db.ts`) |
| Auth | Mock cookie-based demo persona picker — **not real authentication**, intentionally (see `docs/SECURITY.md`) |
| Testing | Vitest (unit) + Playwright (end-to-end) |
| Deployment | Vercel |

Why SQLite for the whole prototype, not just local dev: the schema deliberately avoids Prisma's
native `enum` and `Json` column types (see the header comment in `prisma/schema.prisma`), so a
future move to PostgreSQL is a datasource-and-adapter swap, not a schema rewrite — see
`docs/ARCHITECTURE.md`'s "Known limitations of the deployed demo" for exactly what that swap looks
like and why the deployed demo doesn't do it today.

---

## Setup

### Prerequisites

- Node.js 20+ and npm
- No external accounts, API keys, or database provisioning required — the app is fully
  self-contained.

### Installation

```bash
git clone <this-repo>
cd suvidha-platform
npm install
```

### Environment variables

None are required. `DATABASE_URL` defaults to `file:./prisma/dev.db` everywhere (see
`prisma.config.ts` and `src/lib/db.ts`) if unset. Copy `.env.example` to `.env` only if you want to
override it.

### Database setup & seed

```bash
npx prisma migrate deploy   # applies the committed migrations to prisma/dev.db
npm run db:seed             # populates the demo data described below
```

`prisma/dev.db` is committed to this repository (intentionally — see "Known limitations" below),
so the app also works immediately after `npm install` without running these commands. Run them
again any time you want to reset to a clean seeded state (or run `npm run db:reset`, which drops,
re-migrates, and re-seeds in one step).

### Development

```bash
npm run dev
```

Open http://localhost:3000. Visit `/login` and pick any seeded persona — there are no passwords.

### Build

```bash
npm run build
npm start
```

### Tests

```bash
npm run typecheck     # tsc --noEmit
npm run lint           # eslint
npm test                # vitest — unit tests for the authority & permission engines
npm run test:e2e        # playwright — golden-flow end-to-end tests (starts its own dev server)
```

The end-to-end suite mutates the seeded database (approvals, decisions, status corrections) —
re-run `npm run db:reset` before re-running `npm run test:e2e` if you want a clean pass.

---

## Demo personas

Every persona below is selectable with one click from `/login` — no credentials needed.

**Citizen-side**

| Persona | Role | What they demonstrate |
|---|---|---|
| Meera Krishnan | Estate Planner / Independent Citizen | Full lifelong-admin experience: profile discrepancies, institutional relationship graph, an in-progress address-change life event, estate-planning readiness, Trusted Contacts |
| Divya Krishnan | Family Administrator | Delegated-task preparation (Domain H) |
| Deepa Shah | Claimant (pre-authorised) | A smooth, undisputed multi-institution claim after a registrar-verified death |
| Lakshmi Reddy | Claimant (uninvited family member) | Intestate succession, multiple heirs, an open deficiency request |
| Fathima Begum | Independent Citizen | A living person incorrectly matched to a death event — false-positive correction |

**Government & institution ops-side**

| Persona | Role | What they demonstrate |
|---|---|---|
| R. Subramaniam | Registrar Officer | Death-event verification and institution matching |
| Neha Kulkarni | Claims Officer (Suraksha Life Insurance) | Case workspace, authority-pathway recommendation, maker-checker decision |
| Rohan Das | Verification Officer (Suraksha Life Insurance) | Document/claimant verification |
| Anita Rao | Maker (Ashoka National Bank) | Recommends a decision — cannot also approve it |
| Suresh Menon | Checker (Ashoka National Bank) | Approves/rejects a maker's recommendation — must be a different user |
| Priya Nambiar | Grievance Officer (Suraksha Life Insurance) | Grievance queue with mandatory resolution category/note/citizen-ack |
| V. Chandran | Auditor (Ashoka National Bank) | Append-only audit log — read-only, cannot record decisions |

## Golden demo flows

1. **Estate Planner onboarding & planning** — log in as Meera → `/home` → `/profile` (see the
   Aadhaar/PAN name and address discrepancies) → `/institutions` → `/legacy/planning` (readiness
   score, nomination gaps, Trusted Contacts, will & executor).
2. **Address-change life event** — as Meera, `/life-events` → open "Moving to a new address" → see
   a distinct action per execution method: complete the City Electricity Board action instantly
   (direct API), and self-report the Acme Innovations one with a reference number and date
   (manual, marked citizen-reported-not-institution-verified).
3. **Address-change institution review loop (the primary end-to-end outcome)** — as Meera, respond
   to the open deficiency on the pre-staged Ashoka National Bank request → sign in as Anita (maker)
   and recommend approval → sign in as Suresh (checker) and approve, then complete the institution
   update → sign back in as Meera and see `/institutions` now show the new address, sourced from
   Ashoka National Bank. Covered end to end by `tests-e2e/golden-flow-g-*.spec.ts`.
4. **Family assisted access** — as Meera, `/family-access` → approve Divya's pending delegated
   task.
5. **Smooth claim** — log in as Deepa → `/legacy/claim` → open the Ashoka National Bank claim →
   see the completed workflow timeline and recorded payout.
6. **Institution claim processing** — log in as Neha (Claims Officer) → `/ops/claims` → open the
   Suraksha Life Insurance case → see the authority-pathway recommendation → record a
   maker/checker decision.
7. **No-will, multiple-heirs claim** — log in as Lakshmi → `/legacy/claim` → see the open
   deficiency request asking for a succession certificate.
8. **False-death correction** — log in as Fathima → `/legacy` (see the flag banner) →
   `/legacy/status-correction` → confirm re-verification → see the record corrected and
   restrictions reversed.
9. **Authorization abuse is rejected** — a claimant guessing another claimant's claim URL, a
   citizen guessing another citizen's request URL, an officer opening another institution's case,
   and an auditor invoking a decision form directly all fail server-side. Covered by
   `tests-e2e/golden-flow-i-negative-authorization.spec.ts`.
10. **Document, inbox, delegation, institution, and grievance actions** — as Meera: upload a
    document and share it with an institution (then revoke the share); reply to an inbox thread,
    report a phishing-style message as suspicious, and escalate a thread straight into a tracked
    grievance; invite an assistant scoped to one specific open request; connect a new institution
    (Sanchar Mobile Networks) through the simulated two-step verification; submit a *mobile-number*
    change (not address) through the general request engine and watch it reconcile into
    `/profile`'s field history after the maker/checker loop; escalate an open grievance. Covered by
    `tests-e2e/golden-flow-j-capability-completion.spec.ts`.

All ten are covered by Playwright specs in `tests-e2e/` (22 tests across 9 spec files).

---

## Known limitations

- **This is mock authentication, not real auth.** A plain cookie holds a user id; there are no
  passwords, MFA, or step-up verification. See `docs/SECURITY.md`.
- **The deployed Vercel demo's database is not durably persistent.** SQLite runs from a
  copy-on-cold-start file in `/tmp`; a redeploy, cold start, or a second concurrent serverless
  instance resets or diverges from your changes. See `docs/ARCHITECTURE.md`.
- **No real external integrations.** Every connector (banks, DigiLocker, EPFO, Aadhaar, etc.) is a
  labeled mock — see `docs/INTEGRATIONS.md` for exactly which of six honesty labels each one
  carries, and `docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` for the underlying research (51 official
  sources cited in `docs/OFFICIAL_SOURCES.md`).
- **The "Life Admin Assistant" is a deterministic, grounded simulation, not a live LLM** — see
  `docs/AI_ASSISTANT.md` for exactly what it does and why.
- **Not every institution category in India is modeled.** A dictionary-based i18n architecture
  exists and the language switcher works, but Hindi coverage is not the current product priority —
  English is the primary, default experience. Full list of scope decisions in
  `docs/ASSUMPTIONS_AND_LIMITATIONS.md`.
- **This is not legal, tax, or financial advice.** Final legal/inheritance determinations always
  route to human, institution, or court review — the authority-pathway engine
  (`src/lib/engines/authority-engine.ts`) only ever recommends a pathway, never declares
  ownership. See `docs/AUTHORITY_RULES.md`.

## Real vs. mocked, at a glance

| Category | Status |
|---|---|
| UI, business logic, data model, workflows | Real, working code in this repository |
| SQLite database, seeded scenarios | Real data, entirely synthetic |
| Bank/insurer/AMC/government connectors | Mocked adapters with realistic responses — never a live external API call |
| DigiLocker / API Setu | The one connector with a genuinely open public API in reality; still simulated in this prototype — see `docs/INTEGRATIONS.md` |
| AI assistant | Deterministic, cited, rule-based simulation — no LLM call |
| Death-event national propagation | Labeled a future policy dependency — no such nationwide API exists today; see `docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md` |

## Repository structure

```
docs/                     Full documentation set (38 files) — start with docs/PRD.md
prisma/schema.prisma       The full data model (source of truth — see docs/DATA_MODEL.md)
prisma/seed.ts              Seed script for every demo persona and scenario
src/app/(public)/          Landing, how-it-works, login, and other unauthenticated pages
src/app/(citizen)/          The citizen-facing app: profile, institutions, documents, requests,
                             inbox, life events, financial admin, family access, legacy & succession
src/app/ops/                 The government/institution operations console, including the general
                              Service Requests queue/workspace (not just Legacy & Succession claims)
src/components/ui/           Hand-rolled design-system primitives
src/components/domain/       Product-specific shared components (nav, badges, topbar, mobile drawer)
src/config/capabilities.ts    The capability registry — source of truth for what's real vs. simulated
src/lib/authz/                Server-enforced permissions, ownership/tenancy guards, and policies
src/lib/engines/              The authority-pathway and permission-grant decision engines
src/lib/reconciliation.ts     Reconciles a citizen's profile once an institution completes a change
tests-e2e/                    Playwright specs for the golden demo flows, including negative-authz
```
