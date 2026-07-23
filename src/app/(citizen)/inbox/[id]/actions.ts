"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";

async function ownedThread(threadId: string, personId: string | null | undefined) {
  const thread = await prisma.inboxThread.findUnique({ where: { id: threadId } });
  if (!thread || thread.personId !== personId) throw new Error("Thread not found.");
  return thread;
}

export async function replyToThread(threadId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.personId) throw new Error("Not authenticated as a citizen.");
  await ownedThread(threadId, user.personId);

  const body = String(formData.get("body") || "").trim();
  if (!body) throw new Error("Please enter a reply.");

  const message = await prisma.message.create({
    data: {
      inboxThreadId: threadId,
      senderLabel: user.displayName,
      senderVerified: true,
      direction: "citizen_to_institution",
      originalBody: body,
      channel: "in_app",
    },
  });

  await logAudit({ actorUserId: user.id, entityType: "Message", entityId: message.id, action: "inbox.replied" });
  revalidatePath(`/inbox/${threadId}`);
}

export async function markMessageSuspicious(messageId: string, threadId: string) {
  const user = await getCurrentUser();
  if (!user?.personId) throw new Error("Not authenticated as a citizen.");
  await ownedThread(threadId, user.personId);

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.inboxThreadId !== threadId) throw new Error("Message not found.");

  await prisma.message.update({ where: { id: messageId }, data: { reportedSuspiciousAt: new Date() } });
  await logAudit({ actorUserId: user.id, entityType: "Message", entityId: messageId, action: "inbox.reported_suspicious" });
  revalidatePath(`/inbox/${threadId}`);
}

export async function escalateThreadToGrievance(threadId: string) {
  const user = await getCurrentUser();
  if (!user?.personId) throw new Error("Not authenticated as a citizen.");
  const thread = await ownedThread(threadId, user.personId);

  const grievance = await prisma.grievance.create({
    data: {
      raisedByPersonId: user.personId,
      institutionId: thread.institutionId,
      subject: `Escalated from inbox: ${thread.subject}`,
      description: `Escalated from an inbox thread ("${thread.subject}") the citizen felt needed formal follow-up.`,
      status: "open",
      sourceInboxThreadId: threadId,
    },
  });

  await logAudit({ actorUserId: user.id, entityType: "Grievance", entityId: grievance.id, action: "grievance.raised_from_inbox" });
  revalidatePath(`/inbox/${threadId}`);
  revalidatePath("/help");
  return grievance.id;
}
