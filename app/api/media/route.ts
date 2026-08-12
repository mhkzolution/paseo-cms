import { NextResponse } from "next/server";

import {
  buildMediaOrderBy,
  buildMediaPageMeta,
  buildMediaWhere,
  mediaListSelect,
  parseMediaPage,
} from "@/lib/media";
import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { mediaListSchema } from "@/validators/media.validator";

export async function GET(request: Request) {
  const { authorized, status } = await checkModuleAccess("media-library");
  if (!authorized) return forbiddenError(status);

  const { searchParams } = new URL(request.url);
  const parsed = mediaListSchema.safeParse({
    folderId: searchParams.get("folderId") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    take: searchParams.get("take") ?? undefined,
  });

  if (!parsed.success) return validationError(parsed.error);

  const where = buildMediaWhere(parsed.data);
  const { page, take, skip } = parseMediaPage(parsed.data);

  const [media, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: buildMediaOrderBy(parsed.data.sort),
      skip,
      take,
      select: mediaListSelect,
    }),
    prisma.media.count({ where }),
  ]);

  return NextResponse.json({
    media,
    ...buildMediaPageMeta({ total, page, take }),
  });
}
