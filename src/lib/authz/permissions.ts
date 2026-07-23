/**
 * The full permission catalogue for Suvidha, and the fixed role → permission map. A user's role
 * comes only from their authenticated persona (`User.primaryRole`) — there is no UI anywhere that
 * lets a user pick or elevate their own role. See docs/ACCESS_CONTROL_MATRIX.md.
 *
 * This is deliberately a plain TypeScript map, not a database table: for a prototype at this
 * scale, a `RolePermission` table would add a join and a migration for no behavioural benefit
 * over a reviewable, type-checked constant. See docs/ASSUMPTIONS_AND_LIMITATIONS.md.
 */
import type { RoleKey } from "@/lib/roles";

export const PERMISSIONS = {
  // Citizen — always scoped to "self" or "authorised", enforced by resource-access.ts, never by
  // the permission check alone.
  PROFILE_READ_SELF: "profile.read.self",
  PROFILE_UPDATE_SELF: "profile.update.self",
  INSTITUTION_RELATIONSHIP_READ_SELF: "institution_relationship.read.self",
  DOCUMENT_READ_SELF: "document.read.self",
  DOCUMENT_UPLOAD_SELF: "document.upload.self",
  DOCUMENT_SHARE_SELF: "document.share.self",
  SERVICE_REQUEST_CREATE_SELF: "service_request.create.self",
  SERVICE_REQUEST_READ_SELF: "service_request.read.self",
  SERVICE_REQUEST_SUBMIT_SELF: "service_request.submit.self",
  SERVICE_REQUEST_RESPOND_DEFICIENCY_SELF: "service_request.respond_deficiency.self",
  CONSENT_MANAGE_SELF: "consent.manage.self",
  DELEGATION_MANAGE_SELF: "delegation.manage.self",
  LEGACY_PLAN_SELF: "legacy.plan.self",
  CLAIM_READ_AUTHORISED: "claim.read.authorised",
  DEATH_EVENT_REPORT: "death_event.report",
  GRIEVANCE_CREATE_SELF: "grievance.create.self",

  // Institution / government ops
  SERVICE_REQUEST_QUEUE_READ: "service_request.queue.read",
  SERVICE_REQUEST_REVIEW: "service_request.review",
  SERVICE_REQUEST_REQUEST_DEFICIENCY: "service_request.request_deficiency",
  SERVICE_REQUEST_RECOMMEND: "service_request.recommend",
  SERVICE_REQUEST_APPROVE: "service_request.approve",
  SERVICE_REQUEST_REJECT: "service_request.reject",
  SERVICE_REQUEST_ESCALATE: "service_request.escalate",
  SERVICE_REQUEST_COMPLETE: "service_request.complete",
  CLAIM_REVIEW: "claim.review",
  CLAIM_REQUEST_DEFICIENCY: "claim.request_deficiency",
  CLAIM_RECOMMEND: "claim.recommend",
  CLAIM_APPROVE: "claim.approve",
  CLAIM_REJECT: "claim.reject",
  PAYOUT_RECORD: "payout.record",
  DEATH_EVENT_READ: "death_event.read",
  DEATH_EVENT_VERIFY: "death_event.verify",
  DEATH_EVENT_MATCH: "death_event.match",
  CORRECTION_REVIEW: "correction.review",
  GRIEVANCE_READ: "grievance.read",
  GRIEVANCE_RESOLVE: "grievance.resolve",
  AUDIT_READ: "audit.read",
  INTEGRATION_MANAGE: "integration.manage",
  RULES_MANAGE: "rules.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const CITIZEN_BASE: Permission[] = [
  PERMISSIONS.PROFILE_READ_SELF,
  PERMISSIONS.PROFILE_UPDATE_SELF,
  PERMISSIONS.INSTITUTION_RELATIONSHIP_READ_SELF,
  PERMISSIONS.DOCUMENT_READ_SELF,
  PERMISSIONS.DOCUMENT_UPLOAD_SELF,
  PERMISSIONS.DOCUMENT_SHARE_SELF,
  PERMISSIONS.SERVICE_REQUEST_CREATE_SELF,
  PERMISSIONS.SERVICE_REQUEST_READ_SELF,
  PERMISSIONS.SERVICE_REQUEST_SUBMIT_SELF,
  PERMISSIONS.SERVICE_REQUEST_RESPOND_DEFICIENCY_SELF,
  PERMISSIONS.CONSENT_MANAGE_SELF,
  PERMISSIONS.DELEGATION_MANAGE_SELF,
  PERMISSIONS.LEGACY_PLAN_SELF,
  PERMISSIONS.CLAIM_READ_AUTHORISED,
  PERMISSIONS.DEATH_EVENT_REPORT,
  PERMISSIONS.GRIEVANCE_CREATE_SELF,
];

export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  independent_citizen: CITIZEN_BASE,
  family_administrator: CITIZEN_BASE,
  assisted_citizen: CITIZEN_BASE,
  parent_guardian: CITIZEN_BASE,
  professional_representative: CITIZEN_BASE,
  estate_planner: CITIZEN_BASE,
  claimant: CITIZEN_BASE,

  registrar_officer: [
    PERMISSIONS.DEATH_EVENT_READ,
    PERMISSIONS.DEATH_EVENT_VERIFY,
    PERMISSIONS.DEATH_EVENT_MATCH,
    PERMISSIONS.CORRECTION_REVIEW,
    PERMISSIONS.AUDIT_READ,
  ],
  institution_officer: [
    PERMISSIONS.SERVICE_REQUEST_QUEUE_READ,
    PERMISSIONS.SERVICE_REQUEST_REVIEW,
    PERMISSIONS.SERVICE_REQUEST_REQUEST_DEFICIENCY,
    PERMISSIONS.SERVICE_REQUEST_RECOMMEND,
    PERMISSIONS.SERVICE_REQUEST_COMPLETE,
    PERMISSIONS.CLAIM_REVIEW,
    PERMISSIONS.CLAIM_REQUEST_DEFICIENCY,
    PERMISSIONS.CLAIM_RECOMMEND,
    PERMISSIONS.PAYOUT_RECORD,
    PERMISSIONS.DEATH_EVENT_READ,
  ],
  verification_officer: [
    PERMISSIONS.SERVICE_REQUEST_QUEUE_READ,
    PERMISSIONS.SERVICE_REQUEST_REVIEW,
    PERMISSIONS.SERVICE_REQUEST_REQUEST_DEFICIENCY,
    PERMISSIONS.CLAIM_REVIEW,
    PERMISSIONS.CLAIM_REQUEST_DEFICIENCY,
    PERMISSIONS.DEATH_EVENT_READ,
  ],
  maker: [
    PERMISSIONS.SERVICE_REQUEST_QUEUE_READ,
    PERMISSIONS.SERVICE_REQUEST_REVIEW,
    PERMISSIONS.SERVICE_REQUEST_RECOMMEND,
    PERMISSIONS.CLAIM_RECOMMEND,
  ],
  checker: [
    PERMISSIONS.SERVICE_REQUEST_QUEUE_READ,
    PERMISSIONS.SERVICE_REQUEST_APPROVE,
    PERMISSIONS.SERVICE_REQUEST_REJECT,
    PERMISSIONS.SERVICE_REQUEST_COMPLETE,
    PERMISSIONS.CLAIM_APPROVE,
    PERMISSIONS.CLAIM_REJECT,
    PERMISSIONS.PAYOUT_RECORD,
  ],
  adjudicator: [
    PERMISSIONS.SERVICE_REQUEST_QUEUE_READ,
    PERMISSIONS.SERVICE_REQUEST_APPROVE,
    PERMISSIONS.SERVICE_REQUEST_REJECT,
    PERMISSIONS.SERVICE_REQUEST_ESCALATE,
    PERMISSIONS.CLAIM_APPROVE,
    PERMISSIONS.CLAIM_REJECT,
  ],
  grievance_officer: [
    PERMISSIONS.GRIEVANCE_READ,
    PERMISSIONS.GRIEVANCE_RESOLVE,
  ],
  auditor: [
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.SERVICE_REQUEST_QUEUE_READ,
    PERMISSIONS.CLAIM_REVIEW,
    PERMISSIONS.DEATH_EVENT_READ,
  ],
  integration_admin: [
    PERMISSIONS.INTEGRATION_MANAGE,
    PERMISSIONS.RULES_MANAGE,
    PERMISSIONS.AUDIT_READ,
  ],
};

export function roleHasPermission(role: RoleKey, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
