import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoDataBadge } from "@/components/domain/demo-data-badge";

export const metadata = { title: "Privacy & security" };

export default function PrivacySecurityPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Privacy &amp; security</h1>
        <DemoDataBadge />
      </div>
      <p className="mt-4 text-muted-foreground">
        This is a prototype. Every person, document, account, and message you see is synthetic.
        Nothing here is a real Aadhaar number, PAN, passport, bank account, or insurance policy.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Masked identifiers, always</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Every identifier shown anywhere in Suvidha is masked (e.g. &quot;XXXX XXXX 4821&quot;). Full
            identifiers are never displayed, logged, or exported.
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Consent is specific and revocable</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Every data-sharing consent names its purpose and institution scope, and can be revoked
            at any time from the Consent Centre. Revoking access takes effect immediately.
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Progressive disclosure</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            A claimant reporting a death does not automatically see account balances. Information
            is revealed only as verified role, purpose, and authority allow.
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Full audit trail</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Every sensitive action — access grants, claim decisions, corrections — is logged in an
            append-only audit record, viewable by Auditor-role users in the operations console.
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        For the full technical detail — threat model, access-control matrix, retention policy — see
        <code> docs/SECURITY.md</code>, <code>docs/PRIVACY.md</code>, and{" "}
        <code>docs/THREAT_MODEL.md</code> in the repository.
      </p>
    </div>
  );
}
