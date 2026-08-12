import type { QuickWinItem } from "@/lib/seo-workspace/types";
import type { ContentHealthItem } from "@/lib/dashboard/types";

const CONTENT_HEALTH_LIMIT = 5;

const HEALTH_LABEL_OVERRIDES: Record<string, string> = {
  "image-alt": "Missing cover image",
  "title-exists": "Missing SEO title",
  "title-length": "Missing SEO title",
  "desc-length": "Missing meta description",
  "internal-links": "Missing internal links",
};

export function buildContentHealth(quickWins: QuickWinItem[]): ContentHealthItem[] {
  return quickWins
    .slice()
    .sort((left, right) => right.affectedCount - left.affectedCount)
    .slice(0, CONTENT_HEALTH_LIMIT)
    .map((item) => ({
      checkId: item.checkId,
      label: HEALTH_LABEL_OVERRIDES[item.checkId] ?? item.issue,
      count: item.affectedCount,
    }));
}
