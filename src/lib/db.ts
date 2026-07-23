import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * Resolves the SQLite file Prisma should connect to.
 *
 * Vercel (or any read-only-filesystem deployment) is checked FIRST and takes priority over a
 * bare DATABASE_URL: the project bundle itself is read-only, so a `file:` URL pointing into it
 * (e.g. the local-dev default) would fail with SQLITE_READONLY. Instead we copy the pre-seeded
 * prisma/dev.db into /tmp on cold start and connect there. This makes the deployed demo writable,
 * but /tmp only persists for the lifetime of one warm serverless instance — a cold start or a
 * second concurrent instance gets a fresh copy of the seed. This is a documented, deliberate
 * limitation of a self-contained SQLite prototype; see docs/ARCHITECTURE.md ("Known limitations
 * of the deployed demo") for the PostgreSQL migration path that removes it — set DATABASE_URL to
 * a postgresql:// connection string via Vercel's env var UI to opt into that path, which this
 * function respects (a non-file:// URL always wins, on Vercel or off it).
 *
 * Local dev / CI: a plain file at prisma/dev.db, exactly as documented in README.md.
 */
function resolveDatabaseUrl(): string {
  const explicitUrl = process.env.DATABASE_URL;
  const isRealDatabaseUrl = explicitUrl && !explicitUrl.startsWith("file:");
  if (isRealDatabaseUrl) return explicitUrl;

  if (process.env.VERCEL) {
    const runtimeDbPath = "/tmp/suvidha-runtime.db";
    if (!fs.existsSync(runtimeDbPath)) {
      const seedDbPath = path.join(process.cwd(), "prisma", "dev.db");
      if (fs.existsSync(seedDbPath)) {
        fs.copyFileSync(seedDbPath, runtimeDbPath);
      }
    }
    return `file:${runtimeDbPath}`;
  }

  return explicitUrl ?? "file:./prisma/dev.db";
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: resolveDatabaseUrl() }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
