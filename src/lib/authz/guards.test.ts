import { describe, expect, it } from "vitest";
import { AuthzError, requireOwnsPerson, requireInstitutionTenancy, assertValidRequestTransition } from "./guards";

describe("requireOwnsPerson", () => {
  it("passes when the acting person matches the resource owner", () => {
    expect(() => requireOwnsPerson("person-1", "person-1")).not.toThrow();
  });

  it("throws when a different person tries to access the resource", () => {
    expect(() => requireOwnsPerson("person-2", "person-1")).toThrow(AuthzError);
  });

  it("throws when there is no acting person at all", () => {
    expect(() => requireOwnsPerson(null, "person-1")).toThrow(AuthzError);
    expect(() => requireOwnsPerson(undefined, "person-1")).toThrow(AuthzError);
  });
});

describe("requireInstitutionTenancy", () => {
  it("passes when the acting institution matches the resource's institution", () => {
    expect(() => requireInstitutionTenancy("inst-1", "inst-1")).not.toThrow();
  });

  it("throws when an officer from a different institution tries to access the case", () => {
    expect(() => requireInstitutionTenancy("inst-2", "inst-1")).toThrow(AuthzError);
  });

  it("throws when the acting user has no institution at all", () => {
    expect(() => requireInstitutionTenancy(null, "inst-1")).toThrow(AuthzError);
  });
});

describe("assertValidRequestTransition", () => {
  it("allows a draft request to be submitted", () => {
    expect(() => assertValidRequestTransition("draft", "submitted")).not.toThrow();
  });

  it("allows submitted -> under_review -> approved -> completed", () => {
    expect(() => assertValidRequestTransition("submitted", "under_review")).not.toThrow();
    expect(() => assertValidRequestTransition("under_review", "approved")).not.toThrow();
    expect(() => assertValidRequestTransition("approved", "completed")).not.toThrow();
  });

  it("rejects skipping straight from draft to completed", () => {
    expect(() => assertValidRequestTransition("draft", "completed")).toThrow(AuthzError);
  });

  it("rejects moving a rejected request anywhere else", () => {
    expect(() => assertValidRequestTransition("rejected", "approved")).toThrow(AuthzError);
  });

  it("rejects moving a completed request backwards", () => {
    expect(() => assertValidRequestTransition("completed", "under_review")).toThrow(AuthzError);
  });

  it("allows under_review to loop back through additional_information_required", () => {
    expect(() => assertValidRequestTransition("under_review", "additional_information_required")).not.toThrow();
    expect(() => assertValidRequestTransition("additional_information_required", "under_review")).not.toThrow();
  });
});
