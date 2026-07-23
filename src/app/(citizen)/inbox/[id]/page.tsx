import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { replyToThread, markMessageSuspicious, escalateThreadToGrievance } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatDateTime } from "@/lib/utils";
import { AlertOctagon } from "lucide-react";

export default async function InboxThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const thread = await prisma.inboxThread.findUnique({
    where: { id },
    include: { messages: { include: { notice: true }, orderBy: { createdAt: "asc" } }, institution: true },
  });
  if (!thread || thread.personId !== user?.personId) notFound();

  async function reply(formData: FormData) {
    "use server";
    await replyToThread(id, formData);
  }
  async function markSuspicious(messageId: string) {
    "use server";
    await markMessageSuspicious(messageId, id);
  }
  async function escalate() {
    "use server";
    const grievanceId = await escalateThreadToGrievance(id);
    redirect(`/help/${grievanceId}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground"><Link href="/inbox" className="underline">Inbox</Link> / {thread.subject}</p>
        <form action={escalate}><Button type="submit" size="sm" variant="outline">Escalate to grievance</Button></form>
      </div>
      <h1 className="text-2xl font-semibold">{thread.subject}</h1>

      {thread.messages.map((m) => (
        <Card key={m.id} className={m.direction === "citizen_to_institution" ? "ml-8 border-primary/30" : ""}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">{m.senderLabel}{m.direction === "citizen_to_institution" && " (you)"}</CardTitle>
              <p className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</p>
            </div>
            {m.direction === "institution_to_citizen" && (
              <Badge variant={m.senderVerified ? "success" : "destructive"}>{m.senderVerified ? "Verified sender" : "Unverified sender"}</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {m.fraudWarning && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                This message could not be fully verified. Do not act on it directly — verify through the institution&apos;s official channel first.
              </div>
            )}
            <div>
              <p className="text-xs uppercase text-muted-foreground">{m.direction === "citizen_to_institution" ? "Your message" : "Original message"}</p>
              <p className="mt-1 text-sm">{m.originalBody}</p>
            </div>
            {m.plainLanguageSummary && (
              <div>
                <p className="text-xs uppercase text-muted-foreground">In plain language</p>
                <p className="mt-1 text-sm">{m.plainLanguageSummary}</p>
              </div>
            )}
            {m.notice?.responseDeadline && (
              <p className="text-sm font-medium text-warning">Response needed by {formatDate(m.notice.responseDeadline)}</p>
            )}
            {m.suggestedNextAction && (
              <div className="rounded-md border border-border bg-muted/50 p-3 text-sm">
                <p className="font-medium">Suggested next step</p>
                <p className="mt-1 text-muted-foreground">{m.suggestedNextAction}</p>
                <Button asChild size="sm" className="mt-3"><Link href="/requests/new">Start a request</Link></Button>
              </div>
            )}
            {m.direction === "institution_to_citizen" && (
              m.reportedSuspiciousAt ? (
                <p className="flex items-center gap-1 text-xs text-warning"><AlertOctagon className="h-3 w-3" /> You reported this as suspicious on {formatDate(m.reportedSuspiciousAt)}.</p>
              ) : (
                <form action={markSuspicious.bind(null, m.id)}>
                  <Button type="submit" size="sm" variant="outline" className="text-xs">Report as suspicious</Button>
                </form>
              )
            )}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader><CardTitle className="text-base">Reply</CardTitle></CardHeader>
        <CardContent>
          <form action={reply} className="space-y-3">
            <Textarea name="body" placeholder="Type your reply..." required />
            <Button type="submit" size="sm">Send reply</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
