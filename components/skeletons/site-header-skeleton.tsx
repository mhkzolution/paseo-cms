import { Skeleton } from "./skeleton";

export function SiteHeaderSkeleton() {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Skeleton className="h-8 w-32" />
        <div className="hidden flex-1 items-center justify-center gap-4 md:flex">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-20" />
          ))}
        </div>
        <Skeleton className="h-9 w-9 rounded-full md:hidden" />
      </div>
    </header>
  );
}
