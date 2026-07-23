import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Death-event inbox" };

const STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  reported: "outline", evidence_submitted: "outline", registrar_verified: "secondary",
  identity_match_pending: "warning", matched: "success", partially_matched: "warning",
  contested: "destructive", corrected: "success", cancelled: "outline", finalised: "success",
};

export default async function DeathEventInboxPage() {
  const events = await prisma.deathEvent.findMany({
    include: { person: true, matches: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Death-event inbox</h1>
        <p className="mt-1 text-muted-foreground">Every reported death event and its verification/matching status. Never publicly visible outside this console.</p>
      </div>
      <div className="space-y-3">
        {events.map((e) => (
          <Link key={e.id} href={`/ops/death-events/${e.id}`}>
            <Card className="transition-colors hover:bg-muted/60">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{e.person.fullName}</CardTitle>
                  <CardDescription>Reported {formatDate(e.dateOfDeath)} · {e.placeOfDeath} · {e.matches.length} institution match(es)</CardDescription>
                </div>
                <Badge variant={STATUS_VARIANT[e.status] ?? "outline"}>{e.status.replaceAll("_", " ")}</Badge>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
