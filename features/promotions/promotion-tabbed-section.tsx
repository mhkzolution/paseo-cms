"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { PromotionCategory } from "@prisma/client";
import { ChevronRight } from "lucide-react";

import { PromotionArchiveGrid } from "@/features/promotions/promotion-archive-section";
import { PROMOTION_ARCHIVE_TABS } from "@/lib/promotion-categories";
import type { ArchivePromotion } from "@/lib/promotions";
import { buildPromotionsHref } from "@/lib/promotions";
import { cn } from "@/lib/utils";

interface PromotionTabbedSectionProps {
  promotions: ArchivePromotion[];
  branchSlug?: string;
  sectionId?: string;
  viewAllLabel?: string;
  className?: string;
}

export function PromotionTabbedSection({
  promotions,
  branchSlug,
  sectionId,
  viewAllLabel = "เพิ่มเติม",
  className,
}: PromotionTabbedSectionProps) {
  const [activeCategory, setActiveCategory] = useState<PromotionCategory | null>(null);

  const filteredPromotions = useMemo(
    () => (activeCategory ? promotions.filter((promotion) => promotion.category === activeCategory) : promotions),
    [activeCategory, promotions],
  );

  const viewAllHref = buildPromotionsHref({ branch: branchSlug, category: activeCategory });

  if (!promotions.length) return null;

  return (
    <section id={sectionId} className={cn("bg-[#1a1a18] py-12 sm:py-16", className)}>
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            <span className="font-bold">PROMOTION</span>{" "}
            <span className="font-normal normal-case">WHAT NOT TO MISS TODAY</span>
          </h2>
          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-paseo px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-paseo-dark hover:text-white"
          >
            {viewAllLabel}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-6">
          <div
            className="-mx-5 flex items-end overflow-x-auto md:pl-4 pl-10 pr-5 scrollbar-hidden sm:mx-0 sm:flex-wrap sm:overflow-x-visible sm:pr-0"
            role="tablist"
            aria-label="Promotion categories"
          >
            {PROMOTION_ARCHIVE_TABS.map((tab) => {
              const active = activeCategory === tab.value;
              return (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(tab.value)}
                  className={cn(
                    "shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors sm:px-5 sm:text-base",
                    active
                      ? "rounded-t-lg bg-paseo text-foreground"
                      : "text-white hover:text-paseo",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="border-4 border-paseo bg-paseo p-1 sm:p-1.5 rounded-lg">
            {filteredPromotions.length ? (
              <PromotionArchiveGrid promotions={filteredPromotions} />
            ) : (
              <p className="bg-[#1a1a18] py-16 text-center text-sm text-white/70 rounded-lg">ยังไม่มีโปรโมชันในหมวดนี้</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** @deprecated Use PromotionTabbedSection */
export function PromotionHomeSection(props: Omit<PromotionTabbedSectionProps, "sectionId">) {
  return <PromotionTabbedSection {...props} sectionId="promotions" />;
}
