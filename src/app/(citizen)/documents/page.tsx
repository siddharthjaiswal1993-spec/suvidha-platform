import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DemoDataBadge } from "@/components/domain/demo-data-badge";
import { formatDate, daysUntil } from "@/lib/utils";
import { FileText } from "lucide-react";

export const metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  const documents = await prisma.legalDocument.findMany({
    where: { ownerPersonId: user!.personId!, deletedAt: null },
    include: { documentProfile: { include: { renewals: true } } },
    orderBy: { uploadedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="mt-1 text-muted-foreground">Every document Suvidha can reuse on your behalf, with its verification and expiry status.</p>
        </div>
        <DemoDataBadge label="Synthetic documents — no real files stored" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {documents.map((doc) => {
          const renewal = doc.documentProfile?.renewals[0];
          const daysLeft = renewal ? daysUntil(renewal.dueDate) : null;
          return (
            <Card key={doc.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" /> {doc.fileLabel}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Type: {doc.documentType.replaceAll("_", " ")}</p>
                {doc.documentProfile?.issuer && <p>Issuer: {doc.documentProfile.issuer}</p>}
                {doc.documentProfile?.documentCategory && <Badge variant="outline">{doc.documentProfile.documentCategory}</Badge>}
                {renewal && (
                  <p className={daysLeft !== null && daysLeft < 60 ? "font-medium text-warning" : ""}>
                    {renewal.status === "overdue" ? "Expired" : `Expires ${formatDate(renewal.dueDate)}`}
                    {daysLeft !== null && daysLeft >= 0 ? ` (${daysLeft} days)` : ""}
                  </p>
                )}
                <p className="text-xs">Uploaded {formatDate(doc.uploadedAt)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
