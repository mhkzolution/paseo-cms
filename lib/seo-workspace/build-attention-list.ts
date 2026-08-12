import { buildIssues } from "@/lib/seo-assistant";
import type { SeoCheck } from "@/lib/seo-score";
import { getWorkspaceContentEditHref } from "@/lib/seo-workspace/content-edit-href";
import { projectSeoScore, sumRecoverablePotential } from "@/lib/seo-workspace/recoverable-potential";
import type { AttentionItem, WorkspaceCorpusItem } from "@/lib/seo-workspace/types";
import { getWorkspaceScoreBand } from "@/lib/seo-workspace/workspace-score-band";

const ATTENTION_LIMIT = 100;

function getFailingCheckIds(checks: SeoCheck[]): string[] {
  return checks.filter((check) => check.status !== "good").map((check) => check.id);
}

export function buildAttentionList(corpus: WorkspaceCorpusItem[]): AttentionItem[] {
  return corpus
    .filter((item) => item.latestAudit != null)
    .map((item) => {
      const audit = item.latestAudit!;
      const recoverablePotential = sumRecoverablePotential(audit.checks);
      const topIssue = buildIssues(audit.checks, 1)[0];

      return {
        id: item.id,
        title: item.title,
        contentType: item.contentType,
        seoScore: audit.score,
        recoverablePotential,
        projectedScore: projectSeoScore(audit.score, recoverablePotential),
        scoreBand: getWorkspaceScoreBand(audit.score),
        topIssue: topIssue?.issueLabel ?? "—",
        topIssueCheckId: topIssue?.checkId ?? null,
        failingCheckIds: getFailingCheckIds(audit.checks),
        categoryKey: item.categoryKey,
        branchIds: item.branchIds,
        tagIds: item.tagIds,
        updatedAt: item.updatedAt.toISOString(),
        editHref: getWorkspaceContentEditHref(item.contentType, item.id),
      };
    })
    .sort((left, right) => {
      if (left.seoScore !== right.seoScore) return left.seoScore - right.seoScore;
      return right.recoverablePotential - left.recoverablePotential;
    })
    .slice(0, ATTENTION_LIMIT);
}
