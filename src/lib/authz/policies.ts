import "server-only";
import { PERMISSIONS } from "./permissions";
import { requireUserWithPermission, requireDifferentMakerChecker, AuthzError, assertValidRequestTransition } from "./guards";
import { getTenantServiceRequest, getTenantClaim } from "./resource-access";

/**
 * Composed, action-specific policies — each one is the single function a Server Action calls,
 * so the permission + ownership/tenancy + state-machine + separation-of-duties checks for a given
 * action live in exactly one place instead of being re-assembled at every call site.
 */

export async function policyRecordServiceRequestDecision(input: {
  requestId: string;
  makerCheckerRole: "maker" | "checker" | "adjudicator";
  outcome: string;
}) {
  const permission =
    input.makerCheckerRole === "maker"
      ? PERMISSIONS.SERVICE_REQUEST_RECOMMEND
      : input.outcome === "reject"
        ? PERMISSIONS.SERVICE_REQUEST_REJECT
        : PERMISSIONS.SERVICE_REQUEST_APPROVE;

  const user = await requireUserWithPermission(permission);
  const request = await getTenantServiceRequest(input.requestId, user.institutionId);

  if (input.makerCheckerRole === "checker" || input.makerCheckerRole === "adjudicator") {
    await requireDifferentMakerChecker({ serviceRequestId: input.requestId, checkerUserId: user.id });
  }

  return { user, request };
}

export async function policyRequestServiceRequestDeficiency(requestId: string) {
  const user = await requireUserWithPermission(PERMISSIONS.SERVICE_REQUEST_REQUEST_DEFICIENCY);
  const request = await getTenantServiceRequest(requestId, user.institutionId);
  return { user, request };
}

export async function policyCompleteServiceRequest(requestId: string) {
  const user = await requireUserWithPermission(PERMISSIONS.SERVICE_REQUEST_COMPLETE);
  const request = await getTenantServiceRequest(requestId, user.institutionId);
  if (request.normalizedStatus !== "approved") {
    throw new AuthzError('A request can only be marked completed after it has been "approved".');
  }
  return { user, request };
}

export async function policyRespondToDeficiencySelf(requestId: string, actingPersonId: string | null | undefined) {
  const user = await requireUserWithPermission(PERMISSIONS.SERVICE_REQUEST_RESPOND_DEFICIENCY_SELF);
  if (!actingPersonId) throw new AuthzError("Not authenticated as a citizen.");
  const { getOwnedServiceRequest } = await import("./resource-access");
  const request = await getOwnedServiceRequest(requestId, actingPersonId);
  return { user, request };
}

export async function policySubmitServiceRequestTransition(requestId: string, actingPersonId: string | null | undefined, nextStatus: string) {
  await requireUserWithPermission(PERMISSIONS.SERVICE_REQUEST_SUBMIT_SELF);
  const { getOwnedServiceRequest } = await import("./resource-access");
  const request = await getOwnedServiceRequest(requestId, actingPersonId);
  assertValidRequestTransition(request.normalizedStatus, nextStatus);
  return request;
}

export async function policyRecordClaimDecision(input: {
  claimId: string;
  makerCheckerRole: "maker" | "checker" | "adjudicator";
  outcome: string;
}) {
  const permission =
    input.makerCheckerRole === "maker"
      ? PERMISSIONS.CLAIM_RECOMMEND
      : input.outcome === "reject"
        ? PERMISSIONS.CLAIM_REJECT
        : PERMISSIONS.CLAIM_APPROVE;

  const user = await requireUserWithPermission(permission);
  const claim = await getTenantClaim(input.claimId, user.institutionId);

  if (input.makerCheckerRole === "checker" || input.makerCheckerRole === "adjudicator") {
    await requireDifferentMakerChecker({ claimId: input.claimId, checkerUserId: user.id });
  }

  return { user, claim };
}

export async function policyResolveGrievance(grievanceId: string) {
  const user = await requireUserWithPermission(PERMISSIONS.GRIEVANCE_RESOLVE);
  const { prisma } = await import("@/lib/db");
  const grievance = await prisma.grievance.findUnique({ where: { id: grievanceId } });
  if (!grievance) throw new AuthzError("Grievance not found.");
  if (grievance.institutionId) {
    const { requireInstitutionTenancy } = await import("./guards");
    requireInstitutionTenancy(user.institutionId, grievance.institutionId);
  }
  return { user, grievance };
}
