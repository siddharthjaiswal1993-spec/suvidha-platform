import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * Mock demo authentication. This is intentionally NOT real auth: there are no passwords, no
 * signed tokens, and no MFA. A cookie holds a plain user id, and the demo login screen lets you
 * pick any seeded persona. See docs/SECURITY.md for exactly what a production login would need
 * instead (real credential verification, step-up auth for sensitive actions, session/device
 * management) and README.md's "Known limitations" section.
 */
const SESSION_COOKIE = "suvidha_session";

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    include: { person: true, institution: true },
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated — this should be caught by proxy.ts route protection");
  }
  return user;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
