"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

/**
 * Simulates the registrar-side correction that would normally involve a human registrar officer
 * reviewing re-verification evidence — see docs/WORKFLOWS.md's false-death correction workflow.
 * In this prototype, the citizen-facing "submit re-verification" action immediately advances the
 * correction to `registrar_corrected` to keep the golden-flow demo self-contained; a real system
 * would route this through /ops for a Registrar Officer to act on.
 */
export async function submitReverification(deathEventId: string, personId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const correction = await prisma.deathEventCorrection.findFirst({ where: { deathEventId } });
  if (!correction) throw new Error("No correction record found");

  await prisma.deathEventCorrection.update({
    where: { id: correction.id },
    data: { status: "registrar_corrected", resolutionNotes: "Re-verification confirmed the subject is living. Registrar corrected the record.", resolvedAt: new Date() },
  });
  await prisma.deathEvent.update({ where: { id: deathEventId }, data: { status: "corrected" } });
  await prisma.person.update({ where: { id: personId }, data: { lifeStatus: "living" } });
  await prisma.deathEventMatch.updateMany({ where: { deathEventId }, data: { status: "rejected", riskActionApplied: "restrictions_reversed" } });

  await logAudit({ actorUserId: user.id, entityType: "DeathEventCorrection", entityId: correction.id, action: "death_event_correction.registrar_corrected" });
  revalidatePath("/legacy/status-correction");
  revalidatePath("/legacy");
}
