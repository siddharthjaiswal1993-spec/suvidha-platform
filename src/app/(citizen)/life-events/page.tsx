import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Life Events" };

export default async function LifeEventsPage() {
  const user = await getCurrentUser();
  const [activeEvents, templates] = await Promise.all([
    prisma.lifeEvent.findMany({ where: { personId: user!.personId! }, include: { lifeEventTemplate: true } }),
    prisma.lifeEventTemplate.findMany({ orderBy: { title: "asc" } }),
  ]);
  const activeTemplateIds = new Set(activeEvents.map((e) => e.lifeEventTemplateId));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Life Events</h1>
        <p className="mt-1 text-muted-foreground">Moving house, a new job, marriage, bereavement — one coordinated plan instead of guessing which departments to visit.</p>
      </div>

      {activeEvents.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">In progress</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {activeEvents.map((e) => (
              <Link key={e.id} href={`/life-events/${e.id}`}>
                <Card className="transition-colors hover:bg-muted/60">
                  <CardHeader>
                    <CardTitle className="text-base">{e.lifeEventTemplate.title}</CardTitle>
                    <CardDescription>Started {e.startedAt.toDateString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={e.progressPercent} />
                    <p className="mt-2 text-xs text-muted-foreground">{e.progressPercent}% complete</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Start a new life event</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className="opacity-90">
              <CardContent className="flex items-center justify-between pt-6 text-sm">
                <span>{t.title}</span>
                {activeTemplateIds.has(t.id) && <Badge variant="secondary">Active</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          In this prototype, the &quot;address change&quot; life event is fully built out end to
          end — see the active event above. The rest of the catalogue is shown for breadth; see
          docs/ASSUMPTIONS_AND_LIMITATIONS.md.
        </p>
      </div>
    </div>
  );
}
