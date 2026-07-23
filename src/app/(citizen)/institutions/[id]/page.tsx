import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function InstitutionRelationshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const relationship = await prisma.institutionRelationship.findUnique({
    where: { id },
    include: { institution: true, connector: true, syncRuns: { orderBy: { startedAt: "desc" } }, serviceRequests: true, deadlines: true },
  });
  if (!relationship) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground"><Link href="/institutions" className="underline">My Institutions</Link> / {relationship.institution.name}</p>
        <h1 className="mt-1 text-2xl font-semibold">{relationship.label}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant={relationship.status === "active" ? "success" : "outline"}>{relationship.status}</Badge>
          <Badge variant="outline">{relationship.verificationStatus.replaceAll("_", " ")}</Badge>
          {relationship.connector && <Badge variant="secondary">{relationship.connector.integrationLabel.replaceAll("_", " ")}</Badge>}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div><p className="text-muted-foreground">Reference number</p><p className="font-mono">{relationship.referenceNumberMasked ?? "—"}</p></div>
          <div><p className="text-muted-foreground">Registered nominee</p><p>{relationship.registeredNomineeSummary ?? "No nominee on record"}</p></div>
          <div><p className="text-muted-foreground">Registered address on file</p><p>{relationship.registeredAddressSnapshot ?? "—"}</p></div>
          <div><p className="text-muted-foreground">Renewal due</p><p>{relationship.renewalDueAt ? formatDate(relationship.renewalDueAt) : "—"}</p></div>
          <div><p className="text-muted-foreground">Last synced</p><p>{relationship.lastSyncedAt ? formatDateTime(relationship.lastSyncedAt) : "Never"}</p></div>
        </CardContent>
      </Card>

      {relationship.syncRuns.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Sync history</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {relationship.syncRuns.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <span>{formatDateTime(s.startedAt)}</span>
                <Badge variant={s.status === "success" ? "success" : s.status === "partial_failure" ? "warning" : "destructive"}>{s.status.replaceAll("_", " ")}</Badge>
                {s.failureReason && <span className="text-xs text-muted-foreground">{s.failureReason}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button asChild><Link href="/requests">Start a request for this institution</Link></Button>
        {!relationship.registeredNomineeSummary || relationship.registeredNomineeSummary === "No nominee on record" ? (
          <Button asChild variant="outline"><Link href="/requests">Add a nominee</Link></Button>
        ) : null}
      </div>
    </div>
  );
}
