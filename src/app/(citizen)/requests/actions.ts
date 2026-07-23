"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { requireUserWithPermission, assertValidRequestTransition } from "@/lib/authz/guards";
import { policyRespondToDeficiencySelf, policySubmitServiceRequestTransition } from "@/lib/authz/policies";
import { PERMISSIONS } from "@/lib/authz/permissions";
import { SERVICE_CATEGORY_FIELD_MAP } from "@/lib/reconciliation";

export async function createServiceRequest(formData: FormData) {
  const user = await requireUserWithPermission(PERMISSIONS.SERVICE_REQUEST_CREATE_SELF);
  if (!user.personId) throw new Error("Not authenticated as a citizen.");

  const serviceDefinitionId = String(formData.get("serviceDefinitionId"));
  const institutionRelationshipId = String(formData.get("institutionRelationshipId") || "") || null;
  const documentIdEvidence = String(formData.get("documentIdEvidence") || "") || null;
  const requestedChangeRaw = String(formData.get("requestedChange") || "").trim();

  // Document ownership check: a citizen can only attach their own document as evidence.
  if (documentIdEvidence) {
    const doc = await prisma.legalDocument.findUnique({ where: { id: documentIdEvidence } });
    if (!doc || doc.ownerPersonId !== user.personId) {
      throw new Error("You can only attach your own documents as evidence.");
    }
  }

  const serviceDefinition = await prisma.serviceDefinition.findUniqueOrThrow({
    where: { id: serviceDefinitionId },
    include: { serviceCatalogue: true },
  });

  const fieldMapping = SERVICE_CATEGORY_FIELD_MAP[serviceDefinition.serviceCategory];
  const requestedValueSummary = requestedChangeRaw ? (fieldMapping ? `${fieldMapping.prefix} ${requestedChangeRaw}` : requestedChangeRaw) : null;

  const request = await prisma.serviceRequest.create({
    data: {
      personId: user.personId,
      serviceDefinitionId,
      institutionRelationshipId,
      documentIdEvidence,
      requestedValueSummary,
      title: serviceDefinition.title,
      normalizedStatus: "draft",
      executionMethod: serviceDefinition.requiresInPerson ? "in_person_required" : "assisted_digital_workflow",
      statusEvents: { create: [{ normalizedStatus: "draft", note: "Request created" }] },
    },
  });

  // Step 5 of the request engine (docs/SERVICE_REQUEST_ENGINE.md): a consent record + receipt is
  // created for every request that shares data with an institution, not just financial-discovery
  // consents — visible and revocable from Privacy & Consent.
  const consent = await prisma.consentRecord.create({
    data: { personId: user.personId, purpose: "service_request_processing", status: "granted" },
  });
  await prisma.consentArtefact.create({
    data: {
      consentRecordId: consent.id,
      receiptNumber: `CR-${new Date().getFullYear()}-${request.id.slice(-6).toUpperCase()}`,
      scopeSummary: `${serviceDefinition.title} at ${serviceDefinition.serviceCatalogue.institutionId ? "the selected institution" : "Suvidha"} — request ${request.id.slice(-8)}`,
    },
  });

  await logAudit({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    entityType: "ServiceRequest",
    entityId: request.id,
    action: "service_request.created",
  });

  revalidatePath("/requests");
  redirect(`/requests/${request.id}`);
}

export async function submitServiceRequest(requestId: string) {
  const user = await requireUserWithPermission(PERMISSIONS.SERVICE_REQUEST_SUBMIT_SELF);
  const request = await policySubmitServiceRequestTransition(requestId, user.personId, "submitted");
  void request;

  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      normalizedStatus: "submitted",
      statusEvents: { create: [{ normalizedStatus: "submitted", note: "Submitted by citizen" }] },
      submissions: { create: [{ channelUsed: "online_portal", outcome: "simulated_success" }] },
    },
  });

  await logAudit({ actorUserId: user.id, entityType: "ServiceRequest", entityId: requestId, action: "service_request.submitted" });
  revalidatePath(`/requests/${requestId}`);
}

export async function respondToServiceRequestDeficiency(deficiencyId: string, requestId: string, formData: FormData) {
  const { user } = await policyRespondToDeficiencySelf(requestId, (await getCurrentUser())?.personId);
  const note = String(formData.get("note") ?? "").trim();
  if (!note) throw new Error("Please describe your response.");

  const deficiency = await prisma.deficiencyRequest.findUnique({ where: { id: deficiencyId } });
  if (!deficiency || deficiency.serviceRequestId !== requestId) throw new Error("Deficiency not found for this request.");

  await prisma.deficiencyRequest.update({ where: { id: deficiencyId }, data: { status: "responded", respondedAt: new Date() } });

  const request = await prisma.serviceRequest.findUniqueOrThrow({ where: { id: requestId } });
  assertValidRequestTransition(request.normalizedStatus, "under_review");
  await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      normalizedStatus: "under_review",
      statusEvents: { create: [{ normalizedStatus: "under_review", note: `Citizen responded to deficiency: ${note}` }] },
    },
  });

  await logAudit({ actorUserId: user.id, entityType: "DeficiencyRequest", entityId: deficiencyId, action: "deficiency_request.responded_self" });
  revalidatePath(`/requests/${requestId}`);
}

