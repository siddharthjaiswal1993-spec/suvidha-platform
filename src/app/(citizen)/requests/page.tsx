import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExecutionMethodBadge } from "@/components/domain/execution-method-badge";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

export const metadata = { title: "Requests" };

export default async function RequestsPage() {
  const user = await getCurrentUser();
  const requests = await prisma.serviceRequest.findMany({
    where: { personId: user!.personId! },
    include: { serviceDefinition: true, application: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Requests</h1>
          <p className="mt-1 text-muted-foreground">Every request you&apos;ve started, across every institution, in one place.</p>
        </div>
        <Button asChild><Link href="/requests/new"><Plus className="mr-1 h-4 w-4" />New request</Link></Button>
      </div>

      <div className="space-y-3">
        {requests.length === 0 && <p className="text-sm text-muted-foreground">No requests yet.</p>}
        {requests.map((r) => (
          <Link key={r.id} href={`/requests/${r.id}`}>
            <Card className="transition-colors hover:bg-muted/60">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{r.title}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.application ? `Application #${r.application.applicationNumber} · Institution status: ${r.application.officialStatusRaw}` : "Not yet submitted"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline">{r.normalizedStatus.replaceAll("_", " ")}</Badge>
                  <ExecutionMethodBadge method={r.executionMethod} />
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">Last updated {formatDate(r.updatedAt)}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
