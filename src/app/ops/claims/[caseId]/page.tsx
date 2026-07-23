import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { recordDecision, raiseDeficiency, recordPayoutAndClose } from "./actions";
import { evaluateAuthorityPathway, type AuthorityFacts } from "@/lib/engines/authority-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

export default async function ClaimCaseWorkspacePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const user = await getCurrentUser();

  const claim = await prisma.claim.findUnique({
    where: { id: caseId },
    include: {
      institution: true,
      claimant: { include: { person: true } },
      estate: { include: { person: true, disputes: true, courtOrders: true } },
      claimAssets: { include: { asset: { include: { nominations: true, jointHolders: true } } } },
      submittedEvidence: { include: { legalDocument: true } },
      deficiencyRequests: true,
      decisions: { include: { decidedByUser: true }, orderBy: { createdAt: "asc" } },
      fraudSignals: true,
      payments: true,
    },
  });
  if (!claim) notFound();

  const asset = claim.claimAssets[0]?.asset;
  const facts: AuthorityFacts = {
    assetCategory: asset?.category ?? "bank_deposit",
    ownershipType: asset?.jointHolders.length ? "joint_either_or_survivor" : "sole",
    hasActiveNomination: (asset?.nominations.length ?? 0) > 0,
    nomineeIsMinor: asset?.nominations.some((n) => n.isMinor) ?? false,
    hasWill: claim.estate.succession === "testamentary",
    hasExecutor: claim.claimant.claimedRole === "executor",
    hasTrust: false,
    claimantRole: claim.claimant.claimedRole as AuthorityFacts["claimantRole"],
    claimantCount: 1,
    hasCourtOrder: claim.estate.courtOrders.length > 0,
    hasDispute: claim.estate.disputes.some((d) => d.status !== "resolved" && d.status !== "dismissed"),
    isMissingPersonCase: false,
    isForeignResidentClaimant: false,
    deathOutsideIndia: false,
  };
  const recommendation = evaluateAuthorityPathway(facts);

  async function decide(formData: FormData) { "use server"; await recordDecision(caseId, formData); }
  async function deficiency(formData: FormData) { "use server"; await raiseDeficiency(caseId, formData); }
  async function payout(formData: FormData) { "use server"; await recordPayoutAndClose(caseId, formData); }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground"><Link href="/ops/claims" className="underline">Claim queue</Link> / {claim.claimNumber}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{claim.claimNumber} — {claim.claimant.person.fullName}</h1>
        <Badge variant={["settled", "approved"].includes(claim.status) ? "success" : "outline"}>{claim.status.replaceAll("_", " ")}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Claimant &amp; authority</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>Role claimed: {claim.claimant.claimedRole.replaceAll("_", " ")}</p>
          <p>Relation to deceased: {claim.claimant.relationToDeceased}</p>
          <p>Identity verified: {claim.claimant.identityVerified ? "Yes" : "No"}</p>
          <p>Pre-authorised (Trusted Contact): {claim.claimant.wasPreAuthorised ? "Yes" : "No"}</p>
          <p>Estate of: {claim.estate.person.fullName}</p>
          <p>Succession: {claim.estate.succession}</p>
        </CardContent>
      </Card>

      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle className="text-base">Authority-pathway recommendation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="font-medium">{recommendation.output.replaceAll("_", " ")}</p>
          <p className="text-muted-foreground">{recommendation.rationale}</p>
          <div className="flex gap-2">
            {recommendation.requiresHumanEscalation && <Badge variant="warning">Requires human/legal escalation</Badge>}
            {recommendation.requiresOtherClaimantParticipation && <Badge variant="outline">Other claimants must participate</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            This is decision support only — it never declares final legal ownership. See docs/AUTHORITY_RULES.md.
          </p>
        </CardContent>
      </Card>

      {claim.fraudSignals.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader><CardTitle className="text-base">Fraud signals</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {claim.fraudSignals.map((f) => (
              <p key={f.id}><Badge variant="destructive">{f.signalType.replaceAll("_", " ")}</Badge> {f.details} — status: {f.status}</p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Submitted evidence</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {claim.submittedEvidence.map((e) => (
            <p key={e.id} className="text-sm">{e.evidenceLabel} {e.reusedFromClaimId && <Badge variant="outline" className="ml-1">Reused from another claim</Badge>}</p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Maker-checker decision</CardTitle></CardHeader>
        <CardContent>
          <form action={decide} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="makerCheckerRole">Acting as</Label>
                <Select name="makerCheckerRole" defaultValue={user?.primaryRole === "checker" ? "checker" : "maker"}>
                  <SelectTrigger id="makerCheckerRole"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maker">Maker</SelectItem>
                    <SelectItem value="checker">Checker</SelectItem>
                    <SelectItem value="adjudicator">Adjudicator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="outcome">Outcome</Label>
                <Select name="outcome" defaultValue="recommend_approve">
                  <SelectTrigger id="outcome"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommend_approve">Recommend approve</SelectItem>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="partial_approve">Partial approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="escalate">Escalate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label htmlFor="rationale">Rationale</Label><Textarea id="rationale" name="rationale" /></div>
            <Button type="submit" size="sm">Record decision</Button>
          </form>
          <div className="mt-4 space-y-2">
            {claim.decisions.map((d) => (
              <div key={d.id} className="rounded-md border border-border p-3 text-sm">
                <Badge variant="outline">{d.makerCheckerRole}</Badge> {d.decidedByUser?.displayName} — {d.outcome.replaceAll("_", " ")}
                {d.rationale && <p className="mt-1 text-xs text-muted-foreground">{d.rationale}</p>}
                <p className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Request a missing document</CardTitle></CardHeader>
        <CardContent>
          <form action={deficiency} className="space-y-3">
            <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" name="title" required /></div>
            <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" required /></div>
            <Button type="submit" size="sm" variant="outline">Send deficiency request</Button>
          </form>
          {claim.deficiencyRequests.map((d) => (
            <div key={d.id} className="mt-3 rounded-md border border-border p-3 text-sm">
              <p className="font-medium">{d.title}</p>
              <Badge variant={d.status === "open" ? "warning" : "success"}>{d.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {claim.status === "approved" && claim.payments.length === 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Record payout and close case</CardTitle></CardHeader>
          <CardContent>
            <form action={payout} className="space-y-3">
              <div className="space-y-2"><Label htmlFor="amountBand">Payout amount band</Label><Input id="amountBand" name="amountBand" placeholder="₹5,00,000 – ₹10,00,000" required /></div>
              <Button type="submit" size="sm">Record payout &amp; close case</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
