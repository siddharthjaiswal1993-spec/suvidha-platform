# Architecture

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16, App Router | `proxy.ts` (the v16 rename of `middleware.ts`) gates protected route groups by cookie presence only; fine-grained role authorization happens in each route group's `layout.tsx`, a Server Component with full database access. |
| Language | TypeScript | Strict mode. |
| Styling | Tailwind CSS v4 | Design tokens in `src/app/globals.css` (`@theme inline` block) — see `docs/DESIGN_SYSTEM.md`. |
| Component primitives | Hand-rolled, Radix-UI-based (`src/components/ui/`) | A shadcn/ui-equivalent set built directly on `@radix-ui/react-*` primitives + `class-variance-authority` + `tailwind-merge`, to avoid a network-dependent CLI registry fetch. |
| Forms | React Hook Form + Zod | Validation schemas colocated with the Server Action they submit to. |
| Data | Prisma ORM v7 + SQLite | See "Database" below — Prisma 7 requires an explicit driver adapter rather than an implicit env-based connection. |
| Charts | Recharts | Used sparingly (readiness score, SLA dashboard) — see `docs/DESIGN_SYSTEM.md` for when a chart is warranted at all. |
| Testing | Vitest (unit) + Playwright (e2e) | See `docs/TEST_PLAN.md`. |
| Deployment | Vercel | See "Known limitations of the deployed demo" below. |

## Database: Prisma 7's driver-adapter pattern

Prisma 7 removed the implicit `DATABASE_URL`-based connection — `new PrismaClient()` now throws
unless given an explicit adapter. This app uses `@prisma/adapter-better-sqlite3` (a native module
wrapping `better-sqlite3`) everywhere:

```ts
// src/lib/db.ts
const adapter = new PrismaBetterSqlite3({ url: resolveDatabaseUrl() });
export const prisma = new PrismaClient({ adapter });
```

`resolveDatabaseUrl()` picks the right file path per environment (see the file for the full
comment): a plain `prisma/dev.db` locally, or a copy-on-cold-start `/tmp` file on Vercel.

**Why SQLite for the whole prototype, not just "local dev":** the assignment brief asked for a
self-contained prototype (`npm install && npm run db:seed && npm run dev` must work with zero
external accounts) with PostgreSQL migration *documented*, not necessarily implemented. Every
schema design choice (no native enums, no native Json columns — see `docs/DATA_MODEL.md`) exists
specifically so that migration is a connection-string-and-adapter swap, not a schema rewrite:

```ts
// The Postgres swap, when you're ready for it:
// 1. datasource db { provider = "postgresql" } in schema.prisma
// 2. npm install @prisma/adapter-pg pg
// 3. const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
// 4. npx prisma migrate dev
```

**Known limitations of the deployed demo.** Vercel's serverless functions have a read-only
deployment bundle but a writable `/tmp`. `resolveDatabaseUrl()` copies the pre-seeded
`prisma/dev.db` into `/tmp/suvidha-runtime.db` on first use per warm instance. This makes the
*deployed* demo writable, but:
- `/tmp` is only guaranteed to persist for the lifetime of one warm serverless instance — a cold
  start, a redeploy, or a second concurrent instance gets a fresh copy of the seed data.
- Two users hitting different concurrent instances will not see each other's writes.

This is a deliberate, documented tradeoff for a portfolio demo, not a production posture — a real
deployment moves to Postgres (the swap above) before it has more than one user.

## Route structure

```
src/app/
  (public)/            landing, how-it-works, capability explainer, privacy/security, eligibility
                        guide, help, login (demo persona picker)
  home/                 citizen dashboard ("what needs my attention")
  profile/              Domain A — master profile & consistency
  institutions/         Domain B — institutional relationship graph
  documents/            Domain C — document & evidence hub
  requests/             Domain D — unified service request centre
  inbox/                Domain E — unified communication centre
  life-events/          Domain F — life-event orchestration
  financial/            Domain G — financial & compliance administration
  family-access/        Domain H — delegated access & consent
  legacy/               Domain I — Legacy, Incapacity, Bereavement & Succession
                        (estate planning screens + claimant screens, role-gated within the section)
  help/                 grievances
  consent/              consent centre, access history
  settings/             account/session settings
  ops/                  institution & government console (separate shell, ops-role-gated)
  api/                  route handlers for the connector-simulation layer only
```

Server Components read directly via `prisma` (no internal REST hop needed for first-paint data).
Mutations are Server Actions co-located with their feature (`actions.ts` files) — see
`docs/API_CONTRACTS.md` for the full contract list. Route Handlers under `src/app/api/` exist only
for the parts of the system that conceptually represent an external caller: connector simulation
responses and any webhook-style endpoint (death-event intake, institution acknowledgement).

## Engines

Business logic that must be data-driven, auditable, and unit-testable lives in
`src/lib/engines/`, not scattered across UI components:

- `authority-engine.ts` — the Legacy & Succession claimant-pathway decision-support engine (never
  declares final legal ownership — see `docs/AUTHORITY_RULES.md`). Mirrored into the `Rule`/
  `RuleVersion` tables for audit/display; the actual evaluation is the exported
  `evaluateAuthorityPathway()` function, unit-tested in `authority-engine.test.ts`.
- `permission-engine.ts` — evaluates whether a Trusted Contact's `AccessGrant` is currently active
  given its `timingRule` (`immediate` / `after_verified_death` / `after_waiting_period` /
  `requires_co_approval`) — unit-tested in `permission-engine.test.ts`.

## Auth

`src/lib/auth.ts` and `src/lib/auth-actions.ts` implement **mock demo authentication only**: a
plain (not cryptographically signed) cookie holding a `User.id`, set by picking a persona on
`/login` — no passwords, no MFA, no step-up verification. This is intentional and documented (see
`docs/SECURITY.md`) — building a real credential system was out of scope for demonstrating the
product's actual differentiators. `proxy.ts` redirects to `/login` if the cookie is absent on any
protected route; each protected layout then loads the full `User` (with `Person`/`Institution`)
and redirects again if the role doesn't match that section (e.g., an ops-side role hitting `/home`).

## Internationalisation

`src/lib/i18n.ts` is a flat dictionary (`key → { en, hi }`), read against
`CitizenProfile.preferredLanguage`. Extending to more Indian languages means adding a key to each
entry, not restructuring — see `docs/ACCESSIBILITY.md` for the full rationale and current
translation coverage (primary navigation and key surfaces, not every string — see
`docs/ASSUMPTIONS_AND_LIMITATIONS.md`).

## Audit

`src/lib/audit.ts` exposes a single `logAudit()` helper that every Server Action calling a
state-changing operation should call. It never accepts raw sensitive identifiers into its
`metadata` field — only masked values, ids, and labels.
