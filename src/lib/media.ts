import { db } from "@/db";
import { media } from "@blawness/admin-kit/schema";
import { eq, inArray } from "drizzle-orm";

export async function getMediaByAlbum(album: string) {
  return db
    .select()
    .from(media)
    .where(eq(media.album, album))
    .orderBy(media.uploadedAt);
}

/**
 * Gabungan beberapa album dalam satu query — dipakai galeri publik supaya foto
 * yang dikurasi untuk halaman lain tetap ikut tampil tanpa perlu baris media
 * kembar. Baris kembar berbahaya: `countMediaReferences` menghitung rujukan per
 * URL, jadi menghapus salah satu baris bisa mengarsipkan berkas R2 yang masih
 * dipakai baris satunya.
 */
export async function getMediaByAlbums(albums: string[]) {
  if (albums.length === 0) return [];
  return db
    .select()
    .from(media)
    .where(inArray(media.album, albums))
    .orderBy(media.uploadedAt);
}

export async function getAllAlbums() {
  const result = await db
    .selectDistinct({ album: media.album })
    .from(media);
  return result.map((r) => r.album).filter(Boolean) as string[];
}
