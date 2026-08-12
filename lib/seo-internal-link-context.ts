export type InternalLinkSavedContext = {
  categoryId: string;
  tagIds: string[];
};

function normalizeTagIds(tagIds: string[] | undefined): string[] {
  return [...(tagIds ?? [])].filter((id) => typeof id === "string" && id.length > 0).sort();
}

export function isInternalLinkContextStale(
  saved: InternalLinkSavedContext,
  current: InternalLinkSavedContext,
): boolean {
  if ((saved.categoryId ?? "") !== (current.categoryId ?? "")) {
    return true;
  }

  const savedTags = normalizeTagIds(saved.tagIds);
  const currentTags = normalizeTagIds(current.tagIds);

  if (savedTags.length !== currentTags.length) {
    return true;
  }

  return savedTags.some((tagId, index) => tagId !== currentTags[index]);
}
