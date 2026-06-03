import { db } from "@/db";
import { banners } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export type Banner = typeof banners.$inferSelect;

export async function getActiveBanners(): Promise<Banner[]> {
  return db
    .select()
    .from(banners)
    .where(eq(banners.isActive, true))
    .orderBy(asc(banners.sortOrder), asc(banners.id));
}
