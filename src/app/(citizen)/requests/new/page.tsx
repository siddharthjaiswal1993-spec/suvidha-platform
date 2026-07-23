import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createServiceRequest } from "../actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

export const metadata = { title: "New request" };

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ institutionRelationshipId?: string; serviceCategory?: string }>;
}) {
  const { institutionRelationshipId: prefillRelationshipId, serviceCategory: prefillCategory } = await searchParams;
  const user = await getCurrentUser();
  const [services, relationships, documents] = await Promise.all([
    prisma.serviceDefinition.findMany({ include: { serviceCatalogue: { include: { institution: true } } } }),
    prisma.institutionRelationship.findMany({ where: { personId: user!.personId! }, include: { institution: true } }),
    prisma.legalDocument.findMany({ where: { ownerPersonId: user!.personId!, deletedAt: null }, include: { documentProfile: true } }),
  ]);

  const preselectedService = prefillCategory ? services.find((s) => s.serviceCategory === prefillCategory) : undefined;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Start a new request</h1>
        <p className="mt-1 text-muted-foreground">Pick what you need. Suvidha shows the exact document checklist, a consent summary, and an honest execution-method label before anything is submitted.</p>
      </div>

      <form action={createServiceRequest}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Service and institution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceDefinitionId">Service</Label>
              <Select name="serviceDefinitionId" required defaultValue={preselectedService?.id}>
                <SelectTrigger id="serviceDefinitionId"><SelectValue placeholder="Choose a service" /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.serviceCatalogue.institution.name} — {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="institutionRelationshipId">Related institution relationship</Label>
              <Select name="institutionRelationshipId" defaultValue={prefillRelationshipId}>
                <SelectTrigger id="institutionRelationshipId"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {relationships.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.institution.name} — {r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">2. Evidence</CardTitle>
            <CardDescription>Reuse a verified document instead of submitting it again.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents in your hub yet — you can add one from Documents first, or continue without one.</p>
            ) : (
              <Select name="documentIdEvidence">
                <SelectTrigger><SelectValue placeholder="No document selected" /></SelectTrigger>
                <SelectContent>
                  {documents.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.fileLabel} {d.documentProfile ? `(${d.documentProfile.documentCategory})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-primary" /> 3. Consent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>By continuing, you consent to sharing the selected document and request details with the chosen institution, for the sole purpose of processing this request.</p>
            <Badge variant="outline">A consent receipt is recorded and visible in Privacy &amp; Consent</Badge>
          </CardContent>
        </Card>

        <Button type="submit" className="mt-4 w-full">Create draft request</Button>
      </form>
    </div>
  );
}
