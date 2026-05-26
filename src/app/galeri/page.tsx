import { getMediaByAlbum } from "@/lib/media";

export default async function GalleryPage() {
  const photos = await getMediaByAlbum("dokumen-ketua");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="gradient-hero text-white rounded-xl p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Galeri Foto</h1>
        <p className="mt-2 text-blue-200">
          Dokumentasi kegiatan LIPAN RI
        </p>
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-muted-foreground text-lg">Belum ada foto tersedia.</p>
          <p className="text-muted-foreground text-sm mt-1">
            Foto-foto kegiatan akan ditampilkan di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <a
              key={photo.id}
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square rounded-lg overflow-hidden border border-blue-100 hover:border-blue-400 hover:shadow-lg transition-all group"
            >
              <img
                src={photo.url}
                alt={photo.altText ?? "Foto kegiatan LIPAN RI"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
