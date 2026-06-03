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
