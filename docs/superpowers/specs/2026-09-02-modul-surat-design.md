# Modul Surat — Desain

Tanggal: 2026-09-02
Status: disetujui untuk masuk tahap rencana implementasi

## Latar

Modul `dokumen` yang ada hari ini adalah **registry**: surat dibuat di luar
sistem, PDF-nya diunggah manual ke kolom `fileUrl`, lalu sistem memberi slug,
QR berlogo, dan halaman verifikasi publik `/verifikasi/[slug]`. "TTD digital"
pada sistem ini berarti QR verifikasi keabsahan, bukan sertifikat kriptografis.

Modul Surat menambah tahap sebelumnya: penyusunan surat (SK, Surat Tugas, dan
jenis lain) di dalam sistem, dengan alur pengesahan berjenjang, penomoran
otomatis, dan render PDF yang langsung terdaftar ke registry tersebut.

## Keputusan yang mengunci desain

| Topik | Keputusan |
|---|---|
| Penyusunan isi | Hibrida: kop, nomor, dan blok TTD otomatis; badan surat memakai isi default per jenis yang masih bisa diedit bebas |
| Alur | `draft → submitted → issued`, pengesahan dilakukan oleh penandatangan yang login |
| Blok TTD | QR + nama/jabatan. **Tanpa** gambar spesimen tanda tangan maupun stempel |
| Penomoran | Otomatis per jenis, reset tahunan, boleh dioverride saat pengesahan |
| Jenis surat | Data-driven, CRUD penuh di admin |
| Render PDF | `@react-pdf/renderer` (bukan headless Chromium) |
| Role penandatangan | Role terpisah `penandatangan` |

Alasan menolak headless Chromium: paketnya besar dan cold start-nya berat,
sementara proyek ini sudah pernah kena biaya Active CPU akibat cold start.
Layout surat resmi kaku dan sederhana, jadi mesin CSS penuh tidak sepadan.

## Model data

Tabel baru di `src/db/schema.ts`; migrasi lewat `pnpm db:generate` +
`pnpm db:migrate` mengikuti baseline drizzle yang berlaku.

### `letter_templates`

Jenis surat, dikelola penuh dari admin.

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | serial PK | |
| `code` | text unique | mis. `SK`, `ST` — dipakai di pola nomor |
| `name` | text | mis. "Surat Keputusan" |
| `numberPattern` | text | mis. `{seq}/SK/LIPAN-RI/{bulanRomawi}/{tahun}` |
| `bodyDefault` | text | HTML tersanitasi, isi badan awal |
| `fields` | jsonb | array `{key,label,type,required}`; `type` ∈ `text \| textarea \| date \| number` |
| `isActive` | boolean default true | template nonaktif tidak muncul saat membuat surat baru |
| `createdAt` / `updatedAt` | timestamp | |

Template yang sudah dipakai surat terbit **tidak boleh dihapus** — hanya
dinonaktifkan. Menghapusnya akan memutus jejak jenis surat yang sudah sah.

### `letters`

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | serial PK | |
| `templateId` | int → `letter_templates.id` | restrict on delete |
| `subject` | text | perihal |
| `bodyHtml` | text | HTML tersanitasi hasil edit |
| `fieldValues` | jsonb | nilai field dinamis, keyed by `fields[].key` |
| `signatoryId` | int → `signatories.id` | penandatangan yang dituju |
| `status` | enum `letter_status` | `draft \| submitted \| issued` |
| `numberSeq` | int nullable | urutan dalam (template, tahun) |
| `numberYear` | int nullable | tahun penerbitan |
| `number` | text nullable | nomor final hasil render pola |
| `documentId` | int nullable → `documents.id` | terisi saat terbit |
| `rejectionNote` | text nullable | catatan penolakan terakhir |
| `createdBy` | int | user pembuat |
| `createdAt` / `updatedAt` | timestamp | |

Constraint: unique `(templateId, numberYear, numberSeq)` — inilah yang mencegah
dua pengesahan bersamaan merebut nomor yang sama.

### `letter_logs`

Jejak audit sebelum surat menjadi dokumen.

| Kolom | Tipe |
|---|---|
| `id` | serial PK |
| `letterId` | int → `letters.id`, cascade |
| `actorId` | int |
| `action` | enum `letter_log_action`: `created \| updated \| submitted \| rejected \| issued` |
| `note` | text nullable |
| `createdAt` | timestamp |

Setelah surat terbit, jejak pencabutan tetap ditulis ke `document_logs` yang
sudah ada — tidak diduplikasi ke sini.

### Perubahan tabel lama

`signatories` mendapat dua kolom nullable: `userId` (int) agar penandatangan
dapat memiliki akun dan mengesahkan surat sendiri, dan `position` (text) untuk
jabatan yang tercetak di blok tanda tangan. Kolom `title` yang sudah ada adalah
**gelar** ("SE, SH, MH"), bukan jabatan — keduanya sengaja dipisah.

Tabel `documents` **tidak diubah**. Modul verifikasi, QR, dan pencabutan yang
sudah berjalan tidak disentuh — hanya dipakai.

## Mesin status

```
draft ──submit──▶ submitted ──issue──▶ issued
  ▲                   │
  └─────reject────────┘
```

Aturan:

- `draft` dapat diedit dan dihapus oleh pemegang `letters.write`.
- `submitted` terkunci dari penyuntingan. Hanya bisa disahkan atau ditolak.
- Penolakan wajib menyertakan catatan dan mengembalikan surat ke `draft`,
  mengisi `rejectionNote`.
- `issued` **immutable**. Koreksi surat terbit dilakukan dengan mencabut
  dokumennya lewat modul dokumen, lalu menerbitkan surat baru.
- Pencabutan tidak mengubah `letters.status`; halaman surat menampilkan status
  pencabutan dengan membaca `documents.status`, sehingga tidak ada dua sumber
  kebenaran.

## Penomoran

Nomor **tidak** dikunci saat draft — layar draft hanya menampilkan "calon
nomor" sebagai pratinjau, dan pratinjau ini tidak dijamin sama dengan nomor
final.

Saat pengesahan:

1. `numberYear` = tahun berjalan; `numberSeq` = `max(numberSeq) + 1` untuk
   pasangan (templateId, numberYear), atau `1` bila belum ada.
2. `number` = hasil render `numberPattern` dengan token:
   `{seq}` (padding 3 digit), `{tahun}`, `{bulanRomawi}`, `{bulan}`, `{kode}`.
3. Pengesah boleh mengganti `number` secara manual di layar pengesahan. Nomor
   override tetap menyimpan `numberSeq`/`numberYear` hasil hitung agar urutan
   berikutnya tidak melompat.
4. Bila insert kena unique constraint (dua pengesahan bersamaan), hitung ulang
   dan coba sekali lagi; kegagalan kedua dilaporkan sebagai error ke pengesah.

## Perizinan

`src/rbac.ts` memakai `defineRbac` dari admin-kit, yang menerima string
permission bebas berbentuk `resource.action`.

Permission baru:

- `letters.read` — lihat daftar dan detail surat
- `letters.write` — membuat dan menyunting draft
- `letters.submit` — mengajukan draft
- `letters.issue` — mengesahkan dan menerbitkan
- `letterTemplates.manage` — CRUD jenis surat

Peran:

- `admin` — sudah `*`, otomatis mencakup semuanya
- `editor` — tambah `letters.read`, `letters.write`, `letters.submit`
  (**tanpa** `letters.issue`)
- `penandatangan` (role baru) — `letters.read`, `letters.issue`, `profile.edit`

Di atas lapisan permission, ada satu pemeriksaan lagi saat pengesahan: surat
hanya dapat disahkan oleh user yang tertaut pada `signatories.userId` surat
tersebut, atau oleh `admin` sebagai jalan darurat. Pengesahan oleh admin
dicatat di log sebagai tindakan admin, bukan disamarkan menjadi tindakan si
penandatangan.

## Layar admin

Mengikuti pola halaman penuh seperti `/admin/posts` — bukan pola modal Zustand
`/admin/dokumen`, karena form surat terlalu panjang (editor + field dinamis).

### `/admin/surat`

Tabel: nomor (atau "— draft"), perihal, jenis, penandatangan, badge status
(Draft / Menunggu Pengesahan / Terbit / Dicabut), tanggal. Filter status. Bagi
pemegang `letters.issue`, tab "Menunggu Pengesahan" menjadi tampilan default.

### `/admin/surat/baru`

Pilih jenis surat lebih dulu, lalu form: field dinamis dari `template.fields`,
editor terisi `bodyDefault`, pilihan penandatangan. Tombol **Simpan
Draft** dan **Ajukan**.

### `/admin/surat/[id]`

Pratinjau surat (HTML yang meniru layout PDF) dan panel jejak audit. Bila
status `submitted` dan pengguna berhak: tombol **Sahkan & Terbitkan** (dengan
field nomor terisi calon nomor, dapat diubah) serta **Tolak** (catatan wajib).
Bila PDF gagal dirender, muncul tombol **Render Ulang PDF**.

### `/admin/surat/[id]/edit`

Hanya aktif saat status `draft`.

### `/admin/surat/template`

CRUD jenis surat: nama, kode, pola nomor dengan contoh hasil render langsung,
builder field sederhana (baris: key, label, tipe, wajib), dan editor badan
default.

## Proses penerbitan

`src/lib/surat/issue.ts`, satu fungsi sebagai satu-satunya jalan menuju status
`issued`.

Dalam satu transaksi DB:

1. Validasi ulang: status masih `submitted`, aktor berhak, `documentId` masih
   kosong.
2. Tentukan `numberSeq`, `numberYear`, dan `number`.
3. Buat `slug` acak; insert baris `documents` (`number`, `title` = perihal,
   `signatory` = nama penandatangan, `issuedAt` = sekarang, `status: active`).
4. Update `letters`: status `issued`, isi kolom nomor dan `documentId`.
5. Tulis `letter_logs: issued` dan `document_logs: created`.

Setelah commit, **di luar transaksi**:

6. Render PDF, lalu `uploadFile(buffer, "surat/<slug>", { contentType:
   "application/pdf", skipProcessing: true })` — di-reexport dari root
   `@blawness/admin-kit`.
7. Update `documents.fileUrl`.

Render dikeluarkan dari transaksi karena memakan ratusan milidetik dan tidak
boleh menahan koneksi Neon selama itu.

Bila langkah 6–7 gagal, surat tetap sah dan terverifikasi, hanya file-nya belum
ada; halaman detail menampilkan "Terbit, PDF gagal dibuat" dan tombol render
ulang. Keabsahan surat sengaja tidak digantungkan pada ketersediaan object
storage.

## Render PDF

`src/lib/surat/pdf/`:

- **`surat-document.tsx`** — komponen `@react-pdf/renderer`: kop surat (logo +
  identitas organisasi, konstanta di `src/lib/surat/kop.ts`), nomor dan
  perihal, badan surat, blok TTD kanan bawah berisi kota + tanggal, jabatan
  (`signatories.position`), QR
  hasil `generateQrPng()` yang sudah ada, nama penandatangan, dan baris
  "Ditandatangani secara elektronik — keaslian dapat diperiksa di
  lipan-ri…/verifikasi/`<slug>`".
- **`html-to-pdf.ts`** — fungsi murni pemeta HTML badan surat ke node
  react-pdf, memakai `htmlparser2` (sudah masuk lewat `sanitize-html`, tetapi
  dideklarasikan eksplisit di `package.json`). Tag yang didukung dibatasi
  eksplisit: `p`, `br`, `strong`, `em`, `u`, `h2`, `h3`, `h4`, `ul`, `ol`,
  `li`, `blockquote`. Tag di luar daftar dirender sebagai teks polos, tidak
  dibuang diam-diam.

Parameter QR tidak diduplikasi: `src/lib/qr.ts` tetap satu-satunya tempat
parameter QR ditentukan.

Badan surat disimpan sebagai HTML, bukan Tiptap JSON, agar komponen `Editor`
milik admin-kit dapat dipakai apa adanya seperti di `/admin/posts`. Sebelum
disimpan, HTML dilewatkan `sanitizeSuratHtml()` — turunan `sanitizeHtml` yang
ada, dengan allowlist dipersempit tepat ke daftar tag di atas (`a`, `img`,
`figure`, `figcaption` dibuang karena tidak dirender ke PDF). Allowlist itulah
kontrak tunggal antara editor dan mesin PDF.

## Pengujian

Unit (vitest, sudah terpasang):

- Render pola nomor: tiap token, padding, dan pola tanpa token.
- Reset urutan saat pergantian tahun.
- Mesin status: transisi sah dan tidak sah untuk tiap peran.
- `html-to-pdf`: tiap tag yang didukung, tag tak dikenal, dan HTML rusak
  (tag tidak tertutup).

E2E (playwright, sudah terpasang):

- Editor membuat draft → mengajukan → login sebagai penandatangan → mengesahkan
  → surat muncul di `/admin/dokumen` dan `/verifikasi/<slug>` menyatakan valid.

## Berkas yang disentuh

- `src/db/schema.ts` + satu migrasi baru
- `src/rbac.ts`
- `src/lib/surat/*` (baru)
- `src/app/admin/(protected)/surat/*` (baru)
- Nav sidebar admin
- `src/lib/sanitize.ts` (tambah `sanitizeSuratHtml`)
- `package.json`: dua dependensi baru, `@react-pdf/renderer` dan `htmlparser2`

Tidak diubah: `src/lib/qr.ts`, `src/lib/documents.ts`, modul `/admin/dokumen`,
dan halaman `/verifikasi`.

## Di luar cakupan

- Sertifikat tanda tangan kriptografis (PAdES/eSign BSrE)
- Gambar spesimen tanda tangan dan stempel
- Persetujuan berjenjang lebih dari satu tingkat (paraf berantai)
- Distribusi surat via email
- Impor massal surat lama
