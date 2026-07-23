import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Corrections queue" };

export default async function CorrectionsQueuePage() {
  const corrections = await prisma.deathEventCorrection.findMany({
    include: { deathEvent: { include: { person: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Corrections queue</h1>
        <p className="mt-1 text-muted-foreground">False-positive death matches under review, and their reactivation status.</p>
      </div>
      <div className="space-y-3">
        {corrections.map((c) => (
          <Link key={c.id} href={`/ops/death-events/${c.deathEventId}`}>
            <Card className="transition-colors hover:bg-muted/60">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{c.deathEvent.person.fullName}</CardTitle>
                  <CardDescription>Reason: {c.reason.replaceAll("_", " ")}</CardDescription>
                </div>
                <Badge variant={c.status === "registrar_corrected" || c.status === "resolved" ? "success" : "warning"}>{c.status.replaceAll("_", " ")}</Badge>
              </CardHeader>
            </Card>
          </Link>
        ))}
        {corrections.length === 0 && <p className="text-sm text-muted-foreground">No open correction cases.</p>}
      </div>
    </div>
  );
}
