import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { connectInstitution } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
  const [relationships, allInstitutions] = await Promise.all([
    prisma.institutionRelationship.findMany({
      where: { personId: user!.personId! },
      include: { institution: true },
      orderBy: { relationshipType: "asc" },
    }),
    prisma.institution.findMany({ orderBy: { name: "asc" } }),
  ]);

  const connectedInstitutionIds = new Set(relationships.map((r) => r.institutionId));
  const unconnected = allInstitutions.filter((i) => !connectedInstitutionIds.has(i.id));

  async function connect(formData: FormData) {
    "use server";
    const relationshipId = await connectInstitution(formData);
    redirect(`/institutions/${relationshipId}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Institutions</h1>
        <p className="mt-1 text-muted-foreground">
          Every government, financial, employer, and utility relationship Suvidha knows about —
          each stays owned and authoritative at its own institution.
        </p>
      </div>

      {unconnected.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connect a new institution</CardTitle>
            <CardDescription>Simulated identity matching — no live connector exists in this prototype (see docs/INTEGRATIONS.md).</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={connect} className="grid gap-3 sm:grid-cols-[2fr_2fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="institutionId" className="text-xs">Institution</Label>
                <Select name="institutionId" required>
                  <SelectTrigger id="institutionId"><SelectValue placeholder="Choose an institution" /></SelectTrigger>
                  <SelectContent>
                    {unconnected.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="label" className="text-xs">What should we call it?</Label>
                <Input id="label" name="label" placeholder="e.g. Savings Account" required />
              </div>
              <Button type="submit" size="sm">Connect</Button>
            </form>
          </CardContent>
        </Card>
      )}

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
