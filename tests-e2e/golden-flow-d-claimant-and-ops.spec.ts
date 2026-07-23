import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

/**
 * Golden Flow D: a pre-authorised claimant tracks a smooth claim, and an institution Claims
 * Officer processes a case end to end (authority-pathway recommendation + maker-checker decision).
 */
test.describe("Golden Flow D — Claimant tracking & institution claim processing", () => {
  test("Deepa can see her claims workspace and open a claim", async ({ page }) => {
    await loginAs(page, "Deepa");
    await expect(page).toHaveURL(/\/home$/);
    await page.getByRole("link", { name: "Go to claims workspace" }).click();
    await expect(page).toHaveURL(/\/legacy\/claim$/);
    await expect(page.getByText(/Claim #ANB-CLM/)).toBeVisible();
  });

  test("A Claims Officer can open a case, see the authority recommendation, and record a decision", async ({ page }) => {
    await loginAs(page, "Neha");
    await expect(page).toHaveURL(/\/ops$/);

    await page.getByRole("link", { name: "Claim queue" }).click();
    await expect(page).toHaveURL(/\/ops\/claims$/);
    await page.getByText("SLI-CLM-990331").click();

    await expect(page.getByText("Authority-pathway recommendation")).toBeVisible();
    const decisionCountBefore = await page.getByText("recommend approve").count();
    await page.getByRole("button", { name: "Record decision" }).click();
    await expect(page.getByText("recommend approve")).toHaveCount(decisionCountBefore + 1);
  });
});
