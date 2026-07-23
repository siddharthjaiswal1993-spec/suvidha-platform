# Analytics and Metrics

## Purpose and a guardrail up front

This document specifies the instrumentation plan across six pillars — Activation, Adoption,
Engagement, Value, Trust, and Retention — and ties each to the citizen/institution/platform-trust
metrics families the product is actually meant to move. As with the rest of the build-out, this is
a specification for what the analytics layer must capture as the application is built, not a
description of a shipped analytics pipeline.

**Guardrail: monetary estate value is never a primary metric, anywhere.** Suvidha does not track,
report on, rank, or optimize toward a citizen's net worth, total assets, or estate value — not on a
dashboard, not in a funnel, not in an internal OKR. The one place asset scale enters the data model
at all (`Payment.amountBand`, `Liability.outstandingAmountBand`) is deliberately banded for display,
never an exact figure, and is never aggregated into a "total portfolio value" metric. This is a
direct consequence of the product-safety principle in `docs/TERMINOLOGY.md`: Suvidha administers
relationships and requests, it does not evaluate wealth. Metrics that could create an incentive to
treat wealthier citizens as more valuable users are explicitly out of scope.

## The six pillars

### 1. Activation

Getting a new citizen to their first real value, fast — measured domain by domain since "activated"
means something different in each.

| Event | Domain | Fires when |
|---|---|---|
| `signup_completed` | Platform | A new `User`/`Person`/`CitizenProfile` is created |
| `profile_first_field_added` | A | First `ProfileFieldValue` created for a new profile |
| `first_institution_connected` | B | First `InstitutionRelationship` reaches `active`/`verified` |
| `first_document_uploaded` | C | First `LegalDocument` created for the person |
| `first_service_request_created` | D | First `ServiceRequest` created |
| `preferred_language_set` | Accessibility | `CitizenProfile.preferredLanguage` explicitly chosen (not left at default) |
| `assisted_mode_enabled` | Accessibility | `accessibilityNeeds` set for the first time |

**Activation metrics family**: time-to-first-institution-connected, percentage of new signups
reaching at least one `active` institutional relationship within 7 days, percentage completing
profile setup without abandoning mid-flow.

### 2. Adoption

Whether a citizen expands from a first success into using the platform's breadth.

| Event | Domain | Fires when |
|---|---|---|
| `institution_relationship_added` | B | Any subsequent `InstitutionRelationship` created (2nd, 3rd, ...) |
| `profile_conflict_detected` | A | A new `ProfileConflict` row is created |
| `profile_conflict_acknowledged` | A | Citizen acts on a conflict (`acknowledged`/`resolved_via_correction_request`/`dismissed_not_a_conflict`) |
| `document_reused` | C | A `LegalDocument` is attached to a second/subsequent `ServiceRequest` or `Claim` |
| `life_event_started` | F | New `LifeEvent` created |
| `consent_granted` | H | New `ConsentRecord`/`ConsentScope` created |
| `delegated_task_created` | H | New `DelegatedTask` created by an owner |
| `estate_plan_started` | I | New `EstatePlan` created |

**Adoption metrics family**: institutional relationships organised per active citizen (median and
distribution), percentage of citizens with at least one resolved profile conflict, document reuse
rate (documents reused ÷ documents that could have been reused per an institution's stated reuse
policy), life-event template adoption by type.

### 3. Engagement

Whether the platform earns repeat, voluntary use rather than one-off setup.

| Event | Domain | Fires when |
|---|---|---|
| `inbox_opened` | E | InboxThread/Message viewed |
| `notice_plain_summary_viewed` | E | `Message.plainLanguageSummary` rendered and viewed |
| `ai_assistant_query` | Platform (AI) | A Life Admin Assistant query is submitted |
| `ai_assistant_response_cited_source` | Platform (AI) | Assistant response includes at least one grounded citation (should be ~100% of responses; tracked to catch regressions) |
| `deadline_dashboard_viewed` | F/G | Unified deadlines view opened |
| `documents_expiring_viewed` | C | "Documents expiring this year" view opened |
| `weekly_active_session` | Platform | Standard session-based engagement event |

**Engagement metrics family**: weekly/monthly active citizens, inbox open rate within 24 hours of a
new high-importance message, AI assistant query volume and repeat-use rate, percentage of sessions
that touch more than one domain (a proxy for the "one place, not one feature" thesis actually
landing).

### 4. Value

Whether the platform is measurably saving citizens and institutions real effort — the pillar most
directly tied to the product's core promise.

| Event | Domain | Fires when |
|---|---|---|
| `service_request_submitted` | D | `ServiceRequest.normalizedStatus` reaches `submitted` |
| `service_request_completed` | D | `ServiceRequest.normalizedStatus` reaches `completed` |
| `life_event_completed` | F | `LifeEvent.status` reaches `completed` |
| `nomination_gap_closed` | G | A `Nomination`/`BeneficiaryDesignation` moves from missing/outdated/disputed to current |
| `claim_settled` | I | `Claim.status` reaches `settled` |
| `document_reuse_time_saved` | C | Derived metric: estimated re-entry time avoided per reuse event (a fixed per-field-count estimate, clearly labeled as an estimate, not a measured wall-clock time) |
| `grievance_resolved` | Ops | `Grievance.status` reaches `resolved` |

**Value metrics family**: requests completed per citizen per year, median time-to-completion by
service category and execution method, nomination coverage rate (percentage of financial holdings
with a current, non-disputed nominee), estimated time saved via document reuse and unified
submission, claim-processing time from `submitted` to `settled` compared against published SLA
(`ServiceDefinition.publishedSlaDays` / `SLA.targetDays`).

### 5. Trust

Whether citizens and institutions can actually rely on what the platform tells them — arguably the
pillar most specific to this product's safety commitments.

| Event | Domain | Fires when |
|---|---|---|
| `consent_granted` / `consent_revoked` | H | `ConsentRecord`/`ConsentScope` status changes |
| `access_grant_revoked` | H | `AccessGrant`/`DelegatedTask` revoked |
| `false_death_match_challenged` | I | New `DeathEventCorrection` created |
| `false_death_match_resolved` | I | `DeathEventCorrection.status` reaches `resolved` |
| `fraud_signal_raised` | I | New `FraudSignal` created |
| `fraud_signal_confirmed` / `fraud_signal_false_positive` | I | `FraudSignal.status` resolves either way |
| `ai_assistant_uncertainty_flagged` | Platform (AI) | Assistant explicitly declines to answer / escalates rather than guesses |
| `execution_method_mismatch_reported` | D | A citizen reports that a labeled execution method didn't match reality (a direct trust-integrity signal) |
| `grievance_escalated` | Ops | `Escalation`/`Appeal` created against a `Grievance` |

**Trust metrics family**: false-match rate (`DeathEventMatch`es that resulted in a
`DeathEventCorrection`, as a share of all matches), false-death correction resolution time, AI
assistant factual-error rate (responses later flagged as incorrect against grounded data, via
citizen feedback or audit sampling), consent-revocation completion rate within SLA (time from
`revokeConsent` call to every affected `InstitutionRelationship`/connector access actually cut off),
percentage of AI assistant responses that included a source citation, grievance-escalation rate as
a share of total grievances (a rising rate signals first-line resolution quality is slipping).

**Trust metrics are reported without being gamed toward**: the false-match rate and AI
factual-error rate are deliberately kept visible even when they're the "bad news" numbers, and no
downstream incentive (e.g. claims-officer throughput targets) is allowed to implicitly pressure
these rates downward at the expense of catching genuine fraud or genuine AI errors.

### 6. Retention

Whether citizens keep the platform as their ongoing system of engagement rather than treating it as
a one-time setup tool.

| Event | Domain | Fires when |
|---|---|---|
| `returning_session_30d` / `returning_session_90d` | Platform | Standard cohort-return events |
| `institution_relationship_resynced` | B | A citizen returns to trigger a manual re-sync |
| `profile_review_completed` | A | Citizen reviews and confirms profile currency without a triggering conflict |
| `estate_plan_reviewed` | I | `EstatePlan.lastReviewedAt` updated via an actual review action, not a passive timestamp bump |
| `professional_representative_engagement_renewed` | H | A `ProfessionalRepresentative` relationship re-activated after a lapse |

**Retention metrics family**: 30/90-day citizen retention, estate-plan review cadence (percentage of
Estate Planners reviewing within their `nextReviewDueAt` window, tracked without countdown-style UI
pressure per `docs/CONTENT_GUIDELINES.md`), institutional-relationship staleness (percentage with
`lastSyncedAt` older than a defined threshold, as a proxy for whether citizens are letting the graph
go stale), churn signals (long-inactive citizens with unresolved profile conflicts or upcoming
deadlines — a signal for proactive re-engagement, not a growth-hacking trigger).

## Institution-side and platform-trust metrics

Beyond the citizen-facing six pillars, the ops console tracks its own operational metrics, feeding
the SLA dashboards and audit-log explorer described in `docs/USER_STORIES.md`'s cross-cutting
section:

- **SLA adherence**: actual vs. `SLA.targetDays` by `processType`, per institution.
- **Maker-checker throughput and integrity**: decisions per Maker/Checker, and — critically — zero
  tolerance tracked as a metric: any case where a Checker decision's `decidedByUserId` matched the
  Maker's is flagged as a system-integrity incident, not a normal data point.
- **Deficiency-request cycle time**: time from `DeficiencyRequest.raisedAt` to `respondedAt` to
  `resolvedAt`, by institution and service category.
- **Connector/integration health**: `SourceSync` success/partial-failure/failed rates per connector,
  feeding the Integration Administrator's monitoring view (`docs/EVENT_MODEL.md`).
- **Audit completeness**: a platform-integrity metric, not a product metric — percentage of
  state-changing actions that have a corresponding `AuditEvent` row (target: 100%; any gap is a
  defect, not a tuning parameter).

## Instrumentation principles

1. **Every event name and its trigger condition is documented before it's implemented** — this file
   is the source of truth new events are added to, mirroring how `docs/TERMINOLOGY.md` governs
   vocabulary.
2. **No event payload contains a raw, unmasked identifier or an exact balance.** Analytics
   payloads are held to the same masking discipline as the rest of the product.
3. **Trust-pillar metrics are never optimized away.** A dashboard that makes `false_match_rate` or
   `ai_assistant_factual_error_rate` harder to see than adoption/engagement numbers is itself a
   product defect.
4. **Monetary estate value stays out of scope permanently** (restated from the top of this
   document because it is the single easiest guardrail to accidentally violate as new metrics are
   proposed).
