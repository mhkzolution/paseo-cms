import type { WorkspaceCorpusItem, SeoWorkspaceHealth } from "@/lib/seo-workspace/types";
import { getWorkspaceScoreBand } from "@/lib/seo-workspace/workspace-score-band";

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildHealthOverview(corpus: WorkspaceCorpusItem[]): SeoWorkspaceHealth {
  const totalPublished = corpus.length;
  const auditedItems = corpus.filter((item) => item.latestAudit != null);
  const auditedCount = auditedItems.length;

  const auditCoverage =
    totalPublished === 0 ? 0 : roundOneDecimal((auditedCount / totalPublished) * 100);

  const averageScore =
    auditedCount === 0
      ? 0
      : roundOneDecimal(
          auditedItems.reduce((sum, item) => sum + (item.latestAudit?.score ?? 0), 0) / auditedCount,
        );

  let excellentCount = 0;
  let needsAttentionCount = 0;

  for (const item of auditedItems) {
    const band = getWorkspaceScoreBand(item.latestAudit?.score ?? 0);
    if (band === "excellent") excellentCount += 1;
    if (band === "needs_attention") needsAttentionCount += 1;
  }

  return {
    totalPublished,
    averageScore,
    auditCoverage,
    auditedCount,
    excellentCount,
    needsAttentionCount,
  };
}
