"use client";

import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { BannerSlide } from "@/lib/banners";
import { cn } from "@/lib/utils";

const AUTO_PLAY_MS = 5000;
const SWIPE_THRESHOLD_PX = 48;
/** Fallback until the active image reports its natural size. */
const INTRINSIC_FALLBACK_ASPECT = "21 / 9";

interface BannerCarouselProps {
  banners: BannerSlide[];
  className?: string;
  size?: "default" | "compact" | "full";
}

const BANNER_FRAME_CLASS = {
  /** Home / branch / about: full viewport width, height from image ratio. */
  default: ["w-full max-w-[100%]"],
  compact: [
    "aspect-[16/9] max-h-[160px]",
    "sm:max-h-[200px]",
    "md:aspect-[21/9] md:max-h-[240px]",
    "lg:max-h-[260px]",
  ],
  /**
   * News detail: mobile width = screen, height from aspect.
   * Desktop fills sticky parent.
   */
  full: [
    "aspect-[4/3] w-full max-w-[100%]",
    "sm:aspect-[16/9]",
    "md:aspect-auto md:h-full",
  ],
} as const;

export function BannerCarousel({ banners, className, size = "default" }: BannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [aspectById, setAspectById] = useState<Record<string, number>>({});
  const touchStartX = useRef<number | null>(null);
  const total = banners.length;
  const isIntrinsic = size === "default";
  const activeBanner = banners[activeIndex];
  const activeAspect =
    (activeBanner ? aspectById[activeBanner.id] : undefined) ??
    (banners[0] ? aspectById[banners[0].id] : undefined);

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return;
      setActiveIndex((index + total) % total);
    },
    [total],
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;

    if (startX == null || endX == null) return;

    const delta = startX - endX;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;

    if (delta > 0) {
      goNext();
    } else {
      goPrev();
    }
  };

  const rememberAspect = useCallback((bannerId: string, img: HTMLImageElement) => {
    if (!img.naturalWidth || !img.naturalHeight) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    setAspectById((prev) => (prev[bannerId] === ratio ? prev : { ...prev, [bannerId]: ratio }));
  }, []);

  useEffect(() => {
    if (total <= 1 || isPaused) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(goNext, AUTO_PLAY_MS);
    return () => window.clearInterval(timer);
  }, [goNext, isPaused, total]);

  if (total === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "w-full max-w-[100%] overflow-x-clip bg-[#24211D] text-white",
        size === "full" && "flex flex-col md:h-full md:overflow-hidden",
        className,
      )}
      aria-roledescription="carousel"
      aria-label="Banner slides"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={cn("relative w-full max-w-[100%]", size === "full" && "md:min-h-0 md:flex-1")}>
        <article
          className={cn("relative w-full max-w-[100%] overflow-hidden", BANNER_FRAME_CLASS[size])}
          style={
            isIntrinsic
              ? { aspectRatio: activeAspect ? `${activeAspect}` : INTRINSIC_FALLBACK_ASPECT }
              : undefined
          }
        >
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-in-out",
                index === activeIndex ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              aria-hidden={index !== activeIndex}
            >
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                priority={index === 0}
                sizes="100vw"
                className={
                  isIntrinsic
                    ? "object-contain object-center"
                    : "object-cover object-[center_35%] sm:object-center"
                }
                onLoadingComplete={(img) => {
                  if (isIntrinsic) rememberAspect(banner.id, img);
                }}
              />
            </div>
          ))}

          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/65 sm:left-4 sm:inline-flex sm:h-10 sm:w-10"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/65 sm:right-4 sm:inline-flex sm:h-10 sm:w-10"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:bottom-5 sm:gap-2 md:bottom-8">
                {banners.map((banner, index) => (
                  <button
                    key={banner.id}
                    type="button"
                    onClick={() => goTo(index)}
                    className={cn(
                      "rounded-full transition-all",
                      index === activeIndex
                        ? "h-2 w-6 bg-paseo sm:h-2.5 sm:w-8"
                        : "h-2 w-2 bg-white/50 hover:bg-white/80 sm:h-2.5 sm:w-2.5",
                    )}
                    aria-label={`Go to slide ${index + 1}: ${banner.title}`}
                    aria-current={index === activeIndex}
                  />
                ))}
              </div>
            </>
          ) : null}
        </article>

        <p className="sr-only" aria-live="polite">
          Slide {activeIndex + 1} of {total}: {banners[activeIndex]?.title}
        </p>
      </div>
    </section>
  );
}
