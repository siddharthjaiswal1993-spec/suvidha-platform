import "server-only";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { roleHasPermission, type Permission } from "./permissions";
import type { RoleKey } from "@/lib/roles";

export class AuthzError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthzError";
  }
}

/**
 * Every Server Action that mutates state should call this first — it independently re-verifies
 * authentication and role permission on the server, regardless of what the UI already hid or
 * disabled. Never trust a client-side check alone (see docs/SECURITY.md).
 */
export async function requireUserWithPermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) throw new AuthzError("Not authenticated.");
  if (!roleHasPermission(user.primaryRole as RoleKey, permission)) {
    throw new AuthzError(`Role "${user.primaryRole}" does not have permission "${permission}".`);
  }
  return user;
}

/** Ownership check: the acting person must be the citizen the resource belongs to. */
export function requireOwnsPerson(actingPersonId: string | null | undefined, resourcePersonId: string) {
  if (!actingPersonId || actingPersonId !== resourcePersonId) {
    throw new AuthzError("You do not have access to this record.");
  }
}

/** Tenancy check: an institution-side user may only act on cases belonging to their own institution. */
export function requireInstitutionTenancy(actingInstitutionId: string | null | undefined, resourceInstitutionId: string) {
  if (!actingInstitutionId || actingInstitutionId !== resourceInstitutionId) {
    throw new AuthzError("This case belongs to a different institution.");
  }
}

/**
 * Maker-checker separation of duties: a checker decision on a claim/request must be made by a
 * different user than whoever made the prior maker recommendation on the same case. This is the
 * one rule that cannot be expressed as a static role→permission mapping — it depends on the
 * specific case's decision history, so it lives here rather than in permissions.ts.
 */
export async function requireDifferentMakerChecker(input: {
  claimId?: string;
  serviceRequestId?: string;
  checkerUserId: string;
}) {
  const priorMakerDecisions = await prisma.decision.findMany({
    where: {
      claimId: input.claimId ?? undefined,
      serviceRequestId: input.serviceRequestId ?? undefined,
      makerCheckerRole: "maker",
    },
    select: { decidedByUserId: true },
  });

  const makerWasThisUser = priorMakerDecisions.some((d) => d.decidedByUserId === input.checkerUserId);
  if (makerWasThisUser) {
    throw new AuthzError("The checker must be a different person than the maker who recommended this case.");
  }
}

const VALID_REQUEST_TRANSITIONS: Record<string, string[]> = {
  draft: ["information_required", "ready_to_submit", "submitted", "cancelled"],
  information_required: ["ready_to_submit", "cancelled"],
  ready_to_submit: ["submitted", "cancelled"],
  submitted: ["acknowledged", "under_verification", "under_review", "cancelled"],
  acknowledged: ["under_verification", "under_review"],
  under_verification: ["additional_information_required", "under_review", "approved", "rejected"],
  additional_information_required: ["under_verification", "under_review"],
  under_review: ["additional_information_required", "approved", "rejected", "escalated", "partially_completed"],
  escalated: ["approved", "rejected", "disputed"],
  disputed: ["approved", "rejected"],
  approved: ["completed", "partially_completed"],
  partially_completed: ["completed"],
  rejected: [],
  completed: [],
  cancelled: [],
  expired: [],
};

/** Prevents a ServiceRequest from being moved to a status its current status cannot legally reach. */
export function assertValidRequestTransition(currentStatus: string, nextStatus: string) {
  const allowed = VALID_REQUEST_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(nextStatus)) {
    throw new AuthzError(`Cannot move a request from "${currentStatus}" to "${nextStatus}".`);
  }
}
