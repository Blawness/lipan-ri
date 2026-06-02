# Homepage Institusional Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rombak `/` jadi landing institusional berwibawa (8 section, animasi halus Framer Motion), pindahkan feed berita lama ke `/berita`.

**Architecture:** Home & `/berita` tetap Server Component dengan `force-dynamic`. Data tetap diambil di server lewat `src/lib/*`. Animasi dibungkus 3 komponen client kecil (`Reveal`, `NewsTicker`, `StatCounter`) yang di-`import` ke section presentasional; sisanya Server Component dibungkus `<Reveal>` di `page.tsx`.

**Tech Stack:** Next.js 16 App Router, Framer Motion, Tailwind v4, Drizzle, shadcn (base-nova).

---

## Catatan verifikasi (repo ini)

- **Tidak ada unit test.** Verifikasi tiap task = `pnpm lint` lalu `pnpm build` harus lulus. E2E (`pnpm e2e`) hanya dijalankan di task terakhir.
- Locale id_ID, token warna `--brand`/`navy-*`/`gold-*`, util `gradient-hero`/`accent-gold-bar` sudah ada — pakai ulang.
- Next.js 16: tidak ada `asChild` di Button; `"use client"` wajib untuk hooks/Framer Motion.

---

## File Structure

| File | Tanggung jawab |
|---|---|
| `package.json` | Tambah dependency `framer-motion` |
| `src/app/berita/page.tsx` | **Create** — feed berita (isi home lama, utuh) |
| `src/app/page.tsx` | **Rewrite** — landing institusional, rakit semua section |
| `src/lib/posts.ts` | Tambah `getPostCount()` |
| `src/components/layout/header.tsx` | Ubah navbar "Berita" → `/berita` |
| `src/components/home/reveal.tsx` | Client — wrapper fade+slide-up saat masuk viewport |
| `src/components/home/news-ticker.tsx` | Client — marquee infinite, pause on hover |
| `src/components/home/stat-counter.tsx` | Client — angka count-up saat masuk viewport |
| `src/components/home/hero.tsx` | Section hero |
| `src/components/home/stats.tsx` | Section 4 stat faktual |
| `src/components/home/misi-pilar.tsx` | Section visi + 3 kartu pilar |
| `src/components/home/profil-ketua.tsx` | Section teaser ketua |
| `src/components/home/legalitas-strip.tsx` | Section legitimasi |
| `src/components/home/berita-galeri.tsx` | Section 3 berita + cuplikan galeri |
| `src/components/home/cta-kontak.tsx` | Section CTA akhir |

---

### Task 1: Install Framer Motion

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install**

Run: `pnpm add framer-motion`
Expected: `framer-motion` muncul di `dependencies`, exit 0.

- [ ] **Step 2: Verify build still green**

Run: `pnpm build`
Expected: build sukses (belum ada perubahan kode).

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add framer-motion"
```

---

### Task 2: Pindahkan feed berita ke `/berita`

Isi `/berita` = persis isi `src/app/page.tsx` yang sekarang. Salin verbatim badan render-nya.

**Files:**
- Create: `src/app/berita/page.tsx`

- [ ] **Step 1: Buat halaman berita**

Salin seluruh isi `src/app/page.tsx` yang ADA SEKARANG ke file baru ini, ganti nama fungsi jadi `BeritaPage`, tambah metadata. Isi lengkap:

```tsx
import Link from "next/link";
import type { Metadata } from "next";
import { getFeaturedPosts, getRecentPosts } from "@/lib/posts";
import { FeaturedPost } from "@/components/featured-post";
import { PostCard } from "@/components/post-card";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
  title: "Berita",
  description: "Berita utama dan terbaru LIPAN RI",
};

export default async function BeritaPage() {
  const featuredPosts = await getFeaturedPosts(5);
  const recentPosts = await getRecentPosts(6);
  const mainFeatured = featuredPosts[0];
  const otherFeatured = featuredPosts.slice(1);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          {mainFeatured && (
            <section className="mb-10">
              <FeaturedPost
                title={mainFeatured.title}
                slug={mainFeatured.slug}
                excerpt={mainFeatured.excerpt}
                featuredImage={mainFeatured.featuredImage}
                categoryName={mainFeatured.categoryName}
                categorySlug={mainFeatured.categorySlug}
                publishedAt={mainFeatured.publishedAt}
              />
            </section>
          )}

          {otherFeatured.length > 0 && (
            <section className="mb-10">
              <h2 className="font-heading accent-gold-bar text-xl font-bold text-navy-900 mb-6 border-b border-navy-100 pb-3">
                Berita Utama
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otherFeatured.map((post) => (
                  <PostCard
                    key={post.id}
                    title={post.title}
                    slug={post.slug}
                    excerpt={post.excerpt}
                    featuredImage={post.featuredImage}
                    categoryName={post.categoryName}
                    categorySlug={post.categorySlug}
                    publishedAt={post.publishedAt}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="font-heading accent-gold-bar text-xl font-bold text-navy-900 mb-6 border-b border-navy-100 pb-3">
              Berita Terbaru
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.map((post) => (
                <PostCard
                  key={post.id}
                  title={post.title}
                  slug={post.slug}
                  excerpt={post.excerpt}
                  featuredImage={post.featuredImage}
                  categoryName={post.categoryName}
                  categorySlug={post.categorySlug}
                  publishedAt={post.publishedAt}
                />
              ))}
            </div>
          </section>
        </div>
        <div className="w-full lg:w-80 flex-shrink-0">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
```

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm build`
Expected: lulus; route `/berita` muncul di output build.

- [ ] **Step 3: Commit**

```bash
git add src/app/berita/page.tsx
git commit -m "feat: add /berita page (news feed)"
```

---

### Task 3: Navbar "Berita" → `/berita`

**Files:**
- Modify: `src/components/layout/header.tsx:15`

- [ ] **Step 1: Ubah href**

Ganti baris:
```ts
  { label: "Berita", href: "/" },
```
jadi:
```ts
  { label: "Berita", href: "/berita" },
```

- [ ] **Step 2: Cek mobile-nav**

Run: `grep -n "Berita\|href" src/components/layout/mobile-nav.tsx`
Jika mobile-nav punya array link sendiri dengan `Berita → "/"`, ubah juga ke `/berita`. Jika mobile-nav meng-import `navLinks` dari header, tidak perlu diubah.

- [ ] **Step 3: Verify**

Run: `pnpm lint && pnpm build`
Expected: lulus.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/header.tsx src/components/layout/mobile-nav.tsx
git commit -m "feat: point navbar Berita to /berita"
```

---

### Task 4: Helper `getPostCount()`

**Files:**
- Modify: `src/lib/posts.ts` (tambah di akhir file)

- [ ] **Step 1: Tambah fungsi**

`sql` sudah di-import di baris 3. Tambah di akhir `src/lib/posts.ts`:

```ts
export async function getPostCount() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(eq(posts.status, "published"));
  return Number(result[0]?.count ?? 0);
}
```

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm build`
Expected: lulus.

- [ ] **Step 3: Commit**

```bash
git add src/lib/posts.ts
git commit -m "feat: add getPostCount helper"
```

---

### Task 5: Komponen `Reveal` (client)

**Files:**
- Create: `src/components/home/reveal.tsx`

- [ ] **Step 1: Tulis komponen**

```tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm build`
Expected: lulus (komponen belum dipakai — tidak masalah).

- [ ] **Step 3: Commit**

```bash
git add src/components/home/reveal.tsx
git commit -m "feat: add Reveal animation wrapper"
```

---

### Task 6: Komponen `NewsTicker` (client)

**Files:**
- Create: `src/components/home/news-ticker.tsx`

- [ ] **Step 1: Tulis komponen**

Marquee dua salinan list digeser 50% terus-menerus (infinite seamless), pause on hover via CSS.

```tsx
"use client";

import Link from "next/link";
import { useReducedMotion } from "framer-motion";

type TickerItem = { title: string; slug: string };

export function NewsTicker({ items }: { items: TickerItem[] }) {
  const reduce = useReducedMotion();
  if (items.length === 0) return null;

  const loop = [...items, ...items];

  return (
    <div className="bg-navy-900 text-white border-y border-gold-400/20 overflow-hidden">
      <div className="container mx-auto flex items-center">
        <span className="flex-shrink-0 flex items-center gap-2 bg-brand-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-300 animate-pulse" />
          Terkini
        </span>
        <div className="relative flex-1 overflow-hidden group">
          <div
            className="flex whitespace-nowrap"
            style={
              reduce
                ? undefined
                : { animation: "ticker-scroll 40s linear infinite" }
            }
          >
            {loop.map((item, i) => (
              <Link
                key={`${item.slug}-${i}`}
                href={`/${item.slug}`}
                className="inline-flex items-center gap-3 px-6 py-2.5 text-sm text-navy-200 hover:text-white transition-colors"
              >
                <span className="text-gold-400">•</span>
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Tambah keyframes + pause-on-hover ke globals.css**

Tambahkan di akhir `src/app/globals.css`:

```css
@keyframes ticker-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.group:hover [style*="ticker-scroll"] {
  animation-play-state: paused !important;
}
```

- [ ] **Step 3: Verify**

Run: `pnpm lint && pnpm build`
Expected: lulus.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/news-ticker.tsx src/app/globals.css
git commit -m "feat: add infinite news ticker"
```

---

### Task 7: Komponen `StatCounter` (client)

**Files:**
- Create: `src/components/home/stat-counter.tsx`

- [ ] **Step 1: Tulis komponen**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

export function StatCounter({
  value,
  label,
  suffix = "",
}: {
  value: number;
  label: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-heading text-3xl md:text-4xl font-extrabold text-navy-900">
        {display}
        {suffix}
      </div>
      <div className="mt-1 text-xs md:text-sm text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm build`
Expected: lulus.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/stat-counter.tsx
git commit -m "feat: add StatCounter count-up component"
```

---

### Task 8: Section `Hero`

**Files:**
- Create: `src/components/home/hero.tsx`

- [ ] **Step 1: Tulis komponen** (adaptasi hero lama; Server Component)

```tsx
import Link from "next/link";

export function Hero() {
  return (
    <section className="gradient-hero text-white py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur border border-gold-400/30 text-xs text-gold-200 tracking-wider uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
          Lembaga Independen Milik Masyarakat
        </div>
        <h1 className="font-heading text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
          LIPAN <span className="text-brand-500">RI</span>
        </h1>
        <div className="mx-auto mb-5 h-1 w-20 rounded-full bg-gradient-to-r from-brand-500 to-gold-400" />
        <p className="text-lg md:text-xl text-navy-200 max-w-2xl mx-auto leading-relaxed">
          Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia
        </p>
        <p className="text-sm text-navy-300/80 mt-4 tracking-wide">
          Independen &bull; Berintegritas &bull; Profesional
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <Link
            href="/tentang-kami/sekilas-lipan-ri"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20"
          >
            Tentang Kami
          </Link>
          <Link
            href="/berita"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors border border-white/20"
          >
            Lihat Berita
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm build`
Expected: lulus.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/hero.tsx
git commit -m "feat: add home Hero section"
```

---

### Task 9: Section `Stats` (faktual)

**Files:**
- Create: `src/components/home/stats.tsx`

- [ ] **Step 1: Tulis komponen** — terima `postCount` & `years` dari parent; numerik pakai `StatCounter`, non-numerik label statis.

```tsx
import { StatCounter } from "./stat-counter";

export function Stats({
  postCount,
  years,
}: {
  postCount: number;
  years: number;
}) {
  return (
    <section className="border-y border-navy-100 bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCounter value={years} suffix=" Thn" label="Sejak 2017" />
          <StatCounter value={postCount} suffix="+" label="Publikasi" />
          <div className="text-center">
            <div className="font-heading text-3xl md:text-4xl font-extrabold text-navy-900">
              Resmi
            </div>
            <div className="mt-1 text-xs md:text-sm text-muted-foreground uppercase tracking-wider">
              Terdaftar Kemenkumham
            </div>
          </div>
          <div className="text-center">
            <div className="font-heading text-3xl md:text-4xl font-extrabold text-navy-900">
              NKRI
            </div>
            <div className="mt-1 text-xs md:text-sm text-muted-foreground uppercase tracking-wider">
              Cakupan Nasional
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm build`
Expected: lulus.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/stats.tsx
git commit -m "feat: add home Stats section"
```

---

### Task 10: Section `MisiPilar`

**Files:**
- Create: `src/components/home/misi-pilar.tsx`

Konten visi & pilar di-hardcode dari konten seed `visi-misi` (motto "Melayani, Membantu, Dipercaya").

- [ ] **Step 1: Tulis komponen**

```tsx
import { ShieldCheck, Scale, Award } from "lucide-react";

const pilar = [
  {
    icon: ShieldCheck,
    title: "Independen",
    desc: "Bergerak tanpa kepentingan golongan, murni untuk kepentingan negara dan masyarakat.",
  },
  {
    icon: Scale,
    title: "Berintegritas",
    desc: "Menjunjung kejujuran dan keadilan dalam setiap investigasi dan pengawasan aset.",
  },
  {
    icon: Award,
    title: "Profesional",
    desc: "Penanganan menyeluruh, berkelanjutan, dan berkeadilan oleh tim yang kompeten.",
  },
];

export function MisiPilar() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-navy-900">
          Mengawal Aset Negara &amp; Masyarakat
        </h2>
        <div className="mx-auto my-4 h-1 w-16 rounded-full bg-gradient-to-r from-brand-500 to-gold-400" />
        <p className="text-muted-foreground leading-relaxed">
          Mengawasi, menyelamatkan, investigasi, pemantauan, pemeliharaan serta
          pencatatan barang aset milik Negara dan Masyarakat di seluruh wilayah
          Negara Kesatuan Republik Indonesia.
        </p>
        <p className="mt-4 text-sm font-semibold text-brand-600 uppercase tracking-widest">
          Melayani &bull; Membantu &bull; Dipercaya
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {pilar.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
              <p.icon className="h-6 w-6" />
            </div>
            <h3 className="font-heading mt-4 text-lg font-bold text-navy-900">
              {p.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {p.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm build`
Expected: lulus. (Jika `ShieldCheck`/`Scale`/`Award` tidak ada di versi lucide-react terpasang, ganti dengan ikon yang ada, mis. `Shield`, `Gavel`, `BadgeCheck` — cek `node_modules/lucide-react`.)

- [ ] **Step 3: Commit**

```bash
git add src/components/home/misi-pilar.tsx
git commit -m "feat: add home MisiPilar section"
```

---

### Task 11: Section `ProfilKetua`

**Files:**
- Create: `src/components/home/profil-ketua.tsx`

Nama dari seed `profil-ketua`: "Harun Prayitno, SE, SH, MH".

- [ ] **Step 1: Tulis komponen**

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ProfilKetua() {
  return (
    <section className="bg-navy-50/60 border-y border-navy-100 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-center max-w-4xl mx-auto">
          <div className="mx-auto h-40 w-40 md:h-48 md:w-48 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-900 ring-4 ring-white shadow-xl flex items-center justify-center">
            <span className="font-heading text-5xl font-extrabold text-gold-400">
              HP
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest">
              Ketua Umum LIPAN RI
            </p>
            <h2 className="font-heading mt-1 text-2xl md:text-3xl font-bold text-navy-900">
              Harun Prayitno, SE, SH, MH
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              &ldquo;Berbekal pengalaman dan kemitraan dengan BPN dalam
              penanganan konflik dan sengketa pertanahan di seluruh wilayah
              NKRI selama kurang lebih 20 tahun, kami hadir untuk mengadvokasi
              keadilan bagi masyarakat.&rdquo;
            </p>
            <Link
              href="/tentang-kami/profil-ketua"
              className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Selengkapnya tentang Ketua
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm build`
Expected: lulus.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/profil-ketua.tsx
git commit -m "feat: add home ProfilKetua section"
```

---

### Task 12: Section `LegalitasStrip`

**Files:**
- Create: `src/components/home/legalitas-strip.tsx`

Data dari seed `legalitas` (faktual).

- [ ] **Step 1: Tulis komponen**

```tsx
import Link from "next/link";
import { BadgeCheck, ArrowRight } from "lucide-react";

const legal = [
  { label: "Akta Pendirian", detail: "Notaris No. 18 — 19 Juli 2017" },
  {
    label: "SK Kemenkumham",
    detail: "AHU-0010835.AH.01.07 Tahun 2017",
  },
  {
    label: "Perubahan 2024",
    detail: "AHU-0001069.AH.01.06 Tahun 2024",
  },
];

export function LegalitasStrip() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="rounded-3xl gradient-hero text-white p-8 md:p-12 relative overflow-hidden">
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 text-gold-300 text-sm font-semibold uppercase tracking-wider">
            <BadgeCheck className="h-5 w-5" />
            Lembaga Resmi &amp; Terdaftar
          </div>
          <h2 className="font-heading mt-3 text-2xl md:text-3xl font-bold">
            Legalitas yang Dapat Dipertanggungjawabkan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {legal.map((l) => (
              <div
                key={l.label}
                className="rounded-xl bg-white/5 backdrop-blur border border-white/10 p-4"
              >
                <div className="text-xs text-gold-200 uppercase tracking-wider">
                  {l.label}
                </div>
                <div className="mt-1 text-sm text-navy-100 font-medium">
                  {l.detail}
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/tentang-kami/legalitas"
            className="inline-flex items-center gap-1.5 mt-8 text-sm font-semibold text-gold-300 hover:text-gold-200 transition-colors"
          >
            Lihat legalitas lengkap
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm build`
Expected: lulus.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/legalitas-strip.tsx
git commit -m "feat: add home LegalitasStrip section"
```

---

### Task 13: Section `BeritaGaleri`

**Files:**
- Create: `src/components/home/berita-galeri.tsx`

Terima `posts` & `photos` dari parent (parent yang fetch). Reuse `PostCard`. Foto galeri pakai `<img>` (URL R2 eksternal) seperti pola di `galeri/page.tsx`.

- [ ] **Step 1: Tulis komponen**

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PostCard } from "@/components/post-card";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  publishedAt: Date | null;
};

type Photo = { id: string; url: string; alt?: string | null };

export function BeritaGaleri({
  posts,
  photos,
}: {
  posts: Post[];
  photos: Photo[];
}) {
  return (
    <section className="bg-navy-50/60 border-t border-navy-100 py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-heading accent-gold-bar text-xl md:text-2xl font-bold text-navy-900">
            Berita Terkini
          </h2>
          <Link
            href="/berita"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Semua berita
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              title={post.title}
              slug={post.slug}
              excerpt={post.excerpt}
              featuredImage={post.featuredImage}
              categoryName={post.categoryName}
              categorySlug={post.categorySlug}
              publishedAt={post.publishedAt}
            />
          ))}
        </div>

        {photos.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-14 mb-8">
              <h2 className="font-heading accent-gold-bar text-xl md:text-2xl font-bold text-navy-900">
                Galeri Kegiatan
              </h2>
              <Link
                href="/galeri"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                Semua foto
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.slice(0, 4).map((photo) => (
                <a
                  key={photo.id}
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-xl overflow-hidden border-2 border-navy-100 hover:border-navy-400 hover:shadow-xl transition-all duration-300 group relative"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL gambar eksternal (R2), tanpa next/image */}
                  <img
                    src={photo.url}
                    alt={photo.alt ?? "Dokumentasi LIPAN RI"}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify type galeri**

Run: `grep -n "url\|alt\|id" src/lib/media.ts`
Pastikan field `getMediaByAlbum` mengandung `id`, `url`, `alt`. Jika nama field beda, sesuaikan tipe `Photo` di atas.

- [ ] **Step 3: Verify build**

Run: `pnpm lint && pnpm build`
Expected: lulus.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/berita-galeri.tsx
git commit -m "feat: add home BeritaGaleri section"
```

---

### Task 14: Section `CtaKontak`

**Files:**
- Create: `src/components/home/cta-kontak.tsx`

- [ ] **Step 1: Tulis komponen**

```tsx
import Link from "next/link";

export function CtaKontak() {
  return (
    <section className="container mx-auto px-4 py-20 text-center">
      <h2 className="font-heading text-2xl md:text-3xl font-bold text-navy-900">
        Ada Sengketa atau Dugaan Penyalahgunaan Aset Negara?
      </h2>
      <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
        Sampaikan laporan atau pertanyaan Anda. Kami hadir untuk masyarakat.
      </p>
      <Link
        href="/kontak"
        className="inline-flex items-center gap-2 mt-7 px-7 py-3 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20"
      >
        Hubungi Kami
      </Link>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm build`
Expected: lulus.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/cta-kontak.tsx
git commit -m "feat: add home CtaKontak section"
```

---

### Task 15: Rakit homepage baru

**Files:**
- Rewrite: `src/app/page.tsx`

- [ ] **Step 1: Ganti seluruh isi `src/app/page.tsx`**

```tsx
import { getRecentPosts, getPostCount } from "@/lib/posts";
import { getMediaByAlbum } from "@/lib/media";
import { Reveal } from "@/components/home/reveal";
import { NewsTicker } from "@/components/home/news-ticker";
import { Hero } from "@/components/home/hero";
import { Stats } from "@/components/home/stats";
import { MisiPilar } from "@/components/home/misi-pilar";
import { ProfilKetua } from "@/components/home/profil-ketua";
import { LegalitasStrip } from "@/components/home/legalitas-strip";
import { BeritaGaleri } from "@/components/home/berita-galeri";
import { CtaKontak } from "@/components/home/cta-kontak";

const FOUNDED_YEAR = 2017;

export default async function HomePage() {
  const [recentPosts, postCount, photos] = await Promise.all([
    getRecentPosts(8),
    getPostCount(),
    getMediaByAlbum("dokumen-ketua"),
  ]);

  const years = new Date().getFullYear() - FOUNDED_YEAR;
  const tickerItems = recentPosts.map((p) => ({ title: p.title, slug: p.slug }));

  return (
    <div className="min-h-screen">
      <Hero />
      <NewsTicker items={tickerItems} />
      <Reveal>
        <Stats postCount={postCount} years={years} />
      </Reveal>
      <Reveal>
        <MisiPilar />
      </Reveal>
      <Reveal>
        <ProfilKetua />
      </Reveal>
      <Reveal>
        <LegalitasStrip />
      </Reveal>
      <Reveal>
        <BeritaGaleri posts={recentPosts.slice(0, 3)} photos={photos} />
      </Reveal>
      <Reveal>
        <CtaKontak />
      </Reveal>
    </div>
  );
}

export const dynamic = "force-dynamic";
```

- [ ] **Step 2: Verify**

Run: `pnpm lint && pnpm build`
Expected: lulus; `/` dan `/berita` keduanya di output build.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: assemble institutional homepage"
```

---

### Task 16: Verifikasi akhir & E2E

- [ ] **Step 1: Lint + build penuh**

Run: `pnpm lint && pnpm build`
Expected: keduanya lulus tanpa error.

- [ ] **Step 2: Smoke manual (dev)**

Run: `pnpm dev`, buka `http://localhost:3000`.
Cek: 8 section tampil; ticker jalan & pause saat hover; stat count-up saat scroll; reveal halus; `/berita` menampilkan feed lama utuh; navbar "Berita" → `/berita`. Cek juga `prefers-reduced-motion` (DevTools → Rendering → Emulate CSS prefers-reduced-motion: reduce) → animasi mati, konten tetap tampil.

- [ ] **Step 3: E2E**

Run: `pnpm e2e`
Expected: suite lulus. Jika ada test yang meng-assert isi berita di `/` (home lama), update selector test agar menunjuk `/berita`. Catat perubahan test bila ada.

- [ ] **Step 4: Commit (jika ada perubahan test)**

```bash
git add -A
git commit -m "test: update E2E for /berita move"
```

---

## Self-Review

**Spec coverage:**
- Routing `/`→landing, `/berita`→feed, navbar → Task 2, 3, 15 ✓
- 8 section (hero, ticker, stats, misi-pilar, profil-ketua, legalitas, berita+galeri, cta) → Task 6–15 ✓
- Stat faktual saja (2017, Kemenkumham, count real, NKRI) → Task 9 + `getPostCount` Task 4 ✓
- News ticker infinite + pause hover + link → Task 6 ✓
- Framer Motion + `prefers-reduced-motion` → Task 1, 5, 6, 7 (semua hormati reduced motion) ✓
- Reuse PostCard/gradient/util, force-dynamic, id_ID → seluruh task ✓

**Placeholder scan:** Tidak ada TBD/TODO; semua step berisi kode lengkap. Fallback ikon lucide & field media diberi instruksi cek konkret (Task 10 Step 2, Task 13 Step 2).

**Type consistency:** `getPostCount(): number` (Task 4) dipakai di Task 15. `Stats({postCount, years})` cocok. `BeritaGaleri({posts, photos})` tipe `Post`/`Photo` cocok dengan field `getRecentPosts`/`getMediaByAlbum`. `NewsTicker({items:{title,slug}[]})` cocok dengan `tickerItems`. Konsisten ✓.
