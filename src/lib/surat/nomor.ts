const ROMAWI = [
  "I", "II", "III", "IV", "V", "VI",
  "VII", "VIII", "IX", "X", "XI", "XII",
] as const;

/** Bulan 1..12 → angka romawi, sesuai konvensi penomoran surat Indonesia. */
export function bulanRomawi(month: number): string {
  return ROMAWI[month - 1] ?? "";
}

export type NumberContext = {
  seq: number;
  date: Date;
  code: string;
};

/**
 * Render pola nomor surat. Token tak dikenal sengaja dibiarkan apa adanya
 * supaya salah ketik pola langsung kelihatan di pratinjau, bukan hilang diam-diam.
 */
export function renderNumberPattern(
  pattern: string,
  { seq, date, code }: NumberContext
): string {
  const month = date.getMonth() + 1;
  const tokens: Record<string, string> = {
    "{seq}": String(seq).padStart(3, "0"),
    "{tahun}": String(date.getFullYear()),
    "{bulan}": String(month).padStart(2, "0"),
    "{bulanRomawi}": bulanRomawi(month),
    "{kode}": code,
  };
  return pattern.replace(
    /\{seq\}|\{tahun\}|\{bulanRomawi\}|\{bulan\}|\{kode\}/g,
    (m) => tokens[m]
  );
}
