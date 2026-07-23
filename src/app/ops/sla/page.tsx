import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "SLA dashboard" };

export default async function SlaDashboardPage() {
  const user = await getCurrentUser();
  const [slas, claims] = await Promise.all([
    prisma.sLA.findMany({ where: user?.institutionId ? { institutionId: user.institutionId } : {} }),
    prisma.claim.findMany({ where: user?.institutionId ? { institutionId: user.institutionId } : {} }),
  ]);

  const settled = claims.filter((c) => c.status === "settled" || c.status === "approved").length;
  const strTrRate = claims.length ? Math.round((settled / claims.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">SLA dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total claims</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{claims.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Straight-through / settled</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{strTrRate}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Deficiency-pending</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{claims.filter((c) => c.status === "deficiency_pending").length}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Published SLA targets</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Process</TableHead><TableHead>Target (days)</TableHead></TableRow></TableHeader>
            <TableBody>
              {slas.map((s) => (
                <TableRow key={s.id}><TableCell className="capitalize">{s.processType.replaceAll("_", " ")}</TableCell><TableCell><Badge variant="outline">{s.targetDays} days</Badge></TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
