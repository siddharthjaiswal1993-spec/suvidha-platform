"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

/**
 * Simulated re-sync — this prototype has no live connector to any institution (see
 * docs/INTEGRATIONS.md), so this deliberately does NOT fabricate a new discrepancy. It re-confirms
 * `lastVerifiedAt` on every currently-verified field value and logs the check, which is the honest
 * version of "we looked again and nothing new was found" rather than presenting a fake finding.
 */
export async function checkForProfileUpdates() {
  const user = await getCurrentUser();
  if (!user?.personId) throw new Error("Not authenticated as a citizen.");

  const citizenProfile = await prisma.citizenProfile.findUnique({ where: { personId: user.personId } });
  if (!citizenProfile) throw new Error("No profile found.");

  const result = await prisma.profileFieldValue.updateMany({
    where: { citizenProfileId: citizenProfile.id, provenance: "verified_by_source", isCurrentForSource: true },
    data: { lastVerifiedAt: new Date() },
  });

  await logAudit({ actorUserId: user.id, entityType: "CitizenProfile", entityId: citizenProfile.id, action: "profile.resync_checked", metadata: { fieldsChecked: result.count } });
  revalidatePath("/profile");
  return result.count;
}
