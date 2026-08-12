import type { LucideIcon } from "lucide-react";

export type AppRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "MARKETING" | "VIEWER";

export type AdminModuleId =
  | "news"
  | "events"
  | "promotions"
  | "stores"
  | "branches"
  | "banners"
  | "gallery"
  | "media-library"
  | "about-the-paseo"
  | "brand-partners"
  | "contact-messages"
  | "leasing-inquiries"
  | "categories"
  | "post-categories"
  | "tags"
  | "seo"
  | "seo-settings"
  | "search"
  | "users"
  | "roles"
  | "settings"
  | "localization"
  | "recaptcha"
  | "audit-logs";

export type NavSectionId =
  | "website-content"
  | "stores-branches"
  | "media-visual"
  | "company-info"
  | "customer-inquiries"
  | "content-organization"
  | "marketing-seo"
  | "user-management"
  | "system-settings";

export type NavLinkId = AdminModuleId | "dashboard";

export interface NavLinkItem {
  id: NavLinkId;
  label: string;
  href: string;
  /** Additional path prefixes that should mark this link active. */
  activePaths?: string[];
  /** Path prefixes that should not mark this link active. */
  excludeActivePaths?: string[];
}

export type NavSectionExpandedState = Record<NavSectionId, boolean>;

export interface NavSection {
  id: NavSectionId;
  label: string;
  icon: LucideIcon;
  defaultExpanded?: boolean;
  items: NavLinkItem[];
}

export interface VisibleNavSection extends NavSection {
  items: NavLinkItem[];
}
