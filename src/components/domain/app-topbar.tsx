import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth-actions";
import { ROLE_LABELS, type RoleKey } from "@/lib/roles";

export function AppTopbar({
  displayName,
  roleKey,
  contextLabel,
}: {
  displayName: string;
  roleKey: string;
  contextLabel?: string;
}) {
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
      <div className="flex items-center gap-3">
        <Link href="/home" className="font-semibold text-primary">Suvidha</Link>
        <Badge variant="demo">Demo data</Badge>
        {contextLabel ? <span className="text-sm text-muted-foreground">{contextLabel}</span> : null}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">{ROLE_LABELS[roleKey as RoleKey] ?? roleKey}</p>
        </div>
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">Sign out</Button>
        </form>
      </div>
    </header>
  );
}
