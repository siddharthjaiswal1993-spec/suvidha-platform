import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { shareDocument, revokeDocumentShare, deleteDocument } from "../actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatDateTime, daysUntil } from "@/lib/utils";
import { FileText, ShieldCheck, Share2 } from "lucide-react";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const doc = await prisma.legalDocument.findUnique({
    where: { id },
    include: {
      documentProfile: { include: { shares: { orderBy: { sharedAt: "desc" } }, renewals: true } },
      verifications: { orderBy: { verifiedAt: "desc" } },
      submittedEvidence: true,
    },
  });
  if (!doc || doc.ownerPersonId !== user?.personId || doc.deletedAt) notFound();

  const renewal = doc.documentProfile?.renewals[0];
  const daysLeft = renewal ? daysUntil(renewal.dueDate) : null;

  async function share(formData: FormData) {
    "use server";
    await shareDocument(doc!.documentProfile!.id, formData);
  }
  async function revoke(shareId: string) {
    "use server";
    await revokeDocumentShare(shareId, id);
  }
  async function remove() {
    "use server";
    await deleteDocument(id);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-sm text-muted-foreground"><Link href="/documents" className="underline">Documents</Link> / {doc.fileLabel}</p>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><FileText className="h-5 w-5 text-primary" /> {doc.fileLabel}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Type: {doc.documentType.replaceAll("_", " ")} · Uploaded {formatDate(doc.uploadedAt)}</p>
        </div>
        {doc.documentProfile?.documentCategory && <Badge variant="outline" className="capitalize">{doc.documentProfile.documentCategory}</Badge>}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>Issuer: {doc.documentProfile?.issuer ?? "Not recorded"}</p>
          <p>Issue date: {doc.documentProfile?.issueDate ? formatDate(doc.documentProfile.issueDate) : "Not recorded"}</p>
          <p>Signature status: {doc.documentProfile?.digitalSignatureStatus?.replaceAll("_", " ") ?? "—"}</p>
          {renewal && (
            <p className={daysLeft !== null && daysLeft < 60 ? "font-medium text-warning" : ""}>
              {renewal.status === "overdue" ? "Expired" : `Expires ${formatDate(renewal.dueDate)}`}
              {daysLeft !== null && daysLeft >= 0 ? ` (${daysLeft} days)` : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {renewal && (renewal.status === "upcoming" || renewal.status === "overdue") && (
        <Card className="border-warning/40">
          <CardContent className="flex items-center justify-between pt-6 text-sm">
            <p>This document {renewal.status === "overdue" ? "has expired" : "is expiring soon"} — you can start a renewal request.</p>
            <Button asChild size="sm" variant="outline"><Link href={`/requests/new?serviceCategory=${doc.documentProfile?.documentCategory === "address" ? "address_update" : "name_correction"}`}>Start renewal</Link></Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-primary" /> Verification history</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {doc.verifications.length === 0 && <p className="text-sm text-muted-foreground">No verification events yet.</p>}
          {doc.verifications.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
              <div>
                <Badge variant={v.outcome === "verified" ? "success" : v.outcome === "rejected" ? "destructive" : "outline"}>{v.outcome.replaceAll("_", " ")}</Badge>
                {v.notes && <p className="mt-1 text-xs text-muted-foreground">{v.notes}</p>}
              </div>
              <p className="text-xs text-muted-foreground">{formatDateTime(v.verifiedAt)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {doc.submittedEvidence.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Reused as evidence on</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {doc.submittedEvidence.map((e) => (
              <p key={e.id} className="text-muted-foreground">{e.evidenceLabel} — {formatDate(e.createdAt)}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {doc.documentProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Share2 className="h-4 w-4 text-primary" /> Sharing</CardTitle>
            <CardDescription>Every share is logged here — nothing leaves silently.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {doc.documentProfile.shares.length === 0 && <p className="text-sm text-muted-foreground">Not shared with anyone yet.</p>}
              {doc.documentProfile.shares.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                  <div>
                    <p className="font-medium">{s.sharedWithLabel}</p>
                    <p className="text-xs text-muted-foreground">{s.purpose} · shared {formatDate(s.sharedAt)}</p>
                  </div>
                  {s.revokedAt ? (
                    <Badge variant="outline">Revoked {formatDate(s.revokedAt)}</Badge>
                  ) : (
                    <form action={revoke.bind(null, s.id)}><Button type="submit" size="sm" variant="outline">Revoke</Button></form>
                  )}
                </div>
              ))}
            </div>
            <form action={share} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="sharedWithLabel" className="text-xs">Share with</Label>
                <Input id="sharedWithLabel" name="sharedWithLabel" placeholder="e.g. Ashoka National Bank" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="purpose" className="text-xs">Purpose</Label>
                <Input id="purpose" name="purpose" placeholder="e.g. KYC re-verification" required />
              </div>
              <Button type="submit" size="sm" variant="outline">Share</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <form action={remove}>
        <Button type="submit" size="sm" variant="outline" className="text-destructive">Delete document</Button>
      </form>
    </div>
  );
}
