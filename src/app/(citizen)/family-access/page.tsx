import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decideDelegatedTask, inviteAssistant } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { EmptyState } from "@/components/domain/empty-state";

export const metadata = { title: "Family & Delegated Access" };

const PERMISSION_LABELS: Record<string, string> = {
  permission_to_view: "View only",
  permission_to_assist: "Assist",
  permission_to_prepare: "Prepare (owner must submit)",
  permission_to_submit: "Prepare & submit",
  permission_to_sign: "Sign on my behalf",
  permission_to_receive_communication: "Receive communications",
};

export default async function FamilyAccessPage() {
  const user = await getCurrentUser();
  const personId = user!.personId!;

  const [tasksAssignedToMe, tasksIOwn, myOpenRequests] = await Promise.all([
    prisma.delegatedTask.findMany({
      where: { assistantPersonId: personId },
      include: { serviceRequest: { include: { person: true } } },
    }),
    prisma.delegatedTask.findMany({
      where: { serviceRequest: { personId }, NOT: { assistantPersonId: personId } },
      include: { assistantPerson: true, serviceRequest: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.serviceRequest.findMany({
      where: { personId, normalizedStatus: { notIn: ["completed", "cancelled", "rejected"] } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pending = tasksIOwn.filter((t) => t.status === "pending_owner_approval");
  const decided = tasksIOwn.filter((t) => t.status !== "pending_owner_approval");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Family &amp; Delegated Access</h1>
        <p className="mt-1 text-muted-foreground">
          Family Administrators and Professional Representatives can help with specific tasks —
          never full, unrestricted access, and never legal authority. See{" "}
          <a href="/roles-and-terms" className="underline">roles &amp; terms</a>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite someone to help</CardTitle>
          <CardDescription>Always scoped to one specific request — never blanket account access. No real invitation is sent in this prototype.</CardDescription>
        </CardHeader>
        <CardContent>
          {myOpenRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have no open requests to delegate right now — start one from Requests first.</p>
          ) : (
            <form action={inviteAssistant} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs">Name</Label>
                <Input id="fullName" name="fullName" placeholder="e.g. Divya Krishnan" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="relation" className="text-xs">Relation</Label>
                <Input id="relation" name="relation" placeholder="e.g. Daughter" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="serviceRequestId" className="text-xs">Which request</Label>
                <Select name="serviceRequestId" required>
                  <SelectTrigger id="serviceRequestId"><SelectValue placeholder="Choose a request" /></SelectTrigger>
                  <SelectContent>
                    {myOpenRequests.map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="permissionTier" className="text-xs">Permission</Label>
                <Select name="permissionTier" defaultValue="permission_to_assist">
                  <SelectTrigger id="permissionTier"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERMISSION_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="sm" className="sm:col-span-2">Invite</Button>
            </form>
          )}
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Awaiting your approval</CardTitle>
            <CardDescription>Nothing above &quot;assist&quot; happens without your explicit confirmation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((task) => {
              async function approve() { "use server"; await decideDelegatedTask(task.id, "approved"); }
              async function reject() { "use server"; await decideDelegatedTask(task.id, "rejected"); }
              return (
                <div key={task.id} className="flex items-center justify-between rounded-md border border-border p-4">
                  <div>
                    <p className="font-medium">{task.assistantPerson.fullName} wants to {PERMISSION_LABELS[task.permissionTier]?.toLowerCase()}</p>
                    {task.serviceRequest && <p className="text-sm text-muted-foreground">Request: {task.serviceRequest.title}</p>}
                  </div>
                  <div className="flex gap-2">
                    <form action={reject}><Button type="submit" variant="outline" size="sm">Decline</Button></form>
                    <form action={approve}><Button type="submit" size="sm">Approve</Button></form>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {decided.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">People helping with your tasks</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {decided.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-md border border-border p-4 text-sm">
                <div>
                  <p className="font-medium">{task.assistantPerson.fullName}</p>
                  {task.serviceRequest && <p className="text-muted-foreground">{task.serviceRequest.title}</p>}
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{PERMISSION_LABELS[task.permissionTier]}</Badge>
                  <Badge variant={task.status === "approved" ? "success" : "outline"}>{task.status.replaceAll("_", " ")}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tasksAssignedToMe.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Tasks you&apos;re helping with</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {tasksAssignedToMe.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-md border border-border p-4 text-sm">
                <div>
                  <p className="font-medium">For {task.serviceRequest?.person.fullName}</p>
                  <p className="text-muted-foreground">{task.serviceRequest?.title}</p>
                </div>
                <Badge variant="outline">{PERMISSION_LABELS[task.permissionTier]}</Badge>
                <Badge variant={task.status === "approved" ? "success" : "outline"}>{task.status.replaceAll("_", " ")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {pending.length === 0 && decided.length === 0 && tasksAssignedToMe.length === 0 && (
        <EmptyState title="No delegated access set up yet" description="Invite someone above once you have an open request to delegate." />
      )}
    </div>
  );
}
