"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function raiseGrievance(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.personId) throw new Error("Not authenticated");

  const subject = String(formData.get("subject"));
  const description = String(formData.get("description"));

  const grievance = await prisma.grievance.create({
    data: { raisedByPersonId: user.personId, subject, description, status: "open" },
  });

  await logAudit({ actorUserId: user.id, entityType: "Grievance", entityId: grievance.id, action: "grievance.raised" });
  revalidatePath("/help");
}
