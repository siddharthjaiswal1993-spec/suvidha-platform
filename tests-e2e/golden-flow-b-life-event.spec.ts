import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

/** Golden Flow: Life-event orchestration — completing an address-change action updates progress. */
test.describe("Golden Flow — Address-change life event", () => {
  test("Meera can open the active life event and complete an action", async ({ page }) => {
    await loginAs(page, "Meera");
    await page.getByRole("link", { name: "Life Events" }).click();
    await expect(page).toHaveURL(/\/life-events$/);

    await page.getByRole("link", { name: /Moving to a new address/ }).click();
    await expect(page).toHaveURL(/\/life-events\/[a-z0-9]+$/);
    await expect(page.getByRole("heading", { name: "Moving to a new address", level: 1 })).toBeVisible();

    const markDoneButtons = page.getByRole("button", { name: "Mark done" });
    const countBefore = await markDoneButtons.count();
    expect(countBefore).toBeGreaterThan(0);

    await markDoneButtons.first().click();
    await expect(page.getByRole("button", { name: "Mark done" })).toHaveCount(countBefore - 1);
  });
});
