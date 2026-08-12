import type { CategoryScope, PostKind, PrismaClient } from "@prisma/client";

import { POST_KIND_LABELS } from "@/lib/post-archives";
import { prisma } from "@/lib/prisma";

export type CategoryAdminScope = CategoryScope;

export const DEFAULT_POST_CATEGORIES: Array<{
  name: string;
  slug: string;
  postKind: PostKind;
  sortOrder: number;
}> = [
  { name: POST_KIND_LABELS.NEWS, slug: "news", postKind: "NEWS", sortOrder: 0 },
  { name: POST_KIND_LABELS.PUBLIC_RELATIONS, slug: "public-relations", postKind: "PUBLIC_RELATIONS", sortOrder: 1 },
  { name: POST_KIND_LABELS.CENTER_UPDATE, slug: "center-update", postKind: "CENTER_UPDATE", sortOrder: 2 },
  { name: POST_KIND_LABELS.ARTICLE, slug: "article", postKind: "ARTICLE", sortOrder: 3 },
];

const POST_KIND_BY_SLUG: Record<string, PostKind> = {
  news: "NEWS",
  "public-relations": "PUBLIC_RELATIONS",
  pr: "PUBLIC_RELATIONS",
  "center-update": "CENTER_UPDATE",
  article: "ARTICLE",
};

export function resolvePostKindFromCategorySlug(slug: string): PostKind {
  return POST_KIND_BY_SLUG[slug.toLowerCase()] ?? "NEWS";
}

export async function ensureDefaultPostCategories(client: Pick<PrismaClient, "category"> = prisma) {
  const existingCount = await client.category.count({
    where: { deletedAt: null, scope: "POST" },
  });

  if (existingCount > 0) {
    return;
  }

  await client.category.createMany({
    data: DEFAULT_POST_CATEGORIES.map((category) => ({
      ...category,
      scope: "POST" as const,
    })),
    skipDuplicates: true,
  });
}

export async function resolvePostKindForSave(
  categoryId: string | null | undefined,
  client: Pick<PrismaClient, "category"> = prisma,
): Promise<PostKind | undefined> {
  if (!categoryId) {
    return undefined;
  }

  const category = await client.category.findFirst({
    where: { id: categoryId, deletedAt: null, scope: "POST" },
    select: { postKind: true, slug: true },
  });

  if (!category) {
    return undefined;
  }

  return category.postKind ?? resolvePostKindFromCategorySlug(category.slug);
}

export function mapPostCategoryOptions(
  categories: Array<{ id: string; name: string; slug: string; postKind: PostKind | null }>,
) {
  return categories.map((category) => ({
    label: category.name,
    value: category.id,
    postKind: category.postKind ?? resolvePostKindFromCategorySlug(category.slug),
  }));
}

export const CATEGORY_ADMIN_CONFIG = {
  STORE: {
    title: "หมวดหมู่ร้านค้า",
    description: "จัดกลุ่มร้านค้าสำหรับการนำทางและแสดงผลบนเว็บไซต์",
    basePath: "/admin/categories",
    countRelation: "stores" as const,
    countLabel: "ร้านค้า",
    emptyTitle: "ยังไม่มีหมวดหมู่ร้านค้า",
    emptyDescription: "สร้างหมวดหมู่เพื่อจัดกลุ่มร้านค้าในสาขาต่างๆ",
    addLabel: "เพิ่มหมวดหมู่ร้านค้า",
    createTitle: "เพิ่มหมวดหมู่ร้านค้า",
    editTitle: "แก้ไขหมวดหมู่ร้านค้า",
    createSubmitLabel: "สร้างหมวดหมู่",
    editSubmitLabel: "บันทึกการเปลี่ยนแปลง",
    backLabel: "กลับไปหมวดหมู่ร้านค้า",
  },
  POST: {
    title: "หมวดหมู่ข่าวสาร",
    description: "จัดกลุ่มข่าวสารและบทความสำหรับการจัดหมวดหมู่เนื้อหา",
    basePath: "/admin/post-categories",
    countRelation: "posts" as const,
    countLabel: "ข่าวสาร",
    emptyTitle: "ยังไม่มีหมวดหมู่ข่าวสาร",
    emptyDescription: "สร้างหมวดหมู่เพื่อจัดกลุ่มข่าวสารและบทความ",
    addLabel: "เพิ่มหมวดหมู่ข่าวสาร",
    createTitle: "เพิ่มหมวดหมู่ข่าวสาร",
    editTitle: "แก้ไขหมวดหมู่ข่าวสาร",
    createSubmitLabel: "สร้างหมวดหมู่",
    editSubmitLabel: "บันทึกการเปลี่ยนแปลง",
    backLabel: "กลับไปหมวดหมู่ข่าวสาร",
  },
} as const satisfies Record<
  CategoryAdminScope,
  {
    title: string;
    description: string;
    basePath: string;
    countRelation: "stores" | "posts";
    countLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    addLabel: string;
    createTitle: string;
    editTitle: string;
    createSubmitLabel: string;
    editSubmitLabel: string;
    backLabel: string;
  }
>;

export function getCategoryAdminConfig(scope: CategoryAdminScope) {
  return CATEGORY_ADMIN_CONFIG[scope];
}

export function getCategoryModuleId(scope: CategoryAdminScope): "categories" | "post-categories" {
  return scope === "POST" ? "post-categories" : "categories";
}
