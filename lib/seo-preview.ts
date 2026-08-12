import {
  applyAutoSeoFields,
  type AutoFillSeoShape,
  type ContentType,
  type PostKind,
} from "@/lib/seo-auto-fill";
import { PROMOTION_CATEGORY_LABELS } from "@/lib/seo-auto-fill-context";
import { toSeoScoreInput } from "@/lib/seo-audit";
import { generateSlug, splitKeywords } from "@/lib/seo";
import type { SeoScoreInput } from "@/lib/seo-score";

export type PreviewOption = {
  label: string;
  value: string;
};

export type PreviewSeoFormInput = {
  title: string;
  excerpt?: string | null;
  content: string;
  featuredImage?: string | null;
  coverImageAlt?: string | null;
  slug?: string | null;
  seo: AutoFillSeoShape & {
    keywords?: string | null;
    secondaryKeywords?: string | null;
  };
  contentType: ContentType;
  postKind?: PostKind;
  categoryId?: string | null;
  promotionCategory?: string | null;
  tagIds?: string[];
  newTags?: string | null;
  categories?: PreviewOption[];
  tags?: PreviewOption[];
};

export type PreviewSeoPayload = {
  scoreInput: SeoScoreInput;
  previewSeo: AutoFillSeoShape;
  filledFields: string[];
  slug: string;
};

export function resolvePreviewPrimaryTagName(input: {
  newTags?: string | null;
  tagIds?: string[];
  tags?: PreviewOption[];
  keywords?: string | null;
  secondaryKeywords?: string | null;
}): string | null {
  const newTagNames = splitKeywords(input.newTags);
  if (newTagNames.length > 0) {
    return newTagNames[0] ?? null;
  }

  const tagIds = input.tagIds ?? [];
  if (tagIds.length > 0 && input.tags?.length) {
    const tagId = tagIds[0];
    const tag = input.tags.find((option) => option.value === tagId);
    if (tag?.label?.trim()) {
      return tag.label.trim();
    }
  }

  const keywords = splitKeywords(input.keywords);
  if (keywords.length > 0) {
    return keywords[0] ?? null;
  }

  const secondaryKeywords = splitKeywords(input.secondaryKeywords);
  if (secondaryKeywords.length > 0) {
    return secondaryKeywords[0] ?? null;
  }

  return null;
}

export function resolvePreviewCategoryName(input: {
  categoryId?: string | null;
  promotionCategory?: string | null;
  categories?: PreviewOption[];
}): string | null {
  if (input.categoryId && input.categories?.length) {
    const category = input.categories.find((option) => option.value === input.categoryId);
    if (category?.label?.trim()) {
      return category.label.trim();
    }
  }

  if (input.promotionCategory) {
    return PROMOTION_CATEGORY_LABELS[input.promotionCategory] ?? input.promotionCategory;
  }

  return null;
}

export function resolvePreviewContext(input: PreviewSeoFormInput) {
  const slug = generateSlug(input.slug?.trim() || input.title) || "";

  return {
    primaryTagName: resolvePreviewPrimaryTagName({
      newTags: input.newTags,
      tagIds: input.tagIds,
      tags: input.tags,
      keywords: input.seo.keywords,
      secondaryKeywords: input.seo.secondaryKeywords,
    }),
    categoryName: resolvePreviewCategoryName({
      categoryId: input.categoryId,
      promotionCategory: input.promotionCategory,
      categories: input.categories,
    }),
    slug,
    isCreate: true as const,
  };
}

export function buildPreviewSeoPayload(input: PreviewSeoFormInput): PreviewSeoPayload {
  const context = resolvePreviewContext(input);
  const { seo, filledFields } = applyAutoSeoFields({
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    featuredImage: input.featuredImage,
    slug: context.slug,
    seo: { ...input.seo },
    contentType: input.contentType,
    postKind: input.postKind,
    isCreate: context.isCreate,
    primaryTagName: context.primaryTagName,
    categoryName: context.categoryName,
  });

  const scoreInput = toSeoScoreInput(
    {
      title: input.title,
      slug: context.slug,
      content: input.content,
      excerpt: input.excerpt,
      featuredImage: input.featuredImage,
      coverImageAlt: input.coverImageAlt,
      seo,
    },
    { contentType: input.contentType },
  );

  return {
    scoreInput,
    previewSeo: seo,
    filledFields,
    slug: context.slug,
  };
}

/** Backward compatibility alias. Use `buildPreviewSeoPayload` for new code. */
export const buildSeoPreviewPayload = buildPreviewSeoPayload;
