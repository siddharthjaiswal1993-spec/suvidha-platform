import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function InboxThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const thread = await prisma.inboxThread.findUnique({
    where: { id },
    include: { messages: { include: { notice: true }, orderBy: { createdAt: "asc" } }, institution: true },
  });
  if (!thread || thread.personId !== user?.personId) notFound();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground"><Link href="/inbox" className="underline">Inbox</Link> / {thread.subject}</p>
      <h1 className="text-2xl font-semibold">{thread.subject}</h1>

      {thread.messages.map((m) => (
        <Card key={m.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">{m.senderLabel}</CardTitle>
              <p className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</p>
            </div>
            <Badge variant={m.senderVerified ? "success" : "destructive"}>{m.senderVerified ? "Verified sender" : "Unverified sender"}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {m.fraudWarning && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                This message could not be fully verified. Do not act on it directly — verify through the institution&apos;s official channel first.
              </div>
            )}
            <div>
              <p className="text-xs uppercase text-muted-foreground">Original message</p>
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
