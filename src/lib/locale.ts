import "server-only";
import { prisma } from "@/lib/db";
import type { Locale } from "@/lib/i18n";

export async function getPreferredLocale(personId: string | null | undefined): Promise<Locale> {
  if (!personId) return "en";
  const profile = await prisma.citizenProfile.findUnique({ where: { personId }, select: { preferredLanguage: true } });
  return profile?.preferredLanguage === "hi" ? "hi" : "en";
}
