import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, daysUntil } from "@/lib/utils";
import { AlertTriangle, ArrowRight, CheckCircle2, FileClock, Inbox as InboxIcon, Users } from "lucide-react";

export const metadata = { title: "Home" };

export default async function HomePage() {
  const user = await getCurrentUser();
  const personId = user!.personId!;

  const [conflicts, renewals, requests, unreadMessages, lifeEvents, trustedContacts, delegatedTasks, claimant] = await Promise.all([
    prisma.profileConflict.findMany({ where: { citizenProfile: { personId }, status: "open" }, include: { profileField: true } }),
    prisma.renewal.findMany({ where: { documentProfile: { legalDocument: { ownerPersonId: personId } }, status: { in: ["upcoming", "overdue"] } }, include: { documentProfile: { include: { legalDocument: true } } } }),
    prisma.serviceRequest.findMany({ where: { personId }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.message.count({ where: { inboxThread: { personId }, readAt: null } }),
    prisma.lifeEvent.findMany({ where: { personId, status: "in_progress" }, include: { lifeEventTemplate: true } }),
    prisma.trustedContact.count({ where: { grantorPersonId: personId, status: "active" } }),
    prisma.delegatedTask.count({ where: { assistantPersonId: personId, status: "pending_owner_approval" } }),
    prisma.claimant.findFirst({ where: { personId }, include: { estate: { include: { person: true } } } }),
  ]);

  const attentionItems = [
    ...conflicts.map((c) => ({
      key: `conflict-${c.id}`,
      icon: AlertTriangle,
      text: `Your ${c.profileField.label.toLowerCase()} differs across sources`,
      href: "/profile",
    })),
    ...renewals.map((r) => ({
      key: `renewal-${r.id}`,
      icon: FileClock,
      text: `${r.documentProfile.legalDocument.fileLabel} ${r.status === "overdue" ? "has expired" : `expires in ${daysUntil(r.dueDate)} day(s)`}`,
      href: "/documents",
    })),
    ...(delegatedTasks > 0 ? [{ key: "delegated", icon: Users, text: `${delegatedTasks} delegated task(s) awaiting your approval`, href: "/family-access" }] : []),
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user!.displayName.split(" ")[0]}</h1>
        <p className="mt-1 text-muted-foreground">Here&apos;s what needs your attention today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Needs attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent><p className="text-2xl font-semibold">{attentionItems.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unread inbox</CardTitle>
            <InboxIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><p className="text-2xl font-semibold">{unreadMessages}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Trusted Contacts</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent><p className="text-2xl font-semibold">{trustedContacts}</p></CardContent>
        </Card>
      </div>

      {attentionItems.length > 0 && (
        <Card>
          <CardHeader><CardTitle>What needs your attention</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {attentionItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.key} href={item.href} className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-muted">
                  <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-warning" />{item.text}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {lifeEvents.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Life events in progress</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {lifeEvents.map((le) => (
              <Link key={le.id} href={`/life-events/${le.id}`} className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-muted">
                <span>{le.lifeEventTemplate.title}</span>
                <Badge variant="secondary">{le.progressPercent}% complete</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Recent requests</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {requests.length === 0 && <p className="text-sm text-muted-foreground">No service requests yet.</p>}
          {requests.map((r) => (
            <Link key={r.id} href={`/requests/${r.id}`} className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-muted">
              <span>{r.title}</span>
              <Badge variant="outline">{r.normalizedStatus.replaceAll("_", " ")}</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>

      {claimant && (
        <Card>
          <CardHeader>
            <CardTitle>Legacy & Succession</CardTitle>
            <CardDescription>You are acting as {claimant.claimedRole.replaceAll("_", " ")} for the estate of {claimant.estate.person.fullName}.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm"><Link href="/legacy/claim">Go to claims workspace <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">Data last synced across sources: {formatDate(new Date())}. Demo data only.</p>
    </div>
  );
}
