export function resolveLineOaUrl(raw: string | null | undefined): string | null {
  const compacted = (raw ?? "").trim().replace(/\s+/g, "");
  if (!compacted) return null;
  const id = compacted.startsWith("@") ? compacted : `@${compacted}`;
  return `https://line.me/R/ti/p/${id}`;
}
