import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Next.js aliases this to a no-op in server bundles; the real package unconditionally
      // throws (by design, to catch server code leaking into client bundles at Next build time),
      // which isn't the concern under plain Vitest — see src/lib/authz/guards.test.ts.
      "server-only": path.resolve(__dirname, "./src/lib/testing/server-only-stub.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "tests-e2e/**"],
  },
});
