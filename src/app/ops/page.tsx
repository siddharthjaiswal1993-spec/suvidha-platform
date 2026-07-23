import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Operations overview" };

export default async function OpsOverviewPage() {
  const user = await getCurrentUser();
  const institutionId = user!.institutionId;

  const [pendingMatches, openCorrections, openClaims, openGrievances] = await Promise.all([
    prisma.deathEventMatch.count({ where: { status: "needs_human_review", ...(institutionId ? { institutionId } : {}) } }),
    prisma.deathEventCorrection.count({ where: { status: { not: "resolved" } } }),
    prisma.claim.count({ where: { status: { in: ["submitted", "under_review", "deficiency_pending"] }, ...(institutionId ? { institutionId } : {}) } }),
    prisma.grievance.count({ where: { status: { in: ["open", "in_progress"] }, ...(institutionId ? { institutionId } : {}) } }),
  ]);

  const cards = [
    { label: "Death matches needing review", value: pendingMatches, href: "/ops/death-events" },
    { label: "Open correction cases", value: openCorrections, href: "/ops/corrections" },
    { label: "Open claims", value: openClaims, href: "/ops/claims" },
    { label: "Open grievances", value: openGrievances, href: "/ops/grievances" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Operations overview</h1>
        <p className="mt-1 text-muted-foreground">{user?.institution?.name ?? "Government registry"} · {user?.displayName}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="transition-colors hover:bg-muted/60">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-semibold">{c.value}</p></CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
