import { getSettings } from "@/lib/settings";

export const SITE_BRANDING_KEYS = ["siteName", "siteLogo", "siteTagline"] as const;

export type SiteBrandingKey = (typeof SITE_BRANDING_KEYS)[number];

export type SiteBranding = Record<SiteBrandingKey, string>;

export const DEFAULT_SITE_BRANDING: SiteBranding = {
  siteName: "The Paseo",
  siteLogo: "",
  siteTagline: "ระบบจัดการเว็บไซต์",
};

export const SITE_BRANDING_UPDATED_EVENT = "paseo-site-branding-updated";

export async function getSiteBranding(): Promise<SiteBranding> {
  return getSettings(SITE_BRANDING_KEYS, DEFAULT_SITE_BRANDING);
}

export function getSiteBrandingInitial(siteName: string): string {
  const trimmed = siteName.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "P";
}
