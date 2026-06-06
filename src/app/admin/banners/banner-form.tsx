"use client";

import { useState } from "react";
import { ImageUpload } from "@blawness/admin-kit/components";
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
