/**
 * Sinkronisasi data pengurus dengan daftar resmi "Data Kepengurusan &
 * Keanggotaan LIPAN-RI 2026".
 *
 * Keputusan yang mendasari skrip ini:
 *  - NIA menggantikan `nomor_anggota` (format lama LIPAN-{tahun}-{urut} dibuang
 *    untuk 16 orang di daftar; Dewan Pembina & Penasehat tidak ada di daftar
 *    sehingga dibiarkan apa adanya, nomor lamanya tetap).
 *  - `slug` TIDAK diubah walau nama berubah ejaan. Slug adalah alamat di QR
 *    yang sudah dicetak; menggantinya akan mematikan kartu yang beredar.
 *
 * Pencocokan memakai id baris, bukan nama, karena beberapa nama memang berubah
 * ejaan (Wiryanto -> Wisrianto, Muhammad -> Muchamad, dst).
 *
 * Jalankan dry-run dulu (default), lalu `--apply` untuk menulis:
 *   pnpm tsx --env-file=.env.local scripts/sync-pengurus-2026.ts
 *   pnpm tsx --env-file=.env.local scripts/sync-pengurus-2026.ts --apply
 */
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pengurus } from "@/db/schema";
import { slugify } from "@/lib/slug";

const MULAI_MENJABAT = new Date(Date.UTC(2026, 0, 1));

/** Baris yang sudah ada, dicocokkan lewat id. */
const UPDATE: ReadonlyArray<{
  id: number;
  nama: string;
  jabatan: string;
  nia: string;
}> = [
  { id: 3, nama: "Harun Prayitno, SE., SH., M.H", jabatan: "Ketua LIPAN-RI", nia: "1969.01.01.017" },
  { id: 4, nama: "Wisrianto, ST", jabatan: "Staf Khusus Ketua", nia: "1980.115.07.025" },
  { id: 5, nama: "Mulkan Lessy Tussen", jabatan: "Koordinator Keamanan", nia: "1970.108.10.023" },
  { id: 6, nama: "Cahya Puspita Rini, SE", jabatan: "Sekretaris Jenderal", nia: "1996.81.09.018" },
  { id: 7, nama: "Velia Dwi Yulianti, SE", jabatan: "Bendahara Umum", nia: "1999.114.10.024" },
  { id: 8, nama: "Ruswondo, SH", jabatan: "SDM & Umum", nia: "1965.110.10.023" },
  { id: 9, nama: "Annisa Novianty, SH., M.H.", jabatan: "Ketua Divisi Bantuan Hukum & HAM", nia: "1999.116.10.024" },
  { id: 10, nama: "Adam Maulana Hafiz, SH", jabatan: "Staf Divisi", nia: "2001.117.08.025" },
  { id: 11, nama: "Firdausi Aglis Akbar, SH", jabatan: "Staf Divisi", nia: "2003.118.08.025" },
  { id: 12, nama: "Najib Payudin", jabatan: "Divisi Pengawasan", nia: "1982.112.09.024" },
  { id: 13, nama: "Ardi Erfindo Wael", jabatan: "Divisi Pengawasan", nia: "1982.111.09.024" },
  { id: 14, nama: "Yandi Nurarifiandi, S.Sos", jabatan: "Ketua Divisi Media Infokom", nia: "1976.91.02.023" },
  { id: 15, nama: "Yudha Hafiz, S.BNS", jabatan: "Staf Divisi", nia: "2003.119.08.025" },
  { id: 16, nama: "Ahmada Aliftano Nugroho, SH", jabatan: "Staf Divisi", nia: "2003.121.03.026" },
  { id: 17, nama: "M. Ihsan Naufal", jabatan: "Staf Divisi", nia: "2000.120.10.025" },
  { id: 18, nama: "Muchamad Faizal Amri", jabatan: "Divisi Investigasi", nia: "1987.85.11.021" },
];

/** Driver tidak punya kotak di bagan, jadi `slot` sengaja null. */
const INSERT: ReadonlyArray<{ nama: string; jabatan: string; nia: string }> = [
  { nama: "Nurul Huda", jabatan: "Driver", nia: "1979.113.08.024" },
  { nama: "Ahmad Aji Susilo", jabatan: "Driver", nia: "1991.122.03.026" },
];

async function main() {
  const apply = process.argv.includes("--apply");

  const sebelum = await db.select().from(pengurus).orderBy(asc(pengurus.id));
  const byId = new Map(sebelum.map((r) => [r.id, r]));

  console.log(apply ? "== MENULIS (--apply) ==" : "== DRY RUN (tanpa --apply) ==");
  console.log(`Baris di DB saat ini: ${sebelum.length}\n`);

  console.log("-- PERUBAHAN --");
  for (const u of UPDATE) {
    const lama = byId.get(u.id);
    if (!lama) throw new Error(`Baris id=${u.id} tidak ada di DB — batalkan.`);

    const diff: string[] = [];
    if (lama.nama !== u.nama) diff.push(`nama: "${lama.nama}" -> "${u.nama}"`);
    if (lama.jabatan !== u.jabatan) diff.push(`jabatan: "${lama.jabatan}" -> "${u.jabatan}"`);
    if (lama.nomorAnggota !== u.nia) diff.push(`nomor: ${lama.nomorAnggota} -> ${u.nia}`);

    console.log(
      diff.length === 0
        ? `id ${String(u.id).padStart(2)} [${lama.slug}] tidak berubah`
        : `id ${String(u.id).padStart(2)} [${lama.slug}]\n      ${diff.join("\n      ")}`,
    );
  }

  console.log("\n-- BARIS BARU --");
  for (const i of INSERT) {
    console.log(`+ ${slugify(i.nama)} | ${i.nia} | ${i.nama} | ${i.jabatan} | slot: null`);
  }

  const disentuh = new Set(UPDATE.map((u) => u.id));
  console.log("\n-- DIBIARKAN --");
  for (const r of sebelum) {
    if (!disentuh.has(r.id)) {
      console.log(`  id ${String(r.id).padStart(2)} ${r.nomorAnggota} | ${r.nama} | ${r.jabatan}`);
    }
  }

  if (!apply) {
    console.log("\nDry run selesai. Tambahkan --apply untuk menulis.");
    return;
  }

  await db.transaction(async (tx) => {
    for (const u of UPDATE) {
      await tx
        .update(pengurus)
        .set({ nama: u.nama, jabatan: u.jabatan, nomorAnggota: u.nia, updatedAt: new Date() })
        .where(eq(pengurus.id, u.id));
    }
    for (const i of INSERT) {
      await tx.insert(pengurus).values({
        slug: slugify(i.nama),
        nomorAnggota: i.nia,
        nama: i.nama,
        jabatan: i.jabatan,
        status: "aktif",
        mulaiMenjabat: MULAI_MENJABAT,
      });
    }
  });

  const sesudah = await db.select().from(pengurus).orderBy(asc(pengurus.id));
  console.log(`\nSelesai. Baris sekarang: ${sesudah.length}`);
}

main().then(() => process.exit(0));
