import { db } from "@/db";
import { posts, categories } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Calendar } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arsip",
};

export default async function ArsipPage() {
  const allPosts = await db
    .select({
      slug: posts.slug,
      title: posts.title,
      publishedAt: posts.publishedAt,
      categorySlug: categories.slug,
      categoryName: categories.name,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt));

  const grouped = allPosts.reduce<Record<string, typeof allPosts>>((acc, post) => {
    if (!post.publishedAt) return acc;
    const key = new Date(post.publishedAt).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="gradient-hero text-white rounded-2xl p-8 mb-8 relative overflow-hidden border-l-4 border-brand-500 ring-1 ring-navy-100">
        <h1 className="text-2xl md:text-3xl font-bold">Arsip</h1>
        <p className="mt-2 text-navy-200">
          Semua artikel LIPAN RI
        </p>
      </div>

      <div className="relative pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-navy-200" />

        {Object.entries(grouped).map(([month, monthPosts]) => (
          <div key={month} className="relative mb-8">
            <div className="absolute -left-[29px] top-1 w-5 h-5 rounded-full bg-navy-600 border-4 border-navy-100" />
            <h2 className="text-lg font-bold text-navy-900 mb-3">{month}</h2>
            <div className="space-y-2">
              {monthPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/${post.slug}`}
                  className="block p-3 rounded-lg border border-navy-100 hover:border-navy-400 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Calendar className="h-3 w-3" />
                    {post.publishedAt &&
                      new Date(post.publishedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    {post.categoryName && (
                      <span className="text-navy-500">• {post.categoryName}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-navy-900 hover:text-navy-700 transition-colors">
                    {post.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
