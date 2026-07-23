"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function decideDelegatedTask(taskId: string, decision: "approved" | "rejected") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.delegatedTask.update({ where: { id: taskId }, data: { status: decision, decidedAt: new Date() } });
  await logAudit({ actorUserId: user.id, entityType: "DelegatedTask", entityId: taskId, action: `delegated_task.${decision}` });
  revalidatePath("/family-access");
}
