import { cn } from "@/lib/utils";
import { getSeoScoreBand } from "@/lib/seo-score";

type SeoScoreBadgeProps = {
  score: number | null | undefined;
  readability?: number | null;
  className?: string;
};

const BAND_CLASSES = {
  red: "bg-red-100 text-red-800",
  yellow: "bg-amber-100 text-amber-900",
  green: "bg-emerald-100 text-emerald-800",
  empty: "bg-muted/20 text-muted",
} as const;

export function SeoScoreBadge({ score, readability, className }: SeoScoreBadgeProps) {
  if (score == null) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          BAND_CLASSES.empty,
          className,
        )}
        title="ยังไม่มีคะแนน SEO"
      >
        —
      </span>
    );
  }

  const band = getSeoScoreBand(score);
  const title =
    readability != null ? `SEO ${score} · Readability ${readability}` : `SEO ${score}`;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums",
        BAND_CLASSES[band],
        className,
      )}
      title={title}
    >
      {score}
    </span>
  );
}
