import { getPostsByCategory } from "@/lib/posts";
import { getCategoryBySlug } from "@/lib/categories";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

const PER_PAGE = 6;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
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

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PER_PAGE;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const { posts, total } = await getPostsByCategory(slug, PER_PAGE, offset);
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Beranda", href: "/" },
          { label: category.name },
        ]}
      />

      <div className="gradient-hero text-white rounded-2xl p-8 mb-8 relative overflow-hidden border-l-4 border-brand-500 ring-1 ring-navy-100">
        <h1 className="text-2xl md:text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-navy-200">{category.description}</p>
        )}
        <p className="mt-2 text-sm text-navy-300">{total} artikel</p>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          Belum ada artikel dalam kategori ini.
        </p>
      ) : (
        <>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {page > 1 ? (
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link href={`/category/${slug}?page=${page - 1}`}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Sebelumnya
                    </Link>
                  }
                />
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Sebelumnya
                </Button>
              )}

              <span className="text-sm text-muted-foreground px-4">
                Halaman {page} dari {totalPages}
              </span>

              {page < totalPages ? (
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link href={`/category/${slug}?page=${page + 1}`}>
                      Selanjutnya
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  }
                />
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
