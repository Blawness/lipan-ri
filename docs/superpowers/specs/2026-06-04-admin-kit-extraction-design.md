# Admin Kit Extraction — Design Spec

**Date:** 2026-06-04
**Status:** Approved (design), pending implementation plan
**Branch:** `admin-kit-extraction` (master untouched until verified)

## Goal

Extract the reusable core of the LIPAN RI custom CMS into a standalone, versioned
package (`@blawness/admin-kit`) so it can be reused across client projects, with
**auto-update**: bump the package version → consumers run `pnpm update` to receive
fixes/features.

Hard constraint: **do not break the live LIPAN RI site.** All work happens in a
separate repo and a LIPAN branch; `master` only changes after the full test gate
(lint + build + Playwright admin-e2e against a Vercel preview) is green.

## Non-Goals

- Turning the CMS into a config-driven "generate CRUD from schema" framework (Level 2).
  Out of scope. Domain content types are still hand-written per project.
- Migrating the public-facing LIPAN site (front-end) into the package. Only the
  `/admin` core moves.
- Publishing to a public npm registry. Distribution is via private Git dependency.

## Key Decisions (settled during brainstorming)

1. **Reuse model:** shared package (not copy/template). LIPAN consumes it as a
   dependency → auto-update.
2. **Trade-off accepted:** LIPAN must be migrated **once** (controlled, tested) to
   consume the package. "Auto-update" and "never touch LIPAN" are mutually
   exclusive; we chose auto-update.
3. **Rollout:** full extraction in one effort (not a small pilot), but executed in a
   safe order so master changes last.
4. **Distribution:** Git dependency with version tags —
   `"@blawness/admin-kit": "github:Blawness/admin-kit#v0.1.0"`. No registry setup.
5. **DB ownership (turnkey):** the package owns the `users` + `media` tables and its
   own Drizzle connection (via the same `DATABASE_URL`; one database, two table
   groups). Domain tables (posts/categories/banners/pages) stay in the app.

## Architectural Reality: routes stay in the app

Next.js App Router discovers routes only from the app's own `app/` directory. A
package cannot inject `/admin/*` routes. Therefore:

### Ships in the package (`@blawness/admin-kit`) — the auto-updating core
- **Components:** `ConfirmDelete`, `editor` (tiptap), `image-upload`, `toast-on-param`,
  and the shadcn UI primitives those depend on (bundled internally, namespaced, so
  the package is self-contained).
- **Ready-made screens:** Media library and User management exported as drop-in
  components, e.g. `<MediaLibraryScreen />`, `<UsersScreen />`.
- **Auth:** login UI + role helpers (`requireUser` / `requireAdmin`) + an auth-config
  builder for next-auth.
- **Storage:** R2 upload/delete (`uploadImage`, `deleteObjectByUrl`).
- **Utils:** `slug`, `sanitize`, `db-errors`, `cn`/`utils`.
- **Core schema:** Drizzle definitions for `users` + `media` (+ its own db client).
- **Admin shell:** `layout` + `sidebar` driven by a nav config object.

### Stays in the consuming app (LIPAN and each client)
- **Thin route files** `app/admin/**/page.tsx` that render package screens, e.g.:
  ```tsx
  import { MediaLibraryScreen } from "@blawness/admin-kit/media";
  export const dynamic = "force-dynamic";
  export default MediaLibraryScreen;
  ```
- **Domain content types:** berita (posts), kategori, banner, "Tentang Kami" — both
  their admin pages and their Drizzle schema.
- **Branding:** color tokens (`navy` / `brand` / `gold`) defined in the app's CSS.
- **Wiring:** `auth.ts` built from the package's builder; the media reference-check
  callback (see Coupling #1); Tailwind `@source` pointing at the package.

**Implication:** updating the package auto-updates Media/User logic, the editor,
components, and auth. Thin route shells and branding rarely change, so in practice
setup is still one-time per project.

## Coupling to fix during extraction

1. **Media reference check** — `lib/admin/media.ts::countMediaReferences` currently
   hardcodes `posts.featuredImage` + `banners.imageUrl`. In the package, media
   deletion accepts an injected `referenceChecker(url) => Promise<number>` callback
   the app supplies. LIPAN supplies one that checks posts + banners.
2. **Schema split** — `db/schema.ts` splits into core (`users`, `media`, owned by the
   package) vs content (domain, stays in app).
3. **Nav config** — `sidebar.tsx` nav array moves to an `admin.config.ts` object the
   app passes in (so each app sets its own menu items).
4. **Hardcoded Indonesian strings** — centralize into a strings object/module so a
   client can override copy without editing component internals.
5. **Branding tokens** — `theme.ts` + Tailwind tokens become the single
   per-client customization point; package ships sensible defaults.

## Distribution & versioning

- Package repo: `Blawness/admin-kit` (private GitHub repo).
- Consumers pin a tag: `github:Blawness/admin-kit#v0.1.0`.
- Release flow: change in admin-kit → tag `vX.Y.Z` → consumer bumps tag / `pnpm update`.
- Future upgrade path (if it gets serious): move to GitHub Packages (private npm).

## Work sequence (safe order — master changes last)

| # | Step | Impact on live LIPAN |
|---|------|----------------------|
| A | Create `admin-kit` repo; scaffold package (build, exports, peer deps) | none |
| B | Move core into package; fix the 5 couplings above | none |
| C | Release `v0.1.0` (tag) | none |
| D | LIPAN **branch**: install package, migrate imports, delete duplicated core, wire auth/db/tailwind, supply media reference callback | none (branch only) |
| E | Test: `lint` + `build` + Playwright `admin-e2e` against Vercel preview | none (verification) |
| F | Merge + deploy **only if E is green** | controlled |

## Risks & mitigations

| Risk | Detail | Mitigation |
|------|--------|------------|
| **Directive stripping** (primary unknown) | Bundlers may drop `"use client"` / `"use server"` markers, breaking components/server actions shipped from `node_modules` | Use a build config that preserves directives (or ship minimally-bundled). Validate this **first**, in steps A–C, before investing in the full move |
| Tailwind tokens missing | Package classes (`navy`/`brand`) render unstyled if the app lacks tokens / doesn't scan the package | Package ships default token CSS + documents the required `@source` directive |
| Core-table migration | Package "owns" `users`/`media`, but LIPAN's DB already has them | Match existing columns exactly; treat initial migration as a baseline (no data drop) |
| Peer-dep version skew | next / drizzle / tiptap / next-auth must align between package and app | Pin peer deps to LIPAN's current versions |

## Prerequisites (from the user)

1. Permission to create the private GitHub repo `Blawness/admin-kit` via `gh`.
2. Each consuming app must provide env: `DATABASE_URL`, `AUTH_SECRET`, R2 vars —
   LIPAN already has all of these.
3. Shared database is acceptable (LIPAN dev & prod already share one Neon DB).

## Testing strategy

- **Package:** build + typecheck must pass; small unit tests where they add value.
- **Integration (the real safety net):** on the LIPAN branch, run `pnpm lint`,
  `pnpm build`, then `pnpm e2e` (Playwright `admin-e2e`) against a Vercel preview
  deployment. Merge to master only when all green.

## Success criteria

- `@blawness/admin-kit` builds, with `"use client"`/`"use server"` directives intact.
- A fresh app can mount Media + User management + auth from the package with only
  thin route files and config.
- LIPAN, after migration, behaves identically to today (admin-e2e green) while its
  core now comes from the package.
- Bumping the package tag and running `pnpm update` in LIPAN pulls the change.
