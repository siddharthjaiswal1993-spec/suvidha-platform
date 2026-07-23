import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revokeTrustedContact } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const metadata = { title: "Estate planning" };

export default async function EstatePlanningPage() {
  const user = await getCurrentUser();
  const personId = user!.personId!;

  const [estatePlan, assets, liabilities, wills, trustedContacts] = await Promise.all([
    prisma.estatePlan.findUnique({ where: { personId }, include: { reminders: true } }),
    prisma.asset.findMany({ where: { holdings: { some: { personId } }, deletedAt: null }, include: { institution: true, nominations: true } }),
    prisma.liability.findMany({ where: { personId, deletedAt: null } }),
    prisma.willRecord.findMany({ where: { testatorPersonId: personId }, include: { executorAppointments: { include: { executorPerson: true } } } }),
    prisma.trustedContact.findMany({ where: { grantorPersonId: personId }, include: { holder: true, accessGrants: { include: { accessPolicy: true } } } }),
  ]);

  const assetsWithNomination = assets.filter((a) => a.nominations.length > 0).length;
  const gaps = assets.filter((a) => a.nominations.length === 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Estate planning</h1>
        <p className="mt-1 text-muted-foreground">Readiness is measured by completeness, never by the value of what you own.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Estate readiness</CardTitle></CardHeader>
        <CardContent>
          <Progress value={estatePlan?.readinessScore ?? 0} />
          <p className="mt-2 text-sm text-muted-foreground">{estatePlan?.readinessScore ?? 0}% ready · {assetsWithNomination}/{assets.length} assets have a nominee on file · {wills.length > 0 ? "Will recorded" : "No will recorded"}</p>
          {estatePlan?.emergencyInstructions && (
            <div className="mt-4 rounded-md border border-border bg-muted/50 p-3 text-sm">
              <p className="font-medium">Emergency instructions</p>
              <p className="mt-1 text-muted-foreground">{estatePlan.emergencyInstructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="nominations">
        <TabsList>
          <TabsTrigger value="nominations">Nomination coverage</TabsTrigger>
          <TabsTrigger value="assets">Assets & liabilities</TabsTrigger>
          <TabsTrigger value="trusted">Trusted Contacts</TabsTrigger>
          <TabsTrigger value="will">Will & executor</TabsTrigger>
        </TabsList>

        <TabsContent value="nominations" className="space-y-3">
          {gaps.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> Every tracked asset has a nominee on file.</p>
          ) : (
            gaps.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border border-warning/40 bg-warning/5 p-3 text-sm">
                <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> {a.label} has no nominee on record</span>
                <Badge variant="warning">Action needed</Badge>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Assets</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {assets.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                  <div><p className="font-medium">{a.label}</p><p className="text-xs text-muted-foreground">{a.institution?.name}</p></div>
                  <Badge variant={a.nominations.length > 0 ? "success" : "warning"}>{a.nominations.length > 0 ? a.nominations[0].nomineeNameOnRecord : "No nominee"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Liabilities</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {liabilities.length === 0 && <p className="text-sm text-muted-foreground">None on file.</p>}
              {liabilities.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm"><span>{l.label}</span><span className="text-muted-foreground">{l.outstandingAmountBand}</span></div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trusted" className="space-y-3">
          {trustedContacts.map((tc) => {
            async function revoke() { "use server"; await revokeTrustedContact(tc.id); }
            return (
              <Card key={tc.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{tc.holder.fullName} {tc.label ? `(${tc.label})` : ""}</CardTitle>
                    <CardDescription>Status: {tc.status}</CardDescription>
                  </div>
                  <Badge variant={tc.status === "active" ? "success" : "outline"}>{tc.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tc.accessGrants.map((g) => (
                    <p key={g.id} className="text-sm text-muted-foreground">
                      {g.accessPolicy.visibilityLevel.replaceAll("_", " ")} — {g.accessPolicy.timingRule.replaceAll("_", " ")}
                      {g.accessPolicy.waitingPeriodDays ? ` (${g.accessPolicy.waitingPeriodDays}-day wait)` : ""}
                    </p>
                  ))}
                  <p className="text-xs text-muted-foreground">This is a platform access permission only — never nomination, executorship, or ownership.</p>
                  {tc.status === "active" && (
                    <form action={revoke}><Button type="submit" variant="outline" size="sm">Revoke access</Button></form>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="will" className="space-y-3">
          {wills.length === 0 && <p className="text-sm text-muted-foreground">No will recorded yet.</p>}
          {wills.map((w) => (
            <Card key={w.id}>
              <CardHeader>
                <CardTitle className="text-base">Will — executed {w.executionDate ? formatDate(w.executionDate) : "date unknown"}</CardTitle>
                <CardDescription>{w.registrationStatus} · {w.storageStatus.replaceAll("_", " ")}</CardDescription>
              </CardHeader>
              <CardContent>
                {w.executorAppointments.map((e) => (
                  <p key={e.id} className="text-sm">Executor: {e.executorPerson?.fullName ?? e.executorNameOnRecord} {e.isPrimary && <Badge variant="outline" className="ml-1">Primary</Badge>}</p>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
