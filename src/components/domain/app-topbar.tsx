import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth-actions";
import { ROLE_LABELS, type RoleKey } from "@/lib/roles";
import { t, type Locale } from "@/lib/i18n";

export function AppTopbar({
  displayName,
  roleKey,
  contextLabel,
  locale = "en",
  homeHref = "/home",
  navSlot,
}: {
  displayName: string;
  roleKey: string;
  contextLabel?: string;
  locale?: Locale;
  homeHref?: string;
  navSlot?: React.ReactNode;
}) {
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        {navSlot}
        <Link href={homeHref} className="font-semibold text-primary">Suvidha</Link>
        <Badge variant="demo" className="hidden sm:inline-flex">{t("demo_data", locale)}</Badge>
        {contextLabel ? <span className="hidden text-sm text-muted-foreground sm:inline">{contextLabel}</span> : null}
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right leading-tight sm:block">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">{ROLE_LABELS[roleKey as RoleKey] ?? roleKey}</p>
        </div>
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">{t("sign_out", locale)}</Button>
        </form>
      </div>
    </header>
  );
}
