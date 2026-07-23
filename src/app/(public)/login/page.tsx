import { prisma } from "@/lib/db";
import { loginAsDemoUser } from "@/lib/auth-actions";
import { ROLE_LABELS, isOpsRole, type RoleKey } from "@/lib/roles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Demo login" };

export default async function LoginPage() {
  const users = await prisma.user.findMany({
    include: { person: true, institution: true },
    orderBy: { primaryRole: "asc" },
  });

  const citizenUsers = users.filter((u) => !isOpsRole(u.primaryRole));
  const opsUsers = users.filter((u) => isOpsRole(u.primaryRole));

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Demo login</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        There are no real passwords in this prototype. Pick any seeded persona below to see
        Suvidha from their point of view — see{" "}
        <a className="underline" href="/roles-and-terms">roles &amp; terms</a> for what each role
        means, and <code>docs/SECURITY.md</code> in the repository for why this is intentionally
        not real authentication.
      </p>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Citizen-side personas
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {citizenUsers.map((u) => (
          <Card key={u.id}>
            <CardHeader>
              <CardTitle className="text-base">{u.displayName}</CardTitle>
              <CardDescription>
                <Badge variant="outline">{ROLE_LABELS[u.primaryRole as RoleKey] ?? u.primaryRole}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={loginAsDemoUser.bind(null, u.id)}>
                <Button type="submit" className="w-full">
                  Continue as {u.displayName.split(" ")[0]}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Government & institution ops personas
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {opsUsers.map((u) => (
          <Card key={u.id}>
            <CardHeader>
              <CardTitle className="text-base">{u.displayName}</CardTitle>
              <CardDescription>
                <Badge variant="outline">{ROLE_LABELS[u.primaryRole as RoleKey] ?? u.primaryRole}</Badge>
                {u.institution ? <span className="ml-2">{u.institution.name}</span> : null}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={loginAsDemoUser.bind(null, u.id)}>
                <Button type="submit" variant="secondary" className="w-full">
                  Continue as {u.displayName.split(" ")[0]}
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
