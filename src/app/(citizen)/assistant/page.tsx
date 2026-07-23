import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, daysUntil } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export const metadata = { title: "Life Admin Assistant" };

const QUESTIONS = [
  { key: "expiring_documents", label: "Which documents expire this year?" },
  { key: "nominee_coverage", label: "Have I updated my nominee everywhere?" },
  { key: "stalled_requests", label: "Which of my requests haven't moved recently?" },
  { key: "address_mismatch", label: "Where is my old address still registered?" },
  { key: "open_grievances", label: "Do I have any open grievances?" },
  { key: "document_shares", label: "What documents have I shared, and with whom?" },
  { key: "delegated_access", label: "Who has delegated access to my tasks?" },
  { key: "estate_readiness", label: "What's my estate readiness score?" },
];

async function answerQuestion(key: string | undefined, personId: string) {
  if (key === "expiring_documents") {
    const renewals = await prisma.renewal.findMany({
      where: { documentProfile: { legalDocument: { ownerPersonId: personId } }, status: { in: ["upcoming", "overdue"] } },
      include: { documentProfile: { include: { legalDocument: true } } },
    });
    if (renewals.length === 0) return { text: "No documents are due for renewal soon.", cites: [] as string[] };
    return {
      text: `${renewals.length} document(s) need attention: ${renewals.map((r) => `${r.documentProfile.legalDocument.fileLabel} (${r.status === "overdue" ? "expired" : `due ${formatDate(r.dueDate)}, ${daysUntil(r.dueDate)} days`})`).join("; ")}.`,
      cites: ["Documents"],
    };
  }
  if (key === "nominee_coverage") {
    const assets = await prisma.asset.findMany({ where: { holdings: { some: { personId } }, deletedAt: null }, include: { nominations: true } });
    const gaps = assets.filter((a) => a.nominations.length === 0);
    if (gaps.length === 0) return { text: "Every tracked asset has a nominee on file.", cites: ["Financial Administration"] };
    return { text: `${gaps.length} of ${assets.length} tracked assets have no nominee on file: ${gaps.map((a) => a.label).join(", ")}.`, cites: ["Financial Administration", "Legacy & Succession"] };
  }
  if (key === "stalled_requests") {
    const requests = await prisma.serviceRequest.findMany({ where: { personId, normalizedStatus: { notIn: ["completed", "cancelled", "rejected"] } } });
    const stalled = requests.filter((r) => Date.now() - r.updatedAt.getTime() > 3 * 24 * 60 * 60 * 1000);
    if (stalled.length === 0) return { text: "No open requests look stalled right now.", cites: ["Requests"] };
    return { text: `${stalled.length} request(s) haven't updated in a few days: ${stalled.map((r) => r.title).join(", ")}. You can escalate any of these to a grievance from its detail page.`, cites: ["Requests"] };
  }
  if (key === "address_mismatch") {
    const conflicts = await prisma.profileConflict.findMany({
      where: { citizenProfile: { personId }, status: "open", profileField: { fieldKey: "present_address" } },
      include: { alternateValue: true },
    });
    if (conflicts.length === 0) return { text: "No address mismatches detected across your connected sources.", cites: ["My Profile"] };
    return { text: conflicts.map((c) => `${c.alternateValue.sourceLabel} still shows: "${c.alternateValue.value}"`).join("; "), cites: ["My Profile"] };
  }
  if (key === "open_grievances") {
    const grievances = await prisma.grievance.findMany({ where: { raisedByPersonId: personId, status: { notIn: ["resolved"] } } });
    if (grievances.length === 0) return { text: "You have no open grievances right now.", cites: ["Help & Grievances"] };
    return { text: `${grievances.length} open grievance(s): ${grievances.map((g) => `"${g.subject}" (${g.status.replaceAll("_", " ")})`).join("; ")}.`, cites: ["Help & Grievances"] };
  }
  if (key === "document_shares") {
    const shares = await prisma.documentShare.findMany({
      where: { documentProfile: { legalDocument: { ownerPersonId: personId } }, revokedAt: null },
      include: { documentProfile: { include: { legalDocument: true } } },
    });
    if (shares.length === 0) return { text: "You haven't shared any documents yet.", cites: ["Documents"] };
    return { text: shares.map((s) => `"${s.documentProfile.legalDocument.fileLabel}" is shared with ${s.sharedWithLabel} (${s.purpose})`).join("; "), cites: ["Documents"] };
  }
  if (key === "delegated_access") {
    const tasks = await prisma.delegatedTask.findMany({
      where: { serviceRequest: { personId }, status: { in: ["approved", "pending_owner_approval"] } },
      include: { assistantPerson: true, serviceRequest: true },
    });
    if (tasks.length === 0) return { text: "No one currently has delegated access to any of your tasks.", cites: ["Family & Delegated Access"] };
    return { text: tasks.map((t) => `${t.assistantPerson.fullName} — ${t.permissionTier.replaceAll("_", " ")} on "${t.serviceRequest?.title}" (${t.status.replaceAll("_", " ")})`).join("; "), cites: ["Family & Delegated Access"] };
  }
  if (key === "estate_readiness") {
    const estatePlan = await prisma.estatePlan.findUnique({ where: { personId } });
    if (!estatePlan) return { text: "You haven't started estate planning yet — visit Legacy & Succession to begin.", cites: ["Legacy & Succession"] };
    return { text: `Your estate readiness score is ${estatePlan.readinessScore}%. Check Legacy & Succession for exactly which nominations or documents are still missing.`, cites: ["Legacy & Succession"] };
  }
  return null;
}

export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const user = await getCurrentUser();
  const answer = q ? await answerQuestion(q, user!.personId!) : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-semibold">Life Admin Assistant</h1>
      </div>
      <p className="text-muted-foreground">
        This assistant only answers from your own Suvidha data, and always says so when it can&apos;t
        find a grounded answer — see <code>docs/AI_ASSISTANT.md</code> for exactly how this works
        (a deterministic, cited simulation, not a live model, in this prototype).
      </p>

      <div className="flex flex-wrap gap-2">
        {QUESTIONS.map((qq) => (
          <Link
            key={qq.key}
            href={`/assistant?q=${qq.key}`}
            className={cn("rounded-full border border-border px-4 py-2 text-sm hover:bg-muted", q === qq.key && "border-primary bg-secondary")}
          >
            {qq.label}
          </Link>
        ))}
      </div>

      {q && (
        <Card>
          <CardHeader><CardTitle className="text-base">{QUESTIONS.find((qq) => qq.key === q)?.label}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {answer ? (
              <>
                <p className="text-sm">{answer.text}</p>
                <div className="flex flex-wrap gap-1">
                  {answer.cites.map((c) => <Badge key={c} variant="outline">Source: {c}</Badge>)}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">I can&apos;t find a grounded answer to that yet — try one of the suggested questions above, or open Requests / Help &amp; Grievances directly.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
