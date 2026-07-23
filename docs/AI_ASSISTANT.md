# Life Admin Assistant

## What it is

"Life Admin Assistant" (working name) is the conversational layer over a citizen's own Suvidha
data: connected institutions, documents, active service requests, deadlines, life events,
permissions, and communication history. Its job is to answer questions like:

- "Where is my old address still registered?"
- "Which documents expire this year?"
- "Have I updated my nominee everywhere?"
- "Why has my PAN correction not progressed?"
- "What actions are pending after changing my name?"
- "Explain this Income Tax notice."
- "What should my family know in an emergency?"

## What this prototype actually implements — read this before anything else

**There is no live LLM call anywhere in this codebase.** The assistant screen (`/home` → Life
Admin Assistant) works entirely by:

1. Presenting a fixed list of suggested questions (the ones above and a few others), each mapped
   to a specific, real Prisma query against the signed-in citizen's own data (expiring documents →
   query `Renewal` where `dueDate` is within N days; nominee coverage → query `Nomination`/
   `InstitutionRelationship.registeredNomineeSummary`; stalled requests → query `ServiceRequest`
   joined to `RequestStatus`; notice explanation → the `Message.plainLanguageSummary` field already
   authored at seed time).
2. Rendering the query result inside a templated response that always cites the specific record(s)
   it came from (a link to the `Renewal`, `ServiceRequest`, or `Message` in question).
3. Never accepting free-text input that could be answered by guessing — a free-text box is shown,
   but an unrecognised question returns "I can't find a grounded answer to that yet — try one of
   the suggested questions, or open a request/grievance instead," never an invented answer.

This is a deliberate simulation, not a placeholder for hidden LLM wiring: it demonstrates *how the
assistant should behave* (grounded, citation-first, confirmation-before-action) using deterministic
code, in a portfolio prototype with no LLM API budget or key management in scope. A production
build would put a real LLM behind the same guardrails described below — the guardrails, not the
model, are the actual product design contribution here.

## Guardrails (apply to any future real-LLM implementation, and are already enforced in the simulation)

The assistant must:

- **Always cite the underlying record.** Every factual claim links to the specific `Renewal`,
  `ServiceRequest`, `Message`, `InstitutionRelationship`, or `ProfileConflict` row it's based on.
- **Distinguish official information from inferred suggestion.** "Your bank shows this address as
  of [date]" (fact, cited) vs. "You may want to update your driving licence next" (suggestion,
  clearly labeled as such).
- **Ask for confirmation before initiating any action.** The assistant can draft a checklist or a
  service-request outline; it never submits anything, changes a profile field, or grants access
  without an explicit confirmation step from the citizen — mirroring the platform-wide rule that
  nothing above "view" happens without a human decision (see `docs/DELEGATED_ACCESS.md`).
- **Never fabricate an institution status, a legal requirement, or a deadline.** If the answer
  isn't in the citizen's own data, it says so rather than guessing (see `docs/CONTENT_GUIDELINES.md`
  for the exact phrasing pattern this follows, and note the parallel to `AI-03` in the sibling
  franchise-ops-ai prototype's eval suite — "insufficient data," never a guess).
- **Never provide final legal, tax, or financial advice.** It can explain a notice in plain
  language and suggest the relevant Suvidha action (e.g., "start a Tax Rectification request"); it
  never tells a citizen what their legal position is.
- **Never treat an unverified message as a verified communication.** If a `Message.senderVerified`
  is `false` or `Message.fraudWarning` is `true`, the assistant leads with that warning rather than
  answering the question as asked — a phishing-style message should never be treated as trustworthy
  just because a citizen asked the assistant about it.
- **Maintain an audit trail.** Every assistant query and the record(s) it surfaced should be logged
  via `logAudit()` (see `docs/SECURITY.md`) so "what did the assistant tell this person, and when"
  is always reconstructable.

## Why simulate rather than skip

A chatbot without real grounding is worse than no chatbot — it's exactly the "confidently wrong AI
recommendation poisons credibility" failure mode this product exists to avoid (see the sibling
`franchise-ops-ai` prototype's `AI-03` requirement for the same principle applied to a different
domain). Building a rule-based, fully-grounded simulation demonstrates the intended UX and the
guardrail architecture honestly, without either (a) silently wiring in an LLM with no eval harness
around it, or (b) shipping an empty "coming soon" page. See `docs/ASSUMPTIONS_AND_LIMITATIONS.md`
for this decision restated alongside the other scope calls made in this build.
