import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkForProfileUpdates } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate, formatDateTime } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { getPreferredLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const personId = user!.personId!;
  const locale = await getPreferredLocale(personId);

  const [person, profile, identifiers, addresses, contactMethods] = await Promise.all([
    prisma.person.findUnique({ where: { id: personId } }),
    prisma.citizenProfile.findUnique({
      where: { personId },
      include: {
        fieldValues: { include: { profileField: true, sourceInstitution: true }, orderBy: { createdAt: "desc" } },
        conflicts: { include: { profileField: true, primaryValue: true, alternateValue: true } },
      },
    }),
    prisma.personIdentifier.findMany({ where: { personId } }),
    prisma.address.findMany({ where: { personId } }),
    prisma.contactMethod.findMany({ where: { personId } }),
  ]);

  type FieldValue = NonNullable<typeof profile>["fieldValues"][number];
  const fieldValuesByField = new Map<string, FieldValue[]>();
  for (const fv of profile?.fieldValues ?? []) {
    const list = fieldValuesByField.get(fv.profileField.label) ?? [];
    list.push(fv);
    fieldValuesByField.set(fv.profileField.label, list);
  }

  async function resync() {
    "use server";
    await checkForProfileUpdates();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{person?.fullName}</h1>
          <p className="mt-1 text-muted-foreground">{t("profile_subtitle", locale)}</p>
        </div>
        <form action={resync}>
          <Button type="submit" size="sm" variant="outline"><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Check for updates</Button>
        </form>
      </div>

      <Tabs defaultValue="consistency">
        <TabsList>
          <TabsTrigger value="consistency">{t("profile_consistency_tab", locale)}</TabsTrigger>
          <TabsTrigger value="history">Field history</TabsTrigger>
          <TabsTrigger value="records">{t("profile_records_tab", locale)}</TabsTrigger>
        </TabsList>

        <TabsContent value="consistency">
          {!profile || profile.conflicts.length === 0 ? (
            <Card><CardContent className="pt-6 text-sm text-muted-foreground">{t("profile_no_discrepancies", locale)}</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {profile.conflicts.map((c) => (
                <Card key={c.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-4 w-4 text-warning" /> {c.profileField.label} {t("profile_differs_across_sources", locale)}
                    </CardTitle>
                    <CardDescription>
                      Suvidha doesn&apos;t decide which value is &quot;correct&quot; for every
                      purpose — review both and start a correction request where it matters.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs text-muted-foreground">{c.primaryValue.sourceLabel}</p>
                      <p className="mt-1 font-medium">{c.primaryValue.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Verified {formatDate(c.primaryValue.lastVerifiedAt)}</p>
                    </div>
                    <div className="rounded-md border border-border p-3">
                      <p className="text-xs text-muted-foreground">{c.alternateValue.sourceLabel}</p>
                      <p className="mt-1 font-medium">{c.alternateValue.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Verified {formatDate(c.alternateValue.lastVerifiedAt)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {fieldValuesByField.size === 0 && <p className="text-sm text-muted-foreground">No field history recorded yet.</p>}
          {Array.from(fieldValuesByField.entries()).map(([label, values]) => (
            <Card key={label}>
              <CardHeader>
                <CardTitle className="text-base">{label}</CardTitle>
                <CardDescription>Each source reports its own value independently — Suvidha never picks a single winner across sources. &quot;Current&quot; means the latest value reported by that source, not the one Suvidha considers correct.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {values.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                    <div>
                      <p className={v.isCurrentForSource ? "font-medium" : "text-muted-foreground line-through"}>{v.value}</p>
                      <p className="text-xs text-muted-foreground">{v.sourceLabel} · {v.provenance.replaceAll("_", " ")}{v.lastVerifiedAt ? ` · verified ${formatDateTime(v.lastVerifiedAt)}` : ""}</p>
                    </div>
                    {v.isCurrentForSource && <Badge variant="outline">Current for this source</Badge>}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="records" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Identifiers</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {identifiers.map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                  <span>{i.idType.replaceAll("_", " ").toUpperCase()}</span>
                  <span className="font-mono">{i.maskedValue}</span>
                  <Badge variant={i.verified ? "success" : "outline"}>{i.verified ? "Verified" : "Unverified"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Contact methods</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {contactMethods.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                  <span className="capitalize">{c.type}</span><span>{c.value}</span>
                  <Badge variant={c.verified ? "success" : "outline"}>{c.verified ? "Verified" : "Unverified"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Addresses</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {addresses.map((a) => (
                <div key={a.id} className="rounded-md border border-border p-3 text-sm">
                  <p className="text-xs uppercase text-muted-foreground">{a.label}</p>
                  <p>{a.line1}, {a.city}, {a.state} {a.pincode}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
