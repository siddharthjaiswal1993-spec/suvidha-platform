import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, GitBranch, Layers } from "lucide-react";

const DOMAINS = [
  { letter: "A", title: "Master Profile", desc: "One canonical profile, with every discrepancy across institutions surfaced honestly." },
  { letter: "B", title: "Institutional Relationships", desc: "Every government, financial, employer, and utility relationship in one graph." },
  { letter: "C", title: "Document & Evidence Hub", desc: "Reuse a verified document instead of re-submitting it everywhere." },
  { letter: "D", title: "Unified Requests", desc: "One request engine across every institution, with the institution's own status always shown alongside ours." },
  { letter: "E", title: "Communication Centre", desc: "One inbox for notices, reminders, and alerts — explained in plain language." },
  { letter: "F", title: "Life-Event Orchestration", desc: "Moving house, marriage, a new job — one coordinated plan, not a scavenger hunt." },
  { letter: "G", title: "Financial Administration", desc: "KYC, nominations, maturities, and tax status — tracked, never held." },
  { letter: "H", title: "Delegated Access & Consent", desc: "Family help and professional representation, on your terms, always revocable." },
  { letter: "I", title: "Legacy & Succession", desc: "Estate planning, Trusted Contacts, and a full, humane claims journey after a death." },
];

export default function LandingPage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Badge variant="secondary" className="mb-6">Prototype · Demo data throughout</Badge>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          One secure place for your whole institutional life.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Suvidha helps you update your life once, understand everywhere it matters, complete the
          institutional actions that follow, and track the entire journey — from Aadhaar and PAN to
          banks, insurance, your employer, and eventually, succession for your family.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
          Institutions and government departments remain the system of record. Suvidha is the
          system of engagement — it never claims to instantly or automatically alter a record it
          doesn&apos;t own. Every action always shows exactly how it will actually get done.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/login">
              Try the demo <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/how-it-works">How it works</Link>
          </Button>
        </div>
      </section>

      <section className="border-y border-border bg-card py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-xl font-semibold">Nine domains, one platform</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Not a government-services directory, a document wallet, or a personal-finance
            dashboard — see <Link href="/how-it-works" className="underline">how it works</Link> for
            what makes this different.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAINS.map((d) => (
              <Card key={d.letter}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                      {d.letter}
                    </span>
                    {d.title}
                  </CardTitle>
                  <CardDescription>{d.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="flex gap-3">
            <Layers className="h-6 w-6 shrink-0 text-primary" />
            <div>
              <h3 className="font-medium">One graph, many systems of record</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your bank, your insurer, and Aadhaar all stay authoritative for their own data.
                Suvidha orchestrates across them — it never silently edits a government database.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <GitBranch className="h-6 w-6 shrink-0 text-primary" />
            <div>
              <h3 className="font-medium">Honest execution methods</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Every request shows whether it&apos;s done directly, needs a branch visit, or needs
                institution approval — never a false promise of instant completion.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <ShieldCheck className="h-6 w-6 shrink-0 text-primary" />
            <div>
              <h3 className="font-medium">Consent you can see and revoke</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Every data share is purpose-limited, logged, and revocable — see{" "}
                <Link href="/privacy-security" className="underline">Privacy &amp; security</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
