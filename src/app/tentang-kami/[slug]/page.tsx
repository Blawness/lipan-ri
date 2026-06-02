import { getPageBySlug } from "@/lib/pages";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProfilLembaga } from "@/components/tentang-kami/profil-lembaga";
import { ProfilKetua } from "@/components/tentang-kami/profil-ketua";
import { VisiMisi } from "@/components/tentang-kami/visi-misi";
import { StrukturOrg } from "@/components/tentang-kami/struktur-org";
import { Legalitas } from "@/components/tentang-kami/legalitas";
import { ArtiLambang } from "@/components/tentang-kami/arti-lambang";
import type { PageContent } from "@/lib/page-content";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return { title: "Halaman Tidak Ditemukan" };
  return {
    title: page.title,
    description: page.metaDescription ?? undefined,
  };
}

function parseContent(raw: string): PageContent | null {
  try {
    return JSON.parse(raw) as PageContent;
  } catch {
    return null;
  }
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  const data = parseContent(page.content);

  const fallback = (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold text-navy-900 mb-6">{page.title}</h1>
      <div className="prose prose-blue max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
    </div>
  );

  if (!data?.type) return fallback;

  switch (data.type) {
    case "profil":
      return <ProfilLembaga data={data} />;
    case "profil-ketua":
      return <ProfilKetua data={data} />;
    case "visi-misi":
      return <VisiMisi data={data} />;
    case "struktur":
      return <StrukturOrg data={data} />;
    case "legalitas":
      return <Legalitas data={data} />;
    case "lambang":
      return <ArtiLambang data={data} />;
    default:
      return fallback;
  }
}
