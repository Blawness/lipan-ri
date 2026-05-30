<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# lipan-ri — LIPAN RI website

Indonesian non-profit org site. Next.js 16 App Router + PostgreSQL + Drizzle ORM + Tailwind v4 + shadcn/ui (base-nova style).

## Commands

| Command | What |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint (config in `eslint.config.mjs`) |
| `pnpm db:seed` | Seed DB via `tsx src/db/seed.ts` (requires `DATABASE_URL` and existing schema) |

Run `lint -> build` before declaring work complete.

## Key conventions

- **Path alias:** `@/` → `./src/*`
- **DB:** Drizzle ORM, PostgreSQL. Schema in `src/db/schema.ts`, migrations in `drizzle/`.
- **No tests configured.** No CI/GitHub Actions.
- **All pages use `export const dynamic = "force-dynamic"`** — no ISR.
- **Tailwind v4:** uses `@import "tailwindcss"` (NOT `@tailwind` directives) + `@tailwindcss/postcss` plugin.
- **shadcn style:** "base-nova" (not "new-york" or default).
- **Locale:** Indonesian (id_ID) throughout — UI text, dates, metadata.
- **"Tentang Kami" pages** store content as JSON in the `pages` DB table, rendered by component renderers in `src/app/tentang-kami/[slug]/page.tsx` based on `data.type` field.
- **No `asChild` pattern** on shadcn Button — use `render` prop instead (Next.js 16 breakage).
- **`"use client"` is required** for hooks, state, event handlers, and any component using shadcn interactive primitives (Sheet, DropdownMenu, etc).

## Directory layout

```
src/
  app/           # App Router pages
  db/            # Drizzle schema, client, seed
  lib/           # Data access (posts, categories, pages, media)
  components/
    layout/      # Header, Footer, MobileNav
    ui/          # shadcn primitives
    tentang-kami/ # Per-type page renderers
```
