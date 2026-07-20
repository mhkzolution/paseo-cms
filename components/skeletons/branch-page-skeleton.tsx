import { EventCardGridSkeleton } from "./event-card-skeleton";
import { PostCardGridSkeleton } from "./post-card-skeleton";
import { SiteHeaderSkeleton } from "./site-header-skeleton";
import { Skeleton } from "./skeleton";

export function BranchPageSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--branch-background,#FCFAF6)] text-foreground" aria-busy="true" aria-label="กำลังโหลดหน้าสาขา">
      <SiteHeaderSkeleton />

      <Skeleton className="aspect-[4/3] w-full max-h-[360px] rounded-none sm:aspect-[16/9] sm:max-h-[440px] md:aspect-[21/9] md:max-h-[480px]" />

      <section className="border-b border-border py-10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-10 w-2/3" />
          <Skeleton className="mt-3 h-4 w-1/2" />
        </div>
      </section>

      <section className="bg-paseo py-12 sm:py-16">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="flex items-end justify-between gap-4">
            <Skeleton className="h-12 w-40 bg-foreground/10" />
            <Skeleton className="h-10 w-28 rounded-full bg-white/50" />
          </div>
          <div className="mt-6">
            <EventCardGridSkeleton count={3} />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-9 w-1/2" />
          <div className="mt-10">
            <PostCardGridSkeleton count={3} />
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-3 h-9 w-1/3" />
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-border bg-white">
                <Skeleton className="aspect-[16/10] w-full rounded-none" />
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <Skeleton className="mt-4 h-4 w-32" />
          </div>
          <Skeleton className="min-h-[240px] w-full rounded-lg" />
        </div>
      </section>
    </main>
  );
}
