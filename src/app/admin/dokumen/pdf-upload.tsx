"use client";

import { useRef, useState, useTransition } from "react";
import { UploadCloud, Loader2, AlertCircle, File } from "lucide-react";
import { uploadImageAction } from "@blawness/admin-kit/screens/media/actions";
import { Button } from "@/components/ui/button";

const OK_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_BYTES = 16 * 1024 * 1024;

export function PdfUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function upload(file: File | undefined) {
    if (!file) return;
    if (!OK_TYPES.includes(file.type)) {
      setError("Format tidak didukung — gunakan PDF, JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Ukuran file maksimal 16MB.");
      return;
    }
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
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files?.[0]);
        }}
        disabled={pending}
        className={`group relative flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragging
            ? "border-brand-500 bg-brand-50"
            : "border-navy-200 bg-navy-50/40 hover:border-brand-400 hover:bg-brand-50/60"
        } ${pending ? "pointer-events-none opacity-80" : "cursor-pointer"}`}
      >
        {value ? (
          <>
            <File className="h-8 w-8 text-navy-400" />
            <span className="text-sm font-medium text-navy-700">
              Klik untuk mengganti dokumen
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {value.split("/").pop()}
            </span>
            {pending && (
              <span className="absolute inset-0 grid place-items-center rounded-xl bg-white/70">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
              </span>
            )}
          </>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 transition-transform group-hover:scale-105">
              {pending ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <UploadCloud className="h-6 w-6" />
              )}
            </span>
            <span>
              <span className="block text-sm font-semibold text-navy-900">
                {pending ? "Mengunggah…" : "Klik untuk unggah dokumen"}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                atau seret &amp; lepas · PDF, JPG, PNG, WebP (maks 16MB)
              </span>
            </span>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => upload(e.target.files?.[0])}
        disabled={pending}
      />

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {value && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onChange("")}
        >
          Hapus dokumen
        </Button>
      )}
    </div>
  );
}
