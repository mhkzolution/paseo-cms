# Integrations LINE OA Surfaces V1 Design

**Date:** 2026-08-12  
**Status:** Final Spec — approved for implementation plan (polish notes locked 2026-08-12)  

**Depends on:** Integrations Foundation + Admin UI V1 (`lineOaId`, `getIntegrationSettings()`, admin at `/admin/settings/integrations`)  
**Scope:** Public LINE Official Account surfaces driven by stored `lineOaId` — Floating CTA + Footer link

**Related:** Integrations Runtime V1 (tracking scripts). LINE surfaces are a separate runtime concern but share the same CMS → helper → public execution pattern and the same public locale mount boundary.

## Goal

When admins configure a LINE OA ID in Integrations, the **public website** shows discoverable ways to open that Official Account — without new CMS fields, without admin pollution, and without merging with General Settings `lineUrl`.

## Architecture

**Approach 1 — Orchestrator + surface components**

```txt
app/[locale]/layout.tsx
  ↓
<LineOaSurfaces />                     (Server Component — floating only)
  ↓
getIntegrationSettings()               (try/catch → null / render nothing)
  ↓
resolveLineOaUrl(lineOaId)             (pure — single source of truth)
  ↓
<LineFloatingButton href={url} />

SiteFooter (and homepage via same footer)
  ↓
existing getSettings(...) load + include lineOaId   (prefer — avoid 2nd integrations fetch)
  ↓
resolveLineOaUrl(lineOaId)
  ↓
<LineFooterLink href={url} />          (only when url !== null)
```

`resolveLineOaUrl` is the **only** place that turns a raw OA id into a LINE deep link. Floating, Footer, and any future LINE click tracking / diagnostics must call this helper.

## Decisions

| Topic | Choice |
|-------|--------|
| Surfaces | **Both:** Floating CTA + Footer link |
| Source field | Existing `lineOaId` only — no new keys / toggles / migrations |
| URL strategy | Build `https://line.me/R/ti/p/@<id>` from normalized OA id |
| Visibility | Auto: empty / whitespace → hide all; set → show both surfaces |
| Floating behavior | Fixed bottom-right, **all viewports**, `target="_blank"`, `rel="noopener noreferrer"` |
| Mount (floating) | `app/[locale]/layout.tsx` only (covers homepage + `(site)/*`) |
| Mount (footer) | Inside `SiteFooter` (used by `(site)/layout` and homepage) |
| Fail-soft | Settings load failure → render nothing; never crash the page |
| `lineUrl` (General Settings) | **Out of scope** — keep separate social-icon URL |
| Admin | Never show LINE OA surfaces |

## Non-Goals

```txt
No new Integrations fields (lineOaUrl, enableLineOaSurface, per-surface toggles)
No merge/migration with General Settings lineUrl
No lin.ee / custom short-link field in V1
No Contact-page-specific LINE block (future)
No LINE click analytics / dataLayer events (Custom Events epic)
No Consent / PDPA gating for LINE surfaces
No WhatsApp / Messenger / Telegram surfaces
No admin diagnostics UI for LINE
No mounting in app/layout.tsx or app/admin/**
No mounting floating only in (site)/layout.tsx (homepage bypasses it)
```

---

## 1. Resolution Rules

### Function

```ts
resolveLineOaUrl(raw: string | null | undefined): string | null
```

### Normalization

1. Trim leading/trailing whitespace.
2. Remove internal whitespace (defensive).
3. If empty → `null`.
4. If missing leading `@`, prepend `@`.
5. Return `https://line.me/R/ti/p/` + normalized id (id already includes `@`).

**V1 expects an OA identifier, not a URL.**  
If a full LINE URL is pasted (e.g. `https://line.me/R/ti/p/@thepaseo` or `line.me/R/ti/p/@thepaseo`), treat the **entire** string as an opaque identifier — **do not** parse or strip URL prefixes. (Admin should enter `@thepaseo` / `thepaseo` only.)

### Examples

| Input | Output |
|-------|--------|
| `""` / `"   "` / `null` / `undefined` | `null` |
| `@thepaseo` | `https://line.me/R/ti/p/@thepaseo` |
| `thepaseo` | `https://line.me/R/ti/p/@thepaseo` |
| ` @thepaseo ` | `https://line.me/R/ti/p/@thepaseo` |
| `https://line.me/R/ti/p/@thepaseo` (misconfigured) | `https://line.me/R/ti/p/@https://line.me/R/ti/p/@thepaseo` — **not supported**; no URL parsing in V1 |

### Visibility (derived)

```txt
resolveLineOaUrl(...) === null  →  Floating hidden, Footer link hidden
resolveLineOaUrl(...) === url   →  Floating + Footer link both use that url
```

No separate enable flags in V1.

---

## 2. Components

### `resolve-line-oa.ts`

- Pure module under `components/integrations/` (or `lib/` if preferred in plan — prefer colocation with other integration runtime helpers).
- No I/O. Unit-tested exhaustively.

### `LineFloatingButton`

- Presentational link styled as floating CTA.
- Props: non-null `href: string` (and optional label from i18n).
- Fixed bottom-right on all viewports.
- `target="_blank"` + `rel="noopener noreferrer"`.
- **Icon:** Prefer the same LINE icon already used by site social icons (`FaLine` from `react-icons/fa` via `SiteSocialIcons`) — do not introduce a second SVG/asset set.
- **Accessibility:** meaningful accessible name via i18n (e.g. `aria-label` / visually supported text) such as “Contact us on LINE” — not icon-only without a name.
- **z-index:** above normal page content (e.g. footer `z-20`); below modal/dialog overlays (site modals commonly use `z-50`). Prefer something like `z-40` unless an existing token fits better — do not cover dialogs.

### `LineFooterLink`

- Presentational link for footer contact / social-adjacent area.
- Same `href` semantics; open in new tab with `noopener noreferrer`.
- Prefer the same LINE icon source as floating / social icons when an icon is shown.
- Label via i18n (not hardcoded English-only in component body if the site already uses next-intl in footer).

### `LineOaSurfaces`

- Async Server Component.
- **Owns** the dedicated `getIntegrationSettings()` fetch for the floating surface.
- Fail-soft:

```ts
export async function LineOaSurfaces() {
  let settings;
  try {
    settings = await getIntegrationSettings();
  } catch {
    return null;
  }
  const href = resolveLineOaUrl(settings.lineOaId);
  if (!href) return null;
  return <LineFloatingButton href={href} />;
}
```

### Footer data guidance

Footer does **not** go through `LineOaSurfaces`; it resolves with the same `resolveLineOaUrl` helper.

**Prefer:** extend the footer's existing settings load (today: `getSettings(SETTINGS_KEYS, …)`) to also request `lineOaId` in that same call — one settings read, no second integrations round-trip solely for the footer.

**Avoid:** introducing a standalone `getIntegrationSettings()` call inside `SiteFooter` only to render the LINE OA link.

`resolveLineOaUrl` remains the URL source of truth regardless of how the raw `lineOaId` string is loaded.

---

## 3. Layout wiring

```txt
app/[locale]/layout.tsx
  <NextIntlClientProvider>
    <TrackingScripts />          (existing Runtime V1)
    <LineOaSurfaces />           (floating)
    {children}
  </NextIntlClientProvider>
```

```txt
SiteFooter
  … existing content …
  {lineOaHref ? <LineFooterLink href={lineOaHref} /> : null}
```

```txt
Public locale routes (/, /about, /news, …) → floating + footer when configured
/admin/** → never
/login (outside [locale]) → never
```

Do **not** place LINE floating in `app/layout.tsx` or `app/admin/layout.tsx`.  
Do **not** mount floating only under `(site)/layout.tsx`.

---

## 4. Separation from General Settings `lineUrl`

| Field | Location | Purpose |
|-------|----------|---------|
| `lineOaId` | Integrations | Official Account id → deterministic `line.me/R/ti/p/@…` surfaces |
| `lineUrl` | General / social | Free-form URL for existing social icon strip |

V1 does not unify, replace, or hide `lineUrl` based on `lineOaId`. Both may appear if both are configured.

---

## 5. Tests

### Required

1. **`resolveLineOaUrl` unit tests** — empty/whitespace → `null`; bare id and `@id` → same URL; trim; leading `@` ensured; exact URL prefix `https://line.me/R/ti/p/`. Document that pasted full LINE URLs are **not** special-cased (identifier-only contract).
2. **Layout wiring (static)** — `app/[locale]/layout.tsx` imports / renders `LineOaSurfaces`; `app/layout.tsx` and `app/admin/layout.tsx` do not.
3. **Fail-soft source assert** — `LineOaSurfaces` wraps settings load in `try/catch`.

### Recommended

4. Footer wiring source assert — `SiteFooter` references `resolveLineOaUrl` or `LineFooterLink`.

### Not required

- Browser E2E against LINE app / QR
- Visual regression of button styling
- Merging behavior with `lineUrl`

### Success criteria

```txt
Empty lineOaId → no floating, no footer OA link
Configured @thepaseo → both surfaces → https://line.me/R/ti/p/@thepaseo
Homepage (/) shows floating when configured
Admin → no floating
Settings fetch failure → page still renders; no LINE surfaces
```

---

## 6. Implementation order

1. `resolve-line-oa.ts` + unit tests (TDD)
2. `LineFloatingButton` + `LineFooterLink` presentational components
3. `LineOaSurfaces` orchestrator (fail-soft)
4. Wire floating into `app/[locale]/layout.tsx`
5. Wire footer link into `SiteFooter`
6. Static wiring tests + manual smoke (homepage, inner page, admin, empty vs set)

## 7. Branch / PR

- Branch from current integrations / seo-completion line after Runtime V1 merge
- Title suggestion: `feat(integrations): add LINE OA floating CTA and footer link`

## 8. Follow-ups

```txt
Contact page LINE block
LINE click → GA4 / Meta / dataLayer events
Consent-aware display (if marketing surfaces need gating)
lin.ee / custom URL override field (only if product requires)
Unify or clarify lineUrl vs lineOaId in Admin UX copy
WhatsApp / Messenger / Telegram surfaces (same orchestrator pattern)
Diagnostics: “LINE configured ✓” in Integrations admin
```

### Known UX follow-up (P3) — Footer LINE duplication

**Status:** Accepted intentional behavior in V1 — **do not change in this PR.**

```txt
lineUrl (General Settings)  → social media URL (SiteSocialIcons)
lineOaId (Integrations)     → Official Account surface (Floating + Footer link)

Both may render simultaneously in V1. Intentional.
```

**Problem (post-launch UX):** users may see two LINE entries and not understand they come from different CMS fields.

**Options for a future ticket (`Footer UX Refinement`, P3, before major public release):**

| Option | Idea |
|--------|------|
| A | Hide social LINE icon when `lineOaId` resolves |
| B | Move LINE Official Account out of Follow Us into a Contact section |
| C *(preferred long-term)* | Footer IA split: **Follow Us** (Facebook / Instagram / TikTok / YouTube) vs **Contact Us** (LINE OA, Phone, Email) |

Product note: LINE OA is primarily a **contact channel**, not a social feed — Option C matches that meaning best.
