import { ContentStatus } from "@prisma/client";

import { getWorkspaceContentEditHref } from "@/lib/seo-workspace/content-edit-href";
import { prisma } from "@/lib/prisma";
import type { RecentlyPublishedItem } from "@/lib/dashboard/types";

const RECENTLY_PUBLISHED_LIMIT = 5;

async function loadRecentlyPublished(
  model: "post" | "event" | "promotion",
): Promise<RecentlyPublishedItem[]> {
  const where = {
    deletedAt: null,
    status: ContentStatus.PUBLISHED,
    publishedAt: { not: null },
  };

  if (model === "post") {
    const rows = await prisma.post.findMany({
      where,
      select: {
        id: true,
        title: true,
        publishedAt: true,
        seoAudits: { orderBy: { analyzedAt: "desc" }, take: 1, select: { score: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: RECENTLY_PUBLISHED_LIMIT,
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      seoScore: row.seoAudits[0]?.score ?? null,
      publishedAt: row.publishedAt!.toISOString(),
      editHref: getWorkspaceContentEditHref("post", row.id),
    }));
  }

  if (model === "event") {
    const rows = await prisma.event.findMany({
      where,
      select: {
        id: true,
        title: true,
        publishedAt: true,
        seoAudits: { orderBy: { analyzedAt: "desc" }, take: 1, select: { score: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: RECENTLY_PUBLISHED_LIMIT,
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      seoScore: row.seoAudits[0]?.score ?? null,
      publishedAt: row.publishedAt!.toISOString(),
      editHref: getWorkspaceContentEditHref("event", row.id),
    }));
  }

  const rows = await prisma.promotion.findMany({
    where,
    select: {
      id: true,
      title: true,
      publishedAt: true,
      seoAudits: { orderBy: { analyzedAt: "desc" }, take: 1, select: { score: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: RECENTLY_PUBLISHED_LIMIT,
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    seoScore: row.seoAudits[0]?.score ?? null,
    publishedAt: row.publishedAt!.toISOString(),
    editHref: getWorkspaceContentEditHref("promotion", row.id),
  }));
}

export async function buildRecentlyPublished() {
  const [posts, events, promotions] = await Promise.all([
    loadRecentlyPublished("post"),
    loadRecentlyPublished("event"),
    loadRecentlyPublished("promotion"),
  ]);

  return { posts, events, promotions };
}
