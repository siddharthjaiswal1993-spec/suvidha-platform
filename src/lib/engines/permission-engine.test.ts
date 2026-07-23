import { describe, expect, it } from "vitest";
import { evaluateAccessGrant, type PermissionCheckInput } from "./permission-engine";

function baseInput(overrides: Partial<PermissionCheckInput> = {}): PermissionCheckInput {
  return {
    grantStatus: "granted",
    timingRule: "immediate",
    waitingPeriodDays: null,
    grantorLifeStatus: "living",
    deathVerifiedAt: null,
    ...overrides,
  };
}

describe("evaluateAccessGrant", () => {
  it("denies access once revoked, regardless of timing rule", () => {
    const result = evaluateAccessGrant(baseInput({ grantStatus: "revoked", timingRule: "immediate" }));
    expect(result.isActive).toBe(false);
  });

  it("grants immediate access while the grantor is alive", () => {
    const result = evaluateAccessGrant(baseInput({ timingRule: "immediate" }));
    expect(result.isActive).toBe(true);
  });

  it("denies after_verified_death access while the grantor is alive", () => {
    const result = evaluateAccessGrant(baseInput({ timingRule: "after_verified_death" }));
    expect(result.isActive).toBe(false);
  });

  it("grants after_verified_death access once death is registrar-verified", () => {
    const result = evaluateAccessGrant(
      baseInput({
        timingRule: "after_verified_death",
        grantorLifeStatus: "deceased_verified",
        deathVerifiedAt: new Date("2026-01-01"),
      })
    );
    expect(result.isActive).toBe(true);
  });

  it("does NOT grant access on an unverified deceased_reported status", () => {
    const result = evaluateAccessGrant(
      baseInput({ timingRule: "after_verified_death", grantorLifeStatus: "deceased_reported", deathVerifiedAt: null })
    );
    expect(result.isActive).toBe(false);
  });

  it("keeps a waiting-period grant inactive until the period elapses", () => {
    const now = new Date("2026-01-05T00:00:00Z");
    const result = evaluateAccessGrant(
      baseInput({
        timingRule: "after_waiting_period",
        waitingPeriodDays: 30,
        grantorLifeStatus: "deceased_verified",
        deathVerifiedAt: new Date("2026-01-01T00:00:00Z"),
        now,
      })
    );
    expect(result.isActive).toBe(false);
  });

  it("activates a waiting-period grant once the period has elapsed", () => {
    const now = new Date("2026-02-05T00:00:00Z");
    const result = evaluateAccessGrant(
      baseInput({
        timingRule: "after_waiting_period",
        waitingPeriodDays: 30,
        grantorLifeStatus: "deceased_verified",
        deathVerifiedAt: new Date("2026-01-01T00:00:00Z"),
        now,
      })
    );
    expect(result.isActive).toBe(true);
  });

  it("requires co-approval even after verified death", () => {
    const withoutApproval = evaluateAccessGrant(
      baseInput({
        timingRule: "requires_co_approval",
        grantorLifeStatus: "deceased_verified",
        deathVerifiedAt: new Date("2026-01-01"),
        coApprovalGranted: false,
      })
    );
    expect(withoutApproval.isActive).toBe(false);

    const withApproval = evaluateAccessGrant(
      baseInput({
        timingRule: "requires_co_approval",
        grantorLifeStatus: "deceased_verified",
        deathVerifiedAt: new Date("2026-01-01"),
        coApprovalGranted: true,
      })
    );
    expect(withApproval.isActive).toBe(true);
  });
});
