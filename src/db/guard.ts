import { sql } from "drizzle-orm";
import { db } from "./index";

type Target = { host: string; name: string };

/** Host & nama database dari DATABASE_URL, buat ditunjukkan sebelum menghapus. */
function target(): Target {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL belum di-set.");
  const u = new URL(raw);
  return { host: u.hostname, name: u.pathname.replace(/^\//, "") || "(tanpa nama)" };
}

/**
 * Pagar untuk skrip yang menghapus isi tabel.
 *
 * Database dev dan produksi di proyek ini SATU dan SAMA, jadi `pnpm db:seed`
 * yang dijalankan "buat lokal" tetap menghapus data produksi — dan itu sudah
 * pernah kejadian (tabel `media` habis, tersisa satu baris). Karena tidak ada
 * cara otomatis membedakan dev dari prod di sini, satu-satunya pengaman yang
 * jujur adalah memaksa operator melihat isi tabelnya dulu lalu mengetik ulang
 * nama database sebagai konfirmasi.
 */
export async function assertDestructiveAllowed(
  skrip: string,
  tabel: string[]
): Promise<void> {
  const { host, name } = target();

  const isi: string[] = [];
  for (const t of tabel) {
    const res = await db.execute(sql.raw(`select count(*)::int as n from "${t}"`));
    const n = (res.rows[0] as { n: number }).n;
    isi.push(`${t}: ${n} baris`);
  }

  console.log(`\n⚠️  ${skrip} akan MENGHAPUS ISI tabel berikut:`);
  for (const baris of isi) console.log(`     - ${baris}`);
  console.log(`   Database : ${name}`);
  console.log(`   Host     : ${host}\n`);

  if (process.env.WIPE_DB === name) {
    console.log("   Konfirmasi cocok, lanjut.\n");
    return;
  }

  console.error(
    "   Dibatalkan. Kalau memang mau menghapusnya, ulangi dengan menyebut\n" +
      `   nama databasenya:\n\n     WIPE_DB=${name} pnpm ${skrip}\n\n` +
      "   Ingat: host di atas juga dipakai situs produksi.\n"
  );
  process.exit(1);
}
