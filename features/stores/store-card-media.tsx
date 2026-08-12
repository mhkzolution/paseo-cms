import Image from "next/image";
import {
  GraduationCap,
  HandHelping,
  HeartPulse,
  Landmark,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import type { StoreCardMediaResolved } from "@/lib/stores/store-card-media";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  food: UtensilsCrossed,
  service: HandHelping,
  bank: Landmark,
  clinic: HeartPulse,
  education: GraduationCap,
  specialty: ShoppingBag,
  "street-market": Store,
};

type StoreCardMediaProps = {
  media: StoreCardMediaResolved;
  alt: string;
  className?: string;
  priority?: boolean;
  /** Dense directory cards: white field, minimal padding, no cream plate. */
  variant?: "default" | "directory";
};

/**
 * Fixed-ratio media frame shared by all store cards.
 * aspect-[4/3] keeps grid rows visually balanced on every breakpoint.
 */
export function StoreCardMedia({
  media,
  alt,
  className,
  priority = false,
  variant = "default",
}: StoreCardMediaProps) {
  const isDirectory = variant === "directory";

  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full shrink-0 overflow-hidden",
        isDirectory ? "bg-white" : "bg-[#F3F0EA]",
        className,
      )}
    >
      {media.mode === "logo" ? (
        <LogoMode src={media.src!} alt={alt} priority={priority} dense={isDirectory} />
      ) : null}
      {media.mode === "cover" ? (
        <CoverMode src={media.src!} alt={alt} priority={priority} dense={isDirectory} />
      ) : null}
      {media.mode === "fallback" ? <FallbackMode media={media} dense={isDirectory} /> : null}
    </div>
  );
}

function LogoMode({
  src,
  alt,
  priority,
  dense,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  dense?: boolean;
}) {
  if (dense) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white p-3 sm:p-4">
        <div className="relative h-full w-full max-h-[85%] max-w-[85%]">
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            className="object-contain object-center"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-5">
      <div className="relative flex h-[88%] w-[88%] items-center justify-center rounded-xl bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="relative h-[82%] w-[82%]">
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            className="object-contain object-center"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
        </div>
      </div>
    </div>
  );
}

function CoverMode({
  src,
  alt,
  priority,
  dense,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  dense?: boolean;
}) {
  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover object-center"
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
      />
      {!dense ? (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10"
          aria-hidden="true"
        />
      ) : null}
    </>
  );
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  food: "linear-gradient(155deg, #f9731630 0%, #fff7ed 38%, #F3F0EA 62%, #ea580c22 100%)",
  service: "linear-gradient(155deg, #3b82f630 0%, #eff6ff 38%, #F3F0EA 62%, #2563eb22 100%)",
  bank: "linear-gradient(155deg, #6366f130 0%, #eef2ff 38%, #F3F0EA 62%, #4f46e522 100%)",
  clinic: "linear-gradient(155deg, #f59e0b30 0%, #fffbeb 38%, #F3F0EA 62%, #d9770622 100%)",
  education: "linear-gradient(155deg, #8b5cf630 0%, #f5f3ff 38%, #F3F0EA 62%, #7c3aed22 100%)",
  specialty: "linear-gradient(155deg, #ec489930 0%, #fdf2f8 38%, #F3F0EA 62%, #db277722 100%)",
  "street-market": "linear-gradient(155deg, #14b8a630 0%, #ecfdf5 38%, #F3F0EA 62%, #0d948822 100%)",
};

function FallbackMode({ media, dense }: { media: StoreCardMediaResolved; dense?: boolean }) {
  const CategoryIcon = media.category?.slug ? CATEGORY_ICONS[media.category.slug] : undefined;
  const gradient =
    (media.category?.slug && CATEGORY_GRADIENTS[media.category.slug]) ||
    `linear-gradient(155deg, ${media.accentColor}30 0%, #F3F0EA 42%, ${media.accentColor}20 100%)`;

  if (dense) {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2"
        style={{ background: gradient }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/70 bg-white/90"
          style={{ color: media.accentColor }}
        >
          {CategoryIcon ? (
            <CategoryIcon className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <span className="text-sm font-bold tracking-tight">{media.initials}</span>
          )}
        </div>
        <span className="text-sm font-bold tracking-tight" style={{ color: media.accentColor }} aria-hidden="true">
          {media.initials}
        </span>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4"
      style={{ background: gradient }}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/70 bg-white/90 shadow-sm sm:h-[4.5rem] sm:w-[4.5rem]"
        style={{ color: media.accentColor }}
      >
        {media.category?.image ? (
          <span className="relative h-9 w-9 sm:h-10 sm:w-10">
            <Image src={media.category.image} alt="" fill className="object-contain" sizes="40px" />
          </span>
        ) : CategoryIcon ? (
          <CategoryIcon className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <span className="text-xl font-bold tracking-tight sm:text-2xl">{media.initials}</span>
        )}
      </div>

      <span
        className="text-lg font-bold tracking-tight sm:text-xl"
        style={{ color: media.accentColor }}
        aria-hidden="true"
      >
        {media.initials}
      </span>

      {media.category ? (
        <span className="max-w-[90%] truncate text-[11px] font-medium text-muted sm:text-xs">
          {media.category.name}
        </span>
      ) : null}
    </div>
  );
}
