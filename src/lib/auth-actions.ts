"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const OPS_ROLES = new Set([
  "registrar_officer",
  "institution_officer",
  "verification_officer",
  "maker",
  "checker",
  "adjudicator",
  "grievance_officer",
  "auditor",
  "integration_admin",
]);

export async function loginAsDemoUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Unknown demo user");

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  await logAudit({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    entityType: "User",
    entityId: user.id,
    action: "auth.demo_login",
  });

  if (OPS_ROLES.has(user.primaryRole)) {
    redirect("/ops");
  }
  redirect("/home");
}

export async function logout() {
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE_NAME)?.value;
  if (userId) {
    await logAudit({
      actorUserId: userId,
      entityType: "User",
      entityId: userId,
      action: "auth.logout",
    });
  }
  store.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
