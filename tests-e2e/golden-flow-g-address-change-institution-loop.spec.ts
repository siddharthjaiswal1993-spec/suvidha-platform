import { test, expect } from "@playwright/test";
import { loginAs, chooseOption } from "./helpers";

/**
 * Golden Flow G — the primary end-to-end outcome: a citizen's address-change request that
 * requires real institution review goes citizen -> deficiency response -> maker recommendation
 * -> a DIFFERENT checker's approval -> institution completion -> profile reconciliation, closing
 * the loop back into the citizen's own profile and institution views.
 */
test.describe("Golden Flow G — Address-change institution review loop", () => {
  test("closes the full loop from citizen deficiency response to profile reconciliation", async ({ page }) => {
    // 1. Citizen responds to the pre-staged deficiency on the Ashoka Bank address request.
    await loginAs(page, "Meera");
    await page.goto("/life-events");
    await page.getByRole("link", { name: /Moving to a new address/ }).click();
    await page.getByRole("link", { name: "View progress" }).click();
    await page.waitForURL(/\/requests\//);

    const requestUrl = page.url();
    const requestId = requestUrl.split("/requests/")[1];
    expect(requestId).toBeTruthy();

    await expect(page.getByText("Action needed: Clearer address-proof document required")).toBeVisible();
    await page.getByPlaceholder("Describe what you're submitting in response...").fill("Attaching a recent electricity bill showing the new address clearly.");
    await page.getByRole("button", { name: "Submit response" }).click();
    await expect(page.getByText("under review")).toBeVisible();

    // 2. Maker (Ashoka Bank) recommends approval.
    await loginAs(page, "Anita");
    await page.goto(`/ops/requests/${requestId}`);
    await expect(page.getByRole("heading", { name: /Update address at Ashoka National Bank/ })).toBeVisible();
    await chooseOption(page, "Acting as", "Maker");
    await chooseOption(page, "Outcome", "Recommend approve");
    await page.getByRole("button", { name: "Record decision" }).click();
    await expect(page.getByText("maker").first()).toBeVisible();

    // 3. A DIFFERENT user, the checker, approves — maker cannot also be checker (enforced server-side).
    await loginAs(page, "Suresh");
    await page.goto(`/ops/requests/${requestId}`);
    await chooseOption(page, "Acting as", "Checker");
    await chooseOption(page, "Outcome", "Approve");
    await page.getByRole("button", { name: "Record decision" }).click();
    await expect(page.getByText("approved").first()).toBeVisible();

    // 4. The checker completes the institution update, which reconciles the citizen's profile.
    await page.getByRole("button", { name: "Complete institution update & reconcile citizen record" }).click();
    await expect(page.getByText("completed").first()).toBeVisible();

    // 5. Back on the citizen side: the profile conflict for this source is resolved, and the
    // institution relationship's registered address snapshot now reflects the new address.
    await loginAs(page, "Meera");
    await page.goto("/institutions");
    await page.getByText("Ashoka National Bank Savings Account").click();
    await expect(page.getByText("22 Ganga Vihar Layout")).toBeVisible();
  });

  test("a maker cannot also act as the checker on the same case", async ({ page }) => {
    // Uses an independently created nominee-update request at Ashoka Bank, rather than the
    // address-change deficiency case above — that one is fully consumed (completed) by the
    // "closes the full loop" test earlier in this file, sharing the same seeded database.
    await loginAs(page, "Meera");
    await page.goto("/requests/new");
    await chooseOption(page, "Service", "Ashoka National Bank — Add or update nominee");
    await page.getByRole("button", { name: "Create draft request" }).click();
    // Note: /requests/new itself matches /\/requests\//, so waitForURL needs a pattern that
    // excludes the "new" segment — otherwise it resolves instantly against the pre-navigation URL.
    await page.waitForURL(/\/requests\/(?!new)/);
    const requestId = page.url().split("/requests/")[1];

    await page.getByRole("button", { name: "Submit this request" }).click();
    await expect(page.getByText("submitted", { exact: true }).first()).toBeVisible();

    await loginAs(page, "Anita");
    await page.goto(`/ops/requests/${requestId}`);
    await page.getByRole("button", { name: "Accept into review" }).click();
    await expect(page.getByText("under review", { exact: true }).first()).toBeVisible();

    await chooseOption(page, "Acting as", "Maker");
    await chooseOption(page, "Outcome", "Recommend approve");
    await page.getByRole("button", { name: "Record decision" }).click();
    await expect(page.getByText("maker").first()).toBeVisible();

    // Same user (the maker) now tries to act as checker on the same request — must be rejected,
    // surfacing the app's global error boundary rather than silently approving.
    await chooseOption(page, "Acting as", "Checker");
    await chooseOption(page, "Outcome", "Approve");
    await page.getByRole("button", { name: "Record decision" }).click();
    await expect(page.getByRole("heading", { name: "Something went wrong" })).toBeVisible();

    // Confirm the case genuinely never advanced to "approved" — the rejection was not cosmetic.
    await page.goto(`/ops/requests/${requestId}`);
    await expect(page.getByText("approved", { exact: true })).toHaveCount(0);
  });
});
