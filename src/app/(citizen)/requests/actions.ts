"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function createServiceRequest(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.personId) throw new Error("Not authenticated");

  const serviceDefinitionId = String(formData.get("serviceDefinitionId"));
  const institutionRelationshipId = String(formData.get("institutionRelationshipId") || "") || null;

  const serviceDefinition = await prisma.serviceDefinition.findUniqueOrThrow({ where: { id: serviceDefinitionId } });

  const request = await prisma.serviceRequest.create({
    data: {
      personId: user.personId,
      serviceDefinitionId,
      institutionRelationshipId,
      title: serviceDefinition.title,
      normalizedStatus: "draft",
      executionMethod: serviceDefinition.requiresInPerson ? "in_person_required" : "assisted_digital_workflow",
      statusEvents: { create: [{ normalizedStatus: "draft", note: "Request created" }] },
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
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

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
