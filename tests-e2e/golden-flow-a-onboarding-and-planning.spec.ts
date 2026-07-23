import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

/**
 * Golden Flow A: living Estate Planner — unified onboarding into the dashboard, master profile
 * consistency, institutional relationship graph, and estate-planning readiness/Trusted Contacts.
 */
test.describe("Golden Flow A — Estate Planner onboarding & planning", () => {
  test("Meera can sign in, see her dashboard, profile conflicts, and institutions", async ({ page }) => {
    await loginAs(page, "Meera");
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole("heading", { name: /Welcome back, Meera/ })).toBeVisible();

    await page.getByRole("link", { name: "My Profile" }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByText(/differs across sources/).first()).toBeVisible();

    await page.getByRole("link", { name: "My Institutions" }).click();
    await expect(page).toHaveURL(/\/institutions$/);
    await expect(page.getByText("Ashoka National Bank").first()).toBeVisible();
  });

  test("Meera can review estate readiness and revoke a Trusted Contact", async ({ page }) => {
    await loginAs(page, "Meera");
    await page.getByRole("link", { name: "Legacy & Succession" }).click();
    await page.getByRole("link", { name: "Open estate planning" }).click();
    await expect(page).toHaveURL(/\/legacy\/planning$/);
    await expect(page.getByText(/% ready/)).toBeVisible();

    const trustedTab = page.getByRole("tab", { name: "Trusted Contacts" });
    await expect(trustedTab).toBeVisible();
    // Retry the click: in local dev with HMR blocked (see next.config.ts's allowedDevOrigins
    // comment) the very first click can land before hydration finishes and silently no-op.
    await expect(async () => {
      await trustedTab.click();
      await expect(trustedTab).toHaveAttribute("aria-selected", "true", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });

    const revokeButton = page.getByRole("button", { name: "Revoke access" }).first();
    await expect(revokeButton).toBeVisible();
    await revokeButton.click();
    await expect(page.getByText("revoked").first()).toBeVisible();
  });
});
