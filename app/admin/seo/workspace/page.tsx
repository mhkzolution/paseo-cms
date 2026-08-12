import { Suspense } from "react";

import { requireModuleAccess } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getLocalizationSettings } from "@/lib/settings-cache";
import { getWorkspaceSnapshot } from "@/lib/seo-workspace/get-workspace-snapshot";
import { RecalculateSeoButton } from "@/features/seo-workspace/recalculate-seo-button";
import { SeoWorkspaceClient } from "@/features/seo-workspace/seo-workspace-client";
import { SeoWorkspaceSettingsLink } from "@/features/seo-workspace/seo-workspace-filters";

async function loadFilterOptions() {
  const [categories, branches, tags] = await Promise.all([
    prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.branch.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.tag.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const categoryOptions = [
    ...categories.map((category) => ({ value: category.id, label: category.name })),
    ...(["FOOD", "DRINKS_BAKERY", "MISC", "EDUCATION"] as const).map((value) => ({
      value,
      label: `Promotion · ${value.replaceAll("_", " ")}`,
    })),
  ];

  return {
    categories: categoryOptions,
    branches: branches.map((branch) => ({ value: branch.id, label: branch.name })),
    tags: tags.map((tag) => ({ value: tag.id, label: tag.name })),
  };
}

export default async function SeoWorkspacePage() {
  await requireModuleAccess("seo");

  const [snapshot, filterOptions, localization] = await Promise.all([
    getWorkspaceSnapshot(),
    loadFilterOptions(),
    getLocalizationSettings(),
  ]);

  return (
    <div className="flex flex-col gap-6 font-sans">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Marketing & SEO</p>
          <h1 className="text-2xl font-semibold text-foreground">SEO Workspace</h1>
          <p className="text-sm text-muted">
            Discover and fix SEO issues across published posts, events, and promotions.
          </p>
          <SeoWorkspaceSettingsLink />
        </div>
        <RecalculateSeoButton generatedAt={snapshot.generatedAt} localization={localization} />
      </header>

      <Suspense fallback={<p className="text-sm text-muted">Loading workspace…</p>}>
        <SeoWorkspaceClient snapshot={snapshot} {...filterOptions} localization={localization} />
      </Suspense>
    </div>
  );
}
