/**
 * Mengisi kolom `position` (jabatan) pada tabel `signatories`.
 *
 * Kenapa perlu: `position` adalah baris jabatan yang tercetak di atas nama
 * pada blok tanda tangan PDF. Selama null, surat terbit dengan nama tanpa
 * jabatan. (Catatan: `signatories.title` BUKAN jabatan — itu gelar,
 * mis. "SE, SH, MH". Jangan tertukar.)
 *
 * Jabatannya berpatokan pada tabel `pengurus` (daftar kepengurusan resmi),
 * kecuali kalau penyebutan di surat memang berbeda — lihat catatan di
 * `JABATAN`. Pencocokan memakai id baris `signatories`, bukan nama, karena
 * ejaan nama di dua tabel itu berbeda (`signatories` menyimpan nama tanpa
 * gelar).
 *
 * Dry-run dulu (default), lalu `--apply` untuk menulis:
 *   pnpm tsx --env-file=.env.local scripts/sync-jabatan-penandatangan.ts
 *   pnpm tsx --env-file=.env.local scripts/sync-jabatan-penandatangan.ts --apply
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { signatories } from "@/db/schema";

const JABATAN: Record<number, string> = {
  // "Ketua Umum" adalah penyebutan yang dipakai di surat — tabel `pengurus`
  // menulisnya "Ketua LIPAN-RI", dan yang dipakai di sini menang.
  1: "Ketua Umum", // Harun Prayitno, SE., SH., M.H
  5: "Sekretaris Jenderal", // Cahya Puspita Rini, SE
};

async function main() {
  const apply = process.argv.includes("--apply");
  const rows = await db.select().from(signatories);

  for (const row of rows) {
    const jabatan = JABATAN[row.id];
    if (!jabatan) {
      console.log(`lewati  #${row.id} ${row.name} — tidak ada di daftar`);
      continue;
    }
    if (row.position === jabatan) {
      console.log(`sudah   #${row.id} ${row.name} → ${jabatan}`);
      continue;
    }
    console.log(
      `${apply ? "TULIS  " : "[dry]  "} #${row.id} ${row.name}: ${row.position ?? "(kosong)"} → ${jabatan}`
    );
    if (apply) {
      await db.update(signatories).set({ position: jabatan }).where(eq(signatories.id, row.id));
    }
  }

  console.log(
    apply
      ? "\nSelesai. Cek di /admin/penandatangan."
      : "\nDry-run. Jalankan ulang dengan --apply untuk menulis ke database."
  );
}

main().then(() => process.exit(0));
