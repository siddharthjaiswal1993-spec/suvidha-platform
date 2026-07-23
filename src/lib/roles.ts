/**
 * Canonical role keys for `User.primaryRole`. Keep in sync with docs/TERMINOLOGY.md and
 * docs/ACCESS_CONTROL_MATRIX.md — this is the one place role keys are defined for the app.
 */
export const CITIZEN_SIDE_ROLES = [
  "independent_citizen",
  "family_administrator",
  "assisted_citizen",
  "parent_guardian",
  "professional_representative",
  "estate_planner",
  "claimant",
] as const;

export const OPS_SIDE_ROLES = [
  "registrar_officer",
  "institution_officer",
  "verification_officer",
  "maker",
  "checker",
  "adjudicator",
  "grievance_officer",
  "auditor",
  "integration_admin",
] as const;

export type CitizenSideRole = (typeof CITIZEN_SIDE_ROLES)[number];
export type OpsSideRole = (typeof OPS_SIDE_ROLES)[number];
export type RoleKey = CitizenSideRole | OpsSideRole;

export const ROLE_LABELS: Record<RoleKey, string> = {
  independent_citizen: "Independent Citizen",
  family_administrator: "Family Administrator",
  assisted_citizen: "Assisted Citizen",
  parent_guardian: "Parent / Guardian",
  professional_representative: "Professional Representative",
  estate_planner: "Estate Planner",
  claimant: "Claimant / Legal Representative",
  registrar_officer: "Registrar / Government Service Officer",
  institution_officer: "Institution Claims Officer",
  verification_officer: "Verification Officer",
  maker: "Maker",
  checker: "Checker",
  adjudicator: "Adjudicator",
  grievance_officer: "Grievance Officer",
  auditor: "Auditor",
  integration_admin: "Integration Administrator",
};

export function isOpsRole(role: string): boolean {
  return (OPS_SIDE_ROLES as readonly string[]).includes(role);
}
