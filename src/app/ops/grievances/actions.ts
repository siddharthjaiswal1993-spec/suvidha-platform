"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { policyResolveGrievance } from "@/lib/authz/policies";

/**
 * A grievance can never be closed with just a status flip — see docs/ACCESS_CONTROL_MATRIX.md and
 * the "no silent resolution" product requirement. A category, a note, and a citizen-communication
 * acknowledgement are all mandatory.
 */
export async function resolveGrievance(grievanceId: string, formData: FormData) {
  const { user } = await policyResolveGrievance(grievanceId);

  const resolutionCategory = String(formData.get("resolutionCategory") ?? "");
  const resolutionNote = String(formData.get("resolutionNote") ?? "").trim();
  const citizenCommunicationSent = formData.get("citizenCommunicationSent") === "on";

  if (!resolutionCategory || !resolutionNote) {
    throw new Error("A resolution category and note are required to close a grievance.");
  }
  if (!citizenCommunicationSent) {
    throw new Error("Confirm that the citizen has been notified before closing this grievance.");
  }

  await prisma.grievance.update({
    where: { id: grievanceId },
    data: { status: "resolved", resolvedAt: new Date(), resolutionCategory, resolutionNote, citizenCommunicationSent },
  });
  await logAudit({ actorUserId: user.id, entityType: "Grievance", entityId: grievanceId, action: "grievance.resolved" });
  revalidatePath("/ops/grievances");
}
