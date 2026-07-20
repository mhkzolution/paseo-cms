"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

import type { BrandPartnerLogo } from "@/lib/brand-partners";
import { cn } from "@/lib/utils";

interface LogoMarqueeProps {
  partners: BrandPartnerLogo[];
  className?: string;
}

function LogoItem({ partner }: { partner: BrandPartnerLogo }) {
  const content = (
    <div className="flex h-20 w-36 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:border-white/25 hover:bg-white/10 sm:h-24 sm:w-44">
      <div className="relative h-full w-full">
        <Image
          src={partner.logo}
          alt={partner.name}
          fill
          sizes="(min-width: 640px) 176px, 144px"
          className="object-contain opacity-80 transition-opacity hover:opacity-100"
        />
      </div>
    </div>
  );

  if (partner.linkUrl) {
    return (
      <Link
        href={partner.linkUrl}
        target={partner.linkUrl.startsWith("http") ? "_blank" : undefined}
        rel={partner.linkUrl.startsWith("http") ? "noopener noreferrer" : undefined}
        className="shrink-0"
        aria-label={partner.name}
      >
        {content}
      </Link>
    );
  }

  return <div className="shrink-0">{content}</div>;
}

export function LogoMarquee({ partners, className }: LogoMarqueeProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  if (!partners.length) return null;

  const loopItems = [...partners, ...partners];

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      aria-label="Brand partner logos"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#24211D] to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#24211D] to-transparent sm:w-24" />

      {reduceMotion ? (
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {partners.map((partner) => (
            <LogoItem key={partner.id} partner={partner} />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "flex w-max gap-4 sm:gap-6",
            isPaused ? "[animation-play-state:paused]" : "animate-marquee",
          )}
        >
          {loopItems.map((partner, index) => (
            <LogoItem key={`${partner.id}-${index}`} partner={partner} />
          ))}
        </div>
      )}
    </div>
  );
}
