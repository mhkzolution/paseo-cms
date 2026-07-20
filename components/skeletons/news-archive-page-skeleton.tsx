import { PostCardGridSkeleton } from "./post-card-skeleton";
import { Skeleton } from "./skeleton";

export function NewsArchivePageSkeleton() {
  return (
    <main className="min-h-screen bg-[#FCFAF6] text-foreground" aria-busy="true" aria-label="กำลังโหลดข่าวสาร">
      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="mt-3 h-10 w-2/3 max-w-lg" />
        <Skeleton className="mt-3 h-4 w-32" />

        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-24 rounded-full" />
          ))}
        </div>

        <div className="mt-6">
          <PostCardGridSkeleton count={6} />
        </div>
      </section>
    </main>
  );
}
