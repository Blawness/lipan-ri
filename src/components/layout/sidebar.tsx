import { db } from "@/db";
import { posts, categories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Calendar } from "lucide-react";

export async function Sidebar() {
  const recentPosts = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      publishedAt: posts.publishedAt,
    })
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt))
    .limit(5);

  const allCategories = await db
    .select({ slug: categories.slug, name: categories.name })
    .from(categories);

  return (
    <aside className="space-y-6">
      <div className="rounded-xl border border-navy-100 p-5">
        <h3 className="font-heading font-bold text-navy-900 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-brand-500" />
          Berita Terbaru
        </h3>
        <div className="space-y-3">
          {recentPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/${post.slug}`}
              className="block group"
            >
              <h4 className="text-sm font-medium text-navy-900 group-hover:text-brand-600 transition-colors line-clamp-2">
                {post.title}
              </h4>
              {post.publishedAt && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(post.publishedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-navy-100 p-5">
        <h3 className="font-heading font-bold text-navy-900 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-brand-500" />
          Kategori
        </h3>
        <div className="flex flex-wrap gap-2">
          {allCategories.slice(0, 10).map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="px-3 py-1.5 rounded-full border border-navy-100 bg-white text-xs font-medium text-navy-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-navy-100 p-5">
        <h3 className="font-heading font-bold text-navy-900 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
          <svg className="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          YouTube
        </h3>
        <div className="aspect-video rounded-lg overflow-hidden border border-navy-50">
          <iframe
            src="https://www.youtube.com/embed/6lav7DXUte0"
            title="LIPAN RI YouTube"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    </aside>
  );
}
