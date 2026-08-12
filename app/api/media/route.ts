import { NextResponse } from "next/server";

import { buildMediaOrderBy, buildMediaWhere, mediaListSelect } from "@/lib/media";
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
  });

  if (!parsed.success) return validationError(parsed.error);

  const media = await prisma.media.findMany({
    where: buildMediaWhere(parsed.data),
    orderBy: buildMediaOrderBy(parsed.data.sort),
    take: 120,
    select: mediaListSelect,
  });

  return NextResponse.json({ media });
}
