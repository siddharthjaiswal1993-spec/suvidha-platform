import "server-only";
import { prisma } from "@/lib/db";
import { AuthzError, requireInstitutionTenancy, requireOwnsPerson } from "./guards";

/**
 * Load-and-verify helpers: fetch a resource AND assert the acting user is actually allowed to see
 * it, in one call, so a Server Action can never accidentally skip the check by fetching the
 * resource a different way (e.g. "a citizen changes the URL to another citizen's request id").
 */

export async function getOwnedServiceRequest(requestId: string, actingPersonId: string | null | undefined) {
  const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new AuthzError("Request not found.");
  requireOwnsPerson(actingPersonId, request.personId);
  return request;
}

export async function getTenantServiceRequest(requestId: string, actingInstitutionId: string | null | undefined) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: { serviceDefinition: { include: { serviceCatalogue: true } } },
  });
  if (!request) throw new AuthzError("Request not found.");
  requireInstitutionTenancy(actingInstitutionId, request.serviceDefinition.serviceCatalogue.institutionId);
  return request;
}

export async function getOwnedClaimant(personId: string | null | undefined, estateId: string) {
  const claimant = await prisma.claimant.findFirst({ where: { estateId, personId: personId ?? undefined } });
  if (!claimant) throw new AuthzError("You are not a recognised claimant on this estate.");
  return claimant;
}

export async function getTenantClaim(claimId: string, actingInstitutionId: string | null | undefined) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId } });
  if (!claim) throw new AuthzError("Claim not found.");
  requireInstitutionTenancy(actingInstitutionId, claim.institutionId);
  return claim;
}

/** A citizen may only see a claim's detail if they are a registered Claimant on it. */
export async function getClaimIfClaimant(claimId: string, actingPersonId: string | null | undefined) {
  if (!actingPersonId) throw new AuthzError("Not authenticated as a citizen.");
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, include: { claimant: true } });
  if (!claim) throw new AuthzError("Claim not found.");
  if (claim.claimant.personId !== actingPersonId) throw new AuthzError("You are not a recognised claimant on this claim.");
  return claim;
}

export async function getOwnedGrievance(grievanceId: string, actingPersonId: string | null | undefined) {
  const grievance = await prisma.grievance.findUnique({ where: { id: grievanceId } });
  if (!grievance) throw new AuthzError("Grievance not found.");
  requireOwnsPerson(actingPersonId, grievance.raisedByPersonId ?? "");
  return grievance;
}

export async function getOwnedDelegatedTaskAsOwner(taskId: string, actingPersonId: string | null | undefined) {
  const task = await prisma.delegatedTask.findUnique({
    where: { id: taskId },
    include: { serviceRequest: true },
  });
  if (!task) throw new AuthzError("Delegated task not found.");
  requireOwnsPerson(actingPersonId, task.serviceRequest?.personId ?? "");
  return task;
}
