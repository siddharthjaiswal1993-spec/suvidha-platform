"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home, User, Building2, FileText, ListChecks, Inbox, CalendarClock,
  Landmark, Users, Shield, HelpCircle, Lock, Settings, Sparkles,
} from "lucide-react";

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/institutions", label: "My Institutions", icon: Building2 },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/requests", label: "Requests", icon: ListChecks },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/life-events", label: "Life Events", icon: CalendarClock },
  { href: "/financial", label: "Financial Administration", icon: Landmark },
  { href: "/family-access", label: "Family & Delegated Access", icon: Users },
  { href: "/legacy", label: "Legacy & Succession", icon: Shield },
  { href: "/assistant", label: "Life Admin Assistant", icon: Sparkles },
  { href: "/help", label: "Help & Grievances", icon: HelpCircle },
  { href: "/consent", label: "Privacy & Consent", icon: Lock },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function CitizenNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
