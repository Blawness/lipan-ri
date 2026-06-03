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
