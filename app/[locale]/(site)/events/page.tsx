import type { Metadata } from "next";

import { EventArchivePageGrid, EventBranchFilter } from "@/features/events/event-archive-section";
import { getBranchBySlug, getPublishedEvents } from "@/lib/events";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

interface EventsPageProps {
  searchParams: Promise<{ branch?: string }>;
}

export async function generateMetadata({ searchParams }: EventsPageProps): Promise<Metadata> {
  const { branch: branchSlug } = await searchParams;
  const branch = branchSlug ? await getBranchBySlug(branchSlug) : null;

  return {
    title: branch ? `กิจกรรม ${branch.name}` : "กิจกรรม The Paseo",
    description: branch
      ? `กิจกรรมและอีเวนต์ที่กำลังจัดและใกล้ถึงที่ ${branch.name}`
      : "กิจกรรมและอีเวนต์ที่กำลังจัดและใกล้ถึงจากทุกสาขา The Paseo",
  };
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { branch: branchSlug } = await searchParams;
  const branch = branchSlug ? await getBranchBySlug(branchSlug) : null;

  const [branches, events] = await Promise.all([
    prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, select: { name: true, slug: true } }),
    getPublishedEvents({ branchId: branch?.id, upcomingOnly: true }),
  ]);

  return (
    <main className="min-h-screen bg-[#FCFAF6] text-foreground">
      <section className="bg-paseo py-12 sm:py-16">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <p className="text-sm font-semibold uppercase text-foreground/80">Events</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            {branch ? `กิจกรรมที่ ${branch.name}` : "กิจกรรม The Paseo"}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-foreground/80">
            อีเวนต์ที่กำลังจัดและใกล้ถึงจากทุกสาขา เลือกดูตามสาขาที่สนใจได้
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
        <EventBranchFilter branches={branches} activeSlug={branch?.slug} />
        <div className="mt-10">
          <EventArchivePageGrid
            events={events}
            emptyMessage={branch ? `ยังไม่มีกิจกรรมที่ ${branch.name}` : "ยังไม่มีกิจกรรมในขณะนี้"}
          />
        </div>
      </section>
    </main>
  );
}
