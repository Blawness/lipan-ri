import { getPageBySlug } from "@/lib/pages";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProfilLembaga } from "@/components/tentang-kami/profil-lembaga";
import { ProfilKetua } from "@/components/tentang-kami/profil-ketua";
import { VisiMisi } from "@/components/tentang-kami/visi-misi";
import { StrukturOrg } from "@/components/tentang-kami/struktur-org";
import { Legalitas } from "@/components/tentang-kami/legalitas";
import { ArtiLambang } from "@/components/tentang-kami/arti-lambang";

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

function parseContent(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const renderers: Record<string, React.ComponentType<{ data: any }>> = {
  "profil": ProfilLembaga,
  "profil-ketua": ProfilKetua,
  "visi-misi": VisiMisi,
  "struktur": StrukturOrg,
  "legalitas": Legalitas,
  "lambang": ArtiLambang,
};

export default async function StaticPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  const data = parseContent(page.content);
  if (!data?.type) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-6">{page.title}</h1>
        <div className="prose prose-blue max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
      </div>
    );
  }

  const Renderer = renderers[data.type];
  if (!Renderer) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-6">{page.title}</h1>
        <div className="prose prose-blue max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
      </div>
    );
  }

  return <Renderer data={data} />;
}
