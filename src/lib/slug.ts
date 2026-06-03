import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Returns a post slug unique against existing rows, optionally excluding one id. */
export async function uniquePostSlug(title: string, excludeId?: number): Promise<string> {
  const base = slugify(title) || "artikel";
  let candidate = base;
  let n = 1;
  // Loop until no other row holds the candidate slug.
  while (true) {
    const [row] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, candidate))
      .limit(1);
    if (!row || row.id === excludeId) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}
