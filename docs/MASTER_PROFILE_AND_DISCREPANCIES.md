# Master Profile & Discrepancy Detection

**Domain A of the lifelong citizen administration platform.** Source models:
`CitizenProfile`, `ProfileField`, `ProfileFieldValue`, `ProfileConflict`. See
`docs/TERMINOLOGY.md` §4 for the vocabulary this doc uses, and
`docs/SERVICE_REQUEST_ENGINE.md` for how a detected conflict actually gets fixed.

## 1. The problem: the same fact, several disagreeing sources

A citizen's "present address" is not one fact stored in one place — it is whatever
each institution happens to have on file, updated at whatever pace that institution's
own processes allow. Aadhaar might say one thing, a bank's KYC record another, a
five-year-old passport a third. None of these institutions know about the other two.
Suvidha's job is to notice the disagreement and surface it plainly — **never to
silently pick a winner and tell any institution "the correct value is X."** Only the
citizen, and ultimately only the specific institution whose record is wrong, can
correct that institution's record.

## 2. The model shape

```
CitizenProfile (one per Person)
  └── ProfileFieldValue (many) ── profileField → ProfileField (catalog)
         ├── sourced from an Institution (optional)
         └── may participate in a ProfileConflict, as primaryValue or alternateValue
```

### `CitizenProfile`

One row per living `Person` — explicitly *not* itself an official government record,
just Suvidha's own "system of engagement" container. Carries `preferredLanguage`,
`accessibilityNeeds`, `residencyStatus` (`resident \| nri \| foreign_national`), and
`citizenship`.

### `ProfileField` — the catalog

A lookup table of field *types*, not hard-coded UI strings, so new fields can be added
without a schema migration:

| `fieldKey` | `category` | Example |
|---|---|---|
| `legal_name` | identity | "Anita Kumari Rao" |
| `alternate_name` | identity | A maiden name, a transliteration variant |
| `date_of_birth` | identity | |
| `present_address` | address | Where the citizen currently lives |
| `permanent_address` | address | Registered/permanent address on record |
| `mobile_primary` | contact | |
| `email_primary` | contact | |
| `marital_status` | family | |
| `occupation` | employment | |

### `ProfileFieldValue` — one reported value, from one source, at one point in time

| Field | Purpose |
|---|---|
| `value` | The reported value itself |
| `provenance` | `user_entered \| verified_by_source` — see §5 |
| `sourceLabel` | Human display, e.g. `"Aadhaar (simulated)"`, `"HDFC Bank KYC (simulated)"`, `"Self-declared"` |
| `sourceInstitutionId` | Optional FK to `Institution`, when the source is an institution rather than the citizen themselves |
| `isCurrentForSource` | `false` once a newer value from *that same source* has superseded it — the table is append-only, so history is never lost |
| `lastVerifiedAt` | When that source last confirmed the value |

Multiple `ProfileFieldValue` rows can and do coexist for the same `(citizenProfile,
profileField)` pair, one per source — that plurality is the entire point of the model.

### `ProfileConflict` — a detected disagreement

A `ProfileConflict` links exactly two `ProfileFieldValue` rows (`primaryValue` and
`alternateValue`) for the same field, with a lifecycle:

```
open → acknowledged → resolved_via_correction_request
                 ↘ dismissed_not_a_conflict
```

- **`open`** — detected automatically when two current (`isCurrentForSource=true`)
  values for the same field disagree.
- **`acknowledged`** — the citizen has seen it and confirmed it is a genuine
  discrepancy worth acting on (as opposed to, say, a harmless transliteration
  difference).
- **`resolved_via_correction_request`** — the citizen has initiated (and confirmed
  the outcome of) a correction `ServiceRequest` at the institution holding the wrong
  value. See §4.
- **`dismissed_not_a_conflict`** — the citizen has determined, on inspection, that
  the two values are not actually in conflict (e.g. one is a valid alternate spelling
  used by that specific issuing authority) and no correction is needed.

**The platform never sets a `ProfileConflict` to resolved on its own, and never marks
one `ProfileFieldValue` as "the correct one" system-wide.** Only a citizen action
(acknowledging, dismissing, or confirming a completed correction) advances the status.

## 3. Why the platform never auto-declares a winner

Suvidha is the system of engagement, not the system of record (see `docs/
PRODUCT_VISION.md`). Declaring "your bank's address is wrong, your Aadhaar is right"
would be:

1. **Legally meaningless** — Suvidha has no authority to change any institution's
   record, and a citizen-facing app asserting which government or bank record is
   "correct" would misrepresent what it can actually do.
2. **Frequently wrong in practice** — verification recency, KYC refresh cycles, and
   which document was used to open which account all vary; the "most recently
   verified" value is not reliably the "most currently true" value (see §5).
3. **A prohibited pattern** — this is precisely the shape of the "AI approves a
   request" and "platform edits a government/institution database" anti-patterns
   listed in `docs/TERMINOLOGY.md` §5.

Instead, Suvidha's job stops at **detection, plain-language explanation, and routing**
— the correction itself always happens through the institution's own process, tracked
as a `ServiceRequest`.

## 4. The resolution pathway

```
Conflict detected (status=open)
        │
        ▼
Citizen reviews both values side by side, with source and last-verified date
        │
        ├── Not actually a problem ──────────────► dismissed_not_a_conflict
        │
        ▼
Citizen acknowledges (status=acknowledged)
        │
        ▼
Suvidha offers to start a correction ServiceRequest at the institution
holding the outdated/incorrect value (serviceCategory = "correction" or
the more specific "address_update" / "name_update" / "contact_update")
        │
        ▼
ServiceRequest runs its normal lifecycle (see docs/SERVICE_REQUEST_ENGINE.md)
        │
        ▼
Citizen confirms the institution's record has actually changed
        │
        ▼
status=resolved_via_correction_request; a fresh ProfileFieldValue with
provenance="verified_by_source" is recorded once re-synced
```

The resolution is deliberately citizen-confirmed, not automatically closed the moment
a `ServiceRequest` reaches `completed` — an institution's own status can say
"completed" while the underlying record sync still lags, so Suvidha waits for
confirmation (or the next successful `SourceSync`) before treating the conflict as
closed.

## 5. Provenance: `user_entered` vs `verified_by_source` — and why "verified" isn't final

- **`user_entered`** — the citizen typed this value themselves (e.g. during profile
  setup, or while correcting something they know changed but haven't yet updated
  anywhere official).
- **`verified_by_source`** — the value arrived through a `SourceSync` run against a
  `Connector`/`Integration`, i.e., it is what that institution's own system currently
  shows, not a self-declaration.

**Why a `verified_by_source` value still isn't treated as universally "the truth":**

1. **Institutions themselves go stale.** A `verified_by_source` value only means "this
   is what that institution's system said as of `lastVerifiedAt`." Banks and insurers
   often refresh KYC on a multi-year cycle; a five-year-old "verified" address can be
   more wrong than a two-week-old self-declaration.
2. **"Verified" is source-scoped, not global.** Two `verified_by_source` values for the
   same field can legitimately disagree — each is verified *by its own source*, not
   verified as the single objective fact. `isCurrentForSource` tracks currency within
   one source's own history; it says nothing about which source is right relative to
   another.
3. **Purpose-specificity.** What matters for any given downstream action is not what
   Suvidha believes is true, but what a *specific institution's own record* says,
   because that is the record that legally governs that institution's dealings with
   the citizen. Updating a bank requires satisfying the bank's own KYC process, not
   satisfying Suvidha.
4. **No self-declared value is auto-accepted either** — the flip side of the same
   principle: a `user_entered` value is never treated as verified just because the
   citizen typed it, and it's never pushed to an institution as a fact without the
   citizen going through that institution's own update process.

## 6. Worked examples

### Example 1 — Three-way address disagreement

| Source | `sourceLabel` | Value | `provenance` | `lastVerifiedAt` |
|---|---|---|---|---|
| Aadhaar | "Aadhaar (simulated)" | Flat 12B, Sunrise Apartments, Andheri East, Mumbai 400069 | `verified_by_source` | 2025-11-02 |
| HDFC Bank KYC | "HDFC Bank KYC (simulated)" | 44 Palm Grove Road, Bandra West, Mumbai 400050 | `verified_by_source` | 2022-06-14 |
| Passport | "Passport (simulated)" | 7 Lakeview Colony, Pune 411001 | `verified_by_source` | 2019-03-30 |

Three current values for `present_address`, all `verified_by_source`, all disagreeing.
Suvidha creates pairwise `ProfileConflict` rows (Aadhaar-vs-bank, bank-vs-passport) and
presents them to the citizen as a single clustered "3 different addresses on file"
view rather than three unrelated alerts. The citizen recognises the Aadhaar address as
current, acknowledges both conflicts, and starts two `address_update` correction
requests — one at HDFC Bank, one for the passport (via the passport office's own
address-update service, `requiresInPerson=true` in that `ServiceDefinition`).

### Example 2 — PAN name-format mismatch

| Source | Value | `provenance` |
|---|---|---|
| PAN | "ANITA RAO" | `verified_by_source` |
| Aadhaar | "Anita Kumari Rao" | `verified_by_source` |

Both verified, both technically "correct" for their respective issuing authority's own
formatting conventions (PAN often omits a middle name; Aadhaar carries the full legal
name). The conflict surfaces, the citizen reviews it, and — after confirming this is a
known formatting variance rather than an actual identity mismatch — dismisses it as
`dismissed_not_a_conflict`. Suvidha never assumes this on the citizen's behalf; the
dismissal is always an explicit citizen action, logged with a timestamp.

### Example 3 — Stale mobile number on an insurance policy

| Source | Value | `provenance` | `lastVerifiedAt` | `isCurrentForSource` |
|---|---|---|---|---|
| LIC policy KYC | +91 98XXX XX210 | `verified_by_source` | 2022-01-10 | `true` (LIC has never been told it changed) |
| Telecom-linked mobile (self-declared during onboarding) | +91 97XXX XX884 | `user_entered` | — | `true` |

The insurer's own record is three-plus years stale but still `isCurrentForSource=true`
because, from LIC's point of view, nothing has told them otherwise. Suvidha flags the
conflict, the citizen acknowledges it, and a `contact_update` `ServiceRequest` is
raised against the LIC `InstitutionRelationship` specifically — this matters because a
notice or OTP sent to the wrong number on a policy is a real risk the citizen would
otherwise not notice until it caused a problem.

### Example 4 — Voter record tied to a previous constituency

| Source | Value | `provenance` |
|---|---|---|
| Electoral roll (simulated) | Address in Pune (previous constituency) | `verified_by_source` |
| Current present_address | Address in Mumbai | `verified_by_source` (Aadhaar) |

This conflict is a symptom of an already-completed interstate move rather than a
simple clerical disagreement, so beyond the passive `ProfileConflict`, this specific
field/institution pairing is also flagged inside any open `address_change` `LifeEvent`
as a still-pending `LifeEventAction` ("Update voter registration to current
constituency") — see `docs/LIFE_EVENT_ORCHESTRATION.md`. The conflict view and the
life-event plan point at the same underlying fact from two different entry points,
which is intentional: a citizen may notice this either while reviewing their profile
or while working through a move checklist.
