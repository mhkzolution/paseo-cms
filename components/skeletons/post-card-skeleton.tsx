import { Skeleton } from "./skeleton";

export function PostCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-5 w-full" />
        <Skeleton className="mt-2 h-5 w-4/5" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
      </div>
    </div>
  );
}

export function PostCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </div>
  );
}
