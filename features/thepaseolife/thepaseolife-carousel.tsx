"use client";

import { useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ThePaseoLifeCard } from "@/features/thepaseolife/thepaseolife-card";
import type { PublicThePaseoLifePost } from "@/lib/thepaseolife";
import { cn } from "@/lib/utils";

type ThePaseoLifeCarouselProps = {
  posts: PublicThePaseoLifePost[];
  className?: string;
};

export function ThePaseoLifeCarousel({ posts, className }: ThePaseoLifeCarouselProps) {
  const useCarousel = posts.length > 3;
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      dragFree: false,
      containScroll: "trimSnaps",
    },
    useCarousel ? [Autoplay({ delay: 6000, stopOnInteraction: true })] : [],
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!useCarousel) return;
    emblaApi?.reInit();
  }, [emblaApi, useCarousel, posts.length]);

  if (!useCarousel) {
    return (
      <ul className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {posts.map((post) => (
          <li key={post.id}>
            <ThePaseoLifeCard post={post} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="overflow-hidden" ref={emblaRef}>
        <ul className="flex touch-pan-y gap-5">
          {posts.map((post) => (
            <li key={post.id} className="min-w-0 shrink-0 basis-[78%] sm:basis-[48%] lg:basis-[32%]">
              <ThePaseoLifeCard post={post} />
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={scrollPrev}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.1] bg-white text-foreground transition-colors hover:border-paseo-dark/40 hover:bg-paseo-dark hover:text-white"
          aria-label="Previous ThePaseoLife post"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.1] bg-white text-foreground transition-colors hover:border-paseo-dark/40 hover:bg-paseo-dark hover:text-white"
          aria-label="Next ThePaseoLife post"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
