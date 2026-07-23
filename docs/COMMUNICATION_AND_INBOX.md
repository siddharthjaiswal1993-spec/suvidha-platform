# Communication & Inbox

**Implementation status** (authoritative record: `src/config/capabilities.ts`
→ `communication_inbox`): reply, escalate-to-grievance, and report-as-suspicious are all real,
e2e-tested writes at `/inbox/[id]`. There is still no institution-side compose/send screen —
institution-originated messages are seeded, not sent from an ops UI.

**Domain E of the lifelong citizen administration platform.** Source models:
`InboxThread`, `Message`, `Notice`. This doc covers the data model and UX of the
unified communication centre; the AI layer that actually produces
`plainLanguageSummary` and `suggestedNextAction` content is covered separately in
`docs/AI_ASSISTANT.md` — this doc treats that layer as a black box that fills in
those fields, and focuses on what the inbox itself is and does.

## 1. Why one inbox

A citizen today receives institutional communication scattered across SMS, email, a
bank's own app notifications, an insurer's portal messages, and physical post — with
no shared thread, no consistent labelling of urgency, and no way to tell a genuine tax
notice from a phishing attempt without reading closely and knowing what to look for.
`InboxThread` and `Message` give every one of these a single, consistent home, whether
they arrived through a real (simulated) institutional channel or represent a
platform-generated reminder.

## 2. The model shape

```
InboxThread (per person, optionally scoped to one institution
             and/or one ServiceRequest)
   threadType: notice | request_update | reminder |
               scheme_announcement | security_alert | consent_request
        │
        ▼
Message[] (append-only within a thread)
   senderLabel, senderVerified, importance, originalBody,
   plainLanguageSummary, suggestedNextAction, fraudWarning, channel
        │
        ▼
Notice (optional 1:1 specialisation)
   noticeNumber, noticeType, responseDeadline, checklistGenerated
```

### `InboxThread`

| Field | Purpose |
|---|---|
| `personId` | Owner of the thread |
| `institutionId` | Optional — set when the thread concerns a specific institution |
| `serviceRequestId` | Optional, **unique** — at most one thread per `ServiceRequest`, giving each request its own dedicated conversation |
| `subject` | Thread subject line |
| `threadType` | `notice \| request_update \| reminder \| scheme_announcement \| security_alert \| consent_request` |

A thread with neither `institutionId` nor `serviceRequestId` set is a standalone
platform communication — the clearest example is a `scheme_announcement`
(e.g. a new government benefit the citizen may be eligible for), which concerns no
specific institution relationship and no request yet.

### `Message`

| Field | Purpose |
|---|---|
| `senderLabel` | Display name of the sender as shown to the citizen |
| `senderVerified` | Whether the sending institution/channel has been cryptographically or procedurally confirmed as genuine |
| `importance` | `low \| normal \| high \| urgent` |
| `originalBody` | The verbatim message text, preserved unedited |
| `plainLanguageSummary` | AI-generated plain-language rewrite (see `docs/AI_ASSISTANT.md`) — always shown alongside, never in place of, `originalBody` |
| `suggestedNextAction` | AI-generated suggested action, presented as a suggestion the citizen chooses to act on, never auto-executed |
| `fraudWarning` | Boolean flag — see §3 |
| `channel` | `in_app \| email_simulated \| sms_simulated` |

The `originalBody`/`plainLanguageSummary` pairing matters for the same reason raw
status is preserved in Domain D: a summary is a convenience layer, and the citizen
must always be able to see exactly what was actually sent, not just an
interpretation of it.

### `Notice` — the regulator/tax/insurance/banking specialisation

| Field | Purpose |
|---|---|
| `noticeNumber` | Official reference number, when the source provides one |
| `noticeType` | `income_tax \| insurance \| banking \| regulatory \| other` |
| `responseDeadline` | When a response is due |
| `checklistGenerated` | Whether Suvidha has already generated a response checklist for this notice (feeding into a `ServiceRequest`, typically `serviceCategory=tax_rectification`, `grievance`, or `correction`) |

A `Notice` is not a separate communication channel — it's the same `Message` row with
extra structured fields attached, because notices are exactly where getting the
deadline and reference number right matters most.

## 3. Fraud-warning detection reasoning

`fraudWarning` is set when a message matches a pattern of characteristics that
correlate with fraud, rather than any single one in isolation:

| Signal | Alone | Combined with the others |
|---|---|---|
| `senderVerified = false` | Common and often harmless (many legitimate first contacts arrive unverified) | Raises suspicion when paired with urgency |
| High/urgent `importance` combined with a request for sensitive action | Legitimate urgent notices exist (e.g. a real tax deadline) | Combined with an unverified sender, this is the classic phishing/vishing shape |
| A request for sensitive action specifically (OTP, full account number, payment redirect, "verify by clicking this link") | — | This is the component that most reliably distinguishes a scam from a legitimate reminder, since legitimate institutions rarely request OTPs or full identifiers through an inbound message |

The working heuristic, in plain terms: **unverified sender + urgency + a request for a
sensitive action together = flagged.** None of these alone triggers `fraudWarning`; a
verified, calm, informational message is never flagged regardless of subject matter,
and an unverified-but-low-stakes message (e.g. a marketing note from an unconfirmed
sender) is also not flagged. This mirrors how the platform treats other automated
judgements: it surfaces a warning and an explanation, it never blocks, deletes, or
auto-reports the message on the citizen's behalf.

## 4. How a `Message` links elsewhere

- **To a `ServiceRequest`** — via `InboxThread.serviceRequestId` (unique, so each
  request has exactly one thread). This is how a request-status update from an
  institution ("Your address update is under verification") shows up automatically
  attached to that same request in the Domain D view.
- **To an institution generally** — via `InboxThread.institutionId`. *Assumption,
  clearly labelled:* the schema links a thread to an `Institution`, not directly to a
  specific `InstitutionRelationship`; the product surface is expected to cross-
  reference the citizen's `InstitutionRelationship` rows for that same institution to
  provide contextual display (e.g. showing which account a banking notice most likely
  concerns), but this is a UI-layer inference, not a hard foreign key in the schema.
- **Standing alone** — a thread with neither `institutionId` nor `serviceRequestId`,
  typically `threadType=scheme_announcement` or a platform-generated `reminder`.

## 5. What this doc deliberately doesn't cover

The logic that actually generates `plainLanguageSummary`, `suggestedNextAction`, and
the fraud-detection scoring itself is AI-assistant behaviour, covered in
`docs/AI_ASSISTANT.md`. This document is the data model and UX contract that layer
writes into — what fields exist, what they mean, and the non-negotiable rule that the
original message is always preserved and always shown.
