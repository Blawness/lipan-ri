import { db } from "@/db";
import { banners } from "@/db/schema";
import { eq, asc, gt, lt, and, desc } from "drizzle-orm";

export type BannerInput = {
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  buttonLink: string | null;
};

export async function listBanners() {
  return db
    .select()
    .from(banners)
    .orderBy(asc(banners.sortOrder), asc(banners.id));
}

export async function getBanner(id: number) {
  const [row] = await db.select().from(banners).where(eq(banners.id, id));
  return row ?? null;
}

export async function createBanner(input: BannerInput) {
  const [last] = await db
    .select({ sortOrder: banners.sortOrder })
    .from(banners)
    .orderBy(desc(banners.sortOrder))
    .limit(1);
  const nextOrder = (last?.sortOrder ?? 0) + 1;
  await db.insert(banners).values({ ...input, sortOrder: nextOrder });
}

export async function updateBanner(id: number, input: BannerInput) {
  await db.update(banners).set(input).where(eq(banners.id, id));
}

export async function deleteBanner(id: number) {
  await db.delete(banners).where(eq(banners.id, id));
}

export async function toggleBanner(id: number) {
  const row = await getBanner(id);
  if (!row) return;
  await db
    .update(banners)
    .set({ isActive: !row.isActive })
    .where(eq(banners.id, id));
}

export async function reorderBanner(id: number, dir: "up" | "down") {
  const current = await getBanner(id);
  if (current == null || current.sortOrder == null) return;

  const neighbor = dir === "up"
    ? (await db
        .select()
        .from(banners)
        .where(and(lt(banners.sortOrder, current.sortOrder)))
        .orderBy(desc(banners.sortOrder))
        .limit(1))[0]
    : (await db
        .select()
        .from(banners)
        .where(and(gt(banners.sortOrder, current.sortOrder)))
        .orderBy(asc(banners.sortOrder))
        .limit(1))[0];

  if (!neighbor || neighbor.sortOrder == null) return;

  await db.update(banners).set({ sortOrder: neighbor.sortOrder }).where(eq(banners.id, current.id));
  await db.update(banners).set({ sortOrder: current.sortOrder }).where(eq(banners.id, neighbor.id));
}
