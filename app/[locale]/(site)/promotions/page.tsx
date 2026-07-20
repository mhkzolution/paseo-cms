import type { Metadata } from "next";

import { PromotionArchivePage } from "@/features/promotions/promotion-archive-section";
import { isPromotionCategory } from "@/lib/promotion-categories";
import { getBranchBySlug, getPublishedPromotions } from "@/lib/promotions";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

interface PromotionsPageProps {
  searchParams: Promise<{ branch?: string; category?: string }>;
}

export async function generateMetadata({ searchParams }: PromotionsPageProps): Promise<Metadata> {
  const { branch: branchSlug } = await searchParams;
  const branch = branchSlug ? await getBranchBySlug(branchSlug) : null;

  return {
    title: branch ? `โปรโมชัน ${branch.name}` : "โปรโมชัน The Paseo",
    description: branch
      ? `โปรโมชันและข้อเสนอพิเศษที่ ${branch.name}`
      : "โปรโมชันและข้อเสนอพิเศษจากทุกสาขา The Paseo",
  };
}

export default async function PromotionsPage({ searchParams }: PromotionsPageProps) {
  const { branch: branchSlug, category: categoryParam } = await searchParams;
  const branch = branchSlug ? await getBranchBySlug(branchSlug) : null;
  const category = categoryParam && isPromotionCategory(categoryParam) ? categoryParam : null;

  const [branches, promotions] = await Promise.all([
    prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, select: { name: true, slug: true } }),
    getPublishedPromotions({ branchId: branch?.id, category: category ?? undefined }),
  ]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 scale-105 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center blur-md"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[#1a1a18]/85" aria-hidden="true" />

      <div className="relative z-10">
        <PromotionArchivePage
          promotions={promotions}
          activeCategory={category}
          branchSlug={branch?.slug}
          branches={branches}
          activeBranchSlug={branch?.slug}
          emptyMessage={
            branch
              ? `ยังไม่มีโปรโมชันที่ ${branch.name}`
              : category
                ? "ยังไม่มีโปรโมชันในหมวดนี้"
                : "ยังไม่มีโปรโมชันในขณะนี้"
          }
        />
      </div>
    </main>
  );
}
