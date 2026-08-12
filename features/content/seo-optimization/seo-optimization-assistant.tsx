import type { AssistantState } from "@/lib/seo-assistant";
import { cn } from "@/lib/utils";

import { SeoDiagnosticsPanel } from "./seo-diagnostics-panel";
import { SeoFixSuggestionsCard } from "./seo-fix-suggestions-card";
import { SeoInternalLinksCard } from "./seo-internal-links-card";
import { SeoQuickWinsCard } from "./seo-quick-wins-card";
import { SeoScoreSummaryCard } from "./seo-score-summary-card";

export type SeoOptimizationAssistantProps = {
  state: AssistantState;
  className?: string;
};

export function isExcellentAssistantState(state: AssistantState): boolean {
  return state.score.seoScore >= 90 && state.issues.length === 0;
}

export function SeoOptimizationAssistant({ state, className }: SeoOptimizationAssistantProps) {
  const isExcellent = isExcellentAssistantState(state);

  return (
    <div
      data-testid="seo-optimization-assistant"
      className={cn("grid gap-4", className)}
    >
      <SeoScoreSummaryCard
        score={state.score}
        topBlockers={state.issues.slice(0, 3)}
      />

      {!isExcellent ? (
        <>
          <SeoQuickWinsCard
            items={state.bestImprovements}
            fixSuggestions={state.fixSuggestions}
          />
          <SeoFixSuggestionsCard items={state.fixSuggestions} />
        </>
      ) : null}

      {state.showInternalLinks ? (
        <SeoInternalLinksCard
          items={state.internalLinkSuggestions}
          stale={state.linkSuggestionsStale}
        />
      ) : null}

      <SeoDiagnosticsPanel issues={state.issues} />
    </div>
  );
}
