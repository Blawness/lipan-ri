import { getFeaturedPosts, getRecentPosts } from "@/lib/posts";
import { FeaturedPost } from "@/components/featured-post";
import { PostCard } from "@/components/post-card";

export default async function HomePage() {
  const featuredPosts = await getFeaturedPosts(5);
  const recentPosts = await getRecentPosts(6);
  const mainFeatured = featuredPosts[0];
  const otherFeatured = featuredPosts.slice(1);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-hero text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            LIPAN RI
          </h1>
          <p className="text-lg md:text-xl text-blue-200 max-w-2xl mx-auto">
            Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia
          </p>
          <p className="text-sm text-blue-300 mt-2">
            Independen &bull; Berintegritas &bull; Profesional
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Featured Post */}
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

        {/* Other Featured */}
        {otherFeatured.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-blue-900 mb-5 border-b border-blue-100 pb-2">
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

        {/* Recent Posts */}
        <section>
          <h2 className="text-xl font-bold text-blue-900 mb-5 border-b border-blue-100 pb-2">
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
        </section>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
