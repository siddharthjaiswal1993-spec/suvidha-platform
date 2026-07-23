import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveGrievance } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export const metadata = { title: "Grievances" };

export default async function OpsGrievancesPage() {
  const user = await getCurrentUser();
  const grievances = await prisma.grievance.findMany({
    where: user?.institutionId ? { institutionId: user.institutionId } : {},
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Grievances</h1>
      <div className="space-y-3">
        {grievances.map((g) => {
          async function resolve(formData: FormData) { "use server"; await resolveGrievance(g.id, formData); }
          return (
            <Card key={g.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{g.subject}</CardTitle>
                <Badge variant={g.status === "resolved" ? "success" : "warning"}>{g.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{g.description}</p>
                {g.status === "resolved" ? (
                  <div className="rounded-md border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                    <p>Category: {g.resolutionCategory?.replaceAll("_", " ")}</p>
                    <p className="mt-1">{g.resolutionNote}</p>
                  </div>
                ) : (
                  <form action={resolve} className="space-y-3 border-t border-border pt-3">
                    <div className="space-y-2">
                      <Label htmlFor={`cat-${g.id}`} className="text-xs">Resolution category</Label>
                      <Select name="resolutionCategory">
                        <SelectTrigger id={`cat-${g.id}`}><SelectValue placeholder="Select a category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service_delay">Service delay</SelectItem>
                          <SelectItem value="incorrect_information">Incorrect information</SelectItem>
                          <SelectItem value="fraud_concern">Fraud concern</SelectItem>
                          <SelectItem value="poor_service">Poor service</SelectItem>
                          <SelectItem value="policy_dispute">Policy dispute</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`note-${g.id}`} className="text-xs">Resolution note</Label>
                      <Textarea id={`note-${g.id}`} name="resolutionNote" required />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id={`ack-${g.id}`} name="citizenCommunicationSent" />
                      <Label htmlFor={`ack-${g.id}`} className="text-xs font-normal">I have notified the citizen of this resolution</Label>
                    </div>
                    <Button type="submit" size="sm">Mark resolved</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          );
        })}
        {grievances.length === 0 && <p className="text-sm text-muted-foreground">No grievances.</p>}
      </div>
    </div>
  );
}
