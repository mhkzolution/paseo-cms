import type { ReactNode } from "react";
import Image from "next/image";
import { LayoutGrid } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type ArchiveTileItem = {
  slug: string;
  label: string;
  image: string | null;
  href: string;
};

type ArchiveTileVisualProps = {
  active: boolean;
  label: string;
  image?: string | null;
  size?: "branch" | "category";
  fallback?: ReactNode;
};

function ArchiveTileVisual({ active, label, image, size = "branch", fallback }: ArchiveTileVisualProps) {
  const boxClass =
    size === "branch"
      ? "h-[88px] w-[88px] rounded-2xl p-3 sm:h-[100px] sm:w-[100px]"
      : "h-[72px] w-[72px] rounded-xl p-2.5 sm:h-[80px] sm:w-[80px]";

  return (
    <>
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden border-2 bg-white transition-colors",
          boxClass,
          active ? "border-paseo" : "border-transparent group-hover:border-paseo/30",
        )}
      >
        {image ? (
          <Image src={image} alt="" fill className="object-contain p-1.5" sizes="100px" />
        ) : (
          fallback ?? (
            <span className="text-lg font-bold text-paseo-dark">{label.charAt(0)}</span>
          )
        )}
      </div>
      <span
        className={cn(
          "max-w-full text-center text-xs font-semibold leading-snug text-foreground sm:text-sm",
          active && "text-paseo-dark",
        )}
      >
        {label}
      </span>
    </>
  );
}

type ArchiveTileProps = ArchiveTileVisualProps & {
  href: string;
};

function ArchiveTile({ href, active, label, image, size = "branch", fallback }: ArchiveTileProps) {
  return (
    <Link href={href} className="group flex w-[88px] shrink-0 flex-col items-center gap-2 sm:w-[100px]">
      <ArchiveTileVisual
        active={active}
        label={label}
        image={image}
        size={size}
        fallback={fallback}
      />
    </Link>
  );
}

type ArchiveTileButtonProps = ArchiveTileVisualProps & {
  onClick: () => void;
};

function ArchiveTileButton({ active, label, image, size = "branch", fallback, onClick }: ArchiveTileButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-[88px] shrink-0 flex-col items-center gap-2 sm:w-[100px]"
    >
      <ArchiveTileVisual
        active={active}
        label={label}
        image={image}
        size={size}
        fallback={fallback}
      />
    </button>
  );
}

export function ArchiveFilterSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-center", className)}>
      <h2 className="text-base font-bold text-foreground sm:text-lg">{title}</h2>
      <div className="mt-4 -mx-5 overflow-x-auto px-5 scrollbar-hidden sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="mx-auto flex min-w-max justify-center gap-4 sm:min-w-0 sm:flex-wrap sm:gap-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ArchiveBranchTiles({
  items,
  activeSlug,
  allOption,
}: {
  items: ArchiveTileItem[];
  activeSlug?: string;
  allOption?: { href: string; label: string; active: boolean };
}) {
  return (
    <>
      {allOption ? (
        <ArchiveTile
          href={allOption.href}
          active={allOption.active}
          label={allOption.label}
          size="branch"
          fallback={<LayoutGrid className="h-8 w-8 text-paseo" strokeWidth={1.5} aria-hidden="true" />}
        />
      ) : null}
      {items.map((item) => (
        <ArchiveTile
          key={item.slug}
          href={item.href}
          active={activeSlug === item.slug}
          label={item.label}
          image={item.image}
          size="branch"
        />
      ))}
    </>
  );
}

export function ArchiveBranchTileButtons({
  items,
  activeSlug,
  onSelect,
}: {
  items: Array<{ slug: string; label: string; image: string | null }>;
  activeSlug?: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <>
      {items.map((item) => (
        <ArchiveTileButton
          key={item.slug}
          active={activeSlug === item.slug}
          label={item.label}
          image={item.image}
          size="branch"
          onClick={() => onSelect(item.slug)}
        />
      ))}
    </>
  );
}

export function ArchiveCategoryTiles({
  items,
  activeSlug,
  allHref,
}: {
  items: ArchiveTileItem[];
  activeSlug?: string;
  allHref: string;
}) {
  return (
    <>
      {items.map((item) => (
        <ArchiveTile
          key={item.slug}
          href={item.href}
          active={activeSlug === item.slug}
          label={item.label}
          image={item.image}
          size="category"
          fallback={<LayoutGrid className="h-6 w-6 text-paseo" strokeWidth={1.5} aria-hidden="true" />}
        />
      ))}
      <ArchiveTile
        href={allHref}
        active={!activeSlug}
        label="ทั้งหมด"
        size="category"
        fallback={<LayoutGrid className="h-6 w-6 text-paseo" strokeWidth={1.5} aria-hidden="true" />}
      />
    </>
  );
}
