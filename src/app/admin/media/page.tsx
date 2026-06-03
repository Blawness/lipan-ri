import { requireUser } from "@/lib/auth-helpers";
import { listMedia } from "@/lib/admin/media";
import { deleteMediaAction } from "./actions";
import { GalleryUploader } from "./uploader";
import { Trash2, ImageOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  await requireUser();
  const items = await listMedia();

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-navy-900">Galeri</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {items.length} gambar tersimpan
        </p>
      </div>

      <GalleryUploader />

      {items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-200 bg-white py-16 text-center">
          <ImageOff className="h-8 w-8 text-navy-300" />
          <p className="mt-3 text-sm font-medium text-navy-700">Belum ada gambar</p>
          <p className="text-xs text-muted-foreground">
            Unggah gambar pertama lewat kotak di atas.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <div
              key={m.id}
              className="group relative overflow-hidden rounded-xl border border-navy-100 bg-white shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- R2 URL */}
              <img
                src={m.url}
                alt={m.altText ?? ""}
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <form action={deleteMediaAction} className="absolute right-2 top-2">
                <input type="hidden" name="id" value={m.id} />
                <button
                  type="submit"
                  aria-label="Hapus gambar"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-navy-600 opacity-100 shadow-sm ring-1 ring-navy-100 backdrop-blur transition-all hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
