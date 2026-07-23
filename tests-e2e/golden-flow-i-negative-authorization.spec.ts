import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

/**
 * Golden Flow I: authorization abuse attempts must all fail. Every one of these is a case where
 * the UI never offers the forbidden action directly — the point is that the *server* independently
 * re-verifies ownership/tenancy/role even if a URL is guessed or a form is invoked out of context.
 */
test.describe("Golden Flow I — Authorization abuse is rejected", () => {
  test("a claimant cannot open another claimant's claim by guessing the URL", async ({ page }) => {
    await loginAs(page, "Deepa");
    await page.goto("/legacy/claim");
    await page.getByText(/ANB-CLM-/).first().click();
    await page.waitForURL(/\/legacy\/claim\//);
    const deepasClaimUrl = page.url();

    await loginAs(page, "Lakshmi");
    await page.goto(deepasClaimUrl);
    await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible();
  });

  test("a citizen cannot open another citizen's service request by guessing the URL", async ({ page }) => {
    await loginAs(page, "Meera");
    await page.goto("/requests");
    await page.getByText("Update address at Ashoka National Bank").click();
    await page.waitForURL(/\/requests\//);
    const meerasRequestUrl = page.url();

    await loginAs(page, "Fathima");
    await page.goto(meerasRequestUrl);
    await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible();
  });

  test("an institution officer cannot open a case belonging to a different institution", async ({ page }) => {
    await loginAs(page, "Meera");
    await page.goto("/requests");
    await page.getByText("Update address at Ashoka National Bank").click();
    await page.waitForURL(/\/requests\//);
    const requestId = page.url().split("/requests/")[1];

    // Neha is a Claims Officer at Suraksha Life Insurance, not Ashoka National Bank.
    await loginAs(page, "Neha");
    await page.goto(`/ops/requests/${requestId}`);
    await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible();
  });

  test("an auditor cannot record a claim decision even by invoking the form directly", async ({ page }) => {
    await loginAs(page, "V.");
    await page.goto("/ops/claims");
    const firstClaim = page.locator("a[href^='/ops/claims/']").first();
    await firstClaim.click();

    await expect(page.getByRole("heading", { name: "Maker-checker decision" })).toBeVisible();
    await page.getByRole("button", { name: "Record decision" }).click();
    await expect(page.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
  });
});
