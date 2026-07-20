import { EventCardGridSkeleton } from "./event-card-skeleton";
import { Skeleton } from "./skeleton";

export function EventArchivePageSkeleton() {
  return (
    <main className="min-h-screen bg-[#FCFAF6] text-foreground" aria-busy="true" aria-label="กำลังโหลดกิจกรรม">
      <section className="bg-paseo py-12 sm:py-16">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Skeleton className="h-4 w-16 bg-foreground/10" />
          <Skeleton className="mt-3 h-12 w-2/3 max-w-xl bg-foreground/10" />
          <Skeleton className="mt-4 h-4 w-full max-w-2xl bg-foreground/10" />
          <Skeleton className="mt-2 h-4 w-4/5 max-w-xl bg-foreground/10" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="mt-10">
          <EventCardGridSkeleton count={6} />
        </div>
      </section>
    </main>
  );
}
