import type { AppRole } from "@/types";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";

const handleI18n = createMiddleware(routing);

// Routes only some roles may enter. Anything not listed here just needs to
// be authenticated (handled below). Keep this in sync with components/admin/sidebar.tsx.
const ROLE_RESTRICTED_PREFIXES: { prefix: string; roles: AppRole[] }[] = [
  { prefix: "/admin/posts", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { prefix: "/admin/categories", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { prefix: "/admin/branches", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { prefix: "/admin/stores", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { prefix: "/admin/events", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"] },
  { prefix: "/admin/promotions", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"] },
  { prefix: "/admin/brand-partners", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"] },
  { prefix: "/admin/gallery", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"] },
  { prefix: "/admin/users", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefix: "/admin/roles", roles: ["SUPER_ADMIN"] },
  { prefix: "/admin/settings", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefix: "/admin/recaptcha", roles: ["SUPER_ADMIN", "ADMIN"] },
  { prefix: "/admin/search", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"] },
  { prefix: "/admin/seo", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR"] },
  { prefix: "/admin/contact", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"] },
  { prefix: "/admin/leasing", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"] },
  { prefix: "/admin/media", roles: ["SUPER_ADMIN", "ADMIN", "EDITOR", "MARKETING"] },
];

function isNonLocalizedPath(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/rss.xml") ||
    pathname.startsWith("/sitemap") ||
    pathname === "/robots.txt"
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return Response.redirect(loginUrl);
    }

    const restriction = ROLE_RESTRICTED_PREFIXES.find((rule) => pathname.startsWith(rule.prefix));
    if (restriction && !restriction.roles.includes(req.auth.user.role)) {
      return Response.redirect(new URL("/admin/dashboard", req.nextUrl.origin));
    }

    return NextResponse.next();
  }

  if (isNonLocalizedPath(pathname)) {
    return NextResponse.next();
  }

  return handleI18n(req);
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
