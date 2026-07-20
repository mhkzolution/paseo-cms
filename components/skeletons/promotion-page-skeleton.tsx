import { Skeleton } from "./skeleton";

export function PromotionArchivePageSkeleton() {
  return (
    <main className="relative min-h-screen overflow-hidden" aria-busy="true" aria-label="กำลังโหลดโปรโมชัน">
      <div className="absolute inset-0 bg-[#1a1a18]" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
        <Skeleton className="h-10 w-2/3 max-w-xl bg-white/10" />
        <Skeleton className="mt-3 h-4 w-40 bg-white/10" />
        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-28 rounded-t-lg bg-white/10" />
          ))}
        </div>
        <div className="mt-0 border-4 border-paseo/40 bg-paseo/40 p-1.5">
          <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square bg-[#262421]" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export function PromotionSinglePageSkeleton() {
  return (
    <main className="min-h-screen bg-[#FCFAF6] text-foreground" aria-busy="true" aria-label="กำลังโหลดโปรโมชัน">
      <article className="mx-auto w-full max-w-4xl px-5 py-12 sm:px-8">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-6 h-4 w-24" />
        <Skeleton className="mt-3 h-12 w-3/4 max-w-2xl" />
        <Skeleton className="mt-4 h-5 w-full max-w-3xl" />
        <Skeleton className="mt-5 h-4 w-56" />
        <Skeleton className="mt-6 aspect-[16/10] w-full rounded-2xl" />
        <div className="mt-6 grid gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </article>
    </main>
  );
}
