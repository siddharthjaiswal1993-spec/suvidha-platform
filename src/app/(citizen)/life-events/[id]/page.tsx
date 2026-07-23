import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { completeLifeEventAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExecutionMethodBadge } from "@/components/domain/execution-method-badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const PRIORITY_LABEL: Record<string, string> = { mandatory: "Mandatory", recommended: "Recommended", optional: "Optional" };

export default async function LifeEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lifeEvent = await prisma.lifeEvent.findUnique({
    where: { id },
    include: { lifeEventTemplate: true, actions: { include: { institutionRelationship: { include: { institution: true } } }, orderBy: { sequenceOrder: "asc" } } },
  });
  if (!lifeEvent) notFound();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground"><Link href="/life-events" className="underline">Life Events</Link> / {lifeEvent.lifeEventTemplate.title}</p>
      <div>
        <h1 className="text-2xl font-semibold">{lifeEvent.lifeEventTemplate.title}</h1>
        <div className="mt-3 max-w-md">
          <Progress value={lifeEvent.progressPercent} />
          <p className="mt-1 text-xs text-muted-foreground">{lifeEvent.progressPercent}% complete</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Affected institutions & actions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {lifeEvent.actions.map((action) => {
            const lifeEventId = lifeEvent.id;
            async function complete() {
              "use server";
              await completeLifeEventAction(action.id, lifeEventId);
            }
            return (
              <div key={action.id} className="flex items-center justify-between gap-4 rounded-md border border-border p-4">
                <div className="flex items-start gap-3">
                  {action.status === "completed" ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  ) : action.status === "in_progress" ? (
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{action.title}</p>
                    {action.institutionRelationship && <p className="text-xs text-muted-foreground">{action.institutionRelationship.institution.name}</p>}
                    <div className="mt-1 flex gap-2">
                      <Badge variant="outline">{PRIORITY_LABEL[action.priority]}</Badge>
                      <ExecutionMethodBadge method={action.executionMethod} />
                    </div>
                  </div>
                </div>
                {action.status !== "completed" && (
                  <form action={complete}>
                    <Button type="submit" size="sm" variant="outline">Mark done</Button>
                  </form>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
