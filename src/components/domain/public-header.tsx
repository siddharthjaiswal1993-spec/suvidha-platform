import Link from "next/link";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/roles-and-terms", label: "Roles & terms" },
  { href: "/privacy-security", label: "Privacy & security" },
  { href: "/eligibility-guide", label: "Eligibility guide" },
  { href: "/support", label: "Help" },
];

export function PublicHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
          Suvidha
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm">
          <Link href="/login">Demo login</Link>
        </Button>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card py-8 text-sm text-muted-foreground">
      <div className="mx-auto max-w-6xl px-6">
        <p>
          Suvidha is a portfolio prototype. All data shown is synthetic. No real Aadhaar, PAN,
          passport, bank, or policy information is used or stored anywhere in this application.
          Institution names for private banks, insurers, and asset managers are invented; where
          real government bodies are named (UIDAI, Income Tax Department, Parivahan, EPFO,
          Registrar General), no real API of theirs is called — see{" "}
          <Link href="/privacy-security" className="underline">
            Privacy &amp; security
          </Link>{" "}
          and the <code>docs/</code> folder in the repository for the full real-vs-simulated
          breakdown.
        </p>
      </div>
    </footer>
  );
}
