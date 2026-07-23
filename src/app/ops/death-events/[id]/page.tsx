import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { decideMatch, advanceDeathEventStatus } from "./actions";
import { fromJsonColumn } from "@/lib/json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default async function DeathEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.deathEvent.findUnique({
    where: { id },
    include: { person: true, evidence: { include: { document: true } }, matches: { include: { institution: true } }, corrections: true },
  });
  if (!event) notFound();

  async function verify() { "use server"; await advanceDeathEventStatus(id, "registrar_verified"); }
  async function markMatched() { "use server"; await advanceDeathEventStatus(id, "matched"); }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground"><Link href="/ops/death-events" className="underline">Death-event inbox</Link> / {event.person.fullName}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{event.person.fullName}</h1>
        <Badge variant="outline">{event.status.replaceAll("_", " ")}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Event details</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>Date of death: {formatDate(event.dateOfDeath)}</p>
          <p>Place: {event.placeOfDeath}</p>
          <p>Registration #: {event.registrationNumber ?? "Pending"}</p>
          <p>Informant: {event.informantName} ({event.informantRelation})</p>
        </CardContent>
      </Card>

      {event.evidence.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Evidence</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {event.evidence.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <span>{ev.document?.fileLabel ?? ev.evidenceType}</span>
                <Badge variant={ev.verificationStatus === "verified" ? "success" : "outline"}>{ev.verificationStatus}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Institution matching</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {event.matches.map((m) => {
            const factors = fromJsonColumn<string[]>(m.matchFactors, []);
            async function confirm() { "use server"; await decideMatch(m.id, id, "confirmed"); }
            async function reject() { "use server"; await decideMatch(m.id, id, "rejected"); }
            return (
              <div key={m.id} className="rounded-md border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{m.institution.name}</p>
                  <Badge variant={m.status === "confirmed" ? "success" : m.status === "rejected" ? "destructive" : m.status === "needs_human_review" ? "warning" : "outline"}>
                    {m.status.replaceAll("_", " ")}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Confidence: {Math.round(m.confidenceScore * 100)}% — {factors.join(", ")}</p>
                {m.status === "needs_human_review" || m.status === "suggested" ? (
                  <div className="mt-3 flex gap-2">
                    <form action={confirm}><Button type="submit" size="sm">Confirm match</Button></form>
                    <form action={reject}><Button type="submit" size="sm" variant="outline">Reject match</Button></form>
                  </div>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {event.corrections.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader><CardTitle className="text-base">Correction / dispute history</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {event.corrections.map((c) => (
              <p key={c.id}>{c.reason.replaceAll("_", " ")} — <Badge variant="outline">{c.status.replaceAll("_", " ")}</Badge></p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        {event.status === "reported" && <form action={verify}><Button type="submit" size="sm">Mark registrar-verified</Button></form>}
        {event.status === "registrar_verified" && <form action={markMatched}><Button type="submit" size="sm">Mark matched</Button></form>}
      </div>
    </div>
  );
}
