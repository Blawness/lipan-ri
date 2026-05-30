import { getMediaByAlbum } from "@/lib/media";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galeri Foto",
};

export default async function GalleryPage() {
  const photos = await getMediaByAlbum("dokumen-ketua");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="gradient-hero text-white rounded-xl p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Galeri Foto</h1>
        <p className="mt-2 text-blue-200">
          Dokumentasi kegiatan LIPAN RI
        </p>
        {photos.length > 0 && (
          <p className="mt-2 text-sm text-blue-300">{photos.length} foto</p>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-muted-foreground text-lg">Belum ada foto tersedia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <a
              key={photo.id}
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square rounded-xl overflow-hidden border-2 border-blue-100 hover:border-blue-400 hover:shadow-xl transition-all duration-300 group relative"
            >
              <img
                src={photo.url}
                alt={photo.altText ?? "Foto kegiatan LIPAN RI"}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <p className="text-white text-xs font-medium line-clamp-2">
                  {photo.altText ?? "Foto kegiatan"}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
