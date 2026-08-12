"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

export type AuditChangeRow =
  | { key: string; kind: "diff"; before: unknown; after: unknown }
  | { key: string; kind: "changed" }
  | { key: string; kind: "masked" };

function isChangeObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function formatAuditChangeRows(
  changes: Record<string, unknown> | null,
): AuditChangeRow[] {
  if (!changes) return [];

  return Object.entries(changes).map(([key, value]) => {
    if (isChangeObject(value)) {
      if (value.changed === true && value.masked === true) {
        return { key, kind: "masked" as const };
      }
      if (value.changed === true) {
        return { key, kind: "changed" as const };
      }
      if ("before" in value || "after" in value) {
        return {
          key,
          kind: "diff" as const,
          before: value.before,
          after: value.after,
        };
      }
    }

    return { key, kind: "changed" as const };
  });
}

function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

type AuditLogChangesProps = {
  changes: Record<string, unknown> | null;
};

export function AuditLogChanges({ changes }: AuditLogChangesProps) {
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  if (changes === null) {
    return <p className="text-sm text-muted">No field-level changes recorded.</p>;
  }

  const rows = formatAuditChangeRows(changes);
  const jsonText = JSON.stringify(changes, null, 2);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — no-op
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Changes</h3>
        <button
          type="button"
          onClick={() => setShowJson((current) => !current)}
          className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface"
        >
          {showJson ? "View fields" : "View JSON"}
        </button>
      </div>

      {showJson ? (
        <div className="relative">
          <pre className="max-h-64 overflow-auto rounded-md border border-border bg-background p-3 font-mono text-xs text-foreground">
            {jsonText}
          </pre>
          <button
            type="button"
            onClick={copyJson}
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-foreground hover:bg-background"
          >
            <Copy className="h-3 w-3" aria-hidden="true" />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.key}>
              <div className="text-sm font-medium text-foreground">{row.key}</div>
              {row.kind === "diff" ? (
                <p className="mt-1 text-sm text-muted">
                  {formatChangeValue(row.before)}
                  <span className="mx-2 text-foreground">→</span>
                  {formatChangeValue(row.after)}
                </p>
              ) : row.kind === "masked" ? (
                <p className="mt-1 text-sm text-muted">Changed (masked)</p>
              ) : (
                <p className="mt-1 text-sm text-muted">Changed</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
