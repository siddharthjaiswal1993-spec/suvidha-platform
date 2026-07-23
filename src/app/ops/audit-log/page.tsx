import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Audit log" };

export default async function AuditLogPage() {
  const events = await prisma.auditEvent.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="mt-1 text-muted-foreground">Append-only. No sensitive raw identifiers are ever logged — see docs/SECURITY.md.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow><TableHead>When</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Entity</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</TableCell>
                  <TableCell>{e.actor?.displayName ?? "System"}</TableCell>
                  <TableCell><Badge variant="outline">{e.action}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.entityType} · {e.entityId.slice(0, 8)}…</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {events.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No audit events recorded yet — perform some actions in the app to populate this log.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
