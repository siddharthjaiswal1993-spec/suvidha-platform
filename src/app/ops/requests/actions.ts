"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { assertValidRequestTransition } from "@/lib/authz/guards";
import { policyRecordServiceRequestDecision, policyRequestServiceRequestDeficiency, policyCompleteServiceRequest } from "@/lib/authz/policies";
import { PERMISSIONS } from "@/lib/authz/permissions";
import { requireUserWithPermission } from "@/lib/authz/guards";
import { getTenantServiceRequest } from "@/lib/authz/resource-access";
import { reconcileProfileFieldAfterCompletion, recalculateLifeEventProgress } from "@/lib/reconciliation";

export async function acceptRequestIntoReview(requestId: string) {
  const user = await requireUserWithPermission(PERMISSIONS.SERVICE_REQUEST_REVIEW);
  const request = await getTenantServiceRequest(requestId, user.institutionId);
  assertValidRequestTransition(request.normalizedStatus, "under_review");

  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: { normalizedStatus: "under_review", statusEvents: { create: [{ normalizedStatus: "under_review", note: `Accepted into review by ${user.displayName}` }] } },
  });
  await logAudit({ actorUserId: user.id, actorRole: user.primaryRole, entityType: "ServiceRequest", entityId: requestId, action: "service_request.accepted_into_review" });
  revalidatePath(`/ops/requests/${requestId}`);
}

export async function raiseServiceRequestDeficiency(requestId: string, formData: FormData) {
  const { user, request } = await policyRequestServiceRequestDeficiency(requestId);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !description) throw new Error("Title and description are required.");

  assertValidRequestTransition(request.normalizedStatus, "additional_information_required");
  await prisma.deficiencyRequest.create({ data: { serviceRequestId: requestId, title, description, status: "open" } });
  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: { normalizedStatus: "additional_information_required", statusEvents: { create: [{ normalizedStatus: "additional_information_required", note: title }] } },
  });

  await logAudit({ actorUserId: user.id, actorRole: user.primaryRole, entityType: "ServiceRequest", entityId: requestId, action: "service_request.deficiency_raised" });
  revalidatePath(`/ops/requests/${requestId}`);
}

export async function recordServiceRequestDecision(requestId: string, formData: FormData) {
  const makerCheckerRole = String(formData.get("makerCheckerRole")) as "maker" | "checker" | "adjudicator";
  const outcome = String(formData.get("outcome"));
  const rationale = String(formData.get("rationale") ?? "");

  const { user, request } = await policyRecordServiceRequestDecision({ requestId, makerCheckerRole, outcome });

  await prisma.decision.create({ data: { serviceRequestId: requestId, decidedByUserId: user.id, makerCheckerRole, outcome, rationale } });

  if (outcome === "approve") {
    assertValidRequestTransition(request.normalizedStatus, "approved");
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { normalizedStatus: "approved", statusEvents: { create: [{ normalizedStatus: "approved", note: `Approved by ${user.displayName} (${makerCheckerRole})` }] } },
    });
  } else if (outcome === "reject") {
    assertValidRequestTransition(request.normalizedStatus, "rejected");
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { normalizedStatus: "rejected", statusEvents: { create: [{ normalizedStatus: "rejected", note: rationale || "Rejected" }] } },
    });
  } else if (outcome === "escalate") {
    assertValidRequestTransition(request.normalizedStatus, "escalated");
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { normalizedStatus: "escalated", statusEvents: { create: [{ normalizedStatus: "escalated", note: rationale || "Escalated" }] } },
    });
  } else {
    // recommend_approve / recommend_reject — maker-only recommendations don't change the citizen-facing status yet.
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { statusEvents: { create: [{ normalizedStatus: request.normalizedStatus, note: `${user.displayName} (maker) recorded: ${outcome.replaceAll("_", " ")}` }] } },
    });
  }

  await logAudit({ actorUserId: user.id, actorRole: user.primaryRole, entityType: "ServiceRequest", entityId: requestId, action: `service_request.decision.${outcome}` });
  revalidatePath(`/ops/requests/${requestId}`);
}

/** Institution officially completes the update — this is the moment the citizen's profile reconciles. */
export async function completeServiceRequestAndReconcile(requestId: string) {
  const { user, request } = await policyCompleteServiceRequest(requestId);

  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: { normalizedStatus: "completed", statusEvents: { create: [{ normalizedStatus: "completed", note: `Institution confirmed the update — recorded by ${user.displayName}` }] } },
  });
  if (request.institutionRelationshipId) {
    const relationship = await prisma.institutionRelationship.findUnique({ where: { id: request.institutionRelationshipId }, include: { institution: true } });
    const newValue = request.requestedValueSummary?.replace(/^New address:\s*/i, "");
    if (relationship && newValue) {
      await reconcileProfileFieldAfterCompletion({
        personId: request.personId,
        fieldKey: "present_address",
        newValue,
        sourceLabel: `${relationship.institution.name} (institution-confirmed)`,
        sourceInstitutionId: relationship.institutionId,
        institutionRelationshipId: relationship.id,
        actorUserId: user.id,
        actorRole: user.primaryRole,
        serviceRequestId: requestId,
      });
    }
  }

  if (request.lifeEventId) {
    await prisma.lifeEventAction.updateMany({ where: { serviceRequestId: requestId }, data: { status: "completed" } });
    await recalculateLifeEventProgress(request.lifeEventId);
  }

  await logAudit({ actorUserId: user.id, actorRole: user.primaryRole, entityType: "ServiceRequest", entityId: requestId, action: "service_request.completed" });
  revalidatePath(`/ops/requests/${requestId}`);
  revalidatePath("/profile");
}
