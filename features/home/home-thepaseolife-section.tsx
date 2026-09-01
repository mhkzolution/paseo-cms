import { ThePaseoLifeCarousel } from "@/features/thepaseolife/thepaseolife-carousel";
import type { PublicThePaseoLifePost } from "@/lib/thepaseolife";
import { cn } from "@/lib/utils";

type HomeThePaseoLifeSectionProps = {
  posts: PublicThePaseoLifePost[];
  className?: string;
};

export function HomeThePaseoLifeSection({ posts, className }: HomeThePaseoLifeSectionProps) {
  return (
    <section
      id="membership"
      className={cn("scroll-mt-[72px] bg-[#FCFAF6] px-4 py-8 sm:py-16 lg:py-20", className)}
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <h2 className="text-center text-3xl font-semibold tracking-[0.12em] text-foreground sm:text-4xl">
          MEMBERSHIP PASEO LIFE
        </h2>
        {posts.length ? <ThePaseoLifeCarousel posts={posts} className="mt-9" /> : null}
      </div>
    </section>
  );
}
