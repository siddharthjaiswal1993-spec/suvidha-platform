# Event Model

## Scope and an upfront honesty note

This document describes the **target production event-driven architecture** behind death-event
notification and institution propagation, service-request status changes, and audit-event capture.

**It is not a description of what the prototype currently runs.** The prototype's mock connectors
(`src/app/api/connectors/**`, see `docs/API_CONTRACTS.md`) are plain synchronous function calls that
look up a seeded, canned response and return it in the same request/response cycle. There is no
message queue, no real retry, no dead-letter store, and no independently-running worker in this
codebase. Every "event" in the prototype is really just an `AuditEvent` row written inline inside
the Server Action or Route Handler that caused it.

The gap is deliberate and documented, not accidental: building a real queue/broker for a
time-boxed portfolio prototype would spend effort on infrastructure rather than on the product and
data-model decisions this project exists to demonstrate. This file specifies what a production
build would need instead, so the architectural thinking is visible even though the implementation is
not present.

---

## Why an event-driven model at all

A death-event report, or a service-request status change, is not a fact that lives in one place.
It must reach every institution that holds a relevant relationship, be acknowledged by each of
them independently, and be reconciled if some institutions respond and others don't. Modeling this
as a single synchronous call chain doesn't survive contact with reality: institutions will be slow,
will occasionally be down, will sometimes send a status update out of order, and will occasionally
send the same update twice. An event model is how the system stays correct — and stays honestly
labeled as "not yet acknowledged" rather than silently wrong — under those conditions.

## Core concepts

### 1. Events, not just state changes

Every state transition that matters to a citizen, an institution, or an auditor is emitted as a
discrete, named, versioned event — not merely reflected by updating a status column in place.
Examples: `death_event.reported`, `death_event.registrar_verified`, `death_event.matched`,
`service_request.status_changed`, `claim.decision_recorded`, `access_grant.revoked`. The
`AuditEvent` model is the durable record of these; in a full production build, an event bus (e.g. a
managed queue/topic system) would carry the same payloads to subscribers in near-real time, with
`AuditEvent` remaining the permanent, queryable log of record regardless of whether the live
subscriber processed it successfully.

### 2. Idempotent event processing

Every event carries a globally unique `eventId`. Every consumer of an event — an institution
propagation worker, a notification dispatcher, a reconciliation job — must check `eventId` against
a processed-events ledger before acting, and must be safe to receive the same `eventId` twice
without double-effect (no duplicate notification, no double-counted status transition, no
re-triggered payout). This is non-negotiable for anything touching money (`Payment`, `Transfer`) or
anything touching a person's `lifeStatus` — a duplicated "confirm deceased" event must never cause a
second, redundant institution freeze action.

### 3. Correlation IDs

A single citizen-visible action (reporting a death, submitting a service request) generates one
`correlationId` that is threaded through every downstream event, connector call, and webhook
callback it causes — across institutions, across retries, across days. `AuditEvent.correlationId`
exists specifically so that "what happened, end to end, because of this one action" is always a
single, complete query, even when a dozen institutions were independently involved. See
`docs/API_CONTRACTS.md` for the request-level convention.

### 4. Webhook retry with backoff

Where Suvidha calls out to an institution's system (or, symmetrically, where an institution calls
back into Suvidha), delivery is not guaranteed on the first attempt. The target architecture uses
exponential backoff with jitter (e.g. attempts at ~1s, ~5s, ~30s, ~5min, ~30min, capped, with a
maximum attempt count) rather than either a single fire-and-forget call or a tight retry loop that
could overwhelm a slow institution endpoint. Every retry attempt is itself logged, not silently
absorbed, so a citizen-facing "why is this stuck" investigation has a full delivery history to look
at.

### 5. Dead-letter handling

After retries are exhausted, an event moves to a dead-letter state rather than being dropped. A
dead-lettered event must:

- remain visible in the Integration Administrator's connector-monitoring view (see
  `docs/USER_STORIES.md`'s cross-cutting ops stories),
- never silently mark the underlying `ServiceRequest`/`Claim`/`DeathEventMatch` as resolved or
  failed on the citizen's behalf — the citizen-visible `normalizedStatus` reflects genuine
  uncertainty (e.g. `under_verification` persisting) rather than a fabricated outcome, and
- be resolvable via a documented manual fallback (see §7 below).

### 6. Institution acknowledgement

A death-event notification, or a service-request submission, is not considered delivered until the
receiving institution's system explicitly acknowledges it — a distinct event
(`institution.acknowledged`) from the initial send. The `DeathEventMatch.status` progression
(`suggested` → `confirmed`/`rejected`/`needs_human_review`) and `Application.officialStatusRaw`
exist precisely so "we sent it" and "they confirmed receipt and are acting on it" are never
conflated in what the citizen sees.

### 7. Partial failures and manual fallback

In a propagation fan-out to N institutions (e.g. a death-event notification to every institution
with an `InstitutionRelationship` for the deceased), some institutions will acknowledge promptly,
some will be slow, and some will fail outright (an unreachable sandbox, a malformed institution-side
response, an institution not yet integrated at all). The target design treats this as the normal
case, not an exception:

- each institution's propagation status is tracked independently (mirroring `DeathEventMatch` per
  institution),
- a citizen or Claims Officer sees exactly which institutions are pending, acknowledged, or failed,
  never a single aggregate "done"/"not done" flag that hides partial failure,
- institutions whose propagation dead-letters after retries are surfaced as needing a manual
  fallback path — for example, a generated notification packet the Claims Officer can send through
  an alternate channel (the `generated_form_packet` execution method), so the process has a human
  escape hatch rather than stalling silently forever.

### 8. Reconciliation

Because institution acknowledgement can arrive out of order, late, or be re-sent, a periodic
reconciliation job (in production; a manually-triggered comparison in the prototype's absence of a
scheduler) compares Suvidha's view of each `InstitutionRelationship`/`ServiceRequest`/`DeathEventMatch`
status against the institution's last-known raw status, flagging mismatches for review rather than
auto-correcting either side. This is the same non-auto-resolving posture the schema enforces for
`ProfileConflict` — the platform surfaces disagreement, it does not adjudicate it.

### 9. Schema versioning

Every event and webhook payload carries a `schemaVersion` (see `docs/API_CONTRACTS.md`'s webhook
contract). Consumers written against an older version must degrade gracefully against a newer
payload (ignore unrecognized fields) rather than fail hard, and a payload with an unrecognized major
version is queued for manual review rather than silently dropped or guessed at.

### 10. Full auditability

Every event, successful or failed, acknowledged or dead-lettered, retried or first-try, is written
to `AuditEvent` — append-only from the application layer (the schema comment on `AuditEvent` is
explicit: never update or delete a row, only insert). This is what lets an Auditor/Regulator
reconstruct, after the fact, not just what the final state was but the complete path — including
failures, retries, and manual interventions — that got there.

---

## Illustrative event catalogue

| Event | Emitted when | Key payload fields |
|---|---|---|
| `death_event.reported` | An Informant reports a death | `deathEventId`, `personId`, `dateOfDeath`, `correlationId` |
| `death_event.evidence_submitted` | Evidence attached | `deathEventId`, `evidenceType`, `documentId` |
| `death_event.registrar_verified` | Registrar confirms registration | `deathEventId`, `registrationNumber` |
| `death_event.match_suggested` | Matching engine proposes an institution match | `deathEventId`, `institutionId`, `confidenceScore`, `matchFactors` |
| `institution.acknowledged` | Institution confirms receipt of a propagated notification | `institutionId`, `entityType`, `entityId`, `correlationId` |
| `death_event.correction_challenged` | A false-positive match is challenged | `deathEventId`, `deathEventCorrectionId`, `reason` |
| `death_event.correction_resolved` | Correction/reactivation completes | `deathEventId`, `resolutionNotes` |
| `service_request.status_changed` | Normalized or raw status changes | `serviceRequestId`, `normalizedStatus`, `officialStatusRaw`, `correlationId` |
| `service_request.deficiency_raised` | Institution requests more information | `serviceRequestId`, `title`, `description` |
| `claim.decision_recorded` | A Maker/Checker/Adjudicator decision is made | `claimId`, `makerCheckerRole`, `outcome`, `rationale` |
| `claim.payment_processed` | A `Payment` moves to `processed` | `claimId`, `paymentId`, `amountBand` |
| `access_grant.revoked` | A Trusted Contact/Delegated Task's access is revoked | `accessGrantId` or `delegatedTaskId`, `revokedAt` |
| `fraud_signal.raised` | A `FraudSignal` is created | `signalType`, `severity`, `claimId` or `subjectPersonId` |

## What would change to make this real

To move from the prototype's synchronous simulation to the architecture above, a production build
would introduce: (1) a durable message queue/topic (e.g. a managed pub/sub or streaming service)
sitting between the Server Action that initiates an action and the connector call, (2) a
processed-events ledger table keyed on `eventId` for idempotency, (3) a background worker process
for retry/backoff and dead-letter handling (outside Next.js's request/response lifecycle, since
Vercel Functions are not a long-running worker), and (4) a scheduled reconciliation job. None of
this changes the Prisma schema or the Server Action/Route Handler contracts documented in
`docs/API_CONTRACTS.md` — those were designed to be stable across this exact transition.
