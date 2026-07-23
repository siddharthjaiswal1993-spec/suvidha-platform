import { describe, expect, it } from "vitest";
import { evaluateAuthorityPathway, type AuthorityFacts } from "./authority-engine";

function baseFacts(overrides: Partial<AuthorityFacts> = {}): AuthorityFacts {
  return {
    assetCategory: "bank_deposit",
    ownershipType: "sole",
    hasActiveNomination: false,
    nomineeIsMinor: false,
    hasWill: false,
    hasExecutor: false,
    hasTrust: false,
    claimantRole: "legal_heir",
    claimantCount: 1,
    hasCourtOrder: false,
    hasDispute: false,
    isMissingPersonCase: false,
    isForeignResidentClaimant: false,
    deathOutsideIndia: false,
    ...overrides,
  };
}

describe("evaluateAuthorityPathway", () => {
  it("recommends paying the nominee when a valid, undisputed nomination exists", () => {
    const result = evaluateAuthorityPathway(
      baseFacts({ claimantRole: "nominee", hasActiveNomination: true })
    );
    expect(result.output).toBe("pay_to_nominee_subject_to_rights");
    expect(result.requiresHumanEscalation).toBe(false);
  });

  it("requires guardian documentation when the nominee is a minor", () => {
    const result = evaluateAuthorityPathway(
      baseFacts({ claimantRole: "nominee", hasActiveNomination: true, nomineeIsMinor: true })
    );
    expect(result.output).toBe("require_guardian_documentation");
  });

  it("transfers to the surviving joint holder under an either-or-survivor mandate", () => {
    const result = evaluateAuthorityPathway(
      baseFacts({ claimantRole: "surviving_joint_holder", ownershipType: "joint_either_or_survivor" })
    );
    expect(result.output).toBe("transfer_to_surviving_joint_holder");
  });

  it("processes through the executor when a will names one", () => {
    const result = evaluateAuthorityPathway(
      baseFacts({ claimantRole: "executor", hasWill: true, hasExecutor: true })
    );
    expect(result.output).toBe("process_through_executor");
  });

  it("requires probate/letters of administration when a will exists with no named executor", () => {
    const result = evaluateAuthorityPathway(baseFacts({ hasWill: true, hasExecutor: false }));
    expect(result.output).toBe("require_probate_or_letters_of_administration");
    expect(result.requiresHumanEscalation).toBe(true);
  });

  it("requires a succession certificate for intestate succession with multiple heirs", () => {
    const result = evaluateAuthorityPathway(baseFacts({ claimantCount: 3 }));
    expect(result.output).toBe("require_succession_certificate");
    expect(result.requiresOtherClaimantParticipation).toBe(true);
  });

  it("requires only legal-heir documentation for intestate succession with a single heir", () => {
    const result = evaluateAuthorityPathway(baseFacts({ claimantCount: 1 }));
    expect(result.output).toBe("require_legal_heir_documentation");
  });

  it("always defers to a court order regardless of other facts", () => {
    const result = evaluateAuthorityPathway(
      baseFacts({ claimantRole: "nominee", hasActiveNomination: true, hasCourtOrder: true })
    );
    expect(result.output).toBe("require_court_or_legal_review");
    expect(result.requiresHumanEscalation).toBe(true);
  });

  it("places a temporary hold when there is an active dispute", () => {
    const result = evaluateAuthorityPathway(baseFacts({ hasDispute: true }));
    expect(result.output).toBe("place_temporary_hold");
  });

  it("never returns a final-ownership-style output — only pathway recommendations", () => {
    const allOutputs = [
      evaluateAuthorityPathway(baseFacts({ claimantRole: "nominee", hasActiveNomination: true })).output,
      evaluateAuthorityPathway(baseFacts({ hasCourtOrder: true })).output,
      evaluateAuthorityPathway(baseFacts({ claimantCount: 5 })).output,
    ];
    for (const output of allOutputs) {
      expect(output).not.toMatch(/owner|inherit/i);
    }
  });
});
