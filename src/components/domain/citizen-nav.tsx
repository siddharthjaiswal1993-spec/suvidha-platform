"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home, User, Building2, FileText, ListChecks, Inbox, CalendarClock,
  Landmark, Users, Shield, HelpCircle, Lock, Settings, Sparkles,
} from "lucide-react";
import { t, type Locale, type DictionaryKey } from "@/lib/i18n";
import { useMobileNavClose } from "./mobile-nav-drawer";

const NAV: Array<{ href: string; key: DictionaryKey; icon: typeof Home }> = [
  { href: "/home", key: "nav_home", icon: Home },
  { href: "/profile", key: "nav_profile", icon: User },
  { href: "/institutions", key: "nav_institutions", icon: Building2 },
  { href: "/documents", key: "nav_documents", icon: FileText },
  { href: "/requests", key: "nav_requests", icon: ListChecks },
  { href: "/inbox", key: "nav_inbox", icon: Inbox },
  { href: "/life-events", key: "nav_life_events", icon: CalendarClock },
  { href: "/financial", key: "nav_financial", icon: Landmark },
  { href: "/family-access", key: "nav_family_access", icon: Users },
  { href: "/legacy", key: "nav_legacy", icon: Shield },
  { href: "/assistant", key: "nav_assistant", icon: Sparkles },
  { href: "/help", key: "nav_help", icon: HelpCircle },
  { href: "/consent", key: "nav_consent", icon: Lock },
  { href: "/settings", key: "nav_settings", icon: Settings },
];

export function CitizenNav({ locale = "en" }: { locale?: Locale }) {
  const pathname = usePathname();
  const closeMobileNav = useMobileNavClose();
  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeMobileNav}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(item.key, locale)}
          </Link>
        );
      })}
    </nav>
  );
}
