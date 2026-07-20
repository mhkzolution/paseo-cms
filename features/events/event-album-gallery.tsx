"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type EventAlbumImage = {
  id: string;
  url: string;
  alt: string | null;
  caption: string | null;
};

interface EventAlbumGalleryProps {
  images: EventAlbumImage[];
  title?: string;
  className?: string;
}

export function EventAlbumGallery({
  images,
  title = "Album กิจกรรมในงาน",
  className,
}: EventAlbumGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return current;
      return current === 0 ? images.length - 1 : current - 1;
    });
  }, [images.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return current;
      return current === images.length - 1 ? 0 : current + 1;
    });
  }, [images.length]);

  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, close, showNext, showPrevious]);

  if (!images.length) return null;

  const activeImage = activeIndex !== null ? images[activeIndex] : null;

  return (
    <>
      <section className={cn("mt-14 border-t border-black/[0.1] pt-10", className)}>
        <h2 className="text-2xl font-semibold tracking-[-0.025em] text-foreground sm:text-3xl">{title}</h2>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#F3F1EC]"
                aria-label={`เปิดรูปที่ ${index + 1}`}
              >
                <Image
                  src={image.url}
                  alt={image.alt || `รูปกิจกรรม ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {activeImage && activeIndex !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="ดูรูปอัลบั้มกิจกรรม"
          onClick={close}
        >
          <div
            className="relative flex w-full max-w-5xl flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="absolute -top-2 right-0 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:-top-12"
              aria-label="ปิด"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
              <Image
                src={activeImage.url}
                alt={activeImage.alt || `รูปกิจกรรม ${activeIndex + 1}`}
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 1024px, 100vw"
                priority
              />

              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={showPrevious}
                    className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                    aria-label="รูปก่อนหน้า"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                    aria-label="รูปถัดไป"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </>
              ) : null}
            </div>

            {activeImage.caption ? (
              <p className="mt-3 text-center text-sm text-white/80">{activeImage.caption}</p>
            ) : null}

            {images.length > 1 ? (
              <ul className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                {images.map((image, index) => (
                  <li key={image.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={cn(
                        "relative h-16 w-20 overflow-hidden rounded-md border-2 transition-colors",
                        index === activeIndex ? "border-white" : "border-transparent opacity-70 hover:opacity-100",
                      )}
                      aria-label={`ไปที่รูปที่ ${index + 1}`}
                      aria-current={index === activeIndex}
                    >
                      <Image
                        src={image.url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
