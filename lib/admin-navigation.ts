import {
  Building2,
  FolderTree,
  Globe2,
  Images,
  Inbox,
  MapPinned,
  Newspaper,
  Settings,
  Users,
} from "lucide-react";

import { getModuleRoles } from "@/lib/admin-permissions";
import { assertValidAdminNavigationConfig } from "@/lib/admin-navigation-validation";
import type { AppRole, NavLinkItem, NavSection, NavSectionExpandedState, NavSectionId, VisibleNavSection } from "@/types";

function withRoles(item: NavLinkItem): NavLinkItem & { roles: readonly AppRole[] } {
  if (item.id === "dashboard") {
    return { ...item, roles: [] };
  }

  return { ...item, roles: getModuleRoles(item.id) };
}

export const DASHBOARD_NAV_ITEM: NavLinkItem = {
  id: "dashboard",
  label: "ภาพรวมระบบ",
  href: "/admin/dashboard",
};

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    id: "website-content",
    label: "จัดการเนื้อหา",
    icon: Newspaper,
    defaultExpanded: true,
    items: [
      { id: "news", label: "ข่าวสาร", href: "/admin/posts" },
      { id: "events", label: "กิจกรรม", href: "/admin/events" },
      { id: "promotions", label: "โปรโมชั่น", href: "/admin/promotions" },
    ],
  },
  {
    id: "stores-branches",
    label: "ร้านค้าและสาขา",
    icon: MapPinned,
    defaultExpanded: true,
    items: [
      { id: "stores", label: "ร้านค้า", href: "/admin/stores" },
      { id: "branches", label: "สาขา", href: "/admin/branches" },
    ],
  },
  {
    id: "media-visual",
    label: "สื่อและรูปภาพ",
    icon: Images,
    defaultExpanded: true,
    items: [
      {
        id: "banners",
        label: "แบนเนอร์",
        href: "/admin/banners/site",
        activePaths: ["/admin/banners"],
        excludeActivePaths: ["/admin/banners/about"],
      },
      { id: "gallery", label: "แกลเลอรี", href: "/admin/gallery" },
      { id: "media-library", label: "คลังสื่อ", href: "/admin/media" },
    ],
  },
  {
    id: "company-info",
    label: "ข้อมูลบริษัท",
    icon: Building2,
    defaultExpanded: true,
    items: [
      {
        id: "about-the-paseo",
        label: "เกี่ยวกับ The Paseo",
        href: "/admin/introduction",
        activePaths: ["/admin/banners/about"],
      },
      { id: "brand-partners", label: "พันธมิตรทางธุรกิจ", href: "/admin/brand-partners" },
    ],
  },
  {
    id: "customer-inquiries",
    label: "การติดต่อและสอบถาม",
    icon: Inbox,
    defaultExpanded: true,
    items: [
      { id: "contact-messages", label: "ข้อความติดต่อ", href: "/admin/contact" },
      { id: "leasing-inquiries", label: "ติดต่อเช่าพื้นที่", href: "/admin/leasing" },
    ],
  },
  {
    id: "content-organization",
    label: "หมวดหมู่ข้อมูล",
    icon: FolderTree,
    defaultExpanded: false,
    items: [
      { id: "categories", label: "หมวดหมู่ร้านค้า", href: "/admin/categories" },
      { id: "post-categories", label: "หมวดหมู่ข่าวสาร", href: "/admin/post-categories" },
      { id: "tags", label: "แท็ก", href: "/admin/tags" },
    ],
  },
  {
    id: "marketing-seo",
    label: "การตลาดและ SEO",
    icon: Globe2,
    defaultExpanded: true,
    items: [
      {
        id: "seo",
        label: "จัดการ SEO",
        href: "/admin/seo/workspace",
        activePaths: ["/admin/seo/workspace", "/admin/seo/issues"],
        excludeActivePaths: ["/admin/seo/settings"],
      },
    ],
  },
  {
    id: "user-management",
    label: "ผู้ใช้งานระบบ",
    icon: Users,
    defaultExpanded: false,
    items: [
      { id: "users", label: "ผู้ใช้งาน", href: "/admin/users" },
      { id: "roles", label: "สิทธิ์การใช้งาน", href: "/admin/roles" },
    ],
  },
  {
    id: "system-settings",
    label: "ตั้งค่าระบบ",
    icon: Settings,
    defaultExpanded: false,
    items: [
      { id: "settings", label: "ตั้งค่าทั่วไป", href: "/admin/settings", excludeActivePaths: ["/admin/settings/localization"] },
      { id: "localization", label: "ภาษาและรูปแบบ", href: "/admin/settings/localization" },
      { id: "recaptcha", label: "ระบบป้องกันสแปม", href: "/admin/recaptcha" },
      { id: "audit-logs", label: "Audit Logs", href: "/admin/audit-logs" },
    ],
  },
];

assertValidAdminNavigationConfig({ sections: ADMIN_NAV_SECTIONS });

type RoleRestrictedNavLink = NavLinkItem & { roles: readonly AppRole[] };

export function getNavLinkRoles(item: NavLinkItem): readonly AppRole[] {
  return withRoles(item).roles;
}

export function isNavLinkVisible(item: NavLinkItem, role: AppRole | null) {
  const roles = getNavLinkRoles(item);
  if (roles.length === 0) {
    return true;
  }

  return role !== null && roles.includes(role);
}

export function isNavLinkActive(pathname: string, item: NavLinkItem) {
  if (item.excludeActivePaths?.some((path) => pathname.startsWith(path))) {
    return false;
  }

  if (pathname.startsWith(item.href)) {
    return true;
  }

  return item.activePaths?.some((path) => pathname.startsWith(path)) ?? false;
}

export function getDefaultExpandedSections(): NavSectionExpandedState {
  const expanded = {} as NavSectionExpandedState;

  for (const section of ADMIN_NAV_SECTIONS) {
    expanded[section.id] = section.defaultExpanded ?? true;
  }

  return expanded;
}

export function getVisibleNavSections(role: AppRole | null): VisibleNavSection[] {
  return ADMIN_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => isNavLinkVisible(item, role)),
  })).filter((section) => section.items.length > 0);
}

export function findActiveSectionId(pathname: string, role: AppRole | null): NavSectionId | null {
  for (const section of getVisibleNavSections(role)) {
    if (section.items.some((item) => isNavLinkActive(pathname, item))) {
      return section.id;
    }
  }

  return null;
}
