/**
 * Evaluates whether a Trusted Contact's AccessGrant is currently active, per docs/DELEGATED_ACCESS.md
 * and docs/ACCESS_CONTROL_MATRIX.md. A Trusted Contact grant is a platform-access permission only —
 * see docs/TERMINOLOGY.md's prohibited-terms list — it never implies nomination, executorship, or
 * ownership, and this function only ever answers "can they see something right now", never
 * "do they have a legal claim".
 */

export type TimingRule = "immediate" | "after_verified_death" | "after_waiting_period" | "requires_co_approval";

export type PermissionCheckInput = {
  grantStatus: "granted" | "revoked";
  timingRule: TimingRule;
  waitingPeriodDays: number | null;
  grantorLifeStatus: string; // Person.lifeStatus
  deathVerifiedAt: Date | null;
  coApprovalGranted?: boolean;
  now?: Date;
};

export type PermissionCheckResult = {
  isActive: boolean;
  reason: string;
};

export function evaluateAccessGrant(input: PermissionCheckInput): PermissionCheckResult {
  const now = input.now ?? new Date();

  if (input.grantStatus === "revoked") {
    return { isActive: false, reason: "This access has been revoked by the Estate Planner." };
  }

  switch (input.timingRule) {
    case "immediate":
      return { isActive: true, reason: "This access is granted immediately, regardless of life status." };

    case "after_verified_death": {
      const isVerifiedDeceased = input.grantorLifeStatus === "deceased_verified" && input.deathVerifiedAt !== null;
      return isVerifiedDeceased
        ? { isActive: true, reason: "Death has been registrar-verified — this access is now active." }
        : { isActive: false, reason: "This access activates only after a registrar-verified death event." };
    }

    case "after_waiting_period": {
      if (input.grantorLifeStatus !== "deceased_verified" || !input.deathVerifiedAt) {
        return { isActive: false, reason: "This access activates only after a registrar-verified death event, plus a waiting period." };
      }
      const waitDays = input.waitingPeriodDays ?? 0;
      const unlockAt = new Date(input.deathVerifiedAt.getTime() + waitDays * 24 * 60 * 60 * 1000);
      if (now >= unlockAt) {
        return { isActive: true, reason: `The ${waitDays}-day waiting period after verified death has elapsed.` };
      }
      const daysLeft = Math.ceil((unlockAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return { isActive: false, reason: `${daysLeft} day(s) remain in the waiting period after verified death.` };
    }

    case "requires_co_approval": {
      if (input.grantorLifeStatus !== "deceased_verified" || !input.deathVerifiedAt) {
        return { isActive: false, reason: "This access activates only after a registrar-verified death event, and requires another trusted person's approval." };
      }
      return input.coApprovalGranted
        ? { isActive: true, reason: "Death is verified and the required co-approval has been given." }
        : { isActive: false, reason: "Death is verified, but this access also requires another trusted person's approval first." };
    }

    default:
      return { isActive: false, reason: "Unrecognised timing rule — defaulting to no access." };
  }
}
