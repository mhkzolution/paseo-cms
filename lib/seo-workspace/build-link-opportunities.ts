import { getWorkspaceContentEditHref } from "@/lib/seo-workspace/content-edit-href";
import {
  parseInternalLinkCount,
  toInternalLinkCoverageLabel,
} from "@/lib/seo-workspace/internal-link-count";
import { sumRecoverablePotential } from "@/lib/seo-workspace/recoverable-potential";
import type { InternalLinkOpportunity, WorkspaceCorpusItem } from "@/lib/seo-workspace/types";

const INTERNAL_LINK_LIMIT = 50;

export function buildLinkOpportunities(corpus: WorkspaceCorpusItem[]): InternalLinkOpportunity[] {
  return corpus
    .filter((item) => item.latestAudit != null)
    .map((item) => {
      const audit = item.latestAudit!;
      const internalLinkCount = parseInternalLinkCount(audit.checks);
      const linkCheck = audit.checks.find((check) => check.id === "internal-links");

      return {
        id: item.id,
        title: item.title,
        contentType: item.contentType,
        internalLinkCount,
        coverageLabel: toInternalLinkCoverageLabel(internalLinkCount),
        recoverablePotential: sumRecoverablePotential(audit.checks),
        suggestedLinkCount: audit.suggestionCount,
        categoryKey: item.categoryKey,
        branchIds: item.branchIds,
        tagIds: item.tagIds,
        editHref: getWorkspaceContentEditHref(item.contentType, item.id),
        needsAttention:
          internalLinkCount <= 2 || (linkCheck != null && linkCheck.status !== "good"),
      };
    })
    .filter((item) => item.needsAttention)
    .sort((left, right) => {
      if (left.internalLinkCount !== right.internalLinkCount) {
        return left.internalLinkCount - right.internalLinkCount;
      }

      return left.title.localeCompare(right.title);
    })
    .slice(0, INTERNAL_LINK_LIMIT)
    .map(({ needsAttention: _needsAttention, ...item }) => item);
}
