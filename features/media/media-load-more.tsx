import { Button } from "@/components/ui/button";

interface MediaLoadMoreProps {
  loadedCount: number;
  total: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

export function MediaLoadMore({
  loadedCount,
  total,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: MediaLoadMoreProps) {
  if (total === 0) return null;

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-sm text-muted">
        Showing {loadedCount} of {total} assets
      </p>
      {hasMore ? (
        <Button type="button" variant="secondary" isLoading={isLoadingMore} onClick={onLoadMore}>
          Load More
        </Button>
      ) : null}
    </div>
  );
}
