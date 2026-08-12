"use client";

import type { AssistantIssue } from "@/lib/seo-assistant";
import { cn } from "@/lib/utils";

export const DIAGNOSTICS_EMPTY_MESSAGE = "ไม่พบปัญหา SEO";

export type SeoDiagnosticsPanelProps = {
  issues: AssistantIssue[];
  className?: string;
};

function DiagnosticRow({ issue }: { issue: AssistantIssue }) {
  return (
    <li
      data-testid={`seo-diagnostics-issue-${issue.checkId}`}
      className="grid gap-1 rounded-md border border-border bg-background/60 p-3 text-sm"
    >
      <p className="font-medium text-foreground" data-testid="seo-diagnostics-label">
        {issue.issueLabel}
      </p>
      <p className="text-xs uppercase tracking-wide text-muted" data-testid="seo-diagnostics-status">
        {issue.status}
      </p>
      <p className="text-xs text-muted" data-testid="seo-diagnostics-reason">
        {issue.reason}
      </p>
    </li>
  );
}

export function SeoDiagnosticsPanel({ issues, className }: SeoDiagnosticsPanelProps) {
  return (
    <section
      aria-label="Diagnostics"
      data-block="diagnostics"
      data-testid="seo-diagnostics-panel"
      className={cn("rounded-md border border-border bg-surface p-4", className)}
    >
      <details
        data-testid="seo-diagnostics-details"
        onToggle={(event) => {
          if ((event.currentTarget as HTMLDetailsElement).open) {
            // TODO(A4.1): analytics.track("seo_diagnostics_open", { issueCount: issues.length });
          }
        }}
      >
        <summary
          className="cursor-pointer text-sm font-semibold text-foreground"
          data-testid="seo-diagnostics-summary"
        >
          Diagnostics ({issues.length})
        </summary>

        <div
          className="mt-3 max-h-[400px] overflow-y-auto"
          data-testid="seo-diagnostics-body"
        >
          {issues.length === 0 ? (
            <p className="text-sm text-muted" data-testid="seo-diagnostics-empty">
              {DIAGNOSTICS_EMPTY_MESSAGE}
            </p>
          ) : (
            <ul className="grid gap-2">
              {issues.map((issue) => (
                <DiagnosticRow key={issue.checkId} issue={issue} />
              ))}
            </ul>
          )}
        </div>
      </details>
    </section>
  );
}
