import { PostCardGridSkeleton } from "./post-card-skeleton";
import { Skeleton } from "./skeleton";

export function NewsSinglePageSkeleton() {
  return (
    <main className="min-h-screen bg-[#FCFAF6] text-foreground" aria-busy="true" aria-label="กำลังโหลดบทความ">
      <article className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
        <Skeleton className="h-4 w-36" />

        <Skeleton className="mt-6 h-4 w-24" />
        <Skeleton className="mt-4 h-10 w-full" />
        <Skeleton className="mt-2 h-10 w-4/5" />
        <Skeleton className="mt-5 h-5 w-3/4" />

        <div className="mt-5 flex flex-wrap gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>

        <Skeleton className="mt-6 aspect-[16/9] w-full rounded-lg" />

        <div className="mt-6 space-y-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
          <Skeleton className="h-4 w-5/6" />
        </div>
      </article>

      <section className="mx-auto w-full max-w-4xl px-5 pb-12 sm:px-8">
        <Skeleton className="h-8 w-40" />
        <div className="mt-4 grid gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </section>
    </main>
  );
}
