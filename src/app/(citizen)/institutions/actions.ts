"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

const RELATIONSHIP_TYPE_BY_CATEGORY: Record<string, string> = {
  bank: "financial_account",
  insurer: "financial_account",
  investment_provider: "financial_account",
  depository: "financial_account",
  pension_body: "financial_account",
  utility: "utility",
  telecom: "utility",
  employer: "employer",
  government_identity: "government_identity",
  licence_authority: "government_licence",
  tax_authority: "government_identity",
};

/**
 * Simulated discovery — this prototype has no real connector to any institution (see
 * docs/INTEGRATIONS.md). "Connecting" creates the relationship as `under_verification` /
 * `unverified` first, matching how a real identity-matched connection would actually start,
 * then a citizen-triggered "Confirm" step flips it to `verified` — modelling the two-step
 * reality honestly instead of an instant, unexplained "verified" badge.
 */
export async function connectInstitution(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.personId) throw new Error("Not authenticated as a citizen.");

  const institutionId = String(formData.get("institutionId") || "");
  const label = String(formData.get("label") || "").trim();
  if (!institutionId || !label) throw new Error("Institution and a label are required.");

  const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
  if (!institution) throw new Error("Institution not found.");

  const existing = await prisma.institutionRelationship.findFirst({ where: { personId: user.personId, institutionId } });
  if (existing) throw new Error("You already have a relationship with this institution.");

  const relationship = await prisma.institutionRelationship.create({
    data: {
      personId: user.personId,
      institutionId,
      relationshipType: RELATIONSHIP_TYPE_BY_CATEGORY[institution.category] ?? "business",
      label,
      status: "under_verification",
      verificationStatus: "unverified",
    },
  });

  await logAudit({ actorUserId: user.id, entityType: "InstitutionRelationship", entityId: relationship.id, action: "institution_relationship.connect_started" });
  revalidatePath("/institutions");
  return relationship.id;
}

export async function confirmInstitutionVerification(relationshipId: string) {
  const user = await getCurrentUser();
  if (!user?.personId) throw new Error("Not authenticated as a citizen.");

  const relationship = await prisma.institutionRelationship.findUnique({ where: { id: relationshipId } });
  if (!relationship || relationship.personId !== user.personId) throw new Error("Relationship not found.");

  await prisma.institutionRelationship.update({
    where: { id: relationshipId },
    data: { status: "active", verificationStatus: "verified", lastSyncedAt: new Date() },
  });
  await prisma.sourceSync.create({ data: { institutionRelationshipId: relationshipId, status: "success", completedAt: new Date(), recordsSynced: 1 } });

  await logAudit({ actorUserId: user.id, entityType: "InstitutionRelationship", entityId: relationshipId, action: "institution_relationship.verified" });
  revalidatePath("/institutions");
  revalidatePath(`/institutions/${relationshipId}`);
}
