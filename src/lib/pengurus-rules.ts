/** Format nomor anggota otomatis: LIPAN-{tahun}-{urut 4 digit}. */
const NOMOR_RE = /^LIPAN-(\d{4})-(\d{4})$/;

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeZone: "UTC",
});

/** Rentang masa jabatan yang dibaca manusia, untuk halaman verifikasi publik. */
export function formatMasaBerlaku(mulai: Date, selesai: Date | null): string {
  const awal = dateFmt.format(mulai);
  return selesai ? `${awal} — ${dateFmt.format(selesai)}` : `${awal} s.d. sekarang`;
}

/**
 * Seorang pengurus tidak berlaku bila status-nya nonaktif ATAU masa jabatannya
 * sudah lewat. Dihitung saat request sehingga kedaluwarsa tidak butuh cron.
 *
 * `selesaiMenjabat` bersifat INKLUSIF: tanggal itu disimpan sebagai tengah
 * malam UTC dari form, tapi kartu masih harus terbaca "berlaku" sepanjang
 * hari yang tertera — bukan cuma sampai detik pertama hari itu. Karena itu
 * batasnya dibandingkan terhadap awal hari BERIKUTNYA, bukan tengah malam
 * `selesaiMenjabat` sendiri.
 */
export function isBerlaku(
  p: { status: string | null; selesaiMenjabat: Date | null },
  now: Date = new Date(),
): boolean {
  if (p.status !== "aktif") return false;
  if (p.selesaiMenjabat) {
    const akhirHari = new Date(p.selesaiMenjabat);
    akhirHari.setUTCDate(akhirHari.getUTCDate() + 1);
    if (now.getTime() >= akhirHari.getTime()) {
      return false;
    }
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

type SlotLabel = { role: string; variant: "utama" | "divisi" | "staf" };

type BarisPengurus = {
  slot: string | null;
  nama: string;
  jabatan: string;
  foto: string | null;
  deskripsi: string | null;
  email: string | null;
  telepon: string | null;
  status: string | null;
  selesaiMenjabat: Date | null;
};

type AnggotaBagan = {
  id: string;
  role: string;
  nama: string;
  variant: "utama" | "divisi" | "staf";
  foto?: string;
  deskripsi?: string;
  email?: string;
  telepon?: string;
  kosong?: boolean;
};

/**
 * Gabungkan baris DB ke atas daftar slot bagan. Setiap slot selalu dapat entri:
 * slot tanpa pengurus berlaku menghasilkan kartu "—" yang tidak bisa diklik,
 * sehingga bagan tetap utuh dan garis tetap tersambung.
 */
export function mergeSlots(
  labels: Record<string, SlotLabel>,
  rows: BarisPengurus[],
  now: Date = new Date(),
): Record<string, AnggotaBagan> {
  const bySlot = new Map<string, BarisPengurus>();
  for (const row of rows) {
    if (row.slot && isBerlaku(row, now)) bySlot.set(row.slot, row);
  }

  const out: Record<string, AnggotaBagan> = {};
  for (const [slot, label] of Object.entries(labels)) {
    const row = bySlot.get(slot);
    out[slot] = row
      ? {
          id: slot,
          role: row.jabatan,
          nama: row.nama,
          variant: label.variant,
          foto: row.foto ?? undefined,
          deskripsi: row.deskripsi ?? undefined,
          email: row.email ?? undefined,
          telepon: row.telepon ?? undefined,
        }
      : { id: slot, role: label.role, nama: "—", variant: label.variant, kosong: true };
  }
  return out;
}
