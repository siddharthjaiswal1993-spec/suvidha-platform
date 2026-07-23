"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

const DOCUMENT_CATEGORIES = ["identity", "address", "tax", "banking", "investments", "insurance", "employment", "education", "property", "vehicle", "health", "business", "family", "legal", "estate"] as const;

/**
 * Simulated upload — no real file bytes are stored anywhere in this prototype (see
 * docs/DOCUMENT_AND_EVIDENCE_MODEL.md). The citizen supplies a label and category; Suvidha
 * records a LegalDocument + DocumentProfile as if a scan had been received and self-attested.
 */
export async function uploadDocument(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.personId) throw new Error("Not authenticated as a citizen.");

  const fileLabel = String(formData.get("fileLabel") || "").trim();
  const documentType = String(formData.get("documentType") || "other").trim();
  const documentCategory = String(formData.get("documentCategory") || "legal").trim();
  const issuer = String(formData.get("issuer") || "").trim() || null;
  const expiryDateRaw = String(formData.get("expiryDate") || "").trim();
  if (!fileLabel) throw new Error("A document label is required.");
  if (!DOCUMENT_CATEGORIES.includes(documentCategory as (typeof DOCUMENT_CATEGORIES)[number])) throw new Error("Invalid document category.");

  const doc = await prisma.legalDocument.create({
    data: {
      ownerPersonId: user.personId,
      documentType,
      fileLabel,
      isDemoDocument: true,
      documentProfile: {
        create: {
          documentCategory,
          issuer,
          issueDate: new Date(),
          expiryDate: expiryDateRaw ? new Date(expiryDateRaw) : null,
          digitalSignatureStatus: "self_attestation_simulated",
          ...(expiryDateRaw ? { renewals: { create: [{ dueDate: new Date(expiryDateRaw), status: "upcoming" }] } } : {}),
        },
      },
      verifications: { create: [{ outcome: "pending", notes: "Self-uploaded — awaiting simulated verification." }] },
    },
  });

  await logAudit({ actorUserId: user.id, entityType: "LegalDocument", entityId: doc.id, action: "document.uploaded" });
  revalidatePath("/documents");
  redirect(`/documents/${doc.id}`);
}

export async function shareDocument(documentProfileId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.personId) throw new Error("Not authenticated as a citizen.");

  const profile = await prisma.documentProfile.findUnique({ where: { id: documentProfileId }, include: { legalDocument: true } });
  if (!profile || profile.legalDocument.ownerPersonId !== user.personId) throw new Error("Document not found.");

  const sharedWithLabel = String(formData.get("sharedWithLabel") || "").trim();
  const purpose = String(formData.get("purpose") || "").trim();
  if (!sharedWithLabel || !purpose) throw new Error("Recipient and purpose are required.");

  await prisma.documentShare.create({ data: { documentProfileId, sharedWithLabel, purpose } });
  await logAudit({ actorUserId: user.id, entityType: "DocumentProfile", entityId: documentProfileId, action: "document.shared", metadata: { sharedWithLabel, purpose } });
  revalidatePath(`/documents/${profile.legalDocumentId}`);
}

export async function revokeDocumentShare(shareId: string, legalDocumentId: string) {
  const user = await getCurrentUser();
  if (!user?.personId) throw new Error("Not authenticated as a citizen.");

  const share = await prisma.documentShare.findUnique({ where: { id: shareId }, include: { documentProfile: { include: { legalDocument: true } } } });
  if (!share || share.documentProfile.legalDocument.ownerPersonId !== user.personId) throw new Error("Share not found.");

  await prisma.documentShare.update({ where: { id: shareId }, data: { revokedAt: new Date() } });
  await logAudit({ actorUserId: user.id, entityType: "DocumentShare", entityId: shareId, action: "document_share.revoked" });
  revalidatePath(`/documents/${legalDocumentId}`);
}

export async function deleteDocument(documentId: string) {
  const user = await getCurrentUser();
  if (!user?.personId) throw new Error("Not authenticated as a citizen.");

  const doc = await prisma.legalDocument.findUnique({ where: { id: documentId } });
  if (!doc || doc.ownerPersonId !== user.personId) throw new Error("Document not found.");

  await prisma.legalDocument.update({ where: { id: documentId }, data: { deletedAt: new Date() } });
  await logAudit({ actorUserId: user.id, entityType: "LegalDocument", entityId: documentId, action: "document.deleted" });
  revalidatePath("/documents");
  redirect("/documents");
}
