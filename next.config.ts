import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright's e2e suite drives the dev server via 127.0.0.1 — without this, Next.js blocks
  // that origin's HMR websocket, which otherwise breaks client-side interactivity during tests.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
