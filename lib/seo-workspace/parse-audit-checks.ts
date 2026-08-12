import type { SeoCheck } from "@/lib/seo-score";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSeoCheck(value: unknown): value is SeoCheck {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    (value.status === "good" || value.status === "ok" || value.status === "bad") &&
    typeof value.tip === "string" &&
    typeof value.weight === "number" &&
    typeof value.maxWeight === "number" &&
    (value.group === "seo" || value.group === "readability")
  );
}

export function parseAuditChecks(value: unknown): SeoCheck[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isSeoCheck);
}

export function countAuditSuggestions(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}
