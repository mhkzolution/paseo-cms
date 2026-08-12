import type { SeoCheck } from "@/lib/seo-score";

import type { InternalLinkCoverageLabel } from "@/lib/seo-workspace/types";

export function parseInternalLinkCount(checks: SeoCheck[]): number {
  const check = checks.find((item) => item.id === "internal-links");
  if (!check || check.status === "bad") return 0;

  const match = check.tip.match(/(\d+)/);
  if (!match?.[1]) return check.status === "good" ? 1 : 0;

  return Number.parseInt(match[1], 10);
}

export function toInternalLinkCoverageLabel(count: number): InternalLinkCoverageLabel {
  if (count <= 0) return "0 links";
  if (count === 1) return "1 link";
  if (count === 2) return "2 links";
  return "3+ links";
}
