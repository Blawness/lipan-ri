/**
 * Seed 5 jenis surat inti LIPAN-RI ke `letter_templates`.
 *
 * Idempoten: dicocokkan lewat `code` (kolom unik). Kode yang sudah ada
 * di-update, yang belum ada di-insert. TIDAK pernah menghapus baris lain —
 * dev & prod berbagi satu database Neon, jadi skrip ini sengaja aditif.
 *
 * Pola nomor memakai token yang dikenali `renderNumberPattern`
 * (src/lib/surat/nomor.ts): {seq} {tahun} {bulan} {bulanRomawi} {kode}.
 *
 * bodyDefault hanya boleh memakai tag di SURAT_ALLOWED_TAGS — kontraknya
 * dengan pemeta HTML→PDF. Isian field TIDAK ditempel ke dalam badan surat;
 * react-pdf mencetaknya sebagai baris "Label : nilai" di atas badan surat
 * (lihat FieldRows di src/lib/surat/pdf/surat-document.tsx), jadi badan surat
 * ditulis dengan mengacu ke tabel itu, bukan mengulang isinya.
 *
 * Dry-run dulu (default), lalu `--apply` untuk menulis:
 *   pnpm tsx --env-file=.env.local scripts/seed-letter-templates.ts
 *   pnpm tsx --env-file=.env.local scripts/seed-letter-templates.ts --apply
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { letterTemplates, type LetterTemplateField } from "@/db/schema";
import { sanitizeSuratHtml } from "@/lib/sanitize";

const POLA = "{seq}/{kode}/LIPAN-RI/{bulanRomawi}/{tahun}";

type Seed = {
  code: string;
  name: string;
  fields: LetterTemplateField[];
  bodyDefault: string;
};

const t = (key: string, label: string, required = true): LetterTemplateField => ({
  key, label, type: "text", required,
});
const ta = (key: string, label: string, required = true): LetterTemplateField => ({
  key, label, type: "textarea", required,
});
const d = (key: string, label: string, required = true): LetterTemplateField => ({
  key, label, type: "date", required,
});

const SEEDS: Seed[] = [
  {
    code: "ST",
    name: "Surat Tugas",
    fields: [
      t("nama", "Nama Petugas"),
      t("jabatan", "Jabatan"),
      t("nomor_anggota", "Nomor Anggota", false),
      ta("keperluan", "Untuk Melaksanakan"),
      t("lokasi", "Tempat Pelaksanaan"),
      d("mulai", "Tanggal Mulai"),
      d("selesai", "Tanggal Selesai", false),
    ],
    bodyDefault: `
<p>Yang bertanda tangan di bawah ini, Pimpinan Lembaga Investigasi Pengawasan Aparatur Negara Republik Indonesia (LIPAN-RI), dengan ini menugaskan nama sebagaimana tersebut di atas untuk:</p>
<ol>
<li>Melaksanakan tugas sesuai keperluan, tempat, dan waktu yang tercantum dalam surat tugas ini;</li>
<li>Menjalankan tugas secara profesional serta menjunjung tinggi Anggaran Dasar, Anggaran Rumah Tangga, dan Kode Etik LIPAN-RI;</li>
<li>Berkoordinasi dengan pihak terkait di lokasi penugasan;</li>
<li>Menyampaikan laporan tertulis kepada pimpinan paling lambat 7 (tujuh) hari setelah tugas selesai dilaksanakan.</li>
</ol>
<p>Segala biaya yang timbul akibat pelaksanaan tugas ini dibebankan pada anggaran organisasi sesuai ketentuan yang berlaku.</p>
<p>Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.</p>
`,
  },
  {
    code: "SK",
    name: "Surat Keputusan",
    fields: [
      t("tentang", "Tentang"),
      ta("menimbang", "Menimbang", false),
      ta("mengingat", "Mengingat", false),
      d("berlaku", "Berlaku Mulai", false),
    ],
    bodyDefault: `
<h3>MEMUTUSKAN</h3>
<p><strong>Menetapkan:</strong></p>
<ol>
<li><strong>KESATU</strong> — Menetapkan hal sebagaimana tercantum dalam bagian "Tentang" surat keputusan ini.</li>
<li><strong>KEDUA</strong> — Pihak yang ditetapkan wajib melaksanakan tugas dan tanggung jawabnya sesuai Anggaran Dasar, Anggaran Rumah Tangga, dan Kode Etik LIPAN-RI.</li>
<li><strong>KETIGA</strong> — Segala biaya yang timbul akibat ditetapkannya keputusan ini dibebankan pada anggaran organisasi.</li>
<li><strong>KEEMPAT</strong> — Keputusan ini berlaku sejak tanggal ditetapkan, dengan ketentuan apabila di kemudian hari terdapat kekeliruan akan diperbaiki sebagaimana mestinya.</li>
</ol>
<p>Demikian surat keputusan ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
`,
  },
  {
    code: "SM",
    name: "Surat Mandat",
    fields: [
      t("nama", "Nama Penerima Mandat"),
      t("jabatan", "Jabatan"),
      t("nomor_anggota", "Nomor Anggota", false),
      ta("lingkup", "Lingkup Mandat"),
      t("wilayah", "Wilayah Kerja", false),
      d("mulai", "Berlaku Mulai"),
      d("selesai", "Berlaku Sampai", false),
    ],
    bodyDefault: `
<p>Yang bertanda tangan di bawah ini, Pimpinan Lembaga Investigasi Pengawasan Aparatur Negara Republik Indonesia (LIPAN-RI), dengan ini memberikan mandat kepada nama sebagaimana tersebut di atas untuk bertindak untuk dan atas nama LIPAN-RI dalam lingkup yang telah ditetapkan.</p>
<p>Dalam menjalankan mandat ini, penerima mandat berkewajiban:</p>
<ol>
<li>Bertindak sesuai lingkup dan wilayah kerja yang diberikan, serta tidak melampaui kewenangan yang dimandatkan;</li>
<li>Menjunjung tinggi Anggaran Dasar, Anggaran Rumah Tangga, dan Kode Etik LIPAN-RI;</li>
<li>Melaporkan pelaksanaan mandat kepada pimpinan secara berkala.</li>
</ol>
<p>Mandat ini gugur dengan sendirinya apabila masa berlakunya berakhir atau dicabut oleh pemberi mandat.</p>
<p>Demikian surat mandat ini dibuat untuk dipergunakan sebagaimana mestinya.</p>
`,
  },
  {
    code: "SKET",
    name: "Surat Keterangan",
    fields: [
      t("nama", "Nama"),
      t("ttl", "Tempat, Tanggal Lahir", false),
      t("nomor_anggota", "Nomor Anggota", false),
      t("jabatan", "Jabatan", false),
      ta("alamat", "Alamat", false),
      ta("keperluan", "Untuk Keperluan"),
    ],
    bodyDefault: `
<p>Yang bertanda tangan di bawah ini, Pimpinan Lembaga Investigasi Pengawasan Aparatur Negara Republik Indonesia (LIPAN-RI), dengan ini menerangkan bahwa nama sebagaimana tersebut di atas adalah benar tercatat pada Lembaga Investigasi Pengawasan Aparatur Negara Republik Indonesia.</p>
<p>Selama tercatat pada lembaga ini, yang bersangkutan menunjukkan perilaku baik dan tidak sedang menjalani sanksi organisasi.</p>
<p>Surat keterangan ini diberikan untuk keperluan sebagaimana tersebut di atas dan hanya berlaku untuk keperluan tersebut.</p>
<p>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.</p>
`,
  },
  {
    code: "UND",
    name: "Surat Undangan",
    fields: [
      t("kepada", "Kepada Yth."),
      t("acara", "Acara"),
      t("hari_tanggal", "Hari / Tanggal"),
      t("waktu", "Waktu"),
      ta("tempat", "Tempat"),
      ta("agenda", "Agenda", false),
      t("pakaian", "Pakaian", false),
    ],
    bodyDefault: `
<p>Dengan hormat,</p>
<p>Sehubungan dengan agenda organisasi Lembaga Investigasi Pengawasan Aparatur Negara Republik Indonesia (LIPAN-RI), dengan ini kami mengundang Bapak/Ibu/Saudara untuk hadir pada acara sebagaimana tercantum di atas.</p>
<p>Mengingat pentingnya acara tersebut, kami mengharapkan kehadiran Bapak/Ibu/Saudara tepat pada waktunya. Konfirmasi kehadiran dapat disampaikan kepada sekretariat LIPAN-RI.</p>
<p>Demikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.</p>
`,
  },
];

async function main() {
  const apply = process.argv.includes("--apply");
  const existing = await db.select().from(letterTemplates);
  const byCode = new Map(existing.map((r) => [r.code, r]));

  for (const seed of SEEDS) {
    const values = {
      code: seed.code,
      name: seed.name,
      numberPattern: POLA,
      bodyDefault: sanitizeSuratHtml(seed.bodyDefault.trim()),
      fields: seed.fields,
      isActive: true,
    };
    const found = byCode.get(seed.code);
    const aksi = found ? "update" : "insert";
    const contoh = POLA
      .replace("{seq}", "001")
      .replace("{kode}", seed.code)
      .replace("{bulanRomawi}", "IX")
      .replace("{tahun}", "2026");
    console.log(
      `${apply ? aksi.toUpperCase() : `[dry-run] ${aksi}`}  ${seed.code.padEnd(5)} ${seed.name.padEnd(18)} ${contoh}  (${seed.fields.length} field)`
    );
    if (!apply) continue;
    if (found) {
      await db
        .update(letterTemplates)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(letterTemplates.id, found.id));
    } else {
      await db.insert(letterTemplates).values(values);
    }
  }

  console.log(
    apply
      ? "\nSelesai. Cek di /admin/surat/template."
      : "\nDry-run. Jalankan ulang dengan --apply untuk menulis ke database."
  );
}

main().then(() => process.exit(0));
