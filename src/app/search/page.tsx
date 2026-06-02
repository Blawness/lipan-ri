import { searchPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export const metadata: Metadata = {
  title: "Pencarian",
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const results = q ? await searchPosts(q) : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Pencarian</h1>

      <form action="/search" className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Cari artikel..."
            defaultValue={q ?? ""}
            className="pl-10 h-11"
          />
        </div>
      </form>

      {q && (
        <p className="text-sm text-muted-foreground mb-6">
          {results.length} hasil untuk &quot;{q}&quot;
        </p>
      )}

      {results.length === 0 && q ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            Tidak ada hasil untuk &quot;{q}&quot;
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Coba kata kunci lain.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {results.map((post) => (
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
      )}
    </div>
  );
}
