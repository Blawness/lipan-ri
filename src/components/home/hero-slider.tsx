"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { SafeImage } from "@/components/safe-image";

export type HeroSlide = {
  id: number | string;
  imageUrl: string | null;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  buttonLink: string | null;
};

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    setSelected(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  const single = slides.length <= 1;

  return (
    <section className="relative" aria-label="Banner utama" aria-roledescription="carousel">
      <Carousel
        setApi={setApi}
        opts={{ loop: !single }}
        plugins={
          single
            ? []
            : [Autoplay({ delay: 5000, stopOnMouseEnter: true, stopOnInteraction: false })]
        }
        className="w-full"
      >
        <CarouselContent className="ml-0">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="pl-0">
              <Slide slide={slide} />
            </CarouselItem>
          ))}
        </CarouselContent>

        {!single && (
          <>
            <CarouselPrevious className="left-4 hidden border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white md:flex" />
            <CarouselNext className="right-4 hidden border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white md:flex" />
          </>
        )}
      </Carousel>

      {!single && slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {Array.from({ length: slides.length }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ke slide ${i + 1}`}
              onClick={() => api?.scrollTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === selected ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Slide({ slide }: { slide: HeroSlide }) {
  return (
    <div className="relative h-[420px] w-full overflow-hidden md:h-[520px]">
      {slide.imageUrl ? (
        <SafeImage
          src={slide.imageUrl}
          alt={slide.title ?? ""}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="gradient-hero absolute inset-0" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/40 to-navy-950/30" />

      {(slide.title || slide.subtitle || slide.buttonText) && (
        <div className="container relative z-[1] mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white">
          {slide.title && (
            <h1 className="font-heading text-3xl font-extrabold tracking-tight drop-shadow md:text-5xl">
              {slide.title}
            </h1>
          )}
          {slide.subtitle && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-navy-100 drop-shadow md:text-lg">
              {slide.subtitle}
            </p>
          )}
          {slide.buttonText && slide.buttonLink && (
            <Link
              href={slide.buttonLink}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-colors hover:bg-brand-600"
            >
              {slide.buttonText}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
