import { Skeleton } from "./skeleton";

export function EventCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <Skeleton className="mt-3 h-3 w-1/2" />
    </div>
  );
}

export function EventCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </div>
  );
}
