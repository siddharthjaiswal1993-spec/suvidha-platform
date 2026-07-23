/**
 * Helpers for the JSON-serialized `String` columns used across the schema (see the header comment
 * in prisma/schema.prisma for why we avoid Prisma's native Json type: it keeps the schema portable
 * between the SQLite prototype and a future Postgres deployment without any column-type changes).
 */

export function toJsonColumn(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export function fromJsonColumn<T>(column: string | null | undefined, fallback: T): T {
  if (!column) return fallback;
  try {
    return JSON.parse(column) as T;
  } catch {
    return fallback;
  }
}
