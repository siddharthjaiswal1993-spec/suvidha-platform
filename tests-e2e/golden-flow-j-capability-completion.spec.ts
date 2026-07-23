import { test, expect } from "@playwright/test";
import { loginAs, chooseOption } from "./helpers";

/**
 * Golden Flow J — covers the capabilities completed in the v3 pass: document upload/sharing, the
 * inbox's reply/escalate/report-suspicious actions, delegated-access invitation, connecting a new
 * institution, the general request engine reconciling a non-address field (mobile number), and
 * grievance escalation. Each of these previously had a screen that rendered real data but no
 * working action behind it (`interface_prototype` in src/config/capabilities.ts) — these tests
 * prove the underlying Server Actions actually write real state, not just render.
 */
test.describe("Golden Flow J — Document, inbox, delegation, institution, and grievance actions", () => {
  test("Meera can upload a document and share it with an institution", async ({ page }) => {
    await loginAs(page, "Meera");
    await page.goto("/documents");
    await page.getByLabel("Label").fill("Updated Voter ID");
    await page.getByLabel("Document type").fill("voter_id");
    await page.getByLabel("Issuer (optional)").fill("Election Commission");
    await page.getByRole("button", { name: "Add document" }).click();
    await page.waitForURL(/\/documents\//);

    await expect(page.getByRole("heading", { name: "Updated Voter ID" })).toBeVisible();
    await page.getByLabel("Share with").fill("Ashoka National Bank");
    await page.getByLabel("Purpose").fill("KYC re-verification");
    await page.getByRole("button", { name: "Share" }).click();
    await expect(page.getByText("Ashoka National Bank").last()).toBeVisible();
    await expect(page.getByText("KYC re-verification")).toBeVisible();

    await page.getByRole("button", { name: "Revoke" }).click();
    await expect(page.getByText(/Revoked/)).toBeVisible();
  });

  test("Meera can reply to an inbox thread, report a suspicious message, and escalate to a grievance", async ({ page }) => {
    await loginAs(page, "Meera");
    await page.goto("/inbox");
    await page.getByText("Income Tax — Rectification opportunity").click();
    await page.getByPlaceholder("Type your reply...").fill("Filing the rectification request today.");
    await page.getByRole("button", { name: "Send reply" }).click();
    await expect(page.getByText("Filing the rectification request today.")).toBeVisible();

    await page.goto("/inbox");
    await page.getByText("URGENT: Your KYC will be suspended").click();
    await page.getByRole("button", { name: "Report as suspicious" }).click();
    await expect(page.getByText(/You reported this as suspicious/)).toBeVisible();

    await page.getByRole("button", { name: "Escalate to grievance" }).click();
    await page.waitForURL(/\/help\//);
    await expect(page.getByRole("heading", { name: /Escalated from inbox/ })).toBeVisible();
  });

  test("Meera can invite an assistant scoped to one of her own requests", async ({ page }) => {
    await loginAs(page, "Meera");
    await page.goto("/family-access");
    await page.getByLabel("Name").fill("Ravi Kumar");
    await page.getByLabel("Relation").fill("Son");
    await chooseOption(page, "Which request", "Add nominee to Konkan Cooperative Bank FD");
    await page.getByRole("button", { name: "Invite" }).click();
    await expect(page.getByText("Ravi Kumar")).toBeVisible();
    await expect(page.getByText("approved").first()).toBeVisible();
  });

  test("Meera can connect a new institution and confirm its (simulated) verification", async ({ page }) => {
    await loginAs(page, "Meera");
    await page.goto("/institutions");
    await chooseOption(page, "Institution", "Sanchar Mobile Networks");
    await page.getByLabel("What should we call it?").fill("Mobile Connection");
    await page.getByRole("button", { name: "Connect" }).click();
    await page.waitForURL(/\/institutions\//);

    await expect(page.getByText("under verification")).toBeVisible();
    await page.getByRole("button", { name: "Confirm verification" }).click();
    await expect(page.getByRole("link", { name: "Update address" })).toBeVisible();
  });

  test("completing a mobile-number request reconciles the citizen's profile, not just address requests", async ({ page }) => {
    await loginAs(page, "Meera");
    await page.goto("/requests/new");
    await chooseOption(page, "Service", "Ashoka National Bank — Update registered mobile number");
    await page.getByPlaceholder(/12 MG Road, Pune/).fill("+91 98123 45670");
    await page.getByRole("button", { name: "Create draft request" }).click();
    await page.waitForURL(/\/requests\/(?!new)/);
    const requestId = page.url().split("/requests/")[1];
    await expect(page.getByText("New mobile number: +91 98123 45670")).toBeVisible();

    await page.getByRole("button", { name: "Submit this request" }).click();
    await expect(page.getByText("submitted", { exact: true }).first()).toBeVisible();

    await loginAs(page, "Anita");
    await page.goto(`/ops/requests/${requestId}`);
    await page.getByRole("button", { name: "Accept into review" }).click();
    await expect(page.getByText("under review", { exact: true }).first()).toBeVisible();
    await chooseOption(page, "Acting as", "Maker");
    await chooseOption(page, "Outcome", "Recommend approve");
    await page.getByRole("button", { name: "Record decision" }).click();
    await expect(page.getByText("maker").first()).toBeVisible();

    await loginAs(page, "Suresh");
    await page.goto(`/ops/requests/${requestId}`);
    await chooseOption(page, "Acting as", "Checker");
    await chooseOption(page, "Outcome", "Approve");
    await page.getByRole("button", { name: "Record decision" }).click();
    await expect(page.getByText("approved").first()).toBeVisible();
    await page.getByRole("button", { name: "Complete institution update & reconcile citizen record" }).click();
    await expect(page.getByText("completed").first()).toBeVisible();

    await loginAs(page, "Meera");
    await page.goto("/profile");
    const historyTab = page.getByRole("tab", { name: "Field history" });
    await expect(async () => {
      await historyTab.click();
      await expect(historyTab).toHaveAttribute("aria-selected", "true", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await expect(page.getByText("+91 98123 45670")).toBeVisible();
  });

  test("completing a PAN name-correction request reconciles the citizen's legal name", async ({ page }) => {
    await loginAs(page, "Meera");
    await page.goto("/requests/new");
    await chooseOption(page, "Service", "Income Tax Department — PAN name correction");
    await page.getByPlaceholder(/12 MG Road, Pune/).fill("Meera Arvind Krishnan");
    await page.getByRole("button", { name: "Create draft request" }).click();
    await page.waitForURL(/\/requests\/(?!new)/);
    const requestId = page.url().split("/requests/")[1];
    await expect(page.getByText("New legal name: Meera Arvind Krishnan")).toBeVisible();

    await page.getByRole("button", { name: "Submit this request" }).click();
    await expect(page.getByText("submitted", { exact: true }).first()).toBeVisible();

    await loginAs(page, "Ramesh");
    await page.goto(`/ops/requests/${requestId}`);
    await page.getByRole("button", { name: "Accept into review" }).click();
    await expect(page.getByText("under review", { exact: true }).first()).toBeVisible();
    await chooseOption(page, "Acting as", "Maker");
    await chooseOption(page, "Outcome", "Recommend approve");
    await page.getByRole("button", { name: "Record decision" }).click();
    await expect(page.getByText("maker").first()).toBeVisible();

    await loginAs(page, "Sunita");
    await page.goto(`/ops/requests/${requestId}`);
    await chooseOption(page, "Acting as", "Checker");
    await chooseOption(page, "Outcome", "Approve");
    await page.getByRole("button", { name: "Record decision" }).click();
    await expect(page.getByText("approved").first()).toBeVisible();
    await page.getByRole("button", { name: "Complete institution update & reconcile citizen record" }).click();
    await expect(page.getByText("completed").first()).toBeVisible();

    await loginAs(page, "Meera");
    await page.goto("/profile");
    const historyTab = page.getByRole("tab", { name: "Field history" });
    await expect(async () => {
      await historyTab.click();
      await expect(historyTab).toHaveAttribute("aria-selected", "true", { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await expect(page.getByText("Meera Arvind Krishnan")).toBeVisible();
  });

  test("Meera can escalate an open grievance and see the escalation recorded", async ({ page }) => {
    await loginAs(page, "Meera");
    await page.goto("/help");
    await page.getByText("Address update taking longer than the published SLA").click();
    await page.getByPlaceholder("Why does this need escalation?").fill("It's now three days past the published SLA with no update.");
    await page.getByRole("button", { name: "Escalate" }).click();
    await expect(page.getByText("Escalated to Nodal Officer (simulated)")).toBeVisible();
    await expect(page.getByText("escalated").first()).toBeVisible();
  });

  test("the Life Admin Assistant answers the newly added questions from Meera's real data", async ({ page }) => {
    await loginAs(page, "Meera");
    await page.goto("/assistant");

    await page.getByRole("link", { name: "Do I have any open grievances?" }).click();
    await expect(page.getByText(/open grievance/)).toBeVisible();

    await page.getByRole("link", { name: "What's my estate readiness score?" }).click();
    await expect(page.getByText(/estate readiness score is \d+%/)).toBeVisible();

    await page.getByRole("link", { name: "Who has delegated access to my tasks?" }).click();
    await expect(page.getByText(/delegated access|Ravi Kumar/)).toBeVisible();
  });
});
