"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireUserWithPermission } from "@/lib/authz/guards";
import { getClaimIfClaimant } from "@/lib/authz/resource-access";
import { PERMISSIONS } from "@/lib/authz/permissions";

export async function respondToDeficiency(deficiencyId: string, claimId: string, formData: FormData) {
  const user = await requireUserWithPermission(PERMISSIONS.CLAIM_READ_AUTHORISED);
  await getClaimIfClaimant(claimId, user.personId);

  const note = String(formData.get("note") ?? "");

  const deficiency = await prisma.deficiencyRequest.findUnique({ where: { id: deficiencyId } });
  if (!deficiency || deficiency.claimId !== claimId) throw new Error("Deficiency not found for this claim.");

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
