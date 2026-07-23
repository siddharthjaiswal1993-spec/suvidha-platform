import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldAlert } from "lucide-react";

export const metadata = { title: "Legacy & Succession" };

export default async function LegacyOverviewPage() {
  const user = await getCurrentUser();
  const personId = user!.personId!;

  const [estatePlan, claimant, ownDeathEvent, trustedContactCount] = await Promise.all([
    prisma.estatePlan.findUnique({ where: { personId } }),
    prisma.claimant.findFirst({ where: { personId }, include: { estate: { include: { person: true } } } }),
    prisma.deathEvent.findUnique({ where: { personId } }),
    prisma.trustedContact.count({ where: { grantorPersonId: personId, status: "active" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Legacy &amp; Succession</h1>
        <p className="mt-1 text-muted-foreground">
          Estate planning while you&apos;re here, and a guided, humane claims journey for your
          family when the time comes. A platform permission here is never legal ownership — see{" "}
          <Link href="/roles-and-terms" className="underline">roles &amp; terms</Link>.
        </p>
      </div>

      {ownDeathEvent && ownDeathEvent.status === "contested" && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive"><ShieldAlert className="h-4 w-4" /> Your account may be incorrectly flagged</CardTitle>
            <CardDescription>A death event has been reported that matches your identity, and it is currently under dispute.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="destructive"><Link href="/legacy/status-correction">Review and challenge this now</Link></Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estate planning</CardTitle>
            <CardDescription>{estatePlan ? `Readiness: ${estatePlan.readinessScore}%` : "Not started"} · {trustedContactCount} active Trusted Contact(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm"><Link href="/legacy/planning">Open estate planning <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Claims &amp; succession</CardTitle>
            <CardDescription>{claimant ? `Acting as ${claimant.claimedRole.replaceAll("_", " ")} for ${claimant.estate.person.fullName}` : "No active claims"}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            {claimant ? (
              <Button asChild size="sm"><Link href="/legacy/claim">Open claims workspace <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            ) : (
              <Button asChild size="sm" variant="outline"><Link href="/legacy/report-death">Report a death</Link></Button>
            )}
          </CardContent>
        </Card>
      </div>

      {!estatePlan && !claimant && (
        <Badge variant="outline">This demo persona has no estate plan or claim yet — try switching personas from the login screen.</Badge>
      )}
    </div>
  );
}
