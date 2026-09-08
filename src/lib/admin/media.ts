import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@blawness/admin-kit";
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

/**
 * Salin objek R2 ke `trash/<tanggal>/<key>` sebelum ia dihapus permanen.
 *
 * R2 di proyek ini tidak punya versioning dan tidak ada backup, jadi salah
 * klik di Galeri = berkas hilang selamanya — sudah pernah menghabiskan 9 PDF
 * dokumen. Salinan ini murni jaring pengaman: URL-nya tidak disimpan di mana
 * pun dan tidak dipakai aplikasi, tinggal disalin balik lewat dashboard R2
 * kalau ada yang menyesal.
 *
 * Catatan: bucket ini publik, jadi salinan di `trash/` juga masih bisa
 * diakses siapa saja yang menebak key-nya. Kalau yang dihapus memang berkas
 * sensitif, hapus juga salinannya dari `trash/` lewat dashboard R2.
 *
 * Mengembalikan key salinannya, atau null kalau URL-nya bukan milik R2 kita
 * (mis. gambar seed dari domain lama) sehingga tidak ada yang perlu disalin.
 */
export async function arsipkanObjekR2(url: string): Promise<string | null> {
  const publicUrl = R2_PUBLIC_URL();
  if (!publicUrl || !url.startsWith(`${publicUrl}/`)) return null;
  const key = url.slice(publicUrl.length + 1);
  if (!key) return null;

  const Bucket = R2_BUCKET();
  const asli = await r2().send(new GetObjectCommand({ Bucket, Key: key }));
  const isi = await asli.Body?.transformToByteArray();
  if (!isi) return null;

  const tujuan = `trash/${new Date().toISOString().slice(0, 10)}/${key}`;
  await r2().send(
    new PutObjectCommand({
      Bucket,
      Key: tujuan,
      Body: isi,
      ContentType: asli.ContentType,
    })
  );
  return tujuan;
}
