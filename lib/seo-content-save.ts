import type { PrismaClient } from "@prisma/client";

import {
  applyAutoSeoFields,
  type AutoFillSeoShape,
  type ContentType,
  type PostKind,
} from "@/lib/seo-auto-fill";
import { resolveAutoFillContext } from "@/lib/seo-auto-fill-context";

type PrismaLike = Pick<PrismaClient, "tag" | "category">;

type EnrichableContent = {
  title: string;
  excerpt?: string | null;
  content: string;
  featuredImage?: string | null;
  tagIds?: string[];
  newTags?: string | null;
  categoryId?: string | null;
  kind?: PostKind;
  category?: string;
  seo: AutoFillSeoShape & Record<string, unknown>;
};

export async function enrichSeoForSave<T extends EnrichableContent>(
  client: PrismaLike,
  data: T,
  options: {
    contentType: ContentType;
    slug: string;
    isCreate: boolean;
  },
): Promise<T & { slug: string }> {
  const context = await resolveAutoFillContext(client, {
    tagIds: data.tagIds ?? [],
    newTags: data.newTags,
    categoryId: data.categoryId,
    promotionCategory: data.category,
    slug: options.slug,
    isCreate: options.isCreate,
  });

  const { seo } = applyAutoSeoFields({
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    featuredImage: data.featuredImage,
    slug: options.slug,
    seo: { ...data.seo },
    contentType: options.contentType,
    postKind: data.kind,
    isCreate: options.isCreate,
    primaryTagName: context.primaryTagName,
    categoryName: context.categoryName,
  });

  return {
    ...data,
    seo: {
      ...data.seo,
      ...seo,
    },
    slug: options.slug,
  };
}
