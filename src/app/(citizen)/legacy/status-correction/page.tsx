import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { submitReverification } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldAlert } from "lucide-react";

export const metadata = { title: "Status correction" };

export default async function StatusCorrectionPage() {
  const user = await getCurrentUser();
  const personId = user!.personId!;

  const deathEvent = await prisma.deathEvent.findUnique({
    where: { personId },
    include: { corrections: true, matches: { include: { institution: true } } },
  });

  if (!deathEvent) {
    return <p className="text-sm text-muted-foreground">No status issue found on your account.</p>;
  }

  const correction = deathEvent.corrections[0];
  const isResolved = deathEvent.status === "corrected";

  async function confirm() {
    "use server";
    await submitReverification(deathEvent!.id, personId);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        {isResolved ? <CheckCircle2 className="h-6 w-6 text-success" /> : <ShieldAlert className="h-6 w-6 text-destructive" />}
        <h1 className="text-2xl font-semibold">{isResolved ? "Your record has been corrected" : "A death record was incorrectly matched to you"}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What happened</CardTitle>
          <CardDescription>
            A death was reported with details similar to yours, and one institution flagged a
            possible match. Your account was not frozen — this is exactly the false-positive
            protection Suvidha is designed to demonstrate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Badge variant={isResolved ? "success" : "destructive"}>{deathEvent.status.replaceAll("_", " ")}</Badge>
          {deathEvent.matches.map((m) => (
            <div key={m.id} className="rounded-md border border-border p-3 text-sm">
              <p>{m.institution.name} — confidence {Math.round(m.confidenceScore * 100)}%</p>
              <Badge variant="outline" className="mt-1">{m.status.replaceAll("_", " ")}</Badge>
            </div>
          ))}
          {correction && <p className="text-sm text-muted-foreground">Correction status: {correction.status.replaceAll("_", " ")}</p>}
        </CardContent>
      </Card>

      {!isResolved && (
        <Card>
          <CardHeader><CardTitle className="text-base">Confirm your identity to correct this</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              In a production system, this step would require strong re-verification (a fresh
              identity check) before a Registrar Officer confirms the correction. In this
              prototype, confirming below simulates that full journey completing successfully.
            </p>
            <form action={confirm}>
              <Button type="submit">I confirm I am living — submit for correction</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {isResolved && (
        <p className="text-sm text-muted-foreground">
          All flagged institutions have been notified and any restrictions have been reversed. This
          entire episode remains in your audit history.
        </p>
      )}
    </div>
  );
}
