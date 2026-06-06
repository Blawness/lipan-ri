import { db } from "@/db";
import { posts, banners } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

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
