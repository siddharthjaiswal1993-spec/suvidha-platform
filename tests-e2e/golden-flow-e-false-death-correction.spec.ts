import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

/**
 * Golden Flow E: a living person incorrectly matched to a death event challenges the status,
 * completes re-verification, and confirms restoration — the false-positive protection workflow.
 */
test.describe("Golden Flow E — False-death correction", () => {
  test("Fathima can see the flag, challenge it, and confirm restoration", async ({ page }) => {
    await loginAs(page, "Fathima");
    await page.getByRole("link", { name: "Legacy & Succession" }).click();
    await expect(page.getByText("Your account may be incorrectly flagged")).toBeVisible();

    await page.getByRole("link", { name: "Review and challenge this now" }).click();
    await expect(page).toHaveURL(/\/legacy\/status-correction$/);
    await expect(page.getByRole("heading", { name: /incorrectly matched/ })).toBeVisible();

    await page.getByRole("button", { name: /I confirm I am living/ }).click();
    await expect(page.getByRole("heading", { name: /has been corrected/ })).toBeVisible();
  });
});
