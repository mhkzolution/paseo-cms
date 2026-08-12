import type { SeoWorkspaceHealth } from "@/lib/seo-workspace/types";
import type { ContentInventory, PlatformPulse } from "@/lib/dashboard/types";

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildPlatformPulse(
  inventory: ContentInventory,
  workspaceHealth: SeoWorkspaceHealth,
): PlatformPulse {
  const posts = inventory.posts.total;
  const events = inventory.events.total;
  const promotions = inventory.promotions.total;
  const totalCount = posts + events + promotions;
  const publishedCount =
    inventory.posts.published + inventory.events.published + inventory.promotions.published;

  const publishedPercent =
    totalCount === 0 ? 0 : roundOneDecimal((publishedCount / totalCount) * 100);

  return {
    posts,
    events,
    promotions,
    publishedPercent,
    publishedCount,
    totalCount,
    auditCoveragePercent: workspaceHealth.auditCoverage,
    auditedPublishedCount: workspaceHealth.auditedCount,
    averageSeoScore: workspaceHealth.averageScore,
  };
}
