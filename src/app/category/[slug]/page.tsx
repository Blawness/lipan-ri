import { getPostsByCategory } from "@/lib/posts";
import { getCategoryBySlug } from "@/lib/categories";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Kategori Tidak Ditemukan" };
  return {
    title: category.name,
    description: category.description ?? undefined,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  const posts = await getPostsByCategory(slug, 12);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="gradient-hero text-white rounded-xl p-8 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-blue-200">{category.description}</p>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          Belum ada artikel dalam kategori ini.
        </p>
      ) : (
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
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
