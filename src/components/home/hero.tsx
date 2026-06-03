import { getActiveBanners } from "@/lib/banners";
import { HeroSlider, type HeroSlide } from "@/components/home/hero-slider";

const DEFAULT_SLIDE: HeroSlide = {
  id: "default",
  imageUrl: null,
  title: "LIPAN RI",
  subtitle:
    "Lembaga Investigasi dan Pengawasan Aset Negara Republik Indonesia",
  buttonText: "Tentang Kami",
  buttonLink: "/tentang-kami/sekilas-lipan-ri",
};

export async function Hero() {
  const banners = await getActiveBanners();

  const slides: HeroSlide[] =
    banners.length > 0
      ? banners.map((b) => ({
          id: b.id,
          imageUrl: b.imageUrl,
          title: b.title,
          subtitle: b.subtitle,
          buttonText: b.buttonText,
          buttonLink: b.buttonLink,
        }))
      : [DEFAULT_SLIDE];

  return <HeroSlider slides={slides} />;
}
