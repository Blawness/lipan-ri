# Legalitas Dokumen QR — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan fitur verifikasi legalitas dokumen berbasis QR code — admin mendaftarkan dokumen, sistem menghasilkan QR, publik memindai untuk verifikasi.

**Architecture:** 1 tabel DB baru `documents`, halaman publik `/verifikasi/[slug]`, 3 screen admin di `/admin/dokumen/*`, QR code di-generate on-the-fly via API route.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, PostgreSQL, @blawness/admin-kit, `qrcode` npm package.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/db/schema.ts` (modify) | Tambah enum `documentStatus` + tabel `documents` |
| `src/lib/documents.ts` (create) | Public data access: `getDocumentBySlug()` |
| `src/lib/admin/documents.ts` (create) | Admin data access: `listDocuments()`, `getDocumentById()`, `createDocument()`, `updateDocument()`, `revokeDocument()`, `deleteDocument()` |
| `src/app/api/verifikasi/[slug]/qr/route.ts` (create) | QR code PNG endpoint |
| `src/app/(site)/verifikasi/[slug]/page.tsx` (create) | Halaman verifikasi publik |
| `src/app/admin/layout.tsx` (modify) | Tambah nav item "Dokumen" |
| `src/app/admin/dokumen/actions.ts` (create) | Server actions (create, update, revoke, delete) |
| `src/app/admin/dokumen/dokumen-form.tsx` (create) | Form component (create + edit) |
| `src/app/admin/dokumen/page.tsx` (create) | List dokumen (table + search + revoke) |
| `src/app/admin/dokumen/baru/page.tsx` (create) | Halaman tambah dokumen |
| `src/app/admin/dokumen/[id]/edit/page.tsx` (create) | Halaman edit dokumen |

---

### Task 1: Install dependency `qrcode`

- [ ] **Step 1: Install qrcode**

```bash
pnpm add qrcode && pnpm add -D @types/qrcode
```

---

### Task 2: Add `documents` table to DB schema

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add enum and table to schema**

After the existing `postStatusEnum` (line 12), add the document status enum. After the `banners` table (end of file), add the `documents` table.

In `src/db/schema.ts`, add after line 12:

```ts
export const documentStatusEnum = pgEnum("document_status", ["active", "revoked"]);
```

And at the end of the file (after line 58), add:

```ts
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  number: text("number").notNull(),
  title: text("title").notNull(),
  signatory: text("signatory").notNull(),
  issuedAt: timestamp("issued_at").notNull(),
  fileUrl: text("file_url"),
  status: documentStatusEnum("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

### Task 3: Generate and run DB migration

- [ ] **Step 1: Generate migration**

```bash
pnpm drizzle-kit generate
```

- [ ] **Step 2: Apply migration**

```bash
pnpm drizzle-kit push
```

---

### Task 4: Public data access layer

**Files:**
- Create: `src/lib/documents.ts`

- [ ] **Step 1: Create data access for public verification**

Create `src/lib/documents.ts`:

```ts
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getDocumentBySlug(slug: string) {
  const results = await db
    .select({
      id: documents.id,
      slug: documents.slug,
      number: documents.number,
      title: documents.title,
      signatory: documents.signatory,
      issuedAt: documents.issuedAt,
      status: documents.status,
    })
    .from(documents)
    .where(eq(documents.slug, slug))
    .limit(1);

  return results[0] ?? null;
}
```

---

### Task 5: Admin data access layer

**Files:**
- Create: `src/lib/admin/documents.ts`

- [ ] **Step 1: Create admin CRUD functions**

Create `src/lib/admin/documents.ts`:

```ts
import { db } from "@/db";
import { documents } from "@/db/schema";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { randomUUID } from "crypto";

function documentSlug(number: string): string {
  const base = number
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = randomUUID().slice(0, 6);
  return `${base}-${suffix}`;
}

export type DocumentInput = {
  number: string;
  title: string;
  signatory: string;
  issuedAt: Date;
  fileUrl?: string | null;
  status?: "active" | "revoked";
};

export type ListDocumentsAdminParams = {
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function listDocumentsAdmin({
  q,
  page = 1,
  pageSize = 15,
}: ListDocumentsAdminParams = {}) {
  const conditions = [];
  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    conditions.push(
      or(
        ilike(documents.title, term),
        ilike(documents.number, term),
        ilike(documents.signatory, term)
      )
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: documents.id,
        number: documents.number,
        title: documents.title,
        signatory: documents.signatory,
        issuedAt: documents.issuedAt,
        status: documents.status,
        slug: documents.slug,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .where(where)
      .orderBy(desc(documents.updatedAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(documents).where(where),
  ]);

  return { rows, total: Number(countResult[0]?.value ?? 0) };
}

export async function getDocumentById(id: number) {
  const [row] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);
  return row ?? null;
}

export async function createDocument(input: DocumentInput) {
  const slug = documentSlug(input.number);
  const [row] = await db
    .insert(documents)
    .values({
      slug,
      number: input.number,
      title: input.title,
      signatory: input.signatory,
      issuedAt: input.issuedAt,
      fileUrl: input.fileUrl ?? null,
      status: input.status ?? "active",
    })
    .returning({ id: documents.id });
  return row.id;
}

export async function updateDocument(id: number, input: DocumentInput) {
  await db
    .update(documents)
    .set({
      number: input.number,
      title: input.title,
      signatory: input.signatory,
      issuedAt: input.issuedAt,
      fileUrl: input.fileUrl ?? null,
      status: input.status ?? "active",
      updatedAt: new Date(),
    })
    .where(eq(documents.id, id));
}

export async function revokeDocument(id: number) {
  await db
    .update(documents)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(eq(documents.id, id));
}

export async function deleteDocument(id: number) {
  await db.delete(documents).where(eq(documents.id, id));
}
```

---

### Task 6: QR code API route

**Files:**
- Create: `src/app/api/verifikasi/[slug]/qr/route.ts`

- [ ] **Step 1: Create QR code PNG endpoint**

Create `src/app/api/verifikasi/[slug]/qr/route.ts`:

```ts
import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = `https://lipan-ri.or.id/verifikasi/${slug}`;
  const pngBuffer = await QRCode.toBuffer(url, {
    width: 400,
    margin: 2,
    color: { dark: "#0f2b46", light: "#ffffff" },
  });

  return new NextResponse(pngBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
```

---

### Task 7: Public verification page

**Files:**
- Create: `src/app/(site)/verifikasi/[slug]/page.tsx`

- [ ] **Step 1: Create verification page**

Create `src/app/(site)/verifikasi/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getDocumentBySlug } from "@/lib/documents";
import { CheckCircle, XCircle, Calendar, User, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" });

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function VerifikasiPage({ params }: Props) {
  const { slug } = await params;
  const doc = await getDocumentBySlug(slug);

  if (!doc) {
    notFound();
  }

  const isValid = doc.status === "active";

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-2xl border border-navy-100 bg-white p-8 shadow-sm text-center">
        {isValid ? (
          <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
        ) : (
          <XCircle className="mx-auto h-16 w-16 text-red-500" />
        )}

        <h1 className="mt-4 font-heading text-xl font-bold text-navy-900">
          {isValid ? "Dokumen Valid" : "Dokumen Tidak Berlaku"}
        </h1>

        {isValid ? (
          <p className="mt-1 text-sm text-emerald-700">
            Dokumen ini terdaftar dan sah menurut sistem LIPAN RI.
          </p>
        ) : (
          <p className="mt-1 text-sm text-red-700">
            Dokumen ini telah dicabut dan tidak berlaku lagi.
          </p>
        )}

        <div className="mt-8 space-y-3 rounded-xl border border-navy-100 bg-navy-50/50 p-5 text-left text-sm">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
            <div>
              <p className="text-xs text-muted-foreground">Nomor Surat</p>
              <p className="font-medium text-navy-900">{doc.number}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
            <div>
              <p className="text-xs text-muted-foreground">Perihal</p>
              <p className="font-medium text-navy-900">{doc.title}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
            <div>
              <p className="text-xs text-muted-foreground">Tanggal Terbit</p>
              <p className="font-medium text-navy-900">
                {dateFmt.format(doc.issuedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
            <div>
              <p className="text-xs text-muted-foreground">Penandatangan</p>
              <p className="font-medium text-navy-900">{doc.signatory}</p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Verifikasi oleh LIPAN RI &middot; Informasi ini bersifat publik
        </p>
      </div>
    </div>
  );
}
```

---

### Task 8: Add admin nav item

**Files:**
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: Add "Dokumen" to nav items and import icon**

In `src/app/admin/layout.tsx`, add `FileCheck` to the lucide-react import:

```ts
import {
  LayoutDashboard, Newspaper, Images, Tags, Users, GalleryHorizontal, FileCheck,
} from "lucide-react";
```

And add the nav item before the closing `];`:

```ts
  { href: "/admin/dokumen", label: "Dokumen", icon: <FileCheck className="h-4 w-4" />, adminOnly: true },
```

---

### Task 9: Admin server actions

**Files:**
- Create: `src/app/admin/dokumen/actions.ts`

- [ ] **Step 1: Create server actions**

Create `src/app/admin/dokumen/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@blawness/admin-kit/auth-helpers";
import {
  createDocument,
  updateDocument,
  revokeDocument,
  deleteDocument,
  type DocumentInput,
} from "@/lib/admin/documents";

const schema = z.object({
  number: z.string().min(1, "Nomor surat wajib diisi"),
  title: z.string().min(1, "Perihal wajib diisi"),
  signatory: z.string().min(1, "Nama penandatangan wajib diisi"),
  issuedAt: z.string().min(1, "Tanggal terbit wajib diisi"),
  fileUrl: z.string().optional(),
  status: z.enum(["active", "revoked"]).optional(),
});

export type DocumentFormState = { error?: string };

function parse(formData: FormData): DocumentInput {
  const data = schema.parse({
    number: formData.get("number"),
    title: formData.get("title"),
    signatory: formData.get("signatory"),
    issuedAt: formData.get("issuedAt"),
    fileUrl: formData.get("fileUrl") || undefined,
    status: formData.get("status") || undefined,
  });
  return {
    number: data.number,
    title: data.title,
    signatory: data.signatory,
    issuedAt: new Date(data.issuedAt),
    fileUrl: data.fileUrl ?? null,
    status: data.status as "active" | "revoked" | undefined,
  };
}

export async function createDocumentAction(
  _prev: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  await requireUser();
  let input: DocumentInput;
  try {
    input = parse(formData);
  } catch (e) {
    return {
      error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid.",
    };
  }
  await createDocument(input);
  revalidatePath("/admin/dokumen");
  redirect("/admin/dokumen?saved=created");
}

export async function updateDocumentAction(
  id: number,
  _prev: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  await requireUser();
  let input: DocumentInput;
  try {
    input = parse(formData);
  } catch (e) {
    return {
      error: e instanceof z.ZodError ? e.issues[0].message : "Data tidak valid.",
    };
  }
  await updateDocument(id, input);
  revalidatePath("/admin/dokumen");
  redirect("/admin/dokumen?saved=updated");
}

export async function revokeDocumentAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await revokeDocument(id);
  revalidatePath("/admin/dokumen");
}

export async function deleteDocumentAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  await deleteDocument(id);
  revalidatePath("/admin/dokumen");
}
```

---

### Task 10: Admin form component

**Files:**
- Create: `src/app/admin/dokumen/dokumen-form.tsx`

- [ ] **Step 1: Create shared form component**

Create `src/app/admin/dokumen/dokumen-form.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@blawness/admin-kit/components";
import { uploadImageAction } from "@blawness/admin-kit/screens/media/actions";
import type { DocumentFormState } from "./actions";

export type DocumentFormValues = {
  number: string;
  title: string;
  signatory: string;
  issuedAt: string;
  fileUrl: string;
  status: "active" | "revoked";
};

const labelClass = "text-sm font-medium text-navy-800";

export function DokumenForm({
  action,
  initial,
}: {
  action: (
    prev: DocumentFormState,
    fd: FormData
  ) => Promise<DocumentFormState>;
  initial: DocumentFormValues;
}) {
  const [state, formAction, pending] = useActionState<
    DocumentFormState,
    FormData
  >(action, {});
  const [fileUrl, setFileUrl] = useState(initial.fileUrl);

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      <input type="hidden" name="fileUrl" value={fileUrl} />

      <div className="space-y-5 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="number">
            Nomor Surat
          </label>
          <Input
            id="number"
            name="number"
            defaultValue={initial.number}
            required
            placeholder="001/LIPAN/VI/2026"
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="title">
            Perihal
          </label>
          <Input
            id="title"
            name="title"
            defaultValue={initial.title}
            required
            placeholder="Surat Keterangan Keanggotaan"
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="signatory">
            Nama Penandatangan
          </label>
          <Input
            id="signatory"
            name="signatory"
            defaultValue={initial.signatory}
            required
            placeholder="Dr. H. Ahmad Fauzi, M.Si."
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="issuedAt">
            Tanggal Terbit
          </label>
          <Input
            id="issuedAt"
            name="issuedAt"
            type="date"
            defaultValue={initial.issuedAt}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Dokumen PDF (opsional)</label>
          <ImageUpload
            value={fileUrl}
            onChange={setFileUrl}
            label="dokumen PDF"
            uploadAction={uploadImageAction}
          />
        </div>
      </div>

      {state.error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button
          variant="outline"
          render={<Link href="/admin/dokumen">Batal</Link>}
        />
      </div>
    </form>
  );
}
```

---

### Task 11: Admin list page

**Files:**
- Create: `src/app/admin/dokumen/page.tsx`

- [ ] **Step 1: Create document list page with search, revoke, delete**

Create `src/app/admin/dokumen/page.tsx`:

```tsx
import Link from "next/link";
import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { listDocumentsAdmin } from "@/lib/admin/documents";
import { deleteDocumentAction, revokeDocumentAction } from "./actions";
import { Button } from "@/components/ui/button";
import { ConfirmDelete, ToastOnParam } from "@blawness/admin-kit/components";
import {
  Plus,
  Pencil,
  Download,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Ban,
} from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;
const dateFmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

function buildQuery(params: { q?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/admin/dokumen?${qs}` : "/admin/dokumen";
}

export default async function DokumenListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireUser();

  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page) || 1);

  const { rows, total } = await listDocumentsAdmin({
    q,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = q !== "";

  const pageList: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pageList.push(i);
    } else if (pageList[pageList.length - 1] !== "...") {
      pageList.push("...");
    }
  }

  return (
    <div className="max-w-5xl">
      <ToastOnParam
        param="saved"
        messages={{
          created: "Dokumen berhasil dibuat.",
          updated: "Dokumen berhasil diperbarui.",
        }}
      />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy-900">
            Dokumen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} dokumen
          </p>
        </div>
        <Button
          render={
            <Link href="/admin/dokumen/baru">
              <Plus className="h-4 w-4" />
              Tambah Dokumen
            </Link>
          }
        />
      </div>

      <div className="mb-4">
        <form method="get" className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cari no surat, perihal…"
            aria-label="Cari dokumen"
            className="h-9 w-full rounded-md border border-navy-200 bg-white pl-9 pr-3 text-sm text-navy-900 placeholder:text-navy-400 focus:border-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-100"
          />
        </form>
      </div>

      {rows.length === 0 ? (
        hasFilters ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-200 bg-white py-16 text-center">
            <Search className="h-8 w-8 text-navy-300" />
            <p className="mt-3 text-sm font-medium text-navy-700">
              Tidak ada dokumen yang cocok
            </p>
            <p className="text-xs text-muted-foreground">
              Coba ubah kata kunci pencarian.
            </p>
            <Link
              href="/admin/dokumen"
              className="mt-3 text-xs font-medium text-navy-600 underline-offset-2 hover:underline"
            >
              Hapus filter
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-200 bg-white py-16 text-center">
            <FileText className="h-8 w-8 text-navy-300" />
            <p className="mt-3 text-sm font-medium text-navy-700">
              Belum ada dokumen
            </p>
            <p className="text-xs text-muted-foreground">
              Klik &ldquo;Tambah Dokumen&rdquo; untuk mendaftarkan dokumen
              pertama.
            </p>
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 bg-navy-50/50 text-left text-xs uppercase tracking-wide text-navy-500">
                <th className="px-4 py-3 font-semibold">Nomor / Perihal</th>
                <th className="px-4 py-3 font-semibold">Tgl Terbit</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-navy-50 last:border-0 transition-colors hover:bg-navy-50/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy-900">{r.number}</p>
                    <p className="text-xs text-muted-foreground">{r.title}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {dateFmt.format(r.issuedAt)}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "active" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Berlaku
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        Dicabut
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <a
                        href={`/api/verifikasi/${r.slug}/qr`}
                        download={`qr-${r.slug}.png`}
                        title="Download QR code"
                      >
                        <Button size="sm" variant="ghost" type="button">
                          <Download className="h-3.5 w-3.5" />
                          QR
                        </Button>
                      </a>
                      <Button
                        size="sm"
                        variant="outline"
                        render={
                          <Link href={`/admin/dokumen/${r.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        }
                      />
                      {r.status === "active" && (
                        <form action={revokeDocumentAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <Button
                            size="sm"
                            variant="outline"
                            type="submit"
                            title="Cabut legalitas"
                          >
                            <Ban className="h-3.5 w-3.5" />
                            Cabut
                          </Button>
                        </form>
                      )}
                      <ConfirmDelete
                        action={deleteDocumentAction}
                        id={r.id}
                        title="Hapus dokumen?"
                        description={
                          <>
                            <span className="font-medium text-navy-900">
                              {r.number}
                            </span>{" "}
                            akan dihapus permanen.
                          </>
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav
          className="mt-8 flex items-center justify-center gap-1"
          aria-label="Pagination"
        >
          {page > 1 && (
            <Link
              href={buildQuery({ q, page: page - 1 })}
              className="flex h-9 w-9 items-center justify-center rounded-md text-sm text-navy-600 transition-colors hover:bg-navy-100"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          )}
          {pageList.map((p, i) =>
            p === "..." ? (
              <span
                key={`dots-${i}`}
                className="flex h-9 w-9 items-center justify-center text-sm text-navy-400"
              >
                ...
              </span>
            ) : (
              <Link
                key={p}
                href={buildQuery({ q, page: p })}
                className={`flex h-9 min-w-[36px] items-center justify-center rounded-md text-sm transition-colors ${
                  p === page
                    ? "bg-navy-900 font-medium text-white"
                    : "text-navy-600 hover:bg-navy-100"
                }`}
              >
                {p}
              </Link>
            )
          )}
          {page < totalPages && (
            <Link
              href={buildQuery({ q, page: page + 1 })}
              className="flex h-9 w-9 items-center justify-center rounded-md text-sm text-navy-600 transition-colors hover:bg-navy-100"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
```

---

### Task 12: Admin create page

**Files:**
- Create: `src/app/admin/dokumen/baru/page.tsx`

- [ ] **Step 1: Create new document page**

Create `src/app/admin/dokumen/baru/page.tsx`:

```tsx
import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { DokumenForm } from "../dokumen-form";
import { createDocumentAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewDokumenPage() {
  await requireUser();
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy-900 mb-6">
        Tambah Dokumen
      </h1>
      <DokumenForm
        action={createDocumentAction}
        initial={{
          number: "",
          title: "",
          signatory: "",
          issuedAt: "",
          fileUrl: "",
          status: "active",
        }}
      />
    </div>
  );
}
```

---

### Task 13: Admin edit page

**Files:**
- Create: `src/app/admin/dokumen/[id]/edit/page.tsx`

- [ ] **Step 1: Create edit document page**

Create `src/app/admin/dokumen/[id]/edit/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { requireUser } from "@blawness/admin-kit/auth-helpers";
import { getDocumentById } from "@/lib/admin/documents";
import { DokumenForm } from "../../dokumen-form";
import { updateDocumentAction } from "../../actions";

export const dynamic = "force-dynamic";

const dateToInput = (d: Date) => d.toISOString().slice(0, 10);

export default async function EditDokumenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const doc = await getDocumentById(Number(id));

  if (!doc) {
    notFound();
  }

  const boundAction = updateDocumentAction.bind(null, doc.id);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy-900 mb-6">
        Edit Dokumen
      </h1>
      <DokumenForm
        action={boundAction}
        initial={{
          number: doc.number,
          title: doc.title,
          signatory: doc.signatory,
          issuedAt: dateToInput(doc.issuedAt),
          fileUrl: doc.fileUrl ?? "",
          status: doc.status,
        }}
      />
    </div>
  );
}
```

---

### Task 14: Verify — lint + build

- [ ] **Step 1: Run lint**

```bash
pnpm lint
```

Expected: No errors. Fix any if present.

- [ ] **Step 2: Run build**

```bash
pnpm build
```

Expected: Successful production build. Fix any if present.

---

### Task 15: Commit

- [ ] **Step 1: Check status and commit all changes**

```bash
git add -A && git status
```

```bash
git commit -m "feat: dokumen legalitas QR verification"
```
