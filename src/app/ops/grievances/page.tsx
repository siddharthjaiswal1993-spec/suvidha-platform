import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveGrievance } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
          async function resolve() { "use server"; await resolveGrievance(g.id); }
          return (
            <Card key={g.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{g.subject}</CardTitle>
                <Badge variant={g.status === "resolved" ? "success" : "warning"}>{g.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{g.description}</p>
                {g.status !== "resolved" && <form action={resolve}><Button type="submit" size="sm">Mark resolved</Button></form>}
              </CardContent>
            </Card>
          );
        })}
        {grievances.length === 0 && <p className="text-sm text-muted-foreground">No grievances.</p>}
      </div>
    </div>
  );
}
