import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "My Institutions" };

const TYPE_LABELS: Record<string, string> = {
  government_identity: "Government identity",
  government_licence: "Government licence",
  financial_account: "Financial account",
  employer: "Employer",
  utility: "Utility",
  business: "Business",
  education: "Education",
};

export default async function InstitutionsPage() {
  const user = await getCurrentUser();
  const relationships = await prisma.institutionRelationship.findMany({
    where: { personId: user!.personId! },
    include: { institution: true },
    orderBy: { relationshipType: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Institutions</h1>
        <p className="mt-1 text-muted-foreground">
          Every government, financial, employer, and utility relationship Suvidha knows about —
          each stays owned and authoritative at its own institution.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {relationships.map((r) => (
          <Link key={r.id} href={`/institutions/${r.id}`}>
            <Card className="h-full transition-colors hover:bg-muted/60">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  {r.institution.name}
                  <Badge variant={r.status === "active" ? "success" : "outline"}>{r.status}</Badge>
                </CardTitle>
                <CardDescription>{TYPE_LABELS[r.relationshipType] ?? r.relationshipType}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>{r.label}</p>
                {r.referenceNumberMasked && <p className="font-mono">{r.referenceNumberMasked}</p>}
                {r.registeredNomineeSummary && <p>Nominee: {r.registeredNomineeSummary}</p>}
                {r.renewalDueAt && <p>Renewal due {formatDate(r.renewalDueAt)}</p>}
                <p className="text-xs">Last synced {r.lastSyncedAt ? formatDate(r.lastSyncedAt) : "never"}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
