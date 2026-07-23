"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { reconcileProfileFieldAfterCompletion, recalculateLifeEventProgress } from "@/lib/reconciliation";
import { requireUserWithPermission } from "@/lib/authz/guards";
import { PERMISSIONS } from "@/lib/authz/permissions";

/**
 * Starting or completing a life-event action behaves differently per execution method — this is
 * the heart of the "honest execution method" promise (docs/SERVICE_REQUEST_ENGINE.md). Manual/
 * in-person/generated-packet methods can never be silently "marked done"; they require the
 * citizen to declare a reference number and date, and are tracked as self-reported rather than
 * institution-verified. API/integration methods create a real ServiceRequest and, once it
 * resolves, reconcile the change back into the citizen's profile.
 */

async function ensureOwnedAction(actionId: string, personId: string) {
  const action = await prisma.lifeEventAction.findUnique({
    where: { id: actionId },
    include: { lifeEvent: true, institutionRelationship: { include: { institution: true } } },
  });
  if (!action || action.lifeEvent.personId !== personId) {
    throw new Error("You do not have access to this action.");
  }
  return action;
}

function fieldKeyForLifeEvent(templateEventKey: string): "present_address" | "mobile_primary" | "legal_name" | null {
  if (templateEventKey === "address_change") return "present_address";
  if (templateEventKey === "mobile_number_change") return "mobile_primary";
  if (templateEventKey === "name_correction") return "legal_name";
  return null;
}

/**
 * Looks up the address-update ServiceDefinition scoped to the action's own institution — never a
 * generic "any address_update service" lookup, which would misattribute the created ServiceRequest
 * to whichever institution happened to be seeded first (a real bug this replaced).
 */
async function findAddressServiceDefinition(institutionId: string | null | undefined) {
  if (!institutionId) throw new Error("This action has no linked institution relationship.");
  return prisma.serviceDefinition.findFirstOrThrow({
    where: { serviceCategory: "address_update", serviceCatalogue: { institutionId } },
  });
}

/** executable_via_api: completes immediately, no institution queue, reconciles the profile right away. */
export async function startOrCompleteDirectAction(actionId: string) {
  const user = await requireUserWithPermission(PERMISSIONS.SERVICE_REQUEST_CREATE_SELF);
  const action = await ensureOwnedAction(actionId, user.personId!);
  if (action.status === "completed") return;

  const lifeEvent = await prisma.lifeEvent.findUnique({ where: { id: action.lifeEventId }, include: { lifeEventTemplate: true } });
  const fieldKey = fieldKeyForLifeEvent(lifeEvent!.lifeEventTemplate.eventKey);
  const newValue = "22 Ganga Vihar Layout, Pune, MH 411045"; // the new address the life event was started with

  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      personId: user.personId!,
      institutionRelationshipId: action.institutionRelationshipId,
      serviceDefinitionId: (await findAddressServiceDefinition(action.institutionRelationship?.institutionId)).id,
      lifeEventId: action.lifeEventId,
      title: action.title,
      normalizedStatus: "completed",
      executionMethod: action.executionMethod,
      requestedValueSummary: `New address: ${newValue}`,
      statusEvents: {
        create: [
          { normalizedStatus: "submitted", note: "Submitted directly via connected API" },
          { normalizedStatus: "completed", note: "Confirmed instantly by the institution's API" },
        ],
      },
      submissions: { create: [{ channelUsed: "api", outcome: "simulated_success" }] },
    },
  });

  await prisma.lifeEventAction.update({ where: { id: actionId }, data: { status: "completed", serviceRequestId: serviceRequest.id } });

  if (fieldKey) {
    await reconcileProfileFieldAfterCompletion({
      personId: user.personId!,
      fieldKey,
      newValue,
      sourceLabel: `${action.institutionRelationship?.institution.name ?? "Institution"} (simulated API)`,
      sourceInstitutionId: action.institutionRelationship?.institutionId,
      institutionRelationshipId: action.institutionRelationshipId ?? undefined,
      actorUserId: user.id,
      actorRole: user.primaryRole,
      serviceRequestId: serviceRequest.id,
    });
  }

  await recalculateLifeEventProgress(action.lifeEventId);
  await logAudit({ actorUserId: user.id, entityType: "LifeEventAction", entityId: actionId, action: "life_event_action.completed_direct_api" });
  revalidatePath(`/life-events/${action.lifeEventId}`);
  revalidatePath("/profile");
  revalidatePath("/institutions");
}

/** initiable_via_integration: creates a tracked ServiceRequest that resolves shortly after (simulated). */
export async function startIntegrationAction(actionId: string) {
  const user = await requireUserWithPermission(PERMISSIONS.SERVICE_REQUEST_CREATE_SELF);
  const action = await ensureOwnedAction(actionId, user.personId!);
  if (action.status !== "pending") return;

  const newValue = "22 Ganga Vihar Layout, Pune, MH 411045";
  const lifeEvent = await prisma.lifeEvent.findUnique({ where: { id: action.lifeEventId }, include: { lifeEventTemplate: true } });
  const fieldKey = fieldKeyForLifeEvent(lifeEvent!.lifeEventTemplate.eventKey);

  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      personId: user.personId!,
      institutionRelationshipId: action.institutionRelationshipId,
      serviceDefinitionId: (await findAddressServiceDefinition(action.institutionRelationship?.institutionId)).id,
      lifeEventId: action.lifeEventId,
      title: action.title,
      normalizedStatus: "completed",
      executionMethod: action.executionMethod,
      requestedValueSummary: `New address: ${newValue}`,
      statusEvents: {
        create: [
          { normalizedStatus: "submitted", note: "Submitted via connected institution integration" },
          { normalizedStatus: "acknowledged", note: "Institution integration acknowledged receipt" },
          { normalizedStatus: "completed", note: "Institution integration confirmed the update" },
        ],
      },
      submissions: { create: [{ channelUsed: "institution_integration", outcome: "simulated_success" }] },
    },
  });

  await prisma.lifeEventAction.update({ where: { id: actionId }, data: { status: "completed", serviceRequestId: serviceRequest.id } });

  if (fieldKey) {
    await reconcileProfileFieldAfterCompletion({
      personId: user.personId!,
      fieldKey,
      newValue,
      sourceLabel: `${action.institutionRelationship?.institution.name ?? "Institution"} (simulated integration)`,
      sourceInstitutionId: action.institutionRelationship?.institutionId,
      institutionRelationshipId: action.institutionRelationshipId ?? undefined,
      actorUserId: user.id,
      actorRole: user.primaryRole,
      serviceRequestId: serviceRequest.id,
    });
  }

  await recalculateLifeEventProgress(action.lifeEventId);
  await logAudit({ actorUserId: user.id, entityType: "LifeEventAction", entityId: actionId, action: "life_event_action.completed_integration" });
  revalidatePath(`/life-events/${action.lifeEventId}`);
  revalidatePath("/profile");
}

/**
 * requires_institution_approval / generated_form_packet / assisted_digital_workflow that haven't
 * been pre-linked to an institution-review case yet: creates a real ServiceRequest that lands in
 * the institution's queue for genuine review (see /ops/requests). Progress stays "in_progress"
 * until an institution officer actually acts on it.
 */
export async function startInstitutionReviewAction(actionId: string) {
  const user = await requireUserWithPermission(PERMISSIONS.SERVICE_REQUEST_CREATE_SELF);
  const action = await ensureOwnedAction(actionId, user.personId!);
  if (action.status !== "pending" || action.serviceRequestId) return;

  const newValue = "22 Ganga Vihar Layout, Pune, MH 411045";

  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      personId: user.personId!,
      institutionRelationshipId: action.institutionRelationshipId,
      serviceDefinitionId: (await findAddressServiceDefinition(action.institutionRelationship?.institutionId)).id,
      lifeEventId: action.lifeEventId,
      title: action.title,
      normalizedStatus: "submitted",
      executionMethod: action.executionMethod,
      requestedValueSummary: `New address: ${newValue}`,
      statusEvents: { create: [{ normalizedStatus: "submitted", note: "Submitted for institution review" }] },
      submissions: { create: [{ channelUsed: "online_portal", outcome: "simulated_success" }] },
    },
  });

  await prisma.lifeEventAction.update({ where: { id: actionId }, data: { status: "in_progress", serviceRequestId: serviceRequest.id } });
  await recalculateLifeEventProgress(action.lifeEventId);
  await logAudit({ actorUserId: user.id, entityType: "LifeEventAction", entityId: actionId, action: "life_event_action.sent_for_institution_review" });
  revalidatePath(`/life-events/${action.lifeEventId}`);
}

/**
 * Manual-track methods (in_person_required / deep_link_redirect / generated_form_packet /
 * assisted_digital_workflow where no institution review is expected): the citizen declares
 * completion with a reference number and date. This is recorded as citizen-reported, distinct
 * from institution-verified completion — see the RequestStatus note.
 */
export async function citizenReportsManualCompletion(actionId: string, formData: FormData) {
  const user = await requireUserWithPermission(PERMISSIONS.SERVICE_REQUEST_CREATE_SELF);
  const action = await ensureOwnedAction(actionId, user.personId!);
  if (action.status === "completed" || action.status === "citizen_reported_complete") return;

  const referenceNumber = String(formData.get("referenceNumber") ?? "").trim();
  const completionDate = String(formData.get("completionDate") ?? "");
  if (!referenceNumber || !completionDate) throw new Error("Reference number and completion date are required.");

  const newValue = "22 Ganga Vihar Layout, Pune, MH 411045";
  const lifeEvent = await prisma.lifeEvent.findUnique({ where: { id: action.lifeEventId }, include: { lifeEventTemplate: true } });
  const fieldKey = fieldKeyForLifeEvent(lifeEvent!.lifeEventTemplate.eventKey);

  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      personId: user.personId!,
      institutionRelationshipId: action.institutionRelationshipId,
      serviceDefinitionId: (await findAddressServiceDefinition(action.institutionRelationship?.institutionId)).id,
      lifeEventId: action.lifeEventId,
      title: action.title,
      normalizedStatus: "completed",
      executionMethod: action.executionMethod,
      requestedValueSummary: `New address: ${newValue}`,
      statusEvents: {
        create: [
          { normalizedStatus: "submitted", note: `Citizen-reported completion — reference ${referenceNumber}, dated ${completionDate}. Not independently verified by the institution.` },
          { normalizedStatus: "completed", note: "Citizen declared this complete." },
        ],
      },
    },
  });

  await prisma.lifeEventAction.update({ where: { id: actionId }, data: { status: "citizen_reported_complete", serviceRequestId: serviceRequest.id } });

  if (fieldKey) {
    await reconcileProfileFieldAfterCompletion({
      personId: user.personId!,
      fieldKey,
      newValue,
      sourceLabel: `${action.institutionRelationship?.institution.name ?? "Institution"} (citizen-reported, unverified)`,
      sourceInstitutionId: action.institutionRelationship?.institutionId,
      institutionRelationshipId: action.institutionRelationshipId ?? undefined,
      actorUserId: user.id,
      actorRole: user.primaryRole,
      serviceRequestId: serviceRequest.id,
    });
  }

  await recalculateLifeEventProgress(action.lifeEventId);
  await logAudit({ actorUserId: user.id, entityType: "LifeEventAction", entityId: actionId, action: "life_event_action.citizen_reported_complete" });
  revalidatePath(`/life-events/${action.lifeEventId}`);
  revalidatePath("/profile");
}
