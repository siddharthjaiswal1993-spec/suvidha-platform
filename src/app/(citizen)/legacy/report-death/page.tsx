import { reportDeath } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Report a death" };

export default function ReportDeathPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Report a death</h1>
        <p className="mt-1 text-muted-foreground">
          We&apos;re sorry for your loss. This starts a supported process — it does not
          immediately freeze any account or determine legal inheritance. Take this at your own pace.
        </p>
      </div>

      <form action={reportDeath}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About the person who has died</CardTitle>
            <CardDescription>You can add supporting documents in the next step.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="fullName">Full name</Label><Input id="fullName" name="fullName" required /></div>
            <div className="space-y-2"><Label htmlFor="dateOfDeath">Date of death</Label><Input id="dateOfDeath" name="dateOfDeath" type="date" required /></div>
            <div className="space-y-2"><Label htmlFor="placeOfDeath">Place of death</Label><Input id="placeOfDeath" name="placeOfDeath" required /></div>
            <div className="space-y-2">
              <Label htmlFor="relationToDeceased">Your relationship to them</Label>
              <Select name="relationToDeceased" required>
                <SelectTrigger id="relationToDeceased"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spouse">Spouse</SelectItem>
                  <SelectItem value="Child">Child</SelectItem>
                  <SelectItem value="Parent">Parent</SelectItem>
                  <SelectItem value="Sibling">Sibling</SelectItem>
                  <SelectItem value="Other relative">Other relative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="claimedRole">Which role best describes you?</Label>
              <Select name="claimedRole" required>
                <SelectTrigger id="claimedRole"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="legal_heir">Legal heir (no will/nomination known)</SelectItem>
                  <SelectItem value="nominee">Registered nominee on an account</SelectItem>
                  <SelectItem value="executor">Named executor under a will</SelectItem>
                  <SelectItem value="other_claimant">Other claimant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Continue</Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
