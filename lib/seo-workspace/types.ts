import type { SeoCheck } from "@/lib/seo-score";

export const SEO_WORKSPACE_SNAPSHOT_VERSION = "a6.0-v1" as const;
export const SEO_WORKSPACE_CACHE_TAG = "seo-workspace";
export const SEO_WORKSPACE_REVALIDATE_SECONDS = 900;

export type WorkspaceContentType = "post" | "event" | "promotion";

export type WorkspaceScoreBand = "excellent" | "good" | "needs_attention";

export type InternalLinkCoverageLabel = "0 links" | "1 link" | "2 links" | "3+ links";

export type WorkspaceCorpusItem = {
  id: string;
  title: string;
  contentType: WorkspaceContentType;
  updatedAt: Date;
  categoryKey: string | null;
  branchIds: string[];
  tagIds: string[];
  latestAudit: {
    score: number;
    checks: SeoCheck[];
    analyzedAt: Date;
    suggestionCount: number;
  } | null;
};

export type SeoWorkspaceHealth = {
  totalPublished: number;
  averageScore: number;
  auditCoverage: number;
  auditedCount: number;
  excellentCount: number;
  needsAttentionCount: number;
};

export type AttentionItem = {
  id: string;
  title: string;
  contentType: WorkspaceContentType;
  seoScore: number;
  recoverablePotential: number;
  projectedScore: number;
  scoreBand: WorkspaceScoreBand;
  topIssue: string;
  topIssueCheckId: string | null;
  failingCheckIds: string[];
  categoryKey: string | null;
  branchIds: string[];
  tagIds: string[];
  updatedAt: string;
  editHref: string;
};

export type QuickWinItem = {
  checkId: string;
  issue: string;
  affectedCount: number;
  estimatedImpact: number;
  deepLink: string;
};

export type InternalLinkOpportunity = {
  id: string;
  title: string;
  contentType: WorkspaceContentType;
  internalLinkCount: number;
  coverageLabel: InternalLinkCoverageLabel;
  recoverablePotential: number;
  suggestedLinkCount: number;
  categoryKey: string | null;
  branchIds: string[];
  tagIds: string[];
  editHref: string;
};

export type SeoWorkspaceSnapshot = {
  version: typeof SEO_WORKSPACE_SNAPSHOT_VERSION;
  generatedAt: string;
  health: SeoWorkspaceHealth;
  attention: AttentionItem[];
  quickWins: QuickWinItem[];
  internalLinks: InternalLinkOpportunity[];
  noAudit: {
    posts: number;
    events: number;
    promotions: number;
  };
};
