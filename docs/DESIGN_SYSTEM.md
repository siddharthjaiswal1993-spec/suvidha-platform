# Design System

## Status note

As of this writing, `src/components/ui/` exists as an empty directory — the component build-out
described in `docs/00_EXECUTIVE_SUMMARY.md`'s "Application/UI: In build-out" line has not started.
This document specifies the **target design system** the Phase 1 build-out (`ROADMAP.md`) must
implement, not a description of already-shipped components. Treat it as the component contract to
build against.

## Foundation

Suvidha's design system is a hand-rolled, shadcn/ui-equivalent set of component primitives, not the
shadcn CLI's registry output. The shadcn CLI's `npx shadcn add` flow depends on a network fetch from
a remote registry at install time, which is unreliable in sandboxed/offline build environments and
undesirable for a self-contained prototype — so the same architecture shadcn/ui popularized
(Radix UI primitives + class-variance-authority for variants + tailwind-merge for class
composition, all colocated as owned source in the repo rather than an installed package) is
hand-authored directly into `src/components/ui/`. This is a deliberate, documented choice, not a
missing dependency.

- **Primitives**: `@radix-ui/react-*` (accordion, avatar, checkbox, dialog, dropdown-menu, label,
  progress, radio-group, select, separator, slot, switch, tabs, tooltip — see `package.json` for the
  exact installed set).
- **Variants**: `class-variance-authority` (`cva`) defines each component's variant/size API.
- **Class merging**: `tailwind-merge` + `clsx` (commonly wrapped as a `cn()` helper in
  `src/lib/utils.ts`) resolve conflicting Tailwind classes when a consumer overrides a component's
  default styling.
- **Styling engine**: Tailwind CSS v4, configured via `postcss.config.mjs` / `@tailwindcss/postcss`,
  with design tokens expressed as CSS custom properties in `src/app/globals.css` so both Tailwind
  utility classes and the component library read from one source of truth.
- **Icons**: `lucide-react`.
- **Charts** (SLA dashboards, ops-console metrics): `recharts`.
- **Toasts**: `sonner`.

## Target component inventory (`src/components/ui/`)

| Component | Built on | Notes |
|---|---|---|
| `Button` | native `<button>` + `cva` + Radix `Slot` (for `asChild`) | Variants: `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`. Sizes: `sm`, `default`, `lg`, `icon`. `destructive` reserved for genuinely destructive/irreversible actions (revoke access, cancel request) — never used for routine navigation. |
| `Card` | plain `div` composition (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) | The primary content-grouping unit across dashboards, request detail, and profile views. |
| `Badge` | `cva` | Variants map to status semantics, not arbitrary colors — see "Status color mapping" below. |
| `Input` | native `<input>` | Large tap target height (see Accessibility baseline), visible focus ring. |
| `Label` | `@radix-ui/react-label` | Always paired with a form control's `id`; never a bare styled `<span>` standing in for a label. |
| `Textarea` | native `<textarea>` | Used for free-text fields (grievance descriptions, correction reasons). |
| `Select` | `@radix-ui/react-select` | Used for closed-vocabulary fields (relationship type, document category). |
| `Tabs` | `@radix-ui/react-tabs` | Used for switching between related views (e.g. Normalized vs. Institution-raw status) without a page navigation. |
| `Dialog` | `@radix-ui/react-dialog` | Reserved for confirmations that need full attention (submit a request, revoke consent) — never used for routine disclosure that a `Tooltip` or inline expansion would serve better. |
| `Table` | plain semantic `<table>` composition | Used in ops-console queues (service-request queue, claims queue, audit-log explorer). Always paired with a text-equivalent for small-screen/assisted-mode views, not a table-only presentation. |
| `Progress` | `@radix-ui/react-progress` | Used for life-event completion and estate-plan readiness. Never uses countdown/celebratory framing (see `docs/CONTENT_GUIDELINES.md`) — no confetti, no "you're almost there!" copy in the Legacy & Succession domain. |
| `Checkbox` | `@radix-ui/react-checkbox` | Large hit target; used for consent-scope selection and checklist items. |
| `RadioGroup` | `@radix-ui/react-radio-group` | Used for mutually-exclusive choices (e.g. access-policy timing rule). |
| `Switch` | `@radix-ui/react-switch` | Used sparingly, only for genuinely binary, immediately-effective settings (e.g. read-receipt preference) — never for anything that should require a confirming Dialog (like consent revocation). |
| `Separator` | `@radix-ui/react-separator` | Visual grouping within a Card or between Table sections. |
| `Tooltip` | `@radix-ui/react-tooltip` | Used to explain an icon-only control or a status abbreviation — every icon-only control must have either a visible label or a Tooltip-exposed accessible name, never neither. |
| `Avatar` | `@radix-ui/react-avatar` | Used for Person/institution representation; always paired with a text fallback (initials), never an image-only identifier. |
| `Accordion` | `@radix-ui/react-accordion` | Used for progressive disclosure (e.g. expanding a service's full requirement list) so screens stay scannable for low-digital-literacy users by default. |
| `DropdownMenu` | `@radix-ui/react-dropdown-menu` | Used for secondary/overflow actions in ops-console rows (assign case, escalate) — never for a request's primary submit action. |
| `Skeleton` | plain styled `div` | Loading-state placeholder — see "Loading state" convention below. |
| `EmptyState` | composed from `Card` + icon + copy slot | See "Empty state" convention below. |
| `ExecutionMethodBadge` | composed from `Badge` + `Tooltip` | Suvidha-specific, not a generic primitive: renders the mandatory execution-method label (see below) consistently everywhere a request or action appears. |
| `DemoDataIndicator` | composed from `Badge` + `Tooltip` | Suvidha-specific: marks synthetic/seeded data — see below. |

## Design tokens

### Color roles: a trust-and-calm palette

The palette is deliberately calm rather than energetic, because the product's subject matter spans
routine administration and genuinely difficult moments (bereavement, fraud, disputes) in the same
interface. Bright, saturated, celebratory colors are avoided everywhere; alarming reds are reserved
for states that are genuinely risky, not used decoratively for ordinary negative states like "form
validation error."

| Token role | Purpose | Example usage | Note |
|---|---|---|---|
| `--color-primary` | Primary action, active navigation | Submit button, active tab | A muted, confident blue/teal — not a bright saturated brand blue. |
| `--color-surface` / `--color-surface-raised` | Page and card backgrounds | `Card`, page background | Calm neutrals; `-raised` gives cards a subtle, not dramatic, elevation. |
| `--color-ink` / `--color-ink-muted` | Primary and secondary text | Body copy, captions | High contrast for `--color-ink`; `--color-ink-muted` never drops below WCAG AA for its use as body-adjacent text. |
| `--color-success` | Genuinely completed/positive states | `completed`, `approved`, `verified` badges | A muted green, not a bright "success!" green — no confetti-adjacent saturation. |
| `--color-caution` | Needs-attention, non-urgent | `information_required`, `pending`, `renewal_due_soon` | Amber/gold, calm — signals "look at this," not "panic." |
| `--color-risk` | Genuine risk/fraud/dispute states only | `fraud_hold`, `contested`, `rejected`, FraudSignal severity=high | The one place a stronger red is used — reserved deliberately so it retains meaning. Never used for routine states like an ordinary form validation message. |
| `--color-neutral-status` | Informational, no valence | `draft`, `unsupported` | Grey — explicitly "no judgment implied." |
| `--color-focus-ring` | Keyboard focus indicator | Every focusable element | High-contrast, always visible, never suppressed with `outline: none` without a replacement. |

Status badges (`normalizedStatus`, `Claim.status`, `Grievance.status`, `FraudSignal.severity`, etc.)
map onto these five semantic roles (`success` / `caution` / `risk` / `neutral` / `primary`) rather
than each screen inventing its own color choice — this mapping table lives alongside the `Badge`
component's variant definitions so a new status value is a deliberate, reviewed addition, not an ad
hoc color pick.

The Legacy & Succession domain in particular avoids `--color-risk` for anything that is simply
sad-but-normal (e.g. a `Claim.status` of `draft` or `submitted` is neutral, not red) — red is
reserved for `fraud_hold`, confirmed disputes, and rejected claims, matching
`docs/CONTENT_GUIDELINES.md`'s no-alarm-except-genuine-risk rule.

### Typography scale

A restrained scale, chosen for readability by older adults and low-digital-literacy users at
default zoom, not for visual density:

| Token | Approx. size | Usage |
|---|---|---|
| `--text-display` | 2.25rem / 36px | Page-level heading (e.g. "My Institutions") |
| `--text-heading` | 1.5rem / 24px | Card/section heading |
| `--text-subheading` | 1.125rem / 18px | Sub-section, table group heading |
| `--text-body` | 1rem / 16px | Default body copy — never smaller than this for primary content |
| `--text-caption` | 0.875rem / 14px | Secondary metadata (timestamps, source labels) — used sparingly |

A user-controllable "large text" mode (tied to `CitizenProfile.accessibilityNeeds`) scales the whole
type scale up a step further; see `docs/ACCESSIBILITY.md`.

### Spacing

An 8px base unit (`--space-1` = 4px through `--space-8` = 64px, in 4/8px increments), applied
consistently so tap targets and touch spacing stay generous by default rather than needing
per-screen adjustment.

## The "Demo Data" indicator pattern

Because every institution, connector, and much of the seed content in this prototype is synthetic
(`LegalDocument.isDemoDocument`, `Person.scenarioTag`, `User.isDemoAccount`, connector
`integrationLabel` values like `prototype_simulation`), the UI never lets synthetic data pass as
real without a marker:

- A small `DemoDataIndicator` badge (muted, neutral-colored, never alarming) appears next to any
  entity that is demo/seeded data — an institution connection, a document, a claim.
- Hovering/focusing it (via `Tooltip`) explains what's real vs. simulated in plain language, echoing
  `docs/00_EXECUTIVE_SUMMARY.md`'s "What's real vs. simulated" framing at the point of use rather
  than only in documentation.
- The execution-method label (below) and the demo-data indicator are visually distinct from each
  other — a request can be `unsupported` execution method on real data, or `executable_via_api` on
  demo data; the two facts are never conflated into one badge.

## Execution-method disclosure

Every `ServiceRequest` and `LifeEventAction` card, row, and detail view carries a visible
`ExecutionMethodBadge` rendering one of: `executable via API`, `initiable via integration`,
`deep-link redirect`, `generated form/document packet`, `assisted digital workflow`, `in-person
required`, `requires institution/legal approval`, `unsupported`. This is a hard product-safety
requirement (see `docs/TERMINOLOGY.md` §4 and `docs/CONTENT_GUIDELINES.md`), not a nice-to-have: it
must never be omitted, and its wording must never imply "instant" when the underlying method is
slower or manual.

## Empty, loading, and error state conventions

- **Empty state**: the `EmptyState` component always pairs a plain-language explanation of *why*
  the list is empty (not just "No data") with the single most relevant next action (e.g. "You
  haven't connected any institutions yet — Connect your first institution"). Never a bare icon with
  no explanation.
- **Loading state**: `Skeleton` placeholders match the shape of the content they're replacing
  (a card skeleton for a card, a row skeleton for a table row) rather than a generic spinner,
  reducing layout shift and giving low-digital-literacy users a stable visual anchor. A spinner is
  reserved for actions with no predictable shape (e.g. "Verifying...").
- **Error state**: errors are specific and actionable, distinguishing (a) validation errors shown
  inline at the field, (b) not-found/permission errors shown as a page-level message with a way
  back, and (c) transient/connector failures shown with the honest execution-method-aware language
  from `docs/CONTENT_GUIDELINES.md` (e.g. "We couldn't reach [Institution] just now — try again, or
  use the in-person option") rather than a generic "Something went wrong."

## Accessibility baseline

See `docs/ACCESSIBILITY.md` for the full commitments; the design-system-level baseline every
component in this inventory must satisfy before it's considered done:

- Semantic HTML first — Radix primitives supply correct ARIA roles/states out of the box; custom
  composed components (`ExecutionMethodBadge`, `EmptyState`, `DemoDataIndicator`) must not regress
  that with a generic `<div>` where a semantic element or ARIA attribute is required.
- Every icon-only control (`Button size="icon"`, `DropdownMenu` triggers) carries an accessible name
  via `aria-label` or a `Tooltip`-exposed label — never icon-only with no text alternative.
- Visible focus states on every interactive element (`--color-focus-ring`), keyboard-operable
  end to end — no mouse-only interaction anywhere, including `Dialog` and `DropdownMenu` flows.
- Minimum 44×44px tap targets on all interactive controls, larger in "large text"/assisted mode.
- High-contrast mode: token values are re-mapped (not merely darkened) under
  `prefers-contrast: more` and the app's own high-contrast toggle, verified against WCAG AA/AAA
  contrast ratios for text-on-surface pairs, not assumed from the default palette alone.
