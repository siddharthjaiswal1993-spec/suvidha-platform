import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Help & grievances" };

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Help &amp; grievances</h1>
      <p className="mt-4 text-muted-foreground">
        If you&apos;re signed in, the fastest way to raise an issue is from Help &amp; Grievances inside
        your dashboard — it links your grievance directly to the request or institution it concerns.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Something looks wrong with my data</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Use the Profile Consistency view to flag a discrepancy, or raise a correction request directly at the source institution.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">A request is stuck or overdue</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Open the request&apos;s status timeline — every stalled request has a one-click escalation into a grievance.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">I think I&apos;ve been incorrectly marked deceased</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">This is treated as urgent. See the false-death correction workflow in Legacy &amp; Succession, or contact the registrar directly.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">I received a suspicious message</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Do not act on it. Report it from your Inbox — messages are already flagged when the sender can&apos;t be verified.</CardContent>
        </Card>
      </div>
    </div>
  );
}
