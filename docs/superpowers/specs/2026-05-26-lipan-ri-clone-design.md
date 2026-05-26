# LIPAN RI Website Clone — Design Spec

**Date:** 2026-05-26
**Status:** Approved

## Overview

Clone lipan-ri.org — website portal berita untuk Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia (LIPAN RI) — menggunakan Next.js 16 dengan pendekatan full-custom (database + built-in admin foundation). Fase awal fokus pada frontend publik saja, dengan data di-seed langsung ke database. Admin panel dikerjakan di fase berikutnya.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Auth (future) | NextAuth.js v5 (Credentials provider) |
| Hosting | TBD (Vercel / Docker) |

## Visual Direction

**Modern Blue Gradient** — palet biru sebagai identitas LIPAN RI, dengan perpaduan:
- Primary: `#1e3a5f` (navy) hingga `#2563eb` (blue)
- Background: `#f0f4ff` (light blue tint)
- Accent: gradien biru untuk hero sections, card headers
- Text: slate tones (`#0f172a`, `#475569`, `#94a3b8`)
- Cards: putih dengan subtle shadow

## Page Structure

| Route | Description |
|-------|------------|
| `/` | Homepage — featured hero post, latest news grid, category sections, search |
| `/[slug]` | Article detail — full content, featured image, metadata, related posts |
| `/category/[slug]` | Category listing — paginated posts by category |
| `/tentang-kami/[slug]` | Static pages — profil lembaga, profil ketua, visi-misi, struktur, legalitas, lambang, maksud-tujuan |
| `/galeri` | Photo gallery — grid with lightbox |
| `/kontak` | Contact page — static info |

## Data Model

### posts
```
id: serial (PK)
slug: text (unique)
title: text
content: text (HTML/MDX)
excerpt: text
featured_image: text (URL)
category_id: integer (FK → categories.id)
author_id: integer (FK → users.id, nullable)
is_featured: boolean
status: enum('draft', 'published')
published_at: timestamp
created_at: timestamp
updated_at: timestamp
```

### categories
```
id: serial (PK)
slug: text (unique)
name: text
description: text
parent_id: integer (self-ref FK, nullable)
created_at: timestamp
```

### pages
```
id: serial (PK)
slug: text (unique)
title: text
content: text (HTML)
meta_description: text
updated_at: timestamp
```

### media
```
id: serial (PK)
url: text
alt_text: text
album: text (nullable)
uploaded_at: timestamp
```

### users (future admin)
```
id: serial (PK)
email: text (unique)
name: text
password_hash: text
role: enum('admin', 'editor')
created_at: timestamp
```

## Key Features

1. **SSR/ISR** — halaman di-render server-side dengan Incremental Static Regeneration untuk performa
2. **Full-text search** — PostgreSQL `tsvector`/`tsquery` untuk pencarian artikel
3. **Photo gallery** — grid layout dengan lightbox preview
4. **Responsive** — mobile-first, full responsive
5. **YouTube embed** — responsive video embed di konten
6. **SEO** — metadata per halaman, Open Graph tags, sitemap.xml
7. **Category navigation** — hierarchical category-based navigation

## Project Structure

```
lipan-ri/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Homepage
│   │   ├── [slug]/page.tsx     # Article detail
│   │   ├── category/[slug]/page.tsx
│   │   ├── tentang-kami/[slug]/page.tsx
│   │   ├── galeri/page.tsx
│   │   └── kontak/page.tsx
│   ├── components/             # Shared components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Header, Footer, Sidebar
│   │   └── features/           # PostCard, Gallery, Search
│   ├── db/
│   │   ├── schema.ts           # Drizzle schema
│   │   ├── index.ts            # DB connection
│   │   └── seed.ts             # Seed script
│   ├── lib/
│   │   ├── db.ts               # Query helpers
│   │   └── utils.ts
│   └── styles/
│       └── globals.css
├── drizzle.config.ts
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Out of Scope (Phase 1)

- Admin panel / dashboard
- Authentication
- Comment system
- Newsletter/subscription
- Social media sharing integrations
- Analytics

## Constraints

- Data awal diambil dari konten existing lipan-ri.org (scrape/manual)
- PostgreSQL harus tersedia di environment (local dev atau cloud)
- shadcn/ui components di-install via CLI, bukan manual copy-paste
