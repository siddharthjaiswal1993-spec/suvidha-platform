import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

/**
 * Golden Flow B: Life-event orchestration — the address-change life event exposes a distinct,
 * honest action per execution method (direct API, integration, institution review, and manual
 * self-report), and progress is derived from the underlying request states.
 */
test.describe("Golden Flow B — Address-change life event", () => {
  test("Meera sees a distinct action per execution method, and can complete the direct-API one instantly", async ({ page }) => {
    await loginAs(page, "Meera");
    await page.getByRole("link", { name: "Life Events" }).click();
    await expect(page).toHaveURL(/\/life-events$/);

    await page.getByRole("link", { name: /Moving to a new address/ }).click();
    await expect(page).toHaveURL(/\/life-events\/[a-z0-9]+$/);
    await expect(page.getByRole("heading", { name: "Moving to a new address", level: 1 })).toBeVisible();

    // Aadhaar (deep-link) is already completed in the seed.
    await expect(page.getByText("Update address on Aadhaar")).toBeVisible();

    // The Ashoka Bank action is already mid institution-review with an open deficiency.
    await expect(page.getByText("Update address at Ashoka National Bank")).toBeVisible();
    await expect(page.getByRole("link", { name: "View progress" })).toBeVisible();

    // City Electricity Board is executable_via_api — completes instantly on click.
    const electricityRow = page.locator("div.rounded-md.border", { hasText: "City Electricity Board" });
    await electricityRow.getByRole("button", { name: "Complete now" }).click();
    await expect(page.getByText("Update address for electricity connection")).toBeVisible();
  });

  test("the manual, self-reported completion path requires a reference number and date", async ({ page }) => {
    await loginAs(page, "Meera");
    await page.goto("/life-events");
    await page.getByRole("link", { name: /Moving to a new address/ }).click();

    const employerRow = page.locator("div.rounded-md.border", { hasText: "Acme Innovations" });
    await employerRow.getByLabel("Reference number").fill("ACK-2026-7788");
    await employerRow.getByLabel("Completed on").fill("2026-07-20");
    await employerRow.getByRole("button", { name: "I've completed this" }).click();

    await expect(page.getByText("Citizen-reported, not institution-verified")).toBeVisible();
  });
});
