import type { Page } from "@playwright/test";

/** Logs in via the demo persona picker at /login by clicking the "Continue as {firstName}" button. */
export async function loginAs(page: Page, firstName: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: `Continue as ${firstName}` }).click();
}
