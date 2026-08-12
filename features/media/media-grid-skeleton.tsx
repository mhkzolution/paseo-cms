const SKELETON_CARDS = 10;

export function MediaGridSkeleton() {
  return (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4"
      role="status"
      aria-label="Loading media"
    >
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-lg border border-border bg-surface"
          aria-hidden="true"
        >
          <div className="aspect-square bg-background" />
          <div className="space-y-2 px-3 py-3">
            <div className="h-4 w-3/4 rounded bg-border" />
            <div className="h-3 w-1/2 rounded bg-border" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading media assets...</span>
    </div>
  );
}
