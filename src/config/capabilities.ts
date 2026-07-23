/**
 * The single source of truth for "what actually works right now" — every doc that makes a
 * real-vs-simulated claim (README, docs/ASSUMPTIONS_AND_LIMITATIONS.md, the in-app about/status
 * surface) should trace back to this file rather than restating its own assessment, so the two
 * can never silently drift apart the way they had before this registry existed.
 *
 * Status meanings:
 * - documented_only:        described in docs/, no working screen or logic yet
 * - interface_prototype:    a screen exists and renders real data, but the underlying workflow
 *                            doesn't yet enforce state transitions / write real records
 * - functional_prototype:   real Server Actions, real Prisma writes, real authorization checks —
 *                            works end to end against the seeded data, within its documented scope
 * - end_to_end_simulation:  functional_prototype AND covered by a Playwright golden-flow spec
 * - partner_dependent:      would require a real institution/regulator partnership to go further
 * - policy_dependent:       would require legislation or new public digital infrastructure
 * - production_ready:       not used anywhere in this repository — nothing here is production-ready
 */

export type CapabilityStatus =
  | "documented_only"
  | "interface_prototype"
  | "functional_prototype"
  | "end_to_end_simulation"
  | "partner_dependent"
  | "policy_dependent"
  | "production_ready"
  | "not_applicable";

export type Capability = {
  capabilityKey: string;
  title: string;
  domain: string;
  citizenFlowStatus: CapabilityStatus;
  institutionFlowStatus: CapabilityStatus | "not_applicable";
  integrationStatus: CapabilityStatus;
  testStatus: "unit_tested" | "e2e_tested" | "unit_and_e2e_tested" | "manually_verified" | "untested";
  productionReadiness: CapabilityStatus;
  limitations: string;
  relevantRoutes: string[];
};

export const CAPABILITIES: Capability[] = [
  {
    capabilityKey: "master_profile_consistency",
    title: "Master profile & discrepancy detection",
    domain: "A. Master Profile",
    citizenFlowStatus: "functional_prototype",
    institutionFlowStatus: "not_applicable",
    integrationStatus: "documented_only",
    testStatus: "e2e_tested",
    productionReadiness: "documented_only",
    limitations: "Conflicts are seeded, not detected live from a real sync. A \"Check for updates\" action and a per-field history view now exist — the check deliberately re-confirms rather than fabricating a new finding, since there's no live connector to actually detect one. See docs/MASTER_PROFILE_AND_DISCREPANCIES.md.",
    relevantRoutes: ["/profile"],
  },
  {
    capabilityKey: "institutional_relationship_graph",
    title: "Institutional relationship graph",
    domain: "B. Institutional Relationships",
    citizenFlowStatus: "end_to_end_simulation",
    institutionFlowStatus: "not_applicable",
    integrationStatus: "partner_dependent",
    testStatus: "unit_and_e2e_tested",
    productionReadiness: "documented_only",
    limitations: "Most relationships are seeded synthetic data, but a citizen can now connect a new institution themselves (a two-step simulated identity match — under_verification, then a citizen-confirmed active state — modelling the real two-step process honestly rather than an instant unexplained \"verified\" badge). No live connector exists — see docs/INTEGRATIONS.md.",
    relevantRoutes: ["/institutions", "/institutions/[id]"],
  },
  {
    capabilityKey: "document_evidence_hub",
    title: "Document & evidence hub",
    domain: "C. Document & Evidence Hub",
    citizenFlowStatus: "end_to_end_simulation",
    institutionFlowStatus: "not_applicable",
    integrationStatus: "documented_only",
    testStatus: "e2e_tested",
    productionReadiness: "documented_only",
    limitations: "Upload, a document detail page (verification history, renewal, reuse history), sharing with revocation, and deletion are all wired to real writes. No real file bytes are ever stored (isDemoDocument) and there is no DigiLocker fetch — see docs/DOCUMENT_AND_EVIDENCE_MODEL.md.",
    relevantRoutes: ["/documents", "/documents/[id]"],
  },
  {
    capabilityKey: "service_request_engine",
    title: "Unified service request engine (create → requested change → evidence → consent → submit → track)",
    domain: "D. Service Requests",
    citizenFlowStatus: "end_to_end_simulation",
    institutionFlowStatus: "end_to_end_simulation",
    integrationStatus: "documented_only",
    testStatus: "unit_and_e2e_tested",
    productionReadiness: "documented_only",
    limitations: "The multi-step builder is a 4-section form (including a \"requested change\" step, added this pass), not a literal 9-step wizard; institution status mapping is seeded, not live. Category-to-profile-field mapping is now shared (src/lib/reconciliation.ts's SERVICE_CATEGORY_FIELD_MAP) between the life-event flow and the general engine so completing any request — not just address-change — reconciles correctly. See docs/SERVICE_REQUEST_ENGINE.md.",
    relevantRoutes: ["/requests", "/requests/new", "/requests/[id]", "/ops/requests", "/ops/requests/[id]"],
  },
  {
    capabilityKey: "maker_checker_separation",
    title: "Maker-checker separation of duties",
    domain: "Authorization",
    citizenFlowStatus: "not_applicable",
    institutionFlowStatus: "end_to_end_simulation",
    integrationStatus: "not_applicable",
    testStatus: "unit_and_e2e_tested",
    productionReadiness: "documented_only",
    limitations: "Server-enforced (src/lib/authz/guards.ts requireDifferentMakerChecker) for both ServiceRequest and Claim decisions — see docs/ACCESS_CONTROL_MATRIX.md.",
    relevantRoutes: ["/ops/requests/[id]", "/ops/claims/[caseId]"],
  },
  {
    capabilityKey: "address_change_life_event",
    title: "Address-change life event (the flagship cross-domain journey)",
    domain: "F. Life-Event Orchestration",
    citizenFlowStatus: "end_to_end_simulation",
    institutionFlowStatus: "end_to_end_simulation",
    integrationStatus: "documented_only",
    testStatus: "unit_and_e2e_tested",
    productionReadiness: "documented_only",
    limitations: "The new address value is fixed at seed time rather than citizen-entered in a form field — see docs/LIFE_EVENT_ORCHESTRATION.md.",
    relevantRoutes: ["/life-events", "/life-events/[id]"],
  },
  {
    capabilityKey: "profile_reconciliation",
    title: "Profile reconciliation after institution completion",
    domain: "F/A crossover",
    citizenFlowStatus: "end_to_end_simulation",
    institutionFlowStatus: "end_to_end_simulation",
    integrationStatus: "not_applicable",
    testStatus: "unit_and_e2e_tested",
    productionReadiness: "documented_only",
    limitations: "Now proven end to end for present_address (the flagship flow) AND mobile_primary (via a general nominee/mobile/name request, not just the address life event) — both use the identical SERVICE_CATEGORY_FIELD_MAP mechanism, so legal_name (PAN name correction) is wired the same way even though it isn't separately e2e-covered yet. See src/lib/reconciliation.ts.",
    relevantRoutes: ["/profile", "/institutions/[id]"],
  },
  {
    capabilityKey: "communication_inbox",
    title: "Unified communication centre",
    domain: "E. Communication & Inbox",
    citizenFlowStatus: "end_to_end_simulation",
    institutionFlowStatus: "documented_only",
    integrationStatus: "documented_only",
    testStatus: "e2e_tested",
    productionReadiness: "documented_only",
    limitations: "Read, plain-language explanation, reply, escalate-to-grievance, and report-as-suspicious are all wired to real writes (a citizen reply is a real Message row; escalation creates a real Grievance linked back to the thread). There is still no institution-side compose/send screen — institution messages are seeded, not sent from an ops UI. See docs/COMMUNICATION_AND_INBOX.md.",
    relevantRoutes: ["/inbox", "/inbox/[id]"],
  },
  {
    capabilityKey: "delegated_access",
    title: "Delegated & family access",
    domain: "H. Delegated Access",
    citizenFlowStatus: "end_to_end_simulation",
    institutionFlowStatus: "not_applicable",
    integrationStatus: "not_applicable",
    testStatus: "unit_and_e2e_tested",
    productionReadiness: "documented_only",
    limitations: "A citizen can now invite a new assistant (creating a real Person + DelegatedTask), always scoped to one of their own open requests rather than blanket account access — matching the model's own \"specific task, never full authority\" design. The invite is self-approved (no self-approval theater) since the citizen initiated it themselves; there's no real invitation email, and the invitee has no login of their own in this demo's persona set. See docs/DELEGATED_ACCESS.md.",
    relevantRoutes: ["/family-access"],
  },
  {
    capabilityKey: "legacy_succession",
    title: "Legacy, Incapacity, Bereavement & Succession (full domain)",
    domain: "I. Legacy & Succession",
    citizenFlowStatus: "end_to_end_simulation",
    institutionFlowStatus: "end_to_end_simulation",
    integrationStatus: "policy_dependent",
    testStatus: "unit_and_e2e_tested",
    productionReadiness: "documented_only",
    limitations: "Death-event national propagation and cross-institution matching are simulated — no such live infrastructure exists in India today. See docs/LEGACY_AND_SUCCESSION.md and docs/INDIA_DIGITAL_SERVICE_LANDSCAPE.md.",
    relevantRoutes: ["/legacy", "/legacy/planning", "/legacy/claim", "/legacy/claim/[claimId]", "/legacy/report-death", "/legacy/status-correction"],
  },
  {
    capabilityKey: "grievances",
    title: "Grievances & escalation",
    domain: "Cross-cutting",
    citizenFlowStatus: "end_to_end_simulation",
    institutionFlowStatus: "functional_prototype",
    integrationStatus: "not_applicable",
    testStatus: "unit_and_e2e_tested",
    productionReadiness: "documented_only",
    limitations: "Institution-side resolution requires a category, note, and citizen-notification acknowledgement. Citizen-side now has a detail page with real escalation (to a simulated Nodal Officer) and appeal (against a resolved grievance) actions, plus grievances can be raised directly from an inbox thread (traced back via Grievance.sourceInboxThreadId). Maker-checker separation is not extended to grievance resolution or death-event matching — only ServiceRequest and Claim decisions.",
    relevantRoutes: ["/help", "/help/[id]", "/ops/grievances"],
  },
  {
    capabilityKey: "life_admin_assistant",
    title: "Life Admin Assistant",
    domain: "AI Assistant",
    citizenFlowStatus: "functional_prototype",
    institutionFlowStatus: "not_applicable",
    integrationStatus: "documented_only",
    testStatus: "e2e_tested",
    productionReadiness: "documented_only",
    limitations: "Deterministic, cited, rule-based simulation over a fixed question list — not a live LLM. Expanded from 4 to 8 questions this pass (grievances, document shares, delegated access, estate readiness added), all grounded in the citizen's own real data. No proactive/unprompted nudges yet — the citizen must open the Assistant and pick a question. See docs/AI_ASSISTANT.md.",
    relevantRoutes: ["/assistant"],
  },
  {
    capabilityKey: "hindi_localisation",
    title: "Hindi localisation",
    domain: "Accessibility",
    citizenFlowStatus: "interface_prototype",
    institutionFlowStatus: "not_applicable",
    integrationStatus: "not_applicable",
    testStatus: "manually_verified",
    productionReadiness: "documented_only",
    limitations: "Deprioritised per product direction — the dictionary/locale plumbing exists and covers navigation plus a few key screens, but is not the primary supported experience right now. English is the default and primary language.",
    relevantRoutes: ["/settings"],
  },
  {
    capabilityKey: "mobile_navigation",
    title: "Mobile navigation drawer",
    domain: "Accessibility",
    citizenFlowStatus: "functional_prototype",
    institutionFlowStatus: "functional_prototype",
    integrationStatus: "not_applicable",
    testStatus: "manually_verified",
    productionReadiness: "documented_only",
    limitations: "Focus-trapped, Escape-to-close drawer via Radix Dialog for both citizen and ops shells; no dedicated bottom-tab navigation.",
    relevantRoutes: ["*"],
  },
  {
    capabilityKey: "accessibility_and_ci",
    title: "Accessibility testing & continuous integration",
    domain: "Engineering quality",
    citizenFlowStatus: "not_applicable",
    institutionFlowStatus: "not_applicable",
    integrationStatus: "not_applicable",
    testStatus: "e2e_tested",
    productionReadiness: "documented_only",
    limitations: "docs/TEST_PLAN.md previously claimed an axe-core scan and a keyboard-only pass on every golden flow — neither existed. This pass adds a real axe-core scan (critical/serious violations fail the test) and a keyboard-tab-order check to golden-flow-a, and a GitHub Actions workflow (.github/workflows/ci.yml) running typecheck/lint/unit/e2e/build on every push and PR. Still only one flow carries the accessibility scan, not all eight spec files — the TEST_PLAN.md wording has been corrected to say so honestly rather than re-claiming full coverage.",
    relevantRoutes: ["*"],
  },
];

export function getCapability(key: string): Capability | undefined {
  return CAPABILITIES.find((c) => c.capabilityKey === key);
}
