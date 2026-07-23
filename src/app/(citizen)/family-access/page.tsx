import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decideDelegatedTask } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

  const tasksAssignedToMe = await prisma.delegatedTask.findMany({
    where: { assistantPersonId: personId },
    include: { serviceRequest: { include: { person: true } } },
  });

  const tasksIOwn = await prisma.delegatedTask.findMany({
    where: { serviceRequest: { personId }, NOT: { assistantPersonId: personId } },
    include: { assistantPerson: true, serviceRequest: true },
  });

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

      {tasksIOwn.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Awaiting your approval</CardTitle>
            <CardDescription>Nothing above &quot;assist&quot; happens without your explicit confirmation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksIOwn.map((task) => {
              async function approve() { "use server"; await decideDelegatedTask(task.id, "approved"); }
              async function reject() { "use server"; await decideDelegatedTask(task.id, "rejected"); }
              return (
                <div key={task.id} className="flex items-center justify-between rounded-md border border-border p-4">
                  <div>
                    <p className="font-medium">{task.assistantPerson.fullName} wants to {PERMISSION_LABELS[task.permissionTier]?.toLowerCase()}</p>
                    {task.serviceRequest && <p className="text-sm text-muted-foreground">Request: {task.serviceRequest.title}</p>}
                    <Badge variant="outline" className="mt-1">{task.status.replaceAll("_", " ")}</Badge>
                  </div>
                  {task.status === "pending_owner_approval" && (
                    <div className="flex gap-2">
                      <form action={reject}><Button type="submit" variant="outline" size="sm">Decline</Button></form>
                      <form action={approve}><Button type="submit" size="sm">Approve</Button></form>
                    </div>
                  )}
                </div>
              );
            })}
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

      {tasksIOwn.length === 0 && tasksAssignedToMe.length === 0 && (
        <p className="text-sm text-muted-foreground">No delegated access set up yet.</p>
      )}
    </div>
  );
}
