import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export const metadata = { title: "Roles & terms" };

const ROLES: Array<[string, string]> = [
  ["Independent Citizen", "A person managing their own records, institutions, requests, documents, deadlines, and life events."],
  ["Family Administrator", "A family member helping a parent, child, spouse, or dependant with permitted administrative work — never full, unrestricted access."],
  ["Assisted Citizen", "An older adult, a person with a disability, or a low-digital-literacy user who delegates limited assistance."],
  ["Parent / Guardian", "Manages records and services for a minor or dependant."],
  ["Professional Representative", "A CA, lawyer, or adviser handling specifically delegated tasks under an explicit permission tier — never implied power of attorney."],
  ["Estate Planner", "A living person organising nominations, Trusted Contacts, documents, and succession readiness."],
  ["Trusted Contact", "A platform access role only. Never nomination, executorship, or ownership."],
  ["Nominee", "An asset-specific nomination registered at an institution."],
  ["Beneficiary", "A person entitled under a policy, will, trust, or similar instrument."],
  ["Surviving Joint Holder", "A co-holder of a joint account, whose rights depend on the account's operating mandate."],
  ["Executor", "Appointed under a will to administer the estate."],
  ["Administrator", "Appointed by a competent authority or court where there is no executor."],
  ["Legal Heir", "A person entitled to inherit under succession law, determined by relationship and applicable personal law."],
  ["Claimant", "Anyone submitting a claim against an estate, under any of the above roles."],
  ["Guardian", "Acting for a minor or legally dependent claimant."],
];

export default function RolesAndTermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Roles &amp; terms</h1>
      <p className="mt-4 text-muted-foreground">
        Suvidha uses precise terminology because a platform permission is never the same thing as
        legal ownership or inheritance entitlement. This page is the plain-language version of{" "}
        <code>docs/TERMINOLOGY.md</code> in the repository.
      </p>
      <div className="mt-8 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Role</TableHead><TableHead>What it means</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {ROLES.map(([role, desc]) => (
              <TableRow key={role}>
                <TableCell className="font-medium">{role}</TableCell>
                <TableCell className="text-muted-foreground">{desc}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        We never use terms like &quot;universal nominee,&quot; &quot;automatic inheritor,&quot; or imply that a
        Trusted Contact can log in as the deceased person. A platform permission is never legal
        authority.
      </p>
    </div>
  );
}
