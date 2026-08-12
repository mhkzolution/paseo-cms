import type { AssistantIssue, AssistantState } from "@/lib/seo-assistant";
import { cn } from "@/lib/utils";

export type SeoScoreBandLabel = "Poor" | "Good" | "Excellent";

export const EXCELLENT_GAP_MESSAGE = "คุณผ่านเกณฑ์ SEO ระดับ Excellent แล้ว";
export const NO_CRITICAL_BLOCKERS_MESSAGE = "ไม่พบปัญหา SEO สำคัญ";

export function getSeoScoreBandLabel(seoScore: number): SeoScoreBandLabel {
  if (seoScore >= 90) return "Excellent";
  if (seoScore >= 70) return "Good";
  return "Poor";
}

export function getGapDisplayMessage(seoScore: number, scoreGapMessage: string): string {
  if (seoScore >= 90) {
    return EXCELLENT_GAP_MESSAGE;
  }

  return scoreGapMessage;
}

export type SeoScoreSummaryCardProps = {
  score: AssistantState["score"];
  topBlockers: Pick<AssistantIssue, "checkId" | "issueLabel">[];
  className?: string;
};

export function SeoScoreSummaryCard({
  score,
  topBlockers,
  className,
}: SeoScoreSummaryCardProps) {
  const bandLabel = getSeoScoreBandLabel(score.seoScore);
  const gapMessage = getGapDisplayMessage(score.seoScore, score.scoreGapMessage);

  return (
    <section
      aria-label="SEO Score Summary"
      data-block="score-summary"
      data-testid="seo-summary-card"
      className={cn("grid gap-4 rounded-md border border-border bg-surface p-4", className)}
    >
      <div className="grid gap-1" data-testid="seo-score">
        <h2 className="text-sm font-semibold text-foreground">SEO Score</h2>
        <p className="text-3xl font-semibold tabular-nums text-foreground">
          {score.seoScore}
          <span className="text-lg font-normal text-muted"> / 100</span>
        </p>
      </div>

      <div className="grid gap-1" data-testid="seo-band">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Band</p>
        <p className="text-sm font-medium text-foreground">{bandLabel}</p>
      </div>

      <div className="grid gap-1" data-testid="seo-gap-message">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Gap</p>
        <p className="text-sm text-foreground">{gapMessage}</p>
      </div>

      <div className="grid gap-2" data-testid="seo-top-blockers">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Top blockers</h3>
        {topBlockers.length > 0 ? (
          <ul className="grid gap-1 text-sm text-foreground">
            {topBlockers.map((issue) => (
              <li key={issue.checkId}>• {issue.issueLabel}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{NO_CRITICAL_BLOCKERS_MESSAGE}</p>
        )}
      </div>
    </section>
  );
}
