# Admin Panel LIPAN RI — Design Spec

**Date:** 2026-06-03
**Status:** Approved (design), pending implementation plan

## Goal

Add an authenticated admin panel to the LIPAN RI site so staff can manage
content (news/press releases, gallery media), categories, and user accounts
through the web UI instead of editing the database directly.

## Scope (v1)

In scope:
- **Posts** (Berita / Press Rilis): full CRUD — title, content (rich text),
  excerpt, featured image, category, status (draft/published), featured flag.
- **Media** (Galeri): upload to R2, list, delete, set album.
- **Categories**: CRUD (admin only).
- **Users**: create user, set/reset password, set role (admin only).

Out of scope (future phases):
- Editing "Tentang Kami" pages (per-type JSON structure — more complex).
- Password reset via email, audit log, admin UI i18n.

## Decisions (from brainstorming)

| Topic | Decision |
|---|---|
| Auth library | Auth.js v5 (`next-auth@beta`) |
| Login method | Email + password (Credentials), bcrypt vs `users.passwordHash` |
| Article editor | Rich text WYSIWYG (Tiptap), HTML sanitized server-side on save |
| Roles | Admin vs Editor (Editor: posts + media; Admin: everything) |
| First admin | CLI script `pnpm admin:create` reading creds from env |

## Architecture

### 1. Authentication
- `next-auth@beta` (v5), **Credentials provider**, session strategy **JWT**
  (required for credentials; no extra session/account DB tables, no adapter).
- Password verification with `bcryptjs` (pure-JS, no native build) against
  `users.passwordHash`.
- **Split config** (official Auth.js pattern):
  - `auth.config.ts` — edge-safe, lightweight; used by middleware to check
    "is the user logged in?" via the `authorized` callback.
  - `auth.ts` — Node runtime; contains the Credentials `authorize` with bcrypt
    (bcrypt cannot run on edge), exports `auth`, `handlers`, `signIn`, `signOut`.
- `role` (`admin` | `editor`) persisted in the JWT via `jwt`/`session`
  callbacks; exposed on `session.user.role`.
- New env: `AUTH_SECRET`.
- TypeScript module augmentation to add `role` (and `id`) to `Session`/`User`.

### 2. Route protection & authorization
- `src/middleware.ts` (new) guards all `/admin/*` routes; unauthenticated
  requests redirect to `/admin/login`. `/admin/login` itself is public.
- **Per-role authorization** enforced in server actions and page loaders, not
  just middleware:
  - Helper `requireUser()` — any authenticated user (admin or editor).
  - Helper `requireAdmin()` — `role === "admin"` only.
  - User & Category management require `requireAdmin()`; Posts & Media require
    `requireUser()`.

### 3. Pages (`src/app/admin/`)
- `login/page.tsx` — login form (public).
- `layout.tsx` — protected shell: sidebar nav + sign-out; nav items filtered by
  role (Editor doesn't see Users/Categories).
- `page.tsx` — dashboard: counts of posts / media / users.
- `posts/page.tsx` (list), `posts/new/page.tsx`, `posts/[id]/edit/page.tsx`.
- `media/page.tsx` — upload, list, delete, set album.
- `categories/page.tsx` — admin only.
- `users/page.tsx` — admin only: add user, set/reset password, set role.

### 4. Article editor
- **Tiptap**: `@tiptap/react` + `@tiptap/starter-kit` (+ `@tiptap/pm`).
  Features: bold, headings, lists, links, image insert (via R2 upload).
- On save, the produced HTML is **sanitized server-side** with
  `isomorphic-dompurify` before being stored, because post content is rendered
  with `dangerouslySetInnerHTML` on the public site (XSS prevention).

### 5. Data layer (writes)
- New write functions (e.g. under `src/lib/admin/`), invoked via **Server
  Actions**: `createPost/updatePost/deletePost`,
  `createCategory/updateCategory/deleteCategory`,
  `createUser/updateUserPassword/updateUserRole/deleteUser`, `deleteMedia`.
- Slug auto-generated from title (unique); `updatedAt` set on update;
  `authorId` taken from the session.
- Image uploads reuse the **existing** `uploadImage()` in `src/lib/r2.ts`, then
  insert a `media` row.
- Form/login input validated with `zod`.

### 6. Bootstrap first admin
- `scripts/create-admin.ts`, run via `pnpm admin:create` — reads
  `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` from env, bcrypt-hashes the
  password, upserts a user with role `admin` (`onConflictDoUpdate` so it doubles
  as a password reset). Password never committed to git.

### 7. New dependencies
`next-auth@beta`, `bcryptjs` (+ `@types/bcryptjs`), `@tiptap/react`,
`@tiptap/starter-kit`, `@tiptap/pm`, `isomorphic-dompurify`, `zod`.

### 8. Schema
No major migration: `users` already has `passwordHash` and `role`. Optional
refinement: make `role` NOT NULL default `editor`.

## Error handling
- Login: invalid credentials → generic "Email atau password salah" (no user
  enumeration). Zod validation errors surfaced inline on the form.
- Server actions: return typed error results rendered as inline form errors;
  unauthorized access throws and is caught by the admin error boundary.
- Uploads: validate mime/type and size before calling `uploadImage()`.

## Testing
- Playwright smoke tests (existing E2E suite, `pnpm e2e`):
  - Unauthenticated `/admin` redirects to `/admin/login`.
  - Login with wrong password fails; correct password reaches the dashboard.
  - Create a draft post and see it in the list.
- Remaining flows verified manually.

## Implementation phases
- **A** — Auth (split config, Credentials, JWT/role), middleware, `requireUser`/
  `requireAdmin`, `pnpm admin:create`, login page, admin layout shell.
- **B** — Posts CRUD + Tiptap editor + sanitization + image upload.
- **C** — Galeri (media) management.
- **D** — Categories & Users management (admin only).

## Conventions to follow (from AGENTS.md)
- `export const dynamic = "force-dynamic"` on admin pages.
- `"use client"` for interactive components (editor, forms).
- shadcn Button uses `render` prop, not `asChild`.
- Indonesian UI text throughout.
- Run `pnpm lint` → `pnpm build` before declaring work complete.
