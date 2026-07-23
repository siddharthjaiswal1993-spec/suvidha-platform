import type { Page } from "@playwright/test";

/**
 * Logs in via the demo persona picker at /login by clicking the "Continue as {firstName}" button,
 * and waits for the resulting redirect (to /home or /ops) to actually land before returning.
 * Without this explicit wait, a subsequent page.goto() can occasionally race ahead of the Server
 * Action's redirect/cookie commit under load, hitting a protected page before the session cookie
 * is applied — this showed up as a null-user crash on whichever page happened to load next.
 */
export async function loginAs(page: Page, firstName: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: `Continue as ${firstName}` }).click();
  await page.waitForURL(/\/(home|ops)$/, { timeout: 15_000 });
}
