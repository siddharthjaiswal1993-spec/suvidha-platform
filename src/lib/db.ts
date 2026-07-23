import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * Resolves the SQLite file Prisma should connect to.
 *
 * Local dev / CI: a plain file at prisma/dev.db, exactly as documented in README.md.
 *
 * Vercel (or any read-only-filesystem deployment): the project bundle itself is read-only, so we
 * copy the pre-seeded prisma/dev.db into /tmp on cold start and connect there instead. This makes
 * the deployed demo writable, but /tmp is only guaranteed to persist for the lifetime of one warm
 * serverless instance — a cold start or a second concurrent instance gets a fresh copy of the
 * seed. This is a documented, deliberate limitation of a self-contained SQLite prototype; see
 * docs/ARCHITECTURE.md ("Known limitations of the deployed demo") for the PostgreSQL migration
 * path that removes it.
 */
function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

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

  return "file:./prisma/dev.db";
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
