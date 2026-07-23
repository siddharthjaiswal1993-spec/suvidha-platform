# API Contracts

## How Suvidha exposes its mutation and query surface

Suvidha is a Next.js 16 App Router application. It deliberately does **not** front every mutation
with a hand-rolled REST layer. The primary mutation mechanism is **Server Actions** — `"use server"`
functions colocated with the feature that owns them (e.g. `src/app/(citizen)/profile/actions.ts`),
called directly from Server/Client Components via form actions or `startTransition`-wrapped calls.
This keeps the request/response contract close to the UI it serves, avoids a duplicate hand-written
API layer for internal use, and matches how the framework is meant to be used.

Route Handlers (`src/app/api/**/route.ts`) exist for exactly two categories of surface where a
Server Action is the wrong tool, because the caller isn't a Suvidha page render:

1. **Connector/integration-simulation endpoints** — the mock stand-ins for what would be real
   institution/registry API calls in production (`/api/connectors/[connectorKey]/...`). See
   `docs/EVENT_MODEL.md` for why these are synchronous function calls dressed as endpoints in the
   prototype, not real network integrations.
2. **Webhook-style inbound endpoints** — where an "institution" (simulated) needs to call back into
   Suvidha asynchronously (`/api/webhooks/institution-status/...`). These follow the idempotency and
   correlation-ID conventions in the last section of this document.

Every shape below is documented conceptually with realistic TypeScript types. These describe the
intended contract for the build-out phases in `ROADMAP.md`; treat this file as the interface
specification the implementation must match, not a description of already-shipped code — see
`docs/00_EXECUTIVE_SUMMARY.md`'s "What's real vs. simulated" table for current build status.

### Conventions used throughout

- All Server Actions return a discriminated-union `ActionResult<T>` rather than throwing for
  expected failure modes (validation errors, not-found, permission-denied), so the calling
  component can render a specific message instead of a generic error boundary.
- All inputs are validated with a **Zod** schema before touching Prisma; the parsed, typed input is
  what the function signature below documents — never trust the raw `FormData`.
- No raw identifiers ever appear in a request or response body. Identifiers are either
  Suvidha-internal cuids or already-masked display strings (`maskedValue`, `maskedAccountNumber`,
  `externalIdToken`). This mirrors the schema-level rule in `prisma/schema.prisma`.
- Every mutation that changes state relevant to audit (profile edits, consent changes, service
  request status, claim decisions) writes an `AuditEvent` row in the same transaction as the
  mutation — never as an afterthought, never best-effort.

```ts
// Shared result shape for all Server Actions
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };
```

---

## 1. Profile field update

**Server Action** — `src/app/(citizen)/profile/actions.ts`

Updating a profile field never overwrites another source's reported value — it inserts a new
`ProfileFieldValue` row with `provenance: "user_entered"`. Conflict detection is a separate,
subsequent read-side computation (see `docs/MASTER_PROFILE_AND_DISCREPANCIES.md`), not something
this action decides.

```ts
type UpdateProfileFieldInput = {
  citizenProfileId: string;
  profileFieldKey: string;       // matches ProfileField.fieldKey, e.g. "present_address"
  value: string;                  // pre-validated against the field's expected shape (address, date, ...)
  sourceLabel: string;             // "Self-declared" for citizen-entered values
};

type UpdateProfileFieldOutput = {
  profileFieldValueId: string;
  fieldKey: string;
  value: string;
  provenance: "user_entered";
  createdAt: string;               // ISO 8601
  conflictsDetected: Array<{        // conflicts this new value creates against existing values
    conflictId: string;
    alternateValueId: string;
    alternateSourceLabel: string;
  }>;
};

async function updateProfileField(
  input: UpdateProfileFieldInput
): Promise<ActionResult<UpdateProfileFieldOutput>>;
```

## 2. Institution-relationship connect (simulated)

**Server Action** — `src/app/(citizen)/institutions/actions.ts`, calling into the connector
simulation layer described in `docs/EVENT_MODEL.md`.

```ts
type ConnectInstitutionRelationshipInput = {
  personId: string;
  institutionId: string;
  connectorKey: string;             // matches Connector.key, e.g. "bank", "epfo"
  relationshipType:
    | "government_identity" | "government_licence" | "financial_account"
    | "employer" | "utility" | "business" | "education";
  consentScopeId: string;           // must reference an already-granted ConsentScope
};

type ConnectInstitutionRelationshipOutput = {
  institutionRelationshipId: string;
  status: "active" | "under_verification" | "verification_failed";
  verificationStatus: "unverified" | "verified" | "verification_failed";
  lastSyncedAt: string | null;
  syncRun: {
    sourceSyncId: string;
    status: "success" | "partial_failure" | "failed";
    recordsSynced: number | null;
    failureReason: string | null;
  };
};

async function connectInstitutionRelationship(
  input: ConnectInstitutionRelationshipInput
): Promise<ActionResult<ConnectInstitutionRelationshipOutput>>;
```

Note: this is simulated synchronously in the prototype (the "connector" is a seeded canned
response, not a real bank API call). The response shape is deliberately identical to what a real
async connector would eventually return, so swapping the implementation later doesn't change the
contract — only `docs/EVENT_MODEL.md`'s event/webhook plumbing needs to be added around it.

## 3. Service-request creation

**Server Action** — `src/app/(citizen)/requests/actions.ts`

```ts
type CreateServiceRequestInput = {
  personId: string;
  serviceDefinitionId: string;
  institutionRelationshipId?: string;
  lifeEventId?: string;             // set when created as part of a Life Event Action
  fieldValues: Record<string, string>;   // keyed by RequiredField.fieldKey
  documentIds: string[];             // LegalDocument ids being attached/reused
};

type CreateServiceRequestOutput = {
  serviceRequestId: string;
  title: string;
  normalizedStatus: "draft" | "information_required" | "ready_to_submit";
  executionMethod:
    | "executable_via_api" | "initiable_via_integration" | "deep_link_redirect"
    | "generated_form_packet" | "assisted_digital_workflow" | "in_person_required"
    | "requires_institution_approval" | "requires_legal_intervention" | "unsupported";
  missingRequirements: Array<{
    requirementType: "document" | "attestation" | "co_claimant_noc" | "external_verification";
    title: string;
    isMandatory: boolean;
  }>;
};

async function createServiceRequest(
  input: CreateServiceRequestInput
): Promise<ActionResult<CreateServiceRequestOutput>>;
```

Submission (moving a request from `ready_to_submit` to `submitted`) is a distinct action,
`submitServiceRequest(serviceRequestId)`, which creates a `Submission` row and, for
`executable_via_api`/`initiable_via_integration` methods, invokes the relevant connector
simulation. It never auto-submits a `draft` request — the citizen (or an explicitly-permissioned
Delegated Task holder) must take the submit action deliberately.

## 4. Service-request status check

**Server Action (read)** — `src/app/(citizen)/requests/[id]/actions.ts`. Exposed as a query rather
than a Route Handler because it's always called from within a Suvidha page render, not by an
external caller.

```ts
type GetServiceRequestStatusInput = { serviceRequestId: string };

type GetServiceRequestStatusOutput = {
  serviceRequestId: string;
  normalizedStatus: string;         // the full normalizedStatus enum from ServiceRequest
  officialStatusRaw: string | null; // from the linked Application, shown alongside, never instead of
  applicationNumber: string | null;
  executionMethod: string;
  statusHistory: Array<{
    normalizedStatus: string;
    officialStatusRaw: string | null;
    note: string | null;
    occurredAt: string;
  }>;
  userDeadlineAt: string | null;
  institutionDeadlineAt: string | null;
};

async function getServiceRequestStatus(
  input: GetServiceRequestStatusInput
): Promise<ActionResult<GetServiceRequestStatusOutput>>;
```

## 5. Document upload / reuse

**Server Action** — `src/app/(citizen)/documents/actions.ts`. The prototype stores no real file
bytes (`LegalDocument.fileLabel` is a synthetic filename, `isDemoDocument` defaults `true`) — the
contract below is written so a real file-storage backend (e.g. a signed upload URL flow) can be
substituted later without changing the shape callers depend on.

```ts
type UploadDocumentInput = {
  ownerPersonId: string;
  documentType: string;             // e.g. "aadhaar_card", "relationship_proof"
  fileLabel: string;
  documentCategory:
    | "identity" | "address" | "tax" | "banking" | "investments" | "insurance"
    | "employment" | "education" | "property" | "vehicle" | "health" | "business"
    | "family" | "legal" | "estate";
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
};

type UploadDocumentOutput = {
  legalDocumentId: string;
  documentProfileId: string;
  isDemoDocument: true;
};

async function uploadDocument(input: UploadDocumentInput): Promise<ActionResult<UploadDocumentOutput>>;

// Reuse: attaches an existing, already-verified LegalDocument to a new ServiceRequest instead
// of asking the citizen to upload again.
type ReuseDocumentInput = {
  serviceRequestId: string;
  legalDocumentId: string;
  reusedFromClaimId?: string;       // set when reusing evidence across claims, mirrors SubmittedEvidence
};

type ReuseDocumentOutput = {
  attached: true;
  requirementSatisfied: boolean;    // false if the institution's reuse policy rejects this document as stale
  reuseRejectedReason?: string;     // e.g. "always_fresh_required", "document_expired"
};

async function reuseDocument(input: ReuseDocumentInput): Promise<ActionResult<ReuseDocumentOutput>>;
```

## 6. Consent grant / revoke

**Server Action** — `src/app/(citizen)/consent/actions.ts`

```ts
type GrantConsentInput = {
  personId: string;
  purposeKey: string;                // matches ConsentPurpose.purposeKey
  connectorId?: string;
  institutionId?: string;
  scopedEntityLabel?: string;        // display-only label, never a raw identifier
  expiresAt?: string;
};

type GrantConsentOutput = {
  consentRecordId: string;
  consentScopeId: string;
  status: "granted";
  receipt: {
    consentArtefactId: string;
    receiptNumber: string;           // unique, durable, shown to the citizen as proof
    scopeSummary: string;
    issuedAt: string;
  };
};

async function grantConsent(input: GrantConsentInput): Promise<ActionResult<GrantConsentOutput>>;

type RevokeConsentInput = { consentRecordId: string; reason?: string };

type RevokeConsentOutput = {
  consentRecordId: string;
  status: "revoked";
  revokedAt: string;
  affectedScopes: string[];          // ConsentScope ids invalidated by this revocation
  affectedInstitutionRelationships: string[]; // relationships whose connector access is now cut off
};

async function revokeConsent(input: RevokeConsentInput): Promise<ActionResult<RevokeConsentOutput>>;
```

Revocation is immediate and cascades to every `ConsentScope` under the `ConsentRecord` — there is no
partial-revocation state. The `ConsentArtefact` (receipt) is retained forever even after revocation,
per the append-only rule in `docs/EVENT_MODEL.md`.

## 7. Death-event report

**Server Action** — `src/app/(citizen)/legacy-succession/death-events/actions.ts`. This is the entry
point into the flow diagrammed in `docs/SEQUENCE_DIAGRAMS.md` §(b). Content and tone must follow
`docs/CONTENT_GUIDELINES.md` — no urgency language, no countdowns.

```ts
type ReportDeathEventInput = {
  personId: string;                  // the Person being reported deceased
  dateOfDeath: string;
  placeOfDeath: string;
  countryOfDeath?: string;           // defaults "India"
  informantName: string;
  informantRelation: string;
  reportedByPersonId?: string;       // set if the Informant is a known Person on the platform
  jurisdictionId?: string;
  initialEvidenceDocumentIds: string[]; // e.g. death certificate, hospital discharge summary
};

type ReportDeathEventOutput = {
  deathEventId: string;
  status: "reported";
  isPubliclyVisible: false;          // must always be false, see prisma/schema.prisma and docs/PRIVACY.md
  nextSteps: Array<{ label: string; executionMethod: string }>;
};

async function reportDeathEvent(input: ReportDeathEventInput): Promise<ActionResult<ReportDeathEventOutput>>;
```

## 8. Claim submission

**Server Action** — `src/app/(institution)/claims/actions.ts` (creation is citizen/claimant-facing;
processing lives on the institution console).

```ts
type SubmitClaimInput = {
  estateId: string;
  claimantId: string;
  institutionId: string;
  claimAssetIds: string[];           // Asset ids being claimed at this institution
  submittedEvidence: Array<{
    legalDocumentId: string;
    evidenceLabel: string;
    reusedFromClaimId?: string;      // demonstrates cross-institution evidence reuse
  }>;
};

type SubmitClaimOutput = {
  claimId: string;
  claimNumber: string;
  status: "submitted";
  workflow: {
    claimWorkflowId: string;
    templateKey: string;             // e.g. "nominee_bank_deposit", "legal_heir_no_will"
    currentStepKey: string | null;
  };
  submittedAt: string;
};

async function submitClaim(input: SubmitClaimInput): Promise<ActionResult<SubmitClaimOutput>>;
```

## 9. Maker-checker decision

**Server Action** — `src/app/(institution)/claims/[id]/decisions/actions.ts`. Enforces separation of
duties at the application layer: the Checker action rejects if `decidedByUserId` on the referenced
Maker `Decision` equals the Checker's own user id.

```ts
type RecordMakerDecisionInput = {
  claimId: string;
  decidedByUserId: string;
  outcome: "recommend_approve" | "recommend_reject" | "escalate" | "request_more_info";
  rationale: string;                  // mandatory — no silent recommendations
};

type RecordCheckerDecisionInput = {
  claimId: string;
  decidedByUserId: string;
  makerDecisionId: string;            // the specific Maker recommendation being reviewed
  outcome: "approve" | "reject" | "partial_approve" | "escalate";
  rationale: string;
};

type DecisionOutput = {
  decisionId: string;
  claimId: string;
  makerCheckerRole: "maker" | "checker" | "adjudicator";
  outcome: string;
  createdAt: string;
  claimStatus: string;               // Claim.status after this decision is applied
};

async function recordMakerDecision(
  input: RecordMakerDecisionInput
): Promise<ActionResult<DecisionOutput>>;

async function recordCheckerDecision(
  input: RecordCheckerDecisionInput
): Promise<ActionResult<DecisionOutput & {
  rejectedReason?: "checker_cannot_be_maker" | "maker_decision_not_found" | "maker_decision_already_actioned";
}>>;
```

---

## Route Handlers: connector simulation and webhook-style endpoints

### Connector simulation endpoints

`POST /api/connectors/[connectorKey]/verify` and `POST /api/connectors/[connectorKey]/sync` — the
mock stand-ins for what would be real institution/registry calls. In the prototype these are
synchronous handlers that look up a seeded canned response keyed by a demo scenario tag and return
it immediately; there is no real outbound network call, no queue, and no retry. See
`docs/EVENT_MODEL.md` for the explicit gap between this and the target production architecture.

```ts
// POST /api/connectors/[connectorKey]/sync
type ConnectorSyncRequestBody = {
  institutionRelationshipId: string;
  correlationId: string;             // caller-generated, propagated into AuditEvent.correlationId
};

type ConnectorSyncResponseBody = {
  correlationId: string;
  status: "success" | "partial_failure" | "failed";
  recordsSynced: number | null;
  failureReason: string | null;
  syncedAt: string;
};
```

### Webhook-style endpoints (institution → Suvidha callback simulation)

`POST /api/webhooks/institution-status/[connectorKey]` — simulates an institution notifying Suvidha
of an asynchronous status change (e.g. "claim moved to under_review"). Even though the prototype
calls this synchronously in the same request/response cycle as the triggering action, the contract
is written to the idempotency/correlation conventions a real webhook receiver needs, so the handler
doesn't have to change shape when a real queue is introduced.

```ts
type InstitutionStatusWebhookBody = {
  eventId: string;                   // globally unique per institution-side event — the idempotency key
  correlationId: string;             // ties back to the originating ServiceRequest/Claim action
  schemaVersion: string;             // e.g. "1.0" — see docs/EVENT_MODEL.md schema-versioning policy
  entityType: "ServiceRequest" | "Claim" | "DeathEventMatch";
  entityId: string;
  rawStatusLabel: string;            // the institution's own status text, stored verbatim
  occurredAt: string;
};

type InstitutionStatusWebhookResponse =
  | { received: true; deduplicated: false; appliedStatus: string }
  | { received: true; deduplicated: true; appliedStatus: string } // eventId already processed
  | { received: false; error: string; retryable: boolean };
```

**Idempotency convention.** Every webhook-style request carries an `eventId` that the handler
checks against a processed-events log (in production, a durable table keyed on `eventId`; in the
prototype, this check is a stub that always reports `deduplicated: false` since there is no real
retrying sender yet — see `docs/EVENT_MODEL.md`). Re-delivering the same `eventId` must always be
safe: it must never double-append a `RequestStatus`/`AuditEvent` row.

**Correlation-ID convention.** Every Server Action that triggers an outbound connector call
generates a `correlationId` (a cuid) before calling out, and that same value is threaded through the
connector call, any resulting webhook callback, and the `AuditEvent.correlationId` column — so a
single citizen-visible action can always be traced end-to-end across every system it touched, even
across the synchronous-call boundary the prototype uses today.

**Schema versioning.** The `schemaVersion` field lets a webhook payload shape evolve without
breaking older institution integrations — an unrecognized-but-parseable `schemaVersion` is
processed on a best-effort basis and logged for manual review rather than rejected outright.
