import type { AppRole } from "@/types";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

import { findModulePermissionForPathname } from "@/lib/admin-permissions";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";

const handleI18n = createMiddleware(routing);

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

    const permission = findModulePermissionForPathname(pathname);
    if (permission && !permission.roles.includes(req.auth.user.role as AppRole)) {
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
