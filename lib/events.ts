import type { Prisma } from "@prisma/client";

import { getBranchThaiName } from "@/lib/branches/branch-names";
import { startOfTodayBangkok } from "@/lib/datetime";
import { formatDate, formatDateRange, formatDateTime, formatTime } from "@/lib/datetime-server";
import { prisma } from "@/lib/prisma";

export const ARCHIVE_EVENT_LIMIT = 24;
export const MORE_EVENTS_LIMIT = 6;

export type ArchiveEvent = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  coverImageAlt: string | null;
  eventDate: Date;
  eventEndDate: Date | null;
  location: string | null;
};

export type HomeArchiveEvent = ArchiveEvent & {
  branchNames: string[];
};

const archiveEventSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  featuredImage: true,
  coverImageAlt: true,
  eventDate: true,
  eventEndDate: true,
  location: true,
} as const;

export function startOfToday() {
  return startOfTodayBangkok();
}

export function publishedEventWhere(branchId?: string): Prisma.EventWhereInput {
  return {
    deletedAt: null,
    status: "PUBLISHED",
    AND: [
      { OR: [{ seo: null }, { seo: { is: { noindex: false } } }] },
      ...(branchId ? [{ OR: [{ branches: { some: { branchId } } }, { branches: { none: {} } }] }] : []),
    ],
  };
}

/** Events still running or not yet started. Multi-day events stay visible until eventEndDate passes. */
export function activeEventWhere(branchId?: string, excludeId?: string): Prisma.EventWhereInput {
  const today = startOfToday();

  return {
    ...publishedEventWhere(branchId),
    ...(excludeId ? { NOT: { id: excludeId } } : {}),
    OR: [
      {
        eventEndDate: { not: null },
        eventEndDate: { gte: today },
      },
      {
        eventEndDate: null,
        eventDate: { gte: today },
      },
    ],
  };
}

/** @deprecated Use activeEventWhere — kept as alias for existing imports */
export const upcomingEventWhere = activeEventWhere;

export async function getBranchBySlug(slug: string) {
  return prisma.branch.findFirst({
    where: { slug, deletedAt: null },
    select: { id: true, name: true, nameTh: true, nameEn: true, slug: true },
  });
}

export async function getPublishedEvents({
  branchId,
  limit = ARCHIVE_EVENT_LIMIT,
  upcomingOnly = false,
  excludeId,
}: {
  branchId?: string;
  limit?: number;
  upcomingOnly?: boolean;
  excludeId?: string;
} = {}) {
  const where = upcomingOnly ? activeEventWhere(branchId, excludeId) : publishedEventWhere(branchId);

  return prisma.event.findMany({
    where,
    select: archiveEventSelect,
    orderBy: upcomingOnly ? { eventDate: "asc" } : { eventDate: "desc" },
    take: limit,
  });
}

export async function getUpcomingEventsForHome(limit = 3) {
  return getPublishedEvents({ limit, upcomingOnly: true });
}

const homeEventSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  featuredImage: true,
  coverImageAlt: true,
  eventDate: true,
  eventEndDate: true,
  location: true,
  branches: {
    select: {
      branch: { select: { name: true, nameTh: true, nameEn: true } },
    },
  },
} as const;

export async function getHomeEvents(limit = 3): Promise<HomeArchiveEvent[]> {
  return getHomeStyleEvents({ limit });
}

type HomeEventRecord = Prisma.EventGetPayload<{ select: typeof homeEventSelect }>;

export function toHomeArchiveEvent(event: HomeEventRecord): HomeArchiveEvent {
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    excerpt: event.excerpt,
    featuredImage: event.featuredImage,
    coverImageAlt: event.coverImageAlt,
    eventDate: event.eventDate,
    eventEndDate: event.eventEndDate,
    location: event.location,
    branchNames: event.branches.map((item) => getBranchThaiName(item.branch)),
  };
}

export async function getHomeStyleEvents({
  limit = MORE_EVENTS_LIMIT,
  excludeId,
  branchId,
}: {
  limit?: number;
  excludeId?: string;
  branchId?: string;
} = {}): Promise<HomeArchiveEvent[]> {
  const events = await prisma.event.findMany({
    where: activeEventWhere(branchId, excludeId),
    select: homeEventSelect,
    orderBy: { eventDate: "asc" },
    take: limit,
  });

  return events.map(toHomeArchiveEvent);
}

export async function formatEventTime(date: Date) {
  return formatTime(date);
}

export function formatEventBranchLabel(event: HomeArchiveEvent) {
  if (event.branchNames.length) return event.branchNames.join(", ");
  if (event.location?.trim()) return event.location;
  return "";
}

export async function getUpcomingEventsForBranch(branchId: string, limit = 6) {
  return getPublishedEvents({ branchId, limit, upcomingOnly: true });
}

export async function formatEventDate(date: Date) {
  return formatDate(date);
}

export async function formatEventDateTime(date: Date) {
  return formatDateTime(date);
}

export async function formatEventDateRange(start: Date, end: Date | null) {
  return formatDateRange(start, end);
}

export function buildEventsHref({ branch }: { branch?: string }) {
  if (!branch) return "/events";
  return `/events?branch=${branch}`;
}
