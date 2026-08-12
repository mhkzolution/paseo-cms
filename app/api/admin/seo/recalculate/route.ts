import { ContentStatus } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { forbiddenError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { SEO_WORKSPACE_CACHE_TAG } from "@/lib/seo-workspace/types";
import { checkModuleAccess } from "@/lib/rbac";

async function countPublishedContent() {
  const where = { deletedAt: null, status: ContentStatus.PUBLISHED };

  const [posts, events, promotions] = await Promise.all([
    prisma.post.count({ where }),
    prisma.event.count({ where }),
    prisma.promotion.count({ where }),
  ]);

  return posts + events + promotions;
}

export async function POST() {
  const { authorized, status } = await checkModuleAccess("seo");
  if (!authorized) return forbiddenError(status);

  const estimatedItems = await countPublishedContent();
  revalidateTag(SEO_WORKSPACE_CACHE_TAG, { expire: 0 });

  return NextResponse.json({
    queued: true,
    estimatedItems,
  });
}
