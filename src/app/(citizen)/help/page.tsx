import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { raiseGrievance } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Help & Grievances" };

export default async function HelpGrievancesPage() {
  const user = await getCurrentUser();
  const grievances = await prisma.grievance.findMany({ where: { raisedByPersonId: user!.personId! }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Help &amp; Grievances</h1>
        <p className="mt-1 text-muted-foreground">Raise an issue and track it to resolution.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Raise a grievance</CardTitle></CardHeader>
        <CardContent>
          <form action={raiseGrievance} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="subject">Subject</Label><Input id="subject" name="subject" required /></div>
            <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" required /></div>
            <Button type="submit">Submit</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {grievances.map((g) => (
          <Link key={g.id} href={`/help/${g.id}`}>
            <Card className="transition-colors hover:bg-muted/60">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{g.subject}</CardTitle>
                <Badge variant={g.status === "resolved" ? "success" : g.status === "escalated" ? "warning" : "outline"}>{g.status.replaceAll("_", " ")}</Badge>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{g.description}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
