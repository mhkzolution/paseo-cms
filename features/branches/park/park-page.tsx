import { BranchSection } from "@/features/branches/shared/render-branch-sections";
import type { BranchPageData } from "@/lib/branches/types";

export function ParkPage({ data }: { data: BranchPageData }) {
  const nonHeroSections = data.sections.filter((section) => section !== "hero");
  const hasHero = data.sections.includes("hero");

  return (
    <main className="min-h-screen bg-[var(--branch-background)] text-foreground">
      {hasHero ? <BranchSection section="hero" data={data} /> : null}
      {nonHeroSections.map((section) => (
        <BranchSection key={section} section={section} data={data} />
      ))}
    </main>
  );
}
