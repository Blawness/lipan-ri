import { CopyObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@blawness/admin-kit";
import { db } from "@/db";
import { jalurUnggahan } from "@/lib/admin/media-url";
import { posts, pages, banners, documents, pengurus } from "@/db/schema";
import { sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

export { jalurUnggahan };

/** Kolom yang isinya satu URL utuh, dibandingkan setelah host-nya dibuang. */
function jalurnyaSama(kolom: PgColumn, jalur: string): SQL {
  return sql`regexp_replace(${kolom}, '^https?://[^/]+', '') = ${jalur}`;
}

/**
 * Kolom yang isinya HTML/JSON dan bisa memuat URL unggahan di dalamnya.
 * Dicocokkan sebagai substring jalur — `position`, bukan `like`, supaya isi
 * jalur tidak perlu di-escape dan tidak ada wildcard yang bocor.
 */
function memuatJalur(kolom: PgColumn, jalur: string): SQL {
  return sql`position(${jalur} in ${kolom}) > 0`;
}

/**
 * Berapa banyak konten yang masih memakai berkas ini.
 * Dipakai untuk mencegah penghapusan media yang masih dirujuk di situs —
 * dan penghapusan media ikut menghapus objeknya di R2, jadi setiap tempat
 * yang bisa menyimpan URL unggahan WAJIB terdaftar di sini.
 *
 * Yang ikut dihitung: kolom URL tersendiri (gambar utama berita, banner,
 * berkas dokumen, foto pengurus) dan gambar yang ditempel di dalam badan
 * berita/halaman. Badan konten dicocokkan sebagai substring, jadi bisa
 * kelebihan hitung kalau ada key lain yang memuat jalur ini utuh — itu arah
 * salah yang aman: penghapusan ditolak, berkas tidak hilang.
 */
export async function countMediaReferences(url: string): Promise<number> {
  const jalur = jalurUnggahan(url);
  const jumlah = await Promise.all([
    hitung(posts, jalurnyaSama(posts.featuredImage, jalur)),
    hitung(banners, jalurnyaSama(banners.imageUrl, jalur)),
    hitung(documents, jalurnyaSama(documents.fileUrl, jalur)),
    hitung(pengurus, jalurnyaSama(pengurus.foto, jalur)),
    hitung(posts, memuatJalur(posts.content, jalur)),
    hitung(pages, memuatJalur(pages.content, jalur)),
  ]);
  return jumlah.reduce((a, b) => a + b, 0);
}

async function hitung(tabel: PgTable, where: SQL): Promise<number> {
  const r = await db.select({ n: sql<number>`count(*)` }).from(tabel).where(where);
  return Number(r[0].n);
}

/** Error dari R2 yang artinya objeknya memang tidak ada di sana. */
function objekTidakAda(err: unknown): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return (
    e?.name === "NoSuchKey" ||
    e?.name === "NotFound" ||
    e?.$metadata?.httpStatusCode === 404
  );
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
 * Salinannya lewat CopyObject — server-side di R2, jadi berkas besar tidak
 * perlu ditarik ke memori fungsi lalu diunggah balik.
 *
 * Catatan: bucket ini publik, jadi salinan di `trash/` juga masih bisa
 * diakses siapa saja yang menebak key-nya. Kalau yang dihapus memang berkas
 * sensitif, hapus juga salinannya dari `trash/` lewat dashboard R2.
 *
 * Key-nya diambil dari jalur URL, bukan dari awalan R2_PUBLIC_URL — lihat
 * [jalurUnggahan]. URL dengan host lama pun tetap ikut diarsipkan.
 *
 * Mengembalikan key salinannya, atau null kalau tidak ada yang perlu disalin:
 * objeknya tidak ada di bucket kita (URL eksternal/seed, atau baris media
 * yatim — tidak ada yang bisa hilang). Kegagalan lain sengaja dilempar supaya
 * penghapusan ikut batal: lebih baik gagal hapus daripada hapus tanpa jaring.
 */
export async function arsipkanObjekR2(url: string): Promise<string | null> {
  const key = jalurUnggahan(url).replace(/^\/+/, "");
  if (!key) return null;

  const Bucket = R2_BUCKET();
  const tujuan = `trash/${new Date().toISOString().slice(0, 10)}/${key}`;

  try {
    await r2().send(
      new CopyObjectCommand({
        Bucket,
        Key: tujuan,
        // CopySource harus "<bucket>/<key>" dengan tiap ruas ter-encode,
        // tapi pemisah "/"-nya tetap utuh.
        CopySource: `${Bucket}/${key}`.split("/").map(encodeURIComponent).join("/"),
      })
    );
  } catch (err) {
    if (objekTidakAda(err)) return null;
    throw err;
  }

  return tujuan;
}
