"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { SITE_NAV_ITEMS } from "@/lib/navigation";
import type { StoreCategory } from "@/lib/stores";
import { cn } from "@/lib/utils";

import { SiteSearchPanel } from "@/features/search/site-search-panel";
import { SiteSocialIcons, type SiteSocialLinks } from "@/features/layout/site-social-icons";

export type SectionNavItem = {
  id: string;
  label: string;
};

type SiteHeaderProps = {
  activeHref?: string;
  siteLogo?: string;
  siteName?: string;
  storeCategories?: StoreCategory[];
  socialLinks?: SiteSocialLinks;
  /** When set, tier-2 nav scrolls to on-page sections instead of route links. */
  sectionNav?: readonly SectionNavItem[];
};

function ExploreIcon({ open }: { open: boolean }) {
  return (
    <span className="relative flex h-3.5 w-[18px] shrink-0 flex-col justify-between" aria-hidden="true">
      <span
        className={cn(
          "h-px w-full bg-current transition-all duration-200",
          open && "translate-y-[7px] rotate-45",
        )}
      />
      <span
        className={cn(
          "h-px w-full bg-current transition-all duration-200",
          open && "opacity-0",
        )}
      />
      <span
        className={cn(
          "h-px w-full bg-current transition-all duration-200",
          open && "-translate-y-[7px] -rotate-45",
        )}
      />
    </span>
  );
}

function LanguageSwitcher() {
  const t = useTranslations("language");
  const tCommon = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const query = searchParams.toString();
  const href = (query ? `${pathname}?${query}` : pathname) as "/" | (string & {});

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-paseo-dark"
        aria-label={tCommon("changeLanguage")}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {locale === "en" ? t("en") : t("th")}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open ? (
        <div
          className="absolute left-0 top-full z-[70] mt-2 min-w-[4.5rem] overflow-hidden rounded-md border border-black/10 bg-white py-1 shadow-lg"
          role="listbox"
          aria-label={tCommon("changeLanguage")}
        >
          {(["th", "en"] as const).map((nextLocale) => (
            <Link
              key={nextLocale}
              href={href}
              locale={nextLocale}
              role="option"
              aria-selected={locale === nextLocale}
              onClick={() => setOpen(false)}
              className={cn(
                "block px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/[0.04] hover:text-paseo-dark",
                locale === nextLocale ? "text-paseo-dark" : "text-foreground",
              )}
            >
              {t(nextLocale)}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ExploreMenuOverlay({
  open,
  onClose,
  currentHref,
  siteName,
  sectionNav,
  activeSectionId,
  onSectionSelect,
}: {
  open: boolean;
  onClose: () => void;
  currentHref: string;
  siteName: string;
  sectionNav?: readonly SectionNavItem[];
  activeSectionId?: string;
  onSectionSelect?: (id: string) => void;
}) {
  const t = useTranslations("common");
  const tNav = useTranslations("nav");

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
        aria-label={t("closeMenu")}
      />

      <div
        className="absolute left-0 right-0 top-full z-50 border-b border-black/8 bg-white shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-label={sectionNav ? t("homeMenu") : t("exploreSite", { siteName })}
      >
        <nav className="max-h-[min(70vh,640px)] overflow-y-auto" aria-label={t("mainMenu")}>
          <div className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            <ul className="flex flex-col border-t border-black/8">
              {sectionNav
                ? sectionNav.map((section) => {
                    const isActive = activeSectionId === section.id;

                    return (
                      <li key={section.id} className="border-b border-black/8">
                        <button
                          type="button"
                          onClick={() => onSectionSelect?.(section.id)}
                          className={cn(
                            "group flex w-full items-center justify-between px-1 py-4 text-left text-lg font-medium transition-colors sm:px-3 sm:py-5 sm:text-xl",
                            isActive
                              ? "text-paseo-dark"
                              : "text-foreground hover:text-paseo-dark",
                          )}
                        >
                          <span>{section.label}</span>
                          <span
                            className="text-muted opacity-0 transition-opacity group-hover:opacity-100"
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </button>
                      </li>
                    );
                  })
                : SITE_NAV_ITEMS.map((item) => {
                    const pathOnly = item.href.split("?")[0] ?? item.href;
                    const isActive =
                      currentHref === item.href ||
                      currentHref === pathOnly ||
                      currentHref.startsWith(`${pathOnly}/`);

                    return (
                      <li key={item.href} className="border-b border-black/8">
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "group flex items-center justify-between px-1 py-2 text-lg font-medium transition-colors sm:px-3 sm:py-5 sm:text-xl",
                            isActive
                              ? "text-paseo-dark"
                              : "text-foreground hover:text-paseo-dark",
                          )}
                        >
                          <span>{tNav(item.labelKey)}</span>
                          <span
                            className="text-muted opacity-0 transition-opacity group-hover:opacity-100"
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </Link>
                      </li>
                    );
                  })}
            </ul>
          </div>
        </nav>
      </div>
    </>
  );
}

export function SiteHeader({
  activeHref,
  siteLogo,
  siteName = "The Paseo",
  storeCategories = [],
  socialLinks = {},
  sectionNav,
}: SiteHeaderProps) {
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const currentHref = activeHref ?? pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(sectionNav?.[0]?.id ?? "");
  const scrollRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const updateActiveSection = useCallback(() => {
    if (!sectionNav?.length) return;

    const offset = 88;
    let current = sectionNav[0]?.id ?? "";

    for (const section of sectionNav) {
      const element = document.getElementById(section.id);
      if (!element) continue;
      const top = element.getBoundingClientRect().top;
      if (top - offset <= 0) current = section.id;
    }

    setActiveSectionId(current);
  }, [sectionNav]);

  useEffect(() => {
    if (!sectionNav?.length) return;

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [sectionNav, updateActiveSection]);

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: "smooth" });
    setActiveSectionId(id);
  }, []);

  const handleSectionSelect = useCallback(
    (id: string) => {
      scrollToSection(id);
      closeMenu();
    },
    [scrollToSection, closeMenu],
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  const toggleMenu = () => {
    setMenuOpen((open) => !open);
    setSearchOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50">
        <div className="relative z-20 border-b border-black/8 bg-white">
          <div className="relative z-[60] mx-auto grid w-full max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6 md:py-1 lg:px-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-5">
              <button
                type="button"
                onClick={toggleMenu}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2.5 text-sm font-medium text-foreground transition-colors hover:text-paseo-dark",
                  menuOpen && "text-paseo-dark",
                )}
                aria-label={t("exploreSite", { siteName })}
                aria-expanded={menuOpen}
              >
                <ExploreIcon open={menuOpen} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchOpen((open) => !open);
                  setMenuOpen(false);
                }}
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center text-foreground transition-colors hover:text-paseo-dark",
                  searchOpen && "text-paseo-dark",
                )}
                aria-label={t("search")}
                aria-expanded={searchOpen}
              >
                <Search className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>

              <Suspense
                fallback={
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground">
                    TH
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                }
              >
                <LanguageSwitcher />
              </Suspense>
            </div>

            {sectionNav ? (
              <button
                type="button"
                onClick={scrollToTop}
                className="justify-self-center"
                aria-label={`${siteName} home`}
              >
                {siteLogo ? (
                  <span className="relative block h-9 w-28 sm:h-11 sm:w-40">
                    <Image
                      src={siteLogo}
                      alt={siteName}
                      fill
                      className="object-contain"
                      sizes="160px"
                      priority
                    />
                  </span>
                ) : (
                  <span className="font-serif text-[1.15rem] font-normal tracking-[0.22em] text-foreground sm:text-[1.55rem]">
                    THE PASEO
                  </span>
                )}
              </button>
            ) : (
              <Link href="/" className="justify-self-center" aria-label={`${siteName} home`}>
                {siteLogo ? (
                  <span className="relative block h-9 w-28 sm:h-11 sm:w-40">
                    <Image
                      src={siteLogo}
                      alt={siteName}
                      fill
                      className="object-contain"
                      sizes="160px"
                      priority
                    />
                  </span>
                ) : (
                  <span className="font-serif text-[1.15rem] font-normal tracking-[0.22em] text-foreground sm:text-[1.55rem]">
                    THE PASEO
                  </span>
                )}
              </Link>
            )}

            <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-1">
              <SiteSocialIcons links={socialLinks} />
            </div>
          </div>

          <SiteSearchPanel
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            storeCategories={storeCategories}
          />

          <ExploreMenuOverlay
            open={menuOpen}
            onClose={closeMenu}
            currentHref={currentHref}
            siteName={siteName}
            sectionNav={sectionNav}
            activeSectionId={activeSectionId}
            onSectionSelect={sectionNav ? handleSectionSelect : undefined}
          />
        </div>

        <div
          className={cn(
            "absolute left-0 right-0 top-full z-10 bg-black/50 backdrop-blur-[1px]",
            (searchOpen || menuOpen) && "pointer-events-none invisible",
          )}
        >
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <nav
              ref={scrollRef}
              className="flex items-center justify-start gap-0 overflow-x-auto py-1 scrollbar-hidden md:justify-center"
              aria-label={sectionNav ? t("homeMenu") : t("categories")}
            >
              {sectionNav
                ? sectionNav.map((section) => {
                    const isActive = activeSectionId === section.id;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          "shrink-0 whitespace-nowrap px-3 py-1 text-[13px] font-medium text-white/80 transition-colors hover:text-white sm:px-4 sm:text-sm",
                          isActive && "text-white",
                        )}
                      >
                        {section.label}
                      </button>
                    );
                  })
                : SITE_NAV_ITEMS.map((item) => {
                    const pathOnly = item.href.split("?")[0] ?? item.href;
                    const isActive =
                      currentHref === item.href ||
                      currentHref === pathOnly ||
                      currentHref.startsWith(`${pathOnly}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "shrink-0 whitespace-nowrap px-3 py-1 text-[13px] font-medium text-white/80 transition-colors hover:text-white sm:px-4 sm:text-sm",
                          isActive && "text-white",
                        )}
                      >
                        {tNav(item.labelKey)}
                      </Link>
                    );
                  })}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
