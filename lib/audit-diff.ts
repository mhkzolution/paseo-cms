const IGNORE_KEYS = new Set(["createdAt", "updatedAt", "deletedAt"]);
const MASK_KEYS = new Set(["password", "token", "secret", "apiKey", "smtpPassword"]);
const LONG_TEXT_KEYS = new Set([
  "content",
  "customJsonLd",
  "metadata",
  "schemaOverrides",
  "robotsDirectives",
]);

export type DiffValue =
  | { before: unknown; after: unknown }
  | { changed: true; masked?: true };

export type DiffResult = Record<string, DiffValue>;

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(obj[key])}`).join(",")}}`;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a === "object" || typeof b === "object") {
    return stableSerialize(a) === stableSerialize(b);
  }
  return false;
}

export function buildDiff(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): DiffResult | null {
  const left = before ?? {};
  const right = after ?? {};
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  const result: DiffResult = {};

  for (const key of keys) {
    if (IGNORE_KEYS.has(key)) continue;

    const beforeValue = left[key] ?? null;
    const afterValue = right[key] ?? null;
    if (valuesEqual(beforeValue, afterValue)) continue;

    if (MASK_KEYS.has(key)) {
      result[key] = { changed: true, masked: true };
      continue;
    }

    if (LONG_TEXT_KEYS.has(key)) {
      result[key] = { changed: true };
      continue;
    }

    result[key] = { before: beforeValue, after: afterValue };
  }

  return Object.keys(result).length === 0 ? null : result;
}
