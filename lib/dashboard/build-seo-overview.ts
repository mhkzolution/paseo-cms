import type { SeoWorkspaceHealth } from "@/lib/seo-workspace/types";
import type { DashboardSeoOverview } from "@/lib/dashboard/types";

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildSeoOverview(health: SeoWorkspaceHealth): DashboardSeoOverview {
  const auditedCount = health.auditedCount;
  const excellentPercent =
    auditedCount === 0 ? 0 : roundOneDecimal((health.excellentCount / auditedCount) * 100);
  const needsAttentionPercent =
    auditedCount === 0 ? 0 : roundOneDecimal((health.needsAttentionCount / auditedCount) * 100);

  return {
    averageScore: health.averageScore,
    coveragePercent: health.auditCoverage,
    excellentPercent,
    needsAttentionPercent,
    needsAttentionCount: health.needsAttentionCount,
    excellentCount: health.excellentCount,
    auditedCount,
  };
}
