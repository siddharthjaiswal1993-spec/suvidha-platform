import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

/** Golden Flow: an uninvited family claimant (no will, multiple heirs) tracks a claim with an open deficiency. */
test.describe("Golden Flow — No-will, multiple-heirs claimant journey", () => {
  test("Lakshmi can see her claim and the open deficiency request", async ({ page }) => {
    await loginAs(page, "Lakshmi");
    await page.getByRole("link", { name: "Legacy & Succession" }).click();
    await page.getByRole("link", { name: "Open claims workspace" }).click();
    await expect(page).toHaveURL(/\/legacy\/claim$/);
    await expect(page.getByText("Action needed")).toBeVisible();

    await page.getByText("SLI-CLM-114420").click();
    await expect(page.getByRole("heading", { name: /Action needed: Succession certificate required/ })).toBeVisible();
  });
});
