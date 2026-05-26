import { getPageBySlug } from "@/lib/pages";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return { title: "Halaman Tidak Ditemukan" };
  return {
    title: page.title,
    description: page.metaDescription ?? undefined,
  };
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) notFound();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-6">
        {page.title}
      </h1>
      <div
        className="prose prose-blue max-w-none prose-headings:text-blue-900"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
