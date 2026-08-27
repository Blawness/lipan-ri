# Profil Pengurus di DB + Verifikasi QR — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pindahkan profil 18 pengurus dari konstanta di kode ke tabel `pengurus` yang dikelola lewat admin-kit, dan tambahkan verifikasi keanggotaan lewat QR di `/verifikasi-pengurus/[slug]`.

**Architecture:** Tabel `pengurus` baru dikunci ke bagan lewat kolom `slot` yang isinya id dari `org-flow.ts`. Layout bagan (`POS`, `EDGES`) tetap ditulis tangan dan tidak masuk DB. Halaman `tentang-kami/[slug]` (server component) mengambil baris pengurus lalu mengopernya sebagai prop ke `StrukturOrg`. Generator QR yang sekarang tersalin di dua route diangkat ke `src/lib/qr.ts` sebelum dipakai pemanggil ketiga.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM + PostgreSQL (Neon), Tailwind v4, shadcn/ui (base-nova), `@blawness/admin-kit` 0.8, `qrcode` + `sharp` + `archiver`, Playwright (e2e), Vitest (unit — ditambahkan di Task 1).

**Spec:** `docs/superpowers/specs/2026-08-27-pengurus-db-qr-design.md`

## Global Constraints

- Semua teks UI, label, pesan error, dan metadata berbahasa Indonesia (id_ID).
- Semua halaman memakai `export const dynamic = "force-dynamic"`. Tidak ada ISR.
- Path alias: `@/` → `./src/*`.
- Tailwind v4 (`@import "tailwindcss"`), shadcn style **base-nova**.
- **Jangan pakai `asChild` pada Button shadcn** — pakai prop `render` (breakage Next.js 16).
- `"use client"` wajib untuk hooks, state, event handler, dan primitive interaktif shadcn.
- **Dev dan produksi berbagi satu database Neon.** Migrasi langsung berlaku di produksi. Test **tidak boleh** membuat, mengubah, atau menghapus baris di DB. Cabang logika yang butuh data khusus diuji lewat unit test, bukan e2e.
- `src/db/seed.ts` bersifat destruktif — **jangan** tambahkan apa pun ke berkas itu.
- Jalankan `pnpm lint` lalu `pnpm build` sebelum menyatakan pekerjaan selesai (AGENTS.md).
- Nilai QR harus identik dengan yang sekarang: ukuran 400px, margin 2, `errorCorrectionLevel: "H"`, warna `#0f2b46` di atas `#ffffff`, logo `public/logo.png` seukuran 22% dengan padding putih 8px.
- URL yang disandikan QR memakai host absolut `https://www.lipan-ri.com`.

## Struktur Berkas

**Dibuat:**

| Berkas | Tanggung jawab |
|---|---|
| `vitest.config.ts` | Konfigurasi unit test + alias `@/` |
| `src/lib/qr.ts` | `generateQrPng(url)` — satu-satunya tempat logika QR+logo |
| `src/lib/pengurus-rules.ts` | Fungsi murni: keberlakuan, penggabungan slot, nomor anggota. **Tanpa import DB** agar bisa di-unit-test |
| `src/lib/pengurus.ts` | Akses baca DB untuk sisi publik |
| `src/lib/admin/pengurus.ts` | Akses tulis DB untuk admin |
| `src/db/seed-pengurus.ts` | Seed idempoten 18 pengurus |
| `src/app/(site)/verifikasi-pengurus/[slug]/page.tsx` | Halaman verifikasi publik |
| `src/app/api/verifikasi-pengurus/[slug]/qr/route.ts` | PNG QR satu pengurus |
| `src/app/api/admin/pengurus/qr-bulk/route.ts` | ZIP seluruh QR |
| `src/app/admin/pengurus/page.tsx` | Daftar pengurus |
| `src/app/admin/pengurus/actions.ts` | Server action tulis |
| `src/app/admin/pengurus/pengurus-form.tsx` | Form bersama (baru & edit) |
| `src/app/admin/pengurus/baru/page.tsx` | Halaman tambah |
| `src/app/admin/pengurus/[id]/edit/page.tsx` | Halaman ubah |
| `src/lib/pengurus-rules.test.ts` | Unit test fungsi murni |
| `src/lib/qr.test.ts` | Unit test generator QR |
| `e2e/verifikasi-pengurus.spec.ts` | E2E halaman verifikasi + endpoint QR |

**Diubah:**

| Berkas | Perubahan |
|---|---|
| `package.json` | Skrip `test` dan `db:seed-pengurus`, devDependency `vitest` |
| `src/db/schema.ts` | Enum `pengurus_status` + tabel `pengurus` |
| `src/app/api/verifikasi/[slug]/qr/route.ts` | Pakai `generateQrPng` |
| `src/app/api/admin/dokumen/qr-bulk/route.ts` | Pakai `generateQrPng` |
| `src/components/tentang-kami/org-flow.ts` | Hapus `MEMBERS`; serap `OrgMember` + `SLOT_LABELS` |
| `src/components/tentang-kami/struktur-org.tsx` | Terima prop `members` |
| `src/components/tentang-kami/org-node.tsx` | Slot kosong dirender non-interaktif |
| `src/app/(site)/tentang-kami/[slug]/page.tsx` | Ambil pengurus, oper ke `StrukturOrg` |
| `src/app/admin/layout.tsx` | Menu sidebar "Pengurus" |

**Dihapus:**

| Berkas | Alasan |
|---|---|
| `src/components/tentang-kami/org-data.ts` | Isinya tinggal tipe + label; keduanya pindah ke `org-flow.ts`, datanya pindah ke seed |

---

### Task 1: Ekstraksi generator QR + setup unit test

Logika QR sekarang tersalin identik di dua route. Pekerjaan ini butuh pemanggil ketiga, jadi diangkat lebih dulu. Task ini sekalian memasang Vitest karena mulai Task 2 ada fungsi murni yang perlu diuji tanpa menyalakan Next atau menyentuh DB.

**Files:**
- Create: `vitest.config.ts`, `src/lib/qr.ts`, `src/lib/qr.test.ts`
- Modify: `package.json`, `src/app/api/verifikasi/[slug]/qr/route.ts`, `src/app/api/admin/dokumen/qr-bulk/route.ts`

**Interfaces:**
- Consumes: —
- Produces: `generateQrPng(url: string): Promise<Buffer>` dari `@/lib/qr`

- [ ] **Step 1: Pasang Vitest**

```bash
pnpm add -D vitest
```

- [ ] **Step 2: Buat `vitest.config.ts`**

Alias `@/` harus dikonfigurasi manual — Vitest tidak membaca `tsconfig.json` sendiri.

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // Unit test saja. Berkas e2e/ dipegang Playwright dan akan bentrok
    // kalau ikut terjaring (keduanya mengekspor `test`).
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

- [ ] **Step 3: Tambahkan skrip `test` di `package.json`**

Sisipkan di objek `scripts`, sebaris setelah `"lint"`:

```json
"test": "vitest run",
```

- [ ] **Step 4: Tulis test yang gagal**

Buat `src/lib/qr.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateQrPng } from "@/lib/qr";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

describe("generateQrPng", () => {
  it("menghasilkan PNG", async () => {
    const buf = await generateQrPng("https://www.lipan-ri.com/verifikasi/abc");
    expect(buf.subarray(0, 4).equals(PNG_MAGIC)).toBe(true);
  });

  it("berukuran 400px persegi seperti QR dokumen yang sudah ada", async () => {
    const buf = await generateQrPng("https://www.lipan-ri.com/verifikasi/abc");
    // Lebar & tinggi PNG ada di IHDR: big-endian uint32 pada offset 16 dan 20.
    expect(buf.readUInt32BE(16)).toBe(400);
    expect(buf.readUInt32BE(20)).toBe(400);
  });
});
```

- [ ] **Step 5: Jalankan test, pastikan GAGAL**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "@/lib/qr"`

- [ ] **Step 6: Buat `src/lib/qr.ts`**

Disalin apa adanya dari `src/app/api/verifikasi/[slug]/qr/route.ts` supaya keluarannya identik byte-per-byte.

```ts
import QRCode from "qrcode";
import sharp from "sharp";
import path from "node:path";

const LOGO_PATH = path.resolve("public/logo.png");
const QR_SIZE = 400;
// Logo menempati ~22% luas QR; error correction H menoleransi ini.
const LOGO_SIZE = Math.round(QR_SIZE * 0.22);
const LOGO_PADDING = 8; // padding putih agar logo terpisah dari sel QR

/** PNG QR berlogo LIPAN RI. Satu-satunya tempat parameter QR ditentukan. */
export async function generateQrPng(url: string): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(url, {
    width: QR_SIZE,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#0f2b46", light: "#ffffff" },
  });

  const paddedLogoSize = LOGO_SIZE + LOGO_PADDING * 2;
  const logo = await sharp(LOGO_PATH)
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: "inside" })
    .toBuffer();

  // Alas putih agar sel QR tidak menembus bagian transparan logo.
  const paddedLogo = await sharp({
    create: {
      width: paddedLogoSize,
      height: paddedLogoSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: logo, top: LOGO_PADDING, left: LOGO_PADDING }])
    .png()
    .toBuffer();

  const { width: qrW, height: qrH } = await sharp(qrBuffer).metadata();
  const left = Math.round(((qrW ?? QR_SIZE) - paddedLogoSize) / 2);
  const top = Math.round(((qrH ?? QR_SIZE) - paddedLogoSize) / 2);

  return sharp(qrBuffer)
    .composite([{ input: paddedLogo, top, left }])
    .png()
    .toBuffer();
}
```

- [ ] **Step 7: Jalankan test, pastikan LULUS**

Run: `pnpm test`
Expected: PASS (2 test)

- [ ] **Step 8: Alihkan route QR dokumen ke fungsi baru**

Ganti **seluruh isi** `src/app/api/verifikasi/[slug]/qr/route.ts` dengan:

```ts
import { NextResponse } from "next/server";
import { generateQrPng } from "@/lib/qr";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const png = await generateQrPng(`https://www.lipan-ri.com/verifikasi/${slug}`);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
```

- [ ] **Step 9: Alihkan route ZIP dokumen ke fungsi baru**

Di `src/app/api/admin/dokumen/qr-bulk/route.ts`: hapus import `QRCode`, `sharp`, `path`, seluruh konstanta `LOGO_PATH`/`QR_SIZE`/`LOGO_SIZE`/`LOGO_PADDING`, dan **seluruh fungsi lokal `generateQR`**. Tambahkan import `import { generateQrPng } from "@/lib/qr";`, lalu di dalam loop ganti:

```ts
const png = await generateQR(row.slug);
```

menjadi:

```ts
const png = await generateQrPng(
  `https://www.lipan-ri.com/verifikasi/${row.slug}`,
);
```

Import `archiver`, `auth`, `db`, dan `documents` tetap seperti semula.

- [ ] **Step 10: Verifikasi tidak ada sisa salinan**

Run: `grep -rn "errorCorrectionLevel" src/`
Expected: hanya satu baris, di `src/lib/qr.ts`.

- [ ] **Step 11: Lint & build**

Run: `pnpm lint && pnpm build`
Expected: keduanya lulus.

- [ ] **Step 12: Commit**

```bash
git add vitest.config.ts package.json pnpm-lock.yaml src/lib/qr.ts src/lib/qr.test.ts \
  "src/app/api/verifikasi/[slug]/qr/route.ts" src/app/api/admin/dokumen/qr-bulk/route.ts
git commit -m "refactor(qr): angkat generator QR ke lib/qr.ts + setup vitest"
```

---

### Task 2: Tabel `pengurus` + aturan murni

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/lib/pengurus-rules.ts`, `src/lib/pengurus-rules.test.ts`
- Create (hasil generate): `drizzle/*.sql`

**Interfaces:**
- Consumes: —
- Produces:
  - `pengurus`, `pengurusStatusEnum` dari `@/db/schema`
  - `type Pengurus = typeof pengurus.$inferSelect`
  - `isBerlaku(p: { status: string | null; selesaiMenjabat: Date | null }, now?: Date): boolean`
  - `nextNomorAnggota(existing: string[], year: number): string`

- [ ] **Step 1: Tambahkan enum & tabel di `src/db/schema.ts`**

Sisipkan di bawah definisi `documentLogs` (paling akhir berkas):

```ts
export const pengurusStatusEnum = pgEnum("pengurus_status", ["aktif", "nonaktif"]);

export const pengurus = pgTable("pengurus", {
  id: serial("id").primaryKey(),
  // id slot di org-flow.ts. Nullable: baris tanpa slot (mis. perwakilan daerah)
  // sah ada, cuma tidak punya kotak di bagan.
  slot: text("slot").unique(),
  slug: text("slug").notNull().unique(),
  nomorAnggota: text("nomor_anggota").notNull().unique(),
  nama: text("nama").notNull(),
  jabatan: text("jabatan").notNull(),
  foto: text("foto"),
  deskripsi: text("deskripsi"),
  // email & telepon hanya tampil di panel bagan, TIDAK di halaman verifikasi.
  email: text("email"),
  telepon: text("telepon"),
  status: pengurusStatusEnum("status").default("aktif"),
  mulaiMenjabat: timestamp("mulai_menjabat").notNull(),
  selesaiMenjabat: timestamp("selesai_menjabat"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

- [ ] **Step 2: Tulis test yang gagal**

Buat `src/lib/pengurus-rules.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isBerlaku, nextNomorAnggota } from "@/lib/pengurus-rules";

const NOW = new Date("2026-08-27T00:00:00Z");

describe("isBerlaku", () => {
  it("berlaku saat aktif tanpa tanggal selesai", () => {
    expect(isBerlaku({ status: "aktif", selesaiMenjabat: null }, NOW)).toBe(true);
  });

  it("berlaku saat aktif dan tanggal selesai masih di depan", () => {
    const akhir = new Date("2027-01-01T00:00:00Z");
    expect(isBerlaku({ status: "aktif", selesaiMenjabat: akhir }, NOW)).toBe(true);
  });

  it("tidak berlaku saat status nonaktif", () => {
    expect(isBerlaku({ status: "nonaktif", selesaiMenjabat: null }, NOW)).toBe(false);
  });

  it("tidak berlaku saat tanggal selesai sudah lewat, meski status aktif", () => {
    const akhir = new Date("2026-01-01T00:00:00Z");
    expect(isBerlaku({ status: "aktif", selesaiMenjabat: akhir }, NOW)).toBe(false);
  });

  it("tidak berlaku saat status null", () => {
    expect(isBerlaku({ status: null, selesaiMenjabat: null }, NOW)).toBe(false);
  });
});

describe("nextNomorAnggota", () => {
  it("mulai dari 0001 saat belum ada nomor", () => {
    expect(nextNomorAnggota([], 2026)).toBe("LIPAN-2026-0001");
  });

  it("melanjutkan dari urutan tertinggi tahun itu", () => {
    const existing = ["LIPAN-2026-0001", "LIPAN-2026-0007", "LIPAN-2026-0003"];
    expect(nextNomorAnggota(existing, 2026)).toBe("LIPAN-2026-0008");
  });

  it("mengabaikan nomor dari tahun lain", () => {
    expect(nextNomorAnggota(["LIPAN-2025-0042"], 2026)).toBe("LIPAN-2026-0001");
  });

  it("mengabaikan nomor bebas yang diketik manual", () => {
    expect(nextNomorAnggota(["KTA-KHUSUS-9"], 2026)).toBe("LIPAN-2026-0001");
  });
});
```

- [ ] **Step 3: Jalankan test, pastikan GAGAL**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "@/lib/pengurus-rules"`

- [ ] **Step 4: Buat `src/lib/pengurus-rules.ts`**

Berkas ini **tidak boleh** mengimpor `@/db` — begitu ia melakukannya, `pg` membuat Pool saat import dan unit test jadi butuh `DATABASE_URL`.

```ts
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
```

- [ ] **Step 5: Jalankan test, pastikan LULUS**

Run: `pnpm test`
Expected: PASS (11 test — 2 dari Task 1, 9 dari task ini)

- [ ] **Step 6: Buat migrasi**

Run: `pnpm db:generate`
Expected: berkas `.sql` baru di `drizzle/` berisi `CREATE TYPE "pengurus_status"` dan `CREATE TABLE "pengurus"`.

- [ ] **Step 7: Baca migrasi sebelum menerapkannya**

Run: `cat drizzle/<berkas-baru>.sql`
Expected: **hanya** `CREATE TYPE` dan `CREATE TABLE`. Kalau ada `DROP` apa pun, **berhenti** dan laporkan — dev dan produksi berbagi satu database, jadi `DROP` akan mengenai data produksi.

- [ ] **Step 8: Terapkan migrasi**

Run: `pnpm db:migrate`
Expected: sukses tanpa error.

- [ ] **Step 9: Commit**

```bash
git add src/db/schema.ts src/lib/pengurus-rules.ts src/lib/pengurus-rules.test.ts drizzle/
git commit -m "feat(db): tabel pengurus + aturan keberlakuan & nomor anggota"
```

---

### Task 3: Pindahkan label slot ke `org-flow.ts`, hapus `org-data.ts`

Memindahkan data ke DB berarti `org-data.ts` kehilangan alasan keberadaannya: yang tersisa cuma tipe dan label jabatan, dan keduanya adalah metadata layout yang tempatnya bersama `POS`.

**Files:**
- Modify: `src/components/tentang-kami/org-flow.ts`
- Delete: `src/components/tentang-kami/org-data.ts`
- Modify: `src/components/tentang-kami/org-node.tsx`, `src/components/tentang-kami/org-detail-panel.tsx`, `src/components/tentang-kami/struktur-org.tsx`

**Interfaces:**
- Consumes: —
- Produces, dari `@/components/tentang-kami/org-flow`:
  - `type OrgVariant = "utama" | "divisi" | "staf"`
  - `interface OrgMember { id, role, nama, variant, foto?, deskripsi?, email?, telepon?, kosong? }`
  - `SLOT_LABELS: Record<string, { role: string; variant: OrgVariant }>`

- [ ] **Step 1: Pindahkan tipe & label ke bagian atas `org-flow.ts`**

Ganti baris pertama `org-flow.ts` (`import { ORG, type OrgMember } from "./org-data";`) dengan blok berikut:

```ts
export type OrgVariant = "utama" | "divisi" | "staf";

export interface OrgMember {
  /** id slot di POS. */
  id: string;
  role: string;
  nama: string;
  variant: OrgVariant;
  foto?: string;
  deskripsi?: string;
  email?: string;
  telepon?: string;
  /** true = slot belum terisi; kartu digambar tapi tidak bisa diklik. */
  kosong?: boolean;
}

// Label jabatan tiap slot. Ini metadata layout, bukan data orang: dipakai saat
// sebuah slot belum punya baris di DB, supaya bagan tetap utuh dan garis tetap
// tersambung alih-alih menyisakan kartu kosong tanpa keterangan.
export const SLOT_LABELS: Record<string, { role: string; variant: OrgVariant }> = {
  pembina: { role: "Dewan Pembina", variant: "utama" },
  penasehat: { role: "Dewan Penasehat/Kehormatan", variant: "utama" },
  ketua: { role: "Ketua", variant: "utama" },
  "staf-khusus": { role: "Staf Khusus Ketua", variant: "utama" },
  "koordinator-keamanan": { role: "Koordinator Keamanan", variant: "utama" },
  sekjen: { role: "Sekretaris Jenderal", variant: "utama" },
  bendahara: { role: "Bendahara Umum", variant: "utama" },
  sdm: { role: "SDM dan Umum", variant: "utama" },
  "div-hukum": { role: "Divisi Bantuan Hukum & HAM", variant: "divisi" },
  "div-pengawasan": { role: "Divisi Pengawasan", variant: "divisi" },
  "div-media": { role: "Divisi Media Infokom", variant: "divisi" },
  "div-investigasi": { role: "Divisi Investigasi", variant: "divisi" },
  "hukum-1": { role: "Staf Divisi", variant: "staf" },
  "hukum-2": { role: "Staf Divisi", variant: "staf" },
  "pengawasan-1": { role: "Staf Divisi", variant: "staf" },
  "media-1": { role: "Staf Divisi", variant: "staf" },
  "media-2": { role: "Staf Divisi", variant: "staf" },
  "media-3": { role: "Staf Divisi", variant: "staf" },
};
```

- [ ] **Step 2: Hapus konstanta `MEMBERS` dari `org-flow.ts`**

Hapus seluruh blok `export const MEMBERS: Record<string, OrgMember> = (() => { … })();` beserta komentar di atasnya. `POS`, `EDGES`, `PARENT`, `CHILDREN`, `ancestors`, `NODE_W`, `NODE_H`, dan `OrgNodeData` **tidak disentuh**.

- [ ] **Step 3: Hapus `org-data.ts`**

```bash
git rm src/components/tentang-kami/org-data.ts
```

- [ ] **Step 4: Perbaiki import di tiga komponen**

Di `org-node.tsx`, `org-detail-panel.tsx`, dan `struktur-org.tsx`, ubah setiap import yang menunjuk `./org-data` menjadi `./org-flow`. Di `struktur-org.tsx` hapus `MEMBERS` dari daftar import `./org-flow` (dipakai lagi di Task 5).

- [ ] **Step 5: Pastikan tidak ada sisa rujukan**

Run: `grep -rn "org-data\|MEMBERS" src/`
Expected: tidak ada keluaran.

- [ ] **Step 6: Cek tipe**

Run: `pnpm lint`
Expected: TypeScript akan mengeluh di `struktur-org.tsx` bahwa `MEMBERS` tidak terdefinisi. **Itu diharapkan** — diperbaiki di Task 5. Catat pesannya, lanjut.

- [ ] **Step 7: Commit**

```bash
git add -A src/components/tentang-kami/
git commit -m "refactor(struktur): serap tipe & label slot ke org-flow, hapus org-data"
```

---

### Task 4: Akses data + seed 18 pengurus

**Files:**
- Create: `src/lib/pengurus.ts`, `src/db/seed-pengurus.ts`
- Modify: `package.json`
- Create: tambahan test di `src/lib/pengurus-rules.test.ts`

**Interfaces:**
- Consumes: `pengurus` (Task 2), `SLOT_LABELS`, `OrgMember` (Task 3)
- Produces:
  - `mergeSlots(labels, rows, now?): Record<string, OrgMember>` dari `@/lib/pengurus-rules`
  - `getPengurusBySlot(): Promise<Record<string, OrgMember>>`
  - `getPengurusBySlug(slug: string): Promise<Pengurus | null>`
  - `getAllPengurus(): Promise<Pengurus[]>`

- [ ] **Step 1: Tulis test `mergeSlots` yang gagal**

Tambahkan di akhir `src/lib/pengurus-rules.test.ts` (dan tambahkan `mergeSlots` ke baris import di atas berkas):

```ts
describe("mergeSlots", () => {
  const labels = {
    ketua: { role: "Ketua", variant: "utama" as const },
    sekjen: { role: "Sekretaris Jenderal", variant: "utama" as const },
  };
  const baris = {
    id: 1,
    slot: "ketua",
    slug: "harun-prayitno",
    nomorAnggota: "LIPAN-2026-0001",
    nama: "Harun Prayitno, S.E., S.H., M.H.",
    jabatan: "Ketua",
    foto: "/ketua.png",
    deskripsi: "Memimpin organisasi.",
    email: null,
    telepon: null,
    status: "aktif",
    selesaiMenjabat: null,
  };

  it("mengisi slot dari baris DB", () => {
    const out = mergeSlots(labels, [baris], NOW);
    expect(out.ketua.nama).toBe("Harun Prayitno, S.E., S.H., M.H.");
    expect(out.ketua.deskripsi).toBe("Memimpin organisasi.");
    expect(out.ketua.kosong).toBeUndefined();
  });

  it("menandai slot tanpa baris sebagai kosong, bukan menghilangkannya", () => {
    const out = mergeSlots(labels, [baris], NOW);
    expect(out.sekjen.nama).toBe("—");
    expect(out.sekjen.role).toBe("Sekretaris Jenderal");
    expect(out.sekjen.kosong).toBe(true);
  });

  it("memperlakukan pengurus tidak berlaku sebagai slot kosong", () => {
    const out = mergeSlots(labels, [{ ...baris, status: "nonaktif" }], NOW);
    expect(out.ketua.kosong).toBe(true);
    expect(out.ketua.nama).toBe("—");
  });

  it("mengabaikan baris yang slot-nya tidak ada di bagan", () => {
    const out = mergeSlots(labels, [{ ...baris, slot: "perwakilan-jabar" }], NOW);
    expect(out.ketua.kosong).toBe(true);
    expect(Object.keys(out)).toEqual(["ketua", "sekjen"]);
  });

  it("memakai jabatan dari DB, bukan label, saat baris ada", () => {
    const out = mergeSlots(labels, [{ ...baris, jabatan: "Ketua Umum" }], NOW);
    expect(out.ketua.role).toBe("Ketua Umum");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `pnpm test`
Expected: FAIL — `mergeSlots is not a function` / tidak diekspor.

- [ ] **Step 3: Tambahkan `mergeSlots` ke `src/lib/pengurus-rules.ts`**

Sisipkan di akhir berkas. Tipe parameter dibuat struktural agar berkas ini tetap bebas dari import DB.

```ts
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
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `pnpm test`
Expected: PASS (16 test)

- [ ] **Step 5: Buat `src/lib/pengurus.ts`**

```ts
import { db } from "@/db";
import { pengurus } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { SLOT_LABELS, type OrgMember } from "@/components/tentang-kami/org-flow";
import { mergeSlots } from "./pengurus-rules";

export type Pengurus = typeof pengurus.$inferSelect;

export async function getAllPengurus(): Promise<Pengurus[]> {
  return db.select().from(pengurus).orderBy(asc(pengurus.nama));
}

/** Peta slot → anggota untuk bagan. Setiap slot selalu ada (lihat mergeSlots). */
export async function getPengurusBySlot(): Promise<Record<string, OrgMember>> {
  const rows = await db.select().from(pengurus);
  return mergeSlots(SLOT_LABELS, rows);
}

export async function getPengurusBySlug(slug: string): Promise<Pengurus | null> {
  const [row] = await db
    .select()
    .from(pengurus)
    .where(eq(pengurus.slug, slug))
    .limit(1);
  return row ?? null;
}
```

- [ ] **Step 6: Buat `src/db/seed-pengurus.ts`**

Isinya persis 18 orang dari `org-data.ts` sebelum dihapus (lihat `git show HEAD~1:src/components/tentang-kami/org-data.ts` bila perlu memeriksa ulang teksnya).

```ts
import "dotenv/config";
import { db } from "./index";
import { pengurus } from "./schema";

// Tanggal sementara: tanggal mulai menjabat yang sebenarnya belum diketahui dan
// tidak boleh dikarang — halaman verifikasi menampilkannya sebagai fakta.
// Koreksi lewat /admin/pengurus setelah seed.
const MULAI = new Date("2026-01-01T00:00:00Z");

const DATA = [
  {
    slot: "pembina",
    slug: "hengki-putra-juwita",
    nama: "Hengki Putra Juwita",
    jabatan: "Dewan Pembina",
    deskripsi:
      "Memberikan arahan strategis dan pembinaan atas kebijakan umum lembaga, serta mengawasi agar seluruh kegiatan LIPAN RI tetap sejalan dengan visi, misi, dan anggaran dasar organisasi.",
  },
  {
    slot: "penasehat",
    slug: "sri-hartono-sasongko",
    nama: "Sri Hartono Sasongko",
    jabatan: "Dewan Penasehat/Kehormatan",
    deskripsi:
      "Memberikan pertimbangan dan nasihat kepada Dewan Pembina serta Ketua atas persoalan strategis lembaga, baik diminta maupun tidak diminta.",
  },
  {
    slot: "ketua",
    slug: "harun-prayitno",
    nama: "Harun Prayitno, S.E., S.H., M.H.",
    jabatan: "Ketua",
    foto: "/ketua-harun-prayitno.png",
    deskripsi:
      "Memimpin dan bertanggung jawab atas keseluruhan jalannya organisasi, mewakili lembaga ke luar, serta mengambil keputusan tertinggi dalam pelaksanaan program kerja LIPAN RI.",
  },
  {
    slot: "staf-khusus",
    slug: "wiryanto",
    nama: "Wiryanto, S.T.",
    jabatan: "Staf Khusus Ketua",
    deskripsi:
      "Membantu Ketua dalam kajian, penyiapan bahan keputusan, dan penugasan khusus yang berada di luar jalur struktural harian.",
  },
  {
    slot: "koordinator-keamanan",
    slug: "mulkan-lessy-tussen",
    nama: "Mulkan Lessy Tussen",
    jabatan: "Koordinator Keamanan",
    deskripsi:
      "Mengoordinasikan aspek keamanan kegiatan dan personel lembaga, termasuk pengamanan kegiatan lapangan dan investigasi.",
  },
  {
    slot: "sekjen",
    slug: "cahya-puspita-rini",
    nama: "Cahya Puspita Rini, S.E.",
    jabatan: "Sekretaris Jenderal",
    deskripsi:
      "Menjalankan administrasi dan kesekretariatan lembaga, mengoordinasikan kerja antar divisi, serta memastikan program kerja berjalan sesuai keputusan Ketua.",
  },
  {
    slot: "bendahara",
    slug: "velia-dwi-yulianti",
    nama: "Velia Dwi Yulianti, S.E.",
    jabatan: "Bendahara Umum",
    deskripsi:
      "Mengelola keuangan lembaga, menyusun anggaran dan laporan pertanggungjawaban, serta memastikan setiap pengeluaran tercatat dan dapat diaudit.",
  },
  {
    slot: "sdm",
    slug: "ruswondo-awidjan",
    nama: "Ruswondo Awidjan, S.H.",
    jabatan: "SDM dan Umum",
    deskripsi:
      "Membina sumber daya manusia lembaga — perekrutan, penempatan, dan peningkatan kapasitas anggota — serta mengurus kebutuhan umum dan perlengkapan organisasi.",
  },
  {
    slot: "div-hukum",
    slug: "annisa-novianty",
    nama: "Annisa Novianty, S.H., M.H.",
    jabatan: "Divisi Bantuan Hukum & HAM",
    deskripsi:
      "Memberikan pendampingan dan bantuan hukum bagi masyarakat, serta menangani laporan dugaan pelanggaran hak asasi manusia yang masuk ke lembaga.",
  },
  {
    slot: "hukum-1",
    slug: "adam-maulana-hafiz",
    nama: "Adam Maulana Hafiz, S.H.",
    jabatan: "Staf Divisi",
    deskripsi:
      "Membantu penanganan perkara dan penyusunan dokumen hukum pada Divisi Bantuan Hukum & HAM.",
  },
  {
    slot: "hukum-2",
    slug: "firdausi-aglis-akbar",
    nama: "Firdausi Aglis Akbar, S.H.",
    jabatan: "Staf Divisi",
    deskripsi:
      "Membantu penanganan perkara dan penyusunan dokumen hukum pada Divisi Bantuan Hukum & HAM.",
  },
  {
    slot: "div-pengawasan",
    slug: "najib-payudin",
    nama: "Najib Payudin",
    jabatan: "Divisi Pengawasan",
    deskripsi:
      "Melakukan pemantauan terhadap penyelenggaraan pelayanan publik dan penggunaan anggaran negara, serta menindaklanjuti temuan bersama divisi terkait.",
  },
  {
    slot: "pengawasan-1",
    slug: "ardi-erfindo-wael",
    nama: "Ardi Erfindo Wael",
    jabatan: "Staf Divisi",
    deskripsi:
      "Membantu kegiatan pemantauan lapangan dan penyusunan laporan hasil pengawasan.",
  },
  {
    slot: "div-media",
    slug: "yandi-nurarifiandi",
    nama: "Yandi Nurarifiandi, S.Sos",
    jabatan: "Divisi Media Infokom",
    deskripsi:
      "Mengelola komunikasi publik lembaga: pemberitaan, publikasi kegiatan, media sosial, dan hubungan dengan media massa.",
  },
  {
    slot: "media-1",
    slug: "yudha-hafiz",
    nama: "Yudha Hafiz, S.BNS.",
    jabatan: "Staf Divisi",
    deskripsi:
      "Membantu produksi konten, dokumentasi kegiatan, dan pengelolaan kanal digital lembaga.",
  },
  {
    slot: "media-2",
    slug: "ahmada-aliftano-nugroho",
    nama: "Ahmada Aliftano Nugroho, S.H.",
    jabatan: "Staf Divisi",
    deskripsi:
      "Membantu produksi konten, dokumentasi kegiatan, dan pengelolaan kanal digital lembaga.",
  },
  {
    slot: "media-3",
    slug: "muhammad-ihsan-naufal",
    nama: "Muhammad Ihsan Naufal",
    jabatan: "Staf Divisi",
    deskripsi:
      "Membantu produksi konten, dokumentasi kegiatan, dan pengelolaan kanal digital lembaga.",
  },
  {
    slot: "div-investigasi",
    slug: "muhammad-faizal-amri",
    nama: "Muhammad Faizal Amri",
    jabatan: "Divisi Investigasi",
    deskripsi:
      "Menelusuri dan mendalami laporan masyarakat atas dugaan penyimpangan, serta menyusun hasil investigasi sebagai bahan tindak lanjut lembaga.",
  },
];

async function seedPengurus() {
  console.log("🌱 Seeding pengurus…");

  // onConflictDoNothing pada `slot`: aman dijalankan berulang dan tidak pernah
  // menimpa suntingan yang sudah dibuat lewat panel admin.
  for (const [i, p] of DATA.entries()) {
    await db
      .insert(pengurus)
      .values({
        ...p,
        nomorAnggota: `LIPAN-2026-${String(i + 1).padStart(4, "0")}`,
        mulaiMenjabat: MULAI,
      })
      .onConflictDoNothing({ target: pengurus.slot });
  }

  console.log(`✅ ${DATA.length} pengurus siap.`);
  process.exit(0);
}

seedPengurus().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 7: Tambahkan skrip di `package.json`**

Sisipkan setelah baris `"db:seed"`:

```json
"db:seed-pengurus": "tsx src/db/seed-pengurus.ts",
```

- [ ] **Step 8: Jalankan seed**

Run: `pnpm db:seed-pengurus`
Expected: `✅ 18 pengurus siap.`

- [ ] **Step 9: Pastikan idempoten**

Run: `pnpm db:seed-pengurus`
Expected: sukses lagi, tanpa error duplikat.

- [ ] **Step 10: Verifikasi jumlah baris**

Run: `pnpm exec tsx -e "import('dotenv/config').then(async()=>{const {db}=await import('./src/db/index.ts');const {pengurus}=await import('./src/db/schema.ts');console.log((await db.select().from(pengurus)).length);process.exit(0)})"`
Expected: `18`

- [ ] **Step 11: Commit**

```bash
git add src/lib/pengurus.ts src/lib/pengurus-rules.ts src/lib/pengurus-rules.test.ts \
  src/db/seed-pengurus.ts package.json
git commit -m "feat(pengurus): akses data + seed 18 pengurus"
```

---

### Task 5: Sambungkan bagan ke DB

**Files:**
- Modify: `src/components/tentang-kami/struktur-org.tsx`, `src/components/tentang-kami/org-node.tsx`, `src/app/(site)/tentang-kami/[slug]/page.tsx`
- Modify: `e2e/tentang-kami.spec.ts`

**Interfaces:**
- Consumes: `getPengurusBySlot()` (Task 4), `OrgMember`, `SLOT_LABELS`, `POS` (Task 3)
- Produces: `<StrukturOrg data={…} members={Record<string, OrgMember>} />`

- [ ] **Step 1: Tulis test e2e yang gagal**

Tambahkan di akhir `e2e/tentang-kami.spec.ts`, di dalam describe `"Struktur — kartu bisa diklik"`:

```ts
  test("nama pengurus datang dari database, bukan konstanta", async ({ page }) => {
    await page.goto("/tentang-kami/struktur");
    // Slot yang terisi selalu punya nama; slot kosong dirender "—" dan bukan button.
    const kartu = page.getByRole("button", { name: /^Ketua —/ });
    await expect(kartu).toBeVisible();
    await expect(page.getByText("—", { exact: true })).toHaveCount(0);
  });
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `pnpm e2e e2e/tentang-kami.spec.ts`
Expected: FAIL — build gagal karena `MEMBERS` tidak terdefinisi di `struktur-org.tsx` (sisa Task 3).

- [ ] **Step 3: Terima prop `members` di `struktur-org.tsx`**

Ganti tanda tangan komponen dan pembangunan node. `NODES` yang sekarang konstanta modul harus jadi `useMemo` — isinya kini bergantung data.

```tsx
export function StrukturOrg({
  members,
}: {
  data: StrukturContent;
  members: Record<string, OrgMember>;
}) {
  return (
    <ReactFlowProvider>
      <StrukturChart members={members} />
    </ReactFlowProvider>
  );
}

function StrukturChart({ members }: { members: Record<string, OrgMember> }) {
```

Hapus konstanta modul `NODES` beserta komentarnya, lalu di dalam `StrukturChart` tambahkan (sebelum `const edges = useMemo…`):

```tsx
  // Dibangun ulang hanya saat `members` berubah — bukan saat hover. Menyusun
  // ulang array ini per-hover mereset dimensi node yang sudah diukur React Flow,
  // yang membuat setiap edge ter-unmount satu frame (kedip terlihat).
  const nodes = useMemo<Node<OrgNodeData>[]>(
    () =>
      Object.entries(POS).map(([id, p]) => ({
        id,
        type: "org",
        position: { x: p.x, y: p.y * VSCALE },
        data: { member: members[id] },
        draggable: false,
        selectable: false,
        connectable: false,
      })),
    [members],
  );
```

Ganti `nodes={NODES}` pada `<ReactFlow>` menjadi `nodes={nodes}`.

- [ ] **Step 4: Ambil anggota terpilih dari `members`, bukan `MEMBERS`**

Di `struktur-org.tsx` ganti:

```tsx
const member = selected ? MEMBERS[selected] : null;
```

dengan:

```tsx
const member = selected ? members[selected] : null;
```

dan pada `<OrgDetailPanel>` ganti kedua rujukan `MEMBERS[…]`:

```tsx
parent={PARENT[member.id] ? members[PARENT[member.id]] : null}
bawahan={(CHILDREN[member.id] ?? []).map((id) => members[id])}
```

Lalu saring relasi yang slot-nya kosong agar tidak muncul sebagai chip "—":

```tsx
bawahan={(CHILDREN[member.id] ?? [])
  .map((id) => members[id])
  .filter((m) => !m.kosong)}
```

dan untuk parent:

```tsx
parent={
  PARENT[member.id] && !members[PARENT[member.id]].kosong
    ? members[PARENT[member.id]]
    : null
}
```

- [ ] **Step 5: Jangan buka panel untuk slot kosong**

Di `struktur-org.tsx`, ubah `select` agar mengabaikan slot kosong:

```tsx
  const select = useCallback(
    (id: string) => {
      if (members[id]?.kosong) return;
      setSelected((prev) => (prev === id ? null : id));
    },
    [members],
  );
```

- [ ] **Step 6: Render slot kosong sebagai `div`, bukan `button`**

Di `org-node.tsx`, di dalam `OrgNode`, tambahkan tepat sebelum `return`:

```tsx
  const kosong = member.kosong === true;
```

Ubah elemen kartu agar tidak interaktif saat kosong. Ganti pembuka `<button …>` menjadi elemen kondisional dengan menyalin kelas yang sama:

```tsx
      {kosong ? (
        <div className="org-card flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-white/70 px-3 text-center shadow-sm ring-1 ring-navy-100/70">
          <p className="text-[11px] font-bold uppercase leading-[1.15] tracking-wide text-navy-400">
            {member.role}
          </p>
          <p className="mt-0.5 text-[10px] leading-[1.15] text-navy-300">
            {member.nama}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => select(id)}
          aria-pressed={selected}
          aria-label={`${member.role} — ${member.nama}`}
          data-highlighted={highlighted ? "" : undefined}
          data-selected={selected ? "" : undefined}
          // Ring state diselesaikan di sini, bukan lewat varian data-[…]: selected
          // dan highlighted akan memancarkan dua aturan ring dengan specificity
          // sama, dan pemenangnya bergantung urutan kelas Tailwind.
          className={[
            "org-card flex h-full w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl bg-white px-3 text-center transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500",
            selected
              ? "shadow-xl ring-4 ring-[hsl(var(--gold))]"
              : highlighted
                ? "shadow-lg ring-2 ring-[hsl(var(--gold))]"
                : "shadow-sm ring-1 ring-navy-100/70",
          ].join(" ")}
        >
          <p className="text-[11px] font-bold uppercase leading-[1.15] tracking-wide text-navy-800">
            {member.role}
          </p>
          <p className="mt-0.5 text-[10px] leading-[1.15] text-navy-500">
            {member.nama}
          </p>
        </button>
      )}
```

- [ ] **Step 7: Ambil data di halaman**

Di `src/app/(site)/tentang-kami/[slug]/page.tsx` tambahkan import:

```ts
import { getPengurusBySlot } from "@/lib/pengurus";
```

lalu ubah cabang `case "struktur"`:

```tsx
    case "struktur": {
      const members = await getPengurusBySlot();
      return <StrukturOrg data={data} members={members} />;
    }
```

- [ ] **Step 8: Jalankan test, pastikan LULUS**

Run: `pnpm e2e e2e/tentang-kami.spec.ts`
Expected: PASS — 11 test, termasuk test lama yang memeriksa "Cahya Puspita Rini" (kini membuktikan jalur DB→bagan).

- [ ] **Step 9: Lint & build**

Run: `pnpm lint && pnpm build`
Expected: keduanya lulus.

- [ ] **Step 10: Commit**

```bash
git add src/components/tentang-kami/ "src/app/(site)/tentang-kami/[slug]/page.tsx" e2e/tentang-kami.spec.ts
git commit -m "feat(struktur): bagan mengambil profil pengurus dari database"
```

---

### Task 6: Halaman verifikasi publik

**Files:**
- Create: `src/app/(site)/verifikasi-pengurus/[slug]/page.tsx`, `e2e/verifikasi-pengurus.spec.ts`
- Modify: `src/lib/pengurus-rules.ts` + `src/lib/pengurus-rules.test.ts` (formatter masa berlaku)

**Interfaces:**
- Consumes: `getPengurusBySlug()`, `isBerlaku()` (Task 4)
- Produces: rute publik `/verifikasi-pengurus/{slug}`

- [ ] **Step 1: Tulis unit test formatter yang gagal**

Tambahkan ke `src/lib/pengurus-rules.test.ts` (dan ke baris import):

```ts
describe("formatMasaBerlaku", () => {
  const mulai = new Date("2026-01-01T00:00:00Z");

  it("menulis 's.d. sekarang' bila belum ada tanggal selesai", () => {
    expect(formatMasaBerlaku(mulai, null)).toBe("1 Januari 2026 s.d. sekarang");
  });

  it("menulis rentang bila ada tanggal selesai", () => {
    const selesai = new Date("2027-03-15T00:00:00Z");
    expect(formatMasaBerlaku(mulai, selesai)).toBe("1 Januari 2026 — 15 Maret 2027");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan GAGAL**

Run: `pnpm test`
Expected: FAIL — `formatMasaBerlaku is not a function`

- [ ] **Step 3: Tambahkan formatter ke `src/lib/pengurus-rules.ts`**

```ts
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeZone: "UTC",
});

export function formatMasaBerlaku(mulai: Date, selesai: Date | null): string {
  const awal = dateFmt.format(mulai);
  return selesai ? `${awal} — ${dateFmt.format(selesai)}` : `${awal} s.d. sekarang`;
}
```

- [ ] **Step 4: Jalankan test, pastikan LULUS**

Run: `pnpm test`
Expected: PASS (18 test)

- [ ] **Step 5: Tulis test e2e yang gagal**

Buat `e2e/verifikasi-pengurus.spec.ts`. Slug `cahya-puspita-rini` berasal dari seed Task 4.

```ts
import { test, expect } from "@playwright/test";

test.describe("Verifikasi pengurus", () => {
  test("pengurus aktif tampil sebagai sah", async ({ page }) => {
    await page.goto("/verifikasi-pengurus/cahya-puspita-rini");

    await expect(
      page.getByRole("heading", { name: "Pengurus Aktif" }),
    ).toBeVisible();
    await expect(page.getByText("Cahya Puspita Rini, S.E.")).toBeVisible();
    await expect(page.getByText("Sekretaris Jenderal")).toBeVisible();
    await expect(page.getByText(/LIPAN-2026-\d{4}/)).toBeVisible();
    await expect(page.getByText(/s\.d\. sekarang|—/)).toBeVisible();
  });

  test("kontak tidak dibocorkan di halaman publik", async ({ page }) => {
    await page.goto("/verifikasi-pengurus/cahya-puspita-rini");
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  });

  test("halaman tidak boleh diindeks", async ({ page }) => {
    await page.goto("/verifikasi-pengurus/cahya-puspita-rini");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });

  test("endpoint QR mengembalikan PNG", async ({ request }) => {
    const res = await request.get(
      "/api/verifikasi-pengurus/cahya-puspita-rini/qr",
    );
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    const body = await res.body();
    expect(body.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))).toBe(
      true,
    );
  });
});
```

- [ ] **Step 6: Jalankan test, pastikan GAGAL**

Run: `pnpm e2e e2e/verifikasi-pengurus.spec.ts`
Expected: FAIL — halaman belum ada.

- [ ] **Step 7: Buat halaman verifikasi**

Buat `src/app/(site)/verifikasi-pengurus/[slug]/page.tsx`:

```tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle, XCircle, BadgeCheck, Calendar, User } from "lucide-react";
import { getPengurusBySlug } from "@/lib/pengurus";
import { isBerlaku, formatMasaBerlaku } from "@/lib/pengurus-rules";

export const dynamic = "force-dynamic";

// Halaman ini memuat foto dan data pribadi. Membiarkannya terindeks berarti
// seluruh foto pengurus dapat dipanen tanpa perlu memindai QR sama sekali.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function VerifikasiPengurusPage({ params }: Props) {
  const { slug } = await params;
  const p = await getPengurusBySlug(slug);

  if (!p) notFound();

  const valid = isBerlaku(p);

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-2xl border border-navy-100 bg-white p-8 text-center shadow-sm">
        {valid ? (
          <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
        ) : (
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
        )}

        <h1 className="mt-4 font-heading text-xl font-bold text-navy-900">
          {valid ? "Pengurus Aktif" : "Tidak Berlaku"}
        </h1>

        <p
          className={`mt-1 text-sm ${valid ? "text-emerald-700" : "text-red-700"}`}
        >
          {valid
            ? "Nama berikut terdaftar sebagai pengurus aktif LIPAN RI."
            : "Nama berikut sudah tidak menjabat sebagai pengurus LIPAN RI."}
        </p>

        {p.foto && (
          <Image
            src={p.foto}
            alt={p.nama}
            width={160}
            height={160}
            className="mx-auto mt-6 size-32 rounded-2xl object-cover object-top ring-1 ring-navy-100 sm:size-40"
          />
        )}

        <div className="mt-6 space-y-3 rounded-xl border border-navy-100 bg-navy-50/50 p-5 text-left text-sm">
          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
            <div>
              <p className="text-xs text-muted-foreground">Nama</p>
              <p className="font-medium text-navy-900">{p.nama}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
            <div>
              <p className="text-xs text-muted-foreground">Jabatan</p>
              <p className="font-medium text-navy-900">{p.jabatan}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
            <div>
              <p className="text-xs text-muted-foreground">Nomor Anggota</p>
              <p className="font-medium text-navy-900">{p.nomorAnggota}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
            <div>
              <p className="text-xs text-muted-foreground">Masa Berlaku</p>
              <p className="font-medium text-navy-900">
                {formatMasaBerlaku(p.mulaiMenjabat, p.selesaiMenjabat)}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Halaman ini dihasilkan otomatis oleh sistem LIPAN RI.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Buat route QR**

Buat `src/app/api/verifikasi-pengurus/[slug]/qr/route.ts`:

```ts
import { NextResponse } from "next/server";
import { generateQrPng } from "@/lib/qr";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const png = await generateQrPng(
    `https://www.lipan-ri.com/verifikasi-pengurus/${slug}`,
  );

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
```

- [ ] **Step 9: Jalankan test, pastikan LULUS**

Run: `pnpm e2e e2e/verifikasi-pengurus.spec.ts`
Expected: PASS (4 test)

- [ ] **Step 10: Lint & build**

Run: `pnpm lint && pnpm build`
Expected: keduanya lulus.

- [ ] **Step 11: Commit**

```bash
git add "src/app/(site)/verifikasi-pengurus" "src/app/api/verifikasi-pengurus" \
  src/lib/pengurus-rules.ts src/lib/pengurus-rules.test.ts e2e/verifikasi-pengurus.spec.ts
git commit -m "feat(verifikasi): halaman & QR verifikasi keanggotaan pengurus"
```

---

### Task 7: Layar admin + ZIP massal

**Files:**
- Create: `src/lib/admin/pengurus.ts`, `src/app/admin/pengurus/page.tsx`, `src/app/admin/pengurus/actions.ts`, `src/app/admin/pengurus/pengurus-form.tsx`, `src/app/admin/pengurus/baru/page.tsx`, `src/app/admin/pengurus/[id]/edit/page.tsx`, `src/app/api/admin/pengurus/qr-bulk/route.ts`
- Modify: `src/app/admin/layout.tsx`

**Interfaces:**
- Consumes: `getAllPengurus()`, `Pengurus` (Task 4), `nextNomorAnggota()` (Task 2), `generateQrPng()` (Task 1), `SLOT_LABELS`, `POS` (Task 3)
- Produces: `/admin/pengurus`, `PengurusInput`

- [ ] **Step 1: Buat `src/lib/admin/pengurus.ts`**

```ts
import { db } from "@/db";
import { pengurus } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nextNomorAnggota } from "@/lib/pengurus-rules";

export interface PengurusInput {
  slot: string | null;
  slug: string;
  nomorAnggota: string;
  nama: string;
  jabatan: string;
  foto: string | null;
  deskripsi: string | null;
  email: string | null;
  telepon: string | null;
  status: "aktif" | "nonaktif";
  mulaiMenjabat: Date;
  selesaiMenjabat: Date | null;
}

export async function getPengurusById(id: number) {
  const [row] = await db
    .select()
    .from(pengurus)
    .where(eq(pengurus.id, id))
    .limit(1);
  return row ?? null;
}

/** Nomor anggota usulan untuk form "baru". */
export async function suggestNomorAnggota(): Promise<string> {
  const rows = await db.select({ nomor: pengurus.nomorAnggota }).from(pengurus);
  return nextNomorAnggota(
    rows.map((r) => r.nomor),
    new Date().getFullYear(),
  );
}

export async function createPengurus(input: PengurusInput): Promise<number> {
  const [row] = await db
    .insert(pengurus)
    .values(input)
    .returning({ id: pengurus.id });
  return row.id;
}

export async function updatePengurus(id: number, input: PengurusInput) {
  await db
    .update(pengurus)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(pengurus.id, id));
}

export async function deletePengurus(id: number) {
  await db.delete(pengurus).where(eq(pengurus.id, id));
}
```

- [ ] **Step 2: Buat `src/app/admin/pengurus/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@blawness/admin-kit/auth-helpers";
import {
  createPengurus,
  updatePengurus,
  deletePengurus,
  type PengurusInput,
} from "@/lib/admin/pengurus";

const schema = z.object({
  slot: z.string().optional(),
  slug: z.string().min(1, "Slug wajib diisi"),
  nomorAnggota: z.string().min(1, "Nomor anggota wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  jabatan: z.string().min(1, "Jabatan wajib diisi"),
  foto: z.string().optional(),
  deskripsi: z.string().optional(),
  email: z.string().optional(),
  telepon: z.string().optional(),
  status: z.enum(["aktif", "nonaktif"]),
  mulaiMenjabat: z.string().min(1, "Tanggal mulai menjabat wajib diisi"),
  selesaiMenjabat: z.string().optional(),
});

export type PengurusFormState = { error?: string };

function parse(formData: FormData): PengurusInput {
  const d = schema.parse({
    slot: formData.get("slot") || undefined,
    slug: formData.get("slug"),
    nomorAnggota: formData.get("nomorAnggota"),
    nama: formData.get("nama"),
    jabatan: formData.get("jabatan"),
    foto: formData.get("foto") || undefined,
    deskripsi: formData.get("deskripsi") || undefined,
    email: formData.get("email") || undefined,
    telepon: formData.get("telepon") || undefined,
    status: formData.get("status") || "aktif",
    mulaiMenjabat: formData.get("mulaiMenjabat"),
    selesaiMenjabat: formData.get("selesaiMenjabat") || undefined,
  });

  return {
    slot: d.slot?.trim() || null,
    slug: d.slug.trim(),
    nomorAnggota: d.nomorAnggota.trim(),
    nama: d.nama.trim(),
    jabatan: d.jabatan.trim(),
    foto: d.foto?.trim() || null,
    deskripsi: d.deskripsi?.trim() || null,
    email: d.email?.trim() || null,
    telepon: d.telepon?.trim() || null,
    status: d.status,
    mulaiMenjabat: new Date(d.mulaiMenjabat),
    selesaiMenjabat: d.selesaiMenjabat ? new Date(d.selesaiMenjabat) : null,
  };
}

export async function createPengurusAction(
  _prev: PengurusFormState,
  formData: FormData,
): Promise<PengurusFormState> {
  await requireUser();
  let input: PengurusInput;
  try {
    input = parse(formData);
  } catch (e) {
    return {
      error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid.",
    };
  }
  await createPengurus(input);
  revalidatePath("/admin/pengurus");
  revalidatePath("/tentang-kami/struktur");
  redirect("/admin/pengurus?saved=created");
}

export async function updatePengurusAction(
  id: number,
  _prev: PengurusFormState,
  formData: FormData,
): Promise<PengurusFormState> {
  await requireUser();
  let input: PengurusInput;
  try {
    input = parse(formData);
  } catch (e) {
    return {
      error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid.",
    };
  }
  await updatePengurus(id, input);
  revalidatePath("/admin/pengurus");
  revalidatePath("/tentang-kami/struktur");
  redirect("/admin/pengurus?saved=updated");
}

export async function deletePengurusAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await deletePengurus(id);
  revalidatePath("/admin/pengurus");
  revalidatePath("/tentang-kami/struktur");
}
```

- [ ] **Step 3: Buat `src/app/admin/pengurus/pengurus-form.tsx`**

```tsx
"use client";

import { useActionState, useState } from "react";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@blawness/admin-kit/components";
import { uploadImageAction } from "@blawness/admin-kit/screens/media/actions";
import { SLOT_LABELS } from "@/components/tentang-kami/org-flow";
import type { PengurusFormState } from "./actions";

export type PengurusFormValues = {
  slot: string;
  slug: string;
  nomorAnggota: string;
  nama: string;
  jabatan: string;
  foto: string;
  deskripsi: string;
  email: string;
  telepon: string;
  status: "aktif" | "nonaktif";
  mulaiMenjabat: string;
  selesaiMenjabat: string;
};

const labelClass = "text-sm font-medium text-navy-800";

export function PengurusForm({
  action,
  initial,
}: {
  action: (
    prev: PengurusFormState,
    fd: FormData,
  ) => Promise<PengurusFormState>;
  initial: PengurusFormValues;
}) {
  const [state, formAction, pending] = useActionState<
    PengurusFormState,
    FormData
  >(action, {});
  const [foto, setFoto] = useState(initial.foto);

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <input type="hidden" name="foto" value={foto} />

      <div className="space-y-5 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="nama">
            Nama
          </label>
          <Input
            id="nama"
            name="nama"
            defaultValue={initial.nama}
            required
            placeholder="Cahya Puspita Rini, S.E."
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="jabatan">
            Jabatan
          </label>
          <Input
            id="jabatan"
            name="jabatan"
            defaultValue={initial.jabatan}
            required
            placeholder="Sekretaris Jenderal"
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="slot">
            Posisi di bagan
          </label>
          <select
            id="slot"
            name="slot"
            defaultValue={initial.slot}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">— tidak tampil di bagan —</option>
            {Object.entries(SLOT_LABELS).map(([slot, l]) => (
              <option key={slot} value={slot}>
                {l.role} ({slot})
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Satu posisi hanya bisa diisi satu orang.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="slug">
            Slug URL verifikasi
          </label>
          <Input id="slug" name="slug" defaultValue={initial.slug} required />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="nomorAnggota">
            Nomor Anggota
          </label>
          <Input
            id="nomorAnggota"
            name="nomorAnggota"
            defaultValue={initial.nomorAnggota}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="deskripsi">
            Tupoksi
          </label>
          <textarea
            id="deskripsi"
            name="deskripsi"
            defaultValue={initial.deskripsi}
            rows={4}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            placeholder="Uraian tugas pokok dan fungsi jabatan…"
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Foto</label>
          <ImageUpload
            value={foto}
            onChange={setFoto}
            uploadAction={uploadImageAction}
          />
        </div>
      </div>

      <div className="space-y-5 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="mulaiMenjabat">
              Mulai Menjabat
            </label>
            <Input
              id="mulaiMenjabat"
              name="mulaiMenjabat"
              type="date"
              defaultValue={initial.mulaiMenjabat}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="selesaiMenjabat">
              Selesai Menjabat
            </label>
            <Input
              id="selesaiMenjabat"
              name="selesaiMenjabat"
              type="date"
              defaultValue={initial.selesaiMenjabat}
            />
            <p className="text-xs text-muted-foreground">
              Kosongkan bila belum ada batas.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={initial.status}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="email">
            Email dinas
          </label>
          <Input id="email" name="email" type="email" defaultValue={initial.email} />
          <p className="text-xs text-muted-foreground">
            Tampil publik di panel bagan. Jangan isi kontak pribadi.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="telepon">
            Telepon dinas
          </label>
          <Input id="telepon" name="telepon" defaultValue={initial.telepon} />
        </div>
      </div>

      {state.error && (
        <p className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Simpan
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Buat halaman daftar `src/app/admin/pengurus/page.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { ConfirmDelete } from "@blawness/admin-kit/components";
import { Button } from "@/components/ui/button";
import { Plus, Download, Pencil } from "lucide-react";
import { getAllPengurus } from "@/lib/pengurus";
import { isBerlaku } from "@/lib/pengurus-rules";
import { POS } from "@/components/tentang-kami/org-flow";
import { deletePengurusAction } from "./actions";

export const dynamic = "force-dynamic";

/** Urut mengikuti posisi di bagan (atas ke bawah); tanpa slot ditaruh terakhir. */
function urutBagan(slot: string | null): number {
  if (!slot) return Number.MAX_SAFE_INTEGER;
  const p = POS[slot];
  return p ? p.y * 10_000 + p.x : Number.MAX_SAFE_INTEGER - 1;
}

export default async function PengurusPage() {
  await requireUser();
  const rows = (await getAllPengurus()).sort(
    (a, b) => urutBagan(a.slot) - urutBagan(b.slot),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy-900">
            Pengurus
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Profil pengurus yang tampil di bagan struktur dan halaman verifikasi
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<a href="/api/admin/pengurus/qr-bulk" download />}
          >
            <Download className="h-4 w-4" />
            Unduh semua QR
          </Button>
          <Button size="sm" render={<Link href="/admin/pengurus/baru" />}>
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
      </div>

      <ul className="mt-6 space-y-2">
        {rows.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-4 rounded-xl border border-navy-100 bg-white px-4 py-3 shadow-sm"
          >
            {p.foto ? (
              <Image
                src={p.foto}
                alt={p.nama}
                width={40}
                height={40}
                className="size-10 shrink-0 rounded-lg object-cover object-top"
              />
            ) : (
              <div className="size-10 shrink-0 rounded-lg bg-navy-50" />
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-navy-900">
                {p.nama}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {p.jabatan} · {p.nomorAnggota}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                isBerlaku(p)
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {isBerlaku(p) ? "Aktif" : "Tidak berlaku"}
            </span>

            <Button
              size="sm"
              variant="ghost"
              render={<Link href={`/admin/pengurus/${p.id}/edit`} />}
            >
              <Pencil className="h-3.5 w-3.5" />
              Ubah
            </Button>

            <ConfirmDelete
              action={deletePengurusAction}
              id={p.id}
              title="Hapus pengurus?"
              description={
                <>
                  <span className="font-medium text-navy-900">{p.nama}</span>{" "}
                  akan dihapus, dan QR-nya berhenti berlaku.
                </>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 5: Buat halaman tambah `src/app/admin/pengurus/baru/page.tsx`**

```tsx
import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { suggestNomorAnggota } from "@/lib/admin/pengurus";
import { createPengurusAction } from "../actions";
import { PengurusForm } from "../pengurus-form";

export const dynamic = "force-dynamic";

export default async function PengurusBaruPage() {
  await requireUser();
  const nomorAnggota = await suggestNomorAnggota();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy-900">
        Tambah Pengurus
      </h1>
      <div className="mt-6">
        <PengurusForm
          action={createPengurusAction}
          initial={{
            slot: "",
            slug: "",
            nomorAnggota,
            nama: "",
            jabatan: "",
            foto: "",
            deskripsi: "",
            email: "",
            telepon: "",
            status: "aktif",
            mulaiMenjabat: new Date().toISOString().slice(0, 10),
            selesaiMenjabat: "",
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Buat halaman ubah `src/app/admin/pengurus/[id]/edit/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { getPengurusById } from "@/lib/admin/pengurus";
import { updatePengurusAction } from "../../actions";
import { PengurusForm } from "../../pengurus-form";

export const dynamic = "force-dynamic";

const tanggal = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function PengurusEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const p = await getPengurusById(Number(id));
  if (!p) notFound();

  const action = updatePengurusAction.bind(null, p.id);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy-900">
        Ubah Pengurus
      </h1>
      <div className="mt-6">
        <PengurusForm
          action={action}
          initial={{
            slot: p.slot ?? "",
            slug: p.slug,
            nomorAnggota: p.nomorAnggota,
            nama: p.nama,
            jabatan: p.jabatan,
            foto: p.foto ?? "",
            deskripsi: p.deskripsi ?? "",
            email: p.email ?? "",
            telepon: p.telepon ?? "",
            status: (p.status ?? "aktif") as "aktif" | "nonaktif",
            mulaiMenjabat: tanggal(p.mulaiMenjabat),
            selesaiMenjabat: tanggal(p.selesaiMenjabat),
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Buat route ZIP `src/app/api/admin/pengurus/qr-bulk/route.ts`**

```ts
import { NextResponse } from "next/server";
import { createRequire } from "node:module";
import { auth } from "@/auth";
import { db } from "@/db";
import { pengurus } from "@/db/schema";
import { generateQrPng } from "@/lib/qr";

const req = createRequire(import.meta.url);
const archiver = req("archiver");

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rows = await db
    .select({
      slug: pengurus.slug,
      nama: pengurus.nama,
      nomorAnggota: pengurus.nomorAnggota,
    })
    .from(pengurus);

  if (rows.length === 0) {
    return new NextResponse("No pengurus found", { status: 404 });
  }

  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  archive.on("data", (chunk: Buffer) => chunks.push(chunk));

  const finished = new Promise<Buffer>((resolve, reject) => {
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);
  });

  for (const row of rows) {
    const png = await generateQrPng(
      `https://www.lipan-ri.com/verifikasi-pengurus/${row.slug}`,
    );
    // Nama berkas memuat nomor anggota agar mudah dicocokkan saat menata cetakan.
    const aman = row.nama.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    archive.append(png, { name: `${row.nomorAnggota}-${aman}.png` });
  }

  await archive.finalize();
  const zipBuffer = await finished;

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="qr-pengurus-lipan-ri.zip"`,
    },
  });
}
```

- [ ] **Step 8: Tambahkan menu sidebar**

Di `src/app/admin/layout.tsx`, tambahkan `IdCard` ke import `lucide-react`, lalu sisipkan grup baru setelah grup `"Dokumen"`:

```tsx
  {
    label: "Organisasi",
    icon: <IdCard className="h-4 w-4" />,
    children: [
      { href: "/admin/pengurus", label: "Pengurus", icon: <IdCard className="h-4 w-4" />, requires: "pengurus.manage" },
    ],
  },
```

- [ ] **Step 9: Lint & build**

Run: `pnpm lint && pnpm build`
Expected: keduanya lulus.

- [ ] **Step 10: Verifikasi manual layar admin**

Run: `pnpm dev`, lalu buka `http://localhost:3000/admin/pengurus` setelah login.
Expected: 18 baris urut dari Dewan Pembina di atas sampai Staf Divisi di bawah, semuanya berbadge "Aktif". Klik "Unduh semua QR" → ZIP berisi 18 PNG bernama `LIPAN-2026-00xx-Nama.png`.

- [ ] **Step 11: Verifikasi satu suntingan menembus ke bagan**

Ubah tupoksi salah satu pengurus lewat `/admin/pengurus/{id}/edit`, simpan, lalu buka `/tentang-kami/struktur` dan klik kartunya.
Expected: teks baru muncul di panel detail.

- [ ] **Step 12: Tambahkan e2e ZIP massal**

Route ini di balik `auth()`, jadi test-nya masuk ke `e2e/admin-auth.spec.ts` yang dijalankan project `admin` (memakai sesi hasil `admin.setup.ts`). Tambahkan di akhir berkas:

```ts
test("unduh QR massal pengurus menghasilkan ZIP", async ({ request }) => {
  const res = await request.get("/api/admin/pengurus/qr-bulk");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("application/zip");

  const body = await res.body();
  // Signature ZIP lokal file header: "PK\x03\x04".
  expect(body.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))).toBe(
    true,
  );
  // Tiap entri punya satu local file header; 18 pengurus → 18 entri.
  const entri = body.toString("latin1").split("PK\x03\x04").length - 1;
  expect(entri).toBe(18);
});
```

- [ ] **Step 13: Jalankan test ZIP**

Run: `E2E_ADMIN_EMAIL=<email> E2E_ADMIN_PASSWORD=<password> pnpm e2e --project=admin`
Expected: PASS. Tanpa dua variabel itu, project `admin` tidak dijalankan sama sekali — bukan berarti lulus.

- [ ] **Step 14: Jalankan seluruh test**

Run: `pnpm test && pnpm e2e`
Expected: unit test lulus semua; e2e lulus semua.

- [ ] **Step 15: Commit**

```bash
git add src/lib/admin/pengurus.ts src/app/admin/pengurus "src/app/api/admin/pengurus" \
  src/app/admin/layout.tsx e2e/admin-auth.spec.ts
git commit -m "feat(admin): layar kelola pengurus + unduh QR massal"
```

---

## Catatan untuk pelaksana

**Jangan menyentuh data produksi.** Dev dan produksi berbagi satu database Neon. Test tidak boleh membuat atau menghapus baris. Kalau sebuah cabang logika butuh data yang tidak ada di seed (mis. pengurus nonaktif), ujilah lewat unit test di `src/lib/pengurus-rules.test.ts`, bukan lewat e2e.

**Dua nilai yang menunggu jawaban pemilik proyek**, dipakai sementara di seed dan boleh diganti kapan saja lewat panel admin:

1. `mulaiMenjabat` diseed `2026-01-01` untuk semua orang — tanggal sebenarnya belum diketahui.
2. Format `LIPAN-{tahun}-{0001}` adalah usulan; bila LIPAN RI sudah punya format penomoran resmi, ganti di `nextNomorAnggota` (`src/lib/pengurus-rules.ts`) dan di seed.

**Urutan task tidak boleh dibalik.** Task 3 sengaja meninggalkan `struktur-org.tsx` dalam keadaan tidak ter-compile (`MEMBERS` hilang) dan Task 5 yang memperbaikinya. Ini agar tiap commit tetap satu perubahan yang bisa dijelaskan; jangan menambal sementara di Task 3.
