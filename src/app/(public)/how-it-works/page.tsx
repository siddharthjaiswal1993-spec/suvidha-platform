import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExecutionMethodBadge } from "@/components/domain/execution-method-badge";

export const metadata = { title: "How it works" };

const METHODS = [
  "executable_via_api",
  "initiable_via_integration",
  "deep_link_redirect",
  "generated_form_packet",
  "assisted_digital_workflow",
  "in_person_required",
  "requires_institution_approval",
  "requires_legal_intervention",
  "unsupported",
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold">How Suvidha works</h1>
      <p className="mt-4 text-muted-foreground">
        Suvidha does not replace your bank, the Income Tax Department, or Aadhaar. They stay the
        authoritative system of record for their own data. Suvidha is the layer that helps you see
        across all of them, act where it can, and honestly tell you what still needs a branch
        visit or an institution&apos;s approval.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">1. Build your profile once</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Connect (simulated) sources, or enter details manually. Suvidha shows you where your
            name, address, or contact details disagree across institutions — without deciding
            which one is &quot;right&quot; for you.
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">2. See your institutional graph</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Every government, banking, insurance, investment, employer, and utility relationship in
            one place — with its status, nominee summary, renewal date, and last-synced time.
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">3. Act through one request engine</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Address changes, nominee updates, document renewals, tax rectifications — tracked with
            both Suvidha&apos;s plain-language status and the institution&apos;s own original status,
            side by side.
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">4. Prepare for succession, without dread</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Trusted Contacts, wills, nominations, and — when the time comes — a guided, humane
            claims journey for your family. See <a className="underline" href="/roles-and-terms">roles &amp; terms</a>.
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-12 text-lg font-semibold">Every action discloses how it actually happens</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        We never claim a service is instantly digitally executable when it isn&apos;t. Every request
        and life-event action carries one of these labels:
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {METHODS.map((m) => <ExecutionMethodBadge key={m} method={m} />)}
      </div>
    </div>
  );
}
