import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata = { title: "Eligibility & document guide" };

const GUIDES = [
  { title: "Address update at a bank", docs: ["Any current, verified address-proof document"], notes: "Usually completed online; some banks require a follow-up branch confirmation for high-value accounts." },
  { title: "Nominee addition or change", docs: ["Identity proof of the nominee", "Guardian details if the nominee is a minor"], notes: "Almost always completable online or via a generated form." },
  { title: "Document renewal (e.g. driving licence)", docs: ["Existing document", "Recent photograph", "Address proof if changed"], notes: "Often requires an in-person step depending on your state's RTO digitisation level." },
  { title: "Bank deposit claim — nominee", docs: ["Death certificate", "Nominee identity proof", "Claim form"], notes: "Straightforward when the nomination is valid and undisputed." },
  { title: "Bank deposit claim — no nomination, multiple heirs", docs: ["Death certificate", "Succession certificate or legal-heir certificate", "NOCs from other heirs (if applicable)"], notes: "Requires more documentation and typically a longer institution review." },
  { title: "Insurance claim — nominee", docs: ["Death certificate", "Original policy document", "Nominee identity & bank details"], notes: "Usually processed within the insurer's published SLA once documents are complete." },
];

export default function EligibilityGuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Eligibility &amp; document guide</h1>
      <p className="mt-4 text-muted-foreground">
        A general guide to what&apos;s typically needed. Suvidha shows the exact, institution-specific
        checklist once you start a request — this page is oriented for first-time visitors.
      </p>
      <div className="mt-8 grid gap-4">
        {GUIDES.map((g) => (
          <Card key={g.title}>
            <CardHeader>
              <CardTitle className="text-base">{g.title}</CardTitle>
              <CardDescription>{g.notes}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                {g.docs.map((d) => <li key={d}>{d}</li>)}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
