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
