import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPreferredLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { startOrCompleteDirectAction, startIntegrationAction, startInstitutionReviewAction, citizenReportsManualCompletion } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExecutionMethodBadge } from "@/components/domain/execution-method-badge";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const PRIORITY_LABEL: Record<string, string> = { mandatory: "Mandatory", recommended: "Recommended", optional: "Optional" };
const MANUAL_METHODS = new Set(["in_person_required", "deep_link_redirect", "generated_form_packet", "assisted_digital_workflow"]);

export default async function LifeEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const locale = await getPreferredLocale(user?.personId);
  const lifeEvent = await prisma.lifeEvent.findUnique({
    where: { id },
    include: {
      lifeEventTemplate: true,
      actions: { include: { institutionRelationship: { include: { institution: true } }, serviceRequest: true }, orderBy: { sequenceOrder: "asc" } },
    },
  });
  if (!lifeEvent || lifeEvent.personId !== user?.personId) notFound();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground"><Link href="/life-events" className="underline">{t("nav_life_events", locale)}</Link> / {lifeEvent.lifeEventTemplate.title}</p>
      <div>
        <h1 className="text-2xl font-semibold">{lifeEvent.lifeEventTemplate.title}</h1>
        <div className="mt-3 max-w-md">
          <Progress value={lifeEvent.progressPercent} />
          <p className="mt-1 text-xs text-muted-foreground">{lifeEvent.progressPercent}% {locale === "hi" ? "पूर्ण" : "complete"} · {t("life_event_progress_note", locale)}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("life_event_affected_institutions", locale)}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {lifeEvent.actions.map((action) => {
            const isDone = action.status === "completed" || action.status === "citizen_reported_complete";
            async function completeDirect() { "use server"; await startOrCompleteDirectAction(action.id); }
            async function completeIntegration() { "use server"; await startIntegrationAction(action.id); }
            async function sendToInstitution() { "use server"; await startInstitutionReviewAction(action.id); }
            async function reportManual(formData: FormData) { "use server"; await citizenReportsManualCompletion(action.id, formData); }

            return (
              <div key={action.id} className="rounded-md border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {isDone ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                    ) : action.status === "in_progress" ? (
                      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{action.title}</p>
                      {action.institutionRelationship && <p className="text-xs text-muted-foreground">{action.institutionRelationship.institution.name}</p>}
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="outline">{PRIORITY_LABEL[action.priority]}</Badge>
                        <ExecutionMethodBadge method={action.executionMethod} />
                        {action.status === "citizen_reported_complete" && <Badge variant="warning">Citizen-reported, not institution-verified</Badge>}
                      </div>
                    </div>
                  </div>

                  {!isDone && action.status === "pending" && action.executionMethod === "executable_via_api" && (
                    <form action={completeDirect}><Button type="submit" size="sm">{t("life_event_complete_now", locale)}</Button></form>
                  )}
                  {!isDone && action.status === "pending" && action.executionMethod === "initiable_via_integration" && (
                    <form action={completeIntegration}><Button type="submit" size="sm">{t("life_event_start_integration", locale)}</Button></form>
                  )}
                  {!isDone && action.status === "pending" && action.executionMethod === "requires_institution_approval" && (
                    <form action={sendToInstitution}><Button type="submit" size="sm" variant="outline">{t("life_event_submit_for_review", locale)}</Button></form>
                  )}
                  {!isDone && action.status === "in_progress" && action.serviceRequestId && (
                    <Button asChild size="sm" variant="outline"><Link href={`/requests/${action.serviceRequestId}`}>{t("life_event_view_progress", locale)}</Link></Button>
                  )}
                </div>

                {!isDone && action.status === "pending" && MANUAL_METHODS.has(action.executionMethod) && (
                  <form action={reportManual} className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                    <div className="space-y-1.5">
                      <Label htmlFor={`ref-${action.id}`} className="text-xs">{t("life_event_reference_number", locale)}</Label>
                      <Input id={`ref-${action.id}`} name="referenceNumber" placeholder="e.g. ACK-2026-1123" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`date-${action.id}`} className="text-xs">{t("life_event_completed_on", locale)}</Label>
                      <Input id={`date-${action.id}`} name="completionDate" type="date" required />
                    </div>
                    <Button type="submit" size="sm" variant="outline">{t("life_event_i_completed_this", locale)}</Button>
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
