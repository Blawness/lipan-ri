import Link from "next/link";
import { getFeaturedPosts, getRecentPosts } from "@/lib/posts";
import { FeaturedPost } from "@/components/featured-post";
import { PostCard } from "@/components/post-card";
import { Sidebar } from "@/components/layout/sidebar";

export default async function HomePage() {
  const featuredPosts = await getFeaturedPosts(5);
  const recentPosts = await getRecentPosts(6);
  const mainFeatured = featuredPosts[0];
  const otherFeatured = featuredPosts.slice(1);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-hero text-white py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur border border-gold-400/30 text-xs text-gold-200 tracking-wider uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            Lembaga Independen Milik Masyarakat
          </div>
          <h1 className="font-heading text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
            LIPAN <span className="text-brand-500">RI</span>
          </h1>
          <div className="mx-auto mb-5 h-1 w-20 rounded-full bg-gradient-to-r from-brand-500 to-gold-400" />
          <p className="text-lg md:text-xl text-navy-200 max-w-2xl mx-auto leading-relaxed">
            Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia
          </p>
          <p className="text-sm text-navy-300/80 mt-4 tracking-wide">
            Independen &bull; Berintegritas &bull; Profesional
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <Link href="/tentang-kami/sekilas-lipan-ri" className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20">
              Tentang Kami
            </Link>
            <Link href="/arsip" className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors border border-white/20">
              Lihat Arsip
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
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

            {/* Recent Posts */}
            <section>
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
            </section>
          </div>
          <div className="w-full lg:w-80 flex-shrink-0">
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
