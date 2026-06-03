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
