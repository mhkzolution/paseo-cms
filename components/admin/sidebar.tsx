"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DASHBOARD_NAV_ITEM,
  findActiveSectionId,
  getDefaultExpandedSections,
  getVisibleNavSections,
  isNavLinkActive,
  isNavLinkVisible,
} from "@/lib/admin-navigation";
import {
  getSiteBrandingInitial,
  SITE_BRANDING_UPDATED_EVENT,
  type SiteBranding,
} from "@/lib/site-branding";
import { cn } from "@/lib/utils";
import type { AppRole, NavSection, NavSectionExpandedState } from "@/types";

const SIDEBAR_SECTIONS_STORAGE_KEY = "paseo-admin-sidebar-sections";

function readStoredExpandedSections() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(SIDEBAR_SECTIONS_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Record<string, boolean>;
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

interface SidebarSectionProps {
  section: NavSection;
  expanded: boolean;
  pathname: string;
  isMobile: boolean;
  onToggle: (sectionId: NavSection["id"]) => void;
  onClose: () => void;
}

function SidebarSection({ section, expanded, pathname, isMobile, onToggle, onClose }: SidebarSectionProps) {
  const isSectionActive = section.items.some((item) => isNavLinkActive(pathname, item));
  const Icon = section.icon;

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => onToggle(section.id)}
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
          isSectionActive ? "text-paseo" : "text-sidebar-foreground/75 hover:bg-paseo/10 hover:text-paseo",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1">{section.label}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 opacity-60 transition-transform", expanded && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {expanded ? (
        <div className="ml-4 space-y-0.5 border-l border-paseo/25 pl-2">
          {section.items.map((item) => {
            const isActive = isNavLinkActive(pathname, item);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-paseo font-medium text-foreground"
                    : "text-sidebar-foreground/65 hover:bg-paseo/10 hover:text-paseo",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

interface SidebarBrandingProps {
  branding: SiteBranding;
}

function SidebarBranding({ branding }: SidebarBrandingProps) {
  const { siteName, siteLogo, siteTagline } = branding;

  return (
    <div className="w-full flex flex-row gap-2">
      {siteLogo ? (
        <span className="relative block h-9 w-9 max-w-[140px]">
          <Image
            src={siteLogo}
            alt={siteName}
            fill
            className="object-contain object-left"
            sizes="140px"
            priority
          />
        </span>
      ) : (
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-paseo text-sm font-bold text-foreground"
          aria-hidden="true"
        >
          {getSiteBrandingInitial(siteName)}
        </span>
      )}

      <div className="w-full">
        <p className="truncate text-base font-semibold leading-tight text-white">{siteName}</p>
        {siteTagline ? <p className="truncate text-[11px] text-paseo">{siteTagline}</p> : null}
      </div>
    </div>
  );
}

interface SidebarProps {
  role: AppRole | null;
  branding: SiteBranding;
  open: boolean;
  isMobile: boolean;
  onClose: () => void;
}

export function Sidebar({ role, branding: initialBranding, open, isMobile, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [branding, setBranding] = useState(initialBranding);
  const visibleSections = useMemo(() => getVisibleNavSections(role), [role]);
  const showDashboard = isNavLinkVisible(DASHBOARD_NAV_ITEM, role);

  const [expandedSections, setExpandedSections] = useState<NavSectionExpandedState>(() =>
    getDefaultExpandedSections(),
  );

  useEffect(() => {
    setBranding(initialBranding);
  }, [initialBranding]);

  useEffect(() => {
    const handleBrandingUpdate = (event: Event) => {
      const detail = (event as CustomEvent<SiteBranding>).detail;
      if (detail?.siteName) {
        setBranding(detail);
      }
    };

    window.addEventListener(SITE_BRANDING_UPDATED_EVENT, handleBrandingUpdate);
    return () => window.removeEventListener(SITE_BRANDING_UPDATED_EVENT, handleBrandingUpdate);
  }, []);

  useEffect(() => {
    const stored = readStoredExpandedSections();
    if (stored) {
      setExpandedSections((current) => ({ ...current, ...stored }));
    }
  }, []);

  useEffect(() => {
    const activeSectionId = findActiveSectionId(pathname, role);
    if (!activeSectionId) {
      return;
    }

    setExpandedSections((current) => {
      if (current[activeSectionId]) {
        return current;
      }

      return { ...current, [activeSectionId]: true };
    });
  }, [pathname, role]);

  const handleToggleSection = useCallback((sectionId: NavSection["id"]) => {
    setExpandedSections((current) => {
      const next: NavSectionExpandedState = {
        ...current,
        [sectionId]: !current[sectionId],
      };
      window.localStorage.setItem(SIDEBAR_SECTIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isDashboardActive = pathname.startsWith(DASHBOARD_NAV_ITEM.href);

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
      <div className="flex w-60 shrink-0 items-start justify-between gap-2 border-b border-white/5 px-5 py-5">
        <SidebarBranding branding={branding} />

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
        {showDashboard ? (
          <Link
            href={DASHBOARD_NAV_ITEM.href}
            onClick={isMobile ? onClose : undefined}
            className={cn(
              "mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              isDashboardActive
                ? "bg-paseo font-medium text-foreground"
                : "text-sidebar-foreground/75 hover:bg-paseo/10 hover:text-paseo",
            )}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
            {DASHBOARD_NAV_ITEM.label}
          </Link>
        ) : null}

        <div className="space-y-2">
          {visibleSections.map((section) => (
            <SidebarSection
              key={section.id}
              section={section}
              expanded={expandedSections[section.id] ?? section.defaultExpanded ?? true}
              pathname={pathname}
              isMobile={isMobile}
              onToggle={handleToggleSection}
              onClose={onClose}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
}
