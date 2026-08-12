"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import type { LocalizationSettings } from "@/lib/localization-settings";
import type { SeoWorkspaceSnapshot } from "@/lib/seo-workspace/types";

import { SeoAttentionTable } from "@/features/seo-workspace/seo-attention-table";
import { SeoHealthCards } from "@/features/seo-workspace/seo-health-cards";
import { SeoInternalLinksSection } from "@/features/seo-workspace/seo-internal-links-section";
import { SeoNoAuditSection } from "@/features/seo-workspace/seo-no-audit-section";
import { SeoQuickWinsSection } from "@/features/seo-workspace/seo-quick-wins-section";
import {
  filterAttentionItems,
  parseWorkspaceFilters,
  type WorkspaceFilterOption,
} from "@/features/seo-workspace/workspace-filters";
import { SeoWorkspaceFilters } from "@/features/seo-workspace/seo-workspace-filters";

type SeoWorkspaceClientProps = {
  snapshot: SeoWorkspaceSnapshot;
  categories: WorkspaceFilterOption[];
  branches: WorkspaceFilterOption[];
  tags: WorkspaceFilterOption[];
  localization: LocalizationSettings;
};

export function SeoWorkspaceClient({
  snapshot,
  categories,
  branches,
  tags,
  localization,
}: SeoWorkspaceClientProps) {
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseWorkspaceFilters(searchParams), [searchParams]);

  const attentionItems = useMemo(
    () => filterAttentionItems(snapshot.attention, filters),
    [snapshot.attention, filters],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
      <SeoWorkspaceFilters categories={categories} branches={branches} tags={tags} />

      <div className="flex min-w-0 flex-col gap-8">
        <SeoHealthCards health={snapshot.health} />
        <SeoAttentionTable items={attentionItems} issueFilter={filters.issue || undefined} localization={localization} />
        <SeoQuickWinsSection items={snapshot.quickWins} />
        <SeoInternalLinksSection items={snapshot.internalLinks} />
        <SeoNoAuditSection noAudit={snapshot.noAudit} />
      </div>
    </div>
  );
}
