"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { PromotionCategory } from "@prisma/client";
import { ChevronRight } from "lucide-react";

import { PROMOTION_ARCHIVE_TABS } from "@/lib/promotion-categories";
import type { ArchivePromotion } from "@/lib/promotions";
import { buildPromotionsHref } from "@/lib/promotions";
import { cn } from "@/lib/utils";

interface PromotionArchiveSectionProps {
  promotions: ArchivePromotion[];
  title?: string;
  viewAllHref?: string;
  className?: string;
}

export function PromotionArchiveSection({
  promotions,
  title = "PROMOTION",
  viewAllHref = "/promotions",
  className,
}: PromotionArchiveSectionProps) {
  if (!promotions.length) return null;

  return (
    <section className={cn("bg-[#1a1a18] py-12 sm:py-16", className)}>
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            <span className="font-bold">{title}</span>{" "}
            <span className="font-normal uppercase">WHAT NOT TO MISS TODAY</span>
          </h2>
          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-paseo px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-paseo-dark hover:text-white"
          >
            เพิ่มเติม
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-6 border-4 border-paseo bg-paseo p-1 sm:p-1.5">
          <PromotionArchiveGrid promotions={promotions} />
        </div>
      </div>
    </section>
  );
}

interface PromotionArchivePageProps {
  promotions: ArchivePromotion[];
  activeCategory?: PromotionCategory | null;
  branchSlug?: string;
  branches?: Array<{ name: string; slug: string }>;
  activeBranchSlug?: string;
  emptyMessage?: string;
}

export function PromotionArchivePage({
  promotions,
  activeCategory = null,
  branchSlug,
  branches = [],
  activeBranchSlug,
  emptyMessage = "ยังไม่มีโปรโมชันในขณะนี้",
}: PromotionArchivePageProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
      <header>
        <h1 className="text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
          <span className="font-bold">Promotion</span>{" "}
          <span className="font-normal normal-case">WHAT NOT TO MISS TODAY</span>
        </h1>
        {activeBranchSlug && branches.length ? (
          <p className="mt-3 text-sm text-white/70">
            {branches.find((branch) => branch.slug === activeBranchSlug)?.name ?? activeBranchSlug}
          </p>
        ) : null}
      </header>

      {branches.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <BranchChip href={buildPromotionsHref({ category: activeCategory })} active={!activeBranchSlug} label="ทุกสาขา" />
          {branches.map((branch) => (
            <BranchChip
              key={branch.slug}
              href={buildPromotionsHref({ branch: branch.slug, category: activeCategory })}
              active={activeBranchSlug === branch.slug}
              label={branch.name}
            />
          ))}
        </div>
      ) : null}

      <div className="mt-6">
        <PromotionCategoryTabs activeCategory={activeCategory} branchSlug={branchSlug} />
        <div className="border-4 border-paseo bg-paseo p-1 sm:p-1.5">
          {promotions.length ? (
            <PromotionArchiveGrid promotions={promotions} />
          ) : (
            <p className="bg-[#1a1a18] py-16 text-center text-sm text-white/70">{emptyMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PromotionCategoryTabs({
  activeCategory,
  branchSlug,
}: {
  activeCategory?: PromotionCategory | null;
  branchSlug?: string;
}) {
  return (
    <div
      className="-mx-5 flex items-end overflow-x-auto pl-0 pr-5 scrollbar-hidden sm:mx-0 sm:flex-wrap sm:overflow-x-visible sm:pr-0"
      role="tablist"
      aria-label="Promotion categories"
    >
      {PROMOTION_ARCHIVE_TABS.map((tab) => {
        const active = (activeCategory ?? null) === tab.value;
        return (
          <Link
            key={tab.label}
            href={buildPromotionsHref({ branch: branchSlug, category: tab.value })}
            role="tab"
            aria-selected={active}
            className={cn(
              "shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors sm:px-5 sm:text-base",
              active
                ? "rounded-t-lg bg-paseo text-foreground"
                : "text-white hover:text-paseo",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export function PromotionArchiveGrid({ promotions }: { promotions: ArchivePromotion[] }) {
  return (
    <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {promotions.map((promotion) => (
        <PromotionPosterCard key={promotion.id} promotion={promotion} />
      ))}
    </div>
  );
}

function PromotionPosterCard({ promotion }: { promotion: ArchivePromotion }) {
  return (
    <Link
      href={`/promotions/${promotion.slug}`}
      className="group relative block aspect-square overflow-hidden bg-[#1a1a18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-paseo rounded-lg"
    >
      {promotion.featuredImage ? (
        <Image
          src={promotion.featuredImage}
          alt={promotion.coverImageAlt || promotion.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#262421] p-6 text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-white">{promotion.title}</span>
        </div>
      )}
      <span className="sr-only">{promotion.title}</span>
    </Link>
  );
}

function BranchChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-paseo px-3 py-1.5 text-sm font-medium text-foreground"
          : "rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:border-paseo hover:text-paseo"
      }
    >
      {label}
    </Link>
  );
}
