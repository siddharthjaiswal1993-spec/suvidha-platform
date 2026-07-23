import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

/** Golden Flow: Family Assisted Access — account owner approves a Family Administrator's task. */
test.describe("Golden Flow — Family assisted access", () => {
  test("Meera can review and approve Divya's delegated task", async ({ page }) => {
    await loginAs(page, "Meera");
    await page.getByRole("link", { name: "Family & Delegated Access" }).click();
    await expect(page).toHaveURL(/\/family-access$/);

    await expect(page.getByText(/wants to/)).toBeVisible();
    await page.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText("approved")).toBeVisible();
  });
});
