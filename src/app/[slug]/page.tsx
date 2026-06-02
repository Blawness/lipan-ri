import { getPostBySlug, getRecentPosts } from "@/lib/posts";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Tidak Ditemukan" };
  const description = post.excerpt ?? undefined;
  const images = post.featuredImage ? [post.featuredImage] : undefined;
  return {
    title: post.title,
    description,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: `/${slug}`,
      images,
      publishedTime: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const relatedPosts = await getRecentPosts(4, slug);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Breadcrumb
        items={[
          { label: "Beranda", href: "/" },
          post.categoryName && post.categorySlug
            ? { label: post.categoryName, href: `/category/${post.categorySlug}` }
            : null,
          { label: post.title },
        ].filter(Boolean) as { label: string; href?: string }[]}
      />

      <article>
        {post.categoryName && (
          <Badge className="mb-3">{post.categoryName}</Badge>
        )}

        <h1 className="text-2xl md:text-4xl font-bold text-navy-900 mb-4 leading-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Calendar className="h-4 w-4" />
          {post.publishedAt &&
            new Date(post.publishedAt).toLocaleDateString("id-ID", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
        </div>

        {post.featuredImage && (
          // eslint-disable-next-line @next/next/no-img-element -- URL gambar eksternal (R2), tanpa next/image
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full rounded-lg mb-8 object-cover max-h-96"
          />
        )}

        <div
          className="prose prose-blue max-w-none prose-headings:text-navy-900 prose-a:text-navy-600"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {relatedPosts.length > 0 && (
        <section className="mt-12 pt-8 border-t">
          <h2 className="text-xl font-bold text-navy-900 mb-4">
            Berita Terkait
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedPosts.map((p) => (
              <Link
                key={p.id}
                href={`/${p.slug}`}
                className="group block p-4 rounded-lg border border-navy-100 hover:border-navy-300 hover:shadow-sm transition-all"
              >
                <h3 className="font-semibold text-sm group-hover:text-navy-700 transition-colors line-clamp-2">
                  {p.title}
                </h3>
                {p.publishedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(p.publishedAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
