import type { PostKind } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const ARCHIVE_POST_LIMIT = 3;
export const TREND_UPDATE_POST_LIMIT = 10;

export const POST_KIND_ORDER: PostKind[] = ["NEWS", "PUBLIC_RELATIONS", "CENTER_UPDATE", "ARTICLE"];

export const POST_KIND_LABELS: Record<PostKind, string> = {
  NEWS: "ข่าวสาร",
  PUBLIC_RELATIONS: "ประชาสัมพันธ์",
  CENTER_UPDATE: "อัปเดตศูนย์",
  ARTICLE: "บทความ",
};

export type ArchivePost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  coverImageAlt: string | null;
  kind: PostKind;
  publishedAt: Date | null;
  category: { name: string } | null;
};

export type PostArchiveGroup = {
  key: string;
  label: string;
  kind: PostKind;
  posts: ArchivePost[];
};

const publishedPostFilter = {
  deletedAt: null,
  status: "PUBLISHED" as const,
  OR: [{ seo: null }, { seo: { is: { noindex: false } } }],
};

export async function getLatestPostsForTrendUpdate() {
  return prisma.post.findMany({
    where: publishedPostFilter,
    select: archivePostSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: TREND_UPDATE_POST_LIMIT,
  });
}

export async function getLatestPostsForHome(limit = 3) {
  return getMorePostsForNewsDetail({ limit });
}

export async function getMorePostsForNewsDetail({
  limit = 3,
  excludeId,
  branchId,
}: {
  limit?: number;
  excludeId?: string;
  branchId?: string;
} = {}) {
  return prisma.post.findMany({
    where: {
      ...publishedPostFilter,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      ...(branchId
        ? { OR: [{ branches: { some: { branchId } } }, { branches: { none: {} } }] }
        : {}),
    },
    select: archivePostSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function getPostArchivesForHome() {
  const posts = await prisma.post.findMany({
    where: {
      ...publishedPostFilter,
      showOnHome: true,
    },
    select: archivePostSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return groupPostsByKind(posts);
}

export async function getPostArchivesForBranch(branchId: string) {
  const posts = await prisma.post.findMany({
    where: {
      ...publishedPostFilter,
      OR: [{ branches: { some: { branchId } } }, { branches: { none: {} } }],
    },
    select: archivePostSelect,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return groupPostsByKind(posts);
}

const archivePostSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  featuredImage: true,
  coverImageAlt: true,
  kind: true,
  publishedAt: true,
  category: { select: { name: true } },
} as const;

function groupPostsByKind(posts: ArchivePost[]) {
  const groups = new Map<PostKind, ArchivePost[]>();

  for (const kind of POST_KIND_ORDER) {
    groups.set(kind, []);
  }

  for (const post of posts) {
    const bucket = groups.get(post.kind) ?? [];
    if (bucket.length < ARCHIVE_POST_LIMIT) {
      bucket.push(post);
      groups.set(post.kind, bucket);
    }
  }

  return POST_KIND_ORDER.map((kind) => ({
    key: kind,
    kind,
    label: POST_KIND_LABELS[kind],
    posts: groups.get(kind) ?? [],
  })).filter((group) => group.posts.length > 0);
}

export function formatPostKindLabel(kind: PostKind) {
  return POST_KIND_LABELS[kind] ?? kind;
}

export function formatPostDate(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(date);
}

export function truncatePostExcerpt(text: string | null | undefined, maxLength = 100) {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}
