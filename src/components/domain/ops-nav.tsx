"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ListChecks, Skull, ShieldQuestion, FolderKanban, MessageSquareWarning, ScrollText, Gauge } from "lucide-react";
import { useMobileNavClose } from "./mobile-nav-drawer";

// Ordered to reflect that this is a general institution/government console — service requests
// (address/mobile/nominee/etc.) lead, with the Legacy & Succession claims/death-event modules
// placed inside the same structure rather than dominating the navigation. See section 5 of the
// v2 product review this reorganisation responds to, and docs/ARCHITECTURE.md.
const NAV = [
  { href: "/ops", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/ops/requests", label: "Service Requests", icon: ListChecks },
  { href: "/ops/death-events", label: "Death-event inbox", icon: Skull },
  { href: "/ops/corrections", label: "Corrections queue", icon: ShieldQuestion },
  { href: "/ops/claims", label: "Claims & Succession", icon: FolderKanban },
  { href: "/ops/grievances", label: "Grievances", icon: MessageSquareWarning },
  { href: "/ops/sla", label: "SLA & Reporting", icon: Gauge },
  { href: "/ops/audit-log", label: "Audit log", icon: ScrollText },
];

export function OpsNav() {
  const pathname = usePathname();
  const closeMobileNav = useMobileNavClose();
  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
