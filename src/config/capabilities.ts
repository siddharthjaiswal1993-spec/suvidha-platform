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
    limitations: "Conflicts are seeded, not detected live from a real sync — see docs/MASTER_PROFILE_AND_DISCREPANCIES.md.",
    relevantRoutes: ["/profile"],
  },
  {
    capabilityKey: "institutional_relationship_graph",
    title: "Institutional relationship graph",
    domain: "B. Institutional Relationships",
    citizenFlowStatus: "functional_prototype",
    institutionFlowStatus: "not_applicable",
    integrationStatus: "partner_dependent",
    testStatus: "e2e_tested",
    productionReadiness: "documented_only",
    limitations: "Every relationship is seeded synthetic data; no live connector exists — see docs/INTEGRATIONS.md.",
    relevantRoutes: ["/institutions", "/institutions/[id]"],
  },
  {
    capabilityKey: "document_evidence_hub",
    title: "Document & evidence hub",
    domain: "C. Document & Evidence Hub",
    citizenFlowStatus: "interface_prototype",
    institutionFlowStatus: "not_applicable",
    integrationStatus: "documented_only",
    testStatus: "manually_verified",
    productionReadiness: "documented_only",
    limitations: "Documents can be selected as evidence on a request, but there is no upload, DigiLocker fetch, or version/renewal management UI yet — see docs/DOCUMENT_AND_EVIDENCE_MODEL.md.",
    relevantRoutes: ["/documents"],
  },
  {
    capabilityKey: "service_request_engine",
    title: "Unified service request engine (create → evidence → consent → submit → track)",
    domain: "D. Service Requests",
    citizenFlowStatus: "end_to_end_simulation",
    institutionFlowStatus: "end_to_end_simulation",
    integrationStatus: "documented_only",
    testStatus: "unit_and_e2e_tested",
    productionReadiness: "documented_only",
    limitations: "The multi-step builder is a 3-section form, not a literal 9-step wizard; institution status mapping is seeded, not live — see docs/SERVICE_REQUEST_ENGINE.md.",
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
    citizenFlowStatus: "functional_prototype",
    institutionFlowStatus: "functional_prototype",
    integrationStatus: "not_applicable",
    testStatus: "e2e_tested",
    productionReadiness: "documented_only",
    limitations: "Implemented for the present_address field only (mobile_primary/legal_name share the same helper but aren't wired to a UI flow yet) — see src/lib/reconciliation.ts.",
    relevantRoutes: ["/profile", "/institutions/[id]"],
  },
  {
    capabilityKey: "communication_inbox",
    title: "Unified communication centre",
    domain: "E. Communication & Inbox",
    citizenFlowStatus: "interface_prototype",
    institutionFlowStatus: "documented_only",
    integrationStatus: "documented_only",
    testStatus: "manually_verified",
    productionReadiness: "documented_only",
    limitations: "Read and plain-language explanation work; reply/escalate-to-grievance/mark-suspicious actions are not yet wired — see docs/COMMUNICATION_AND_INBOX.md.",
    relevantRoutes: ["/inbox", "/inbox/[id]"],
  },
  {
    capabilityKey: "delegated_access",
    title: "Delegated & family access",
    domain: "H. Delegated Access",
    citizenFlowStatus: "functional_prototype",
    institutionFlowStatus: "not_applicable",
    integrationStatus: "not_applicable",
    testStatus: "e2e_tested",
    productionReadiness: "documented_only",
    limitations: "Invitation, permission-tier selection, and revocation exist for a pre-seeded relationship; there is no invite-a-new-person flow yet — see docs/DELEGATED_ACCESS.md.",
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
    citizenFlowStatus: "interface_prototype",
    institutionFlowStatus: "functional_prototype",
    integrationStatus: "not_applicable",
    testStatus: "manually_verified",
    productionReadiness: "documented_only",
    limitations: "Institution-side resolution now requires a category, note, and citizen-notification acknowledgement; citizen-side is create-and-track only, no escalation/appeal UI yet.",
    relevantRoutes: ["/help", "/ops/grievances"],
  },
  {
    capabilityKey: "life_admin_assistant",
    title: "Life Admin Assistant",
    domain: "AI Assistant",
    citizenFlowStatus: "functional_prototype",
    institutionFlowStatus: "not_applicable",
    integrationStatus: "documented_only",
    testStatus: "manually_verified",
    productionReadiness: "documented_only",
    limitations: "Deterministic, cited, rule-based simulation over a fixed question list — not a live LLM. See docs/AI_ASSISTANT.md.",
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
];

export function getCapability(key: string): Capability | undefined {
  return CAPABILITIES.find((c) => c.capabilityKey === key);
}
