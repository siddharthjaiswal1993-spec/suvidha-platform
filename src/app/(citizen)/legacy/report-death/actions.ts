"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function reportDeath(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.personId) throw new Error("Not authenticated");

  const fullName = String(formData.get("fullName"));
  const dateOfDeath = new Date(String(formData.get("dateOfDeath")));
  const placeOfDeath = String(formData.get("placeOfDeath"));
  const relationToDeceased = String(formData.get("relationToDeceased"));
  const claimedRole = String(formData.get("claimedRole"));

  const deceased = await prisma.person.create({
    data: { fullName, dateOfDeath, lifeStatus: "deceased_reported" },
  });

  const deathEvent = await prisma.deathEvent.create({
    data: {
      personId: deceased.id,
      status: "reported",
      dateOfDeath,
      placeOfDeath,
      informantRelation: relationToDeceased,
      informantName: user.displayName,
    },
  });

  const estate = await prisma.estate.create({
    data: { personId: deceased.id, deathEventId: deathEvent.id, status: "open", succession: "undetermined" },
  });

  await prisma.claimant.create({
    data: {
      estateId: estate.id,
      personId: user.personId,
      claimedRole,
      relationToDeceased,
      identityVerified: true,
      wasPreAuthorised: false,
    },
  });

  await logAudit({ actorUserId: user.id, entityType: "DeathEvent", entityId: deathEvent.id, action: "death_event.reported" });

  redirect(`/legacy/claim`);
}
