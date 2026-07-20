import { z } from "zod";

import { isBangkokDateTimeInput, parseBangkokDateTime } from "@/lib/datetime";
import { stripHtml } from "@/lib/media";

const CONTENT_STATUS_VALUES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const CONTACT_STATUS_VALUES = ["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"] as const;
const POST_KIND_VALUES = ["NEWS", "PUBLIC_RELATIONS", "CENTER_UPDATE", "ARTICLE"] as const;
const PROMOTION_CATEGORY_VALUES = ["FOOD", "DRINKS_BAKERY", "MISC", "EDUCATION"] as const;
const SEO_SCHEMA_TYPE_VALUES = ["ARTICLE", "NEWS_ARTICLE", "BLOG_POSTING", "FAQ_PAGE", "EVENT", "CUSTOM"] as const;
const SEO_TWITTER_CARD_VALUES = ["SUMMARY", "SUMMARY_LARGE_IMAGE"] as const;
const SITEMAP_CHANGE_FREQUENCY_VALUES = [
  "ALWAYS",
  "HOURLY",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
  "NEVER",
] as const;

const requiredText = (fieldName: string) => z.string().trim().min(1, `${fieldName} is required`);
const requiredHtml = (fieldName: string) =>
  z.string().superRefine((value, context) => {
    if (!stripHtml(value)) {
      context.addIssue({ code: "custom", message: `${fieldName} is required` });
    }
  });
const emptyToNull = (value: unknown) => {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  return value;
};
const optionalText = z.preprocess(emptyToNull, z.string().nullable().optional());
const optionalId = z.preprocess(emptyToNull, z.string().nullable().optional());
const optionalStringArray = z.array(z.string().trim().min(1)).optional().default([]);
const optionalBoolean = z.preprocess((value) => value ?? false, z.boolean().default(false));
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T, defaultValue: T[number]) =>
  z.preprocess((value) => (value === "" || value == null ? undefined : value), z.enum(values).default(defaultValue));
const optionalInt = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((value, context) => {
    if (value === undefined || value === null || value === "") return null;

    const numberValue = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(numberValue)) {
      context.addIssue({ code: "custom", message: "Enter a valid whole number" });
      return z.NEVER;
    }

    return numberValue;
  });
const optionalBoundedFloat = (min: number, max: number) =>
  z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((value, context) => {
      if (value === undefined || value === null || value === "") return null;

      const numberValue = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(numberValue) || numberValue < min || numberValue > max) {
        context.addIssue({ code: "custom", message: `Enter a number from ${min} to ${max}` });
        return z.NEVER;
      }

      return numberValue;
    });
const optionalFloat = z
  .union([z.string(), z.number()])
  .optional()
  .transform((value, context) => {
    if (value === undefined || value === "") return null;

    const numberValue = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(numberValue)) {
      context.addIssue({ code: "custom", message: "Enter a valid number" });
      return z.NEVER;
    }

    return numberValue;
  });
const parseDateInput = (value: string) =>
  isBangkokDateTimeInput(value) ? parseBangkokDateTime(value) : new Date(value);

const optionalDate = z.preprocess(
  emptyToNull,
  z
    .string()
    .nullable()
    .optional()
    .transform((value) => (value ? parseDateInput(value) : null)),
);
const requiredDate = (fieldName: string) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .transform((value) => parseDateInput(value));

const postSeoSchema = z.object({
  seoTitle: optionalText,
  seoDescription: optionalText,
  keywords: optionalText,
  focusKeyword: optionalText,
  secondaryKeywords: optionalText,
  canonicalUrl: optionalText,
  ogTitle: optionalText,
  ogDescription: optionalText,
  ogImage: optionalText,
  twitterTitle: optionalText,
  twitterDescription: optionalText,
  twitterImage: optionalText,
  twitterCard: optionalEnum(SEO_TWITTER_CARD_VALUES, "SUMMARY_LARGE_IMAGE"),
  noindex: optionalBoolean,
  nofollow: optionalBoolean,
  noarchive: optionalBoolean,
  nosnippet: optionalBoolean,
  maxSnippet: optionalInt,
  maxImagePreview: optionalText,
  maxVideoPreview: optionalInt,
  schemaType: optionalEnum(SEO_SCHEMA_TYPE_VALUES, "ARTICLE"),
  customJsonLd: optionalText,
  includeInSitemap: z.preprocess((value) => value ?? true, z.boolean().default(true)),
  includeInNewsSitemap: optionalBoolean,
  includeInImageSitemap: z.preprocess((value) => value ?? true, z.boolean().default(true)),
  sitemapPriority: optionalBoundedFloat(0, 1),
  changeFrequency: z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.enum(SITEMAP_CHANGE_FREQUENCY_VALUES).nullable().optional(),
  ),
});

export const postSchema = z.object({
  categoryId: optionalId,
  branchIds: optionalStringArray,
  tagIds: optionalStringArray,
  newTags: optionalText,
  relatedPostIds: optionalStringArray,
  kind: z.enum(POST_KIND_VALUES).default("NEWS"),
  title: requiredText("Title"),
  slug: optionalText,
  h1: optionalText,
  excerpt: optionalText,
  subtitle: optionalText,
  content: requiredHtml("Content"),
  featuredImage: optionalText,
  coverImageAlt: optionalText,
  coverImageCaption: optionalText,
  bannerDesktop: optionalText,
  bannerMobile: optionalText,
  showOnHome: optionalBoolean,
  status: z.enum(CONTENT_STATUS_VALUES),
  publishedAt: optionalDate,
  reviewedAt: optionalDate,
  expiresAt: optionalDate,
  seo: z
    .union([postSeoSchema, z.null(), z.undefined()])
    .transform((value) => value ?? {})
    .pipe(postSeoSchema),
  alternates: z
    .array(
      z.object({
        locale: requiredText("Locale"),
        url: z.string().trim().url("Enter a valid alternate URL"),
      }),
    )
    .optional()
    .default([]),
  faqs: z
    .array(
      z.object({
        question: requiredText("FAQ question"),
        answer: requiredText("FAQ answer"),
      }),
    )
    .optional()
    .default([]),
  images: z
    .array(
      z.object({
        url: z.string().trim().min(1, "Image URL is required"),
        alt: optionalText,
        caption: optionalText,
      }),
    )
    .optional()
    .default([]),
});

export const categorySchema = z.object({
  name: requiredText("Name"),
  slug: requiredText("Slug"),
  image: optionalText,
  color: z.preprocess(
    emptyToNull,
    z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex value like #FF5733")
      .nullable()
      .optional(),
  ),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const tagSchema = z.object({
  name: requiredText("Name"),
  slug: optionalText,
  description: optionalText,
});

export const branchSchema = z.object({
  nameTh: requiredText("Thai name"),
  nameEn: requiredText("English name"),
  slug: requiredText("Slug"),
  image: optionalText,
  thumbnail: optionalText,
  shortDescription: optionalText,
  address: optionalText,
  phone: optionalText,
  leasingPhone1: optionalText,
  leasingPhone2: optionalText,
  mapsUrl: optionalText,
  latitude: optionalFloat,
  longitude: optionalFloat,
});

export const storeOperatingHourSchema = z.object({
  day: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
  isOpen: z.boolean(),
  openTime: z.string().trim().min(1, "ระบุเวลาเปิด"),
  closeTime: z.string().trim().min(1, "ระบุเวลาปิด"),
});

export const storeSchema = z.object({
  branchId: requiredText("สาขา"),
  categoryId: optionalId,
  nameTh: requiredText("ชื่อภาษาไทย"),
  nameEn: requiredText("ชื่อภาษาอังกฤษ"),
  slug: requiredText("Slug"),
  logo: optionalText,
  cover: optionalText,
  description: optionalText,
  phone1: optionalText,
  phone2: optionalText,
  zoneId: optionalId,
  locationId: optionalId,
  storeType: optionalText,
  operatingHours: z.array(storeOperatingHourSchema).default([]),
});

export const promotionSchema = z.object({
  branchIds: optionalStringArray,
  tagIds: optionalStringArray,
  newTags: optionalText,
  relatedPromotionIds: optionalStringArray,
  category: z.enum(PROMOTION_CATEGORY_VALUES).default("FOOD"),
  title: requiredText("Title"),
  slug: optionalText,
  h1: optionalText,
  excerpt: optionalText,
  subtitle: optionalText,
  content: requiredHtml("Content"),
  featuredImage: optionalText,
  coverImageAlt: optionalText,
  coverImageCaption: optionalText,
  showOnHome: optionalBoolean,
  status: z.enum(CONTENT_STATUS_VALUES),
  startDate: requiredDate("Start date"),
  endDate: requiredDate("End date"),
  publishedAt: optionalDate,
  reviewedAt: optionalDate,
  expiresAt: optionalDate,
  seo: z
    .union([postSeoSchema, z.null(), z.undefined()])
    .transform((value) => value ?? {})
    .pipe(postSeoSchema),
  alternates: z
    .array(
      z.object({
        locale: requiredText("Locale"),
        url: z.string().trim().url("Enter a valid alternate URL"),
      }),
    )
    .optional()
    .default([]),
  faqs: z
    .array(
      z.object({
        question: requiredText("FAQ question"),
        answer: requiredText("FAQ answer"),
      }),
    )
    .optional()
    .default([]),
});

export const eventSchema = z.object({
  branchIds: optionalStringArray,
  tagIds: optionalStringArray,
  newTags: optionalText,
  relatedEventIds: optionalStringArray,
  title: requiredText("Title"),
  slug: optionalText,
  h1: optionalText,
  excerpt: optionalText,
  subtitle: optionalText,
  content: requiredHtml("Content"),
  featuredImage: optionalText,
  coverImageAlt: optionalText,
  coverImageCaption: optionalText,
  showOnHome: optionalBoolean,
  status: z.enum(CONTENT_STATUS_VALUES),
  eventDate: requiredDate("Event date"),
  eventEndDate: optionalDate,
  location: optionalText,
  publishedAt: optionalDate,
  reviewedAt: optionalDate,
  expiresAt: optionalDate,
  seo: z
    .union([postSeoSchema, z.null(), z.undefined()])
    .transform((value) => value ?? {})
    .pipe(postSeoSchema),
  alternates: z
    .array(
      z.object({
        locale: requiredText("Locale"),
        url: z.string().trim().url("Enter a valid alternate URL"),
      }),
    )
    .optional()
    .default([]),
  faqs: z
    .array(
      z.object({
        question: requiredText("FAQ question"),
        answer: requiredText("FAQ answer"),
      }),
    )
    .optional()
    .default([]),
  images: z
    .array(
      z.object({
        url: z.string().trim().min(1, "Image URL is required"),
        alt: optionalText,
        caption: optionalText,
      }),
    )
    .optional()
    .default([]),
});

export const gallerySchema = z.object({
  album: requiredText("Album"),
  image: requiredText("Image"),
});

export const bannerSchema = z.object({
  title: requiredText("Title"),
  subtitle: optionalText,
  description: optionalText,
  image: requiredText("Image"),
  linkUrl: optionalText,
  linkLabel: optionalText,
  showOnHome: z.boolean(),
  showOnBranch1: z.boolean(),
  showOnBranch2: z.boolean(),
  showOnBranch3: z.boolean(),
  showOnAbout: z.boolean(),
  sortOrder: z.coerce.number().int().min(0, "Sort order must be 0 or greater"),
  isActive: z.boolean(),
});

export const brandPartnerSchema = z.object({
  name: requiredText("Name"),
  logo: requiredText("Logo"),
  linkUrl: optionalText,
  showOnHome: z.boolean(),
  showOnBranch1: z.boolean(),
  showOnBranch2: z.boolean(),
  showOnBranch3: z.boolean(),
  sortOrder: z.coerce.number().int().min(0, "Sort order must be 0 or greater"),
  isActive: z.boolean(),
});

export const searchSchema = z.object({
  q: z.string().trim().min(1, "Search query is required").max(100, "Search query is too long"),
});

export const contactSchema = z.object({
  name: requiredText("Name").max(120, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address").max(180, "Email is too long"),
  phone: optionalText,
  subject: requiredText("Subject").max(160, "Subject is too long"),
  message: requiredText("Message").max(5000, "Message is too long"),
});

export const leasingSchema = z.object({
  name: requiredText("ชื่อ").max(120, "ชื่อยาวเกินไป"),
  email: z.string().trim().email("กรุณากรอกอีเมลที่ถูกต้อง").max(180, "อีเมลยาวเกินไป"),
  phone: requiredText("เบอร์โทรศัพท์").max(40, "เบอร์โทรศัพท์ยาวเกินไป"),
  details: optionalText,
  branchId: requiredText("สาขา"),
  productCategory: requiredText("ประเภทสินค้า").max(160, "ประเภทสินค้ายาวเกินไป"),
  productDetails: requiredText("รายละเอียดสินค้า").max(5000, "รายละเอียดสินค้ายาวเกินไป"),
  recaptchaToken: z.string().trim().min(1, "กรุณายืนยัน reCAPTCHA"),
});

export const contactStatusSchema = z.object({
  status: z.enum(CONTACT_STATUS_VALUES),
});

export const settingsSchema = z.object({
  siteName: requiredText("Site name"),
  siteUrl: z.string().trim().url("Enter a valid site URL"),
  siteLogo: optionalText,
  favicon: optionalText,
  contactEmail: z.string().trim().email("Enter a valid contact email"),
  contactPhone: optionalText,
  address: optionalText,
  businessHours: optionalText,
  facebookUrl: optionalText,
  instagramUrl: optionalText,
  tiktokUrl: optionalText,
  lineUrl: optionalText,
  aboutLogo: optionalText,
  aboutDetail1: optionalText,
  aboutDetail2: optionalText,
  aboutDetail3: optionalText,
  aboutDetail4: optionalText,
  aboutMission: optionalText,
  aboutVision: optionalText,
});

export const seoSchema = z.object({
  metaTitle: requiredText("Meta title").max(70, "Meta title should be 70 characters or less"),
  metaDescription: requiredText("Meta description").max(
    170,
    "Meta description should be 170 characters or less",
  ),
  ogImage: optionalText,
  twitterCard: z.enum(["summary", "summary_large_image"]),
  canonicalUrl: optionalText,
  jsonLd: optionalText,
  robots: z.enum(["index,follow", "noindex,nofollow"]),
});

export const recaptchaSchema = z.object({
  recaptchaSiteKey: optionalText,
  recaptchaSecretKey: optionalText,
});

export const storeFloorSchema = z.object({
  branchId: requiredText("สาขา"),
  nameTh: requiredText("ชื่อภาษาไทย"),
  nameEn: optionalText,
  sortOrder: z.coerce.number().int().min(0).default(0),
  floorPlanImage: optionalText,
});

export const storeZoneSchema = z.object({
  floorId: requiredText("ชั้น"),
  nameTh: requiredText("ชื่อภาษาไทย"),
  nameEn: optionalText,
  sortOrder: z.coerce.number().int().min(0).default(0),
  floorPlanImage: optionalText,
});

export const storeLocationSchema = z.object({
  zoneId: requiredText("โซน"),
  nameTh: requiredText("ชื่อภาษาไทย"),
  nameEn: optionalText,
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type StoreFloorInput = z.infer<typeof storeFloorSchema>;
export type StoreZoneInput = z.infer<typeof storeZoneSchema>;
export type StoreLocationInput = z.infer<typeof storeLocationSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type BranchInput = z.infer<typeof branchSchema>;
export type StoreInput = z.infer<typeof storeSchema>;
export type PromotionInput = z.infer<typeof promotionSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type GalleryInput = z.infer<typeof gallerySchema>;
export type BannerInput = z.infer<typeof bannerSchema>;
export type BrandPartnerInput = z.infer<typeof brandPartnerSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type ContactStatusInput = z.infer<typeof contactStatusSchema>;
export type LeasingInput = z.infer<typeof leasingSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type SeoInput = z.infer<typeof seoSchema>;
export type RecaptchaInput = z.infer<typeof recaptchaSchema>;
export type SettingsFormValues = z.input<typeof settingsSchema>;
export type SeoFormValues = z.input<typeof seoSchema>;
export type RecaptchaFormValues = z.input<typeof recaptchaSchema>;
