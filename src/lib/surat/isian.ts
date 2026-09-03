import type { LetterTemplateField } from "@/db/schema";

// Tanggal isian adalah tanggal kalender polos ("2026-09-10"), bukan momen
// waktu. Diformat di UTC supaya tanggalnya tidak bergeser sehari tergantung
// zona waktu server — pola yang sama dipakai src/lib/pengurus-rules.ts.
const tanggalFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeZone: "UTC",
});

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Nilai isian sebagaimana harus tampil di layar dan di PDF. Hanya field
 * bertipe `date` yang diubah; sisanya apa adanya. Tanggal yang tidak berformat
 * ISO dikembalikan mentah, bukan jadi "Invalid Date".
 */
export function formatFieldValue(
  type: LetterTemplateField["type"],
  value: string
): string {
  if (type !== "date" || !ISO_DATE.test(value)) return value;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? value : tanggalFmt.format(d);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Menyulih token `{{key}}` di badan surat dengan nilai isiannya.
 *
 * Token yang key-nya TIDAK ada di definisi template sengaja dibiarkan utuh —
 * sama seperti `renderNumberPattern` pada pola nomor: salah ketik nama field
 * harus kelihatan di pratinjau, bukan hilang diam-diam jadi ruang kosong di
 * surat yang sudah disahkan. Token yang key-nya ada tapi isiannya kosong tetap
 * disulih (jadi kosong), karena field opsional yang tidak diisi memang tidak
 * punya apa-apa untuk dicetak.
 *
 * Nilai di-escape sebelum masuk: badan surat dirender lewat
 * `dangerouslySetInnerHTML` dan dibaca parser HTML→PDF, jadi isian yang
 * kebetulan mengandung `<` tidak boleh berubah jadi tag.
 */
export function renderFieldTokens(
  html: string,
  fields: LetterTemplateField[],
  values: Record<string, string>
): string {
  if (fields.length === 0) return html;
  const byKey = new Map(fields.map((f) => [f.key, f]));
  return html.replace(/\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g, (utuh, key: string) => {
    const field = byKey.get(key);
    if (!field) return utuh;
    return escapeHtml(formatFieldValue(field.type, values[key] ?? ""));
  });
}

export type SuratIsian = {
  /** Badan surat dengan token `{{key}}` sudah disulih. */
  bodyHtml: string;
  /** Baris isian, nilainya sudah diformat siap cetak. */
  fields: { key: string; label: string; value: string }[];
};

/**
 * Menyiapkan badan surat dan baris isian sekali jalan.
 *
 * Dipakai bersama oleh pratinjau di panel admin dan perender PDF supaya
 * keduanya tidak bisa berbeda: apa yang dilihat penandatangan sebelum
 * mengesahkan harus persis yang tercetak di berkas.
 */
export function siapkanIsian(letter: {
  bodyHtml: string;
  templateFields: LetterTemplateField[];
  fieldValues: Record<string, string>;
}): SuratIsian {
  return {
    bodyHtml: renderFieldTokens(letter.bodyHtml, letter.templateFields, letter.fieldValues),
    fields: letter.templateFields.map((f) => ({
      key: f.key,
      label: f.label,
      value: formatFieldValue(f.type, letter.fieldValues[f.key] ?? ""),
    })),
  };
}
