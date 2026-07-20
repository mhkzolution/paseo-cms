# Public Site i18n Design

**Date:** 2026-07-16  
**Status:** Approved for implementation  
**Scope:** Public website UI (Thai ↔ English)

## Goal

Add bilingual UI for the public The Paseo site so visitors can switch between Thai and English. Wire up the existing header language control. Use URL-based locales. Reuse existing CMS bilingual fields (`nameTh` / `nameEn`) where available.

## Decisions

| Topic | Choice |
|-------|--------|
| Languages | `th` (default), `en` |
| URL strategy | Locale prefix with `as-needed`: `/about` = Thai, `/en/about` = English |
| Library | `next-intl` |
| Phase 1 content | UI chrome + static page copy + localized name fields |
| Admin / API | Out of scope — no locale prefix |
| CMS body content (news, events, promotions) | Out of scope for full bilingual bodies; show original language |

## Approach: next-intl

Use `next-intl` with App Router integration:

1. Message catalogs at `messages/th.json` and `messages/en.json`
2. Middleware resolves locale from the path
3. Public site routes live under a `[locale]` segment (or equivalent next-intl routing config)
4. Components call `useTranslations` / `getTranslations` instead of hardcoded Thai strings
5. Header language switcher navigates to the same path in the other locale

### Why not alternatives

- **Hand-rolled dictionaries + middleware:** more control, but must reimplement routing, Link, hreflang, and SSR wiring that next-intl already provides.
- **react-i18next:** stronger SPA tooling, weaker fit for Next.js App Router SSR/routing.

## Architecture

```
Browser
  └─ /en/about  or  /about
       └─ middleware (next-intl)
            ├─ skip: /admin, /api, static assets
            └─ set locale → [locale] layout
                 ├─ load messages/{locale}.json
                 ├─ set <html lang={locale}>
                 └─ site shell (header / footer / pages)
                      ├─ t('nav.*'), t('common.*'), …
                      └─ getLocalizedName(entity, locale) for nameTh/nameEn
```

### Key files (expected)

| Area | Location |
|------|----------|
| Routing config | `i18n/routing.ts` (or project-conventional path) |
| Request config | `i18n/request.ts` |
| Middleware | next-intl request handler wired through existing Next 16 `proxy.ts` (or `middleware.ts` if required by the library version) |
| Messages | `messages/th.json`, `messages/en.json` |
| Localized name helper | `lib/i18n/localized-name.ts` (or extend `lib/branches/branch-names.ts`) |
| Language switcher | `features/layout/` (header) |

Exact filenames may follow next-intl’s current Next.js 16 docs at implementation time.

## Routing & SEO

- Default locale: `th` — **no** `/th` prefix
- English: `/en/...` for all public site pages currently under `app/(site)/`
- Preserve query strings on language switch (e.g. `/stores?branch=park` ↔ `/en/stores?branch=park`)
- Unknown locale segment that looks like a locale → redirect to Thai path
- Emit `hreflang` / `alternates.languages` for `th` and `en` on public pages
- Update `html[lang]` to match active locale

## Language switcher

- Activate the existing header **TH** control as a dropdown: **TH** | **EN**
- Selecting a language links to the equivalent path in the other locale
- Use next-intl navigation helpers (`Link`, `usePathname`, `useRouter`) so prefixes stay correct
- Reflect current locale in the control label (TH / EN)

## Localized CMS fields

Entities that already store `nameTh` / `nameEn` (branches, store categories, stores, floors as applicable):

```
getLocalizedName(entity, locale):
  if locale === 'en': return nameEn?.trim() || nameTh?.trim() || name?.trim() || ''
  else:               return nameTh?.trim() || name?.trim() || nameEn?.trim() || ''
```

UI chrome and labels still come from message catalogs; only these name fields switch from DB data.

## Message organization

Namespaces (illustrative — may be split further during implementation):

- `common` — search, close, loading, empty states
- `nav` — main navigation and explore menu
- `footer` — footer links and labels
- `about`, `leasing`, `location`, `legal` — static page copy
- `branches`, `stores`, `news`, `events`, `promotions` — listing/page chrome (filters, CTAs, section titles)

Hardcoded Thai/English strings in public UI components move into these catalogs incrementally.

## Migration phases

1. **Infrastructure** — install next-intl; routing; middleware; empty/minimal message files; `[locale]` layout; `html lang`
2. **Shell** — header, footer, nav, search panel, language switcher
3. **Static pages** — about, leasing, location, terms, privacy, branch page chrome
4. **Listing chrome** — news / events / promotions / stores list & detail chrome (not CMS body HTML)
5. **Localized names** — wire `getLocalizedName` wherever branch/store/category names render on the public site

Each phase should leave the site buildable and browsable in both locales.

## Fallback & errors

| Case | Behavior |
|------|----------|
| Missing EN message key | Fall back to Thai message (or show key in development) |
| Missing `nameEn` | Fall back to `nameTh`, then `name` |
| CMS body without English | Show original body; do not hide the page |
| Request under `/admin` or `/api` | No locale middleware rewrite |
| Invalid locale in URL | Redirect to Thai equivalent path |

## Out of scope

- Admin CMS UI translation
- Full bilingual CMS bodies for posts / events / promotions (separate content rows or fields)
- Additional locales beyond `th` / `en`
- Auto-translation services
- Changing stored content language in the database for this phase

## Testing

- Unit: `getLocalizedName` fallbacks; locale path helpers if custom
- Manual: switch TH ↔ EN on home, about, branches, stores, news list; confirm URL, `lang`, nav labels, and bilingual names
- Regression: `/admin` and `/api` still work without `/en` prefix; Thai URLs without prefix still resolve

## Success criteria

1. Public visitor can switch Thai ↔ English from the header
2. English pages live under `/en/...`; Thai pages keep unprefixed URLs
3. Nav, footer, and migrated static UI strings follow the selected locale
4. Branch/store names with `nameEn` show English when locale is `en`
5. Admin and API routes are unaffected
