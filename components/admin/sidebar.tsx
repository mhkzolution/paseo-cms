"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  Building2,
  CalendarDays,
  Tag,
  Store,
  MapPin,
  Images,
  Handshake,
  ImageIcon,
  FolderOpen,
  Globe2,
  Inbox,
  Layers,
  Search,
  Tags,
  Users,
  ShieldCheck,
  KeyRound,
  Settings,
  ChevronDown,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AppRole, NavItem } from "@/types";

const BANNER_ROLES: AppRole[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"];

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Posts", href: "/admin/posts", icon: Newspaper, roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  {
    label: "Events",
    href: "/admin/events",
    icon: CalendarDays,
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"],
  },
  {
    label: "Promotions",
    href: "/admin/promotions",
    icon: Tag,
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"],
  },
  { label: "Stores", href: "/admin/stores", icon: Store, roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { label: "Branches", href: "/admin/branches", icon: MapPin, roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  {
    label: "Banners",
    icon: ImageIcon,
    roles: BANNER_ROLES,
    children: [
      { label: "หน้าหลัก / สาขา", href: "/admin/banners/site", roles: BANNER_ROLES },
      { label: "About Us", href: "/admin/banners/about", roles: BANNER_ROLES },
    ],
  },
  {
    label: "Brand Partners",
    href: "/admin/brand-partners",
    icon: Handshake,
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"],
  },
  {
    label: "Gallery",
    href: "/admin/gallery",
    icon: Images,
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"],
  },
  {
    label: "Media Library",
    href: "/admin/media",
    icon: FolderOpen,
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"],
  },
  {
    label: "Search",
    href: "/admin/search",
    icon: Search,
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"],
  },
  {
    label: "SEO",
    href: "/admin/seo",
    icon: Globe2,
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  },
  {
    label: "reCAPTCHA",
    href: "/admin/recaptcha",
    icon: KeyRound,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    label: "Contact",
    href: "/admin/contact",
    icon: Inbox,
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"],
  },
  {
    label: "Leasing",
    href: "/admin/leasing",
    icon: Building2,
    roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"],
  },
  { label: "Categories", href: "/admin/categories", icon: Layers, roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { label: "Tags", href: "/admin/tags", icon: Tags, roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    label: "Roles",
    href: "/admin/roles",
    icon: ShieldCheck,
    roles: ["SUPER_ADMIN"],
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
];

function isItemVisible(item: NavItem | { roles?: AppRole[] }, role: AppRole | null) {
  return !item.roles || (role && item.roles.includes(role));
}

interface SidebarProps {
  role: AppRole | null;
  open: boolean;
  isMobile: boolean;
  onClose: () => void;
}

export function Sidebar({ role, open, isMobile, onClose }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) => isItemVisible(item, role));

  return (
    <aside
      id="admin-sidebar"
      aria-hidden={!open}
      className={cn(
        "flex h-screen w-60 shrink-0 flex-col border-r border-white/5 bg-sidebar text-sidebar-foreground transition-[transform,width,margin] duration-300 ease-in-out",
        "fixed inset-y-0 left-0 z-50 lg:static lg:z-auto",
        open ? "translate-x-0" : "-translate-x-full",
        !open && "lg:w-0 lg:translate-x-0 lg:overflow-hidden lg:border-0",
      )}
    >
      <div className="flex w-60 shrink-0 items-center justify-between gap-2 border-b border-white/5 px-5 py-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-paseo text-sm font-bold text-foreground">
            P
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-tight text-white">The Paseo</p>
            <p className="truncate text-[11px] text-paseo">Content Management</p>
          </div>
        </div>

        {isMobile ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/80 transition-colors hover:bg-paseo/10 hover:text-paseo"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <nav className="scrollbar-paseo-dark min-h-0 w-60 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleItems.map((item) => {
          if (item.children?.length) {
            const visibleChildren = item.children.filter((child) => isItemVisible(child, role));
            if (visibleChildren.length === 0) return null;

            const isGroupActive = visibleChildren.some((child) => pathname.startsWith(child.href));
            const Icon = item.icon;

            return (
              <div key={item.label}>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                    isGroupActive ? "text-paseo" : "text-sidebar-foreground/75",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 opacity-60 transition-transform", isGroupActive && "rotate-180")}
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-4 space-y-0.5 border-l border-paseo/25 pl-2">
                  {visibleChildren.map((child) => {
                    const isActive = pathname.startsWith(child.href);

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={isMobile ? onClose : undefined}
                        className={cn(
                          "block rounded-md px-3 py-1.5 text-sm transition-colors",
                          isActive
                            ? "bg-paseo font-medium text-foreground"
                            : "text-sidebar-foreground/65 hover:bg-paseo/10 hover:text-paseo",
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (!item.href) return null;

          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? onClose : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-paseo font-medium text-foreground"
                  : "text-sidebar-foreground/75 hover:bg-paseo/10 hover:text-paseo",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
