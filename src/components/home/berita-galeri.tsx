import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PostCard } from "@/components/post-card";

type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  publishedAt: Date | null;
};

type Photo = { id: number; url: string; altText?: string | null };

export function BeritaGaleri({
  posts,
  photos,
}: {
  posts: Post[];
  photos: Photo[];
}) {
  return (
    <section className="bg-navy-50/60 border-t border-navy-100 py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-heading accent-gold-bar text-xl md:text-2xl font-bold text-navy-900">
            Berita Terkini
          </h2>
          <Link
            href="/berita"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Semua berita
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              title={post.title}
              slug={post.slug}
              excerpt={post.excerpt}
              featuredImage={post.featuredImage}
              categoryName={post.categoryName}
              categorySlug={post.categorySlug}
              publishedAt={post.publishedAt}
            />
          ))}
        </div>

        {photos.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-14 mb-8">
              <h2 className="font-heading accent-gold-bar text-xl md:text-2xl font-bold text-navy-900">
                Galeri Kegiatan
              </h2>
              <Link
                href="/galeri"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                Semua foto
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photos.slice(0, 4).map((photo) => (
                <a
                  key={photo.id}
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-xl overflow-hidden border-2 border-navy-100 hover:border-navy-400 hover:shadow-xl transition-all duration-300 group relative"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL gambar eksternal (R2), tanpa next/image */}
                  <img
                    src={photo.url}
                    alt={photo.altText ?? "Dokumentasi LIPAN RI"}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
