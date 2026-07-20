import { EventCardGridSkeleton } from "./event-card-skeleton";
import { Skeleton } from "./skeleton";

export function EventSinglePageSkeleton() {
  return (
    <main className="min-h-screen bg-[#FCFAF6] text-foreground" aria-busy="true" aria-label="กำลังโหลดกิจกรรม">
      <article className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
        <Skeleton className="h-4 w-40" />

        <div className="mt-6 flex items-start justify-between gap-4">
          <div className="flex-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="mt-4 h-10 w-full" />
            <Skeleton className="mt-2 h-10 w-4/5" />
          </div>
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
        </div>

        <Skeleton className="mt-5 h-5 w-3/4" />
        <div className="mt-5 flex flex-wrap gap-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>

        <Skeleton className="mt-6 aspect-[16/10] w-full rounded-2xl" />

        <div className="mt-6 space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </article>

      <section className="bg-paseo py-12 sm:py-16">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Skeleton className="h-12 w-48 bg-foreground/10" />
          <div className="mt-6">
            <EventCardGridSkeleton count={3} />
          </div>
        </div>
      </section>
    </main>
  );
}
