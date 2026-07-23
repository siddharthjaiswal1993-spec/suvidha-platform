import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Financial Administration" };

export default async function FinancialPage() {
  const user = await getCurrentUser();
  const personId = user!.personId!;

  const [assets, liabilities, taxRelationship] = await Promise.all([
    prisma.asset.findMany({ where: { holdings: { some: { personId } }, deletedAt: null }, include: { institution: true, nominations: true, institutionRelationship: true } }),
    prisma.liability.findMany({ where: { personId, deletedAt: null } }),
    prisma.institutionRelationship.findFirst({ where: { personId, relationshipType: "government_identity", institution: { category: "tax_authority" } } }),
  ]);

  const nominationCoverage = assets.length === 0 ? 0 : Math.round((assets.filter((a) => a.nominations.length > 0).length / assets.length) * 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Financial Administration</h1>
        <p className="mt-1 text-muted-foreground">An administrative view — Suvidha tracks these relationships, it never holds or moves your money.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Financial holdings tracked</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{assets.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Nomination coverage</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{nominationCoverage}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Liabilities tracked</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{liabilities.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Holdings</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {assets.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
              <div><p className="font-medium">{a.label}</p><p className="text-xs text-muted-foreground">{a.institution?.name} · {a.category.replaceAll("_", " ")}</p></div>
              {a.nominations.length > 0 ? (
                <Badge variant="success">Nominee on file</Badge>
              ) : a.institutionRelationship ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/requests/new?institutionRelationshipId=${a.institutionRelationship.id}&serviceCategory=nominee_update`}>Add nominee</Link>
                </Button>
              ) : (
                <Badge variant="warning">No nominee</Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Liabilities</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {liabilities.length === 0 && <p className="text-sm text-muted-foreground">None on file.</p>}
          {liabilities.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
              <span>{l.label}</span><span className="text-muted-foreground">{l.outstandingAmountBand}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {taxRelationship && (
        <Card>
          <CardHeader><CardTitle className="text-base">Tax profile</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{taxRelationship.label} — last synced {taxRelationship.lastSyncedAt ? formatDate(taxRelationship.lastSyncedAt) : "never"}.</p>
            <p className="mt-1">Check your Inbox for any active notices from the Income Tax Department.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
