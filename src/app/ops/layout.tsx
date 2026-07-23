import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isOpsRole } from "@/lib/roles";
import { OpsNav } from "@/components/domain/ops-nav";
import { AppTopbar } from "@/components/domain/app-topbar";
import { MobileNavDrawer } from "@/components/domain/mobile-nav-drawer";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isOpsRole(user.primaryRole)) redirect("/home");

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar
        displayName={user.displayName}
        roleKey={user.primaryRole}
        contextLabel={user.institution?.name ?? "Government"}
        homeHref="/ops"
        navSlot={
          <MobileNavDrawer title="Suvidha Ops">
            <OpsNav />
          </MobileNavDrawer>
        }
      />
      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block">
          <OpsNav />
        </aside>
        <main className="flex-1 bg-background px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
