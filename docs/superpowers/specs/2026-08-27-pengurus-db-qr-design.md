# Profil Pengurus di Database + Verifikasi QR

Tanggal: 2026-08-27
Status: disetujui, siap masuk rencana implementasi

## Masalah

Profil 18 pengurus LIPAN RI ditulis sebagai konstanta di
`src/components/tentang-kami/org-data.ts`. Setiap pergantian pengurus, koreksi
gelar, atau penambahan foto menuntut perubahan kode dan deploy ulang. Selain itu
belum ada cara membuktikan bahwa seseorang benar-benar pengurus aktif — kebutuhan
nyata bagi lembaga investigasi yang personelnya bekerja di lapangan.

## Sasaran

1. Data pengurus dikelola lewat panel admin (admin-kit), bukan lewat kode.
2. Tiap pengurus punya QR yang, ketika dipindai, membuka halaman publik yang
   mengonfirmasi keabsahannya sebagai pengurus LIPAN RI.

## Bukan sasaran

Struktur bagan — posisi kotak dan garis hubungnya — tetap ditulis tangan di
`org-flow.ts`. Admin tidak bisa menambah divisi, memindah kotak, atau mengubah
garis komando. Keputusan ini diambil sadar: `POS` dan `EDGES` hasil tracing
manual dari `struktur-lipanv2.svg`, dan auto-layout akan menghasilkan bagan yang
berbeda dari dokumen resmi lembaga.

## Arsitektur

### Tabel `pengurus`

```
id              serial PK
slot            text unique nullable   -- id di org-flow.ts; null = tidak tampil di bagan
slug            text unique not null   -- URL verifikasi
nomorAnggota    text unique not null   -- tercetak di kartu fisik
nama            text not null
jabatan         text not null
foto            text                   -- URL media (R2)
deskripsi       text                   -- tupoksi, tampil di panel bagan
email           text                   -- panel bagan saja
telepon         text                   -- panel bagan saja
status          pengurus_status enum(aktif, nonaktif) default aktif
mulaiMenjabat   timestamp not null
selesaiMenjabat timestamp              -- null = belum ada batas
createdAt       timestamp default now
updatedAt       timestamp default now
```

`slot` nullable dan unique: saat ini 18 baris terisi semua, tetapi baris tanpa
`slot` (mis. perwakilan daerah yang tidak punya kotak di bagan) dapat
ditambahkan tanpa migrasi baru.

Kolom `variant` (utama/divisi/staf) sengaja **tidak** masuk DB — itu properti
tampilan dan tetap tinggal di `org-flow.ts` bersama `POS`.

Definisi tabel ditulis di `src/db/schema.ts` mengikuti pola tabel lain di berkas
itu.

### Keberlakuan

Seorang pengurus dianggap **tidak berlaku** bila `status = 'nonaktif'` **atau**
`selesaiMenjabat` sudah lewat. Dihitung saat request, sehingga kedaluwarsa tidak
memerlukan cron atau job terjadwal.

### Aliran data ke bagan

```
src/app/(site)/tentang-kami/[slug]/page.tsx   (server, force-dynamic)
  └─ getPengurusBySlot()  →  Record<slot, OrgMember>
       └─ <StrukturOrg members={…} />          (client)
            └─ NODES dibangun dari POS × members
```

Berkas yang berubah:

- **`src/lib/pengurus.ts`** (baru) — `getPengurusBySlot()`, `getPengurusBySlug()`,
  dan fungsi CRUD untuk admin. Mengikuti pola `src/lib/signatories.ts`.
- **`src/components/tentang-kami/org-data.ts`** — konstanta `ORG` berisi 18 nama
  dan tupoksi dipindahkan ke seed. Yang tersisa: `interface OrgMember` dan peta
  `SLOT_LABELS` (slot → jabatan).
- **`src/components/tentang-kami/org-flow.ts`** — konstanta modul `MEMBERS`
  dihapus. `POS`, `EDGES`, `PARENT`, `CHILDREN`, dan `ancestors` tidak disentuh.
- **`src/components/tentang-kami/struktur-org.tsx`** — menerima prop `members`.

`StrukturOrg` saat ini bertanda tangan `({}: { data: StrukturContent })`: prop
`data` diterima lalu dibuang, sehingga baris `pages` untuk struktur tidak dipakai
bagan. Tidak ada yang perlu dipensiunkan; prop `data` tetap dibiarkan apa adanya
agar tanda tangan renderer di `page.tsx` seragam dengan renderer lain.

### Slot tanpa baris DB

Bila sebuah slot tidak punya baris di DB — pengurus mundur dan belum ada
gantinya, atau DB bermasalah — kartunya tetap digambar memakai `SLOT_LABELS`
sebagai jabatan dan `—` sebagai nama, dan kartu itu tidak bisa diklik. Garis
tetap tersambung karena `EDGES` tidak bergantung pada data. Tanpa mekanisme ini,
satu baris hilang membuat bagan pincang di halaman publik.

### Catatan privasi

`members` terkirim ke browser sebagai props client component. Karena itu
`email` dan `telepon` benar-benar publik, bukan sekadar "muncul saat diklik".
Kontak yang tidak boleh keluar tidak boleh diisi di kolom tersebut.

## Halaman verifikasi

**Rute: `/verifikasi-pengurus/[slug]`** — datar, bukan bersarang di bawah
`/verifikasi/`. Alasannya: pada `/verifikasi/pengurus/[slug]`, segmen statis
`pengurus` menang atas `[slug]` yang dinamis, sehingga dokumen berslug `pengurus`
akan menjadi tidak dapat diakses tanpa error apa pun. Rute datar menghilangkan
kemungkinan itu tanpa perlu daftar slug terlarang.

Tata letak meniru `src/app/(site)/verifikasi/[slug]/page.tsx` (ikon centang hijau
/ silang merah di atas, kartu detail di bawah), dengan foto ditampilkan besar:

- Foto pengurus — cukup besar untuk dicocokkan dengan orang di hadapan pemindai
- Nama dan jabatan
- Nomor anggota
- Masa berlaku: `mulai — selesai`, atau `s.d. sekarang` bila `selesaiMenjabat` null
- Status: **Pengurus Aktif** / **Tidak Berlaku**

Email dan telepon **tidak** ditampilkan di halaman ini.

Halaman diberi `robots: { index: false }`. Halaman verifikasi dokumen boleh
terindeks, tetapi halaman ini memuat foto dan data pribadi; bila terindeks, foto
seluruh pengurus dapat dipanen tanpa perlu memindai QR sama sekali. Pemindaian QR
tetap berjalan normal.

Slug tidak dikenal → `notFound()`, sama seperti verifikasi dokumen. (Catatan:
proyek ini punya masalah soft-404 yang sudah diketahui — `force-dynamic` membuat
`notFound()` tetap mengembalikan status 200. Di luar cakupan pekerjaan ini.)

## QR

### Ekstraksi generator

Logika pembuatan QR (qrcode + sharp, logo LIPAN RI di tengah, error correction H)
saat ini disalin identik di dua tempat:

- `src/app/api/verifikasi/[slug]/qr/route.ts`
- `src/app/api/admin/dokumen/qr-bulk/route.ts`

Pekerjaan ini membutuhkan salinan ketiga, sehingga logikanya diangkat lebih dulu
ke `src/lib/qr.ts` sebagai `generateQrPng(url): Promise<Buffer>`. Kedua pemanggil
lama dipindahkan ke fungsi tersebut; perilaku dan keluarannya identik dengan
sekarang (ukuran 400px, margin 2, warna `#0f2b46` di atas putih, logo ~22% dengan
padding putih 8px).

### Endpoint

- **`/api/verifikasi-pengurus/[slug]/qr`** — PNG satu pengurus, header
  `Cache-Control: public, max-age=31536000, immutable`, mengikuti pola dokumen.
- **`/api/admin/pengurus/qr-bulk`** — ZIP berisi QR seluruh pengurus, meniru
  `src/app/api/admin/dokumen/qr-bulk/route.ts` termasuk gerbang `auth()`. Nama
  berkas di dalam ZIP: `{nomorAnggota}-{nama}.png`, agar mudah dicocokkan saat
  menata hasil cetak.

QR menyandikan URL absolut `https://www.lipan-ri.com/verifikasi-pengurus/{slug}`,
konsisten dengan cara rute dokumen menyusun URL-nya.

## Layar admin

Menu **Pengurus** ditambahkan ke `navItems` di `src/app/admin/layout.tsx` dengan
`requires: "pengurus.manage"`. `src/rbac.ts` tidak perlu diubah: role `admin`
pada preset `adminEditor` bernilai `["*"]`, sehingga izin baru otomatis dipegang
admin dan tertutup bagi editor — sama seperti cara `documents.manage` bekerja
sekarang.

- **`/admin/pengurus`** — daftar seluruh pengurus, diurutkan mengikuti posisinya
  di bagan (atas ke bawah berdasarkan `POS`), baris tanpa `slot` di akhir. Tiap
  baris: thumbnail foto, nama, jabatan, nomor anggota, badge status, tombol
  pratinjau QR. Di atas daftar: tombol **Unduh semua QR (ZIP)**.
- **`/admin/pengurus/baru`** dan **`/admin/pengurus/[id]/edit`** — halaman penuh,
  bukan modal: form memuat foto, tupoksi panjang, dan dua tanggal, yang menjadi
  sempit di dalam modal. Pola `dokumen` menyediakan keduanya; yang diambil adalah
  varian halaman.
- **Slug** dibuat otomatis dari nama memakai `src/lib/slug.ts`, dapat ditimpa
  manual.
- **Nomor anggota** diusulkan otomatis dengan format `LIPAN-{tahun}-{urut 4
  digit}`, dapat ditimpa manual agar kartu yang sudah tercetak tetap cocok.
- **Foto** diunggah lewat media picker admin-kit sehingga tersimpan di R2 seperti
  gambar lain.
- Aksi tulis memakai server action, mengikuti pola `src/app/admin/*/actions.ts`.

## Migrasi dan seed

Dev dan produksi berbagi satu database Neon yang sama, sehingga migrasi langsung
berlaku di produksi. Tabel `pengurus` adalah tabel baru dan tidak menyentuh data
yang ada, tetapi konsekuensinya jelas: data pengurus **tidak** boleh dititipkan
ke `src/db/seed.ts`, yang bersifat destruktif.

Sebagai gantinya, `src/db/seed-pengurus.ts` berdiri sendiri dan bersifat
upsert-by-slot (`onConflictDoNothing`) — aman dijalankan berulang dan tidak
pernah menghapus apa pun. Ditambahkan sebagai skrip `db:seed-pengurus` di
`package.json`.

Isi seed: persis 18 orang yang sekarang ada di `org-data.ts`, lengkap dengan
tupoksi, sehingga tidak ada teks yang hilang dalam perpindahan. `nomorAnggota`
diisi berurutan `LIPAN-2026-0001` … `LIPAN-2026-0018`. `mulaiMenjabat` diisi
`2026-01-01` sebagai nilai sementara yang harus dikoreksi lewat panel admin —
tanggal mulai menjabat yang sebenarnya tidak diketahui dan tidak boleh dikarang.

Migrasi dibuat lewat `pnpm db:generate` lalu diterapkan dengan `pnpm db:migrate`,
sesuai alur baseline drizzle proyek ini.

## Pengujian

Dikerjakan dengan TDD: test ditulis lebih dulu dan dipastikan gagal sebelum
implementasi.

- `e2e/tentang-kami.spec.ts` yang ada sudah memeriksa nama asli ("Cahya Puspita
  Rini") melalui bagan. Setelah sumber datanya pindah ke DB, test itu berubah
  fungsi menjadi penjaga integrasi DB→bagan tanpa perlu diubah.
- Bagan tetap utuh saat satu slot tidak punya baris DB: kartu memakai
  `SLOT_LABELS`, menampilkan `—`, dan tidak dapat diklik.
- Halaman verifikasi menampilkan **Pengurus Aktif** untuk pengurus aktif,
  **Tidak Berlaku** untuk `status = nonaktif`, dan **Tidak Berlaku** untuk
  `selesaiMenjabat` yang sudah lewat.
- `/api/verifikasi-pengurus/[slug]/qr` mengembalikan `image/png`.
- `/api/admin/pengurus/qr-bulk` mengembalikan ZIP berisi 18 berkas.
- `generateQrPng` menghasilkan keluaran yang sama untuk kedua pemanggil lama
  setelah ekstraksi.

`pnpm lint` dan `pnpm build` dijalankan sebelum pekerjaan dinyatakan selesai,
sesuai AGENTS.md.

## Keputusan yang ditolak

**Satu rute `/verifikasi/[slug]` untuk dokumen dan pengurus.** Terlihat rapi dari
luar, tetapi menyatukan ruang nama slug: suatu saat dokumen dan pengurus berslug
sama, dan yang kalah menjadi tidak dapat diakses tanpa error. Untuk sistem yang
gunanya membuktikan keabsahan, kegagalan diam-diam seperti itu terlalu mahal.

**Menumpang tabel `users` milik admin-kit.** `users` adalah akun login admin —
urusan yang berbeda. Menggabungkannya membuat setiap pengurus tampak seperti
punya akun dan menyeret RBAC admin-kit ke dalam data kepegurusan.

**Struktur bagan ikut ke DB dengan auto-layout.** Fleksibel, tetapi bagan hasil
auto-layout tidak akan sama dengan SVG resmi lembaga, dan `POS`/`EDGES` yang
sudah ditune tangan akan terbuang.

## Ditunda

Penghitung berapa kali sebuah QR dipindai (setara `viewCount` pada `documents`).
Murah ditambahkan kapan saja karena polanya sudah ada, tetapi tidak dibutuhkan
agar fitur ini berfungsi.
