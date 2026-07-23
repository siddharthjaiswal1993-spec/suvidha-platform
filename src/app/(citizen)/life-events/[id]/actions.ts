"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function completeLifeEventAction(actionId: string, lifeEventId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.lifeEventAction.update({ where: { id: actionId }, data: { status: "completed" } });

  const allActions = await prisma.lifeEventAction.findMany({ where: { lifeEventId } });
  const completedCount = allActions.filter((a) => a.status === "completed").length;
  const progressPercent = Math.round((completedCount / allActions.length) * 100);

  await prisma.lifeEvent.update({
    where: { id: lifeEventId },
    data: { progressPercent, status: progressPercent === 100 ? "completed" : "in_progress", completedAt: progressPercent === 100 ? new Date() : null },
  });

  await logAudit({ actorUserId: user.id, entityType: "LifeEventAction", entityId: actionId, action: "life_event_action.completed" });
  revalidatePath(`/life-events/${lifeEventId}`);
}
