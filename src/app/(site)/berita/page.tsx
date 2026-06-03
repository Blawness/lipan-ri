import type { Metadata } from "next";
import { getFeaturedPosts, getPaginatedPosts } from "@/lib/posts";
import { FeaturedPost } from "@/components/featured-post";
import { PostCard } from "@/components/post-card";
import { Sidebar } from "@/components/layout/sidebar";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = {
  title: "Berita",
  description: "Berita utama dan terbaru LIPAN RI",
};

export default async function BeritaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const featuredPosts = await getFeaturedPosts(5);
  const { posts: recentPosts, totalPages, page: actualPage } = await getPaginatedPosts(currentPage);

  const mainFeatured = featuredPosts[0];
  const otherFeatured = featuredPosts.slice(1);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          {mainFeatured && (
            <section className="mb-10">
              <FeaturedPost
                title={mainFeatured.title}
                slug={mainFeatured.slug}
                excerpt={mainFeatured.excerpt}
                featuredImage={mainFeatured.featuredImage}
                categoryName={mainFeatured.categoryName}
                categorySlug={mainFeatured.categorySlug}
                publishedAt={mainFeatured.publishedAt}
              />
            </section>
          )}

          {otherFeatured.length > 0 && (
            <section className="mb-10">
              <h2 className="font-heading accent-gold-bar text-xl font-bold text-navy-900 mb-6 border-b border-navy-100 pb-3">
                Berita Utama
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otherFeatured.map((post) => (
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
            </section>
          )}

          <section id="berita-list">
            <h2 className="font-heading accent-gold-bar text-xl font-bold text-navy-900 mb-6 border-b border-navy-100 pb-3">
              Berita Terbaru
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.map((post) => (
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
            <Pagination page={actualPage} totalPages={totalPages} basePath="/berita" scrollTo="berita-list" />
          </section>
        </div>
        <div className="w-full lg:w-80 flex-shrink-0">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
