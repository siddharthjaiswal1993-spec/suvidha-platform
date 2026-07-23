/**
 * The authority/entitlement decision-support engine for the Legacy & Succession domain.
 * See docs/AUTHORITY_RULES.md for the full narrative and worked examples.
 *
 * This engine NEVER declares final legal ownership. It recommends a pathway, the documents that
 * pathway typically needs, and whether the case must be escalated for human/legal review. Rules
 * are data (the RULES array below, mirrored into the Rule/RuleVersion tables for audit/display),
 * not hard-coded per screen — a new rule is a new array entry, not a new UI branch.
 *
 * Rules are evaluated in order; the first matching rule wins. Put more specific rules first.
 */

export type AuthorityFacts = {
  assetCategory: string;
  ownershipType: "sole" | "joint_either_or_survivor" | "joint_former_or_survivor" | "joint_jointly";
  hasActiveNomination: boolean;
  nomineeIsMinor: boolean;
  hasWill: boolean;
  hasExecutor: boolean;
  hasTrust: boolean;
  claimantRole:
    | "nominee"
    | "beneficiary"
    | "surviving_joint_holder"
    | "executor"
    | "administrator"
    | "legal_heir"
    | "guardian"
    | "other_claimant";
  claimantCount: number;
  hasCourtOrder: boolean;
  hasDispute: boolean;
  isMissingPersonCase: boolean;
  isForeignResidentClaimant: boolean;
  deathOutsideIndia: boolean;
};

export type AuthorityOutput =
  | "pay_to_nominee_subject_to_rights"
  | "transfer_to_surviving_joint_holder"
  | "process_through_executor"
  | "require_administrator"
  | "require_legal_heir_documentation"
  | "require_succession_certificate"
  | "require_probate_or_letters_of_administration"
  | "require_indemnity_or_noc"
  | "require_guardian_documentation"
  | "require_court_or_legal_review"
  | "place_temporary_hold"
  | "reject_insufficiently_authorised"
  | "request_additional_evidence";

export type AuthorityRecommendation = {
  output: AuthorityOutput;
  ruleKey: string;
  requiresHumanEscalation: boolean;
  requiresOtherClaimantParticipation: boolean;
  rationale: string;
};

type Rule = {
  key: string;
  matches: (f: AuthorityFacts) => boolean;
  recommend: AuthorityRecommendation;
};

const RULES: Rule[] = [
  {
    key: "court_order_present",
    matches: (f) => f.hasCourtOrder,
    recommend: {
      output: "require_court_or_legal_review",
      ruleKey: "court_order_present",
      requiresHumanEscalation: true,
      requiresOtherClaimantParticipation: true,
      rationale: "A court order exists on this estate — every downstream action defers to it.",
    },
  },
  {
    key: "active_dispute",
    matches: (f) => f.hasDispute,
    recommend: {
      output: "place_temporary_hold",
      ruleKey: "active_dispute",
      requiresHumanEscalation: true,
      requiresOtherClaimantParticipation: true,
      rationale: "An unresolved dispute is open on this estate or asset — pending human/legal review.",
    },
  },
  {
    key: "missing_person_case",
    matches: (f) => f.isMissingPersonCase,
    recommend: {
      output: "require_court_or_legal_review",
      ruleKey: "missing_person_case",
      requiresHumanEscalation: true,
      requiresOtherClaimantParticipation: false,
      rationale: "A presumption-of-death or missing-person case requires a court declaration before claims proceed.",
    },
  },
  {
    key: "surviving_joint_holder_either_or_survivor",
    matches: (f) => f.claimantRole === "surviving_joint_holder" && f.ownershipType === "joint_either_or_survivor",
    recommend: {
      output: "transfer_to_surviving_joint_holder",
      ruleKey: "surviving_joint_holder_either_or_survivor",
      requiresHumanEscalation: false,
      requiresOtherClaimantParticipation: false,
      rationale: "An Either-or-Survivor mandate lets the surviving holder operate the account without further succession proof for that asset.",
    },
  },
  {
    key: "nominee_minor",
    matches: (f) => f.claimantRole === "nominee" && f.hasActiveNomination && f.nomineeIsMinor,
    recommend: {
      output: "require_guardian_documentation",
      ruleKey: "nominee_minor",
      requiresHumanEscalation: false,
      requiresOtherClaimantParticipation: false,
      rationale: "The registered nominee is a minor — a natural or court-appointed guardian must act on their behalf.",
    },
  },
  {
    key: "nominee_no_dispute",
    matches: (f) => f.claimantRole === "nominee" && f.hasActiveNomination && !f.hasDispute,
    recommend: {
      output: "pay_to_nominee_subject_to_rights",
      ruleKey: "nominee_no_dispute",
      requiresHumanEscalation: false,
      requiresOtherClaimantParticipation: false,
      rationale: "A valid, undisputed nomination exists — payable to the nominee as trustee for the legal heirs, per institution policy.",
    },
  },
  {
    key: "will_with_executor",
    matches: (f) => f.hasWill && f.hasExecutor && f.claimantRole === "executor",
    recommend: {
      output: "process_through_executor",
      ruleKey: "will_with_executor",
      requiresHumanEscalation: false,
      requiresOtherClaimantParticipation: false,
      rationale: "A will names this claimant as executor — the estate is administered through them per the will's terms.",
    },
  },
  {
    key: "will_without_named_executor",
    matches: (f) => f.hasWill && !f.hasExecutor,
    recommend: {
      output: "require_probate_or_letters_of_administration",
      ruleKey: "will_without_named_executor",
      requiresHumanEscalation: true,
      requiresOtherClaimantParticipation: false,
      rationale: "A will exists but names no executor — probate or letters of administration are typically required before assets move.",
    },
  },
  {
    key: "no_will_multiple_heirs",
    matches: (f) => !f.hasWill && !f.hasActiveNomination && f.claimantCount > 1,
    recommend: {
      output: "require_succession_certificate",
      ruleKey: "no_will_multiple_heirs",
      requiresHumanEscalation: true,
      requiresOtherClaimantParticipation: true,
      rationale: "Intestate succession with more than one heir typically requires a succession certificate or legal-heir certificate naming all heirs and their shares.",
    },
  },
  {
    key: "no_will_single_heir",
    matches: (f) => !f.hasWill && !f.hasActiveNomination && f.claimantCount === 1,
    recommend: {
      output: "require_legal_heir_documentation",
      ruleKey: "no_will_single_heir",
      requiresHumanEscalation: false,
      requiresOtherClaimantParticipation: false,
      rationale: "Intestate succession with a single identified heir — a legal-heir certificate (and often an indemnity/NOC) is typically sufficient for lower-value holdings.",
    },
  },
];

const FALLBACK: AuthorityRecommendation = {
  output: "request_additional_evidence",
  ruleKey: "fallback_insufficient_facts",
  requiresHumanEscalation: true,
  requiresOtherClaimantParticipation: false,
  rationale: "The facts provided don't match a configured rule — request more evidence and route for human review rather than guess.",
};

export function evaluateAuthorityPathway(facts: AuthorityFacts): AuthorityRecommendation {
  const match = RULES.find((rule) => rule.matches(facts));
  return match ? match.recommend : FALLBACK;
}

export function listAuthorityRuleKeys(): string[] {
  return RULES.map((r) => r.key);
}
