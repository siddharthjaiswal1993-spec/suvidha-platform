// Used by the Prisma CLI (migrate/generate/studio) — the app itself connects via the driver
// adapter in src/lib/db.ts, not this file. Falls back to the bundled SQLite file so `npm install
// && npm run db:seed` works from a clean clone with no .env required — see README.md.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? "file:./prisma/dev.db",
  },
});
