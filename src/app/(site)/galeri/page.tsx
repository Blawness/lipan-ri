import { getMediaByAlbums } from "@/lib/media";
import { ALBUM_GALERI_PUBLIK } from "@/lib/albums";
import type { Metadata } from "next";
import { SafeImage } from "@/components/safe-image";
import { keteranganFoto } from "@/lib/caption";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galeri Foto",
};

export default async function GalleryPage() {
  const photos = await getMediaByAlbums(ALBUM_GALERI_PUBLIK);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="gradient-hero text-white rounded-2xl p-8 mb-8 relative overflow-hidden border-l-4 border-brand-500 ring-1 ring-navy-100">
        <h1 className="text-2xl md:text-3xl font-bold">Galeri Foto</h1>
        <p className="mt-2 text-navy-200">
          Dokumentasi kegiatan LIPAN RI
        </p>
        {photos.length > 0 && (
          <p className="mt-2 text-sm text-navy-300">{photos.length} foto</p>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-muted-foreground text-lg">Belum ada foto tersedia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => {
            const keterangan = keteranganFoto(photo.altText);
            return (
              <figure
                key={photo.id}
                className="overflow-hidden rounded-xl border-2 border-navy-100 bg-white transition-all duration-300 hover:border-navy-400 hover:shadow-xl"
              >
                <a
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block aspect-square overflow-hidden"
                >
                  <SafeImage
                    src={photo.url}
                    alt={keterangan ?? "Foto kegiatan LIPAN RI"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </a>
                {keterangan && (
                  <figcaption className="px-3 py-2 text-xs leading-snug text-muted-foreground">
                    {keterangan}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>
      )}
    </div>
  );
}
