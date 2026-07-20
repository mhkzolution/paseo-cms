import { NextResponse } from "next/server";

import { POST_KIND_LABELS } from "@/lib/post-archives";
import { formatPromotionCategory } from "@/lib/promotion-categories";
import { prisma } from "@/lib/prisma";
import { getBranchThaiName } from "@/lib/branches/branch-names";
import { getStoreThaiName } from "@/lib/stores/store-names";
import { searchSchema } from "@/validators/content.validator";

type SearchResultType = "Post" | "Event" | "Promotion" | "Branch" | "Store";

interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  href: string;
  type: SearchResultType;
  updatedAt: Date;
  image?: string | null;
  imageAlt?: string | null;
  category?: string | null;
  logo?: string | null;
  branchName?: string | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = searchSchema.safeParse({ q: searchParams.get("q") ?? "" });
  const isPublic = searchParams.get("scope") === "public";

  if (!parsed.success) {
    return NextResponse.json({ results: [], query: "", error: parsed.error.issues[0]?.message }, { status: 422 });
  }

  const query = parsed.data.q;
  const contains = { contains: query };

  const [posts, events, promotions, branches, stores] = await Promise.all([
    prisma.post.findMany({
      where: {
        deletedAt: null,
        ...(isPublic ? { status: "PUBLISHED" as const } : {}),
        OR: [{ title: contains }, { excerpt: contains }, { content: contains }],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        coverImageAlt: true,
        updatedAt: true,
        kind: true,
        category: { select: { name: true } },
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.event.findMany({
      where: {
        deletedAt: null,
        ...(isPublic ? { status: "PUBLISHED" as const } : {}),
        OR: [{ title: contains }, { location: contains }, { content: contains }],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        coverImageAlt: true,
        location: true,
        updatedAt: true,
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.promotion.findMany({
      where: {
        deletedAt: null,
        ...(isPublic ? { status: "PUBLISHED" as const } : {}),
        OR: [{ title: contains }, { content: contains }],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        coverImageAlt: true,
        category: true,
        updatedAt: true,
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),
    isPublic
      ? Promise.resolve([])
      : prisma.branch.findMany({
          where: { deletedAt: null, OR: [{ name: contains }, { address: contains }, { phone: contains }] },
          take: 8,
          orderBy: { updatedAt: "desc" },
        }),
    prisma.store.findMany({
      where: {
        deletedAt: null,
        OR: [{ name: contains }, { nameTh: contains }, { nameEn: contains }, { description: contains }],
      },
      select: {
        id: true,
        name: true,
        nameTh: true,
        nameEn: true,
        slug: true,
        logo: true,
        updatedAt: true,
        branch: { select: { name: true, nameTh: true, nameEn: true } },
      },
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const results: SearchResult[] = [
    ...posts.map((post) => ({
      id: post.id,
      title: post.title,
      description: post.excerpt,
      href: `/news/${post.slug}`,
      type: "Post" as const,
      updatedAt: post.updatedAt,
      image: post.featuredImage,
      imageAlt: post.coverImageAlt,
      category: post.category?.name ?? POST_KIND_LABELS[post.kind],
    })),
    ...events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.excerpt ?? event.location,
      href: `/events/${event.slug}`,
      type: "Event" as const,
      updatedAt: event.updatedAt,
      image: event.featuredImage,
      imageAlt: event.coverImageAlt,
      category: "กิจกรรม",
    })),
    ...promotions.map((promotion) => ({
      id: promotion.id,
      title: promotion.title,
      description: promotion.excerpt,
      href: `/promotions/${promotion.slug}`,
      type: "Promotion" as const,
      updatedAt: promotion.updatedAt,
      image: promotion.featuredImage,
      imageAlt: promotion.coverImageAlt,
      category: formatPromotionCategory(promotion.category),
    })),
    ...branches.map((branch) => ({
      id: branch.id,
      title: branch.name,
      description: branch.address,
      href: `/branches/${branch.slug}`,
      type: "Branch" as const,
      updatedAt: branch.updatedAt,
    })),
    ...stores.map((store) => ({
      id: store.id,
      title: getStoreThaiName(store),
      description: null,
      href: `/stores/${store.slug}`,
      type: "Store" as const,
      updatedAt: store.updatedAt,
      logo: store.logo,
      branchName: getBranchThaiName(store.branch),
    })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 24);

  return NextResponse.json({ query, results });
}
