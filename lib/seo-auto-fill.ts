import {
  extractContentExcerpt,
  extractTopic,
  extractTitleKeywords,
  inferFocusKeyword,
  truncateNear,
} from "@/lib/seo-shared";

export type ContentType = "post" | "event" | "promotion";
export type PostKind = "NEWS" | "PUBLIC_RELATIONS" | "CENTER_UPDATE" | "ARTICLE";
export type SeoSchemaTypeValue = "ARTICLE" | "NEWS_ARTICLE" | "BLOG_POSTING" | "FAQ_PAGE" | "EVENT" | "CUSTOM";

export type AutoFillSeoShape = {
  seoTitle?: string | null;
  seoDescription?: string | null;
  focusKeyword?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  schemaType?: SeoSchemaTypeValue | null;
};

export type AutoFillInput = {
  title: string;
  excerpt?: string | null;
  content: string;
  featuredImage?: string | null;
  slug: string;
  seo: AutoFillSeoShape;
  contentType: ContentType;
  postKind?: PostKind;
  isCreate: boolean;
  primaryTagName?: string | null;
  categoryName?: string | null;
};

export type AutoFillResult = {
  seo: AutoFillSeoShape;
  filledFields: string[];
};

export {
  extractContentExcerpt,
  extractTitleKeywords,
  inferFocusKeyword,
  truncateNear,
};

function isEmpty(value: string | null | undefined) {
  return value == null || value.trim() === "";
}

function assignSchemaType(input: AutoFillInput): SeoSchemaTypeValue | undefined {
  if (!input.isCreate) return undefined;

  if (input.contentType === "event") return "EVENT";
  if (input.contentType === "promotion") return "ARTICLE";
  if (input.contentType === "post") {
    return input.postKind === "NEWS" ? "NEWS_ARTICLE" : "ARTICLE";
  }

  return "ARTICLE";
}

export function applyAutoSeoFields(input: AutoFillInput): AutoFillResult {
  const seo: AutoFillSeoShape = { ...input.seo };
  const filledFields: string[] = [];

  const title = input.title.trim();
  const excerpt = input.excerpt?.trim() ?? "";
  const featuredImage = input.featuredImage?.trim() ?? "";

  if (isEmpty(seo.seoTitle) && title) {
    seo.seoTitle = truncateNear(title, 60);
    filledFields.push("seoTitle");
  }

  if (isEmpty(seo.seoDescription)) {
    if (excerpt.length >= 70) {
      seo.seoDescription = truncateNear(excerpt, 160);
      filledFields.push("seoDescription");
    } else {
      const fromContent = extractContentExcerpt(input.content, 70, 160);
      if (fromContent) {
        seo.seoDescription = fromContent;
        filledFields.push("seoDescription");
      } else if (excerpt) {
        seo.seoDescription = excerpt;
        filledFields.push("seoDescription");
      }
    }
  }

  if (isEmpty(seo.focusKeyword)) {
    const focusKeyword = extractTopic({
      primaryTagName: input.primaryTagName,
      title: input.title,
      categoryName: input.categoryName,
    });
    if (focusKeyword) {
      seo.focusKeyword = focusKeyword;
      filledFields.push("focusKeyword");
    }
  }

  const seoTitle = seo.seoTitle?.trim() || title;
  const seoDescription = seo.seoDescription?.trim() || excerpt;

  if (isEmpty(seo.ogTitle) && seoTitle) {
    seo.ogTitle = seoTitle;
    filledFields.push("ogTitle");
  }

  if (isEmpty(seo.ogDescription) && seoDescription) {
    seo.ogDescription = seoDescription;
    filledFields.push("ogDescription");
  }

  if (isEmpty(seo.ogImage) && featuredImage) {
    seo.ogImage = featuredImage;
    filledFields.push("ogImage");
  }

  const ogTitle = seo.ogTitle?.trim() || seoTitle;
  const ogDescription = seo.ogDescription?.trim() || seoDescription;
  const ogImage = seo.ogImage?.trim() || featuredImage;

  if (isEmpty(seo.twitterTitle) && ogTitle) {
    seo.twitterTitle = ogTitle;
    filledFields.push("twitterTitle");
  }

  if (isEmpty(seo.twitterDescription) && ogDescription) {
    seo.twitterDescription = ogDescription;
    filledFields.push("twitterDescription");
  }

  if (isEmpty(seo.twitterImage) && ogImage) {
    seo.twitterImage = ogImage;
    filledFields.push("twitterImage");
  }

  if (input.isCreate) {
    const schemaType = assignSchemaType(input);
    if (schemaType) {
      seo.schemaType = schemaType;
      filledFields.push("schemaType");
    }
  }

  return { seo, filledFields };
}
