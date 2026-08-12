import { buildAttentionList } from "@/lib/seo-workspace/build-attention-list";
import { buildHealthOverview } from "@/lib/seo-workspace/build-health-overview";
import { buildLinkOpportunities } from "@/lib/seo-workspace/build-link-opportunities";
import { buildQuickWins } from "@/lib/seo-workspace/build-quick-wins";
import { loadWorkspaceCorpus } from "@/lib/seo-workspace/load-corpus";
import {
  SEO_WORKSPACE_SNAPSHOT_VERSION,
  type SeoWorkspaceSnapshot,
} from "@/lib/seo-workspace/types";

export async function buildWorkspaceSnapshot(): Promise<SeoWorkspaceSnapshot> {
  const corpus = await loadWorkspaceCorpus();

  const noAudit = {
    posts: corpus.filter((item) => item.contentType === "post" && item.latestAudit == null).length,
    events: corpus.filter((item) => item.contentType === "event" && item.latestAudit == null).length,
    promotions: corpus.filter((item) => item.contentType === "promotion" && item.latestAudit == null)
      .length,
  };

  return {
    version: SEO_WORKSPACE_SNAPSHOT_VERSION,
    generatedAt: new Date().toISOString(),
    health: buildHealthOverview(corpus),
    attention: buildAttentionList(corpus),
    quickWins: buildQuickWins(corpus),
    internalLinks: buildLinkOpportunities(corpus),
    noAudit,
  };
}
