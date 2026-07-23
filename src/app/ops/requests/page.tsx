import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExecutionMethodBadge } from "@/components/domain/execution-method-badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Service Requests" };

export default async function OpsServiceRequestQueuePage() {
  const user = await getCurrentUser();
  const requests = await prisma.serviceRequest.findMany({
    where: user?.institutionId ? { serviceDefinition: { serviceCatalogue: { institutionId: user.institutionId } } } : {},
    include: { person: true, serviceDefinition: true, deficiencyRequests: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Service Requests</h1>
        <p className="mt-1 text-muted-foreground">{user?.institution?.name} · every citizen request routed to your institution — address, mobile, nominee, and other lifelong-admin services, not just claims.</p>
      </div>
      <div className="space-y-3">
        {requests.length === 0 && <p className="text-sm text-muted-foreground">No service requests in queue.</p>}
        {requests.map((r) => (
          <Link key={r.id} href={`/ops/requests/${r.id}`}>
            <Card className="transition-colors hover:bg-muted/60">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{r.title} — {r.person.fullName}</CardTitle>
                  <CardDescription>{r.serviceDefinition.serviceCategory.replaceAll("_", " ")} · updated {formatDate(r.updatedAt)}</CardDescription>
                </div>
                <div className="flex gap-2">
                  {r.deficiencyRequests.some((d) => d.status === "open") && <Badge variant="warning">Deficiency open</Badge>}
                  <ExecutionMethodBadge method={r.executionMethod} />
                  <Badge variant="outline">{r.normalizedStatus.replaceAll("_", " ")}</Badge>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
