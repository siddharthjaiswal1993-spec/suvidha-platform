"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { policyRecordClaimDecision } from "@/lib/authz/policies";
import { requireUserWithPermission } from "@/lib/authz/guards";
import { getTenantClaim } from "@/lib/authz/resource-access";
import { PERMISSIONS } from "@/lib/authz/permissions";

export async function recordDecision(claimId: string, formData: FormData) {
  const makerCheckerRole = String(formData.get("makerCheckerRole")) as "maker" | "checker" | "adjudicator";
  const outcome = String(formData.get("outcome"));
  const rationale = String(formData.get("rationale") ?? "");

  const { user } = await policyRecordClaimDecision({ claimId, makerCheckerRole, outcome });

  await prisma.decision.create({
    data: { claimId, decidedByUserId: user.id, makerCheckerRole, outcome, rationale },
  });

  if (outcome === "approve") {
    await prisma.claim.update({ where: { id: claimId }, data: { status: "approved" } });
  } else if (outcome === "reject") {
    await prisma.claim.update({ where: { id: claimId }, data: { status: "rejected" } });
  } else if (outcome === "escalate") {
    await prisma.claim.update({ where: { id: claimId }, data: { status: "escalated" } });
  }

  await logAudit({ actorUserId: user.id, actorRole: user.primaryRole, entityType: "Claim", entityId: claimId, action: `claim.decision.${outcome}`, claimId });
  revalidatePath(`/ops/claims/${claimId}`);
}

export async function raiseDeficiency(claimId: string, formData: FormData) {
  const user = await requireUserWithPermission(PERMISSIONS.CLAIM_REQUEST_DEFICIENCY);
  await getTenantClaim(claimId, user.institutionId);

  const title = String(formData.get("title"));
  const description = String(formData.get("description"));

  await prisma.deficiencyRequest.create({ data: { claimId, title, description, status: "open" } });
  await prisma.claim.update({ where: { id: claimId }, data: { status: "deficiency_pending" } });

  await logAudit({ actorUserId: user.id, entityType: "DeficiencyRequest", entityId: claimId, action: "deficiency_request.raised", claimId });
  revalidatePath(`/ops/claims/${claimId}`);
}

export async function recordPayoutAndClose(claimId: string, formData: FormData) {
  const user = await requireUserWithPermission(PERMISSIONS.PAYOUT_RECORD);
  const claim = await getTenantClaim(claimId, user.institutionId);
  if (claim.status !== "approved") throw new Error('A payout can only be recorded after the claim has been "approved".');

  const amountBand = String(formData.get("amountBand"));

  await prisma.payment.create({
    data: { claimId, purpose: "claim_settlement", amountBand, method: "bank_transfer_simulated", status: "processed", processedAt: new Date() },
  });
  await prisma.claim.update({ where: { id: claimId }, data: { status: "settled" } });
  await prisma.recordUpdate.create({ data: { claimId, updateType: "account_closure", summary: "Claim settled and case closed." } });

  await logAudit({ actorUserId: user.id, entityType: "Claim", entityId: claimId, action: "claim.settled_and_closed", claimId });
  revalidatePath(`/ops/claims/${claimId}`);
}
