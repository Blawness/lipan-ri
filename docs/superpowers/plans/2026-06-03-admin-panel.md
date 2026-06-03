# Admin Panel LIPAN RI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an authenticated admin panel (`/admin`) where staff manage posts, gallery media, categories, and users, replacing direct DB edits.

**Architecture:** Auth.js v5 Credentials provider with JWT sessions and a split edge/Node config; `/admin/*` guarded by middleware plus per-role server-side checks. Mutations run through Next.js Server Actions calling new write functions in `src/lib/admin/`. Article body is edited with Tiptap and sanitized server-side before storage.

**Tech Stack:** Next.js 16 App Router, React 19, Drizzle ORM + Postgres, Auth.js v5 (`next-auth@beta`), `bcryptjs`, `zod`, Tiptap, `isomorphic-dompurify`, Tailwind v4 + shadcn (base-nova).

---

## Conventions (apply to every task)

- Path alias `@/` → `src/`. DB client: `import { db } from "@/db"`. Schema: `import { ... } from "@/db/schema"`.
- All `src/app/admin` pages: `export const dynamic = "force-dynamic"`.
- `"use client"` only on interactive components (forms, editor, dialogs).
- shadcn Button: use `render` prop, never `asChild`.
- All UI text in Indonesian (id_ID).
- Scripts run via `tsx` and start with `import "dotenv/config"`.
- After each task: run `pnpm lint` and `pnpm build`; both must pass before commit.
- Testing reality (AGENTS.md): no unit-test framework. Verification = `lint` + `build` + Playwright smoke tests in `e2e/` + manual. Do **not** introduce Jest/Vitest.
- Commit after every task with the message shown in its final step.

## File Structure (created/modified across the plan)

```
auth.config.ts                         # edge-safe Auth.js config (providers list empty here + authorized callback)
auth.ts                                # Node Auth.js: Credentials authorize (bcrypt), exports auth/handlers/signIn/signOut
src/types/next-auth.d.ts               # module augmentation: role + id on Session/User/JWT
src/middleware.ts                      # protect /admin/* via auth
src/app/api/auth/[...nextauth]/route.ts# Auth.js route handlers
src/lib/auth-helpers.ts                # requireUser(), requireAdmin()
src/lib/slug.ts                        # slugify() + uniqueSlug()
src/lib/sanitize.ts                    # sanitizeHtml()
src/lib/admin/posts.ts                 # createPost/updatePost/deletePost/listPostsAdmin/getPostById
src/lib/admin/media.ts                 # listMedia/deleteMedia/createMediaFromUpload
src/lib/admin/categories.ts            # list/create/update/delete category
src/lib/admin/users.ts                 # list/create/updatePassword/updateRole/delete user
scripts/create-admin.ts                # pnpm admin:create
src/app/admin/login/page.tsx           # login form (public)
src/app/admin/login/actions.ts         # signin server action
src/app/admin/layout.tsx               # protected shell + sidebar
src/app/admin/sidebar.tsx              # client nav (role-filtered) + sign-out
src/app/admin/page.tsx                 # dashboard counts
src/app/admin/posts/page.tsx           # list
src/app/admin/posts/new/page.tsx       # create
src/app/admin/posts/[id]/edit/page.tsx # edit
src/app/admin/posts/post-form.tsx      # client form (shared new/edit)
src/app/admin/posts/actions.ts         # post server actions
src/components/admin/editor.tsx        # Tiptap rich-text editor (client)
src/components/admin/image-upload.tsx  # file -> upload action -> URL (client)
src/app/admin/media/page.tsx           # gallery management
src/app/admin/media/actions.ts         # upload/delete media actions
src/app/admin/categories/page.tsx      # categories (admin only)
src/app/admin/categories/actions.ts
src/app/admin/users/page.tsx           # users (admin only)
src/app/admin/users/actions.ts
src/components/ui/{label,textarea,table,select,dialog}.tsx  # added shadcn primitives
e2e/admin.spec.ts                      # smoke tests
```

---

# PHASE A — Auth, protection, bootstrap, shell

### Task A1: Install dependencies

**Files:** Modify `package.json` (via installer).

- [ ] **Step 1: Install runtime + types**

```bash
pnpm add next-auth@beta bcryptjs zod isomorphic-dompurify
pnpm add -D @types/bcryptjs
```

- [ ] **Step 2: Verify versions pinned**

Run: `pnpm ls next-auth bcryptjs zod isomorphic-dompurify`
Expected: `next-auth` shows a `5.x` (beta) version; others resolve without error.

- [ ] **Step 3: Build sanity**

Run: `pnpm build`
Expected: build succeeds (no usage yet).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add next-auth, bcryptjs, zod, dompurify deps"
```

### Task A2: Add AUTH_SECRET env

**Files:** Modify `.env.local` (local, untracked) and `.env.example` if present (create if not).

- [ ] **Step 1: Generate and add secret to `.env.local`**

```bash
node -e "console.log('AUTH_SECRET='+require('crypto').randomBytes(32).toString('base64'))" >> .env.local
```

- [ ] **Step 2: Document required env in `.env.example`**

Append (create the file if missing):

```
# Auth.js session secret (generate: openssl rand -base64 32)
AUTH_SECRET=
# Bootstrap admin (used by `pnpm admin:create`)
ADMIN_EMAIL=admin@lipan-ri.org
ADMIN_PASSWORD=
ADMIN_NAME=Admin LIPAN RI
```

- [ ] **Step 3: Commit (example only; `.env.local` stays untracked)**

```bash
git add .env.example
git commit -m "chore: document AUTH_SECRET and admin bootstrap env"
```

### Task A3: NextAuth type augmentation

**Files:** Create `src/types/next-auth.d.ts`.

- [ ] **Step 1: Write the augmentation**

```typescript
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string | null;
  }
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/next-auth.d.ts
git commit -m "feat(auth): next-auth session/jwt type augmentation"
```

### Task A4: Edge-safe auth config + middleware

**Files:** Create `auth.config.ts`, `src/middleware.ts`.

- [ ] **Step 1: Write `auth.config.ts` (no bcrypt, no DB — edge safe)**

```typescript
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
  providers: [], // real provider added in auth.ts (Node runtime)
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAdminArea = nextUrl.pathname.startsWith("/admin");
      const isLogin = nextUrl.pathname === "/admin/login";
      if (isLogin) return true;
      if (isAdminArea) return !!auth?.user;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role ?? "editor";
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      session.user.role = token.role ?? "editor";
      return session;
    },
  },
} satisfies NextAuthConfig;
```

- [ ] **Step 2: Write `src/middleware.ts`**

```typescript
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: succeeds; `/admin` matcher compiled (no admin pages yet, middleware still builds).

- [ ] **Step 4: Commit**

```bash
git add auth.config.ts src/middleware.ts
git commit -m "feat(auth): edge auth config + middleware guarding /admin"
```

### Task A5: Node auth instance (Credentials + bcrypt)

**Files:** Create `auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`.

- [ ] **Step 1: Write `auth.ts`**

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user?.passwordHash) return null;
        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role ?? "editor",
        };
      },
    }),
  ],
});
```

- [ ] **Step 2: Write route handler `src/app/api/auth/[...nextauth]/route.ts`**

```typescript
import { handlers } from "@/../auth";

export const { GET, POST } = handlers;
```

> Note: `auth.ts` lives at repo root; `@/` maps to `src/`, so import via `@/../auth`. If the resolver rejects this, move `auth.ts`/`auth.config.ts` into `src/` and import `@/auth`. Confirm during Step 3.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: succeeds. If the `@/../auth` import fails to resolve, relocate `auth.ts` and `auth.config.ts` to `src/auth.ts` / `src/auth.config.ts`, update imports in `src/middleware.ts` (`./auth.config` → `./auth.config` stays) and route handler to `@/auth`, rebuild.

- [ ] **Step 4: Commit**

```bash
git add auth.ts src/app/api/auth
git commit -m "feat(auth): credentials provider with bcrypt + route handlers"
```

### Task A6: Auth helpers (authorization)

**Files:** Create `src/lib/auth-helpers.ts`.

- [ ] **Step 1: Write helpers**

```typescript
import { redirect } from "next/navigation";
import { auth } from "@/../auth";

/** Any authenticated user (admin or editor). Returns the session. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  return session;
}

/** Admin only. Editors are sent to the dashboard. */
export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== "admin") redirect("/admin");
  return session;
}
```

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth-helpers.ts
git commit -m "feat(auth): requireUser/requireAdmin authorization helpers"
```

### Task A7: Bootstrap admin script

**Files:** Create `scripts/create-admin.ts`; modify `package.json` scripts.

- [ ] **Step 1: Write `scripts/create-admin.ts`**

```typescript
import "dotenv/config";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin LIPAN RI";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL dan ADMIN_PASSWORD wajib di-set di env.");
  }

  const passwordHash = await hash(password, 12);

  await db
    .insert(users)
    .values({ email, name, passwordHash, role: "admin" })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash, name, role: "admin" },
    });

  console.log(`✅ Admin siap: ${email} (role: admin)`);
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Gagal membuat admin:", e);
  process.exit(1);
});
```

- [ ] **Step 2: Add script to `package.json`**

Add under `"scripts"`:

```json
"admin:create": "tsx scripts/create-admin.ts",
```

- [ ] **Step 3: Run it (requires DATABASE_URL + ADMIN_* in .env.local)**

Run: `pnpm admin:create`
Expected: prints `✅ Admin siap: <email> (role: admin)`.

- [ ] **Step 4: Commit**

```bash
git add scripts/create-admin.ts package.json
git commit -m "feat(auth): pnpm admin:create bootstrap script"
```

### Task A8: Login page + sign-in action

**Files:** Create `src/app/admin/login/page.tsx`, `src/app/admin/login/actions.ts`.

- [ ] **Step 1: Write `src/app/admin/login/actions.ts`**

```typescript
"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/../auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email atau password salah." };
    }
    throw error; // re-throw redirect
  }
}
```

> Note: a successful `signIn` throws a redirect (NEXT_REDIRECT) which must propagate — only `AuthError` is caught.

- [ ] **Step 2: Write `src/app/admin/login/page.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-50 px-4">
      <form
        action={action}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl ring-1 ring-navy-100 p-8 space-y-4"
      >
        <h1 className="font-heading text-2xl font-bold text-navy-900">
          Masuk Admin
        </h1>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-navy-900">
            Email
          </label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-navy-900">
            Password
          </label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Memproses…" : "Masuk"}
        </Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Build + manual check**

Run: `pnpm build` then `pnpm dev`, open `/admin/login`.
Expected: form renders; wrong creds show "Email atau password salah."; correct creds redirect to `/admin` (404 until Task A9 — that's fine).

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/login
git commit -m "feat(admin): login page + credentials sign-in action"
```

### Task A9: Admin shell (layout + sidebar + dashboard)

**Files:** Create `src/app/admin/layout.tsx`, `src/app/admin/sidebar.tsx`, `src/app/admin/page.tsx`.

- [ ] **Step 1: Write `src/app/admin/sidebar.tsx` (client, role-filtered nav + sign-out)**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "./actions";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/admin", label: "Dashboard", admin: false },
  { href: "/admin/posts", label: "Berita", admin: false },
  { href: "/admin/media", label: "Galeri", admin: false },
  { href: "/admin/categories", label: "Kategori", admin: true },
  { href: "/admin/users", label: "User", admin: true },
];

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r border-navy-100 bg-white p-4 flex flex-col">
      <p className="font-heading font-bold text-navy-900 px-2 mb-4">LIPAN RI Admin</p>
      <nav className="flex-1 space-y-1">
        {links
          .filter((l) => !l.admin || role === "admin")
          .map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`block rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-navy-700 hover:bg-navy-50"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
      </nav>
      <form action={signOutAction}>
        <Button type="submit" variant="outline" className="w-full">
          Keluar
        </Button>
      </form>
    </aside>
  );
}
```

- [ ] **Step 2: Write `src/app/admin/actions.ts` (sign-out)**

```typescript
"use server";

import { signOut } from "@/../auth";

export async function signOutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
```

- [ ] **Step 3: Write `src/app/admin/layout.tsx`**

```tsx
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { auth } from "@/../auth";
import { Sidebar } from "./sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Login page renders its own full-screen layout; detect via pathname header.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const session = await auth();

  if (!session?.user || pathname.endsWith("/admin/login")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-navy-50">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
```

> Note: `x-pathname` is not set by default. Simpler/robust alternative used here: the login route is **outside** this concern because middleware lets it through and `auth()` returns null there, so the `!session?.user` branch already renders bare children for logged-out users. Drop the pathname check if it complicates — the `!session?.user` guard is sufficient. Keep layout free of redirects (middleware handles auth); never call `requireUser()` in the layout.

- [ ] **Step 4: Write `src/app/admin/page.tsx` (dashboard)**

```tsx
import { db } from "@/db";
import { posts, media, users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireUser();
  const [[p], [m], [u]] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(posts),
    db.select({ n: sql<number>`count(*)` }).from(media),
    db.select({ n: sql<number>`count(*)` }).from(users),
  ]);

  const stats = [
    { label: "Berita", value: p.n },
    { label: "Media", value: m.n },
    { label: "User", value: u.n },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold text-navy-900">{s.value}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Build + manual check**

Run: `pnpm build`, then `pnpm dev`. Log in → land on `/admin` showing counts; sidebar hides Kategori/User if role is editor; "Keluar" returns to login; visiting `/admin` while logged out redirects to `/admin/login`.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/layout.tsx src/app/admin/sidebar.tsx src/app/admin/page.tsx src/app/admin/actions.ts
git commit -m "feat(admin): protected shell, role-filtered sidebar, dashboard"
```

### Task A10: Auth smoke tests (Playwright)

**Files:** Create `e2e/admin.spec.ts`.

- [ ] **Step 1: Write the smoke spec**

```typescript
import { test, expect } from "@playwright/test";

test("unauthenticated /admin redirects to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("wrong password shows error", async ({ page }) => {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', "nobody@example.com");
  await page.fill('input[name="password"]', "wrong");
  await page.click('button[type="submit"]');
  await expect(page.getByRole("alert")).toContainText("salah");
});
```

- [ ] **Step 2: Run**

Run: `pnpm e2e e2e/admin.spec.ts`
Expected: both tests pass against the prod build (per existing `playwright.config.ts`).

- [ ] **Step 3: Commit**

```bash
git add e2e/admin.spec.ts
git commit -m "test(admin): auth redirect + login error smoke tests"
```

---

# PHASE B — Posts CRUD + Tiptap editor

### Task B1: Add shadcn UI primitives

**Files:** Create `src/components/ui/{label,textarea,select,dialog,table}.tsx`.

- [ ] **Step 1: Add via shadcn CLI (base-nova style already configured)**

```bash
pnpm dlx shadcn@latest add label textarea select dialog table
```

- [ ] **Step 2: Verify files created and build**

Run: `ls src/components/ui` then `pnpm build`
Expected: the five files exist; build passes. If the CLI prompts for style/overwrite, accept defaults (base-nova) and do not overwrite existing components.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui components.json
git commit -m "feat(ui): add label, textarea, select, dialog, table primitives"
```

### Task B2: Slug + sanitize utilities

**Files:** Create `src/lib/slug.ts`, `src/lib/sanitize.ts`.

- [ ] **Step 1: Write `src/lib/slug.ts`**

```typescript
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Returns a post slug unique against existing rows, optionally excluding one id. */
export async function uniquePostSlug(title: string, excludeId?: number): Promise<string> {
  const base = slugify(title) || "artikel";
  let candidate = base;
  let n = 1;
  // Loop until no other row holds the candidate slug.
  while (true) {
    const [row] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, candidate))
      .limit(1);
    if (!row || row.id === excludeId) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}
```

- [ ] **Step 2: Write `src/lib/sanitize.ts`**

```typescript
import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s", "h2", "h3", "h4",
  "ul", "ol", "li", "blockquote", "a", "img", "figure", "figcaption",
];

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "title"];

/** Sanitize editor HTML before persisting (content is rendered via dangerouslySetInnerHTML). */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/)/i,
  });
}
```

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/lib/slug.ts src/lib/sanitize.ts
git commit -m "feat(admin): slug generation + HTML sanitization utils"
```

### Task B3: Post write data layer

**Files:** Create `src/lib/admin/posts.ts`.

- [ ] **Step 1: Write the module**

```typescript
import { db } from "@/db";
import { posts, categories } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { uniquePostSlug } from "@/lib/slug";
import { sanitizeHtml } from "@/lib/sanitize";

export type PostInput = {
  title: string;
  content: string; // raw HTML from editor; sanitized here
  excerpt?: string | null;
  featuredImage?: string | null;
  categoryId?: number | null;
  isFeatured: boolean;
  status: "draft" | "published";
};

export async function listPostsAdmin() {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      status: posts.status,
      isFeatured: posts.isFeatured,
      updatedAt: posts.updatedAt,
      categoryName: categories.name,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .orderBy(desc(posts.updatedAt));
}

export async function getPostByIdAdmin(id: number) {
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return row ?? null;
}

export async function createPost(input: PostInput, authorId: number) {
  const slug = await uniquePostSlug(input.title);
  const [row] = await db
    .insert(posts)
    .values({
      slug,
      title: input.title,
      content: sanitizeHtml(input.content),
      excerpt: input.excerpt ?? null,
      featuredImage: input.featuredImage ?? null,
      categoryId: input.categoryId ?? null,
      isFeatured: input.isFeatured,
      status: input.status,
      authorId,
      publishedAt: input.status === "published" ? new Date() : null,
    })
    .returning({ id: posts.id });
  return row.id;
}

export async function updatePost(id: number, input: PostInput) {
  const slug = await uniquePostSlug(input.title, id);
  await db
    .update(posts)
    .set({
      slug,
      title: input.title,
      content: sanitizeHtml(input.content),
      excerpt: input.excerpt ?? null,
      featuredImage: input.featuredImage ?? null,
      categoryId: input.categoryId ?? null,
      isFeatured: input.isFeatured,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id));
}

export async function deletePost(id: number) {
  await db.delete(posts).where(eq(posts.id, id));
}
```

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/admin/posts.ts
git commit -m "feat(admin): post create/update/delete/list data layer"
```

### Task B4: Image upload action + component

**Files:** Create `src/components/admin/image-upload.tsx`; add `uploadImageAction` to `src/app/admin/media/actions.ts`.

- [ ] **Step 1: Write `src/app/admin/media/actions.ts` (upload action)**

```typescript
"use server";

import { requireUser } from "@/lib/auth-helpers";
import { uploadImage } from "@/lib/r2";
import { db } from "@/db";
import { media } from "@/db/schema";

const MAX_BYTES = 8 * 1024 * 1024;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadImageAction(formData: FormData): Promise<{ url?: string; error?: string }> {
  await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Tidak ada berkas." };
  if (!OK_TYPES.includes(file.type)) return { error: "Format gambar tidak didukung." };
  if (file.size > MAX_BYTES) return { error: "Ukuran gambar maksimal 8MB." };

  const buf = Buffer.from(await file.arrayBuffer());
  const keyBase = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { url } = await uploadImage(buf, keyBase);

  await db.insert(media).values({ url, altText: file.name });
  return { url };
}
```

- [ ] **Step 2: Write `src/components/admin/image-upload.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { uploadImageAction } from "@/app/admin/media/actions";
import { Button } from "@/components/ui/button";

export function ImageUpload({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (url: string) => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    setError(undefined);
    start(async () => {
      const res = await uploadImageAction(fd);
      if (res.error) setError(res.error);
      else if (res.url) onChange(res.url);
    });
  }

  return (
    <div className="space-y-2">
      {value && (
        // eslint-disable-next-line @next/next/no-img-element -- preview URL (R2)
        <img src={value} alt="" className="h-32 rounded-md object-cover" />
      )}
      <input type="file" accept="image/*" onChange={handleFile} disabled={pending} />
      {pending && <p className="text-sm text-muted-foreground">Mengunggah…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/media/actions.ts src/components/admin/image-upload.tsx
git commit -m "feat(admin): R2 image upload action + uploader component"
```

### Task B5: Tiptap editor component

**Files:** Modify `package.json` (deps); create `src/components/admin/editor.tsx`.

- [ ] **Step 1: Install Tiptap**

```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/pm @tiptap/extension-link @tiptap/extension-image
```

- [ ] **Step 2: Write `src/components/admin/editor.tsx`**

```tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Button } from "@/components/ui/button";

export function Editor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: value,
    immediatelyRender: false,
    editorProps: { attributes: { class: "prose prose-blue max-w-none min-h-[300px] focus:outline-none" } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  return (
    <div className="rounded-md border border-navy-200">
      <div className="flex flex-wrap gap-1 border-b border-navy-100 p-2">
        <ToolbarButton on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>B</ToolbarButton>
        <ToolbarButton on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>I</ToolbarButton>
        <ToolbarButton on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>H2</ToolbarButton>
        <ToolbarButton on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>H3</ToolbarButton>
        <ToolbarButton on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>• List</ToolbarButton>
        <ToolbarButton on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>1. List</ToolbarButton>
        <ToolbarButton on={() => { const url = prompt("URL tautan:"); if (url) editor.chain().focus().setLink({ href: url }).run(); }} active={editor.isActive("link")}>Link</ToolbarButton>
        <ToolbarButton on={() => { const url = prompt("URL gambar:"); if (url) editor.chain().focus().setImage({ src: url }).run(); }} active={false}>Gambar</ToolbarButton>
      </div>
      <EditorContent editor={editor} className="p-3" />
    </div>
  );
}

function ToolbarButton({ on, active, children }: { on: () => void; active: boolean; children: React.ReactNode }) {
  return (
    <Button type="button" variant={active ? "default" : "outline"} size="sm" onClick={on}>
      {children}
    </Button>
  );
}
```

> Note: `immediatelyRender: false` is required to avoid SSR hydration mismatches with Tiptap in the App Router.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml src/components/admin/editor.tsx
git commit -m "feat(admin): Tiptap rich-text editor component"
```

### Task B6: Post server actions

**Files:** Create `src/app/admin/posts/actions.ts`.

- [ ] **Step 1: Write the actions**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth-helpers";
import { createPost, updatePost, deletePost, type PostInput } from "@/lib/admin/posts";

const schema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  content: z.string().min(1, "Isi wajib diisi"),
  excerpt: z.string().optional(),
  featuredImage: z.string().url().optional().or(z.literal("")),
  categoryId: z.coerce.number().int().positive().optional(),
  isFeatured: z.coerce.boolean().optional(),
  status: z.enum(["draft", "published"]),
});

export type PostFormState = { error?: string };

function parse(formData: FormData): PostInput {
  const data = schema.parse({
    title: formData.get("title"),
    content: formData.get("content"),
    excerpt: formData.get("excerpt") || undefined,
    featuredImage: formData.get("featuredImage") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    isFeatured: formData.get("isFeatured") === "on",
    status: formData.get("status"),
  });
  return {
    title: data.title,
    content: data.content,
    excerpt: data.excerpt ?? null,
    featuredImage: data.featuredImage ? data.featuredImage : null,
    categoryId: data.categoryId ?? null,
    isFeatured: !!data.isFeatured,
    status: data.status,
  };
}

export async function createPostAction(_prev: PostFormState, formData: FormData): Promise<PostFormState> {
  const session = await requireUser();
  let input: PostInput;
  try {
    input = parse(formData);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid." };
  }
  await createPost(input, Number(session.user.id));
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}

export async function updatePostAction(id: number, _prev: PostFormState, formData: FormData): Promise<PostFormState> {
  await requireUser();
  let input: PostInput;
  try {
    input = parse(formData);
  } catch (e) {
    return { error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid." };
  }
  await updatePost(id, input);
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}

export async function deletePostAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  await deletePost(id);
  revalidatePath("/admin/posts");
}
```

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/posts/actions.ts
git commit -m "feat(admin): post create/update/delete server actions"
```

### Task B7: Post form (shared new/edit)

**Files:** Create `src/app/admin/posts/post-form.tsx`.

- [ ] **Step 1: Write the client form**

```tsx
"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Editor } from "@/components/admin/editor";
import { ImageUpload } from "@/components/admin/image-upload";
import type { PostFormState } from "./actions";

export type PostFormValues = {
  title: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  categoryId: string;
  isFeatured: boolean;
  status: "draft" | "published";
};

export function PostForm({
  action,
  initial,
  categories,
}: {
  action: (prev: PostFormState, fd: FormData) => Promise<PostFormState>;
  initial: PostFormValues;
  categories: { id: number; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<PostFormState, FormData>(action, {});
  const [content, setContent] = useState(initial.content);
  const [featuredImage, setFeaturedImage] = useState(initial.featuredImage);

  return (
    <form action={formAction} className="space-y-5 max-w-3xl">
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="featuredImage" value={featuredImage} />

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="title">Judul</label>
        <Input id="title" name="title" defaultValue={initial.title} required />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Gambar Utama</label>
        <ImageUpload value={featuredImage} onChange={setFeaturedImage} />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="excerpt">Ringkasan</label>
        <Input id="excerpt" name="excerpt" defaultValue={initial.excerpt} />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Isi</label>
        <Editor value={content} onChange={setContent} />
      </div>

      <div className="flex flex-wrap gap-6 items-end">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="categoryId">Kategori</label>
          <select id="categoryId" name="categoryId" defaultValue={initial.categoryId}
            className="h-9 rounded-md border border-navy-200 px-2 text-sm">
            <option value="">— Tidak ada —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={initial.status}
            className="h-9 rounded-md border border-navy-200 px-2 text-sm">
            <option value="draft">Draft</option>
            <option value="published">Terbit</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isFeatured" defaultChecked={initial.isFeatured} />
          Tampilkan sebagai unggulan
        </label>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/posts/post-form.tsx
git commit -m "feat(admin): shared post form (editor + image + meta)"
```

### Task B8: Posts list, new, edit pages

**Files:** Create `src/app/admin/posts/page.tsx`, `src/app/admin/posts/new/page.tsx`, `src/app/admin/posts/[id]/edit/page.tsx`.

- [ ] **Step 1: Write list page `src/app/admin/posts/page.tsx`**

```tsx
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { listPostsAdmin } from "@/lib/admin/posts";
import { deletePostAction } from "./actions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PostsListPage() {
  await requireUser();
  const rows = await listPostsAdmin();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold text-navy-900">Berita</h1>
        <Button render={<Link href="/admin/posts/new">Tambah</Link>} />
      </div>
      <table className="w-full text-sm bg-white rounded-lg ring-1 ring-navy-100">
        <thead className="text-left text-muted-foreground">
          <tr className="border-b border-navy-100">
            <th className="p-3">Judul</th>
            <th className="p-3">Kategori</th>
            <th className="p-3">Status</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-navy-50">
              <td className="p-3 font-medium text-navy-900">{r.title}</td>
              <td className="p-3">{r.categoryName ?? "—"}</td>
              <td className="p-3">{r.status === "published" ? "Terbit" : "Draft"}</td>
              <td className="p-3 flex gap-2 justify-end">
                <Button size="sm" variant="outline" render={<Link href={`/admin/posts/${r.id}/edit`}>Edit</Link>} />
                <form action={deletePostAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <Button size="sm" variant="outline" type="submit">Hapus</Button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Write new page `src/app/admin/posts/new/page.tsx`**

```tsx
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { PostForm } from "../post-form";
import { createPostAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requireUser();
  const cats = await db.select({ id: categories.id, name: categories.name }).from(categories);
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy-900 mb-6">Tambah Berita</h1>
      <PostForm
        action={createPostAction}
        categories={cats}
        initial={{ title: "", content: "", excerpt: "", featuredImage: "", categoryId: "", isFeatured: false, status: "draft" }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Write edit page `src/app/admin/posts/[id]/edit/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { getPostByIdAdmin } from "@/lib/admin/posts";
import { PostForm } from "../../post-form";
import { updatePostAction, type PostFormState } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const postId = Number(id);
  const post = await getPostByIdAdmin(postId);
  if (!post) notFound();
  const cats = await db.select({ id: categories.id, name: categories.name }).from(categories);

  const action = updatePostAction.bind(null, postId) as (prev: PostFormState, fd: FormData) => Promise<PostFormState>;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy-900 mb-6">Edit Berita</h1>
      <PostForm
        action={action}
        categories={cats}
        initial={{
          title: post.title,
          content: post.content,
          excerpt: post.excerpt ?? "",
          featuredImage: post.featuredImage ?? "",
          categoryId: post.categoryId ? String(post.categoryId) : "",
          isFeatured: !!post.isFeatured,
          status: post.status ?? "draft",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Build + manual check**

Run: `pnpm build`, `pnpm dev`. Create a post (draft + published), verify it appears on `/admin/posts`, edit it, confirm it renders on the public site (`/<slug>`), delete it. Verify sanitization: paste a `<script>` in the editor source — it must not persist.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/posts
git commit -m "feat(admin): posts list, create, and edit pages"
```

---

# PHASE C — Galeri (media) management

### Task C1: Media data layer + delete action

**Files:** Create `src/lib/admin/media.ts`; extend `src/app/admin/media/actions.ts` with `deleteMediaAction`.

- [ ] **Step 1: Write `src/lib/admin/media.ts`**

```typescript
import { db } from "@/db";
import { media } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function listMedia() {
  return db.select().from(media).orderBy(desc(media.uploadedAt));
}

export async function deleteMediaRow(id: number) {
  await db.delete(media).where(eq(media.id, id));
}
```

> Note: v1 removes the DB row only; the R2 object is left in place (object cleanup is out of scope per the spec). Document this in the page.

- [ ] **Step 2: Append `deleteMediaAction` to `src/app/admin/media/actions.ts`**

```typescript
import { revalidatePath } from "next/cache";
import { deleteMediaRow } from "@/lib/admin/media";

export async function deleteMediaAction(formData: FormData) {
  await requireUser();
  await deleteMediaRow(Number(formData.get("id")));
  revalidatePath("/admin/media");
}
```

> Add the two imports at the top of the existing file (`revalidatePath`, `deleteMediaRow`); keep `uploadImageAction` unchanged. Also call `revalidatePath("/admin/media")` inside `uploadImageAction` before returning.

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/lib/admin/media.ts src/app/admin/media/actions.ts
git commit -m "feat(admin): media list + delete data layer/action"
```

### Task C2: Galeri page

**Files:** Create `src/app/admin/media/page.tsx`.

- [ ] **Step 1: Write the page**

```tsx
import { requireUser } from "@/lib/auth-helpers";
import { listMedia } from "@/lib/admin/media";
import { deleteMediaAction } from "./actions";
import { GalleryUploader } from "./uploader";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  await requireUser();
  const items = await listMedia();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy-900 mb-6">Galeri</h1>
      <GalleryUploader />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        {items.map((m) => (
          <div key={m.id} className="bg-white rounded-lg ring-1 ring-navy-100 p-2 space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- R2 URL */}
            <img src={m.url} alt={m.altText ?? ""} className="aspect-square w-full rounded object-cover" />
            <form action={deleteMediaAction}>
              <input type="hidden" name="id" value={m.id} />
              <Button size="sm" variant="outline" type="submit" className="w-full">Hapus</Button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/app/admin/media/uploader.tsx` (client; reuses upload action + refreshes)**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/admin/image-upload";

export function GalleryUploader() {
  const router = useRouter();
  return (
    <div className="bg-white rounded-lg ring-1 ring-navy-100 p-4 max-w-md">
      <p className="text-sm font-medium mb-2">Unggah gambar baru</p>
      <ImageUpload onChange={() => router.refresh()} />
    </div>
  );
}
```

- [ ] **Step 3: Build + manual check**

Run: `pnpm build`, `pnpm dev`. Upload an image on `/admin/media`; it appears in the grid; delete removes it from the list.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/media/page.tsx src/app/admin/media/uploader.tsx
git commit -m "feat(admin): gallery page with upload + delete"
```

---

# PHASE D — Categories & Users (admin only)

### Task D1: Category data layer + actions

**Files:** Create `src/lib/admin/categories.ts`, `src/app/admin/categories/actions.ts`.

- [ ] **Step 1: Write `src/lib/admin/categories.ts`**

```typescript
import { db } from "@/db";
import { categories } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { slugify } from "@/lib/slug";

export async function listCategories() {
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function createCategory(name: string, description: string | null) {
  await db.insert(categories).values({ name, slug: slugify(name), description });
}

export async function updateCategory(id: number, name: string, description: string | null) {
  await db.update(categories).set({ name, slug: slugify(name), description }).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  await db.delete(categories).where(eq(categories.id, id));
}
```

- [ ] **Step 2: Write `src/app/admin/categories/actions.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";
import { createCategory, updateCategory, deleteCategory } from "@/lib/admin/categories";

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await createCategory(name, String(formData.get("description") ?? "") || null);
  revalidatePath("/admin/categories");
}

export async function updateCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await updateCategory(id, name, String(formData.get("description") ?? "") || null);
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  await deleteCategory(Number(formData.get("id")));
  revalidatePath("/admin/categories");
}
```

- [ ] **Step 3: Build + commit**

Run: `pnpm build` (expect pass).

```bash
git add src/lib/admin/categories.ts src/app/admin/categories/actions.ts
git commit -m "feat(admin): category data layer + admin-only actions"
```

### Task D2: Categories page

**Files:** Create `src/app/admin/categories/page.tsx`.

- [ ] **Step 1: Write the page (admin-gated)**

```tsx
import { requireAdmin } from "@/lib/auth-helpers";
import { listCategories } from "@/lib/admin/categories";
import { createCategoryAction, deleteCategoryAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await requireAdmin();
  const rows = await listCategories();

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-navy-900 mb-6">Kategori</h1>

      <form action={createCategoryAction} className="flex gap-2 mb-6">
        <Input name="name" placeholder="Nama kategori" required />
        <Input name="description" placeholder="Deskripsi (opsional)" />
        <Button type="submit">Tambah</Button>
      </form>

      <ul className="bg-white rounded-lg ring-1 ring-navy-100 divide-y divide-navy-50">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium text-navy-900">{c.name}</p>
              <p className="text-xs text-muted-foreground">/{c.slug}</p>
            </div>
            <form action={deleteCategoryAction}>
              <input type="hidden" name="id" value={c.id} />
              <Button size="sm" variant="outline" type="submit">Hapus</Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Build + manual check**

Run: `pnpm build`, `pnpm dev`. As admin: add/delete a category. As editor: `/admin/categories` redirects to `/admin`.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/categories/page.tsx
git commit -m "feat(admin): categories management page (admin only)"
```

### Task D3: User data layer + actions

**Files:** Create `src/lib/admin/users.ts`, `src/app/admin/users/actions.ts`.

- [ ] **Step 1: Write `src/lib/admin/users.ts`**

```typescript
import { db } from "@/db";
import { users } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { hash } from "bcryptjs";

export async function listUsers() {
  return db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(users)
    .orderBy(asc(users.email));
}

export async function createUser(email: string, name: string, password: string, role: string) {
  const passwordHash = await hash(password, 12);
  await db.insert(users).values({ email, name, passwordHash, role });
}

export async function updateUserPassword(id: number, password: string) {
  const passwordHash = await hash(password, 12);
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));
}

export async function updateUserRole(id: number, role: string) {
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  await db.delete(users).where(eq(users.id, id));
}
```

- [ ] **Step 2: Write `src/app/admin/users/actions.ts`**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";
import { createUser, updateUserPassword, updateUserRole, deleteUser } from "@/lib/admin/users";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(["admin", "editor"]),
});

export async function createUserAction(formData: FormData) {
  await requireAdmin();
  const parsed = createSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return;
  const { email, name, password, role } = parsed.data;
  await createUser(email, name, password, role);
  revalidatePath("/admin/users");
}

export async function resetPasswordAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  if (!id || password.length < 8) return;
  await updateUserPassword(id, password);
  revalidatePath("/admin/users");
}

export async function setRoleAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const role = String(formData.get("role") ?? "");
  if (!id || (role !== "admin" && role !== "editor")) return;
  await updateUserRole(id, role);
  revalidatePath("/admin/users");
}

export async function deleteUserAction(formData: FormData) {
  const session = await requireAdmin();
  const id = Number(formData.get("id"));
  if (id === Number(session.user.id)) return; // never delete yourself
  await deleteUser(id);
  revalidatePath("/admin/users");
}
```

- [ ] **Step 3: Build + commit**

Run: `pnpm build` (expect pass).

```bash
git add src/lib/admin/users.ts src/app/admin/users/actions.ts
git commit -m "feat(admin): user data layer + admin-only actions"
```

### Task D4: Users page

**Files:** Create `src/app/admin/users/page.tsx`.

- [ ] **Step 1: Write the page (admin-gated)**

```tsx
import { requireAdmin } from "@/lib/auth-helpers";
import { listUsers } from "@/lib/admin/users";
import { createUserAction, resetPasswordAction, setRoleAction, deleteUserAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await requireAdmin();
  const rows = await listUsers();

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-navy-900 mb-6">User</h1>

      <form action={createUserAction} className="grid grid-cols-2 gap-2 mb-6 bg-white p-4 rounded-lg ring-1 ring-navy-100">
        <Input name="name" placeholder="Nama" required />
        <Input name="email" type="email" placeholder="Email" required />
        <Input name="password" type="password" placeholder="Password (min 8)" required />
        <select name="role" className="h-9 rounded-md border border-navy-200 px-2 text-sm">
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
        <Button type="submit" className="col-span-2">Tambah User</Button>
      </form>

      <ul className="bg-white rounded-lg ring-1 ring-navy-100 divide-y divide-navy-50">
        {rows.map((u) => (
          <li key={u.id} className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-navy-900">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <form action={setRoleAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={u.id} />
                <select name="role" defaultValue={u.role ?? "editor"} className="h-8 rounded-md border border-navy-200 px-2 text-xs">
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <Button size="sm" variant="outline" type="submit">Set Role</Button>
              </form>
            </div>
            <div className="flex items-center gap-2">
              <form action={resetPasswordAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={u.id} />
                <Input name="password" type="password" placeholder="Password baru" className="h-8 w-40" />
                <Button size="sm" variant="outline" type="submit">Reset Password</Button>
              </form>
              {u.id !== Number(session.user.id) && (
                <form action={deleteUserAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <Button size="sm" variant="outline" type="submit">Hapus</Button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Build + manual check**

Run: `pnpm build`, `pnpm dev`. As admin: create an editor user, log in as that editor in a separate browser/profile, confirm editor sees only Berita/Galeri and is redirected from `/admin/users`. Reset password works (re-login). Cannot delete own account.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/users/page.tsx
git commit -m "feat(admin): users management page (admin only)"
```

---

# Final verification

### Task Z1: Full smoke + lint/build + e2e

- [ ] **Step 1: Lint + build**

Run: `pnpm lint && pnpm build`
Expected: zero errors.

- [ ] **Step 2: E2E**

Run: `pnpm e2e`
Expected: existing suite + `e2e/admin.spec.ts` pass.

- [ ] **Step 3: Manual end-to-end pass (logged in as admin)**

Verify in order: login → dashboard counts → create published post with image + rich text → see it on public site → upload gallery image → add category → create editor user → editor login restrictions → sign out.

- [ ] **Step 4: Finalize branch**

Use `superpowers:finishing-a-development-branch` to decide merge/PR. Do not push to `master` automatically.

---

## Self-review notes (author)

- **Spec coverage:** Auth (A4–A6), login (A8), middleware+role (A4, A6), bootstrap (A7), posts CRUD + Tiptap + sanitize (B2–B8), media (B4, C1–C2), categories (D1–D2), users (D3–D4), smoke tests (A10, Z1). All spec sections mapped.
- **Editor SSR:** `immediatelyRender: false` set (Task B5) to avoid hydration mismatch.
- **Security:** content sanitized on write (B2/B3); upload type+size validated (B4); admin-only actions all call `requireAdmin` (D1, D3); self-delete guarded (D3/D4); generic login error (A8).
- **Open risk to confirm during A5:** root-level `auth.ts` import path (`@/../auth`). If the TS path resolver rejects it, relocate `auth.ts`/`auth.config.ts` into `src/` and switch imports to `@/auth` — fix once, applies everywhere.
