# Spec: Homepage Institusional + Pindah Feed Berita ke `/berita`

**Tanggal:** 2026-06-02
**Status:** Disetujui untuk implementasi

## Tujuan

Merombak homepage (`/`) dari sekadar feed berita menjadi **landing page institusional** yang menegaskan otoritas dan legitimasi LIPAN RI (Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia) — terasa sebagai lembaga resmi, bukan situs abal-abal. Vibe animasi: **halus & premium** (Framer Motion). Feed berita yang sekarang ada di home dipindah utuh ke `/berita`.

## Non-Tujuan

- Tidak mengubah skema DB, layer data access (`src/lib/*`), atau konten seed.
- Tidak menambah angka/statistik karangan — hanya data faktual.
- Tidak refactor di luar yang diperlukan untuk fitur ini.

## Perubahan Routing

| Route | Sebelum | Sesudah |
|---|---|---|
| `/` | Feed berita (FeaturedPost + Berita Utama + Berita Terbaru + Sidebar) | Landing institusional baru |
| `/berita` | (tidak ada — soft-404 di category) | Feed berita: isi home lama, dipindah utuh |
| Navbar "Berita" | `href: "/"` | `href: "/berita"` |

Catatan: `/berita` adalah route baru di `src/app/berita/page.tsx`. Tetap `export const dynamic = "force-dynamic"`.

## Susunan Homepage Baru (atas → bawah)

1. **Hero** — upgrade dari hero sekarang (gradient `gradient-hero` + dot pattern). Headline "LIPAN RI", motto, deskripsi panjang lembaga, badge "Lembaga Independen", 2 CTA (Tentang Kami, Lihat Arsip). Reveal halus saat load.
2. **News Ticker / Conveyor** — strip running headline ala TV, infinite horizontal scroll, isi dari `getRecentPosts`. Tiap item link ke `/[slug]` berita. Pause saat hover.
3. **Stat Faktual** — 4 angka, counter naik saat masuk viewport:
   - `2017` — Tahun Berdiri (Akta 19 Juli 2017)
   - `Kemenkumham` — Terdaftar Resmi (SK AHU 2017 & 2024) — label, bukan counter
   - `{count}` — Total Publikasi (count real dari DB)
   - `NKRI` — Cakupan Nasional — label, bukan counter
4. **Misi & Pilar** — ringkasan Visi (dari page `visi-misi`) + 3 kartu pilar nilai: Independen, Berintegritas, Profesional. Stagger reveal.
5. **Profil Ketua** — foto + nama + kutipan singkat → link `/tentang-kami/profil-ketua`.
6. **Legitimasi / Legalitas** — panel "Lembaga resmi & terdaftar" + ringkasan akta/SK Kemenkumham → link `/tentang-kami/legalitas`.
7. **Berita Terkini + Galeri** — 3 kartu berita terbaru (reuse `PostCard`, → `/berita`) + cuplikan grid galeri (→ `/galeri`).
8. **CTA Kontak** — ajakan akhir → `/kontak`.

## Sumber Data (faktual, dari yang sudah ada)

- **Berita/ticker/preview:** `getRecentPosts()` dari `src/lib/posts.ts`.
- **Total publikasi:** count dari DB (helper baru kecil di `src/lib/posts.ts`, mis. `getPostCount()`).
- **Tahun berdiri / legalitas:** konstanta dari konten seed (Akta No.18 tanggal 19 Juli 2017; SK Kemenkumham AHU-0010835.AH.01.07 Tahun 2017 & AHU-0001069.AH.01.06 Tahun 2024). Boleh di-hardcode sebagai konten statis halaman (bukan angka karangan).
- **Visi/Motto/Pilar:** dari konten page `visi-misi` (motto "Melayani, Membantu, Dipercaya"; pilar Independen · Berintegritas · Profesional).
- **Profil ketua & galeri:** link ke halaman terkait; thumbnail dari media yang ada bila tersedia.

## Arsitektur Komponen

Halaman tetap **Server Component**; animasi dibungkus komponen client kecil agar data fetching tetap di server.

```
src/app/page.tsx                 # Home baru (Server Component, force-dynamic)
src/app/berita/page.tsx          # Feed berita (pindahan home lama, force-dynamic)

src/components/home/
  reveal.tsx          # "use client" — wrapper fade+slide-up saat masuk viewport (Framer Motion)
  news-ticker.tsx     # "use client" — marquee infinite scroll, pause on hover
  stat-counter.tsx    # "use client" — angka count-up saat masuk viewport
  hero.tsx            # Hero section (boleh server; animasi via Reveal/motion bila perlu client)
  misi-pilar.tsx      # Section misi + 3 kartu pilar
  profil-ketua.tsx    # Section teaser ketua
  legalitas-strip.tsx # Section legitimasi
  berita-galeri.tsx   # Section berita terkini + galeri
  cta-kontak.tsx      # Section CTA akhir
```

Tiap section = unit fokus, satu tujuan, dipanggil dari `page.tsx`. Section yang murni presentasional boleh Server Component dan dibungkus `<Reveal>` di `page.tsx`.

### `Reveal` (kontrak)
- Props: `children`, opsional `delay`, `as`.
- Perilaku: fade in + translateY(16px→0), `whileInView`, `viewport={{ once: true }}`, easing lembut (~0.5s).
- Hormati `prefers-reduced-motion`: jika user minta reduced motion, render tanpa animasi.

### `NewsTicker` (kontrak)
- Props: `items: { title, slug }[]`.
- Perilaku: dua salinan list digeser horizontal terus-menerus (infinite), pause saat hover, tiap item `<Link>`.

### `StatCounter` (kontrak)
- Props: `value: number`, `label`, `suffix?`. Count-up saat masuk viewport.
- Untuk entri non-numerik (Kemenkumham, NKRI) pakai label statis, bukan counter.

## Animasi (Framer Motion)

- Install `framer-motion` (belum ada di `package.json`).
- Pola reveal dipakai ulang via `Reveal`. Hindari menandai seluruh halaman `"use client"` — hanya wrapper/komponen interaktif.
- Hormati `prefers-reduced-motion` di semua animasi.

## Batasan & Konvensi (ikuti yang ada)

- `export const dynamic = "force-dynamic"` di kedua page.
- Locale id_ID, teks UI Bahasa Indonesia.
- Pakai token warna yang ada (`--brand`, `navy-*`, `gold-*`) dan util kelas yang ada (`gradient-hero`, `accent-gold-bar`). Tidak bikin sistem warna baru.
- Reuse `PostCard`, `FeaturedPost`, `Sidebar` apa adanya untuk `/berita`.
- Next.js 16: tidak pakai `asChild` pada Button (pakai `render`); baca `node_modules/next/dist/docs/` bila menyentuh API yang berubah.

## Kriteria Sukses

- `/` menampilkan 8 section di atas dengan animasi reveal halus; `prefers-reduced-motion` mematikan animasi.
- News ticker berjalan mulus & infinite, pause on hover, item nge-link ke berita.
- Stat hanya menampilkan data faktual (tahun 2017, status Kemenkumham, count real, cakupan NKRI).
- `/berita` menampilkan persis feed berita home lama (tidak ada konten hilang).
- Navbar "Berita" mengarah ke `/berita`.
- `pnpm lint` dan `pnpm build` lulus.

## Risiko / Catatan

- **Soft-404 known issue:** `force-dynamic` membuat `notFound()` balik 200. Route `/berita` baru tidak terdampak (selalu ada konten).
- Pastikan ticker tidak menyebabkan layout shift / overflow horizontal pada mobile (`overflow-hidden` pada container).
- Bundle: `framer-motion` hanya dimuat di komponen client yang memakainya.
