# LIPAN RI Website Clone — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern clone of lipan-ri.org using Next.js 16 with PostgreSQL + Drizzle + shadcn/ui, featuring a blue gradient theme. Phase 1 delivers the public frontend with seeded data.

**Architecture:** Next.js 16 App Router pages fetch data directly from PostgreSQL via Drizzle ORM. ISR used for post pages. Layout wraps all pages with shared Header/Footer. shadcn/ui provides accessible, themed components. No admin panel — content is database-seeded.

**Tech Stack:** Next.js 16, TypeScript, PostgreSQL, Drizzle ORM, Tailwind CSS v4, shadcn/ui, next-themes

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `.env`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `lib/utils.ts`

- [ ] **Step 1: Initialize the Next.js 16 project**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```

- [ ] **Step 2: Install core dependencies**

```bash
npm install drizzle-orm postgres dotenv
npm install -D drizzle-kit @types/pg
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

Select: TypeScript, `src/styles/globals.css`, `@/lib/utils`, default CSS variables.

- [ ] **Step 4: Verify project builds**

```bash
npm run dev
```

Visit http://localhost:3000 — should show default Next.js page.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: scaffold Next.js 16 project with shadcn/ui"
```

---

### Task 2: Database Schema & Connection

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/index.ts`
- Create: `drizzle.config.ts`
- Modify: `.env`

- [ ] **Step 1: Configure database connection**

Write `.env`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/lipanri
```

Write `.env.example`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/lipanri
```

- [ ] **Step 2: Define Drizzle schema**

Write `src/db/schema.ts`:

```typescript
import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

export const postStatusEnum = pgEnum("post_status", ["draft", "published"]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  role: text("role").default("editor"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  categoryId: integer("category_id").references(() => categories.id),
  authorId: integer("author_id").references(() => users.id),
  isFeatured: boolean("is_featured").default(false),
  status: postStatusEnum("status").default("draft"),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metaDescription: text("meta_description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  altText: text("alt_text"),
  album: text("album"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});
```

- [ ] **Step 3: Create database connection**

Write `src/db/index.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
```

- [ ] **Step 4: Configure Drizzle Kit**

Write `drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 5: Generate & push migration**

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

- [ ] **Step 6: Install shadcn/ui components**

```bash
npx shadcn@latest add button card badge input separator sheet dropdown-menu navigation-menu
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add database schema with Drizzle ORM"
```

---

### Task 3: Theme & Global Styles

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/lib/theme.ts`

- [ ] **Step 1: Customize the blue gradient theme**

Modify `src/app/globals.css` — replace the default shadcn CSS variables with LIPAN RI blue theme:

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 220 30% 98%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --primary: 221 83% 53%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 217 91% 60%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 210 40% 98%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 221 83% 53%;
    --radius: 0.5rem;
    --sidebar-background: 222 47% 15%;
    --sidebar-foreground: 210 40% 98%;
    --sidebar-primary: 217 91% 60%;
    --sidebar-primary-foreground: 0 0% 100%;
  }

  .dark {
    --background: 222 47% 6%;
    --foreground: 210 40% 98%;
    --card: 222 47% 10%;
    --card-foreground: 210 40% 98%;
    --popover: 222 47% 10%;
    --popover-foreground: 210 40% 98%;
    --primary: 217 91% 60%;
    --primary-foreground: 222 47% 11%;
    --secondary: 217 33% 18%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 33% 18%;
    --muted-foreground: 215 20% 65%;
    --accent: 217 33% 18%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 63% 31%;
    --destructive-foreground: 210 40% 98%;
    --border: 217 33% 18%;
    --input: 217 33% 18%;
    --ring: 224 76% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer utilities {
  .gradient-hero {
    background: linear-gradient(135deg, hsl(221, 83%, 53%), hsl(217, 91%, 45%));
  }
  .gradient-header {
    background: linear-gradient(135deg, hsl(222, 47%, 15%), hsl(221, 83%, 30%));
  }
}
```

- [ ] **Step 2: Verify styles load**

Run `npm run dev` and check the page — backgrounds and text should use the blue theme.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add LIPAN RI blue gradient theme"
```

---

### Task 4: Layout — Header, Footer, Navigation

**Files:**
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/footer.tsx`
- Create: `src/components/layout/mobile-nav.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create Header component**

Write `src/components/layout/header.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { MobileNav } from "./mobile-nav";

const mainNav = [
  { label: "Berita", href: "/" },
  { label: "Press Rilis", href: "/category/press-rilis" },
  { label: "Tentang Kami", href: "/tentang-kami/sekilas-lipan-ri" },
  { label: "Galeri", href: "/galeri" },
  { label: "Kontak", href: "/kontak" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-sm">
              LR
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-blue-900 leading-tight">LIPAN RI</div>
              <div className="text-[10px] text-blue-500 tracking-widest uppercase leading-tight">
                Independen
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {mainNav.map((item) => (
              <Button key={item.href} variant="ghost" size="sm" asChild>
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <form action="/search" className="hidden sm:flex items-center">
            <Input
              name="q"
              placeholder="Cari..."
              className="w-40 h-8 text-xs"
            />
          </form>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create Mobile Navigation**

Write `src/components/layout/mobile-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const mainNav = [
  { label: "Berita", href: "/" },
  { label: "Press Rilis", href: "/category/press-rilis" },
  { label: "Tentang Kami", href: "/tentang-kami/sekilas-lipan-ri" },
  { label: "Galeri", href: "/galeri" },
  { label: "Kontak", href: "/kontak" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64 pt-12">
        <nav className="flex flex-col gap-2">
          {mainNav.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              className="justify-start"
              asChild
              onClick={() => setOpen(false)}
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 3: Create Footer component**

Write `src/components/layout/footer.tsx`:

```tsx
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="gradient-header text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3">LIPAN RI</h3>
            <p className="text-sm text-blue-200 leading-relaxed">
              Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia.
              Lembaga independen milik masyarakat yang berkomitmen mengawal aset negara.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-3">Tautan</h3>
            <ul className="space-y-1 text-sm text-blue-200">
              <li><Link href="/tentang-kami/sekilas-lipan-ri" className="hover:text-white transition-colors">Profil Lembaga</Link></li>
              <li><Link href="/tentang-kami/struktur" className="hover:text-white transition-colors">Struktur Organisasi</Link></li>
              <li><Link href="/galeri" className="hover:text-white transition-colors">Galeri</Link></li>
              <li><Link href="/kontak" className="hover:text-white transition-colors">Hubungi Kami</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-3">Kontak</h3>
            <div className="text-sm text-blue-200 space-y-1">
              <p>Gedung YARNATI Lt. 4 Ruang 407-408</p>
              <p>Jl. Proklamasi No. 44, Menteng</p>
              <p>Jakarta Pusat 10320</p>
              <p className="mt-2">Telp: 021-392-8018</p>
              <p>Email: dpn.lipanri@gmail.com</p>
            </div>
          </div>
        </div>
        <Separator className="my-8 bg-blue-700/50" />
        <p className="text-center text-sm text-blue-300">
          Copyright &copy; {new Date().getFullYear()} LIPAN RI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Update root layout**

Modify `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "LIPAN RI - Lembaga Investigasi dan Pengawasan Aset Negara",
    template: "%s | LIPAN RI",
  },
  description:
    "Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia. Lembaga independen yang mengawal aset negara.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify layout renders**

Run `npm run dev`. Visit http://localhost:3000 — should see header, empty main, and footer.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add header, footer, and mobile navigation"
```

---

### Task 5: Data Access Layer

**Files:**
- Create: `src/lib/posts.ts`
- Create: `src/lib/categories.ts`
- Create: `src/lib/pages.ts`
- Create: `src/lib/media.ts`

- [ ] **Step 1: Posts data access**

Write `src/lib/posts.ts`:

```typescript
import { db } from "@/db";
import { posts, categories } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function getFeaturedPosts(limit = 5) {
  return db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      featuredImage: posts.featuredImage,
      publishedAt: posts.publishedAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(eq(posts.status, "published"), eq(posts.isFeatured, true)))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}

export async function getPostBySlug(slug: string) {
  const results = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      content: posts.content,
      excerpt: posts.excerpt,
      featuredImage: posts.featuredImage,
      publishedAt: posts.publishedAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);

  return results[0] ?? null;
}

export async function getRecentPosts(limit = 6, excludeSlug?: string) {
  const conditions = [eq(posts.status, "published")];
  const result = db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      featuredImage: posts.featuredImage,
      publishedAt: posts.publishedAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);

  return result;
}

export async function getPostsByCategory(
  categorySlug: string,
  limit = 10,
  offset = 0
) {
  return db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      featuredImage: posts.featuredImage,
      publishedAt: posts.publishedAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(
      and(
        eq(categories.slug, categorySlug),
        eq(posts.status, "published")
      )
    )
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset);
}

export async function searchPosts(query: string, limit = 20) {
  const sanitized = query.replace(/[^\w\s]/g, "").trim().split(/\s+/).join(" & ");
  return db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      featuredImage: posts.featuredImage,
      publishedAt: posts.publishedAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(
      and(
        eq(posts.status, "published"),
        // Fallback to ILIKE until tsvector is added
      )
    )
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}
```

- [ ] **Step 2: Categories data access**

Write `src/lib/categories.ts`:

```typescript
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getAllCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

export async function getCategoryBySlug(slug: string) {
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return result[0] ?? null;
}
```

- [ ] **Step 3: Pages data access**

Write `src/lib/pages.ts`:

```typescript
import { db } from "@/db";
import { pages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getPageBySlug(slug: string) {
  const result = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, slug))
    .limit(1);
  return result[0] ?? null;
}

export async function getAllPages() {
  return db.select({
    slug: pages.slug,
    title: pages.title,
  }).from(pages);
}
```

- [ ] **Step 4: Media data access**

Write `src/lib/media.ts`:

```typescript
import { db } from "@/db";
import { media } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getMediaByAlbum(album: string) {
  return db
    .select()
    .from(media)
    .where(eq(media.album, album))
    .orderBy(media.uploadedAt);
}

export async function getAllAlbums() {
  const result = await db
    .selectDistinct({ album: media.album })
    .from(media);
  return result.map((r) => r.album).filter(Boolean) as string[];
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add data access layer for posts, categories, pages, media"
```

---

### Task 6: Seed Data

**Files:**
- Create: `src/db/seed.ts`
- Modify: `package.json` (add seed script)

- [ ] **Step 1: Create seed script**

Write `src/db/seed.ts`:

```typescript
import "dotenv/config";
import { db } from "./index";
import { categories, posts, pages, users } from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  // Default user (for future admin)
  await db.insert(users).values({
    email: "admin@lipan-ri.org",
    name: "Admin LIPAN RI",
    role: "admin",
  }).onConflictDoNothing();

  // Categories
  const categoryData = [
    { slug: "berita", name: "Berita", description: "Berita utama LIPAN RI" },
    { slug: "press-rilis", name: "Press Rilis", description: "Siaran pers resmi LIPAN RI" },
    { slug: "opini-dan-kajian", name: "Opini dan Kajian", description: "Opini dan kajian dari LIPAN RI" },
    { slug: "profil-lembaga", name: "Profil Lembaga", description: "Tentang LIPAN RI" },
    { slug: "profil-ketua-lipan-ri", name: "Profil Ketua Lipan RI", description: "Profil pimpinan LIPAN RI" },
    { slug: "visi-misi-motto", name: "Visi Misi & Motto", description: "Visi, misi, dan motto LIPAN RI" },
    { slug: "struktur-organisasi", name: "Struktur Organisasi", description: "Struktur organisasi LIPAN RI" },
    { slug: "legalitas-lembaga", name: "Legalitas Lembaga", description: "Legalitas LIPAN RI" },
    { slug: "lambang-lembaga", name: "Lambang Lembaga", description: "Arti lambang LIPAN RI" },
    { slug: "maksud-dan-tujuan", name: "Maksud dan Tujuan", description: "Maksud dan tujuan LIPAN RI" },
    { slug: "galeri-foto", name: "Galeri Foto", description: "Galeri foto kegiatan" },
    { slug: "hubungi-kami", name: "Hubungi Kami", description: "Kontak LIPAN RI" },
  ];

  for (const cat of categoryData) {
    await db.insert(categories).values(cat).onConflictDoNothing();
  }

  const beritaId = (await db.select().from(categories).where(eq(categories.slug, "berita")).limit(1))[0]?.id;
  const pressRilisId = (await db.select().from(categories).where(eq(categories.slug, "press-rilis")).limit(1))[0]?.id;

  // Sample posts
  const postData = [
    {
      slug: "terkait-permohonan-sertifikat-ganda-bpn-lombok-tengah-di-geruduk-massa",
      title: "Terkait Permohonan Sertifikat Ganda, BPN Lombok Tengah di geruduk Massa",
      excerpt: "Lombok Tengah - Forum Rakyat Bersatu (FRB) bersama keluarga besar Mamiq Kalsum, Lombok Tengah (Loteng) Nusa Tenggara Barat (NTB) menggeruduk Kantor Pertanahan (Kantah) BPN/ATR Lombok Tengah, Senin 29 September 2025.",
      content: `<p>Lombok Tengah - Forum Rakyat Bersatu (FRB) bersama keluarga besar Mamiq Kalsum, Lombok Tengah (Loteng) Nusa Tenggara Barat (NTB) menggeruduk Kantor Pertanahan (Kantah) BPN/ATR Lombok Tengah, Senin 29 September 2025. Mereka mendesak Kepala Kantah Loteng untuk segera menindaklanjuti permohonan pendaftaran tanah yang diajukan sejak tahun 2018 silam.</p><p>Ketua FRB menyatakan bahwa permohonan sertifikat yang diajukan oleh Mamiq Kalsum tidak kunjung diproses oleh BPN Lombok Tengah, sementara pihak lain justru mengajukan permohonan sertifikat di atas objek tanah yang sama.</p>`,
      categoryId: beritaId,
      isFeatured: true,
      status: "published" as const,
      publishedAt: new Date("2025-09-30"),
    },
    {
      slug: "kuasa-hukum-minta-surat-keputusan-pembatalan-shm-ni-wayan-dontri-dibatalkan",
      title: "Kuasa Hukum Minta Surat Keputusan Pembatalan SHM Ni Wayan Dontri Dibatalkan",
      excerpt: "Bali - Kuasa hukum Ni Wayan Dontri, Veronika Giron, S.H., menyampaikan klarifikasi sekaligus koreksi terhadap pernyataan Kepala Kantor Pertanahan.",
      content: `<p>Bali - Kuasa hukum Ni Wayan Dontri, Veronika Giron, S.H., menyampaikan klarifikasi sekaligus koreksi terhadap pernyataan Kepala Kantor Pertanahan Kabupaten Buleleng terkait pembatalan Sertifikat Hak Milik (SHM) atas nama Ni Wayan Dontri.</p><p>Veronika menegaskan bahwa kliennya memiliki bukti kepemilikan yang sah dan meminta agar Surat Keputusan Pembatalan SHM tersebut dibatalkan demi hukum.</p>`,
      categoryId: beritaId,
      status: "published" as const,
      publishedAt: new Date("2025-09-19"),
    },
    {
      slug: "ketua-lipan-ri-turun-gunung-soroti-proses-sertifikasi-lahan-di-lombok-tengah",
      title: "Ketua LIPAN RI Turun Gunung Soroti Proses Sertifikasi Lahan Di Lombok Tengah",
      excerpt: "Mataram - Menindaklanjuti banyaknya pengaduan masyarakat dan maraknya Oknum Mafia Tanah dan oknum Mafia Hukum.",
      content: `<p>Mataram - Menindaklanjuti banyaknya pengaduan masyarakat dan maraknya Oknum Mafia Tanah dan oknum Mafia Hukum serta persoalan sengketa lahan di Provinsi Nusa Tenggara Barat, Ketua Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia (LIPAN RI) Harun Prayitno, SE., SH., MH turun langsung ke Lombok Tengah.</p><p>Kehadiran Ketua LIPAN RI di Lombok Tengah disambut antusias oleh masyarakat yang berharap ada solusi atas persoalan sertifikasi lahan yang mereka hadapi.</p>`,
      categoryId: pressRilisId,
      isFeatured: true,
      status: "published" as const,
      publishedAt: new Date("2025-07-25"),
    },
    {
      slug: "ketua-lipan-ri-tegaskan-pentingnya-kolaborasi-antar-instansi-dalam-pensertipikatan-aset-tanah-bmd-pemprov-dki-jakarta",
      title: "Ketua LIPAN RI Tegaskan Pentingnya Kolaborasi Antar Instansi Dalam Pensertipikatan Aset Tanah BMD Pemprov DKI Jakarta",
      excerpt: "Jakarta - BPAD DKI Jakarta menggelar kegiatan Focus Group Discussion (FGD) Percepatan Pensertifikatan Barang Milik Daerah.",
      content: `<p>Jakarta - BPAD DKI Jakarta menggelar kegiatan Focus Group Discussion (FGD) Percepatan Pensertifikatan Barang Milik Daerah (BMD) berupa tanah Pemerintah Provinsi DKI Jakarta. Kegiatan ini dihadiri oleh berbagai instansi terkait.</p><p>Ketua LIPAN RI Harun Prayitno menegaskan pentingnya kolaborasi antar instansi dalam pensertipikatan aset tanah BMD Pemprov DKI Jakarta. Beliau menyatakan bahwa sinergi antar lembaga adalah kunci keberhasilan program sertifikasi.</p>`,
      categoryId: pressRilisId,
      status: "published" as const,
      publishedAt: new Date("2025-07-23"),
    },
  ];

  for (const post of postData) {
    await db.insert(posts).values(post).onConflictDoNothing();
  }

  // Pages
  const pageData = [
    {
      slug: "sekilas-lipan-ri",
      title: "Sekilas LIPAN RI",
      content: `<p>LIPAN-RI adalah Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia, suatu Lembaga independen milik masyarakat yang berkomitmen untuk mengawal dan mengawasi aset-aset negara agar tidak diselewengkan.</p><p>Lembaga ini didirikan dengan semangat untuk menjaga kedaulatan aset negara dan memastikan bahwa kekayaan negara dikelola secara transparan dan akuntabel.</p>`,
      metaDescription: "Sekilas tentang LIPAN RI - Lembaga Investigasi dan Pengawasan Aset Negara",
    },
    {
      slug: "struktur",
      title: "Struktur Organisasi",
      content: `<p>STRUKTUR ORGANISASI LIPAN-RI terdiri dari:</p><ul><li>Pelindung Utama</li><li>Pelindung</li><li>Dewan Pembina</li><li>Dewan Penasehat / Kehormatan</li><li>Dewan Pengawas</li><li>Ketua</li><li>Wakil Ketua</li><li>Sekretaris Jenderal</li><li>Bendahara</li><li>Divisi-divisi</li></ul>`,
      metaDescription: "Struktur Organisasi LIPAN RI",
    },
    {
      slug: "profil-ketua",
      title: "Profil Ketua LIPAN RI",
      content: `<p>Ketua Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia (LIPAN RI) Harun Prayitno, SE., SH., MH merupakan seorang tokoh yang memiliki dedikasi tinggi dalam pengawasan aset negara.</p><p>Dengan latar belakang pendidikan Sarjana Ekonomi, Sarjana Hukum, dan Magister Hukum, beliau memimpin LIPAN RI dengan prinsip integritas dan profesionalisme.</p>`,
      metaDescription: "Profil Ketua LIPAN RI Harun Prayitno, SE, SH, MH",
    },
    {
      slug: "visi-misi",
      title: "Visi Misi & Motto",
      content: `<p><strong>Visi:</strong> Menjadi lembaga independen terdepan dalam investigasi dan pengawasan aset negara di Indonesia.</p><p><strong>Misi:</strong></p><ul><li>Melakukan investigasi terhadap dugaan penyelewengan aset negara</li><li>Mengawasi pengelolaan aset negara secara transparan</li><li>Memberikan advokasi kepada masyarakat terkait sengketa aset</li></ul>`,
      metaDescription: "Visi, Misi, dan Motto LIPAN RI",
    },
    {
      slug: "legalitas",
      title: "Legalitas Lembaga",
      content: `<p>LIPAN RI memiliki legalitas yang sah sesuai dengan peraturan perundang-undangan yang berlaku di Indonesia, termasuk:</p><ul><li>Akta Pendirian</li><li>SK Kemenkumham</li><li>Sertifikat Merek LIPAN RI</li></ul>`,
      metaDescription: "Legalitas LIPAN RI",
    },
    {
      slug: "arti-lambang",
      title: "Arti Lambang",
      content: `<p>LIPAN-RI berlambangkan bangun segi lima yang mengandung arti bahwa LIPAN-RI berazaskan Pancasila dan UUD 1945.</p><p>Warna biru melambangkan keteguhan dan profesionalisme, sedangkan warna merah melambangkan keberanian dalam menegakkan kebenaran.</p>`,
      metaDescription: "Arti Lambang LIPAN RI",
    },
    {
      slug: "maksud-dan-tujuan",
      title: "Maksud dan Tujuan",
      content: `<p>Maksud dan tujuan didirikannya LIPAN RI adalah untuk membantu pemerintah dalam mengawasi dan menjaga aset-aset negara agar tetap berada dalam penguasaan negara dan tidak diselewengkan oleh pihak yang tidak bertanggung jawab.</p>`,
      metaDescription: "Maksud dan Tujuan LIPAN RI",
    },
  ];

  for (const page of pageData) {
    await db.insert(pages).values(page).onConflictDoNothing();
  }

  console.log("✅ Database seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Add seed script to package.json**

In `package.json`, add to `"scripts"`:

```json
"db:seed": "tsx src/db/seed.ts"
```

- [ ] **Step 3: Install tsx**

```bash
npm install -D tsx
```

- [ ] **Step 4: Run seed**

```bash
npm run db:seed
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add seed data for categories, posts, and pages"
```

---

### Task 7: Homepage

**Files:**
- Create: `src/components/featured-post.tsx`
- Create: `src/components/post-card.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create FeaturedPost component**

Write `src/components/featured-post.tsx`:

```tsx
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface FeaturedPostProps {
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  publishedAt: Date | null;
}

export function FeaturedPost({
  title,
  slug,
  excerpt,
  featuredImage,
  categoryName,
  categorySlug,
  publishedAt,
}: FeaturedPostProps) {
  return (
    <Link href={`/${slug}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white min-h-[360px] flex flex-col justify-end p-8">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-950/20 to-transparent" />
        <div className="relative z-10">
          {categoryName && (
            <Badge className="mb-3 bg-blue-400/20 text-blue-200 hover:bg-blue-400/30 border-0">
              {categoryName}
            </Badge>
          )}
          <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:underline">
            {title}
          </h2>
          <p className="text-blue-200/80 line-clamp-2 mb-4">{excerpt}</p>
          {publishedAt && (
            <div className="flex items-center gap-1 text-sm text-blue-300">
              <Calendar className="h-3 w-3" />
              {new Date(publishedAt).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Create PostCard component**

Write `src/components/post-card.tsx`:

```tsx
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface PostCardProps {
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  publishedAt: Date | null;
}

export function PostCard({
  title,
  slug,
  excerpt,
  featuredImage,
  categoryName,
  publishedAt,
}: PostCardProps) {
  return (
    <Link href={`/${slug}`} className="group">
      <Card className="h-full overflow-hidden border-blue-100 hover:border-blue-300 hover:shadow-md transition-all duration-200">
        <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
          {featuredImage ? (
            <img
              src={featuredImage}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-blue-300 text-4xl font-bold">LR</div>
          )}
        </div>
        <CardContent className="p-4">
          {categoryName && (
            <Badge variant="secondary" className="mb-2 text-xs">
              {categoryName}
            </Badge>
          )}
          <h3 className="font-semibold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {excerpt}
          </p>
          {publishedAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(publishedAt).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 3: Build homepage**

Write `src/app/page.tsx`:

```tsx
import { getFeaturedPosts, getRecentPosts } from "@/lib/posts";
import { FeaturedPost } from "@/components/featured-post";
import { PostCard } from "@/components/post-card";

export default async function HomePage() {
  const featuredPosts = await getFeaturedPosts(5);
  const recentPosts = await getRecentPosts(6);
  const mainFeatured = featuredPosts[0];
  const otherFeatured = featuredPosts.slice(1);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-hero text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            LIPAN RI
          </h1>
          <p className="text-lg md:text-xl text-blue-200 max-w-2xl mx-auto">
            Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia
          </p>
          <p className="text-sm text-blue-300 mt-2">
            Independen &bull; Berintegritas &bull; Profesional
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Featured Post */}
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

        {/* Other Featured */}
        {otherFeatured.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-blue-900 mb-5 border-b border-blue-100 pb-2">
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

        {/* Recent Posts */}
        <section>
          <h2 className="text-xl font-bold text-blue-900 mb-5 border-b border-blue-100 pb-2">
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
    </div>
  );
}

export const dynamic = "force-dynamic";
```

- [ ] **Step 4: Verify homepage renders**

Run `npm run dev` → visit http://localhost:3000. Should show hero, featured post, and post grid.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add homepage with featured and recent posts"
```

---

### Task 8: Article Detail & Category Pages

**Files:**
- Create: `src/app/[slug]/page.tsx`
- Create: `src/app/category/[slug]/page.tsx`

- [ ] **Step 1: Article detail page**

Write `src/app/[slug]/page.tsx`:

```tsx
import { getPostBySlug, getRecentPosts } from "@/lib/posts";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Tidak Ditemukan" };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const relatedPosts = await getRecentPosts(4, slug);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali
        </Link>
      </Button>

      <article>
        {post.categoryName && (
          <Badge className="mb-3">{post.categoryName}</Badge>
        )}

        <h1 className="text-2xl md:text-4xl font-bold text-blue-900 mb-4 leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Calendar className="h-4 w-4" />
          {post.publishedAt &&
            new Date(post.publishedAt).toLocaleDateString("id-ID", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
        </div>

        {post.featuredImage && (
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full rounded-lg mb-8 object-cover max-h-96"
          />
        )}

        <div
          className="prose prose-blue max-w-none prose-headings:text-blue-900 prose-a:text-blue-600"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-12 pt-8 border-t">
          <h2 className="text-xl font-bold text-blue-900 mb-4">
            Berita Terkait
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedPosts.map((p) => (
              <Link
                key={p.id}
                href={`/${p.slug}`}
                className="group block p-4 rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <h3 className="font-semibold text-sm group-hover:text-blue-700 transition-colors line-clamp-2">
                  {p.title}
                </h3>
                {p.publishedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(p.publishedAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Category listing page**

Write `src/app/category/[slug]/page.tsx`:

```tsx
import { getPostsByCategory } from "@/lib/posts";
import { getCategoryBySlug } from "@/lib/categories";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Kategori Tidak Ditemukan" };
  return {
    title: category.name,
    description: category.description ?? undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  const posts = await getPostsByCategory(slug, 12);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="gradient-hero text-white rounded-xl p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-blue-200">{category.description}</p>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          Belum ada artikel dalam kategori ini.
        </p>
      ) : (
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
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify pages**

Visit `/berita` and `/[any-slug]`. Should render properly with Drizzle data.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add article detail and category pages"
```

---

### Task 9: Static Pages & Gallery

**Files:**
- Create: `src/app/tentang-kami/[slug]/page.tsx`
- Create: `src/app/galeri/page.tsx`
- Create: `src/app/kontak/page.tsx`

- [ ] **Step 1: Static pages (Tentang Kami)**

Write `src/app/tentang-kami/[slug]/page.tsx`:

```tsx
import { getPageBySlug } from "@/lib/pages";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return { title: "Halaman Tidak Ditemukan" };
  return {
    title: page.title,
    description: page.metaDescription ?? undefined,
  };
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) notFound();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-6">
        {page.title}
      </h1>
      <div
        className="prose prose-blue max-w-none prose-headings:text-blue-900"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Gallery page**

Write `src/app/galeri/page.tsx`:

```tsx
import { getMediaByAlbum } from "@/lib/media";

export default async function GalleryPage() {
  const photos = await getMediaByAlbum("dokumen-ketua");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="gradient-hero text-white rounded-xl p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Galeri Foto</h1>
        <p className="mt-2 text-blue-200">
          Dokumentasi kegiatan LIPAN RI
        </p>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-muted-foreground text-lg">Belum ada foto tersedia.</p>
          <p className="text-muted-foreground text-sm mt-1">
            Foto-foto kegiatan akan ditampilkan di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <a
              key={photo.id}
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square rounded-lg overflow-hidden border border-blue-100 hover:border-blue-400 hover:shadow-lg transition-all group"
            >
              <img
                src={photo.url}
                alt={photo.altText ?? "Foto kegiatan LIPAN RI"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Contact page**

Write `src/app/kontak/page.tsx`:

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, Mail, Globe } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="gradient-hero text-white rounded-xl p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Hubungi Kami</h1>
        <p className="mt-2 text-blue-200">
          Informasi kontak resmi LIPAN RI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-blue-100">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Alamat Kantor</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Gedung Yayasan Purna Bakti (YARNATI)<br />
                  Lt. 4 Ruang 407-408<br />
                  Jl. Proklamasi No. 44<br />
                  Pegangsaan, Menteng<br />
                  Jakarta Pusat 10320
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Telepon</h3>
                <p className="text-sm text-muted-foreground mt-1">021-392-8018</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Email</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  dpn.lipanri@gmail.com
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Website</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  www.lipan-ri.org
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardContent className="p-6">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.4!2d106.847!3d-6.183!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sJl.%20Proklamasi%20No.44%20Jakarta%20Pusat!5e0!3m2!1sen!2sid!4v1690000000000"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-lg"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify all pages**

Visit `/tentang-kami/sekilas-lipan-ri`, `/galeri`, `/kontak` — all should render.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add static pages, gallery, and contact page"
```

---

### Task 10: Search Functionality

**Files:**
- Create: `src/app/search/page.tsx`
- Modify: `src/lib/posts.ts` (update searchPosts)

- [ ] **Step 1: Fix searchPosts with ILIKE fallback**

Modify `src/lib/posts.ts` — replace the `searchPosts` function body:

```typescript
import { ilike, or } from "drizzle-orm";

export async function searchPosts(query: string, limit = 20) {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const conditions = terms.map((term) =>
    or(
      ilike(posts.title, `%${term}%`),
      ilike(posts.excerpt, `%${term}%`),
      ilike(posts.content, `%${term}%`)
    )
  );

  return db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      featuredImage: posts.featuredImage,
      publishedAt: posts.publishedAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(and(eq(posts.status, "published"), ...conditions))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}
```

Note: Make sure the import in `src/lib/posts.ts` has `ilike` and `or` added to the drizzle-orm import line:

```typescript
import { eq, desc, and, ilike, or } from "drizzle-orm";
```

- [ ] **Step 2: Create search results page**

Write `src/app/search/page.tsx`:

```tsx
import { searchPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export const metadata: Metadata = {
  title: "Pencarian",
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const results = q ? await searchPosts(q) : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">Pencarian</h1>

      <form action="/search" className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Cari artikel..."
            defaultValue={q ?? ""}
            className="pl-10 h-11"
          />
        </div>
      </form>

      {q && (
        <p className="text-sm text-muted-foreground mb-6">
          {results.length} hasil untuk &quot;{q}&quot;
        </p>
      )}

      {results.length === 0 && q ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            Tidak ada hasil untuk &quot;{q}&quot;
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Coba kata kunci lain.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {results.map((post) => (
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
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify search**

Visit `/search?q=sertifikat` — should return matching articles.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add search functionality with ILIKE"
```

---

### Task 11: Polish & SEO

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Create: `src/app/not-found.tsx`
- Modify: `src/app/layout.tsx` (enhance metadata)

- [ ] **Step 1: Sitemap**

Write `src/app/sitemap.ts`:

```typescript
import type { MetadataRoute } from "next";
import { db } from "@/db";
import { posts, pages, categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://lipan-ri.org";

  const allPosts = await db
    .select({ slug: posts.slug, updatedAt: posts.updatedAt })
    .from(posts)
    .where(eq(posts.status, "published"));

  const allPages = await db
    .select({ slug: pages.slug, updatedAt: pages.updatedAt })
    .from(pages);

  const allCategories = await db
    .select({ slug: categories.slug })
    .from(categories);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/galeri`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/kontak`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const postRoutes: MetadataRoute.Sitemap = allPosts.map((p) => ({
    url: `${baseUrl}/${p.slug}`,
    lastModified: p.updatedAt ?? new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const pageRoutes: MetadataRoute.Sitemap = allPages.map((p) => ({
    url: `${baseUrl}/tentang-kami/${p.slug}`,
    lastModified: p.updatedAt ?? new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = allCategories.map((c) => ({
    url: `${baseUrl}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes, ...pageRoutes, ...categoryRoutes];
}
```

- [ ] **Step 2: Robots**

Write `src/app/robots.ts`:

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://lipan-ri.org/sitemap.xml",
  };
}
```

- [ ] **Step 3: Not Found page**

Write `src/app/not-found.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-blue-900 mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Halaman tidak ditemukan
      </p>
      <Button asChild>
        <Link href="/">Kembali ke Beranda</Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Enhance layout metadata**

Modify `src/app/layout.tsx` — update the `metadata` export:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://lipan-ri.org"),
  title: {
    default: "LIPAN RI - Lembaga Investigasi dan Pengawasan Aset Negara",
    template: "%s | LIPAN RI",
  },
  description:
    "Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia. Lembaga independen milik masyarakat yang berkomitmen mengawal aset negara.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "LIPAN RI",
    title: "LIPAN RI - Lembaga Investigasi dan Pengawasan Aset Negara",
    description:
      "Lembaga independen milik masyarakat yang berkomitmen mengawal aset negara.",
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

Add the import at top: `import type { Metadata } from "next";` (already exists, ensure it's there).

- [ ] **Step 5: Verify**

Visit `/sitemap.xml`, `/robots.txt`, `/not-a-real-page` — all should work.

- [ ] **Step 6: Final build check**

```bash
npm run build
```

Ensure no build errors. Fix any type errors.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add sitemap, robots, 404 page, and OG metadata"
```

---

## Future: Phase 2 (Admin Panel)

Out of scope for this plan. Will be covered in a separate spec and plan:
- NextAuth.js authentication
- Admin dashboard with post CRUD
- Media upload management
- Page content editor
