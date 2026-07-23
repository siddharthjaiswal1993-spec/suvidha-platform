import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { AlertOctagon, Bell, FileWarning, ShieldAlert } from "lucide-react";

export const metadata = { title: "Inbox" };

const TYPE_ICON: Record<string, typeof Bell> = {
  notice: FileWarning,
  request_update: Bell,
  reminder: Bell,
  scheme_announcement: Bell,
  security_alert: ShieldAlert,
  consent_request: ShieldAlert,
};

export default async function InboxPage() {
  const user = await getCurrentUser();
  const threads = await prisma.inboxThread.findMany({
    where: { personId: user!.personId! },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 }, institution: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="mt-1 text-muted-foreground">Notices, reminders, and alerts from every connected institution — explained in plain language.</p>
      </div>
      <div className="space-y-3">
        {threads.map((t) => {
          const latest = t.messages[0];
          const Icon = TYPE_ICON[t.threadType] ?? Bell;
          return (
            <Link key={t.id} href={`/inbox/${t.id}`}>
              <Card className="transition-colors hover:bg-muted/60">
                <CardContent className="flex items-start gap-3 pt-6">
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${latest?.fraudWarning ? "text-destructive" : latest?.importance === "high" ? "text-warning" : "text-muted-foreground"}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{t.subject}</p>
                      {latest && !latest.readAt && <Badge variant="secondary">New</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{latest?.senderLabel}{t.institution ? ` · ${t.institution.name}` : ""}</p>
                    {latest?.fraudWarning && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-destructive"><AlertOctagon className="h-3 w-3" /> Sender could not be fully verified</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{latest ? formatDateTime(latest.createdAt) : ""}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
