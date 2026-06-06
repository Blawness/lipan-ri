"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Save, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Editor, ImageUpload } from "@blawness/admin-kit/components";
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

const selectClass =
  "h-9 rounded-md border border-navy-200 bg-white px-2.5 text-sm text-navy-900 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const labelClass = "text-sm font-medium text-navy-800";

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
    <form action={formAction} className="max-w-3xl space-y-6">
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="featuredImage" value={featuredImage} />

      <div className="space-y-5 rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="title">Judul</label>
          <Input id="title" name="title" defaultValue={initial.title} required placeholder="Judul berita…" />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Gambar utama</label>
          <ImageUpload value={featuredImage} onChange={setFeaturedImage} label="gambar utama" />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="excerpt">Ringkasan</label>
          <Input id="excerpt" name="excerpt" defaultValue={initial.excerpt} placeholder="Kalimat pembuka singkat (opsional)" />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Isi</label>
          <Editor value={content} onChange={setContent} />
        </div>
      </div>

      <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-navy-900">Pengaturan</p>
        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="categoryId">Kategori</label>
            <select id="categoryId" name="categoryId" defaultValue={initial.categoryId} className={selectClass}>
              <option value="">— Tidak ada —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass} htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={initial.status} className={selectClass}>
              <option value="draft">Draft</option>
              <option value="published">Terbit</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-navy-100 bg-navy-50/40 px-3 py-2 text-sm text-navy-800">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={initial.isFeatured}
              className="h-4 w-4 accent-brand-600"
            />
            Tampilkan sebagai unggulan
          </label>
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
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? "Menyimpan…" : "Simpan"}
        </Button>
        <Button variant="outline" render={<Link href="/admin/posts">Batal</Link>} />
      </div>
    </form>
  );
}
