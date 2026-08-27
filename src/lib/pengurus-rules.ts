/** Format nomor anggota otomatis: LIPAN-{tahun}-{urut 4 digit}. */
const NOMOR_RE = /^LIPAN-(\d{4})-(\d{4})$/;

/**
 * Seorang pengurus tidak berlaku bila status-nya nonaktif ATAU masa jabatannya
 * sudah lewat. Dihitung saat request sehingga kedaluwarsa tidak butuh cron.
 */
export function isBerlaku(
  p: { status: string | null; selesaiMenjabat: Date | null },
  now: Date = new Date(),
): boolean {
  if (p.status !== "aktif") return false;
  if (p.selesaiMenjabat && p.selesaiMenjabat.getTime() <= now.getTime()) {
    return false;
  }
  return true;
}

/**
 * Nomor berikutnya untuk `year`. Nomor yang tidak mengikuti format diabaikan —
 * nomor ketikan manual (mis. kartu lama) tidak boleh menggeser urutan otomatis.
 */
export function nextNomorAnggota(existing: string[], year: number): string {
  let max = 0;
  for (const nomor of existing) {
    const m = NOMOR_RE.exec(nomor);
    if (!m || Number(m[1]) !== year) continue;
    max = Math.max(max, Number(m[2]));
  }
  return `LIPAN-${year}-${String(max + 1).padStart(4, "0")}`;
}
