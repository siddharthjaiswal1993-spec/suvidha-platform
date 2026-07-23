import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fileAppeal, requestEscalation } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatDateTime } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "success" | "warning" | "outline" | "destructive"> = {
  resolved: "success",
  escalated: "warning",
  in_progress: "outline",
  open: "outline",
};

export default async function GrievanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const grievance = await prisma.grievance.findUnique({
    where: { id },
    include: { institution: true, escalations: { orderBy: { createdAt: "desc" } }, appeals: { orderBy: { filedAt: "desc" } }, sourceInboxThread: true },
  });
  if (!grievance || grievance.raisedByPersonId !== user?.personId) notFound();

  async function escalate(formData: FormData) {
    "use server";
    await requestEscalation(id, formData);
  }
  async function appeal(formData: FormData) {
    "use server";
    await fileAppeal(id, formData);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-sm text-muted-foreground"><Link href="/help" className="underline">Help &amp; Grievances</Link> / {grievance.subject}</p>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{grievance.subject}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Raised {formatDate(grievance.createdAt)}{grievance.institution ? ` · ${grievance.institution.name}` : ""}</p>
        </div>
        <Badge variant={STATUS_VARIANT[grievance.status] ?? "outline"}>{grievance.status.replaceAll("_", " ")}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>{grievance.description}</p>
          {grievance.sourceInboxThread && (
            <p className="mt-2 text-xs">Escalated from inbox thread: <Link href={`/inbox/${grievance.sourceInboxThread.id}`} className="underline">{grievance.sourceInboxThread.subject}</Link></p>
          )}
        </CardContent>
      </Card>

      {grievance.status === "resolved" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Resolution</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Badge variant="outline">{grievance.resolutionCategory?.replaceAll("_", " ")}</Badge>
            <p className="text-muted-foreground">{grievance.resolutionNote}</p>
            {grievance.resolvedAt && <p className="text-xs text-muted-foreground">Resolved {formatDate(grievance.resolvedAt)}</p>}
            {grievance.citizenCommunicationSent && <p className="text-xs text-success">You were notified of this resolution.</p>}
          </CardContent>
        </Card>
      )}

      {grievance.escalations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Escalation history</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {grievance.escalations.map((e) => (
              <div key={e.id} className="rounded-md border border-border p-3">
                <p className="font-medium">Escalated to {e.escalatedTo}</p>
                <p className="text-muted-foreground">{e.reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(e.createdAt)} · <Badge variant="outline">{e.status}</Badge></p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {grievance.appeals.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Appeals</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {grievance.appeals.map((a) => (
              <div key={a.id} className="rounded-md border border-border p-3">
                <p className="text-muted-foreground">{a.groundsForAppeal}</p>
                <p className="mt-1 text-xs text-muted-foreground">Filed {formatDate(a.filedAt)} · <Badge variant="outline">{a.status.replaceAll("_", " ")}</Badge></p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {grievance.status !== "resolved" && grievance.status !== "escalated" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Not moving fast enough?</CardTitle>
            <CardDescription>Escalate to a nodal officer if this hasn&apos;t progressed.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={escalate} className="space-y-3">
              <Textarea name="reason" placeholder="Why does this need escalation?" required />
              <Button type="submit" size="sm" variant="outline">Escalate</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {grievance.status === "resolved" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Disagree with this resolution?</CardTitle>
            <CardDescription>You can file an appeal with your grounds.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={appeal} className="space-y-3">
              <Textarea name="groundsForAppeal" placeholder="Why do you disagree with this resolution?" required />
              <Button type="submit" size="sm" variant="outline">File appeal</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
