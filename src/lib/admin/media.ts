import { db } from "@/db";
import { posts, banners, documents, pengurus } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Berapa banyak konten yang masih memakai URL berkas ini.
 * Dipakai untuk mencegah penghapusan media yang masih dirujuk di situs —
 * dan penghapusan media ikut menghapus objeknya di R2, jadi setiap kolom
 * yang menyimpan URL unggahan WAJIB terdaftar di sini. Yang belum tercakup:
 * gambar yang ditempel di dalam badan berita/halaman (URL-nya ada di HTML,
 * bukan di kolom tersendiri).
 */
export async function countMediaReferences(url: string): Promise<number> {
  const counts = await Promise.all(
    [
      db
        .select({ n: sql<number>`count(*)` })
        .from(posts)
        .where(eq(posts.featuredImage, url)),
      db
        .select({ n: sql<number>`count(*)` })
        .from(banners)
        .where(eq(banners.imageUrl, url)),
      db
        .select({ n: sql<number>`count(*)` })
        .from(documents)
        .where(eq(documents.fileUrl, url)),
      db
        .select({ n: sql<number>`count(*)` })
        .from(pengurus)
        .where(eq(pengurus.foto, url)),
    ].map(async (q) => Number((await q)[0].n))
  );
  return counts.reduce((a, b) => a + b, 0);
}
