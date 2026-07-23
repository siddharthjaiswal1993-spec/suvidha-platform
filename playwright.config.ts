import { defineConfig, devices } from "@playwright/test";

// Set PLAYWRIGHT_BASE_URL to run this suite against a deployed environment (e.g. the Vercel
// production URL) instead of spinning up a local dev server — used to verify the live demo.
const remoteBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests-e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: remoteBaseURL ?? "http://127.0.0.1:3100",
    trace: "retain-on-failure",
  },
  webServer: remoteBaseURL
    ? undefined
    : {
        command: "npm run dev -- --port 3100",
        url: "http://127.0.0.1:3100",
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
