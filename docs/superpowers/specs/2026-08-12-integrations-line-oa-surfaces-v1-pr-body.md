# PR — Integrations LINE OA Surfaces V1

**Base:** `feat/seo-completion-v1`  
**Head:** `feat/integrations-foundation-v1`

**Title:**

```txt
feat(integrations): add LINE OA floating CTA and footer link
```

**Body:**

## Summary

When Integrations `lineOaId` is set, the public site shows a floating LINE CTA and a footer Official Account link. No new CMS fields.

### Behavior

| `lineOaId` | Public site |
|------------|-------------|
| Empty / whitespace | no floating, no footer OA link |
| `@thepaseo` (or `thepaseo`) | both surfaces → `https://line.me/R/ti/p/@thepaseo` |
| Admin (`/admin/**`) | never shows floating |

### Architecture

```txt
resolveLineOaUrl(lineOaId)     pure helper (single source of truth)
LineOaSurfaces                 fail-soft → LineFloatingButton
SiteFooter                     extends getSettings with lineOaId → LineFooterLink
```

Mounted floating on `app/[locale]/layout.tsx` (homepage + all locale routes).  
Footer does **not** call `getIntegrationSettings()`.

### Included

- `resolveLineOaUrl` + unit tests (identifier-only; no URL parsing)
- Floating CTA: fixed bottom-right, all viewports, `FaLine`, `z-40`, a11y label
- Footer link in Follow Us section
- i18n `th` / `en`
- Static wiring tests (locale layout only; footer no duplicate fetch)

### Out of scope

- New toggles / `lineOaUrl` field
- Merge with General Settings `lineUrl`
- Hiding social LINE icon when `lineOaId` is set (intentional V1 dual-render; see P3 Footer UX Refinement)
- Contact page block / click analytics / Consent

### Known follow-up (P3)

Footer may show both social `lineUrl` and Integrations LINE OA link. Deferred to **Footer UX Refinement** (prefer long-term Contact vs Social IA split). Not a V1 blocker.

## Test plan

### Automated

- [x] `node --import tsx --test tests/resolve-line-oa.test.ts`
- [x] `node --import tsx --test tests/line-oa-surfaces-wiring.test.ts`
- [x] eslint on touched files (clean)

### Manual smoke

- [ ] Empty `lineOaId` → no floating + no footer OA link
- [ ] `@thepaseo` → floating visible
- [ ] `@thepaseo` → footer link visible
- [ ] href = `https://line.me/R/ti/p/@thepaseo`
- [ ] Homepage `/` has floating
- [ ] Inner page (`/about` or equivalent) has floating
- [ ] Admin has no floating
- [ ] No new console errors

## Spec / plan

- `docs/superpowers/specs/2026-08-12-integrations-line-oa-surfaces-v1-design.md`
- `docs/superpowers/plans/2026-08-12-integrations-line-oa-surfaces-v1.md`

## Commits

- `556ddb5` / `251a4f6` docs: design + plan
- `0052773` resolveLineOaUrl
- `63b29c7` floating + footer components + i18n
- `d3b0cfc` LineOaSurfaces + locale layout
- `21ed0b6` SiteFooter wiring (no duplicate fetch)
