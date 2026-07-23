"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function respondToDeficiency(deficiencyId: string, claimId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const note = String(formData.get("note") ?? "");

  await prisma.deficiencyRequest.update({
    where: { id: deficiencyId },
    data: { status: "responded", respondedAt: new Date() },
  });

  await prisma.submittedEvidence.create({
    data: { claimId, evidenceLabel: note || "Response submitted to deficiency request" },
  });

  await logAudit({ actorUserId: user.id, entityType: "DeficiencyRequest", entityId: deficiencyId, action: "deficiency_request.responded", claimId });
  revalidatePath(`/legacy/claim/${claimId}`);
}
