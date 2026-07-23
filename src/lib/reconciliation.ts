import "server-only";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

/**
 * Maps a ServiceDefinition.serviceCategory to the CitizenProfile field it changes, and the
 * "New X: " prefix used in ServiceRequest.requestedValueSummary so the raw citizen-entered value
 * can be extracted at completion time. Shared between the life-event actions (category derived
 * from the life-event template) and the general ops/requests completion action (category derived
 * from the request's own ServiceDefinition), so both paths reconcile identically instead of one
 * hardcoding "present_address" regardless of what was actually requested.
 */
export const SERVICE_CATEGORY_FIELD_MAP: Record<string, { fieldKey: "present_address" | "mobile_primary" | "legal_name"; prefix: string }> = {
  address_update: { fieldKey: "present_address", prefix: "New address:" },
  mobile_update: { fieldKey: "mobile_primary", prefix: "New mobile number:" },
  name_correction: { fieldKey: "legal_name", prefix: "New legal name:" },
};

export function parseRequestedValue(serviceCategory: string, requestedValueSummary: string | null): { fieldKey: "present_address" | "mobile_primary" | "legal_name"; newValue: string } | null {
  const mapping = SERVICE_CATEGORY_FIELD_MAP[serviceCategory];
  if (!mapping || !requestedValueSummary) return null;
  const prefixPattern = new RegExp(`^${mapping.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i");
  if (!prefixPattern.test(requestedValueSummary)) return null;
  const newValue = requestedValueSummary.replace(prefixPattern, "").trim();
  if (!newValue) return null;
  return { fieldKey: mapping.fieldKey, newValue };
}

/**
 * Runs once a ServiceRequest that changes a profile field (currently: present_address) reaches a
 * genuinely completed state — either institution-confirmed or citizen-self-reported. This is what
 * makes the platform feel like "one connected product" rather than a form that vanishes into a
 * queue: the source-of-truth institution relationship snapshot updates, a new profile field value
 * is recorded, any open discrepancy involving the old value is resolved, and the whole thing is
 * auditable. See docs/SERVICE_REQUEST_ENGINE.md and docs/LIFE_EVENT_ORCHESTRATION.md.
 */
export async function reconcileProfileFieldAfterCompletion(input: {
  personId: string;
  fieldKey: "present_address" | "mobile_primary" | "legal_name";
  newValue: string;
  sourceLabel: string;
  sourceInstitutionId?: string;
  institutionRelationshipId?: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  serviceRequestId?: string;
}) {
  const citizenProfile = await prisma.citizenProfile.findUnique({ where: { personId: input.personId } });
  if (!citizenProfile) return;

  const field = await prisma.profileField.findUnique({ where: { fieldKey: input.fieldKey } });
  if (!field) return;

  const priorValues = await prisma.profileFieldValue.findMany({
    where: { citizenProfileId: citizenProfile.id, profileFieldId: field.id, isCurrentForSource: true, sourceInstitutionId: input.sourceInstitutionId ?? undefined },
  });
  for (const prior of priorValues) {
    await prisma.profileFieldValue.update({ where: { id: prior.id }, data: { isCurrentForSource: false } });
  }

  const newFieldValue = await prisma.profileFieldValue.create({
    data: {
      citizenProfileId: citizenProfile.id,
      profileFieldId: field.id,
      value: input.newValue,
      provenance: "verified_by_source",
      sourceLabel: input.sourceLabel,
      sourceInstitutionId: input.sourceInstitutionId,
      isCurrentForSource: true,
      lastVerifiedAt: new Date(),
    },
  });

  const openConflicts = await prisma.profileConflict.findMany({
    where: {
      citizenProfileId: citizenProfile.id,
      profileFieldId: field.id,
      status: "open",
      OR: priorValues.map((p) => ({ OR: [{ primaryValueId: p.id }, { alternateValueId: p.id }] })),
    },
  });
  for (const conflict of openConflicts) {
    await prisma.profileConflict.update({ where: { id: conflict.id }, data: { status: "resolved_via_correction_request", resolvedAt: new Date() } });
  }

  if (input.institutionRelationshipId) {
    await prisma.institutionRelationship.update({
      where: { id: input.institutionRelationshipId },
      data: {
        registeredAddressSnapshot: input.fieldKey === "present_address" ? input.newValue : undefined,
        lastSyncedAt: new Date(),
      },
    });
  }

  await logAudit({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    entityType: "ProfileFieldValue",
    entityId: newFieldValue.id,
    action: "profile_field.reconciled",
    metadata: { fieldKey: input.fieldKey, sourceLabel: input.sourceLabel, serviceRequestId: input.serviceRequestId },
  });

  return newFieldValue;
}

/** Recomputes a LifeEvent's progressPercent and status from its actions' actual states. */
export async function recalculateLifeEventProgress(lifeEventId: string) {
  const actions = await prisma.lifeEventAction.findMany({ where: { lifeEventId } });
  if (actions.length === 0) return;

  const doneCount = actions.filter((a) => a.status === "completed" || a.status === "citizen_reported_complete" || a.status === "skipped").length;
  const progressPercent = Math.round((doneCount / actions.length) * 100);
  const allDone = doneCount === actions.length;

  await prisma.lifeEvent.update({
    where: { id: lifeEventId },
    data: {
      progressPercent,
      status: allDone ? "completed" : "in_progress",
      completedAt: allDone ? new Date() : null,
    },
  });
}
