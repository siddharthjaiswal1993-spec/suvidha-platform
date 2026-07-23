import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revokeConsent } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Privacy & Consent" };

export default async function ConsentCentrePage() {
  const user = await getCurrentUser();
  const personId = user!.personId!;

  const [consents, auditEvents] = await Promise.all([
    prisma.consentRecord.findMany({ where: { personId }, include: { artefacts: true, consentScopes: { include: { consentPurpose: true } }, connector: true } }),
    prisma.auditEvent.findMany({ where: { actorUserId: user!.id }, orderBy: { createdAt: "desc" }, take: 15 }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Privacy &amp; Consent</h1>
        <p className="mt-1 text-muted-foreground">Every consent you&apos;ve granted, and your own recent activity — nothing here is hidden from you.</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Active consents</h2>
        {consents.map((c) => {
          async function revoke() { "use server"; await revokeConsent(c.id); }
          return (
            <Card key={c.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{c.purpose.replaceAll("_", " ")}</CardTitle>
                  <CardDescription>{c.connector?.displayName} · Granted {formatDate(c.grantedAt)}</CardDescription>
                </div>
                <Badge variant={c.status === "granted" ? "success" : "outline"}>{c.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {c.consentScopes.map((s) => <p key={s.id} className="text-sm text-muted-foreground">Scope: {s.consentPurpose.label}{s.scopedEntityLabel ? ` — ${s.scopedEntityLabel}` : ""}</p>)}
                {c.artefacts.map((a) => <p key={a.id} className="text-xs text-muted-foreground">Receipt #{a.receiptNumber}: {a.scopeSummary}</p>)}
                {c.status === "granted" && <form action={revoke}><Button type="submit" variant="outline" size="sm">Revoke</Button></form>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your recent activity (audit log)</h2>
        <div className="mt-3 space-y-1">
          {auditEvents.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
              <span>{e.action.replaceAll(".", " · ").replaceAll("_", " ")}</span>
              <span className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</span>
            </div>
          ))}
          {auditEvents.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}
