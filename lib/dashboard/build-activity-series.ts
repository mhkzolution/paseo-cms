import { ContentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { ActivitySeries, DailyCount } from "@/lib/dashboard/types";

const ACTIVITY_DAYS = 30;

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildEmptySeries(): DailyCount[] {
  const days: DailyCount[] = [];
  const today = startOfUtcDay(new Date());

  for (let offset = ACTIVITY_DAYS - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - offset);
    days.push({ date: formatDayKey(day), count: 0 });
  }

  return days;
}

function aggregateDates(dates: Array<Date | null | undefined>): ActivitySeries {
  const buckets = new Map(buildEmptySeries().map((day) => [day.date, 0]));
  const cutoff = startOfUtcDay(new Date());
  cutoff.setUTCDate(cutoff.getUTCDate() - (ACTIVITY_DAYS - 1));

  for (const value of dates) {
    if (!value) continue;
    const day = startOfUtcDay(value);
    if (day < cutoff) continue;
    const key = formatDayKey(day);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const daily = buildEmptySeries().map((day) => ({
    date: day.date,
    count: buckets.get(day.date) ?? 0,
  }));

  return {
    daily,
    periodTotal: daily.reduce((sum, day) => sum + day.count, 0),
  };
}

export async function buildActivitySeries(): Promise<{
  published: ActivitySeries;
  created: ActivitySeries;
  updated: ActivitySeries;
}> {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - ACTIVITY_DAYS);

  const whereRecent = { deletedAt: null, updatedAt: { gte: cutoff } };
  const wherePublishedRecent = {
    deletedAt: null,
    status: ContentStatus.PUBLISHED,
    publishedAt: { gte: cutoff },
  };
  const whereCreatedRecent = { deletedAt: null, createdAt: { gte: cutoff } };

  const [posts, events, promotions, publishedPosts, publishedEvents, publishedPromotions] =
    await Promise.all([
      prisma.post.findMany({ where: whereRecent, select: { updatedAt: true } }),
      prisma.event.findMany({ where: whereRecent, select: { updatedAt: true } }),
      prisma.promotion.findMany({ where: whereRecent, select: { updatedAt: true } }),
      prisma.post.findMany({ where: wherePublishedRecent, select: { publishedAt: true } }),
      prisma.event.findMany({ where: wherePublishedRecent, select: { publishedAt: true } }),
      prisma.promotion.findMany({ where: wherePublishedRecent, select: { publishedAt: true } }),
    ]);

  const createdPosts = await prisma.post.findMany({
    where: whereCreatedRecent,
    select: { createdAt: true },
  });
  const createdEvents = await prisma.event.findMany({
    where: whereCreatedRecent,
    select: { createdAt: true },
  });
  const createdPromotions = await prisma.promotion.findMany({
    where: whereCreatedRecent,
    select: { createdAt: true },
  });

  return {
    published: aggregateDates([
      ...publishedPosts.map((item) => item.publishedAt),
      ...publishedEvents.map((item) => item.publishedAt),
      ...publishedPromotions.map((item) => item.publishedAt),
    ]),
    created: aggregateDates([
      ...createdPosts.map((item) => item.createdAt),
      ...createdEvents.map((item) => item.createdAt),
      ...createdPromotions.map((item) => item.createdAt),
    ]),
    updated: aggregateDates([
      ...posts.map((item) => item.updatedAt),
      ...events.map((item) => item.updatedAt),
      ...promotions.map((item) => item.updatedAt),
    ]),
  };
}
