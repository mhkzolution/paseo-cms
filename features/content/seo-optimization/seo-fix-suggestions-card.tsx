"use client";

import type { AssistantFixSuggestion } from "@/lib/seo-assistant";
import { cn } from "@/lib/utils";

import { SeoCopyButton } from "./seo-copy-button";

export type SeoFixSuggestionsCardProps = {
  items: AssistantFixSuggestion[];
  className?: string;
};

function SuggestionTextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p
        className="max-h-32 overflow-y-auto whitespace-pre-wrap break-words text-foreground"
        data-testid={`seo-fix-text-${label.toLowerCase()}`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

export function SeoFixSuggestionsCard({ items, className }: SeoFixSuggestionsCardProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Fix Suggestions"
      data-block="fix-suggestions"
      data-testid="seo-fix-suggestions-card"
      className={cn("grid gap-3 rounded-md border border-border bg-surface p-4", className)}
    >
      <h2 className="text-sm font-semibold text-foreground">Fix Suggestions</h2>
      <ul className="grid gap-3" data-testid="seo-fix-suggestions-list">
        {items.map((item) => (
          <li
            key={item.checkId}
            data-testid={`seo-fix-suggestion-${item.checkId}`}
            className="grid gap-2 rounded-md border border-border bg-background/60 p-3"
          >
            <p className="text-sm font-medium text-foreground">{item.targetField}</p>
            <p className="text-xs text-muted">{item.reason}</p>
            <SuggestionTextBlock label="Current" value={item.current} />
            <p className="text-center text-xs text-muted" aria-hidden="true">
              ↓
            </p>
            <SuggestionTextBlock label="Recommended" value={item.recommended} />
            <SeoCopyButton text={item.recommended} />
          </li>
        ))}
      </ul>
    </section>
  );
}
