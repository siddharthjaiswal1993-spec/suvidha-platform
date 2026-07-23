"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function revokeTrustedContact(trustedContactId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.trustedContact.update({ where: { id: trustedContactId }, data: { status: "revoked", revokedAt: new Date() } });
  await prisma.accessGrant.updateMany({ where: { trustedContactId }, data: { status: "revoked", revokedAt: new Date() } });

  await logAudit({ actorUserId: user.id, entityType: "TrustedContact", entityId: trustedContactId, action: "trusted_contact.revoked" });
  revalidatePath("/legacy/planning");
}
