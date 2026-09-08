# Rencana: rilis admin-kit 0.13.0 & upgrade lipan-ri

Disusun 2026-09-08, setelah insiden 9 PDF dokumen hilang dari R2. Ini pekerjaan
**tahap dua** — tahap satu (backport 0.8.1) hanya menambal thumbnail PDF supaya
produksi aman tanpa migrasi.

## Kondisi awal

| | |
|---|---|
| Terpasang di lipan-ri | `@blawness/admin-kit@^0.8.0` |
| npm dist-tag `latest` | `0.9.0` |
| Tag git di repo paket | sampai `v0.9.0`, plus `v0.8.1` (backport) |
| Branch kerja | `feat/ui-foundation`, `package.json` sudah 0.13.0 |
| `master` paket | ketinggalan 8 commit dari branch kerja |

Versi 0.10.0–0.13.0 **sudah ditulis di CHANGELOG tapi belum pernah di-tag
maupun dipublish**. Perbaikan thumbnail PDF ada di dua tempat: rilis `v0.8.1`
dan bagian `[Unreleased]` di branch kerja.

## Yang berubah dan menyentuh lipan-ri

1. **Kolom `media.uploaded_by`** (0.10/0.11). Skema `media` di lipan-ri belum
   punya kolom ini. Paketnya sendiri membawa
   `drizzle/0005_overconfident_maria_hill.sql`:
   `ALTER TABLE "media" ADD COLUMN "uploaded_by" integer` + FK ke `users.id`.
   lipan-ri butuh migrasi setara lewat `pnpm db:generate` → `pnpm db:migrate`.
2. **Izin media ditegakkan** (0.11). Layar media bawaan dulu cuma `requireUser()`,
   sekarang `requirePermission("media.read" | "media.upload" | "media.delete")`.
3. **Peran `editor` kehilangan hak hapus media.** `src/rbac.ts` memakai
   `presets.adminEditor`, dan `legacyEditor` isinya `media.read` + `media.upload`
   saja — tanpa `media.delete`. Admin (`"*"`) tidak terpengaruh. Mengingat
   insiden kemarin ini justru bagus, tapi harus jadi keputusan sadar, bukan
   kejutan.
4. **Baris `media` lama punya `uploaded_by` NULL** → hanya bisa dihapus pemegang
   `media.manageAny`. Putuskan mau di-backfill (ke akun admin) atau dibiarkan.
5. **Breaking 0.13** (`createArticleAction`/`updateArticleAction` kini
   `(prevState, formData)` dan mengembalikan `{ error, fieldErrors }`) —
   **tidak menyentuh lipan-ri**: modul berita di sini punya form dan aksi
   sendiri, layar artikel bawaan paket tidak dipakai. Sudah dicek lewat daftar
   impor `@blawness/admin-kit/*`.

## Langkah

### A. Rilis paket
1. `cd ~/projects/admin-kit`, merge `feat/ui-foundation` → `master`.
2. Pindahkan blok `[Unreleased]` di CHANGELOG ke `## [0.13.0]` bertanggal.
3. `pnpm lint && pnpm test && pnpm build` (patokan terakhir: 26 file / 140 tes lolos).
4. Tag `v0.13.0`, push branch + tag.
5. `npm login` lalu `npm publish` (tanpa `--tag`, supaya `latest` naik ke 0.13.0).

### B. Upgrade lipan-ri
1. Naikkan dependensi ke `^0.13.0`, `pnpm install`.
2. `pnpm db:generate` → periksa SQL hasilnya hanya menambah `media.uploaded_by`
   (+ FK), bukan menghapus apa pun → `pnpm db:migrate`.
3. Tinjau `src/rbac.ts`: putuskan apakah `editor` perlu `media.delete`.
   Kalau ya, tambahkan eksplisit di samping `presets.adminEditor`.
4. Putuskan backfill `uploaded_by` untuk baris media lama.
5. `pnpm lint && pnpm build`.

### C. Verifikasi sebelum dianggap beres
Bagian yang lipan-ri benar-benar pakai dari paket, jadi ini yang wajib dicoba
di panel admin sungguhan — bukan cuma lolos build:

- `/admin/login` masuk sebagai admin dan sebagai editor.
- `/admin/media`: daftar tampil, unggah gambar, unggah PDF (harus jadi kartu
  berkas, bukan gambar rusak), hapus berkas yang tidak dirujuk, dan **hapus
  berkas yang masih dipakai dokumen harus ditolak** (lihat
  `src/lib/admin/media.ts`).
- `/admin/dokumen`: unggah PDF dari form dokumen, pratinjaunya kartu berkas.
- `/admin/users`, `/admin/profile`, sidebar/laci mobile pada shell.
- Cek `audit_logs` mencatat `media.upload` dan `media.delete`.

## Jangan lupa

- Arsip `trash/<tanggal>/<key>` di R2 dan pagar `WIPE_DB` pada `pnpm db:seed`
  adalah pengaman yang dipasang setelah insiden — pastikan keduanya masih
  berjalan setelah upgrade.
- Masih ada 9 dokumen yang berkasnya hilang permanen dan `show_document`-nya
  sudah dimatikan; nyalakan lagi per surat setelah PDF-nya diunggah ulang.
