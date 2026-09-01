type DatedContent = {
  createdAt: Date;
  publishedAt: Date | null;
};

function recencyTime(item: DatedContent) {
  return (item.publishedAt ?? item.createdAt).getTime();
}

/** Newest published (or newly created draft) items first. */
export function sortNewestFirst<T extends DatedContent>(items: T[]) {
  return [...items].sort((left, right) => {
    const byRecency = recencyTime(right) - recencyTime(left);
    if (byRecency !== 0) return byRecency;
    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}
