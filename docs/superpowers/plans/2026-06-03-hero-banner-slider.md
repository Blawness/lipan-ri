# Hero Banner Slider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static gradient hero with an admin-managed, auto-playing, swipeable banner slider on the homepage.

**Architecture:** A new `banners` DB table holds slide rows (image + optional overlay text/CTA + order + active flag). The public `Hero` becomes an async server component that reads active banners (falling back to one hardcoded default slide) and hands them to a `HeroSlider` client component built on the shadcn Carousel (Embla) with the autoplay plugin. A new `/admin/banners` page provides CRUD + reorder + toggle via server actions, reusing the existing R2 `ImageUpload` component.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM (PostgreSQL/Neon), Tailwind v4, shadcn/ui (base-nova), `embla-carousel-react` + `embla-carousel-autoplay`.

---

## Project conventions that govern this plan

- **No unit tests configured.** The project verifies via `pnpm lint` → `pnpm build`, manual checks, and Playwright E2E (`pnpm e2e`). This plan follows that convention instead of unit-TDD. CLAUDE.md/AGENTS.md override the default TDD skill here.
- **`export const dynamic = "force-dynamic"`** on every page.
- **shadcn Button:** use the `render` prop, NOT `asChild` (Next 16 breakage).
- **`"use client"`** required for hooks/state/event handlers.
- **R2 images:** render with the existing `SafeImage` component (plain `<img>` + graceful fallback) — `next/image` remotePatterns is intentionally NOT configured.
- **Path alias:** `@/` → `src/*`.
- **dev & prod share one Neon DB** — schema changes are applied with care; adding a new table is additive and safe.

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `src/db/schema.ts` | Add `banners` table | Modify |
| `drizzle/000N_*.sql` | Generated migration | Create (via drizzle-kit) |
| `src/lib/banners.ts` | Public read: `getActiveBanners()` + `Banner` type | Create |
| `src/lib/admin/banners.ts` | Admin CRUD/reorder/toggle data access | Create |
| `src/components/home/hero-slider.tsx` | Client carousel UI | Create |
| `src/components/home/hero.tsx` | Async server wrapper + default-slide fallback | Modify |
| `src/components/ui/carousel.tsx` | shadcn carousel primitive | Create (via shadcn CLI) |
| `src/app/admin/banners/actions.ts` | Server actions | Create |
| `src/app/admin/banners/page.tsx` | Admin list + add form | Create |
| `src/app/admin/banners/banner-form.tsx` | Client add/edit form (uses `ImageUpload`) | Create |
| `src/app/admin/sidebar.tsx` | Add "Banner" nav link | Modify |
| `e2e/admin.spec.ts` | Add `/admin/banners` smoke load | Modify |

---

## Task 1: Add the `banners` table to the schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Append the table definition**

Add at the end of `src/db/schema.ts` (the file already imports `pgTable, serial, text, integer, timestamp, boolean`):

```ts
export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  title: text("title"),
  subtitle: text("subtitle"),
  buttonText: text("button_text"),
  buttonLink: text("button_link"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
```

- [ ] **Step 2: Generate the migration**

Run: `pnpm dlx drizzle-kit generate`
Expected: a new `drizzle/000N_*.sql` file is created containing `CREATE TABLE "banners"`.

- [ ] **Step 3: Apply the migration to the DB**

Run: `pnpm dlx drizzle-kit push`
Expected: `[✓] Changes applied` (creates the `banners` table). Requires `DATABASE_URL` set. This is additive (new table), safe on the shared Neon DB.

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat(db): add banners table for hero slider"
```

---

## Task 2: Public data access — `getActiveBanners()`

**Files:**
- Create: `src/lib/banners.ts`

- [ ] **Step 1: Write the module**

```ts
import { db } from "@/db";
import { banners } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export type Banner = typeof banners.$inferSelect;

export async function getActiveBanners(): Promise<Banner[]> {
  return db
    .select()
    .from(banners)
    .where(eq(banners.isActive, true))
    .orderBy(asc(banners.sortOrder), asc(banners.id));
}
```

- [ ] **Step 2: Typecheck via build later (no standalone test).** Confirm the file has no obvious type errors by running:

Run: `pnpm lint`
Expected: no errors for `src/lib/banners.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/banners.ts
git commit -m "feat(lib): add getActiveBanners data access"
```

---

## Task 3: Admin data access — CRUD / reorder / toggle

**Files:**
- Create: `src/lib/admin/banners.ts`

- [ ] **Step 1: Write the module**

```ts
import { db } from "@/db";
import { banners } from "@/db/schema";
import { eq, asc, gt, lt, and, desc } from "drizzle-orm";

export type BannerInput = {
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  buttonLink: string | null;
};

export async function listBanners() {
  return db
    .select()
    .from(banners)
    .orderBy(asc(banners.sortOrder), asc(banners.id));
}

export async function getBanner(id: number) {
  const [row] = await db.select().from(banners).where(eq(banners.id, id));
  return row ?? null;
}

export async function createBanner(input: BannerInput) {
  // place new banner at the end
  const [last] = await db
    .select({ sortOrder: banners.sortOrder })
    .from(banners)
    .orderBy(desc(banners.sortOrder))
    .limit(1);
  const nextOrder = (last?.sortOrder ?? 0) + 1;
  await db.insert(banners).values({ ...input, sortOrder: nextOrder });
}

export async function updateBanner(id: number, input: BannerInput) {
  await db.update(banners).set(input).where(eq(banners.id, id));
}

export async function deleteBanner(id: number) {
  await db.delete(banners).where(eq(banners.id, id));
}

export async function toggleBanner(id: number) {
  const row = await getBanner(id);
  if (!row) return;
  await db
    .update(banners)
    .set({ isActive: !row.isActive })
    .where(eq(banners.id, id));
}

/** Swap sort_order with the adjacent banner in the given direction. */
export async function reorderBanner(id: number, dir: "up" | "down") {
  const current = await getBanner(id);
  if (current == null || current.sortOrder == null) return;

  const neighbor = dir === "up"
    ? (await db
        .select()
        .from(banners)
        .where(and(lt(banners.sortOrder, current.sortOrder)))
        .orderBy(desc(banners.sortOrder))
        .limit(1))[0]
    : (await db
        .select()
        .from(banners)
        .where(and(gt(banners.sortOrder, current.sortOrder)))
        .orderBy(asc(banners.sortOrder))
        .limit(1))[0];

  if (!neighbor || neighbor.sortOrder == null) return;

  await db.update(banners).set({ sortOrder: neighbor.sortOrder }).where(eq(banners.id, current.id));
  await db.update(banners).set({ sortOrder: current.sortOrder }).where(eq(banners.id, neighbor.id));
}
```

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no errors for `src/lib/admin/banners.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/admin/banners.ts
git commit -m "feat(lib): add admin banner CRUD/reorder/toggle"
```

---

## Task 4: Install the carousel dependency + shadcn component

**Files:**
- Modify: `package.json` (via package manager)
- Create: `src/components/ui/carousel.tsx` (via shadcn CLI)

- [ ] **Step 1: Add the Embla packages**

Run: `pnpm add embla-carousel-react embla-carousel-autoplay`
Expected: both appear in `package.json` dependencies.

- [ ] **Step 2: Add the shadcn carousel primitive**

Run: `pnpm dlx shadcn@latest add carousel`
Expected: creates `src/components/ui/carousel.tsx`. If it prompts to overwrite anything, decline overwrites of existing files.

- [ ] **Step 3: Verify it builds against the project**

Run: `pnpm lint`
Expected: no new errors. (If the generated file uses an `asChild` pattern on Button, it will not — the carousel arrows are plain buttons; no change needed.)

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml src/components/ui/carousel.tsx components.json
git commit -m "chore: add embla carousel + shadcn carousel component"
```

---

## Task 5: Build the `HeroSlider` client component

**Files:**
- Create: `src/components/home/hero-slider.tsx`

This consumes a `slides` array. A slide whose `imageUrl` is `null` renders the legacy gradient background (used by the fallback default slide). A slide with no `buttonText`/`buttonLink` renders no button; a slide with no `title` renders no overlay text.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { SafeImage } from "@/components/safe-image";

export type HeroSlide = {
  id: number | string;
  imageUrl: string | null;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  buttonLink: string | null;
};

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setSelected(api.selectedScrollSnap());
    const onSelect = () => setSelected(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const single = slides.length <= 1;

  return (
    <section className="relative" aria-label="Banner utama" aria-roledescription="carousel">
      <Carousel
        setApi={setApi}
        opts={{ loop: !single }}
        plugins={
          single
            ? []
            : [Autoplay({ delay: 5000, stopOnMouseEnter: true, stopOnInteraction: false })]
        }
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="pl-0">
              <Slide slide={slide} />
            </CarouselItem>
          ))}
        </CarouselContent>

        {!single && (
          <>
            <CarouselPrevious className="left-4 hidden border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white md:flex" />
            <CarouselNext className="right-4 hidden border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white md:flex" />
          </>
        )}
      </Carousel>

      {!single && count > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ke slide ${i + 1}`}
              onClick={() => api?.scrollTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === selected ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Slide({ slide }: { slide: HeroSlide }) {
  return (
    <div className="relative h-[420px] w-full overflow-hidden md:h-[520px]">
      {slide.imageUrl ? (
        <SafeImage
          src={slide.imageUrl}
          alt={slide.title ?? ""}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="gradient-hero absolute inset-0" />
      )}

      {/* dark overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/40 to-navy-950/30" />

      {(slide.title || slide.subtitle || slide.buttonText) && (
        <div className="container relative z-[1] mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white">
          {slide.title && (
            <h1 className="font-heading text-3xl font-extrabold tracking-tight drop-shadow md:text-5xl">
              {slide.title}
            </h1>
          )}
          {slide.subtitle && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-100 drop-shadow md:text-lg">
              {slide.subtitle}
            </p>
          )}
          {slide.buttonText && slide.buttonLink && (
            <Link
              href={slide.buttonLink}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-600"
            >
              {slide.buttonText}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no errors. (If `CarouselApi` is exported under a different name by the generated file, open `src/components/ui/carousel.tsx`, find the exported api type, and adjust the import in Step 1.)

- [ ] **Step 3: Commit**

```bash
git add src/components/home/hero-slider.tsx
git commit -m "feat(home): add HeroSlider carousel component"
```

---

## Task 6: Convert `Hero` to an async server wrapper with fallback

**Files:**
- Modify: `src/components/home/hero.tsx`

The current static hero markup becomes the **default fallback slide** rendered when there are no active banners.

- [ ] **Step 1: Replace the file contents**

```tsx
import { getActiveBanners } from "@/lib/banners";
import { HeroSlider, type HeroSlide } from "@/components/home/hero-slider";

const DEFAULT_SLIDE: HeroSlide = {
  id: "default",
  imageUrl: null, // null → legacy gradient background
  title: "LIPAN RI",
  subtitle:
    "Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia",
  buttonText: "Tentang Kami",
  buttonLink: "/tentang-kami/sekilas-lipan-ri",
};

export async function Hero() {
  const banners = await getActiveBanners();

  const slides: HeroSlide[] =
    banners.length > 0
      ? banners.map((b) => ({
          id: b.id,
          imageUrl: b.imageUrl,
          title: b.title,
          subtitle: b.subtitle,
          buttonText: b.buttonText,
          buttonLink: b.buttonLink,
        }))
      : [DEFAULT_SLIDE];

  return <HeroSlider slides={slides} />;
}
```

- [ ] **Step 2: Confirm the homepage already awaits `<Hero />`**

`src/app/(site)/page.tsx` renders `<Hero />` inside an `async` component. Since `Hero` is now `async`, it must be awaited by React — in the App Router an async server component used as `<Hero />` is supported directly (no code change needed). Verify the import line is unchanged.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: build succeeds; `/` compiles.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/hero.tsx
git commit -m "feat(home): data-driven hero with default-slide fallback"
```

---

## Task 7: Admin server actions

**Files:**
- Create: `src/app/admin/banners/actions.ts`

Mirrors the categories actions pattern: `requireAdmin()`, validate, `redirect(...?error=...)` on bad input, `revalidatePath`. Both `/` and `/admin/banners` are revalidated so the public hero updates immediately.

- [ ] **Step 1: Write the actions**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import {
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBanner,
  reorderBanner,
  type BannerInput,
} from "@/lib/admin/banners";

function readInput(formData: FormData): BannerInput | null {
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (!imageUrl) return null;
  const opt = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v === "" ? null : v;
  };
  return {
    imageUrl,
    title: opt("title"),
    subtitle: opt("subtitle"),
    buttonText: opt("buttonText"),
    buttonLink: opt("buttonLink"),
  };
}

function revalidate() {
  revalidatePath("/");
  revalidatePath("/admin/banners");
}

export async function createBannerAction(formData: FormData) {
  await requireAdmin();
  const input = readInput(formData);
  if (!input) redirect("/admin/banners?error=Gambar+banner+wajib+diunggah");
  await createBanner(input);
  revalidate();
  redirect("/admin/banners");
}

export async function updateBannerAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const input = readInput(formData);
  if (!id || !input) redirect("/admin/banners?error=Data+banner+tidak+lengkap");
  await updateBanner(id, input!);
  revalidate();
  redirect("/admin/banners");
}

export async function deleteBannerAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  await deleteBanner(id);
  revalidate();
}

export async function toggleBannerAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  await toggleBanner(id);
  revalidate();
}

export async function reorderBannerAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir"));
  if (!id || (dir !== "up" && dir !== "down")) return;
  await reorderBanner(id, dir);
  revalidate();
}
```

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no errors for `src/app/admin/banners/actions.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/banners/actions.ts
git commit -m "feat(admin): banner server actions"
```

---

## Task 8: Admin banner form (client) + list page

**Files:**
- Create: `src/app/admin/banners/banner-form.tsx`
- Create: `src/app/admin/banners/page.tsx`

The form is a client component because it uses the `ImageUpload` component (which manages upload state) and keeps the uploaded URL in a hidden input. It supports both "create" (no `banner` prop) and "edit" (with `banner`).

- [ ] **Step 1: Write the form component**

```tsx
"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBannerAction, updateBannerAction } from "./actions";
import type { Banner } from "@/lib/banners";

export function BannerForm({ banner }: { banner?: Banner }) {
  const [imageUrl, setImageUrl] = useState<string>(banner?.imageUrl ?? "");
  const editing = Boolean(banner);

  return (
    <form
      action={editing ? updateBannerAction : createBannerAction}
      className="space-y-4 rounded-xl border border-navy-100 bg-white p-5 shadow-sm"
    >
      {editing && <input type="hidden" name="id" value={banner!.id} />}
      <input type="hidden" name="imageUrl" value={imageUrl} />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy-900">
          Gambar banner <span className="text-red-500">*</span>
        </label>
        <ImageUpload value={imageUrl} onChange={setImageUrl} label="banner" />
      </div>

      <Input name="title" defaultValue={banner?.title ?? ""} placeholder="Judul (opsional)" />
      <Input name="subtitle" defaultValue={banner?.subtitle ?? ""} placeholder="Subjudul (opsional)" />
      <div className="flex flex-wrap gap-2">
        <Input
          name="buttonText"
          defaultValue={banner?.buttonText ?? ""}
          placeholder="Teks tombol (opsional)"
          className="min-w-40 flex-1"
        />
        <Input
          name="buttonLink"
          defaultValue={banner?.buttonLink ?? ""}
          placeholder="Link tombol mis. /berita (opsional)"
          className="min-w-40 flex-1"
        />
      </div>

      <Button type="submit" disabled={!imageUrl}>
        {editing ? "Simpan perubahan" : "Tambah banner"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Write the list page**

```tsx
import { requireAdmin } from "@/lib/auth-helpers";
import { listBanners } from "@/lib/admin/banners";
import { BannerForm } from "./banner-form";
import {
  deleteBannerAction,
  toggleBannerAction,
  reorderBannerAction,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowUp, ArrowDown, Eye, EyeOff, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BannersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const rows = await listBanners();
  const { error } = await searchParams;

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-navy-900">Banner</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {rows.length} banner · tampil di hero halaman utama
      </p>

      {error && (
        <p
          className="mt-4 flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-6">
        <BannerForm />
      </div>

      <ul className="mt-6 space-y-3">
        {rows.map((b, i) => (
          <li
            key={b.id}
            className="flex items-center gap-4 rounded-xl border border-navy-100 bg-white p-3 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail from R2 */}
            <img
              src={b.imageUrl}
              alt=""
              className="h-14 w-24 shrink-0 rounded-md object-cover ring-1 ring-navy-100"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-navy-900">
                {b.title || <span className="text-muted-foreground">(tanpa judul)</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {b.isActive ? "Aktif" : "Nonaktif"}
                {b.buttonLink ? ` · ${b.buttonLink}` : ""}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <form action={reorderBannerAction}>
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="dir" value="up" />
                <Button size="sm" variant="outline" type="submit" aria-label="Naik" disabled={i === 0}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
              </form>
              <form action={reorderBannerAction}>
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="dir" value="down" />
                <Button
                  size="sm"
                  variant="outline"
                  type="submit"
                  aria-label="Turun"
                  disabled={i === rows.length - 1}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </form>
              <form action={toggleBannerAction}>
                <input type="hidden" name="id" value={b.id} />
                <Button
                  size="sm"
                  variant="outline"
                  type="submit"
                  aria-label={b.isActive ? "Nonaktifkan" : "Aktifkan"}
                >
                  {b.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </form>
              <form action={deleteBannerAction}>
                <input type="hidden" name="id" value={b.id} />
                <Button size="sm" variant="outline" type="submit" aria-label="Hapus">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Verify `Input` exists**

Run: `ls src/components/ui/input.tsx`
Expected: file exists (it is already used by categories page). If missing, run `pnpm dlx shadcn@latest add input`.

- [ ] **Step 4: Lint + build**

Run: `pnpm lint && pnpm build`
Expected: both succeed; `/admin/banners` route appears in the build output.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/banners/banner-form.tsx src/app/admin/banners/page.tsx
git commit -m "feat(admin): banner list page + add/edit form"
```

---

## Task 9: Add the sidebar navigation link

**Files:**
- Modify: `src/app/admin/sidebar.tsx`

- [ ] **Step 1: Import an icon and add the link**

In the `lucide-react` import on line 5, add `GalleryHorizontal`:

```ts
import { LayoutDashboard, Newspaper, Images, Tags, Users, LogOut, GalleryHorizontal } from "lucide-react";
```

Then add this entry to the `links` array, right after the `media` ("Galeri") line:

```ts
  { href: "/admin/banners", label: "Banner", icon: GalleryHorizontal, admin: true },
```

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/sidebar.tsx
git commit -m "feat(admin): add Banner link to sidebar"
```

---

## Task 10: E2E smoke for the admin banners page

**Files:**
- Modify: `e2e/admin.spec.ts`

The repo has an authenticated admin E2E setup (`admin.setup.ts`, `admin-auth.spec.ts`). Add a page-load assertion following the existing pattern in `admin.spec.ts`.

- [ ] **Step 1: Read the existing spec to match its style**

Run: `sed -n '1,40p' e2e/admin.spec.ts`
Expected: shows how authenticated admin pages are visited and asserted (e.g. visiting `/admin/posts` and checking a heading).

- [ ] **Step 2: Add a banners load test**

Append a test that mirrors the existing ones (use the same `test`, fixtures import, and storage-state mechanism already at the top of the file). Example shape — adapt names to match what `admin.spec.ts` already imports:

```ts
test("admin banners page loads", async ({ page }) => {
  await page.goto("/admin/banners");
  await expect(page.getByRole("heading", { name: "Banner" })).toBeVisible();
});
```

- [ ] **Step 3: Run the suite (optional locally; runs in CI against preview)**

Run: `pnpm e2e e2e/admin.spec.ts`
Expected: the new test passes (requires the admin auth setup + a reachable build). If running locally is impractical, rely on CI which executes authenticated admin E2E against the Vercel preview.

- [ ] **Step 4: Commit**

```bash
git add e2e/admin.spec.ts
git commit -m "test(e2e): admin banners page-load smoke"
```

---

## Task 11: Final verification

- [ ] **Step 1: Full lint + build**

Run: `pnpm lint && pnpm build`
Expected: both pass with no errors.

- [ ] **Step 2: Manual check (dev server)**

Run: `pnpm dev`, then:
- Visit `/` with no banners in DB → the default "LIPAN RI" gradient slide shows, no arrows/dots (single slide).
- In `/admin/banners`, upload an image, add title/subtitle/button, submit → it appears in the list.
- Add a second banner → on `/`, the slider autoplays every 5s, arrows + dots appear, hover pauses autoplay, swipe works on a narrow viewport.
- Toggle one banner off → it disappears from `/`. Reorder → order changes on `/`.

- [ ] **Step 3: Confirm and stop.** No further commits unless manual testing surfaced a defect (fix → re-run Step 1).

---

## Self-review notes (already reconciled)

- **Spec coverage:** data model (T1), data access (T2/T3), public components Hero+HeroSlider (T5/T6), admin page+actions+upload reuse (T7/T8), sidebar (T9), deps+migration (T1/T4), verification incl. optional E2E (T10/T11). Empty-state fallback handled in T6. All spec sections map to a task.
- **Type consistency:** `Banner` type defined in T2 and reused in T3/T8; `HeroSlide` defined in T5 and produced in T6; `BannerInput` defined in T3 and consumed in T7. Action names match between T7 (definitions) and T8/T9 (call sites): `createBannerAction`, `updateBannerAction`, `deleteBannerAction`, `toggleBannerAction`, `reorderBannerAction`.
- **Out of scope (YAGNI):** per-slide scheduling, click analytics, video slides, media-library picker — excluded per spec.
