import { BranchSection } from "@/features/branches/shared/render-branch-sections";
import type { BranchPageData } from "@/lib/branches/types";

export function MallPage({ data }: { data: BranchPageData }) {
  return (
    <main className="min-h-screen bg-[var(--branch-background)] text-foreground">
      {data.sections.map((section) => (
        <BranchSection key={section} section={section} data={data} />
      ))}
    </main>
  );
}
