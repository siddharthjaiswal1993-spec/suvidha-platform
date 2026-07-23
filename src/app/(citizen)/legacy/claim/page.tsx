import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Claims workspace" };

export default async function ClaimsWorkspacePage() {
  const user = await getCurrentUser();
  const claimant = await prisma.claimant.findFirst({
    where: { personId: user!.personId! },
    include: {
      estate: { include: { person: true } },
      claims: { include: { institution: true, claimAssets: { include: { asset: true } }, deficiencyRequests: true } },
    },
  });

  if (!claimant) {
    return <p className="text-sm text-muted-foreground">You are not currently registered as a claimant on any estate.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Claims for the estate of {claimant.estate.person.fullName}</h1>
        <p className="mt-1 text-muted-foreground">
          You are acting as <strong>{claimant.claimedRole.replaceAll("_", " ")}</strong>
          {claimant.relationToDeceased ? ` (${claimant.relationToDeceased})` : ""}.
          {claimant.wasPreAuthorised ? " You were invited as a Trusted Contact before this claim began." : " You joined this claim as an uninvited family member."}
        </p>
      </div>

      <div className="space-y-3">
        {claimant.claims.map((claim) => (
          <Link key={claim.id} href={`/legacy/claim/${claim.id}`}>
            <Card className="transition-colors hover:bg-muted/60">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{claim.institution.name}</CardTitle>
                  <CardDescription>Claim #{claim.claimNumber} · {claim.claimAssets.map((ca) => ca.asset.label).join(", ")}</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={claim.status === "settled" || claim.status === "approved" ? "success" : claim.status === "deficiency_pending" ? "warning" : "outline"}>
                    {claim.status.replaceAll("_", " ")}
                  </Badge>
                  {claim.deficiencyRequests.some((d) => d.status === "open") && <Badge variant="warning">Action needed</Badge>}
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">Submitted {claim.submittedAt ? formatDate(claim.submittedAt) : "—"}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
