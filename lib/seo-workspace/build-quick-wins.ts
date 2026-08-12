import { getCatalogEntry } from "@/lib/seo-check-catalog";
import { recoverableSeoPoints } from "@/lib/seo-assistant";
import { buildIssueDeepLink } from "@/lib/seo-workspace/content-edit-href";
import type { QuickWinItem, WorkspaceCorpusItem } from "@/lib/seo-workspace/types";

const QUICK_WIN_LIMIT = 10;

type QuickWinAccumulator = {
  checkId: string;
  affectedCount: number;
  recoverableTotal: number;
};

export function buildQuickWins(corpus: WorkspaceCorpusItem[]): QuickWinItem[] {
  const accumulators = new Map<string, QuickWinAccumulator>();

  for (const item of corpus) {
    if (!item.latestAudit) continue;

    for (const check of item.latestAudit.checks) {
      if (check.status === "good") continue;

      let entry;
      try {
        entry = getCatalogEntry(check.id);
      } catch {
        continue;
      }

      if (!entry.quickWinEligible) continue;

      const recoverable = recoverableSeoPoints(check);
      if (recoverable <= 0) continue;

      const current = accumulators.get(check.id) ?? {
        checkId: check.id,
        affectedCount: 0,
        recoverableTotal: 0,
      };

      current.affectedCount += 1;
      current.recoverableTotal += recoverable;
      accumulators.set(check.id, current);
    }
  }

  return [...accumulators.values()]
    .map((row) => {
      const entry = getCatalogEntry(row.checkId);

      return {
        checkId: row.checkId,
        issue: entry.actionLabel,
        affectedCount: row.affectedCount,
        estimatedImpact:
          row.affectedCount === 0
            ? 0
            : Math.round((row.recoverableTotal / row.affectedCount) * 10) / 10,
        deepLink: buildIssueDeepLink(row.checkId),
      };
    })
    .sort((left, right) => {
      const leftImpact = left.affectedCount * left.estimatedImpact;
      const rightImpact = right.affectedCount * right.estimatedImpact;
      return rightImpact - leftImpact;
    })
    .slice(0, QUICK_WIN_LIMIT);
}
