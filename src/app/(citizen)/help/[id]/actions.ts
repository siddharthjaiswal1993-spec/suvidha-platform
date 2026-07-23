"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

async function ownedGrievance(grievanceId: string, personId: string | null | undefined) {
  const grievance = await prisma.grievance.findUnique({ where: { id: grievanceId } });
  if (!grievance || grievance.raisedByPersonId !== personId) throw new Error("Grievance not found.");
  return grievance;
}

export async function fileAppeal(grievanceId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.personId) throw new Error("Not authenticated as a citizen.");
  const grievance = await ownedGrievance(grievanceId, user.personId);
  if (grievance.status !== "resolved") throw new Error("Only a resolved grievance can be appealed.");

  const groundsForAppeal = String(formData.get("groundsForAppeal") || "").trim();
  if (!groundsForAppeal) throw new Error("Please describe your grounds for appeal.");

  const appeal = await prisma.appeal.create({ data: { grievanceId, groundsForAppeal } });
  await prisma.grievance.update({ where: { id: grievanceId }, data: { status: "escalated" } });

  await logAudit({ actorUserId: user.id, entityType: "Appeal", entityId: appeal.id, action: "grievance.appealed" });
  revalidatePath(`/help/${grievanceId}`);
  revalidatePath("/help");
}

export async function requestEscalation(grievanceId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.personId) throw new Error("Not authenticated as a citizen.");
  await ownedGrievance(grievanceId, user.personId);

  const reason = String(formData.get("reason") || "").trim();
  if (!reason) throw new Error("Please describe why this needs escalation.");

  const escalation = await prisma.escalation.create({
    data: { grievanceId, escalationType: "grievance_escalation", escalatedTo: "Nodal Officer (simulated)", reason },
  });
  await prisma.grievance.update({ where: { id: grievanceId }, data: { status: "escalated" } });

  await logAudit({ actorUserId: user.id, entityType: "Escalation", entityId: escalation.id, action: "grievance.escalated" });
  revalidatePath(`/help/${grievanceId}`);
  revalidatePath("/help");
}
