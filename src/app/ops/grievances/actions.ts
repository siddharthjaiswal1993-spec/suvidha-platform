"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function resolveGrievance(grievanceId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.grievance.update({ where: { id: grievanceId }, data: { status: "resolved", resolvedAt: new Date() } });
  await logAudit({ actorUserId: user.id, entityType: "Grievance", entityId: grievanceId, action: "grievance.resolved" });
  revalidatePath("/ops/grievances");
}
