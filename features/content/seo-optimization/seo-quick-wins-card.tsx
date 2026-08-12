"use client";

import type { AssistantFixSuggestion, AssistantImprovement } from "@/lib/seo-assistant";
import { cn } from "@/lib/utils";

import { SeoCopyButton } from "./seo-copy-button";

export const QUICK_WINS_DISPLAY_LIMIT = 5;

export type SeoQuickWinsCardProps = {
  items: AssistantImprovement[];
  fixSuggestions?: Pick<AssistantFixSuggestion, "checkId" | "recommended">[];
  className?: string;
};

export function buildFixSuggestionLookup(
  fixSuggestions: Pick<AssistantFixSuggestion, "checkId" | "recommended">[] = [],
) {
  return new Map(
    fixSuggestions.map((suggestion) => [suggestion.checkId, suggestion.recommended] as const),
  );
}

export function SeoQuickWinsCard({
  items,
  fixSuggestions = [],
  className,
}: SeoQuickWinsCardProps) {
  if (items.length === 0) {
    return null;
  }

  const visibleItems = items.slice(0, QUICK_WINS_DISPLAY_LIMIT);
  const fixSuggestionByCheckId = buildFixSuggestionLookup(fixSuggestions);

  return (
    <section
      aria-label="Quick Wins"
      data-block="quick-wins"
      data-testid="seo-quick-wins-card"
      className={cn("grid gap-3 rounded-md border border-border bg-surface p-4", className)}
    >
      <h2 className="text-sm font-semibold text-foreground">Quick Wins</h2>
      <ul className="grid gap-2" data-testid="seo-quick-wins-list">
        {visibleItems.map((item) => {
          const recommended = fixSuggestionByCheckId.get(item.checkId);

          return (
            <li
              key={item.checkId}
              data-testid={`seo-quick-win-${item.checkId}`}
              className="grid gap-2 rounded-md border border-border bg-background/60 p-3"
            >
              <p className="text-sm font-medium text-foreground">{item.actionLabel}</p>
              <p className="text-sm font-semibold text-foreground">+{item.recoverablePoints} คะแนน</p>
              <p className="text-xs text-muted">{item.reason}</p>
              {recommended ? (
                <>
                  {/* TODO(A4.1): analytics.track("seo_quick_win", { checkId: item.checkId }); */}
                  <SeoCopyButton text={recommended} />
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
