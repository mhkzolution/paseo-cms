"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { TrendUpdateCard } from "@/features/posts/trend-update-card";
import type { ArchivePost } from "@/lib/post-archives";
import { cn } from "@/lib/utils";

function chunkPosts<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

interface TrendUpdateSectionProps {
  posts: ArchivePost[];
  viewAllHref?: string;
  className?: string;
}

export function TrendUpdateSection({ posts, viewAllHref = "/news", className }: TrendUpdateSectionProps) {
  const [postsPerSlide, setPostsPerSlide] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updatePostsPerSlide = () => setPostsPerSlide(mediaQuery.matches ? 3 : 1);
    updatePostsPerSlide();
    mediaQuery.addEventListener("change", updatePostsPerSlide);
    return () => mediaQuery.removeEventListener("change", updatePostsPerSlide);
  }, []);

  const slides = useMemo(() => chunkPosts(posts, postsPerSlide), [posts, postsPerSlide]);

  useEffect(() => {
    setActiveIndex(0);
  }, [postsPerSlide]);

  const goTo = useCallback(
    (index: number) => {
      if (!slides.length) return;
      setActiveIndex((index + slides.length) % slides.length);
    },
    [slides.length],
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  if (!posts.length) return null;

  const showControls = slides.length > 1;

  return (
    <section className={cn("py-16", className)} aria-labelledby="trend-update-heading">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-paseo">Trend Update</p>
            <h2 id="trend-update-heading" className="mt-2 text-3xl font-semibold sm:text-4xl">
              TREND UPDATE
            </h2>
          </div>
          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-paseo hover:text-paseo-dark"
          >
            ดูทั้งหมด
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div
          className="relative mt-10"
          aria-roledescription="carousel"
          aria-label="Trend update posts"
        >
          <div className="relative overflow-hidden">
            {slides.map((slidePosts, index) => (
              <div
                key={`${postsPerSlide}-${index}`}
                className={cn(
                  "grid gap-4 md:grid-cols-3",
                  index === activeIndex
                    ? "relative z-10 opacity-100"
                    : "pointer-events-none absolute inset-0 z-0 opacity-0",
                )}
                aria-hidden={index !== activeIndex}
              >
                {slidePosts.map((post) => (
                  <TrendUpdateCard key={post.id} post={post} />
                ))}
              </div>
            ))}
          </div>

          {showControls ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute -left-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm transition-colors hover:border-paseo hover:text-paseo-dark sm:-left-5"
                aria-label="ก่อนหน้า"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute -right-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-sm transition-colors hover:border-paseo hover:text-paseo-dark sm:-right-5"
                aria-label="ถัดไป"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="mt-6 flex justify-center gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goTo(index)}
                    className={cn(
                      "h-2.5 rounded-full transition-all",
                      index === activeIndex ? "w-8 bg-paseo" : "w-2.5 bg-border hover:bg-paseo/60",
                    )}
                    aria-label={`ไปยังสไลด์ ${index + 1}`}
                    aria-current={index === activeIndex}
                  />
                ))}
              </div>
            </>
          ) : null}

          <p className="sr-only" aria-live="polite">
            สไลด์ {activeIndex + 1} จาก {slides.length}
          </p>
        </div>
      </div>
    </section>
  );
}
