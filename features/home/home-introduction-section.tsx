"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, X, ZoomIn } from "lucide-react";

import {
  HOME_INTRO_IMAGE,
  HOME_INTRO_PREVIEW_LENGTH,
} from "@/lib/home-sections";
import { stripHtml } from "@/lib/media";
import { cn } from "@/lib/utils";

type HomeIntroductionSectionProps = {
  detailHtml: string;
  className?: string;
};

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function HomeIntroductionSection({
  detailHtml,
  className,
}: HomeIntroductionSectionProps) {
  const [imageOpen, setImageOpen] = useState(false);

  const plainText = useMemo(
    () => stripHtml(detailHtml),
    [detailHtml],
  );

  const previewText = truncateText(
    plainText,
    HOME_INTRO_PREVIEW_LENGTH,
  );

  useEffect(() => {
    if (!imageOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setImageOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [imageOpen]);

  return (
    <section
      id="introduction"
      className={cn(
        "scroll-mt-[72px] bg-[#FCFAF6] py-8 sm:py-20 lg:py-24",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        {/* Heading */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paseo-dark">
            Introduction
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
            The Paseo
          </h2>
        </div>

        {/* Introduction */}
        <div className="mt-9 grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12 xl:gap-16">
          {/* Left — Image */}
          <button
            type="button"
            onClick={() => setImageOpen(true)}
            className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#E8E2D8] lg:aspect-[5/4]"
            aria-label="ขยายรูป The Paseo"
          >
            <Image
              src={HOME_INTRO_IMAGE}
              alt="The Paseo"
              fill
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              sizes="(min-width: 1280px) 584px, (min-width: 1024px) 50vw, 100vw"
            />

            <span className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
              <ZoomIn
                className="h-4 w-4"
                aria-hidden="true"
              />
            </span>
          </button>

          {/* Right — Content */}
          <div className="flex min-h-full flex-col">
            {/* Description */}
            {plainText ? (
              <p className="text-[15px] leading-7 text-[#374151] sm:text-base sm:leading-8">
                {previewText}
              </p>
            ) : (
              <p className="text-[15px] leading-7 text-muted sm:text-base sm:leading-8">
                ยินดีต้อนรับสู่ The Paseo —
                ศูนย์การค้าและไลฟ์สไตล์ที่รวมประสบการณ์
                การช้อปปิ้ง กิจกรรม และชุมชนไว้ในที่เดียว
              </p>
            )}

            {/* CTA */}
            <div className="mt-8 flex justify-center">
              <Link
                href="/about"
                className="group inline-flex items-center gap-4 rounded-full border border-black/[0.08] bg-white py-2 pl-6 pr-2 text-sm font-semibold text-foreground shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-paseo/40 hover:shadow-[0_10px_30px_rgba(104,142,34,0.12)]"
              >
                <span>ดูเพิ่มเติม</span>

                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paseo text-white transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Image Modal */}
      {imageOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="ดูรูป The Paseo"
          onClick={() => setImageOpen(false)}
        >
          <div
            className="relative flex w-full max-w-5xl flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setImageOpen(false)}
              className="absolute -top-2 right-0 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:-top-12"
              aria-label="ปิด"
            >
              <X
                className="h-5 w-5"
                aria-hidden="true"
              />
            </button>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
              <Image
                src={HOME_INTRO_IMAGE}
                alt="The Paseo"
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 1024px, 100vw"
                priority
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}