# Content Guidelines

Suvidha's writing has to work for two very different registers at once — routine administration
(update an address, renew a licence) and genuinely difficult moments (bereavement, disputed
identity, fraud). These guidelines exist so both registers are handled honestly and consistently,
across every screen, notification, and the planned Life Admin Assistant's responses.

## Plain-language rules (apply everywhere)

1. **Write for the reader who is stressed, rushed, or unfamiliar with bureaucratic language** —
   not for the reader who already understands the domain. Assume the audience includes older
   adults and low-digital-literacy users (see `docs/ACCESSIBILITY.md`).
2. **Prefer short sentences and common words.** Replace institutional jargon with a plain-language
   gloss the first time a technical term must appear (e.g. "Letters of Administration (a court
   document confirming who can manage the estate)").
3. **Say what happened, not what the system infers.** "Your request is under review at HDFC Bank"
   is fine; "HDFC Bank should approve this soon" is not — the platform does not predict or promise
   institutional outcomes.
4. **Never bury the actionable fact.** If a deadline, a missing document, or a required next step
   exists, state it in the first sentence of the relevant copy block, not the third paragraph.
5. **Numbers and identifiers are always masked or banded** in any copy a citizen or family member
   sees, per the schema-level masking rules — copy must never re-introduce a raw identifier or
   exact balance that the data layer deliberately withholds.

## Terminology consistency

`docs/TERMINOLOGY.md` is the canonical vocabulary for every role, process, and object name used in
this product. Content — UI copy, notifications, error messages, this documentation set — must:

- Use the exact terms defined there (e.g. "Trusted Contact," not "digital heir" or "account
  successor"; "Family Administrator," not "caretaker" or "power of attorney" unless a real
  `AuthorityCredential`/`CourtOrder` backs that specific claim).
- Never use any term on `docs/TERMINOLOGY.md` §5's explicitly-prohibited list (e.g. "automatic
  inheritor," "master nominee," "AI approves a request") under any circumstance, including
  marketing-style copy, tooltips, or error messages.
- Treat a new, undefined term appearing in copy as a bug to fix by adding it to
  `docs/TERMINOLOGY.md` (if it's genuinely a new concept) rather than by using it inconsistently
  across screens.
- Keep a term's meaning stable across the Legacy & Succession domain and the lifelong-administration
  domain where both use it — e.g. "Claimant" always means the schema's `Claimant` role, never a
  looser synonym for "anyone filing anything."

## Legacy & Succession domain: writing rules

This domain requires more care than any other, because its users are frequently mid-bereavement.

- **No celebratory or gamified language, ever.** No "Congratulations," no confetti-adjacent copy,
  no badges/streaks/levels, no "You're almost done!" progress cheering. A completed claim is
  reported factually ("Your claim has been settled") — never as an achievement.
- **No countdowns or urgency-manufacturing language.** Deadlines are stated as plain facts ("The
  response window for this notice closes on 14 August") — never as a ticking-clock UI element, a
  "Hurry, only 3 days left!" framing, or red flashing indicators on routine timelines. Genuine
  statutory deadlines are communicated calmly and clearly; manufactured urgency is never added on
  top of them.
- **No upselling near bereavement flows.** Nothing resembling a paid upgrade prompt, cross-sell, or
  "unlock" messaging appears anywhere in the death-event report, claim, correction, or estate-plan
  review flows. If a fee is genuinely required by an institution (`ServiceFee`), it is disclosed as
  a plain fact, not a call to action.
- **Empathetic, not saccharine.** Copy acknowledges the situation once, briefly, without dwelling —
  e.g. "We're sorry for your loss. Here's what happens next." — and then moves directly into clear,
  factual guidance. Avoid repeating condolence language on every screen; it starts to read as
  performative rather than sincere.
- **Never imply the platform has legal authority it doesn't have.** Copy never says the platform
  "approves," "grants," "transfers," or "finalizes" anything in the Legacy & Succession domain — only
  institutions and their officers do that (see `docs/TERMINOLOGY.md` §5). Suvidha's copy describes
  itself as helping prepare, submit, and track — never as deciding.
- **Estate-plan readiness copy is about completeness, never about wealth.** A `readinessScore`
  reflects "nominations set, will referenced, Trusted Contact configured" — copy must never
  reference or imply asset value, net worth, or "how much you have to protect."

## Phrasing execution-method disclosures honestly

Every request/action carries one of the schema's `executionMethod` values. Copy must phrase each
one honestly and specifically, never softened into a vaguer, more optimistic-sounding claim:

| Execution method | Honest phrasing pattern | Avoid |
|---|---|---|
| `executable_via_api` | "This can be submitted directly through Suvidha." | "This is instant" (processing time still depends on the institution). |
| `initiable_via_integration` | "Suvidha can start this for you through [Institution]'s system." | Implying Suvidha itself completes it. |
| `deep_link_redirect` | "This opens [Institution]'s own portal to finish this step." | Implying it stays inside Suvidha end to end. |
| `generated_form_packet` | "Suvidha will prepare the filled form/packet for you to submit." | "This is done" before the citizen has actually submitted the generated packet. |
| `assisted_digital_workflow` | "This needs a few manual steps, which we'll walk you through." | Hiding that manual effort is required. |
| `in_person_required` | "You'll need to visit a branch/office for this step." | Any phrasing suggesting a digital-only path exists when it doesn't. |
| `requires_institution_approval` | "This requires institution approval and may take time." | A specific promised timeline the institution hasn't committed to. |
| `requires_legal_intervention` | "This requires a legal step (e.g. a court order) before it can proceed." | Downplaying that this is outside Suvidha's or the institution's discretion. |
| `unsupported` | "Suvidha can't complete this step yet — here's how to do it directly with [Institution]." | Silence, or hiding the action entirely instead of naming the gap. |

The rule underneath all of these: **describe what actually happens, not what would be most
reassuring to hear.** A citizen who is told the truth about a slow, manual step can plan around it;
a citizen told a false "this is quick" loses trust the moment reality contradicts it.

## Writing the Life Admin Assistant's response guardrails

The AI assistant is grounded only in the citizen's own platform data. Every response template and
prompt-construction pattern must enforce, in the actual copy generated:

1. **Always cite the underlying record.** Every factual claim is attributed to its source — "Your
   HDFC Bank Savings Account (last synced 3 days ago) shows..." — never a bare assertion with no
   traceable origin.
2. **Always distinguish official fact from suggestion.** Use explicit framing markers: "According
   to [source]..." for facts drawn from platform data, versus "You might want to..." or "One option
   could be..." for the assistant's own suggestions. The two must never blur into one sentence that
   reads as if a suggestion were an official fact.
3. **Never invent an official requirement.** If the assistant doesn't have a grounded answer (e.g.
   "what documents does this specific institution require"), it says so explicitly and points to the
   generated checklist or the institution's own channel — it does not guess plausibly-sounding
   requirements.
4. **Never claim a request is approved, rejected, or otherwise decided** unless that exact
   `normalizedStatus`/`officialStatusRaw` is present in the data. "Your request is still under
   review" is fine; "This should get approved" is not.
5. **Always ask before acting.** Any response that could lead to an action (submitting a request,
   sharing a document, drafting a message to an institution) ends with an explicit confirmation
   step — "Would you like me to prepare this for you to review?" — and never submits, shares, or
   sends anything without that confirmation being separately actioned by the citizen.
6. **Always flag uncertainty for escalation rather than guessing.** When the assistant's confidence
   is low, or the question falls outside grounded platform data (e.g. asking for legal advice), the
   response says so plainly and points to a human escalation path (Grievance Officer, in-person
   visit, Professional Representative) rather than producing a fluent-sounding but unverified
   answer.
7. **Never adopt Legacy & Succession's prohibited tone even when summarizing.** A death-event or
   claim summary drafted by the assistant must follow the same empathetic, non-celebratory,
   non-urgent rules as human-authored copy in this domain — the assistant is not exempt from
   `docs/CONTENT_GUIDELINES.md` because it's machine-generated.

## Review checklist before shipping any new copy

- [ ] Every term used exists in, and matches, `docs/TERMINOLOGY.md`.
- [ ] No term from the prohibited list appears anywhere, including in code comments or tooltips.
- [ ] Every action/request surface shows its execution method, phrased per the table above.
- [ ] No celebratory, gamified, countdown, or upselling language appears in or near the Legacy &
      Succession domain.
- [ ] Any AI-assistant-generated copy cites its source, distinguishes fact from suggestion, and
      never states an action was taken without confirmation.
- [ ] Copy reads clearly at the `--text-body` size (see `docs/DESIGN_SYSTEM.md`) without requiring
      the reader to already know institutional jargon.
