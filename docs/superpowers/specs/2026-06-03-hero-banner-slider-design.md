# Hero Banner Slider — Design Spec

**Date:** 2026-06-03
**Status:** Approved (pending implementation plan)

## Goal

Replace the static gradient hero on the homepage (`src/components/home/hero.tsx`) with
an auto-playing, swipeable banner slider whose slides are managed via the admin panel.
Non-technical staff can add, edit, reorder, activate/deactivate, and delete slides
without a code deploy.

## Decisions (from brainstorming)

| Topic | Decision |
|---|---|
| Slide source | Dynamic, stored in DB, managed via admin |
| Slide content | Background image + text overlay (title, subtitle, button) |
| Behavior | Autoplay (5s) + manual controls (arrows, dots), pause on hover, swipe on mobile |
| Empty state | Render one hardcoded default slide (reuses old gradient hero style) |
| Library | shadcn Carousel (Embla) + `embla-carousel-autoplay` |
| Image upload | Direct upload in the banner form, reusing the existing R2 upload mechanism |

## Data Model

New table `banners` in `src/db/schema.ts`:

```ts
export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  title: text("title"),              // overlay headline (optional)
  subtitle: text("subtitle"),        // overlay subtitle (optional)
  buttonText: text("button_text"),   // CTA label (optional)
  buttonLink: text("button_link"),   // CTA href (optional)
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
```

- Only `imageUrl` is required; a slide may be image-only when text/button fields are blank.
- Slides ordered by `sortOrder` ascending.
- Drizzle migration generated into `drizzle/`.

## Data Access — `src/lib/banners.ts`

- `getActiveBanners()` — `is_active = true`, ordered by `sortOrder ASC`. Used by the homepage server component.
- `getAllBanners()` — all rows for admin list.
- `createBanner(data)`, `updateBanner(id, data)`, `deleteBanner(id)` — admin CRUD.
- `reorderBanner(id, dir)` — swap `sortOrder` with adjacent slide (up/down).

## Public Components

### `Hero` (server) — `src/components/home/hero.tsx`
- Becomes `async`. Calls `getActiveBanners()`.
- If empty → builds a single default slide object mirroring the current gradient hero
  (headline "LIPAN RI", existing subtitle, two existing CTA links).
- Passes the slide array to `HeroSlider`.

### `HeroSlider` (client) — `src/components/home/hero-slider.tsx`
- `"use client"`. Uses shadcn `Carousel` with `embla-carousel-autoplay`
  (`delay: 5000`, `stopOnMouseEnter: true`, loop enabled).
- Per slide: full-bleed `next/image` background + dark overlay + centered text
  (title / subtitle / CTA button) following the current hero typography.
- Renders prev/next arrows and dot indicators. Mobile swipe via Embla default.
- A slide with no `buttonText`/`buttonLink` renders without a button; image-only slides
  render no overlay text.

## Admin — `/admin/banners`

Follows existing admin resource pattern (`page.tsx` + `actions.ts`, plus a `sidebar.tsx` entry).

- **`page.tsx`** — lists all banners (thumbnail, title, active status, order) with:
  up/down reorder buttons, active toggle, edit, delete, and an "add banner" form.
- **`actions.ts`** — server actions: `createBannerAction`, `updateBannerAction`,
  `deleteBannerAction`, `toggleBannerAction`, `reorderBannerAction`. Each calls
  `revalidatePath("/")` and `revalidatePath("/admin/banners")`.
- **Image upload** — reuse the existing R2 upload mechanism from `media/uploader.tsx`,
  extracted into a reusable uploader component used by the banner form.

## Dependencies & Migration

- `pnpm add embla-carousel-react embla-carousel-autoplay`
- `pnpm dlx shadcn add carousel` → adds `src/components/ui/carousel.tsx`
- Add `banners` table to `schema.ts`; generate Drizzle migration into `drizzle/`.

## Verification

No unit tests (per project convention). Verify with:
- `pnpm lint` → `pnpm build` (must pass before declaring complete).
- Manual check: homepage slider (autoplay, arrows, dots, swipe, hover-pause) and
  admin CRUD/reorder/toggle.
- Optional: one authenticated smoke E2E loading `/admin/banners`, following the
  existing E2E pattern.

## Out of Scope (YAGNI)

- Per-slide scheduling (start/end dates).
- Slide-level analytics / click tracking.
- Video slides or transitions beyond the default slide transition.
- Selecting from existing media library (direct upload only for v1).
