import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isOpsRole } from "@/lib/roles";
import { CitizenNav } from "@/components/domain/citizen-nav";
import { AppTopbar } from "@/components/domain/app-topbar";

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (isOpsRole(user.primaryRole)) redirect("/ops");

  return (
    <div className="flex min-h-screen flex-col">
      <AppTopbar displayName={user.displayName} roleKey={user.primaryRole} />
      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block">
          <CitizenNav />
        </aside>
        <main className="flex-1 bg-background px-6 py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
