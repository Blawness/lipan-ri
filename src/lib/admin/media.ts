import { db } from "@/db";
import { media, posts, banners } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function listMedia() {
  return db.select().from(media).orderBy(desc(media.uploadedAt));
}

export async function getMediaById(id: number) {
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return row ?? null;
}

/**
 * Berapa banyak konten (berita + banner) yang masih memakai URL gambar ini.
 * Dipakai untuk mencegah penghapusan media yang masih dirujuk di situs.
 */
export async function countMediaReferences(url: string): Promise<number> {
  const [[p], [b]] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)` })
      .from(posts)
      .where(eq(posts.featuredImage, url)),
    db
      .select({ n: sql<number>`count(*)` })
      .from(banners)
      .where(eq(banners.imageUrl, url)),
  ]);
  return Number(p.n) + Number(b.n);
}

export async function deleteMediaRow(id: number) {
  await db.delete(media).where(eq(media.id, id));
}
