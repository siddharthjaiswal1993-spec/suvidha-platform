import "server-only";
import { prisma } from "@/lib/db";
import { toJsonColumn } from "@/lib/json";

/**
 * Append-only audit logging. Never update or delete an AuditEvent row from application code —
 * see the model comment in prisma/schema.prisma and docs/SECURITY.md for why (tamper-evidence).
 * Never pass raw sensitive identifiers into `metadata` — only masked values, ids, and labels.
 */
export async function logAudit(input: {
  actorUserId?: string | null;
  actorRole?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  claimId?: string | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditEvent.create({
    data: {
      actorUserId: input.actorUserId ?? undefined,
      actorRole: input.actorRole ?? undefined,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      claimId: input.claimId ?? undefined,
      correlationId: input.correlationId ?? undefined,
      metadata: input.metadata ? toJsonColumn(input.metadata) : undefined,
    },
  });
}
