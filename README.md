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
- **~100 Prisma models** across the Legacy & Succession domain (estate planning, death-event
  lifecycle, claims, maker-checker) and the lifelong-administration domain (master profile,
  institutional relationships, service requests, life events, inbox, delegated access).

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
| Rohan Das | Verification Officer | Document/claimant verification |
| Anita Rao / Suresh Menon | Maker / Checker (Ashoka National Bank) | The maker-checker approval pattern |
| Priya Nambiar | Grievance Officer | Grievance queue |
| V. Chandran | Auditor | Append-only audit log |

## Golden demo flows

1. **Estate Planner onboarding & planning** — log in as Meera → `/home` → `/profile` (see the
   Aadhaar/PAN name and address discrepancies) → `/institutions` → `/legacy/planning` (readiness
   score, nomination gaps, Trusted Contacts, will & executor).
2. **Address-change life event** — as Meera, `/life-events` → open "Moving to a new address" →
   mark actions done and watch progress update, each with an honest execution-method label.
3. **Family assisted access** — as Meera, `/family-access` → approve Divya's pending delegated
   task.
4. **Smooth claim** — log in as Deepa → `/legacy/claim` → open the Ashoka National Bank claim →
   see the completed workflow timeline and recorded payout.
5. **Institution claim processing** — log in as Neha (Claims Officer) → `/ops/claims` → open the
   Suraksha Life Insurance case → see the authority-pathway recommendation → record a
   maker/checker decision.
6. **No-will, multiple-heirs claim** — log in as Lakshmi → `/legacy/claim` → see the open
   deficiency request asking for a succession certificate.
7. **False-death correction** — log in as Fathima → `/legacy` (see the flag banner) →
   `/legacy/status-correction` → confirm re-verification → see the record corrected and
   restrictions reversed.

All seven are covered by Playwright specs in `tests-e2e/`.

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
- **Not every institution category in India is modeled**, and Hindi localisation covers primary
  navigation and key surfaces, not every string. Full list of scope decisions in
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
docs/                     Full documentation set (33 files) — start with docs/PRD.md
prisma/schema.prisma       The full data model (source of truth — see docs/DATA_MODEL.md)
prisma/seed.ts              Seed script for every demo persona and scenario
src/app/(public)/          Landing, how-it-works, login, and other unauthenticated pages
src/app/(citizen)/          The citizen-facing app: profile, institutions, documents, requests,
                             inbox, life events, financial admin, family access, legacy & succession
src/app/ops/                 The government/institution operations console
src/components/ui/           Hand-rolled design-system primitives
src/components/domain/       Product-specific shared components (nav, badges, topbar)
src/lib/engines/             The authority-pathway and permission-grant decision engines
tests-e2e/                    Playwright specs for the golden demo flows
```
