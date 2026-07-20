import type { PromotionCategory } from "@prisma/client";

import type { BrandPartnerLogo } from "@/lib/brand-partners";
import type { BannerSlide } from "@/lib/banners";
import type { PostArchiveGroup } from "@/lib/post-archives";
import type { StoreOperatingHour } from "@/lib/stores/operating-hours";

export type BranchSlug = "mall" | "park" | "town";

export type BranchMood = "shopping" | "outdoor" | "community";

export type BranchSectionKey =
  | "hero"
  | "promotions"
  | "stores"
  | "events"
  | "news"
  | "map"
  | "gallery"
  | "loyalty";

export type BranchTheme = {
  primary: string;
  primaryForeground: string;
  background: string;
  accent: string;
  mood: BranchMood;
};

export type BranchConfig = {
  slug: BranchSlug;
  label: string;
  theme: BranchTheme;
  sections: BranchSectionKey[];
};

export type BranchRecord = {
  id: string;
  name: string;
  nameTh: string | null;
  nameEn: string | null;
  slug: string;
  image: string | null;
  thumbnail: string | null;
  shortDescription: string | null;
  address: string | null;
  phone: string | null;
  leasingPhone1: string | null;
  leasingPhone2: string | null;
  mapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type BranchStore = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  operatingHours: StoreOperatingHour[];
  category: { name: string; color: string | null } | null;
};

export type BranchEvent = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  coverImageAlt: string | null;
  eventDate: Date;
  eventEndDate: Date | null;
  location: string | null;
};

export type BranchPromotion = {
  id: string;
  title: string;
  slug: string;
  category: PromotionCategory;
  featuredImage: string | null;
  coverImageAlt: string | null;
  startDate: Date;
  endDate: Date;
};

export type BranchPageData = {
  branch: BranchRecord;
  banners: BannerSlide[];
  postArchives: PostArchiveGroup[];
  stores: BranchStore[];
  events: BranchEvent[];
  promotions: BranchPromotion[];
  brandPartners: BrandPartnerLogo[];
  theme: BranchTheme;
  sections: BranchSectionKey[];
};
