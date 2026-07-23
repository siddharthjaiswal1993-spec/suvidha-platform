import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { acceptRequestIntoReview, raiseServiceRequestDeficiency, recordServiceRequestDecision, completeServiceRequestAndReconcile } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ExecutionMethodBadge } from "@/components/domain/execution-method-badge";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function OpsServiceRequestWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      person: { include: { identifiers: true } },
      serviceDefinition: { include: { requiredDocumentRules: true, serviceCatalogue: { include: { institution: true } } } },
      institutionRelationship: { include: { institution: true } },
      application: true,
      statusEvents: { orderBy: { occurredAt: "asc" } },
      deficiencyRequests: { orderBy: { raisedAt: "desc" } },
      decisions: { include: { decidedByUser: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!request || (user?.institutionId && request.serviceDefinition.serviceCatalogue.institutionId !== user.institutionId)) notFound();

  const priorMakerUserIds = new Set(request.decisions.filter((d) => d.makerCheckerRole === "maker").map((d) => d.decidedByUserId));
  const currentUserWasMaker = user ? priorMakerUserIds.has(user.id) : false;

  async function accept() { "use server"; await acceptRequestIntoReview(id); }
  async function raiseDeficiency(formData: FormData) { "use server"; await raiseServiceRequestDeficiency(id, formData); }
  async function decide(formData: FormData) { "use server"; await recordServiceRequestDecision(id, formData); }
  async function complete() { "use server"; await completeServiceRequestAndReconcile(id); }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground"><Link href="/ops/requests" className="underline">Service Requests</Link> / {request.title}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{request.title} — {request.person.fullName}</h1>
          {request.requestedValueSummary && <p className="mt-1 text-sm text-muted-foreground">{request.requestedValueSummary}</p>}
        </div>
        <div className="flex gap-2">
          <ExecutionMethodBadge method={request.executionMethod} />
          <Badge variant="outline">{request.normalizedStatus.replaceAll("_", " ")}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Citizen &amp; relationship</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>Citizen: {request.person.fullName}</p>
          <p>Identifiers on file: {request.person.identifiers.map((i) => i.maskedValue).join(", ") || "—"}</p>
          <p>Institution relationship: {request.institutionRelationship?.label ?? "—"}</p>
          <p>Registered address on file: {request.institutionRelationship?.registeredAddressSnapshot ?? "Not recorded"}</p>
        </CardContent>
      </Card>

      {request.normalizedStatus === "submitted" && (
        <form action={accept}><Button type="submit" size="sm">Accept into review</Button></form>
      )}

      {request.deficiencyRequests.map((d) => (
        <Card key={d.id} className={d.status === "open" ? "border-warning/40" : ""}>
          <CardHeader><CardTitle className="text-base">{d.title}</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-muted-foreground">{d.description}</p>
            <Badge variant={d.status === "open" ? "warning" : "success"}>{d.status}</Badge>
          </CardContent>
        </Card>
      ))}

      {(request.normalizedStatus === "under_review" || request.normalizedStatus === "under_verification") && (
        <Card>
          <CardHeader><CardTitle className="text-base">Request additional evidence</CardTitle></CardHeader>
          <CardContent>
            <form action={raiseDeficiency} className="space-y-3">
              <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" name="title" required /></div>
              <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" required /></div>
              <Button type="submit" size="sm" variant="outline">Send deficiency request</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {["under_review", "under_verification"].includes(request.normalizedStatus) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Maker-checker decision</CardTitle></CardHeader>
          <CardContent>
            {currentUserWasMaker && (
              <p className="mb-3 text-xs text-warning">You recommended this case as maker — a different person must act as checker.</p>
            )}
            <form action={decide} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="makerCheckerRole">Acting as</Label>
                  <Select name="makerCheckerRole" defaultValue="maker">
                    <SelectTrigger id="makerCheckerRole"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maker">Maker</SelectItem>
                      <SelectItem value="checker">Checker</SelectItem>
                      <SelectItem value="adjudicator">Adjudicator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outcome">Outcome</Label>
                  <Select name="outcome" defaultValue="recommend_approve">
                    <SelectTrigger id="outcome"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recommend_approve">Recommend approve</SelectItem>
                      <SelectItem value="recommend_reject">Recommend reject</SelectItem>
                      <SelectItem value="approve">Approve</SelectItem>
                      <SelectItem value="reject">Reject</SelectItem>
                      <SelectItem value="escalate">Escalate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label htmlFor="rationale">Rationale</Label><Textarea id="rationale" name="rationale" /></div>
              <Button type="submit" size="sm">Record decision</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {request.decisions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Decision history</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {request.decisions.map((d) => (
              <div key={d.id} className="rounded-md border border-border p-3 text-sm">
                <Badge variant="outline">{d.makerCheckerRole}</Badge> {d.decidedByUser?.displayName} — {d.outcome.replaceAll("_", " ")}
                {d.rationale && <p className="mt-1 text-xs text-muted-foreground">{d.rationale}</p>}
                <p className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {request.normalizedStatus === "approved" && (
        <form action={complete}>
          <Button type="submit">Complete institution update &amp; reconcile citizen record</Button>
        </form>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Status timeline</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-4 border-l border-border pl-4">
            {request.statusEvents.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="text-sm font-medium">{e.normalizedStatus.replaceAll("_", " ")}</p>
                {e.note && <p className="text-xs text-muted-foreground">{e.note}</p>}
                <p className="text-xs text-muted-foreground">{formatDateTime(e.occurredAt)}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
