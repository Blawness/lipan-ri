import { db } from "@/db";
import { pages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getPageBySlug(slug: string) {
  const result = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, slug))
    .limit(1);
  return result[0] ?? null;
}

export async function getAllPages() {
  return db.select({
    slug: pages.slug,
    title: pages.title,
  }).from(pages);
}
