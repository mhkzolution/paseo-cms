import { prisma } from "@/lib/prisma";

export const INTRODUCTION_SETTINGS_KEYS = [
  "aboutLogo",
  "aboutDetail1",
  "aboutDetail2",
  "aboutDetail3",
  "aboutDetail4",
  "aboutMission",
  "aboutVision",
] as const;

export type IntroductionSettingsKey = (typeof INTRODUCTION_SETTINGS_KEYS)[number];

export const DEFAULT_INTRODUCTION_SETTINGS = {
  aboutLogo: "",
  aboutDetail1: "",
  aboutDetail2: "",
  aboutDetail3: "",
  aboutDetail4: "",
  aboutMission: "",
  aboutVision: "",
} satisfies SettingMap<IntroductionSettingsKey>;

export const SETTINGS_KEYS = [
  "siteName",
  "siteTagline",
  "siteUrl",
  "siteLogo",
  "favicon",
  "contactEmail",
  "contactPhone",
  "address",
  "businessHours",
  "facebookUrl",
  "instagramUrl",
  "tiktokUrl",
  "lineUrl",
  "aboutLogo",
  "aboutDetail1",
  "aboutDetail2",
  "aboutDetail3",
  "aboutDetail4",
  "aboutMission",
  "aboutVision",
] as const;

export const SEO_KEYS = [
  "metaTitle",
  "metaDescription",
  "ogImage",
  "twitterCard",
  "canonicalUrl",
  "jsonLd",
  "robots",
] as const;

export const RECAPTCHA_KEYS = ["recaptchaSiteKey", "recaptchaSecretKey"] as const;

export type SettingsKey = (typeof SETTINGS_KEYS)[number];
export type SeoKey = (typeof SEO_KEYS)[number];
export type RecaptchaKey = (typeof RECAPTCHA_KEYS)[number];
export type SettingKey = SettingsKey | SeoKey | RecaptchaKey;
export type SettingMap<K extends string = SettingKey> = Record<K, string>;
type WritableSettingMap = Record<string, string | null | undefined>;
type TwitterCard = "summary" | "summary_large_image";
type RobotsDirective = "index,follow" | "noindex,nofollow";

export interface SeoSettings extends SettingMap<SeoKey> {
  twitterCard: TwitterCard;
  robots: RobotsDirective;
}

export type RecaptchaSettings = SettingMap<RecaptchaKey>;

export const DEFAULT_SETTINGS = {
  siteName: "The Paseo",
  siteTagline: "ระบบจัดการเว็บไซต์",
  siteUrl: "https://thepaseo.co.th",
  siteLogo: "",
  favicon: "",
  contactEmail: "info@thepaseo.co.th",
  contactPhone: "",
  address: "",
  businessHours: "",
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  lineUrl: "",
  aboutLogo: "",
  aboutDetail1: "",
  aboutDetail2: "",
  aboutDetail3: "",
  aboutDetail4: "",
  aboutMission: "",
  aboutVision: "",
} satisfies SettingMap<SettingsKey>;

export const DEFAULT_SEO = {
  metaTitle: "The Paseo",
  metaDescription: "The Paseo corporate website, branches, stores, promotions, events, and news.",
  ogImage: "",
  twitterCard: "summary_large_image",
  canonicalUrl: "",
  jsonLd: "",
  robots: "index,follow",
} satisfies SeoSettings;

export const DEFAULT_RECAPTCHA = {
  recaptchaSiteKey: "",
  recaptchaSecretKey: "",
} satisfies RecaptchaSettings;

export async function getSettings<K extends SettingKey>(
  keys: readonly K[],
  defaults: SettingMap<K>,
): Promise<SettingMap<K>> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...keys] }, deletedAt: null },
    select: { key: true, value: true },
  });

  const values = { ...defaults };
  for (const row of rows) {
    if (keys.includes(row.key as K)) {
      values[row.key as K] = row.value;
    }
  }

  return values;
}

export async function saveSettings(values: Partial<WritableSettingMap>) {
  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: value ?? "" },
        update: { value: value ?? "", deletedAt: null },
      }),
    ),
  );
}

export async function getSeoSettings(): Promise<SeoSettings> {
  const seo = await getSettings(SEO_KEYS, DEFAULT_SEO);
  const twitterCard: TwitterCard = seo.twitterCard === "summary" ? "summary" : "summary_large_image";
  const robots: RobotsDirective = seo.robots === "noindex,nofollow" ? "noindex,nofollow" : "index,follow";

  return {
    ...seo,
    twitterCard,
    robots,
  };
}

export async function getRecaptchaSettings(): Promise<RecaptchaSettings> {
  return getSettings(RECAPTCHA_KEYS, DEFAULT_RECAPTCHA);
}
