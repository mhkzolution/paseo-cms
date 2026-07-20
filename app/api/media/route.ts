import { NextResponse } from "next/server";

import { buildMediaWhere } from "@/lib/media";
import { forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/rbac";
import { mediaListSchema } from "@/validators/media.validator";

const MEDIA_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"] as const;

export async function GET(request: Request) {
  const { authorized, status } = await checkRole([...MEDIA_ROLES]);
  if (!authorized) return forbiddenError(status);

  const { searchParams } = new URL(request.url);
  const parsed = mediaListSchema.safeParse({
    folderId: searchParams.get("folderId") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });

  if (!parsed.success) return validationError(parsed.error);

  const media = await prisma.media.findMany({
    where: buildMediaWhere(parsed.data),
    orderBy: { createdAt: "desc" },
    take: 120,
    select: {
      id: true,
      folderId: true,
      filename: true,
      path: true,
      type: true,
      size: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ media });
}
