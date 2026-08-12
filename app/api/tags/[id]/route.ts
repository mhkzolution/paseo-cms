import { NextResponse } from "next/server";

import { conflictError, forbiddenError, validationError } from "@/lib/content-api";
import { prisma } from "@/lib/prisma";
import { checkModuleAccess } from "@/lib/rbac";
import { generateSlug } from "@/lib/seo";
import { tagSchema } from "@/validators/content.validator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function buildUniqueTagSlug(baseSlug: string, excludeId: string) {
  let candidate = baseSlug;
  let suffix = 2;

  while (
    await prisma.tag.findFirst({
      where: { slug: candidate, deletedAt: null, NOT: { id: excludeId } },
      select: { id: true },
    })
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("tags");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const tag = await prisma.tag.findFirst({
    where: { id, deletedAt: null },
    include: {
      posts: {
        include: {
          post: { select: { id: true, title: true, slug: true, status: true, deletedAt: true } },
        },
      },
      events: {
        include: {
          event: { select: { id: true, title: true, slug: true, status: true, deletedAt: true } },
        },
      },
      promotions: {
        include: {
          promotion: { select: { id: true, title: true, slug: true, status: true, deletedAt: true } },
        },
      },
    },
  });

  if (!tag) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ tag });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("tags");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const parsed = tagSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const current = await prisma.tag.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existingName = await prisma.tag.findFirst({
    where: { name: parsed.data.name, deletedAt: null, NOT: { id } },
    select: { id: true },
  });
  if (existingName) return conflictError("Tag name already exists");

  const baseSlug = generateSlug(parsed.data.slug || parsed.data.name) || "tag";
  const slug = await buildUniqueTagSlug(baseSlug, id);

  const tag = await prisma.tag.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? null,
    },
  });

  return NextResponse.json({ tag });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("tags");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const current = await prisma.tag.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.tag.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ success: true });
}
