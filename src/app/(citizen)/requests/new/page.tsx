import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createServiceRequest } from "../actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const metadata = { title: "New request" };

export default async function NewRequestPage() {
  const user = await getCurrentUser();
  const [services, relationships] = await Promise.all([
    prisma.serviceDefinition.findMany({ include: { serviceCatalogue: { include: { institution: true } } } }),
    prisma.institutionRelationship.findMany({ where: { personId: user!.personId! }, include: { institution: true } }),
  ]);

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Start a new request</h1>
        <p className="mt-1 text-muted-foreground">Pick what you need — Suvidha will show the exact checklist and execution method next.</p>
      </div>

      <form action={createServiceRequest}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request details</CardTitle>
            <CardDescription>You can review the full checklist before submitting anything.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceDefinitionId">Service</Label>
              <Select name="serviceDefinitionId" required>
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
              <Label htmlFor="institutionRelationshipId">Related institution relationship (optional)</Label>
              <Select name="institutionRelationshipId">
                <SelectTrigger id="institutionRelationshipId"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  {relationships.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.institution.name} — {r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Create draft request</Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
