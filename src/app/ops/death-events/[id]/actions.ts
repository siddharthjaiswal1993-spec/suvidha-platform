"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function decideMatch(matchId: string, deathEventId: string, decision: "confirmed" | "rejected") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.deathEventMatch.update({
    where: { id: matchId },
    data: { status: decision, reviewedByUserId: user.id, reviewedAt: new Date(), riskActionApplied: decision === "confirmed" ? "flagged_for_review" : "no_action_required" },
  });

  await logAudit({ actorUserId: user.id, actorRole: user.primaryRole, entityType: "DeathEventMatch", entityId: matchId, action: `death_event_match.${decision}` });
  revalidatePath(`/ops/death-events/${deathEventId}`);
}

export async function advanceDeathEventStatus(deathEventId: string, status: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await prisma.deathEvent.update({ where: { id: deathEventId }, data: { status } });
  await logAudit({ actorUserId: user.id, actorRole: user.primaryRole, entityType: "DeathEvent", entityId: deathEventId, action: `death_event.${status}` });
  revalidatePath(`/ops/death-events/${deathEventId}`);
}
