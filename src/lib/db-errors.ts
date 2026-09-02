/**
 * Kode error Postgres. `drizzle-orm/node-postgres` (0.45.x) membungkus setiap
 * error query jadi `DrizzleQueryError`, yang hanya punya
 * `message`/`query`/`params`/`cause` — `.code` milik `pg`'s `DatabaseError`
 * ada di `.cause` (kadang berlapis lagi kalau ada wrapper lain di antaranya).
 * Jadi predikat ini menyusuri rantai `cause`, bukan cuma objek teratas.
 */
export function isPgErrorCode(e: unknown, code: string): boolean {
  let current: unknown = e;
  for (let depth = 0; depth < 5 && current != null; depth++) {
    if (
      typeof current === "object" &&
      "code" in current &&
      (current as { code?: unknown }).code === code
    ) {
      return true;
    }
    current =
      typeof current === "object" && current !== null && "cause" in current
        ? (current as { cause?: unknown }).cause
        : undefined;
  }
  return false;
}

/** Unique violation — mis. bentrok pada constraint `(templateId, numberYear, numberSeq)`. */
export function isUniqueViolation(e: unknown): boolean {
  return isPgErrorCode(e, "23505");
}

/** Foreign key violation — mis. menghapus baris yang masih direferensikan `ON DELETE restrict`. */
export function isForeignKeyViolation(e: unknown): boolean {
  return isPgErrorCode(e, "23503");
}
