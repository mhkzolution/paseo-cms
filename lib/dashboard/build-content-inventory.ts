import { ContentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { ContentInventory } from "@/lib/dashboard/types";

const ACTIVE_WHERE = { deletedAt: null } as const;

async function loadTypeInventory(model: "post" | "event" | "promotion") {
  const where = ACTIVE_WHERE;

  if (model === "post") {
    const [total, published] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.count({ where: { ...where, status: ContentStatus.PUBLISHED } }),
    ]);
    return { total, published, draft: total - published };
  }

  if (model === "event") {
    const [total, published] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.count({ where: { ...where, status: ContentStatus.PUBLISHED } }),
    ]);
    return { total, published, draft: total - published };
  }

  const [total, published] = await Promise.all([
    prisma.promotion.count({ where }),
    prisma.promotion.count({ where: { ...where, status: ContentStatus.PUBLISHED } }),
  ]);
  return { total, published, draft: total - published };
}

export async function buildContentInventory(): Promise<ContentInventory> {
  const [posts, events, promotions] = await Promise.all([
    loadTypeInventory("post"),
    loadTypeInventory("event"),
    loadTypeInventory("promotion"),
  ]);

  return { posts, events, promotions };
}
