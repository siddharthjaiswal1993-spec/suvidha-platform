import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const personId = user!.personId!;

  const [person, profile, identifiers, addresses, contactMethods] = await Promise.all([
    prisma.person.findUnique({ where: { id: personId } }),
    prisma.citizenProfile.findUnique({
      where: { personId },
      include: { fieldValues: { include: { profileField: true, sourceInstitution: true } }, conflicts: { include: { profileField: true, primaryValue: true, alternateValue: true } } },
    }),
    prisma.personIdentifier.findMany({ where: { personId } }),
    prisma.address.findMany({ where: { personId } }),
    prisma.contactMethod.findMany({ where: { personId } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{person?.fullName}</h1>
        <p className="mt-1 text-muted-foreground">
          Your master profile — not itself an official record, but the one place that shows how
          your identity looks across every connected source.
        </p>
      </div>

      <Tabs defaultValue="consistency">
        <TabsList>
          <TabsTrigger value="consistency">Profile consistency</TabsTrigger>
          <TabsTrigger value="records">Identity records</TabsTrigger>
        </TabsList>

        <TabsContent value="consistency">
          {!profile || profile.conflicts.length === 0 ? (
            <Card><CardContent className="pt-6 text-sm text-muted-foreground">No discrepancies detected across your connected sources.</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {profile.conflicts.map((c) => (
                <Card key={c.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-4 w-4 text-warning" /> {c.profileField.label} differs across sources
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
