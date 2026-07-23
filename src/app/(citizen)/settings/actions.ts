"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function updateLanguagePreference(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.personId) throw new Error("Not authenticated");

  const preferredLanguage = String(formData.get("preferredLanguage"));
  await prisma.citizenProfile.update({ where: { personId: user.personId }, data: { preferredLanguage } });
  revalidatePath("/settings");
}
