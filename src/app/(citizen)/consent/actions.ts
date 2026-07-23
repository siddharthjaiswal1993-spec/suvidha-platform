"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function revokeConsent(consentRecordId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.consentRecord.update({ where: { id: consentRecordId }, data: { status: "revoked", revokedAt: new Date() } });
  await logAudit({ actorUserId: user.id, entityType: "ConsentRecord", entityId: consentRecordId, action: "consent.revoked" });
  revalidatePath("/consent");
}
