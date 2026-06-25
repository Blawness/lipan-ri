# Legalitas Dokumen by QR — Design Spec

**Tanggal:** 2026-06-25
**Arsitektur:** Integrated (dalam app lipan-ri yang sudah ada)

## Ringkasan Fitur

Sistem verifikasi legalitas dokumen berbasis QR code. Admin LIPAN mendaftarkan dokumen
beserta metadata-nya (no surat, tgl terbit, nama penandatangan), sistem menghasilkan QR code,
dan publik dapat memindai QR untuk memverifikasi keaslian dokumen melalui halaman publik.

## Arsitektur

Fitur ini ditambahkan langsung ke dalam monolith Next.js lipan-ri — bukan subdomain/deployment
terpisah. Pertimbangan:

- Fitur kecil: 1 tabel DB + 1 halaman publik + 3 screen admin
- Tidak ada kebutuhan scaling terpisah atau teknologi berbeda
- Admin panel (@blawness/admin-kit) sudah tersedia; tinggal menambah screen
- Tim kecil non-profit — semakin sedikit infra, semakin mudah di-maintain

## Database Schema

Tabel baru `documents` di `src/db/schema.ts`:

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | serial (PK) | Primary key |
| `slug` | text, unique | Identifier unik di URL (`/verifikasi/[slug]`) |
| `number` | text | Nomor surat |
| `title` | text | Judul/perihal dokumen |
| `signatory` | text | Nama penandatangan |
| `issued_at` | timestamp | Tanggal terbit dokumen |
| `file_url` | text, nullable | URL PDF di R2 (upload via admin-kit media manager) |
| `status` | enum(`active`, `revoked`) | Status legalitas |
| `created_at` | timestamp | Default `now()` |
| `updated_at` | timestamp | Default `now()` |

Enum: `document_status` → `active`, `revoked`

Slug di-generate otomatis dari `number` + 6-character random suffix. Immutable setelah dibuat.

## Routes & Pages

### Public (no auth)

```
GET /verifikasi/[slug]
```

Halaman Server Component di `src/app/(site)/verifikasi/[slug]/page.tsx`.

- `export const dynamic = "force-dynamic"` (konsisten dengan semua page lain)
- Fetch document by slug dari DB
- Jika tidak ditemukan → `notFound()` (404)
- Menampilkan:
  - Status: "Dokumen Valid" (centang hijau) untuk `active` / "Dokumen Tidak Berlaku" (silang merah) untuk `revoked`
  - Nomor surat
  - Judul/perihal
  - Tanggal terbit
  - Nama penandatangan
- Tidak menampilkan download link atau preview PDF — hanya metadata

### API

```
GET /api/verifikasi/[slug]/qr   →  return QR code PNG image (Content-Type: image/png)
```

- QR di-generate on-the-fly menggunakan library `qrcode`
- URL yang di-encode: `https://lipan-ri.or.id/verifikasi/[slug]`
- Tidak disimpan ke DB atau R2 — deterministik dan selalu bisa diregenerasi

### Admin (butuh login)

```
/admin/dokumen           →  list dokumen (table + search)
/admin/dokumen/baru       →  form tambah dokumen
/admin/dokumen/[id]/edit  →  form edit dokumen
```

- Menggunakan layout admin @blawness/admin-kit yang sudah ada
- Form menggunakan controlled input biasa (bukan Tiptap — ini plain text)
- Upload PDF via media picker admin-kit (R2)
- Di halaman list dan edit: tombol download QR code (fetch dari `/api/verifikasi/[slug]/qr`)
- Revoke via action button di list atau toggle switch di form edit

## Data Access Layer

File baru `src/lib/documents.ts`, mengikuti pattern `src/lib/posts.ts` / `src/lib/pages.ts`:

```ts
getDocuments(query?: string)          // list + search untuk admin
getDocumentBySlug(slug: string)       // lookup untuk halaman verifikasi
createDocument(data)                  // admin: tambah baru
updateDocument(id, data)              // admin: edit
revokeDocument(id)                    // admin: cabut legalitas
```

Semua operasi menggunakan Drizzle ORM dengan DB client yang sudah ada.

## Flow

### Verifikasi (user scan QR)

1. User memindai QR code dari dokumen fisik/PDF
2. Browser membuka `https://lipan-ri.or.id/verifikasi/[slug]`
3. Server Component fetch document by slug
4. Jika ditemukan & `active` → halaman "Dokumen Valid" + metadata
5. Jika ditemukan & `revoked` → halaman "Dokumen Tidak Berlaku" + metadata
6. Jika tidak ditemukan → 404

### Admin registrasi dokumen

1. Admin login, buka `/admin/dokumen`
2. Klik "Tambah Dokumen" → isi form (no surat, perihal, tgl terbit, penandatangan, upload PDF opsional)
3. Submit → slug auto-generate, data tersimpan
4. Admin download QR code → tempel ke dokumen PDF/fisik
5. Dokumen+QR siap didistribusikan

### Revoke dokumen

1. Admin buka list/edit dokumen
2. Klik "Cabut" atau toggle status
3. Status jadi `revoked`
4. Semua QR yang beredar otomatis menampilkan "Tidak Berlaku" saat discan

## Error Handling

| Kasus | Penanganan |
|---|---|
| Slug tidak ditemukan | `notFound()` → 404 page |
| Dokumen direvoke setelah QR tersebar | Tetap tampil halaman verifikasi, status "Tidak Berlaku" |
| Admin upload PDF > batas ukuran | Validasi di frontend form + batas media manager admin-kit |
| Slug collision | Auto-generate slug dengan random suffix, unique constraint di DB |
| Brute-force slug | Bukan celah keamanan — halaman verifikasi publik (hanya metadata tanpa dokumen asli) |
| Permalink ganti | Slug immutable setelah dibuat, QR selalu valid |

## Dependencies Baru

- `qrcode` — generate QR code PNG di server

## Pertimbangan Keamanan

- Halaman verifikasi bersifat publik — tidak memerlukan autentikasi
- Data yang ditampilkan hanya metadata (no surat, judul, tgl, penandatangan, status)
- PDF/dokumen asli tidak dapat diakses publik
- Slug bersifat unguessable (random suffix) — namun keamanan tidak bergantung pada kerahasiaan slug
