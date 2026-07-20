import { NextResponse } from "next/server";

import { conflictError, forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/rbac";
import { generateSlug } from "@/lib/seo";
import { tagSchema } from "@/validators/content.validator";

const CONTENT_ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"] as const;

async function buildUniqueTagSlug(baseSlug: string, excludeId?: string) {
  let candidate = baseSlug;
  let suffix = 2;

  while (
    await prisma.tag.findFirst({
      where: {
        slug: candidate,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    })
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function GET() {
  const { authorized, status } = await checkRole([...CONTENT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const tags = await prisma.tag.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          posts: true,
          events: true,
          promotions: true,
        },
      },
    },
  });

  return NextResponse.json({ tags });
}

export async function POST(request: Request) {
  const { authorized, status } = await checkRole([...CONTENT_ROLES]);
  if (!authorized) return forbiddenError(status);

  const parsed = tagSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const baseSlug = generateSlug(parsed.data.slug || parsed.data.name) || "tag";
  const slug = await buildUniqueTagSlug(baseSlug);

  const existingName = await prisma.tag.findFirst({
    where: { name: parsed.data.name, deletedAt: null },
    select: { id: true },
  });
  if (existingName) return conflictError("Tag name already exists");

  const tag = await prisma.tag.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? null,
    },
  });

  return NextResponse.json({ tag }, { status: 201 });
}
