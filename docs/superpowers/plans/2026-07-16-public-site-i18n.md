# Public Site i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) or subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Thai/English UI i18n on the public site with `/en` prefix, working language switcher, and localized `nameTh`/`nameEn` fields.

**Architecture:** `next-intl` with `localePrefix: 'as-needed'` (`th` default unprefixed, `en` under `/en`). Public routes under `app/[locale]/`. Compose i18n into existing `proxy.ts` auth handler. Admin/API unchanged.

**Tech Stack:** Next.js 16 App Router, next-intl v4, existing Prisma bilingual name fields

## Global Constraints

- Locales: `th` (default), `en`
- URL: `/path` = Thai, `/en/path` = English (`localePrefix: 'as-needed'`)
- `localeDetection: false` (no Accept-Language redirect surprises)
- Out of scope: admin UI, API, full CMS body translation
- Prefer `@/i18n/navigation` Link on public site; keep `next/link` in admin

---

### Task 1: Install next-intl + i18n config + messages

**Files:**
- Create: `i18n/routing.ts`, `i18n/navigation.ts`, `i18n/request.ts`
- Create: `messages/th.json`, `messages/en.json`
- Modify: `next.config.ts`
- Test: `tests/i18n-localized-name.test.ts` (added in Task 5; skip here)

- [ ] **Step 1: Install dependency**

```bash
cd paseo-cms && npm install next-intl
```

- [ ] **Step 2: Create routing + navigation + request config**

`i18n/routing.ts`:
```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["th", "en"],
  defaultLocale: "th",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
```

`i18n/navigation.ts`:
```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

`i18n/request.ts`:
```ts
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 3: Create initial message catalogs** covering `common`, `nav`, `footer`, `language` (full JSON in implementation)

- [ ] **Step 4: Wrap next.config with createNextIntlPlugin**

```ts
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
export default withNextIntl(nextConfig);
```

- [ ] **Step 5: Verify install**

Run: `npm ls next-intl`
Expected: next-intl listed without errors

---

### Task 2: Move public routes under `[locale]` + compose proxy

**Files:**
- Move: `app/page.tsx` → `app/[locale]/page.tsx`
- Move: `app/(site)/**` → `app/[locale]/(site)/**`
- Move: `app/loading.tsx` → `app/[locale]/loading.tsx` if present
- Create: `app/[locale]/layout.tsx`
- Modify: `app/layout.tsx` (html lang via getLocale)
- Modify: `proxy.ts` (intl + admin auth)

- [ ] **Step 1: Create `app/[locale]/layout.tsx`** with hasLocale check, setRequestLocale, NextIntlClientProvider, generateStaticParams

- [ ] **Step 2: Move home + (site) routes under `[locale]`** via `git mv` / `mv`

- [ ] **Step 3: Update root `app/layout.tsx`** to set `<html lang={locale}>` using `getLocale()` with try/fallback `th` for non-localized routes (admin)

- [ ] **Step 4: Compose `proxy.ts`** — admin auth first; otherwise `createMiddleware(routing)`. Matcher excludes `api|_next|_vercel|.*\\..*`

- [ ] **Step 5: Smoke check**

Run: `npm run typecheck`
Expected: no locale/routing type errors (or fix until clean)

---

### Task 3: Language switcher + shell translations

**Files:**
- Modify: `features/layout/site-header.tsx`
- Modify: `lib/navigation.ts` (hrefs only; labels from messages)
- Modify: `features/layout/site-footer.tsx`
- Modify: `features/search/site-search-panel.tsx` (labels)
- Modify: public Link imports to `@/i18n/navigation` where needed

- [ ] **Step 1: Implement language dropdown** on header TH button — links to same pathname other locale via next-intl `usePathname` + `Link` with `locale` prop

- [ ] **Step 2: Replace hardcoded nav/header/footer/search strings** with `useTranslations` / `getTranslations`

- [ ] **Step 3: Update `SITE_NAV_ITEMS`** to export href keys; resolve labels via `t('nav.*')`

- [ ] **Step 4: Manual verify** `/` and `/en` show correct nav; switcher preserves path

---

### Task 4: Static + listing chrome messages

**Files:**
- Expand: `messages/th.json`, `messages/en.json`
- Modify: about, leasing, location, home sections, listing page chrome components as needed

- [ ] **Step 1: Add message keys** for about/leasing/location/home chrome and list empty states/CTAs

- [ ] **Step 2: Wire `getTranslations` / `useTranslations`** in those components

- [ ] **Step 3: Leave long legal body HTML in original language**; translate titles/chrome only

---

### Task 5: Localized name helper

**Files:**
- Create: `lib/i18n/localized-name.ts`
- Create: `tests/i18n-localized-name.test.ts`
- Modify: branch/store/footer/about consumers to use helper with current locale

- [ ] **Step 1: Write failing tests** for EN/TH fallbacks

- [ ] **Step 2: Implement `getLocalizedName(entity, locale)`**

- [ ] **Step 3: Wire into footer, about, branch pages, store listings

- [ ] **Step 4: Run** `npm test` — expected pass for new tests

---

### Task 6: SEO alternates + final verify

**Files:**
- Modify: key `generateMetadata` on public pages (or shared helper) to emit `alternates.languages` for `th`/`en`
- Modify: sitemap if needed to include `/en` URLs (optional stretch)

- [ ] **Step 1: Add hreflang alternates** helper using `getPathname` / site URL

- [ ] **Step 2: Run `npm run validate` (or lint + typecheck + test)

- [ ] **Step 3: Manual checklist — `/about` ↔ `/en/about`, `/admin` unaffected, bilingual branch names on `/en`

---

## Spec coverage

| Spec item | Task |
|-----------|------|
| next-intl + as-needed URLs | 1–2 |
| Language switcher | 3 |
| Message catalogs / UI migrate | 3–4 |
| nameTh/nameEn | 5 |
| Admin/API untouched | 2 (matcher/exclusions) |
| hreflang | 6 |
| Fallbacks | 1 (messages), 5 (names) |
