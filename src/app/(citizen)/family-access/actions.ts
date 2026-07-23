"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireUserWithPermission } from "@/lib/authz/guards";
import { getOwnedDelegatedTaskAsOwner } from "@/lib/authz/resource-access";
import { PERMISSIONS } from "@/lib/authz/permissions";

export async function decideDelegatedTask(taskId: string, decision: "approved" | "rejected") {
  const user = await requireUserWithPermission(PERMISSIONS.DELEGATION_MANAGE_SELF);
  await getOwnedDelegatedTaskAsOwner(taskId, user.personId);

  await prisma.delegatedTask.update({ where: { id: taskId }, data: { status: decision, decidedAt: new Date() } });
  await logAudit({ actorUserId: user.id, entityType: "DelegatedTask", entityId: taskId, action: `delegated_task.${decision}` });
  revalidatePath("/family-access");
}

const VALID_PERMISSION_TIERS = new Set([
  "permission_to_view",
  "permission_to_assist",
  "permission_to_prepare",
  "permission_to_submit",
  "permission_to_sign",
  "permission_to_receive_communication",
]);

/**
 * A citizen inviting a new assistant is self-initiated, so it's created already `approved` (no
 * self-approval theater) — see docs/DELEGATED_ACCESS.md. The invitee is recorded as a new Person;
 * this prototype doesn't send a real invitation email or require the invitee to accept, since they
 * have no login of their own in the demo persona set.
 */
export async function inviteAssistant(formData: FormData) {
  const user = await requireUserWithPermission(PERMISSIONS.DELEGATION_MANAGE_SELF);
  if (!user.personId) throw new Error("Not authenticated as a citizen.");

  const fullName = String(formData.get("fullName") || "").trim();
  const relation = String(formData.get("relation") || "").trim();
  const permissionTier = String(formData.get("permissionTier") || "");
  const serviceRequestId = String(formData.get("serviceRequestId") || "");
  if (!fullName) throw new Error("A name is required.");
  if (!VALID_PERMISSION_TIERS.has(permissionTier)) throw new Error("Invalid permission tier.");
  if (!serviceRequestId) throw new Error("Choose which request to delegate — delegated access is always scoped to a specific task, never blanket account access.");

  const request = await prisma.serviceRequest.findUnique({ where: { id: serviceRequestId } });
  if (!request || request.personId !== user.personId) throw new Error("You can only delegate your own requests.");

  const assistantPerson = await prisma.person.create({ data: { fullName, scenarioTag: "invited_assistant" } });
  const task = await prisma.delegatedTask.create({
    data: {
      assistantPersonId: assistantPerson.id,
      serviceRequestId,
      permissionTier,
      status: "approved",
      decidedAt: new Date(),
    },
  });

  await logAudit({ actorUserId: user.id, entityType: "DelegatedTask", entityId: task.id, action: "delegated_task.invited", metadata: { assistantName: fullName, relation, permissionTier } });
  revalidatePath("/family-access");
}
