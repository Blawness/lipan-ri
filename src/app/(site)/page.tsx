import { getRecentPosts, getPostCount } from "@/lib/posts";
import { getMediaByAlbum } from "@/lib/media";
import { Reveal } from "@/components/home/reveal";
import { NewsTicker } from "@/components/home/news-ticker";
import { Hero } from "@/components/home/hero";
import { Stats } from "@/components/home/stats";
import { MisiPilar } from "@/components/home/misi-pilar";
import { ProfilKetua } from "@/components/home/profil-ketua";
import { LegalitasStrip } from "@/components/home/legalitas-strip";
import { BeritaGaleri } from "@/components/home/berita-galeri";
import { CtaKontak } from "@/components/home/cta-kontak";
import { UcapanHutRi } from "@/components/home/ucapan-hut-ri";
import { UcapanHutRiModal } from "@/components/home/ucapan-hut-ri-modal";
import { HUT_RI, isPeriodeHutRi } from "@/lib/hut-ri";

const FOUNDED_YEAR = 2017;

export default async function HomePage() {
  const [recentPosts, postCount, photos] = await Promise.all([
    getRecentPosts(8),
    getPostCount(),
    getMediaByAlbum("dokumen-ketua"),
  ]);

  const years = new Date().getFullYear() - FOUNDED_YEAR;
  const tickerItems = recentPosts.map((p) => ({ title: p.title, slug: p.slug }));
  const hutRi = isPeriodeHutRi();

  return (
    <div className="min-h-screen">
      {hutRi && HUT_RI.tampilkanModal && <UcapanHutRiModal />}
      <Hero />
      {hutRi && (
        <Reveal>
          <UcapanHutRi />
        </Reveal>
      )}
      <NewsTicker items={tickerItems} />
      <Reveal>
        <Stats postCount={postCount} years={years} />
      </Reveal>
      <Reveal>
        <ProfilKetua />
      </Reveal>
      <Reveal>
        <MisiPilar />
      </Reveal>
      <Reveal>
        <LegalitasStrip />
      </Reveal>
      <Reveal>
        <BeritaGaleri posts={recentPosts.slice(0, 3)} photos={photos} />
      </Reveal>
      <Reveal>
        <CtaKontak />
      </Reveal>
    </div>
  );
}

export const dynamic = "force-dynamic";
