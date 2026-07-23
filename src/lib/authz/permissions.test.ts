import { describe, expect, it } from "vitest";
import { PERMISSIONS, ROLE_PERMISSIONS, roleHasPermission } from "./permissions";
import { CITIZEN_SIDE_ROLES, OPS_SIDE_ROLES } from "@/lib/roles";

describe("permissions", () => {
  it("gives every citizen-side role the ability to create and read their own service requests", () => {
    for (const role of CITIZEN_SIDE_ROLES) {
      expect(roleHasPermission(role, PERMISSIONS.SERVICE_REQUEST_CREATE_SELF)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.SERVICE_REQUEST_READ_SELF)).toBe(true);
    }
  });

  it("never gives a citizen-side role an institution-only permission", () => {
    const institutionOnly = [PERMISSIONS.CLAIM_APPROVE, PERMISSIONS.PAYOUT_RECORD, PERMISSIONS.AUDIT_READ, PERMISSIONS.RULES_MANAGE];
    for (const role of CITIZEN_SIDE_ROLES) {
      for (const permission of institutionOnly) {
        expect(roleHasPermission(role, permission)).toBe(false);
      }
    }
  });

  it("gives a maker only recommendation permissions, never approval or payout", () => {
    expect(roleHasPermission("maker", PERMISSIONS.SERVICE_REQUEST_RECOMMEND)).toBe(true);
    expect(roleHasPermission("maker", PERMISSIONS.CLAIM_RECOMMEND)).toBe(true);
    expect(roleHasPermission("maker", PERMISSIONS.SERVICE_REQUEST_APPROVE)).toBe(false);
    expect(roleHasPermission("maker", PERMISSIONS.CLAIM_APPROVE)).toBe(false);
    expect(roleHasPermission("maker", PERMISSIONS.PAYOUT_RECORD)).toBe(false);
  });

  it("gives a checker approval and payout permissions but not the ability to raise a service-request deficiency alone from the maker step", () => {
    expect(roleHasPermission("checker", PERMISSIONS.SERVICE_REQUEST_APPROVE)).toBe(true);
    expect(roleHasPermission("checker", PERMISSIONS.CLAIM_APPROVE)).toBe(true);
    expect(roleHasPermission("checker", PERMISSIONS.PAYOUT_RECORD)).toBe(true);
  });

  it("gives a grievance officer only grievance permissions, never claim or service-request decisions", () => {
    expect(roleHasPermission("grievance_officer", PERMISSIONS.GRIEVANCE_RESOLVE)).toBe(true);
    expect(roleHasPermission("grievance_officer", PERMISSIONS.CLAIM_APPROVE)).toBe(false);
    expect(roleHasPermission("grievance_officer", PERMISSIONS.SERVICE_REQUEST_APPROVE)).toBe(false);
  });

  it("gives an auditor read-only access, never a decision or payout permission", () => {
    expect(roleHasPermission("auditor", PERMISSIONS.AUDIT_READ)).toBe(true);
    expect(roleHasPermission("auditor", PERMISSIONS.CLAIM_APPROVE)).toBe(false);
    expect(roleHasPermission("auditor", PERMISSIONS.SERVICE_REQUEST_APPROVE)).toBe(false);
    expect(roleHasPermission("auditor", PERMISSIONS.PAYOUT_RECORD)).toBe(false);
  });

  it("defines a permission set for every declared role, ops and citizen alike", () => {
    for (const role of [...CITIZEN_SIDE_ROLES, ...OPS_SIDE_ROLES]) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    }
  });
});
