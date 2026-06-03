"use client";

import { useState, useTransition } from "react";
import { uploadImageAction } from "@/app/admin/media/actions";

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
