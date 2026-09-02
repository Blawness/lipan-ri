# Modul Surat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambah modul penyusunan surat (SK, Surat Tugas, dll) dengan alur draft → diajukan → disahkan penandatangan, yang saat pengesahan otomatis menerbitkan PDF ber-QR dan mendaftarkannya ke registry dokumen/verifikasi yang sudah ada.

**Architecture:** Tiga tabel baru (`letter_templates`, `letters`, `letter_logs`) hidup berdampingan dengan tabel `documents` yang tidak diubah. Logika murni (pola nomor, mesin status, pemeta HTML→PDF) dipisah ke fungsi tanpa I/O supaya bisa diuji tuntas dengan vitest; sisi I/O (DB, R2) dibungkus tipis di `src/lib/surat/`. PDF dirender dengan `@react-pdf/renderer` di luar transaksi DB.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM + PostgreSQL (Neon), `@blawness/admin-kit` 0.8 (auth, RBAC, Editor, uploadFile R2), `@react-pdf/renderer`, `htmlparser2`, `zod`, vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-02-modul-surat-design.md`

## Global Constraints

- Baca panduan di `node_modules/next/dist/docs/` sebelum menulis kode Next.js — versi ini punya breaking changes dari yang kamu hafal.
- Path alias `@/` → `./src/*`.
- Semua halaman memakai `export const dynamic = "force-dynamic"`. Tidak ada ISR.
- Bahasa UI, label, pesan error, dan format tanggal: Indonesia (`id-ID`).
- Tailwind v4 (`@import "tailwindcss"`), shadcn style **base-nova**.
- Pada `Button` shadcn **jangan pakai `asChild`** — gunakan prop `render`.
- `"use client"` wajib untuk komponen yang memakai hook, state, event handler, atau primitive interaktif shadcn.
- Server action wajib memanggil `requirePermission(...)` dari `@blawness/admin-kit/auth-helpers` sebelum menyentuh data.
- Migrasi lewat `pnpm db:generate` lalu `pnpm db:migrate` — **jangan** tulis file SQL migrasi dengan tangan, dan jangan pakai `db:push` di repo ini.
- `pnpm db:seed` bersifat destruktif dan dev & prod berbagi satu database Neon — **jangan pernah menjalankannya** dalam pengerjaan plan ini.
- Jalankan `pnpm lint` lalu `pnpm build` sebelum menyatakan pekerjaan selesai.
- `src/lib/qr.ts` dan `src/lib/documents.ts` serta modul `/admin/dokumen` + `/verifikasi` **tidak boleh diubah** — hanya dipakai.
- Kalau di WSL koneksi ke Neon kena `ETIMEDOUT`, jalankan perintah dengan `NODE_OPTIONS=--no-network-family-autoselection`. Jangan mengubah `src/db/index.ts`.

## File Structure

| Berkas | Tanggung jawab |
|---|---|
| `src/db/schema.ts` (ubah) | Tabel + enum baru, kolom `signatories.userId` |
| `src/lib/surat/nomor.ts` | Murni: render pola nomor, bulan romawi, padding |
| `src/lib/surat/status.ts` | Murni: mesin status + aturan siapa boleh transisi apa |
| `src/lib/surat/html-to-pdf.ts` | Murni: HTML badan surat → node react-pdf |
| `src/lib/surat/kop.ts` | Konstanta identitas organisasi untuk kop surat |
| `src/lib/surat/pdf/surat-document.tsx` | Komponen react-pdf + `renderSuratPdf()` |
| `src/lib/surat/issue.ts` | Orkestrasi pengesahan: nomor → dokumen → PDF → R2 |
| `src/lib/admin/letter-templates.ts` | Data access template |
| `src/lib/admin/letters.ts` | Data access surat + log |
| `src/lib/sanitize.ts` (ubah) | Tambah `sanitizeSuratHtml` |
| `src/rbac.ts` (ubah) | Permission surat + role `penandatangan` |
| `src/app/admin/(protected)/layout.tsx` (ubah) | Item nav baru |
| `src/app/admin/(protected)/surat/**` | Layar daftar, buat, edit, detail, pengesahan |
| `src/app/admin/(protected)/surat/template/**` | CRUD jenis surat |
| `e2e/surat.spec.ts` | Alur ujung-ke-ujung |

---

### Task 1: Skema database

**Files:**
- Modify: `src/db/schema.ts`
- Create: `drizzle/` (satu file migrasi hasil generate — jangan ditulis tangan)

**Interfaces:**
- Consumes: tabel `signatories`, `documents` yang sudah ada.
- Produces: `letterStatusEnum`, `letterLogActionEnum`, `letterTemplates`, `letters`, `letterLogs`, dan kolom `signatories.userId`. Semua task berikutnya mengimpor ini dari `@/db/schema`.

- [ ] **Step 1: Tambah enum dan tabel baru**

Tambahkan di akhir `src/db/schema.ts`. Perhatikan `jsonb` harus ditambahkan ke daftar import dari `drizzle-orm/pg-core` di baris atas berkas, dan `unique` diimpor juga.

```ts
export const letterStatusEnum = pgEnum("letter_status", [
  "draft",
  "submitted",
  "issued",
]);

export const letterLogActionEnum = pgEnum("letter_log_action", [
  "created",
  "updated",
  "submitted",
  "rejected",
  "issued",
]);

/** Satu field tambahan yang diisi saat membuat surat dari template ini. */
export type LetterTemplateField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "number";
  required: boolean;
};

export const letterTemplates = pgTable("letter_templates", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  // Token yang dikenali: {seq} {tahun} {bulan} {bulanRomawi} {kode}
  numberPattern: text("number_pattern").notNull(),
  // HTML tersanitasi (sanitizeSuratHtml), bukan Tiptap JSON.
  bodyDefault: text("body_default").notNull().default(""),
  fields: jsonb("fields").$type<LetterTemplateField[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const letters = pgTable(
  "letters",
  {
    id: serial("id").primaryKey(),
    templateId: integer("template_id")
      .notNull()
      .references(() => letterTemplates.id, { onDelete: "restrict" }),
    subject: text("subject").notNull(),
    bodyHtml: text("body_html").notNull().default(""),
    fieldValues: jsonb("field_values")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    signatoryId: integer("signatory_id")
      .notNull()
      .references(() => signatories.id, { onDelete: "restrict" }),
    status: letterStatusEnum("status").notNull().default("draft"),
    // Ketiganya null selama surat belum disahkan.
    numberSeq: integer("number_seq"),
    numberYear: integer("number_year"),
    number: text("number"),
    documentId: integer("document_id").references(() => documents.id, {
      onDelete: "set null",
    }),
    rejectionNote: text("rejection_note"),
    createdBy: integer("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    // Inilah yang mencegah dua pengesahan bersamaan merebut nomor yang sama.
    unique("letters_seq_unique").on(t.templateId, t.numberYear, t.numberSeq),
  ]
);

export const letterLogs = pgTable("letter_logs", {
  id: serial("id").primaryKey(),
  letterId: integer("letter_id")
    .notNull()
    .references(() => letters.id, { onDelete: "cascade" }),
  actorId: integer("actor_id").notNull(),
  action: letterLogActionEnum("action").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

- [ ] **Step 2: Tambah kolom `position` dan `userId` pada `signatories`**

Ubah definisi `signatories` yang ada menjadi:

```ts
export const signatories = pgTable("signatories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // `title` adalah GELAR ("SE, SH, MH") — bukan jabatan. Jangan tertukar.
  title: text("title"),
  // Jabatan yang tercetak di blok tanda tangan PDF ("Ketua Umum").
  position: text("position"),
  // Akun yang berhak mengesahkan surat atas nama penandatangan ini.
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});
```

- [ ] **Step 3: Generate migrasi**

Run: `pnpm db:generate`
Expected: satu berkas SQL baru muncul di `drizzle/`, berisi `CREATE TYPE letter_status`, `CREATE TABLE letters`, serta `ALTER TABLE signatories` untuk `position` dan `user_id`.

- [ ] **Step 4: Terapkan migrasi**

Run: `pnpm db:migrate`
Expected: selesai tanpa error. Kalau kena `ETIMEDOUT` di WSL, ulangi dengan `NODE_OPTIONS=--no-network-family-autoselection pnpm db:migrate`.

- [ ] **Step 5: Verifikasi tipe**

Run: `pnpm lint && npx tsc --noEmit`
Expected: tanpa error.

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat(surat): skema letter_templates, letters, letter_logs"
```

---

### Task 2: Render pola nomor

**Files:**
- Create: `src/lib/surat/nomor.ts`
- Test: `src/lib/surat/nomor.test.ts`

**Interfaces:**
- Consumes: —
- Produces: `renderNumberPattern(pattern: string, ctx: { seq: number; date: Date; code: string }): string` dan `bulanRomawi(month1to12: number): string`.

- [ ] **Step 1: Tulis test yang gagal**

```ts
// src/lib/surat/nomor.test.ts
import { describe, it, expect } from "vitest";
import { renderNumberPattern, bulanRomawi } from "@/lib/surat/nomor";

describe("bulanRomawi", () => {
  it("memetakan 1..12 ke angka romawi", () => {
    expect(bulanRomawi(1)).toBe("I");
    expect(bulanRomawi(6)).toBe("VI");
    expect(bulanRomawi(9)).toBe("IX");
    expect(bulanRomawi(12)).toBe("XII");
  });
});

describe("renderNumberPattern", () => {
  const ctx = { seq: 7, date: new Date("2026-06-15T00:00:00Z"), code: "SK" };

  it("mengisi semua token", () => {
    expect(
      renderNumberPattern("{seq}/{kode}/LIPAN-RI/{bulanRomawi}/{tahun}", ctx)
    ).toBe("007/SK/LIPAN-RI/VI/2026");
  });

  it("memberi padding 3 digit pada seq", () => {
    expect(renderNumberPattern("{seq}", { ...ctx, seq: 1 })).toBe("001");
  });

  it("tidak memotong seq yang sudah lebih dari 3 digit", () => {
    expect(renderNumberPattern("{seq}", { ...ctx, seq: 1234 })).toBe("1234");
  });

  it("mendukung {bulan} sebagai angka dua digit", () => {
    expect(renderNumberPattern("{bulan}", ctx)).toBe("06");
  });

  it("membiarkan pola tanpa token apa adanya", () => {
    expect(renderNumberPattern("SURAT-TETAP", ctx)).toBe("SURAT-TETAP");
  });

  it("membiarkan token tak dikenal apa adanya agar salah ketik terlihat", () => {
    expect(renderNumberPattern("{nomor}/{tahun}", ctx)).toBe("{nomor}/2026");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `pnpm test src/lib/surat/nomor.test.ts`
Expected: FAIL — modul `@/lib/surat/nomor` tidak ditemukan.

- [ ] **Step 3: Implementasi**

```ts
// src/lib/surat/nomor.ts
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
```

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `pnpm test src/lib/surat/nomor.test.ts`
Expected: PASS, 6 test.

- [ ] **Step 5: Commit**

```bash
git add src/lib/surat/nomor.ts src/lib/surat/nomor.test.ts
git commit -m "feat(surat): render pola nomor surat"
```

---

### Task 3: Mesin status dan aturan pengesahan

**Files:**
- Create: `src/lib/surat/status.ts`
- Test: `src/lib/surat/status.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `type LetterStatus = "draft" | "submitted" | "issued"`
  - `canEdit(status: LetterStatus): boolean`
  - `canSubmit(status: LetterStatus): boolean`
  - `canIssue(input: { status: LetterStatus; actorUserId: number; actorRole: string; signatoryUserId: number | null }): { ok: true } | { ok: false; reason: string }`
  - `STATUS_LABEL: Record<LetterStatus, string>`

- [ ] **Step 1: Tulis test yang gagal**

```ts
// src/lib/surat/status.test.ts
import { describe, it, expect } from "vitest";
import { canEdit, canSubmit, canIssue, STATUS_LABEL } from "@/lib/surat/status";

describe("canEdit", () => {
  it("hanya draft yang boleh disunting", () => {
    expect(canEdit("draft")).toBe(true);
    expect(canEdit("submitted")).toBe(false);
    expect(canEdit("issued")).toBe(false);
  });
});

describe("canSubmit", () => {
  it("hanya draft yang boleh diajukan", () => {
    expect(canSubmit("draft")).toBe(true);
    expect(canSubmit("submitted")).toBe(false);
    expect(canSubmit("issued")).toBe(false);
  });
});

describe("canIssue", () => {
  const base = {
    status: "submitted" as const,
    actorUserId: 5,
    actorRole: "penandatangan",
    signatoryUserId: 5,
  };

  it("mengizinkan penandatangan yang tertaut", () => {
    expect(canIssue(base)).toEqual({ ok: true });
  });

  it("menolak penandatangan lain", () => {
    const r = canIssue({ ...base, signatoryUserId: 9 });
    expect(r.ok).toBe(false);
  });

  it("mengizinkan admin sebagai jalan darurat", () => {
    expect(
      canIssue({ ...base, actorRole: "admin", signatoryUserId: 9 })
    ).toEqual({ ok: true });
  });

  it("menolak surat yang belum diajukan", () => {
    const r = canIssue({ ...base, status: "draft" });
    expect(r.ok).toBe(false);
  });

  it("menolak surat yang sudah terbit", () => {
    const r = canIssue({ ...base, status: "issued" });
    expect(r.ok).toBe(false);
  });

  it("menolak penandatangan yang belum punya akun tertaut", () => {
    const r = canIssue({ ...base, signatoryUserId: null });
    expect(r.ok).toBe(false);
  });
});

describe("STATUS_LABEL", () => {
  it("berbahasa Indonesia", () => {
    expect(STATUS_LABEL.submitted).toBe("Menunggu Pengesahan");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `pnpm test src/lib/surat/status.test.ts`
Expected: FAIL — modul tidak ditemukan.

- [ ] **Step 3: Implementasi**

```ts
// src/lib/surat/status.ts
export type LetterStatus = "draft" | "submitted" | "issued";

export const STATUS_LABEL: Record<LetterStatus, string> = {
  draft: "Draft",
  submitted: "Menunggu Pengesahan",
  issued: "Terbit",
};

export function canEdit(status: LetterStatus): boolean {
  return status === "draft";
}

export function canSubmit(status: LetterStatus): boolean {
  return status === "draft";
}

export type IssueCheck =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Lapis kedua di atas permission `letters.issue`: surat hanya boleh disahkan
 * oleh akun yang tertaut ke penandatangannya. Admin diberi jalan darurat, dan
 * pemakaiannya dicatat apa adanya di log — bukan disamarkan jadi tindakan
 * si penandatangan.
 */
export function canIssue({
  status,
  actorUserId,
  actorRole,
  signatoryUserId,
}: {
  status: LetterStatus;
  actorUserId: number;
  actorRole: string;
  signatoryUserId: number | null;
}): IssueCheck {
  if (status !== "submitted") {
    return {
      ok: false,
      reason:
        status === "issued"
          ? "Surat ini sudah terbit."
          : "Surat belum diajukan untuk pengesahan.",
    };
  }
  if (actorRole === "admin") return { ok: true };
  if (signatoryUserId === null) {
    return {
      ok: false,
      reason: "Penandatangan surat ini belum ditautkan ke akun pengguna.",
    };
  }
  if (signatoryUserId !== actorUserId) {
    return {
      ok: false,
      reason: "Surat ini ditujukan kepada penandatangan lain.",
    };
  }
  return { ok: true };
}
```

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `pnpm test src/lib/surat/status.test.ts`
Expected: PASS, 8 test.

- [ ] **Step 5: Commit**

```bash
git add src/lib/surat/status.ts src/lib/surat/status.test.ts
git commit -m "feat(surat): mesin status dan aturan pengesahan"
```

---

### Task 4: Perizinan dan navigasi

**Files:**
- Modify: `src/rbac.ts`
- Modify: `src/app/admin/(protected)/layout.tsx:12-49`

**Interfaces:**
- Consumes: `presets` dari `@blawness/admin-kit/rbac`.
- Produces: permission `letters.read`, `letters.write`, `letters.submit`, `letters.issue`, `letterTemplates.manage`; role baru `penandatangan`.

- [ ] **Step 1: Tambah permission dan role**

`src/rbac.ts` menjadi:

```ts
import { defineRbac, presets } from "@blawness/admin-kit/rbac";

const editorLetterScope = [
  "letters.read",
  "letters.write",
  "letters.submit",
] as const;

export const rbac = defineRbac({
  roles: {
    ...presets.adminEditor,
    editor: [...presets.adminEditor.editor, ...editorLetterScope],
    // Akun pejabat penanda tangan: cukup melihat dan mengesahkan surat.
    penandatangan: ["letters.read", "letters.issue", "profile.edit"],
  },
  fallbackRole: "editor",
  protectedPermission: "users.delete",
});
```

- [ ] **Step 2: Tambah item nav**

Di `src/app/admin/(protected)/layout.tsx`, tambahkan `FileSignature` dan `LayoutTemplate` ke import `lucide-react`, lalu sisipkan dua anak baru di grup `Dokumen` **sebelum** item `/admin/dokumen`:

```tsx
      { href: "/admin/surat", label: "Surat", icon: <FileSignature className="h-4 w-4" />, requires: "letters.read" },
      { href: "/admin/surat/template", label: "Jenis Surat", icon: <LayoutTemplate className="h-4 w-4" />, requires: "letterTemplates.manage" },
```

- [ ] **Step 3: Verifikasi**

Run: `pnpm lint && npx tsc --noEmit`
Expected: tanpa error.

- [ ] **Step 4: Commit**

```bash
git add src/rbac.ts "src/app/admin/(protected)/layout.tsx"
git commit -m "feat(surat): permission surat dan role penandatangan"
```

---

### Task 5: Sanitasi HTML badan surat

**Files:**
- Modify: `src/lib/sanitize.ts`
- Test: `src/lib/sanitize.test.ts` (buat baru)

**Interfaces:**
- Consumes: `sanitize-html`.
- Produces: `sanitizeSuratHtml(dirty: string): string` dan `SURAT_ALLOWED_TAGS: string[]` — daftar tag inilah kontrak tunggal antara editor dan mesin PDF di Task 6.

- [ ] **Step 1: Tulis test yang gagal**

```ts
// src/lib/sanitize.test.ts
import { describe, it, expect } from "vitest";
import { sanitizeSuratHtml } from "@/lib/sanitize";

describe("sanitizeSuratHtml", () => {
  it("mempertahankan tag yang dirender ke PDF", () => {
    const html = "<p>Halo <strong>dunia</strong></p><ul><li>satu</li></ul>";
    expect(sanitizeSuratHtml(html)).toBe(html);
  });

  it("membuang gambar dan tautan karena tidak dirender ke PDF", () => {
    expect(sanitizeSuratHtml('<p>a<img src="https://x/y.png">b</p>')).toBe("<p>ab</p>");
    expect(sanitizeSuratHtml('<p><a href="https://x">taut</a></p>')).toBe("<p>taut</p>");
  });

  it("membuang script", () => {
    expect(sanitizeSuratHtml("<p>a</p><script>alert(1)</script>")).toBe("<p>a</p>");
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

Run: `pnpm test src/lib/sanitize.test.ts`
Expected: FAIL — `sanitizeSuratHtml` bukan fungsi.

- [ ] **Step 3: Implementasi**

Tambahkan di bawah `sanitizeHtml` yang sudah ada di `src/lib/sanitize.ts` (jangan ubah fungsi lama — dipakai halaman berita):

```ts
/**
 * Tag yang boleh ada di badan surat. Daftar ini adalah kontrak tunggal antara
 * editor admin dan pemeta HTML→PDF (`src/lib/surat/html-to-pdf.ts`): apa pun
 * yang lolos ke sini harus punya padanan node react-pdf.
 */
export const SURAT_ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u",
  "h2", "h3", "h4",
  "ul", "ol", "li", "blockquote",
];

/**
 * Sanitasi badan surat. Lebih sempit dari `sanitizeHtml`: tautan, gambar, dan
 * figure dibuang karena mesin PDF tidak merendernya — lebih baik hilang saat
 * disimpan (kelihatan di editor) daripada hilang diam-diam di PDF final.
 */
export function sanitizeSuratHtml(dirty: string): string {
  return sanitizeHtmlLib(dirty, {
    allowedTags: SURAT_ALLOWED_TAGS,
    allowedAttributes: {},
    allowProtocolRelative: false,
  });
}
```

- [ ] **Step 4: Jalankan test, pastikan lulus**

Run: `pnpm test src/lib/sanitize.test.ts`
Expected: PASS, 3 test.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sanitize.ts src/lib/sanitize.test.ts
git commit -m "feat(surat): sanitasi HTML badan surat"
```

---

### Task 6: Pemeta HTML → node PDF

**Files:**
- Create: `src/lib/surat/html-to-pdf.ts`
- Test: `src/lib/surat/html-to-pdf.test.ts`
- Modify: `package.json` (tambah `htmlparser2`)

**Interfaces:**
- Consumes: `SURAT_ALLOWED_TAGS` dari Task 5.
- Produces: `parseSuratHtml(html: string): SuratBlock[]` dengan tipe

```ts
export type SuratInline = { text: string; bold: boolean; italic: boolean; underline: boolean };
export type SuratBlock =
  | { kind: "paragraph"; level: 0 | 2 | 3 | 4; quote: boolean; inlines: SuratInline[] }
  | { kind: "list"; ordered: boolean; items: SuratInline[][] };
```

Task 7 merender `SuratBlock[]` ini menjadi elemen react-pdf. Sengaja dipisah supaya bisa diuji tanpa menyentuh mesin PDF sama sekali.

- [ ] **Step 1: Pasang dependensi**

Run: `pnpm add htmlparser2`
Expected: `htmlparser2` masuk ke `dependencies`.

- [ ] **Step 2: Tulis test yang gagal**

```ts
// src/lib/surat/html-to-pdf.test.ts
import { describe, it, expect } from "vitest";
import { parseSuratHtml } from "@/lib/surat/html-to-pdf";

const plain = (text: string) => ({
  text,
  bold: false,
  italic: false,
  underline: false,
});

describe("parseSuratHtml", () => {
  it("memetakan paragraf biasa", () => {
    expect(parseSuratHtml("<p>Halo</p>")).toEqual([
      { kind: "paragraph", level: 0, quote: false, inlines: [plain("Halo")] },
    ]);
  });

  it("mempertahankan tebal, miring, dan garis bawah", () => {
    expect(
      parseSuratHtml("<p>a<strong>b</strong><em>c</em><u>d</u></p>")
    ).toEqual([
      {
        kind: "paragraph",
        level: 0,
        quote: false,
        inlines: [
          plain("a"),
          { text: "b", bold: true, italic: false, underline: false },
          { text: "c", bold: false, italic: true, underline: false },
          { text: "d", bold: false, italic: false, underline: true },
        ],
      },
    ]);
  });

  it("menandai heading dengan level", () => {
    const [block] = parseSuratHtml("<h3>Judul</h3>");
    expect(block).toMatchObject({ kind: "paragraph", level: 3 });
  });

  it("menandai blockquote", () => {
    const [block] = parseSuratHtml("<blockquote><p>kutip</p></blockquote>");
    expect(block).toMatchObject({ quote: true });
  });

  it("memetakan daftar tak berurut", () => {
    expect(parseSuratHtml("<ul><li>satu</li><li>dua</li></ul>")).toEqual([
      {
        kind: "list",
        ordered: false,
        items: [[plain("satu")], [plain("dua")]],
      },
    ]);
  });

  it("memetakan daftar berurut", () => {
    const [block] = parseSuratHtml("<ol><li>satu</li></ol>");
    expect(block).toMatchObject({ kind: "list", ordered: true });
  });

  it("memecah paragraf pada <br>", () => {
    const [block] = parseSuratHtml("<p>a<br>b</p>");
    expect(block).toMatchObject({
      inlines: [plain("a"), plain("\n"), plain("b")],
    });
  });

  it("merender tag tak dikenal sebagai teks polos, bukan membuangnya", () => {
    expect(parseSuratHtml("<div>terlantar</div>")).toEqual([
      {
        kind: "paragraph",
        level: 0,
        quote: false,
        inlines: [plain("terlantar")],
      },
    ]);
  });

  it("tidak melempar pada HTML rusak", () => {
    expect(() => parseSuratHtml("<p>a<strong>b</p>")).not.toThrow();
  });

  it("mengabaikan teks kosong antar-tag", () => {
    expect(parseSuratHtml("<p>a</p>\n  \n<p>b</p>")).toHaveLength(2);
  });
});
```

- [ ] **Step 3: Jalankan test, pastikan gagal**

Run: `pnpm test src/lib/surat/html-to-pdf.test.ts`
Expected: FAIL — modul tidak ditemukan.

- [ ] **Step 4: Implementasi**

```ts
// src/lib/surat/html-to-pdf.ts
import { Parser } from "htmlparser2";

export type SuratInline = {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

export type SuratBlock =
  | {
      kind: "paragraph";
      level: 0 | 2 | 3 | 4;
      quote: boolean;
      inlines: SuratInline[];
    }
  | { kind: "list"; ordered: boolean; items: SuratInline[][] };

const HEADING_LEVEL: Record<string, 2 | 3 | 4> = { h2: 2, h3: 3, h4: 4 };

/**
 * HTML badan surat → blok datar yang siap dirender react-pdf.
 *
 * Dipisah dari komponen PDF supaya bisa diuji tanpa mesin PDF. Tag di luar
 * daftar yang didukung tidak dibuang: isinya tetap keluar sebagai paragraf
 * polos, agar kesalahan tempel tidak menghilangkan isi surat diam-diam.
 */
export function parseSuratHtml(html: string): SuratBlock[] {
  const blocks: SuratBlock[] = [];

  let bold = 0;
  let italic = 0;
  let underline = 0;
  let quoteDepth = 0;
  let level: 0 | 2 | 3 | 4 = 0;

  // Buffer paragraf berjalan; list punya buffer sendiri saat aktif.
  let inlines: SuratInline[] = [];
  let list: { ordered: boolean; items: SuratInline[][] } | null = null;
  let inListItem = false;

  function flushParagraph() {
    if (inlines.length === 0) return;
    blocks.push({
      kind: "paragraph",
      level,
      quote: quoteDepth > 0,
      inlines,
    });
    inlines = [];
  }

  function push(text: string) {
    if (text.length === 0) return;
    inlines.push({
      text,
      bold: bold > 0,
      italic: italic > 0,
      underline: underline > 0,
    });
  }

  const parser = new Parser(
    {
      onopentag(name) {
        switch (name) {
          case "strong":
          case "b":
            bold++;
            break;
          case "em":
          case "i":
            italic++;
            break;
          case "u":
            underline++;
            break;
          case "blockquote":
            flushParagraph();
            quoteDepth++;
            break;
          case "h2":
          case "h3":
          case "h4":
            flushParagraph();
            level = HEADING_LEVEL[name];
            break;
          case "p":
            flushParagraph();
            break;
          case "br":
            push("\n");
            break;
          case "ul":
          case "ol":
            flushParagraph();
            list = { ordered: name === "ol", items: [] };
            break;
          case "li":
            inlines = [];
            inListItem = true;
            break;
          default:
            // Tag tak dikenal: isinya tetap ikut paragraf berjalan.
            break;
        }
      },
      ontext(text) {
        // Runtuhkan spasi berlebih, tapi jangan buang spasi antar-kata.
        const normalized = text.replace(/\s+/g, " ");
        if (normalized.trim() === "" && inlines.length === 0) return;
        push(normalized);
      },
      onclosetag(name) {
        switch (name) {
          case "strong":
          case "b":
            bold = Math.max(0, bold - 1);
            break;
          case "em":
          case "i":
            italic = Math.max(0, italic - 1);
            break;
          case "u":
            underline = Math.max(0, underline - 1);
            break;
          case "blockquote":
            flushParagraph();
            quoteDepth = Math.max(0, quoteDepth - 1);
            break;
          case "h2":
          case "h3":
          case "h4":
            flushParagraph();
            level = 0;
            break;
          case "p":
            flushParagraph();
            break;
          case "li":
            if (list && inlines.length > 0) list.items.push(inlines);
            inlines = [];
            inListItem = false;
            break;
          case "ul":
          case "ol":
            if (list && list.items.length > 0) {
              blocks.push({ kind: "list", ...list });
            }
            list = null;
            break;
          default:
            break;
        }
      },
    },
    { decodeEntities: true }
  );

  parser.write(html);
  parser.end();

  // Sisa teks di luar tag mana pun (mis. `<div>` telanjang) tetap diselamatkan.
  if (!inListItem) flushParagraph();

  return blocks;
}
```

- [ ] **Step 5: Jalankan test, pastikan lulus**

Run: `pnpm test src/lib/surat/html-to-pdf.test.ts`
Expected: PASS, 10 test. Kalau normalisasi spasi bikin satu test meleset, perbaiki implementasinya — **jangan** melonggarkan test.

- [ ] **Step 6: Commit**

```bash
git add src/lib/surat/html-to-pdf.ts src/lib/surat/html-to-pdf.test.ts package.json pnpm-lock.yaml
git commit -m "feat(surat): pemeta HTML badan surat ke blok PDF"
```

---

### Task 7: Render PDF surat

**Files:**
- Create: `src/lib/surat/kop.ts`
- Create: `src/lib/surat/pdf/surat-document.tsx`
- Test: `src/lib/surat/pdf/surat-document.test.ts`
- Modify: `package.json` (tambah `@react-pdf/renderer`)

**Interfaces:**
- Consumes: `parseSuratHtml` (Task 6), `generateQrPng` dari `@/lib/qr` (jangan ubah berkas itu).
- Produces: `renderSuratPdf(input: SuratPdfInput): Promise<Buffer>` dengan

```ts
export type SuratPdfInput = {
  number: string;
  subject: string;
  bodyHtml: string;
  /** Nama lengkap berikut gelar, mis. "Harun Prayitno, SH". */
  signatoryName: string;
  /** Jabatan yang tercetak di atas QR, mis. "Ketua Umum". */
  signatoryPosition: string | null;
  issuedAt: Date;
  verifyUrl: string;
};
```

- [ ] **Step 1: Pasang dependensi**

Run: `pnpm add @react-pdf/renderer`
Expected: masuk ke `dependencies`.

- [ ] **Step 2: Tulis konstanta kop surat**

```ts
// src/lib/surat/kop.ts
/** Identitas organisasi pada kop surat. Satu-satunya tempat teks ini didefinisikan. */
export const KOP = {
  nama: "LEMBAGA INVESTIGASI PENGAWASAN APARATUR NEGARA",
  singkatan: "REPUBLIK INDONESIA",
  alamat: "Jakarta, Indonesia",
  situs: "www.lipan-ri.com",
  kota: "Jakarta",
  logoPath: "public/logo.png",
} as const;
```

- [ ] **Step 3: Tulis test yang gagal**

```ts
// src/lib/surat/pdf/surat-document.test.ts
import { describe, it, expect } from "vitest";
import { renderSuratPdf } from "@/lib/surat/pdf/surat-document";

const PDF_MAGIC = "%PDF";

const input = {
  number: "001/SK/LIPAN-RI/VI/2026",
  subject: "Pengangkatan Pengurus",
  bodyHtml: "<p>Menetapkan hal berikut.</p><ul><li>Poin satu</li></ul>",
  signatoryName: "Nama Ketua, SH",
  signatoryPosition: "Ketua Umum",
  issuedAt: new Date("2026-06-15T00:00:00Z"),
  verifyUrl: "https://www.lipan-ri.com/verifikasi/abc-123",
};

describe("renderSuratPdf", () => {
  it("menghasilkan PDF", async () => {
    const buf = await renderSuratPdf(input);
    expect(buf.subarray(0, 4).toString("latin1")).toBe(PDF_MAGIC);
  }, 30_000);

  it("tidak melempar untuk badan surat kosong", async () => {
    const buf = await renderSuratPdf({ ...input, bodyHtml: "" });
    expect(buf.length).toBeGreaterThan(0);
  }, 30_000);
});
```

- [ ] **Step 4: Jalankan test, pastikan gagal**

Run: `pnpm test src/lib/surat/pdf/surat-document.test.ts`
Expected: FAIL — modul tidak ditemukan.

- [ ] **Step 5: Implementasi**

```tsx
// src/lib/surat/pdf/surat-document.tsx
import path from "node:path";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { generateQrPng } from "@/lib/qr";
import { parseSuratHtml, type SuratInline } from "@/lib/surat/html-to-pdf";
import { KOP } from "@/lib/surat/kop";

export type SuratPdfInput = {
  number: string;
  subject: string;
  bodyHtml: string;
  /** Nama lengkap berikut gelar, mis. "Harun Prayitno, SH". */
  signatoryName: string;
  /** Jabatan yang tercetak di atas QR, mis. "Ketua Umum". */
  signatoryPosition: string | null;
  issuedAt: Date;
  verifyUrl: string;
};

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" });

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 56, paddingHorizontal: 56, fontSize: 11, fontFamily: "Helvetica", color: "#0f2b46" },
  kop: { flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 2, borderBottomColor: "#0f2b46", paddingBottom: 10 },
  kopLogo: { width: 56, height: 56 },
  kopNama: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  kopSub: { fontSize: 10 },
  kopAlamat: { fontSize: 9, color: "#5b6b7c" },
  judul: { marginTop: 22, textAlign: "center", fontFamily: "Helvetica-Bold", fontSize: 12, textTransform: "uppercase" },
  nomor: { marginTop: 4, textAlign: "center", fontSize: 11 },
  body: { marginTop: 20, lineHeight: 1.5 },
  paragraph: { marginBottom: 8, textAlign: "justify" },
  heading: { marginTop: 10, marginBottom: 6, fontFamily: "Helvetica-Bold" },
  quote: { paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: "#c7d3de" },
  listItem: { flexDirection: "row", marginBottom: 4 },
  listMarker: { width: 20 },
  ttdWrap: { marginTop: 28, flexDirection: "row", justifyContent: "flex-end" },
  ttd: { width: 220, alignItems: "center" },
  ttdKota: { alignSelf: "flex-start", marginBottom: 2 },
  qr: { width: 96, height: 96, marginVertical: 6 },
  ttdNama: { fontFamily: "Helvetica-Bold", textDecoration: "underline" },
  catatan: { marginTop: 10, fontSize: 8, color: "#5b6b7c", textAlign: "center" },
});

function Inlines({ inlines }: { inlines: SuratInline[] }) {
  return (
    <>
      {inlines.map((run, i) => (
        <Text
          key={i}
          style={{
            fontFamily: run.bold ? "Helvetica-Bold" : run.italic ? "Helvetica-Oblique" : "Helvetica",
            textDecoration: run.underline ? "underline" : "none",
          }}
        >
          {run.text}
        </Text>
      ))}
    </>
  );
}

function Body({ html }: { html: string }) {
  const blocks = parseSuratHtml(html);
  return (
    <View style={s.body}>
      {blocks.map((block, i) => {
        if (block.kind === "list") {
          return (
            <View key={i}>
              {block.items.map((item, j) => (
                <View key={j} style={s.listItem}>
                  <Text style={s.listMarker}>
                    {block.ordered ? `${j + 1}.` : "•"}
                  </Text>
                  <Text style={{ flex: 1 }}>
                    <Inlines inlines={item} />
                  </Text>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Text
            key={i}
            style={[
              block.level === 0 ? s.paragraph : s.heading,
              ...(block.quote ? [s.quote] : []),
            ]}
          >
            <Inlines inlines={block.inlines} />
          </Text>
        );
      })}
    </View>
  );
}

function SuratDocument({
  input,
  qr,
  logo,
}: {
  input: SuratPdfInput;
  qr: string;
  logo: string;
}) {
  return (
    <Document title={`${input.number} — ${input.subject}`}>
      <Page size="A4" style={s.page}>
        <View style={s.kop}>
          <Image style={s.kopLogo} src={logo} />
          <View>
            <Text style={s.kopNama}>{KOP.nama}</Text>
            <Text style={s.kopSub}>{KOP.singkatan}</Text>
            <Text style={s.kopAlamat}>
              {KOP.alamat} · {KOP.situs}
            </Text>
          </View>
        </View>

        <Text style={s.judul}>{input.subject}</Text>
        <Text style={s.nomor}>Nomor: {input.number}</Text>

        <Body html={input.bodyHtml} />

        <View style={s.ttdWrap}>
          <View style={s.ttd}>
            <Text style={s.ttdKota}>
              {KOP.kota}, {dateFmt.format(input.issuedAt)}
            </Text>
            {input.signatoryPosition ? <Text>{input.signatoryPosition}</Text> : null}
            <Image style={s.qr} src={qr} />
            <Text style={s.ttdNama}>{input.signatoryName}</Text>
          </View>
        </View>

        <Text style={s.catatan}>
          Ditandatangani secara elektronik. Keaslian surat ini dapat diperiksa
          dengan memindai QR di atas atau membuka {input.verifyUrl}
        </Text>
      </Page>
    </Document>
  );
}

/**
 * Render PDF surat. QR memakai `generateQrPng` yang sudah ada supaya parameter
 * QR tetap terdefinisi di satu tempat (`src/lib/qr.ts`).
 */
export async function renderSuratPdf(input: SuratPdfInput): Promise<Buffer> {
  const qrPng = await generateQrPng(input.verifyUrl);
  const qr = `data:image/png;base64,${qrPng.toString("base64")}`;
  const logo = path.resolve(KOP.logoPath);
  return renderToBuffer(<SuratDocument input={input} qr={qr} logo={logo} />);
}
```

- [ ] **Step 6: Jalankan test, pastikan lulus**

Run: `pnpm test src/lib/surat/pdf/surat-document.test.ts`
Expected: PASS, 2 test.

- [ ] **Step 7: Verifikasi build tidak pecah**

Run: `pnpm lint && pnpm build`
Expected: build sukses. `@react-pdf/renderer` hanya diimpor dari kode server — kalau build mengeluh soal bundling di klien, pastikan tidak ada komponen `"use client"` yang mengimpor berkas ini.

- [ ] **Step 8: Commit**

```bash
git add src/lib/surat/kop.ts src/lib/surat/pdf package.json pnpm-lock.yaml
git commit -m "feat(surat): render PDF surat dengan kop dan QR verifikasi"
```

---

### Task 8: Data access template surat

**Files:**
- Create: `src/lib/admin/letter-templates.ts`

**Interfaces:**
- Consumes: `letterTemplates`, `LetterTemplateField` dari `@/db/schema`.
- Produces:
  - `listTemplates(): Promise<TemplateRow[]>`
  - `listActiveTemplates(): Promise<TemplateRow[]>`
  - `getTemplateById(id: number): Promise<TemplateRow | null>`
  - `createTemplate(input: TemplateInput): Promise<number>`
  - `updateTemplate(id: number, input: TemplateInput): Promise<void>`
  - `deactivateTemplate(id: number): Promise<void>`
  - `type TemplateInput = { code: string; name: string; numberPattern: string; bodyDefault: string; fields: LetterTemplateField[]; isActive: boolean }`

- [ ] **Step 1: Implementasi**

Ikuti gaya `src/lib/admin/documents.ts` (select eksplisit, `desc`, tanpa kelas).

```ts
// src/lib/admin/letter-templates.ts
import { db } from "@/db";
import { letterTemplates, type LetterTemplateField } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export type TemplateInput = {
  code: string;
  name: string;
  numberPattern: string;
  bodyDefault: string;
  fields: LetterTemplateField[];
  isActive: boolean;
};

const columns = {
  id: letterTemplates.id,
  code: letterTemplates.code,
  name: letterTemplates.name,
  numberPattern: letterTemplates.numberPattern,
  bodyDefault: letterTemplates.bodyDefault,
  fields: letterTemplates.fields,
  isActive: letterTemplates.isActive,
  updatedAt: letterTemplates.updatedAt,
};

export type TemplateRow = {
  id: number;
  code: string;
  name: string;
  numberPattern: string;
  bodyDefault: string;
  fields: LetterTemplateField[];
  isActive: boolean;
  updatedAt: Date | null;
};

export async function listTemplates(): Promise<TemplateRow[]> {
  return db.select(columns).from(letterTemplates).orderBy(asc(letterTemplates.name));
}

export async function listActiveTemplates(): Promise<TemplateRow[]> {
  return db
    .select(columns)
    .from(letterTemplates)
    .where(eq(letterTemplates.isActive, true))
    .orderBy(asc(letterTemplates.name));
}

export async function getTemplateById(id: number): Promise<TemplateRow | null> {
  const [row] = await db.select(columns).from(letterTemplates).where(eq(letterTemplates.id, id)).limit(1);
  return row ?? null;
}

export async function createTemplate(input: TemplateInput): Promise<number> {
  const [row] = await db
    .insert(letterTemplates)
    .values(input)
    .returning({ id: letterTemplates.id });
  return row.id;
}

export async function updateTemplate(id: number, input: TemplateInput): Promise<void> {
  await db
    .update(letterTemplates)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(letterTemplates.id, id));
}

/**
 * Template tidak pernah dihapus — surat terbit yang merujuknya harus tetap
 * bisa dijelaskan jenisnya. Menonaktifkan cukup untuk menyembunyikannya dari
 * layar pembuatan surat.
 */
export async function deactivateTemplate(id: number): Promise<void> {
  await db
    .update(letterTemplates)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(letterTemplates.id, id));
}
```

- [ ] **Step 2: Verifikasi tipe**

Run: `npx tsc --noEmit`
Expected: tanpa error.

- [ ] **Step 3: Commit**

```bash
git add src/lib/admin/letter-templates.ts
git commit -m "feat(surat): data access template surat"
```

---

### Task 9: Layar CRUD jenis surat

**Files:**
- Create: `src/app/admin/(protected)/surat/template/page.tsx`
- Create: `src/app/admin/(protected)/surat/template/actions.ts`
- Create: `src/app/admin/(protected)/surat/template/template-form.tsx`
- Create: `src/app/admin/(protected)/surat/template/baru/page.tsx`
- Create: `src/app/admin/(protected)/surat/template/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: Task 8 (`listTemplates`, `getTemplateById`, `createTemplate`, `updateTemplate`, `deactivateTemplate`), `renderNumberPattern` (Task 2), `sanitizeSuratHtml` (Task 5).
- Produces: `createTemplateAction`, `updateTemplateAction`, `deactivateTemplateAction`, dan `type TemplateFormState = { error?: string }`.

- [ ] **Step 1: Tulis server actions**

```ts
// src/app/admin/(protected)/surat/template/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { sanitizeSuratHtml } from "@/lib/sanitize";
import {
  createTemplate,
  updateTemplate,
  deactivateTemplate,
  type TemplateInput,
} from "@/lib/admin/letter-templates";

const fieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/, "Key field harus huruf kecil tanpa spasi"),
  label: z.string().min(1),
  type: z.enum(["text", "textarea", "date", "number"]),
  required: z.boolean(),
});

const schema = z.object({
  code: z.string().min(1, "Kode wajib diisi").max(10),
  name: z.string().min(1, "Nama jenis surat wajib diisi"),
  numberPattern: z.string().min(1, "Pola nomor wajib diisi"),
  bodyDefault: z.string().default(""),
  fields: z.array(fieldSchema).max(20),
  isActive: z.boolean(),
});

export type TemplateFormState = { error?: string };

function parse(formData: FormData): TemplateInput {
  let fields: unknown = [];
  try {
    fields = JSON.parse(String(formData.get("fields") || "[]"));
  } catch {
    throw new z.ZodError([
      { code: "custom", path: ["fields"], message: "Daftar field tidak valid." },
    ]);
  }
  const data = schema.parse({
    code: formData.get("code"),
    name: formData.get("name"),
    numberPattern: formData.get("numberPattern"),
    bodyDefault: formData.get("bodyDefault") ?? "",
    fields,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });
  return { ...data, bodyDefault: sanitizeSuratHtml(data.bodyDefault) };
}

export async function createTemplateAction(
  _prev: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  await requirePermission("letterTemplates.manage");
  let input: TemplateInput;
  try {
    input = parse(formData);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid." };
  }
  await createTemplate(input);
  revalidatePath("/admin/surat/template");
  redirect("/admin/surat/template?saved=created");
}

export async function updateTemplateAction(
  id: number,
  _prev: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  await requirePermission("letterTemplates.manage");
  let input: TemplateInput;
  try {
    input = parse(formData);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid." };
  }
  await updateTemplate(id, input);
  revalidatePath("/admin/surat/template");
  redirect("/admin/surat/template?saved=updated");
}

export async function deactivateTemplateAction(id: number): Promise<void> {
  await requirePermission("letterTemplates.manage");
  await deactivateTemplate(id);
  revalidatePath("/admin/surat/template");
}
```

- [ ] **Step 2: Tulis form template**

Form klien dengan builder field sederhana dan pratinjau nomor langsung.

```tsx
// src/app/admin/(protected)/surat/template/template-form.tsx
"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Save, Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Editor } from "@blawness/admin-kit/components";
import { renderNumberPattern } from "@/lib/surat/nomor";
import type { LetterTemplateField } from "@/db/schema";
import type { TemplateFormState } from "./actions";

const labelClass = "text-sm font-medium text-navy-800";

export type TemplateFormValues = {
  code: string;
  name: string;
  numberPattern: string;
  bodyDefault: string;
  fields: LetterTemplateField[];
  isActive: boolean;
};

export function TemplateForm({
  action,
  initial,
}: {
  action: (prev: TemplateFormState, fd: FormData) => Promise<TemplateFormState>;
  initial: TemplateFormValues;
}) {
  const [state, formAction, pending] = useActionState<TemplateFormState, FormData>(action, {});
  const [pattern, setPattern] = useState(initial.numberPattern);
  const [code, setCode] = useState(initial.code);
  const [body, setBody] = useState(initial.bodyDefault);
  const [fields, setFields] = useState<LetterTemplateField[]>(initial.fields);

  const contoh = useMemo(
    () => renderNumberPattern(pattern, { seq: 1, date: new Date(), code }),
    [pattern, code]
  );

  function updateField(i: number, patch: Partial<LetterTemplateField>) {
    setFields((prev) => prev.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <input type="hidden" name="bodyDefault" value={body} />
      <input type="hidden" name="fields" value={JSON.stringify(fields)} />

      <div className="space-y-5 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="name">Nama Jenis Surat</label>
            <Input id="name" name="name" defaultValue={initial.name} required placeholder="Surat Keputusan" />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="code">Kode</label>
            <Input id="code" name="code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="SK" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="numberPattern">Pola Nomor</label>
          <Input
            id="numberPattern"
            name="numberPattern"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            required
            placeholder="{seq}/{kode}/LIPAN-RI/{bulanRomawi}/{tahun}"
          />
          <p className="text-xs text-muted-foreground">
            Token: <code>{"{seq} {kode} {bulan} {bulanRomawi} {tahun}"}</code> — contoh hasil:{" "}
            <span className="font-medium text-navy-900">{contoh}</span>
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={initial.isActive} />
          Aktif (muncul saat membuat surat baru)
        </label>
      </div>

      <div className="space-y-4 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm font-semibold text-navy-900">Field Tambahan</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setFields((prev) => [...prev, { key: "", label: "", type: "text", required: false }])
            }
          >
            <Plus className="h-4 w-4" /> Tambah Field
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada field tambahan.</p>
        ) : (
          fields.map((f, i) => (
            <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto_auto_auto]">
              <Input placeholder="key (mis. dasar_hukum)" value={f.key} onChange={(e) => updateField(i, { key: e.target.value })} />
              <Input placeholder="Label" value={f.label} onChange={(e) => updateField(i, { label: e.target.value })} />
              <select
                className="h-9 rounded-md border border-navy-200 bg-white px-2 text-sm"
                value={f.type}
                onChange={(e) => updateField(i, { type: e.target.value as LetterTemplateField["type"] })}
              >
                <option value="text">Teks</option>
                <option value="textarea">Teks Panjang</option>
                <option value="date">Tanggal</option>
                <option value="number">Angka</option>
              </select>
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={f.required} onChange={(e) => updateField(i, { required: e.target.checked })} />
                Wajib
              </label>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFields((prev) => prev.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <label className={labelClass}>Badan Surat Default</label>
        <Editor value={body} onChange={setBody} />
      </div>

      {state.error ? (
        <p className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {state.error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan
        </Button>
        <Button variant="outline" render={<Link href="/admin/surat/template">Batal</Link>} />
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Tulis halaman daftar, baru, dan edit**

```tsx
// src/app/admin/(protected)/surat/template/page.tsx
import Link from "next/link";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { ToastOnParam } from "@blawness/admin-kit/components";
import { Button } from "@/components/ui/button";
import { listTemplates } from "@/lib/admin/letter-templates";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TemplateListPage() {
  await requirePermission("letterTemplates.manage");
  const rows = await listTemplates();

  return (
    <div className="space-y-6">
      <ToastOnParam />
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold text-navy-900">Jenis Surat</h1>
        <Button render={<Link href="/admin/surat/template/baru"><Plus className="h-4 w-4" /> Jenis Baru</Link>} />
      </div>

      <div className="overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-navy-50/60 text-left text-xs uppercase text-navy-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Pola Nomor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Belum ada jenis surat.</td></tr>
            ) : (
              rows.map((t) => (
                <tr key={t.id} className="border-t border-navy-100">
                  <td className="px-4 py-3 font-medium text-navy-900">{t.name}</td>
                  <td className="px-4 py-3">{t.code}</td>
                  <td className="px-4 py-3 font-mono text-xs">{t.numberPattern}</td>
                  <td className="px-4 py-3">{t.isActive ? "Aktif" : "Nonaktif"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" render={<Link href={`/admin/surat/template/${t.id}/edit`}><Pencil className="h-4 w-4" /></Link>} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

```tsx
// src/app/admin/(protected)/surat/template/baru/page.tsx
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { TemplateForm } from "../template-form";
import { createTemplateAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function TemplateBaruPage() {
  await requirePermission("letterTemplates.manage");
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-navy-900">Jenis Surat Baru</h1>
      <TemplateForm
        action={createTemplateAction}
        initial={{
          code: "",
          name: "",
          numberPattern: "{seq}/{kode}/LIPAN-RI/{bulanRomawi}/{tahun}",
          bodyDefault: "",
          fields: [],
          isActive: true,
        }}
      />
    </div>
  );
}
```

```tsx
// src/app/admin/(protected)/surat/template/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { getTemplateById } from "@/lib/admin/letter-templates";
import { TemplateForm } from "../../template-form";
import { updateTemplateAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function TemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("letterTemplates.manage");
  const { id } = await params;
  const template = await getTemplateById(Number(id));
  if (!template) notFound();

  const action = updateTemplateAction.bind(null, template.id);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-navy-900">Ubah {template.name}</h1>
      <TemplateForm action={action} initial={template} />
    </div>
  );
}
```

- [ ] **Step 4: Verifikasi**

Run: `pnpm lint && npx tsc --noEmit`
Expected: tanpa error.

- [ ] **Step 5: Uji manual**

Run: `pnpm dev`, buka `/admin/surat/template/baru`, buat jenis "Surat Tugas" kode `ST` dengan satu field `tujuan`.
Expected: tersimpan, muncul di daftar, dan pratinjau nomor berubah saat pola diketik.

- [ ] **Step 6: Commit**

```bash
git add "src/app/admin/(protected)/surat/template"
git commit -m "feat(surat): CRUD jenis surat"
```

---

### Task 10: Data access surat

**Files:**
- Create: `src/lib/admin/letters.ts`

**Interfaces:**
- Consumes: `letters`, `letterLogs`, `letterTemplates`, `signatories`, `documents` dari `@/db/schema`.
- Produces:
  - `listLettersAdmin(params): Promise<{ rows: LetterListRow[]; total: number }>`
  - `getLetterDetail(id: number): Promise<LetterDetail | null>`
  - `createLetter(input: LetterInput, createdBy: number): Promise<number>`
  - `updateLetter(id: number, input: LetterInput): Promise<void>`
  - `deleteLetter(id: number): Promise<void>`
  - `submitLetter(id: number): Promise<void>`
  - `rejectLetter(id: number, note: string): Promise<void>`
  - `getLetterLogs(letterId: number)`
  - `createLetterLog(letterId, actorId, action, note?)`
  - `nextSeq(templateId: number, year: number): Promise<number>`
  - `type LetterInput = { templateId: number; subject: string; bodyHtml: string; fieldValues: Record<string,string>; signatoryId: number }`

- [ ] **Step 1: Implementasi**

```ts
// src/lib/admin/letters.ts
import { db } from "@/db";
import { letters, letterLogs, letterTemplates, signatories, documents } from "@/db/schema";
import { and, count, desc, eq, ilike, max, or } from "drizzle-orm";

export type LetterInput = {
  templateId: number;
  subject: string;
  bodyHtml: string;
  fieldValues: Record<string, string>;
  signatoryId: number;
};

export type LetterStatusFilter = "all" | "draft" | "submitted" | "issued";

export async function listLettersAdmin({
  q,
  status = "all",
  page = 1,
  pageSize = 15,
}: {
  q?: string;
  status?: LetterStatusFilter;
  page?: number;
  pageSize?: number;
} = {}) {
  const conditions = [];
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    conditions.push(or(ilike(letters.subject, term), ilike(letters.number, term)));
  }
  if (status !== "all") conditions.push(eq(letters.status, status));
  const where = conditions.length ? and(...conditions) : undefined;

  const safePage = Math.max(1, page);
  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: letters.id,
        subject: letters.subject,
        number: letters.number,
        status: letters.status,
        updatedAt: letters.updatedAt,
        templateName: letterTemplates.name,
        signatoryName: signatories.name,
        documentStatus: documents.status,
        documentSlug: documents.slug,
      })
      .from(letters)
      .innerJoin(letterTemplates, eq(letters.templateId, letterTemplates.id))
      .innerJoin(signatories, eq(letters.signatoryId, signatories.id))
      .leftJoin(documents, eq(letters.documentId, documents.id))
      .where(where)
      .orderBy(desc(letters.updatedAt))
      .limit(pageSize)
      .offset((safePage - 1) * pageSize),
    db.select({ value: count() }).from(letters).where(where),
  ]);

  return { rows, total: Number(countResult[0]?.value ?? 0) };
}

export async function getLetterDetail(id: number) {
  const [row] = await db
    .select({
      id: letters.id,
      templateId: letters.templateId,
      subject: letters.subject,
      bodyHtml: letters.bodyHtml,
      fieldValues: letters.fieldValues,
      signatoryId: letters.signatoryId,
      status: letters.status,
      number: letters.number,
      numberSeq: letters.numberSeq,
      numberYear: letters.numberYear,
      documentId: letters.documentId,
      rejectionNote: letters.rejectionNote,
      createdBy: letters.createdBy,
      createdAt: letters.createdAt,
      updatedAt: letters.updatedAt,
      templateName: letterTemplates.name,
      templateCode: letterTemplates.code,
      templateFields: letterTemplates.fields,
      numberPattern: letterTemplates.numberPattern,
      signatoryName: signatories.name,
      signatoryTitle: signatories.title,
      signatoryPosition: signatories.position,
      signatoryUserId: signatories.userId,
      documentSlug: documents.slug,
      documentStatus: documents.status,
      documentFileUrl: documents.fileUrl,
      documentIssuedAt: documents.issuedAt,
    })
    .from(letters)
    .innerJoin(letterTemplates, eq(letters.templateId, letterTemplates.id))
    .innerJoin(signatories, eq(letters.signatoryId, signatories.id))
    .leftJoin(documents, eq(letters.documentId, documents.id))
    .where(eq(letters.id, id))
    .limit(1);
  return row ?? null;
}

export type LetterDetail = NonNullable<Awaited<ReturnType<typeof getLetterDetail>>>;
export type LetterListRow = Awaited<ReturnType<typeof listLettersAdmin>>["rows"][number];

export async function createLetter(input: LetterInput, createdBy: number): Promise<number> {
  const [row] = await db
    .insert(letters)
    .values({ ...input, createdBy })
    .returning({ id: letters.id });
  return row.id;
}

export async function updateLetter(id: number, input: LetterInput): Promise<void> {
  await db.update(letters).set({ ...input, updatedAt: new Date() }).where(eq(letters.id, id));
}

export async function deleteLetter(id: number): Promise<void> {
  await db.delete(letters).where(eq(letters.id, id));
}

export async function submitLetter(id: number): Promise<void> {
  await db
    .update(letters)
    .set({ status: "submitted", rejectionNote: null, updatedAt: new Date() })
    .where(eq(letters.id, id));
}

export async function rejectLetter(id: number, note: string): Promise<void> {
  await db
    .update(letters)
    .set({ status: "draft", rejectionNote: note, updatedAt: new Date() })
    .where(eq(letters.id, id));
}

export async function getLetterLogs(letterId: number) {
  return db
    .select()
    .from(letterLogs)
    .where(eq(letterLogs.letterId, letterId))
    .orderBy(desc(letterLogs.createdAt));
}

export async function createLetterLog(
  letterId: number,
  actorId: number,
  action: "created" | "updated" | "submitted" | "rejected" | "issued",
  note?: string
): Promise<void> {
  await db.insert(letterLogs).values({ letterId, actorId, action, note: note ?? null });
}

/** Urutan berikutnya untuk (template, tahun). Reset otomatis tiap ganti tahun. */
export async function nextSeq(templateId: number, year: number): Promise<number> {
  const [row] = await db
    .select({ value: max(letters.numberSeq) })
    .from(letters)
    .where(and(eq(letters.templateId, templateId), eq(letters.numberYear, year)));
  return (row?.value ?? 0) + 1;
}
```

- [ ] **Step 2: Verifikasi tipe**

Run: `npx tsc --noEmit`
Expected: tanpa error.

- [ ] **Step 3: Commit**

```bash
git add src/lib/admin/letters.ts
git commit -m "feat(surat): data access surat dan log"
```

---

### Task 11: Jabatan dan akun pengesah pada penandatangan

**Files:**
- Modify: `src/app/admin/(protected)/penandatangan/actions.ts`
- Modify: `src/app/admin/(protected)/penandatangan/page.tsx`

**Interfaces:**
- Consumes: kolom `signatories.position` dan `signatories.userId` (Task 1), tabel `users` dari `@/db/schema`.
- Produces: `updateSignatoryAction(formData: FormData)` selain `createSignatoryAction` yang sudah ada. Nilai `position` dipakai blok TTD PDF (Task 7) dan `userId` dipakai `canIssue` (Task 3).

Halaman penandatangan saat ini hanya punya form tambah inline dan tombol hapus — tidak ada layar edit. Penandatangan yang sudah ada harus bisa ditautkan ke akun tanpa dihapus dulu, jadi task ini menambahkan action update dan satu baris form edit per penandatangan.

- [ ] **Step 1: Tambah `position` dan `userId` pada action yang ada**

Di `src/app/admin/(protected)/penandatangan/actions.ts`, ubah `createSignatoryAction` menjadi:

```ts
export async function createSignatoryAction(formData: FormData) {
  await requireUser();

  const raw = Object.fromEntries(formData);
  const data = z
    .object({
      name: z.string().min(1, "Nama wajib diisi"),
      title: z.string().optional(),
      position: z.string().optional(),
      userId: z.string().optional(),
    })
    .parse(raw);

  await db.insert(signatories).values({
    name: data.name.trim(),
    title: data.title?.trim() || null,
    position: data.position?.trim() || null,
    userId: data.userId ? Number(data.userId) : null,
  });

  revalidatePath("/admin/penandatangan");
}
```

- [ ] **Step 2: Tambah action update**

Tambahkan di berkas yang sama:

```ts
export async function updateSignatoryAction(formData: FormData) {
  await requireUser();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;

  const data = z
    .object({
      position: z.string().optional(),
      userId: z.string().optional(),
    })
    .parse(Object.fromEntries(formData));

  await db
    .update(signatories)
    .set({
      position: data.position?.trim() || null,
      userId: data.userId ? Number(data.userId) : null,
    })
    .where(eq(signatories.id, id));

  revalidatePath("/admin/penandatangan");
}
```

- [ ] **Step 3: Muat daftar akun di halaman**

Di `src/app/admin/(protected)/penandatangan/page.tsx`, tambahkan impor dan pemuatan data:

```ts
import { db } from "@/db";
import { users } from "@/db/schema";
import { asc } from "drizzle-orm";
import { updateSignatoryAction } from "./actions";
```

dan di dalam komponen, ganti pemuatan tunggal menjadi:

```ts
  const [sigs, userOptions] = await Promise.all([
    getSignatories(),
    db.select({ id: users.id, name: users.name, email: users.email }).from(users).orderBy(asc(users.email)),
  ]);
```

Lebarkan pembungkus halaman dari `max-w-lg` menjadi `max-w-3xl` supaya kolom tambahan muat.

- [ ] **Step 4: Tambah dua field ke form tambah**

Di dalam `<form action={createSignatoryAction}>`, sisipkan sebelum tombol Tambah:

```tsx
        <div className="w-40 space-y-1.5">
          <label htmlFor="position" className="text-sm font-medium text-navy-800">
            Jabatan
          </label>
          <Input id="position" name="position" placeholder="Ketua Umum" />
        </div>
        <div className="w-48 space-y-1.5">
          <label htmlFor="userId" className="text-sm font-medium text-navy-800">
            Akun Pengesah
          </label>
          <select
            id="userId"
            name="userId"
            defaultValue=""
            className="h-9 w-full rounded-md border border-navy-200 bg-white px-2 text-sm"
          >
            <option value="">— belum ditautkan —</option>
            {userOptions.map((u) => (
              <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
            ))}
          </select>
        </div>
```

- [ ] **Step 5: Tambah form edit inline per baris**

Di dalam `<li>` tiap penandatangan, tambahkan sebelum tombol hapus:

```tsx
            <form action={updateSignatoryAction} className="flex items-center gap-2">
              <input type="hidden" name="id" value={s.id} />
              <Input
                name="position"
                defaultValue={s.position ?? ""}
                placeholder="Jabatan"
                className="h-8 w-40"
              />
              <select
                name="userId"
                defaultValue={s.userId ?? ""}
                className="h-8 w-44 rounded-md border border-navy-200 bg-white px-2 text-sm"
              >
                <option value="">— belum ditautkan —</option>
                {userOptions.map((u) => (
                  <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
                ))}
              </select>
              <Button type="submit" size="sm" variant="outline">Simpan</Button>
            </form>
```

- [ ] **Step 6: Verifikasi**

Run: `pnpm lint && npx tsc --noEmit`
Expected: tanpa error.

- [ ] **Step 7: Uji manual**

Run: `pnpm dev`, buka `/admin/penandatangan`, isi jabatan satu penandatangan dan tautkan ke akun admin yang sedang login.
Expected: setelah simpan, halaman memuat ulang dengan jabatan dan akun tetap terpilih.

- [ ] **Step 8: Commit**

```bash
git add "src/app/admin/(protected)/penandatangan"
git commit -m "feat(surat): jabatan dan akun pengesah pada penandatangan"
```

---

### Task 12: Form surat — buat dan sunting draft

**Files:**
- Create: `src/app/admin/(protected)/surat/surat-form.tsx`
- Create: `src/app/admin/(protected)/surat/actions.ts`
- Create: `src/app/admin/(protected)/surat/baru/page.tsx`
- Create: `src/app/admin/(protected)/surat/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: Task 10 (`createLetter`, `updateLetter`, `submitLetter`, `createLetterLog`, `getLetterDetail`), Task 8 (`listActiveTemplates`, `getTemplateById`), Task 5 (`sanitizeSuratHtml`), Task 3 (`canEdit`, `canSubmit`).
- Produces: `createLetterAction`, `updateLetterAction`, `submitLetterAction`, `deleteLetterAction`, `type LetterFormState = { error?: string }`. Task 14 menambah action pengesahan ke berkas yang sama.

- [ ] **Step 1: Tulis server actions**

```ts
// src/app/admin/(protected)/surat/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { requireUserId } from "@blawness/admin-kit/auth-helpers";
import { sanitizeSuratHtml } from "@/lib/sanitize";
import { canEdit, canSubmit } from "@/lib/surat/status";
import {
  createLetter,
  updateLetter,
  deleteLetter,
  submitLetter,
  createLetterLog,
  getLetterDetail,
  type LetterInput,
} from "@/lib/admin/letters";

const schema = z.object({
  templateId: z.coerce.number().int().positive(),
  subject: z.string().min(1, "Perihal wajib diisi"),
  bodyHtml: z.string().default(""),
  signatoryId: z.coerce.number().int().positive("Penandatangan wajib dipilih"),
  fieldValues: z.record(z.string(), z.string()).default({}),
});

export type LetterFormState = { error?: string };

function parse(formData: FormData): LetterInput {
  let fieldValues: unknown = {};
  try {
    fieldValues = JSON.parse(String(formData.get("fieldValues") || "{}"));
  } catch {
    throw new z.ZodError([
      { code: "custom", path: ["fieldValues"], message: "Isian tambahan tidak valid." },
    ]);
  }
  const data = schema.parse({
    templateId: formData.get("templateId"),
    subject: formData.get("subject"),
    bodyHtml: formData.get("bodyHtml") ?? "",
    signatoryId: formData.get("signatoryId"),
    fieldValues,
  });
  return { ...data, bodyHtml: sanitizeSuratHtml(data.bodyHtml) };
}

export async function createLetterAction(
  _prev: LetterFormState,
  formData: FormData
): Promise<LetterFormState> {
  await requirePermission("letters.write");
  let input: LetterInput;
  try {
    input = parse(formData);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid." };
  }
  const actorId = await requireUserId();
  const id = await createLetter(input, actorId);
  await createLetterLog(id, actorId, "created");

  if (formData.get("intent") === "submit") {
    await requirePermission("letters.submit");
    await submitLetter(id);
    await createLetterLog(id, actorId, "submitted");
  }
  revalidatePath("/admin/surat");
  redirect(`/admin/surat/${id}?saved=created`);
}

export async function updateLetterAction(
  id: number,
  _prev: LetterFormState,
  formData: FormData
): Promise<LetterFormState> {
  await requirePermission("letters.write");
  const current = await getLetterDetail(id);
  if (!current) return { error: "Surat tidak ditemukan." };
  if (!canEdit(current.status)) return { error: "Surat ini tidak bisa disunting lagi." };

  let input: LetterInput;
  try {
    input = parse(formData);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid." };
  }
  const actorId = await requireUserId();
  await updateLetter(id, input);
  await createLetterLog(id, actorId, "updated");

  if (formData.get("intent") === "submit") {
    await requirePermission("letters.submit");
    if (!canSubmit(current.status)) return { error: "Surat ini sudah diajukan." };
    await submitLetter(id);
    await createLetterLog(id, actorId, "submitted");
  }
  revalidatePath("/admin/surat");
  redirect(`/admin/surat/${id}?saved=updated`);
}

export async function submitLetterAction(id: number): Promise<void> {
  await requirePermission("letters.submit");
  const current = await getLetterDetail(id);
  if (!current || !canSubmit(current.status)) return;
  const actorId = await requireUserId();
  await submitLetter(id);
  await createLetterLog(id, actorId, "submitted");
  revalidatePath("/admin/surat");
  revalidatePath(`/admin/surat/${id}`);
}

export async function deleteLetterAction(id: number): Promise<void> {
  await requirePermission("letters.write");
  const current = await getLetterDetail(id);
  // Surat terbit tidak boleh hilang: jejaknya harus tetap bisa dijelaskan.
  if (!current || current.status === "issued") return;
  await deleteLetter(id);
  revalidatePath("/admin/surat");
  redirect("/admin/surat?saved=deleted");
}
```

- [ ] **Step 2: Tulis form surat**

```tsx
// src/app/admin/(protected)/surat/surat-form.tsx
"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Save, Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Editor } from "@blawness/admin-kit/components";
import type { LetterTemplateField } from "@/db/schema";
import type { LetterFormState } from "./actions";

const labelClass = "text-sm font-medium text-navy-800";

export type SuratTemplateOption = {
  id: number;
  name: string;
  bodyDefault: string;
  fields: LetterTemplateField[];
};

export type SuratFormValues = {
  templateId: number | null;
  subject: string;
  bodyHtml: string;
  fieldValues: Record<string, string>;
  signatoryId: number | null;
};

export function SuratForm({
  action,
  initial,
  templates,
  signatories,
  canSubmit,
  lockTemplate = false,
}: {
  action: (prev: LetterFormState, fd: FormData) => Promise<LetterFormState>;
  initial: SuratFormValues;
  templates: SuratTemplateOption[];
  signatories: { id: number; name: string; title: string | null; position: string | null }[];
  canSubmit: boolean;
  lockTemplate?: boolean;
}) {
  const [state, formAction, pending] = useActionState<LetterFormState, FormData>(action, {});
  const [templateId, setTemplateId] = useState<number | null>(initial.templateId);
  const [body, setBody] = useState(initial.bodyHtml);
  const [values, setValues] = useState<Record<string, string>>(initial.fieldValues);

  const template = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId]
  );

  function pilihTemplate(id: number) {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    // Badan hanya diisi ulang kalau masih kosong, supaya tulisan tidak hilang.
    if (t && body.trim() === "") setBody(t.bodyDefault);
  }

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <input type="hidden" name="bodyHtml" value={body} />
      <input type="hidden" name="fieldValues" value={JSON.stringify(values)} />
      <input type="hidden" name="templateId" value={templateId ?? ""} />

      <div className="space-y-5 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="template">Jenis Surat</label>
          <select
            id="template"
            disabled={lockTemplate}
            value={templateId ?? ""}
            onChange={(e) => pilihTemplate(Number(e.target.value))}
            className="h-9 w-full rounded-md border border-navy-200 bg-white px-2 text-sm disabled:bg-navy-50"
            required
          >
            <option value="" disabled>— pilih jenis surat —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="subject">Perihal</label>
          <Input id="subject" name="subject" defaultValue={initial.subject} required placeholder="Pengangkatan Pengurus Periode 2026" />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="signatoryId">Penandatangan</label>
          <select
            id="signatoryId"
            name="signatoryId"
            defaultValue={initial.signatoryId ?? ""}
            className="h-9 w-full rounded-md border border-navy-200 bg-white px-2 text-sm"
            required
          >
            <option value="" disabled>— pilih penandatangan —</option>
            {signatories.map((sg) => (
              <option key={sg.id} value={sg.id}>
                {sg.name}{sg.position ? ` — ${sg.position}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {template && template.fields.length > 0 ? (
        <div className="space-y-5 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-sm font-semibold text-navy-900">Isian {template.name}</h2>
          {template.fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className={labelClass} htmlFor={`f-${f.key}`}>
                {f.label}{f.required ? " *" : ""}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  id={`f-${f.key}`}
                  required={f.required}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  className="min-h-24 w-full rounded-md border border-navy-200 px-3 py-2 text-sm"
                />
              ) : (
                <Input
                  id={`f-${f.key}`}
                  type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                  required={f.required}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-2 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <label className={labelClass}>Badan Surat</label>
        <Editor value={body} onChange={setBody} />
      </div>

      {state.error ? (
        <p className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="intent" value="save" variant="outline" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Draft
        </Button>
        {canSubmit ? (
          <Button type="submit" name="intent" value="submit" disabled={pending}>
            <Send className="h-4 w-4" /> Ajukan untuk Pengesahan
          </Button>
        ) : null}
        <Button variant="ghost" render={<Link href="/admin/surat">Batal</Link>} />
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Tulis halaman baru dan edit**

```tsx
// src/app/admin/(protected)/surat/baru/page.tsx
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { listActiveTemplates } from "@/lib/admin/letter-templates";
import { getSignatories } from "@/lib/signatories";
import { SuratForm } from "../surat-form";
import { createLetterAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function SuratBaruPage() {
  await requirePermission("letters.write");
  const [templates, sigs] = await Promise.all([listActiveTemplates(), getSignatories()]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-navy-900">Surat Baru</h1>
      <SuratForm
        action={createLetterAction}
        templates={templates.map((t) => ({ id: t.id, name: t.name, bodyDefault: t.bodyDefault, fields: t.fields }))}
        signatories={sigs}
        canSubmit
        initial={{ templateId: null, subject: "", bodyHtml: "", fieldValues: {}, signatoryId: null }}
      />
    </div>
  );
}
```

```tsx
// src/app/admin/(protected)/surat/[id]/edit/page.tsx
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { getLetterDetail } from "@/lib/admin/letters";
import { listActiveTemplates } from "@/lib/admin/letter-templates";
import { getSignatories } from "@/lib/signatories";
import { canEdit } from "@/lib/surat/status";
import { SuratForm } from "../../surat-form";
import { updateLetterAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function SuratEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("letters.write");
  const { id } = await params;
  const letter = await getLetterDetail(Number(id));
  if (!letter) notFound();
  if (!canEdit(letter.status)) redirect(`/admin/surat/${letter.id}`);

  const [templates, sigs] = await Promise.all([listActiveTemplates(), getSignatories()]);
  const action = updateLetterAction.bind(null, letter.id);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold text-navy-900">Ubah Surat</h1>
      {letter.rejectionNote ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Ditolak penandatangan: {letter.rejectionNote}
        </p>
      ) : null}
      <SuratForm
        action={action}
        templates={templates.map((t) => ({ id: t.id, name: t.name, bodyDefault: t.bodyDefault, fields: t.fields }))}
        signatories={sigs}
        canSubmit
        lockTemplate
        initial={{
          templateId: letter.templateId,
          subject: letter.subject,
          bodyHtml: letter.bodyHtml,
          fieldValues: letter.fieldValues,
          signatoryId: letter.signatoryId,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verifikasi**

Run: `pnpm lint && npx tsc --noEmit`
Expected: tanpa error.

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/(protected)/surat"
git commit -m "feat(surat): form buat dan sunting draft surat"
```

---

### Task 13: Daftar surat

**Files:**
- Create: `src/app/admin/(protected)/surat/page.tsx`
- Create: `src/app/admin/(protected)/surat/status-badge.tsx`

**Interfaces:**
- Consumes: Task 10 (`listLettersAdmin`), Task 3 (`STATUS_LABEL`).
- Produces: `StatusBadge` — dipakai lagi di halaman detail (Task 14).

- [ ] **Step 1: Tulis badge status**

```tsx
// src/app/admin/(protected)/surat/status-badge.tsx
import { STATUS_LABEL, type LetterStatus } from "@/lib/surat/status";

const CLASS: Record<string, string> = {
  draft: "bg-navy-100 text-navy-700",
  submitted: "bg-amber-100 text-amber-800",
  issued: "bg-emerald-100 text-emerald-800",
  revoked: "bg-red-100 text-red-700",
};

/**
 * Status yang ditampilkan berasal dari dua sumber: `letters.status` untuk alur
 * penyusunan, dan `documents.status` untuk pencabutan. Pencabutan sengaja tidak
 * disalin ke `letters` agar tidak ada dua sumber kebenaran.
 */
export function StatusBadge({
  status,
  documentStatus,
}: {
  status: LetterStatus;
  documentStatus?: "active" | "revoked" | null;
}) {
  const revoked = status === "issued" && documentStatus === "revoked";
  const key = revoked ? "revoked" : status;
  const label = revoked ? "Dicabut" : STATUS_LABEL[status];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${CLASS[key]}`}>
      {label}
    </span>
  );
}
```

- [ ] **Step 2: Tulis halaman daftar**

Ikuti pola tab + pencarian + paginasi dari `src/app/admin/(protected)/posts/page.tsx`.

```tsx
// src/app/admin/(protected)/surat/page.tsx
import Link from "next/link";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { ToastOnParam } from "@blawness/admin-kit/components";
import { Button } from "@/components/ui/button";
import { listLettersAdmin, type LetterStatusFilter } from "@/lib/admin/letters";
import { rbac } from "@/rbac";
import type { AdminSessionUser } from "@blawness/admin-kit";
import { StatusBadge } from "./status-badge";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

const TABS: { value: LetterStatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Menunggu Pengesahan" },
  { value: "issued", label: "Terbit" },
];

function parseStatus(v?: string): LetterStatusFilter {
  return v === "draft" || v === "submitted" || v === "issued" ? v : "all";
}

function buildQuery(p: { q?: string; status?: LetterStatusFilter; page?: number }) {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.status && p.status !== "all") sp.set("status", p.status);
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  const qs = sp.toString();
  return qs ? `/admin/surat?${qs}` : "/admin/surat";
}

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

export default async function SuratListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await requirePermission("letters.read");
  const sp = await searchParams;
  const user = session.user as AdminSessionUser;
  const bisaSahkan = rbac.can(user.role, "letters.issue");
  const bisaTulis = rbac.can(user.role, "letters.write");

  // Pengesah lebih sering datang untuk mengesahkan daripada menelusuri arsip.
  const status = sp.status ? parseStatus(sp.status) : bisaSahkan ? "submitted" : "all";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const { rows, total } = await listLettersAdmin({ q: sp.q, status, page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <ToastOnParam />
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold text-navy-900">Surat</h1>
        {bisaTulis ? (
          <Button render={<Link href="/admin/surat/baru"><Plus className="h-4 w-4" /> Surat Baru</Link>} />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={buildQuery({ q: sp.q, status: t.value })}
            className={`rounded-full px-3 py-1 text-sm ${
              status === t.value ? "bg-navy-900 text-white" : "bg-navy-50 text-navy-700"
            }`}
          >
            {t.label}
          </Link>
        ))}
        <form action="/admin/surat" className="ml-auto flex items-center gap-2">
          <input type="hidden" name="status" value={status} />
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-navy-400" />
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Cari perihal atau nomor…"
              className="h-9 rounded-md border border-navy-200 pl-8 pr-3 text-sm"
            />
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-navy-50/60 text-left text-xs uppercase text-navy-500">
            <tr>
              <th className="px-4 py-3">Nomor</th>
              <th className="px-4 py-3">Perihal</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Penandatangan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Diperbarui</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Tidak ada surat.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-navy-100 hover:bg-navy-50/40">
                  <td className="px-4 py-3 font-mono text-xs">{r.number ?? "— draft"}</td>
                  <td className="px-4 py-3 font-medium text-navy-900">
                    <Link href={`/admin/surat/${r.id}`} className="hover:underline">{r.subject}</Link>
                  </td>
                  <td className="px-4 py-3">{r.templateName}</td>
                  <td className="px-4 py-3">{r.signatoryName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} documentStatus={r.documentStatus} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.updatedAt ? dateFmt.format(r.updatedAt) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1}
            render={<Link href={buildQuery({ q: sp.q, status, page: page - 1 })}><ChevronLeft className="h-4 w-4" /></Link>} />
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages}
            render={<Link href={buildQuery({ q: sp.q, status, page: page + 1 })}><ChevronRight className="h-4 w-4" /></Link>} />
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Verifikasi**

Run: `pnpm lint && npx tsc --noEmit`
Expected: tanpa error. Kalau `rbac.can` menolak tipe permission kustom, pastikan string-nya sama persis dengan yang didaftarkan di Task 4.

- [ ] **Step 4: Uji manual**

Run: `pnpm dev`, buka `/admin/surat`, buat satu draft lewat `/admin/surat/baru`.
Expected: draft muncul di tab "Draft" dengan nomor "— draft".

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/(protected)/surat/page.tsx" "src/app/admin/(protected)/surat/status-badge.tsx"
git commit -m "feat(surat): daftar surat dengan filter status"
```

---

### Task 14: Pengesahan, penerbitan PDF, dan halaman detail

**Files:**
- Create: `src/lib/surat/issue.ts`
- Modify: `src/app/admin/(protected)/surat/actions.ts` (tambah tiga action)
- Create: `src/app/admin/(protected)/surat/[id]/page.tsx`
- Create: `src/app/admin/(protected)/surat/[id]/pengesahan-panel.tsx`

**Interfaces:**
- Consumes: Task 2 (`renderNumberPattern`), Task 3 (`canIssue`), Task 7 (`renderSuratPdf`), Task 10 (`getLetterDetail`, `nextSeq`, `createLetterLog`, `rejectLetter`), `createDocumentLog` dari `@/lib/admin/documents`, `uploadFile` dari `@blawness/admin-kit`.
- Produces: `issueLetter(letterId, actor): Promise<IssueResult>` dan action `issueLetterAction`, `rejectLetterAction`, `renderPdfAction`.

- [ ] **Step 1: Tulis orkestrasi penerbitan**

```ts
// src/lib/surat/issue.ts
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { uploadFile } from "@blawness/admin-kit";
import { db } from "@/db";
import { letters, documents } from "@/db/schema";
import { getLetterDetail, nextSeq, createLetterLog } from "@/lib/admin/letters";
import { createDocumentLog } from "@/lib/admin/documents";
import { canIssue } from "@/lib/surat/status";
import { renderNumberPattern } from "@/lib/surat/nomor";
import { renderSuratPdf } from "@/lib/surat/pdf/surat-document";

export type IssueResult =
  | { ok: true; documentSlug: string; number: string; pdfFailed: boolean }
  | { ok: false; error: string };

function slugFor(number: string): string {
  const base = number
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base}-${randomUUID().slice(0, 6)}`;
}

function verifyUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lipan-ri.com";
  return `${base.replace(/\/$/, "")}/verifikasi/${slug}`;
}

/**
 * Satu-satunya jalan menuju status `issued`.
 *
 * Nomor dikunci, baris `documents` dibuat, dan status dipindah dalam satu
 * transaksi. Render PDF sengaja ditaruh setelah commit: memakan ratusan
 * milidetik dan tidak boleh menahan koneksi Neon. Kalau render gagal, surat
 * tetap sah dan terverifikasi — hanya berkasnya yang belum ada.
 */
export async function issueLetter(
  letterId: number,
  actor: { userId: number; role: string },
  numberOverride?: string
): Promise<IssueResult> {
  const letter = await getLetterDetail(letterId);
  if (!letter) return { ok: false, error: "Surat tidak ditemukan." };

  const check = canIssue({
    status: letter.status,
    actorUserId: actor.userId,
    actorRole: actor.role,
    signatoryUserId: letter.signatoryUserId,
  });
  if (!check.ok) return { ok: false, error: check.reason };
  if (letter.documentId) return { ok: false, error: "Surat ini sudah punya dokumen." };

  const issuedAt = new Date();
  const year = issuedAt.getFullYear();

  let slug = "";
  let number = "";
  let documentId = 0;

  // Satu retry: unique constraint (templateId, numberYear, numberSeq) menangkap
  // dua pengesahan bersamaan, dan urutannya sudah bergeser saat percobaan kedua.
  for (let attempt = 0; attempt < 2; attempt++) {
    const seq = await nextSeq(letter.templateId, year);
    number =
      numberOverride?.trim() ||
      renderNumberPattern(letter.numberPattern, {
        seq,
        date: issuedAt,
        code: letter.templateCode,
      });
    slug = slugFor(number);

    try {
      await db.transaction(async (tx) => {
        const [doc] = await tx
          .insert(documents)
          .values({
            slug,
            number,
            title: letter.subject,
            signatory: letter.signatoryName,
            issuedAt,
            status: "active",
            showDocument: false,
          })
          .returning({ id: documents.id });

        const updated = await tx
          .update(letters)
          .set({
            status: "issued",
            number,
            numberSeq: seq,
            numberYear: year,
            documentId: doc.id,
            updatedAt: issuedAt,
          })
          // Penjaga terakhir: kalau status sudah bergeser sejak dibaca, batal.
          .where(and(eq(letters.id, letterId), eq(letters.status, "submitted")))
          .returning({ id: letters.id });

        if (updated.length === 0) {
          throw new Error("STATUS_BERUBAH");
        }
        documentId = doc.id;
      });

      await createLetterLog(
        letterId,
        actor.userId,
        "issued",
        actor.role === "admin" ? "Disahkan oleh admin" : undefined
      );
      await createDocumentLog(
        documentId,
        actor.userId,
        "created",
        `Terbit dari surat #${letterId}`
      );
      break;
    } catch (e) {
      if (e instanceof Error && e.message === "STATUS_BERUBAH") {
        return { ok: false, error: "Surat sudah diproses orang lain." };
      }
      if (attempt === 1) {
        return { ok: false, error: "Nomor surat bentrok. Coba lagi." };
      }
    }
  }

  const pdfFailed = !(await renderAndAttachPdf(letterId));
  return { ok: true, documentSlug: slug, number, pdfFailed };
}

/**
 * Render PDF lalu tempelkan URL-nya ke `documents.fileUrl`.
 * Dipisah supaya tombol "Render Ulang PDF" bisa memakainya kembali.
 */
export async function renderAndAttachPdf(letterId: number): Promise<boolean> {
  const letter = await getLetterDetail(letterId);
  if (!letter || !letter.documentId || !letter.documentSlug || !letter.number) return false;

  try {
    const buffer = await renderSuratPdf({
      number: letter.number,
      subject: letter.subject,
      bodyHtml: letter.bodyHtml,
      signatoryName: [letter.signatoryName, letter.signatoryTitle].filter(Boolean).join(", "),
      signatoryPosition: letter.signatoryPosition,
      issuedAt: letter.documentIssuedAt ?? new Date(),
      verifyUrl: verifyUrl(letter.documentSlug),
    });
    const { url } = await uploadFile(buffer, `surat/${letter.documentSlug}`, {
      contentType: "application/pdf",
      skipProcessing: true,
    });
    await db
      .update(documents)
      .set({ fileUrl: url, updatedAt: new Date() })
      .where(eq(documents.id, letter.documentId));
    return true;
  } catch {
    // Keabsahan surat tidak digantungkan pada ketersediaan R2.
    return false;
  }
}
```

- [ ] **Step 2: Tambah action pengesahan**

Tambahkan di akhir `src/app/admin/(protected)/surat/actions.ts` (impor yang perlu ditambah di atas: `AdminSessionUser`, `issueLetter`, `renderAndAttachPdf`, `rejectLetter`, `createLetterLog`, `canIssue`, `getLetterDetail` sudah ada):

```ts
import type { AdminSessionUser } from "@blawness/admin-kit";
import { issueLetter, renderAndAttachPdf } from "@/lib/surat/issue";
import { rejectLetter } from "@/lib/admin/letters";

export type IssueFormState = { error?: string };

export async function issueLetterAction(
  id: number,
  _prev: IssueFormState,
  formData: FormData
): Promise<IssueFormState> {
  const session = await requirePermission("letters.issue");
  const user = session.user as AdminSessionUser;
  const result = await issueLetter(
    id,
    { userId: Number(user.id), role: user.role },
    String(formData.get("number") ?? "")
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/surat");
  revalidatePath("/admin/dokumen");
  redirect(`/admin/surat/${id}?saved=${result.pdfFailed ? "issued-nopdf" : "issued"}`);
}

export async function rejectLetterAction(
  id: number,
  _prev: IssueFormState,
  formData: FormData
): Promise<IssueFormState> {
  await requirePermission("letters.issue");
  const note = String(formData.get("note") ?? "").trim();
  if (note.length === 0) return { error: "Catatan penolakan wajib diisi." };

  const current = await getLetterDetail(id);
  if (!current || current.status !== "submitted") {
    return { error: "Surat ini tidak sedang menunggu pengesahan." };
  }
  const actorId = await requireUserId();
  await rejectLetter(id, note);
  await createLetterLog(id, actorId, "rejected", note);
  revalidatePath(`/admin/surat/${id}`);
  redirect(`/admin/surat/${id}?saved=rejected`);
}

export async function renderPdfAction(id: number): Promise<void> {
  await requirePermission("letters.issue");
  await renderAndAttachPdf(id);
  revalidatePath(`/admin/surat/${id}`);
}
```

- [ ] **Step 3: Tulis panel pengesahan**

```tsx
// src/app/admin/(protected)/surat/[id]/pengesahan-panel.tsx
"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { IssueFormState } from "../actions";

export function PengesahanPanel({
  issueAction,
  rejectAction,
  calonNomor,
}: {
  issueAction: (prev: IssueFormState, fd: FormData) => Promise<IssueFormState>;
  rejectAction: (prev: IssueFormState, fd: FormData) => Promise<IssueFormState>;
  calonNomor: string;
}) {
  const [issueState, issueForm, issuing] = useActionState<IssueFormState, FormData>(issueAction, {});
  const [rejectState, rejectForm, rejecting] = useActionState<IssueFormState, FormData>(rejectAction, {});
  const [tolak, setTolak] = useState(false);

  return (
    <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/60 p-6">
      <h2 className="font-heading text-sm font-semibold text-amber-900">Menunggu Pengesahan Anda</h2>

      <form action={issueForm} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-navy-800" htmlFor="number">Nomor Surat</label>
          <Input id="number" name="number" defaultValue={calonNomor} />
          <p className="text-xs text-muted-foreground">
            Nomor terisi otomatis dari pola jenis surat. Ubah hanya bila memang perlu.
          </p>
        </div>
        {issueState.error ? (
          <p className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" /> {issueState.error}
          </p>
        ) : null}
        <div className="flex gap-3">
          <Button type="submit" disabled={issuing}>
            {issuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Sahkan &amp; Terbitkan
          </Button>
          <Button type="button" variant="outline" onClick={() => setTolak((v) => !v)}>
            <XCircle className="h-4 w-4" /> Tolak
          </Button>
        </div>
      </form>

      {tolak ? (
        <form action={rejectForm} className="space-y-3 border-t border-amber-200 pt-4">
          <label className="text-sm font-medium text-navy-800" htmlFor="note">Catatan Penolakan</label>
          <textarea
            id="note"
            name="note"
            required
            className="min-h-20 w-full rounded-md border border-navy-200 px-3 py-2 text-sm"
            placeholder="Jelaskan apa yang perlu diperbaiki."
          />
          {rejectState.error ? (
            <p className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" /> {rejectState.error}
            </p>
          ) : null}
          <Button type="submit" variant="destructive" disabled={rejecting}>
            {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Kirim Penolakan
          </Button>
        </form>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Tulis halaman detail**

```tsx
// src/app/admin/(protected)/surat/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@blawness/admin-kit/auth-helpers";
import { ToastOnParam } from "@blawness/admin-kit/components";
import type { AdminSessionUser } from "@blawness/admin-kit";
import { Button } from "@/components/ui/button";
import { getLetterDetail, getLetterLogs, nextSeq } from "@/lib/admin/letters";
import { renderNumberPattern } from "@/lib/surat/nomor";
import { canIssue, canEdit } from "@/lib/surat/status";
import { rbac } from "@/rbac";
import { StatusBadge } from "../status-badge";
import { PengesahanPanel } from "./pengesahan-panel";
import { issueLetterAction, rejectLetterAction, renderPdfAction, submitLetterAction } from "../actions";
import { Pencil, Send, FileDown, RefreshCw, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" });

const LOG_LABEL: Record<string, string> = {
  created: "Dibuat",
  updated: "Disunting",
  submitted: "Diajukan",
  rejected: "Ditolak",
  issued: "Disahkan",
};

export default async function SuratDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission("letters.read");
  const { id } = await params;
  const letter = await getLetterDetail(Number(id));
  if (!letter) notFound();

  const logs = await getLetterLogs(letter.id);
  const user = session.user as AdminSessionUser;
  const issueCheck = canIssue({
    status: letter.status,
    actorUserId: Number(user.id),
    actorRole: user.role,
    signatoryUserId: letter.signatoryUserId,
  });
  const bolehSahkan = issueCheck.ok && rbac.can(user.role, "letters.issue");

  const year = new Date().getFullYear();
  const calonNomor =
    letter.number ??
    renderNumberPattern(letter.numberPattern, {
      seq: await nextSeq(letter.templateId, year),
      date: new Date(),
      code: letter.templateCode,
    });

  const issueAction = issueLetterAction.bind(null, letter.id);
  const rejectAction = rejectLetterAction.bind(null, letter.id);
  const submitAction = submitLetterAction.bind(null, letter.id);
  const renderAction = renderPdfAction.bind(null, letter.id);

  return (
    <div className="space-y-6">
      <ToastOnParam />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold text-navy-900">{letter.subject}</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {letter.number ?? `Calon nomor: ${calonNomor}`}
          </p>
        </div>
        <StatusBadge status={letter.status} documentStatus={letter.documentStatus} />
      </div>

      {letter.rejectionNote && letter.status === "draft" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Ditolak penandatangan: {letter.rejectionNote}
        </p>
      ) : null}

      {letter.status === "issued" && !letter.documentFileUrl ? (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>Surat sudah sah dan bisa diverifikasi, tetapi berkas PDF-nya gagal dibuat.</span>
          <form action={renderAction}>
            <Button type="submit" size="sm" variant="outline">
              <RefreshCw className="h-4 w-4" /> Render Ulang PDF
            </Button>
          </form>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-navy-100 bg-white p-8 shadow-sm">
            <p className="text-center font-heading text-sm font-bold uppercase text-navy-900">
              {letter.subject}
            </p>
            <p className="mt-1 text-center text-sm">Nomor: {letter.number ?? calonNomor}</p>
            <div
              className="prose prose-sm mt-6 max-w-none text-navy-900"
              dangerouslySetInnerHTML={{ __html: letter.bodyHtml }}
            />
            <div className="mt-10 text-right text-sm">
              {letter.signatoryPosition ? <p>{letter.signatoryPosition}</p> : null}
              <p className="mt-14 font-semibold underline">
                {[letter.signatoryName, letter.signatoryTitle].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>

          {letter.templateFields.length > 0 ? (
            <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
              <h2 className="font-heading text-sm font-semibold text-navy-900">Isian {letter.templateName}</h2>
              <dl className="mt-3 space-y-2 text-sm">
                {letter.templateFields.map((f) => (
                  <div key={f.key} className="flex gap-3">
                    <dt className="w-40 shrink-0 text-muted-foreground">{f.label}</dt>
                    <dd className="text-navy-900">{letter.fieldValues[f.key] || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          {bolehSahkan ? (
            <PengesahanPanel
              issueAction={issueAction}
              rejectAction={rejectAction}
              calonNomor={calonNomor}
            />
          ) : null}

          <div className="space-y-3 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-sm font-semibold text-navy-900">Tindakan</h2>
            {canEdit(letter.status) ? (
              <>
                <Button variant="outline" className="w-full"
                  render={<Link href={`/admin/surat/${letter.id}/edit`}><Pencil className="h-4 w-4" /> Sunting</Link>} />
                <form action={submitAction}>
                  <Button type="submit" className="w-full"><Send className="h-4 w-4" /> Ajukan untuk Pengesahan</Button>
                </form>
              </>
            ) : null}
            {letter.documentFileUrl ? (
              <Button variant="outline" className="w-full"
                render={<a href={letter.documentFileUrl} target="_blank" rel="noreferrer"><FileDown className="h-4 w-4" /> Unduh PDF</a>} />
            ) : null}
            {letter.documentSlug ? (
              <Button variant="ghost" className="w-full"
                render={<a href={`/verifikasi/${letter.documentSlug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Halaman Verifikasi</a>} />
            ) : null}
          </div>

          <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-sm font-semibold text-navy-900">Jejak</h2>
            <ol className="mt-3 space-y-3 text-sm">
              {logs.map((l) => (
                <li key={l.id} className="border-l-2 border-navy-100 pl-3">
                  <p className="font-medium text-navy-900">{LOG_LABEL[l.action] ?? l.action}</p>
                  {l.note ? <p className="text-muted-foreground">{l.note}</p> : null}
                  <p className="text-xs text-muted-foreground">
                    {l.createdAt ? dateFmt.format(l.createdAt) : "—"}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verifikasi**

Run: `pnpm lint && npx tsc --noEmit && pnpm build`
Expected: semuanya lulus.

- [ ] **Step 6: Uji manual alur penuh**

Run: `pnpm dev`. Dengan akun admin: buat draft → ajukan → buka detail → Sahkan.
Expected: nomor terisi, surat muncul di `/admin/dokumen`, tombol "Unduh PDF" membuka PDF berisi kop, badan surat, dan QR; memindai QR membuka `/verifikasi/<slug>` yang menyatakan dokumen valid.

- [ ] **Step 7: Commit**

```bash
git add src/lib/surat/issue.ts "src/app/admin/(protected)/surat"
git commit -m "feat(surat): pengesahan, penerbitan PDF, dan halaman detail surat"
```

---

### Task 15: Uji ujung-ke-ujung dan verifikasi akhir

**Files:**
- Create: `e2e/surat.spec.ts`

**Interfaces:**
- Consumes: seluruh alur dari Task 1–14.
- Produces: —

- [ ] **Step 1: Baca pola test yang ada**

Run: `ls e2e && sed -n '1,60p' e2e/*.spec.ts | head -80`
Catat cara login admin dipakai di suite yang ada (helper, storageState, atau langkah manual) dan pakai cara yang sama — jangan bikin mekanisme login baru.

- [ ] **Step 2: Tulis test**

```ts
// e2e/surat.spec.ts
import { test, expect } from "@playwright/test";

// Menyesuaikan dengan cara login yang dipakai suite lain — lihat Step 1.
test.describe("modul surat", () => {
  test("draft dapat dibuat, diajukan, disahkan, dan terverifikasi", async ({ page }) => {
    await page.goto("/admin/surat/template/baru");
    await page.getByLabel("Nama Jenis Surat").fill("Surat Tugas E2E");
    await page.getByLabel("Kode").fill("STE2E");
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(/\/admin\/surat\/template/);

    await page.goto("/admin/surat/baru");
    await page.getByLabel("Jenis Surat").selectOption({ label: "Surat Tugas E2E" });
    await page.getByLabel("Perihal").fill("Penugasan Uji Otomatis");
    await page.getByLabel("Penandatangan").selectOption({ index: 1 });
    await page.getByRole("button", { name: "Ajukan untuk Pengesahan" }).click();

    await expect(page.getByText("Menunggu Pengesahan")).toBeVisible();

    // Admin punya jalan darurat pengesahan, jadi satu sesi cukup untuk alur ini.
    await page.getByRole("button", { name: "Sahkan & Terbitkan" }).click();
    await expect(page.getByText("Terbit")).toBeVisible();

    const verifikasi = page.getByRole("link", { name: "Halaman Verifikasi" });
    const href = await verifikasi.getAttribute("href");
    expect(href).toContain("/verifikasi/");

    await page.goto(href!);
    await expect(page.getByText("Dokumen Valid")).toBeVisible();
  });
});
```

- [ ] **Step 3: Jalankan E2E**

Run: `pnpm e2e e2e/surat.spec.ts`
Expected: PASS. Suite ini memakai production build — kalau gagal karena selector, perbaiki selector agar cocok dengan markup yang benar-benar dirender, jangan melemahkan assert-nya.

- [ ] **Step 4: Verifikasi menyeluruh**

Run: `pnpm lint && pnpm test && pnpm build`
Expected: ketiganya lulus. Laporkan keluarannya apa adanya; kalau ada yang gagal, perbaiki sebelum menyatakan selesai.

- [ ] **Step 5: Commit**

```bash
git add e2e/surat.spec.ts
git commit -m "test(e2e): alur surat dari draft sampai verifikasi"
```
