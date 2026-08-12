import { ContentStatus } from "@prisma/client";

import { getWorkspaceContentEditHref } from "@/lib/seo-workspace/content-edit-href";
import type { WorkspaceContentType } from "@/lib/seo-workspace/types";
import { prisma } from "@/lib/prisma";
import type { RecentActivityEvent, RecentActivityEventType } from "@/lib/dashboard/types";

const ACTIVITY_LIMIT = 15;

type ActivityCandidate = RecentActivityEvent & { sortTime: number };

function listHref(contentType: WorkspaceContentType): string {
  switch (contentType) {
    case "post":
      return "/admin/posts";
    case "event":
      return "/admin/events";
    case "promotion":
      return "/admin/promotions";
  }
}

function pushEvent(
  bucket: ActivityCandidate[],
  input: {
    id: string;
    contentType: WorkspaceContentType;
    eventType: RecentActivityEventType;
    title: string;
    occurredAt: Date;
    edit?: boolean;
  },
) {
  bucket.push({
    id: input.id,
    contentType: input.contentType,
    eventType: input.eventType,
    title: input.title,
    occurredAt: input.occurredAt.toISOString(),
    href: input.edit ? getWorkspaceContentEditHref(input.contentType, input.id) : listHref(input.contentType),
    sortTime: input.occurredAt.getTime(),
  });
}

export async function buildRecentActivity(): Promise<RecentActivityEvent[]> {
  const candidates: ActivityCandidate[] = [];

  const [posts, events, promotions, deletedPosts, deletedEvents, deletedPromotions] =
    await Promise.all([
      prisma.post.findMany({
        where: { deletedAt: null },
        select: { id: true, title: true, status: true, createdAt: true, publishedAt: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 30,
      }),
      prisma.event.findMany({
        where: { deletedAt: null },
        select: { id: true, title: true, status: true, createdAt: true, publishedAt: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 30,
      }),
      prisma.promotion.findMany({
        where: { deletedAt: null },
        select: { id: true, title: true, status: true, createdAt: true, publishedAt: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 30,
      }),
      prisma.post.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, title: true, deletedAt: true },
        orderBy: { deletedAt: "desc" },
        take: 10,
      }),
      prisma.event.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, title: true, deletedAt: true },
        orderBy: { deletedAt: "desc" },
        take: 10,
      }),
      prisma.promotion.findMany({
        where: { deletedAt: { not: null } },
        select: { id: true, title: true, deletedAt: true },
        orderBy: { deletedAt: "desc" },
        take: 10,
      }),
    ]);

  for (const post of posts) {
    if (post.status === ContentStatus.PUBLISHED && post.publishedAt) {
      pushEvent(candidates, {
        id: post.id,
        contentType: "post",
        eventType: "published",
        title: post.title,
        occurredAt: post.publishedAt,
        edit: true,
      });
    } else if (post.status !== ContentStatus.PUBLISHED && post.publishedAt) {
      pushEvent(candidates, {
        id: post.id,
        contentType: "post",
        eventType: "unpublished",
        title: post.title,
        occurredAt: post.updatedAt,
        edit: true,
      });
    }

    pushEvent(candidates, {
      id: post.id,
      contentType: "post",
      eventType: "created",
      title: post.title,
      occurredAt: post.createdAt,
      edit: true,
    });
  }

  for (const event of events) {
    if (event.status === ContentStatus.PUBLISHED && event.publishedAt) {
      pushEvent(candidates, {
        id: event.id,
        contentType: "event",
        eventType: "published",
        title: event.title,
        occurredAt: event.publishedAt,
        edit: true,
      });
    } else if (event.status !== ContentStatus.PUBLISHED && event.publishedAt) {
      pushEvent(candidates, {
        id: event.id,
        contentType: "event",
        eventType: "unpublished",
        title: event.title,
        occurredAt: event.updatedAt,
        edit: true,
      });
    }

    pushEvent(candidates, {
      id: event.id,
      contentType: "event",
      eventType: "created",
      title: event.title,
      occurredAt: event.createdAt,
      edit: true,
    });
  }

  for (const promotion of promotions) {
    if (promotion.status === ContentStatus.PUBLISHED && promotion.publishedAt) {
      pushEvent(candidates, {
        id: promotion.id,
        contentType: "promotion",
        eventType: "published",
        title: promotion.title,
        occurredAt: promotion.publishedAt,
        edit: true,
      });
    } else if (promotion.status !== ContentStatus.PUBLISHED && promotion.publishedAt) {
      pushEvent(candidates, {
        id: promotion.id,
        contentType: "promotion",
        eventType: "unpublished",
        title: promotion.title,
        occurredAt: promotion.updatedAt,
        edit: true,
      });
    }

    pushEvent(candidates, {
      id: promotion.id,
      contentType: "promotion",
      eventType: "created",
      title: promotion.title,
      occurredAt: promotion.createdAt,
      edit: true,
    });
  }

  for (const post of deletedPosts) {
    if (!post.deletedAt) continue;
    pushEvent(candidates, {
      id: post.id,
      contentType: "post",
      eventType: "deleted",
      title: post.title,
      occurredAt: post.deletedAt,
    });
  }

  for (const event of deletedEvents) {
    if (!event.deletedAt) continue;
    pushEvent(candidates, {
      id: event.id,
      contentType: "event",
      eventType: "deleted",
      title: event.title,
      occurredAt: event.deletedAt,
    });
  }

  for (const promotion of deletedPromotions) {
    if (!promotion.deletedAt) continue;
    pushEvent(candidates, {
      id: promotion.id,
      contentType: "promotion",
      eventType: "deleted",
      title: promotion.title,
      occurredAt: promotion.deletedAt,
    });
  }

  const seen = new Set<string>();

  return candidates
    .sort((left, right) => right.sortTime - left.sortTime)
    .filter((item) => {
      const key = `${item.contentType}:${item.id}:${item.eventType}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, ACTIVITY_LIMIT)
    .map(({ sortTime: _sortTime, ...item }) => item);
}
