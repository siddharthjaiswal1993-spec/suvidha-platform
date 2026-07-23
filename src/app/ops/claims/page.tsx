import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Claim queue" };

export default async function ClaimQueuePage() {
  const user = await getCurrentUser();
  const claims = await prisma.claim.findMany({
    where: user?.institutionId ? { institutionId: user.institutionId } : {},
    include: { claimant: { include: { person: true } }, claimAssets: { include: { asset: true } }, deficiencyRequests: true, fraudSignals: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Claim queue</h1>
        <p className="mt-1 text-muted-foreground">{user?.institution?.name}</p>
      </div>
      <div className="space-y-3">
        {claims.map((c) => (
          <Link key={c.id} href={`/ops/claims/${c.id}`}>
            <Card className="transition-colors hover:bg-muted/60">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{c.claimNumber} — {c.claimant.person.fullName}</CardTitle>
                  <CardDescription>{c.claimAssets.map((ca) => ca.asset.label).join(", ")} · Submitted {c.submittedAt ? formatDate(c.submittedAt) : "—"}</CardDescription>
                </div>
                <div className="flex gap-2">
                  {c.fraudSignals.some((f) => f.status === "open" || f.status === "investigating") && <Badge variant="destructive">Fraud review</Badge>}
                  {c.deficiencyRequests.some((d) => d.status === "open") && <Badge variant="warning">Deficiency open</Badge>}
                  <Badge variant={["settled", "approved"].includes(c.status) ? "success" : "outline"}>{c.status.replaceAll("_", " ")}</Badge>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
        {claims.length === 0 && <p className="text-sm text-muted-foreground">No claims in queue.</p>}
      </div>
    </div>
  );
}
