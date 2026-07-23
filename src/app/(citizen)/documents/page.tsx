import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadDocument } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DemoDataBadge } from "@/components/domain/demo-data-badge";
import { EmptyState } from "@/components/domain/empty-state";
import { formatDate, daysUntil } from "@/lib/utils";
import { FileText, Upload } from "lucide-react";

export const metadata = { title: "Documents" };

const CATEGORIES = ["identity", "address", "tax", "banking", "investments", "insurance", "employment", "education", "property", "vehicle", "health", "business", "family", "legal", "estate"];

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  const documents = await prisma.legalDocument.findMany({
    where: { ownerPersonId: user!.personId!, deletedAt: null },
    include: { documentProfile: { include: { renewals: true, shares: true } } },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="mt-1 text-muted-foreground">Every document Suvidha can reuse on your behalf, with its verification, expiry, and sharing status.</p>
        </div>
        <DemoDataBadge label="Synthetic documents — no real files stored" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Upload className="h-4 w-4 text-primary" /> Add a document</CardTitle>
          <CardDescription>Simulated upload — Suvidha records the metadata as if a scan had been received.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={uploadDocument} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fileLabel" className="text-xs">Label</Label>
              <Input id="fileLabel" name="fileLabel" placeholder="e.g. Updated PAN card" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="documentType" className="text-xs">Document type</Label>
              <Input id="documentType" name="documentType" placeholder="e.g. pan_card" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="documentCategory" className="text-xs">Category</Label>
              <Select name="documentCategory" defaultValue="identity">
                <SelectTrigger id="documentCategory"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issuer" className="text-xs">Issuer (optional)</Label>
              <Input id="issuer" name="issuer" placeholder="e.g. Income Tax Department" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="expiryDate" className="text-xs">Expiry date (optional)</Label>
              <Input id="expiryDate" name="expiryDate" type="date" />
            </div>
            <Button type="submit" size="sm" className="sm:col-span-2">Add document</Button>
          </form>
        </CardContent>
      </Card>

      {documents.length === 0 ? (
        <EmptyState title="No documents yet" description="Add your first document above, or reuse one from a service request." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {documents.map((doc) => {
            const renewal = doc.documentProfile?.renewals[0];
            const daysLeft = renewal ? daysUntil(renewal.dueDate) : null;
            const activeShares = doc.documentProfile?.shares.filter((s) => !s.revokedAt).length ?? 0;
            return (
              <Link key={doc.id} href={`/documents/${doc.id}`}>
                <Card className="h-full transition-colors hover:bg-muted/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-primary" /> {doc.fileLabel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Type: {doc.documentType.replaceAll("_", " ")}</p>
                    {doc.documentProfile?.issuer && <p>Issuer: {doc.documentProfile.issuer}</p>}
                    <div className="flex flex-wrap gap-1">
                      {doc.documentProfile?.documentCategory && <Badge variant="outline">{doc.documentProfile.documentCategory}</Badge>}
                      {activeShares > 0 && <Badge variant="secondary">Shared with {activeShares}</Badge>}
                    </div>
                    {renewal && (
                      <p className={daysLeft !== null && daysLeft < 60 ? "font-medium text-warning" : ""}>
                        {renewal.status === "overdue" ? "Expired" : `Expires ${formatDate(renewal.dueDate)}`}
                        {daysLeft !== null && daysLeft >= 0 ? ` (${daysLeft} days)` : ""}
                      </p>
                    )}
                    <p className="text-xs">Uploaded {formatDate(doc.uploadedAt)}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
