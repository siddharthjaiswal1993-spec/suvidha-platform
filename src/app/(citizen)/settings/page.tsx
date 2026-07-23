import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateLanguagePreference } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const profile = await prisma.citizenProfile.findUnique({ where: { personId: user!.personId! } });

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Session and preference settings for this demo account.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Language</CardTitle>
          <CardDescription>Suvidha&apos;s primary navigation and key surfaces are available in Hindi; more Indian languages can be added without restructuring the app — see docs/ACCESSIBILITY.md.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateLanguagePreference} className="space-y-4">
            <RadioGroup name="preferredLanguage" defaultValue={profile?.preferredLanguage ?? "en"} className="grid-flow-col justify-start gap-6">
              <div className="flex items-center gap-2"><RadioGroupItem value="en" id="lang-en" /><Label htmlFor="lang-en">English</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="hi" id="lang-hi" /><Label htmlFor="lang-hi">हिन्दी (Hindi)</Label></div>
            </RadioGroup>
            <Button type="submit" size="sm">Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">About this account</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Residency status: {profile?.residencyStatus ?? "—"}</p>
          <p>Citizenship: {profile?.citizenship ?? "—"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
