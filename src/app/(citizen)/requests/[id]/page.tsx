import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { submitServiceRequest, respondToServiceRequestDeficiency } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExecutionMethodBadge } from "@/components/domain/execution-method-badge";
import { formatDateTime } from "@/lib/utils";
import { AlertTriangle, FileText } from "lucide-react";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      serviceDefinition: { include: { requiredDocumentRules: true, requiredFields: true, serviceCatalogue: { include: { institution: true } } } },
      application: true,
      statusEvents: { orderBy: { occurredAt: "asc" } },
      institutionRelationship: { include: { institution: true } },
      deficiencyRequests: { orderBy: { raisedAt: "desc" } },
      decisions: { include: { decidedByUser: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!request || request.personId !== user?.personId) notFound();

  const evidenceDoc = request.documentIdEvidence
    ? await prisma.legalDocument.findUnique({ where: { id: request.documentIdEvidence } })
    : null;

  async function submit() {
    "use server";
    await submitServiceRequest(id);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground"><Link href="/requests" className="underline">Requests</Link> / {request.title}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{request.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{request.serviceDefinition.serviceCatalogue.institution.name}</p>
          {request.requestedValueSummary && <p className="mt-1 text-sm">{request.requestedValueSummary}</p>}
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{request.normalizedStatus.replaceAll("_", " ")}</Badge>
          <ExecutionMethodBadge method={request.executionMethod} />
        </div>
      </div>

      {request.application && (
        <Card>
          <CardContent className="pt-6 text-sm">
            <p className="text-muted-foreground">Institution&apos;s own record — shown as-is, never overwritten:</p>
            <p className="mt-1 font-medium">Application #{request.application.applicationNumber} — &quot;{request.application.officialStatusRaw}&quot;</p>
          </CardContent>
        </Card>
      )}

      {evidenceDoc && (
        <Card>
          <CardHeader><CardTitle className="text-base">Evidence attached</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-primary" /> {evidenceDoc.fileLabel}
          </CardContent>
        </Card>
      )}

      {request.deficiencyRequests.filter((d) => d.status === "open").map((d) => {
        async function respond(formData: FormData) {
          "use server";
          await respondToServiceRequestDeficiency(d.id, id, formData);
        }
        return (
          <Card key={d.id} className="border-warning/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4 text-warning" /> Action needed: {d.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{d.description}</p>
              <form action={respond} className="space-y-3">
                <Textarea name="note" placeholder="Describe what you're submitting in response..." required />
                <Button type="submit" size="sm">Submit response</Button>
              </form>
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader><CardTitle className="text-base">Required documents</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {request.serviceDefinition.requiredDocumentRules.length === 0 && <p className="text-sm text-muted-foreground">No specific documents configured for this demo service.</p>}
          {request.serviceDefinition.requiredDocumentRules.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
              <span className="capitalize">{d.documentCategory.replaceAll("_", " ")}</span>
              <Badge variant={d.isMandatory ? "default" : "outline"}>{d.isMandatory ? "Mandatory" : "Optional"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {request.decisions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Institution decisions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {request.decisions.map((d) => (
              <div key={d.id} className="rounded-md border border-border p-3 text-sm">
                <Badge variant="outline">{d.makerCheckerRole}</Badge> {d.outcome.replaceAll("_", " ")}
                {d.rationale && <p className="mt-1 text-xs text-muted-foreground">{d.rationale}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
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
                {e.officialStatusRaw && <p className="text-xs text-muted-foreground">Institution said: &quot;{e.officialStatusRaw}&quot;</p>}
                <p className="text-xs text-muted-foreground">{formatDateTime(e.occurredAt)}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {request.normalizedStatus === "draft" && (
        <form action={submit}>
          <Button type="submit">Submit this request</Button>
        </form>
      )}
    </div>
  );
}
