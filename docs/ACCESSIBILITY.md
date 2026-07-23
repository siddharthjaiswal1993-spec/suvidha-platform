# Accessibility

Suvidha's user base skews toward exactly the population accessibility work most often gets
deprioritized for: older adults, people with disabilities, low-digital-literacy users, and people
in an acutely stressful moment (bereavement, a disputed identity, a compliance notice). Accessibility
here is not a compliance checkbox — it's a core usability requirement for the product to work at
all for its actual audience. This document states the WCAG-aligned commitments the build-out must
meet, and the English/Hindi (and future Indian-language) architecture underneath them.

## WCAG-aligned commitments

### Semantic HTML and structure

- Use native semantic elements (`<button>`, `<nav>`, `<table>`, `<label>`, headings in order) before
  reaching for ARIA — ARIA supplements semantics, it doesn't replace them.
- Heading levels are hierarchical and never skipped for visual convenience (no `<h4>` styled to look
  like a section title under an `<h2>` with no `<h3>` between).
- Landmark regions (`<header>`, `<main>`, `<nav>`, `<footer>`) are present on every page so
  screen-reader users can jump between regions instead of reading linearly every time.

### ARIA labeling for icon-only controls

- Every icon-only control (see `docs/DESIGN_SYSTEM.md`'s `Button size="icon"`, `DropdownMenu`
  triggers) carries an `aria-label` describing its action in plain language ("Revoke access for
  [name]," not "Delete") — never an icon with no accessible name.
- Status badges (`ExecutionMethodBadge`, normalized-status `Badge`) expose their full text meaning
  to assistive technology, not just a color — color alone never carries meaning anywhere in the
  product (see the color-role table in `docs/DESIGN_SYSTEM.md`).
- Live regions (`aria-live="polite"`) announce asynchronous status changes (a request moving to
  "acknowledged," a document finishing verification) without forcing a full page reload or losing
  the user's place.

### Keyboard navigation

- Every interactive flow — including `Dialog` confirmations, `DropdownMenu` actions, and multi-step
  forms (service request creation, claim submission, delegated-task approval) — is fully operable by
  keyboard alone, with a visible focus indicator (`--color-focus-ring`) at every step.
- Focus order follows visual/reading order; focus is trapped appropriately inside a `Dialog` and
  returned to the triggering element on close.
- No interaction requires a mouse-only gesture (drag-and-drop document upload always has a
  keyboard-operable file-picker alternative).

### Screen-reader support

- Form errors are announced to the screen reader at the point of the invalid field (via
  `aria-describedby` linking the field to its error text), not only visually flagged.
- Tables used in ops-console queues include proper `<th scope="col">`/`<th scope="row">` structure
  so relationships between headers and cells are announced correctly.
- Decorative icons are `aria-hidden`; informational icons carry text alternatives.

### High-contrast mode

- Color tokens (`docs/DESIGN_SYSTEM.md`) are re-mapped — not simply darkened — under
  `prefers-contrast: more` and an in-app high-contrast toggle, verified against WCAG AA (body text)
  and AAA (where feasible for critical status indicators like `--color-risk`) contrast ratios.
- Focus indicators and status badges retain sufficient contrast against both the default and
  high-contrast surface tokens.

### Large tap targets

- All interactive controls meet a minimum 44×44px hit target (WCAG 2.5.5 / mobile-accessibility
  guidance), increasing further in "large text"/assisted mode.
- Adjacent interactive elements (e.g. table row actions) maintain sufficient spacing to avoid
  mis-taps, particularly important for older-adult users with reduced fine motor precision.

### Plain-language explanations

- Every technical or bureaucratic term is either avoided or glossed inline the first time it
  appears on a screen (see `docs/CONTENT_GUIDELINES.md`'s plain-language rules) — this is treated as
  an accessibility requirement, not just a tone preference, because dense jargon is itself a barrier
  for low-digital-literacy and non-native-language readers.
- Complex multi-step processes (life events, claims) always show a plain-language "what happens
  next" summary in addition to the structured checklist.

### Save-and-resume for long forms

- Every multi-field form (profile updates, service-request creation, death-event evidence
  submission, claim packet assembly) persists a `draft` state (mirroring `ServiceRequest`'s
  `draft`/`information_required` normalized statuses) so a user can leave and return without losing
  progress — critical for older adults, low-bandwidth users, and anyone filling out a form during an
  already difficult moment who may need to stop and come back.
- Draft state is visibly labeled ("Draft — not yet submitted") so a user is never confused about
  whether a saved-but-incomplete form has already been sent to an institution.

### Printable summaries

- Every service request, claim, and life-event plan has a print-friendly summary view (a simplified,
  high-contrast, non-interactive layout with no navigation chrome) so a citizen — or a family member
  helping them — can produce a physical copy for an in-person visit, a family meeting, or a
  low-connectivity moment where the app itself isn't accessible.
- Printable summaries never include raw unmasked identifiers or exact balances, matching the
  masking rules that apply everywhere else in the product.

### Assisted-mode indicators for low-digital-literacy users

- An explicit "Assisted Mode" toggle (tied to `CitizenProfile.accessibilityNeeds`) increases text
  size, simplifies navigation to a linear step-by-step layout, and surfaces a persistent "Get help
  from a Family Administrator" affordance.
- When a screen is being viewed or acted on by a Family Administrator or Professional Representative
  under a `DelegatedTask`, a visible, non-dismissible indicator states whose action this is ("Being
  prepared by [Family Administrator name] — you'll need to approve before it's submitted"), so
  neither the owner nor the assistant is ever confused about whose action is in progress.

## English/Hindi i18n architecture (and the path to more Indian languages)

### Approach: dictionary-based, keyed strings

Every user-facing string in the codebase is referenced by a stable key (e.g.
`profile.conflict.detected_banner`, `execution_method.in_person_required.label`), not hard-coded
inline text. Each key resolves through a per-language dictionary module
(`src/lib/i18n/dictionaries/en.ts`, `src/lib/i18n/dictionaries/hi.ts`), so adding or correcting a
translation never requires touching component code, and a missing translation is a detectable gap
(a lookup miss) rather than a silently-wrong string.

```ts
// Illustrative shape — the target contract for src/lib/i18n
type DictionaryKey =
  | "profile.conflict.detected_banner"
  | "execution_method.in_person_required.label"
  | "life_event.address_change.title";
  // ... one key per user-facing string, organized by domain/feature

type Dictionary = Record<DictionaryKey, string>;

function t(key: DictionaryKey, lang: "en" | "hi", vars?: Record<string, string>): string;
```

### Where language preference lives

`CitizenProfile.preferredLanguage` (`en` | `hi`, defaulting `en`) is the durable, per-person source
of truth for which dictionary to render from. It's read once per request (server-side, for the
initial render) and available to client components via context, so language choice is consistent
across a full page load rather than flickering between a default and a preferred language.

### Extending to more Indian languages without a rewrite

The dictionary-key architecture is deliberately language-count-agnostic:

1. Adding a new language (e.g. Tamil, Bengali, Marathi) means adding one new dictionary module
   (`ta.ts`, `bn.ts`, `mr.ts`) that maps the same fixed set of `DictionaryKey`s to new strings — no
   component code changes, no schema migration beyond widening `preferredLanguage`'s allowed values.
2. Because every key is centrally enumerated, a missing translation for a new language is
   detectable at build/lint time (a key present in `en.ts` but absent from `ta.ts`) rather than
   surfacing as a blank string in production.
3. Pluralization, date/number formatting, and right-to-left considerations (not currently needed for
   the initial English/Hindi/other-Indic-script languages, none of which are RTL) are isolated behind
   small formatting helpers rather than inlined per-string, so a future RTL or complex-plural
   language doesn't require restructuring the dictionary system itself.
4. AI Assistant responses (`docs/CONTENT_GUIDELINES.md`) are generated against the same
   `preferredLanguage` value, so guardrail language (citations, confirmation prompts) is
   translated consistently rather than the assistant defaulting to English regardless of the
   citizen's chosen language.

This keeps "English + Hindi now, more Indian languages later" a matter of content addition, not
architecture change — exactly the property a scaling multi-language product needs.
