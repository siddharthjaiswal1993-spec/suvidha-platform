import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AuthzError } from "@/lib/authz/guards";
import { getClaimIfClaimant } from "@/lib/authz/resource-access";
import { respondToDeficiency } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export default async function ClaimDetailPage({ params }: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await params;
  const user = await getCurrentUser();

  try {
    await getClaimIfClaimant(claimId, user?.personId);
  } catch (e) {
    if (e instanceof AuthzError) notFound();
    throw e;
  }

  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      institution: true,
      claimAssets: { include: { asset: true } },
      workflow: { include: { steps: { orderBy: { order: "asc" } } } },
      deficiencyRequests: true,
      decisions: true,
      payments: true,
      transfers: true,
    },
  });
  if (!claim) notFound();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground"><Link href="/legacy/claim" className="underline">Claims workspace</Link> / {claim.claimNumber}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{claim.institution.name} — {claim.claimAssets.map((ca) => ca.asset.label).join(", ")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Claim #{claim.claimNumber} · Recommended pathway: {claim.claimAssets[0]?.recommendedPathway?.replaceAll("_", " ")}</p>
        </div>
        <Badge variant={["settled", "approved"].includes(claim.status) ? "success" : claim.status === "deficiency_pending" ? "warning" : "outline"}>
          {claim.status.replaceAll("_", " ")}
        </Badge>
      </div>

      {claim.workflow && (
        <Card>
          <CardHeader><CardTitle className="text-base">Progress</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {claim.workflow.steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 text-sm">
                {step.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-success" /> : step.status === "in_progress" ? <Clock className="h-4 w-4 text-warning" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                <span className={step.status === "completed" ? "" : "text-muted-foreground"}>{step.title}</span>
                {step.completedAt && <span className="text-xs text-muted-foreground">({formatDate(step.completedAt)})</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {claim.deficiencyRequests.filter((d) => d.status === "open").map((d) => {
        const claimId = claim.id;
        async function respond(formData: FormData) {
          "use server";
          await respondToDeficiency(d.id, claimId, formData);
        }
        return (
          <Card key={d.id} className="border-warning/40">
            <CardHeader><CardTitle className="text-base">Action needed: {d.title}</CardTitle></CardHeader>
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

      {claim.decisions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Decisions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {claim.decisions.map((d) => (
              <div key={d.id} className="rounded-md border border-border p-3 text-sm">
                <p><Badge variant="outline">{d.makerCheckerRole}</Badge> {d.outcome.replaceAll("_", " ")}</p>
                {d.rationale && <p className="mt-1 text-xs text-muted-foreground">{d.rationale}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {(claim.payments.length > 0 || claim.transfers.length > 0) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Settlement</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {claim.payments.map((p) => <p key={p.id}>Payment {p.status} — {p.amountBand}</p>)}
            {claim.transfers.map((t) => <p key={t.id}>{t.transferType.replaceAll("_", " ")} — {t.status}</p>)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
