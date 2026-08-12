# Integrations Runtime V1 Design

**Date:** 2026-08-12  
**Status:** Final Spec — ready for implementation plan  

**Depends on:** Integrations Foundation + Admin UI V1 (settings keys, `getIntegrationSettings()`, admin at `/admin/settings/integrations`)  
**Scope:** Inject GTM / GA4 (fallback) / Meta Pixel on public site only — execute stored configuration

## Goal

When admins configure tracking IDs in CMS, the **public website** loads the corresponding scripts so analytics and Meta Pixel actually run — without tracking admin traffic and without implementing consent UI yet.

## Architecture

**Approach 1 — Orchestrator + provider components**

```txt
app/[locale]/(site)/layout.tsx
  ↓
<TrackingScripts />                    (Server Component)
  ↓
getIntegrationSettings()
  ↓
canLoadTracking()                      (V1 → always true)
  ↓
resolveTrackingConfiguration()         (pure, trim + precedence)
  ↓
providers (render-only)
  ├─ GoogleTagManager
  ├─ GoogleAnalytics                   (only if no GTM)
  └─ MetaPixel                         (independent)
```

Resolution logic is separated from script markup so matrix behavior is unit-testable without rendering React or hitting Google/Meta networks.

## Decisions

| Topic | Choice |
|-------|--------|
| GA4 vs GTM | **Hybrid:** GTM overrides direct GA4 |
| Meta Pixel | **Independent:** always inject when `metaPixelId` set |
| Mount point | `app/[locale]/(site)/layout.tsx` only |
| Consent | Abstraction only (`canLoadTracking()` → `true`); no banner |
| Script loading | `next/script` with `afterInteractive` |
| `@next/third-parties` | Not required in V1 |
| LINE OA | Out of scope (surfaces epic) |
| Admin tracking | Never |

## Non-Goals

```txt
No consent banner / preference center / PDPA UI
No LINE OA runtime surfaces
No format validation of tracking IDs
No admin UI warnings about GTM+Meta duplication
No custom event helpers (Purchase, Lead, etc.)
No SPA / soft-navigation tracking beyond App Router defaults
No scripts in app/layout.tsx or app/admin/**
No changing Integrations Admin UI or API contracts
No @next/third-parties dependency requirement
No tenant-scoped integrations (Runtime V1 resolves site-wide settings only)
```

---

## 1. Resolution Rules

### Consent gate

```txt
canLoadTracking() === false  →  render nothing
canLoadTracking() === true   →  continue
```

V1: `canLoadTracking()` always returns `true` (consent-ready, not consent-enabled).

### Normalization

Resolution operates on **normalized** values. All IDs are **trimmed** before evaluation. Empty or whitespace-only → unset (`null`).

### Analytics (GTM vs GA4)

| GTM | GA4 | Result |
|-----|-----|--------|
| ❌ | ❌ | No analytics |
| ❌ | ✅ | Inject GA4 (`gtag.js`) |
| ✅ | ❌ | Inject GTM |
| ✅ | ✅ | Inject **GTM only** |

**Rule:** GTM overrides direct GA4.

When GTM is configured, direct GA4 injection is disabled even if `gaMeasurementId` is set (GA4 is expected to be managed inside GTM).

### Meta Pixel (independent)

| Meta | Result |
|------|--------|
| ❌ | No Meta |
| ✅ | Inject Meta Pixel |

**Rule:** Meta is independent of GTM/GA4.

**Warning (document in code comments / spec):** If a Meta Pixel tag is also configured inside GTM, duplicate tracking may occur. V1 does not detect or prevent this.

### Combined examples

| GTM | GA4 | Meta | Injected |
|-----|-----|------|----------|
| — | — | — | nothing |
| — | G-… | — | GA4 |
| GTM-… | — | — | GTM |
| GTM-… | G-… | — | GTM |
| — | — | pixel | Meta |
| GTM-… | G-… | pixel | GTM + Meta |

### Pure function

```ts
type TrackingConfiguration = {
  gtmContainerId: string | null;
  gaMeasurementId: string | null; // null when GTM wins or unset
  metaPixelId: string | null;
};

function resolveTrackingConfiguration(
  settings: IntegrationSettings,
): TrackingConfiguration;
```

---

## 2. Components & Script Wiring

### Files

```txt
components/integrations/
  tracking-scripts.tsx       # Server orchestrator
  resolve-tracking.ts        # pure resolveTrackingConfiguration
  consent.ts                 # canLoadTracking()
  google-tag-manager.tsx
  google-analytics.tsx
  meta-pixel.tsx
```

### Contracts

- **`TrackingScripts`** is a **Server Component**. It calls `getIntegrationSettings()`.
- **Provider components** are **render-only** (receive resolved IDs as props). Do not move settings fetching into the client.
- Use `next/script` with `strategy="afterInteractive"`.
- **Fail-safe:** If settings retrieval throws, render nothing and do not break page rendering. Analytics must never take down the public site.
- Runtime V1 resolves **site-wide** settings only. Tenant-scoped integrations are out of scope.

### Stable Script IDs

| Purpose | `id` |
|---------|------|
| GTM bootstrap | `gtm-bootstrap` |
| GA4 loader | `ga4-loader` |
| GA4 config | `ga4-config` |
| Meta Pixel | `meta-pixel` |

`<noscript>` fallbacks (GTM iframe, Meta 1×1 image) are **not** part of script-id assertions.

### Provider behavior

**GoogleTagManager** (`gtmContainerId`):

- Head/body bootstrap via `next/script`
- `<noscript>` iframe fallback (standard GTM snippet)

**GoogleAnalytics** (`gaMeasurementId`, fallback only):

- Load `gtag.js`
- `gtag('config', measurementId)` including default page_view behavior

**MetaPixel** (`metaPixelId`):

- `fbq('init', …)` + `fbq('track', 'PageView')`
- `<noscript>` 1×1 image fallback

### Layout wiring

```txt
app/[locale]/(site)/layout.tsx
  <TrackingScripts />
  <SiteHeaderLoader />
  {children}
  <SiteFooter />
```

```txt
Tracking scripts are injected only on public site routes.
Admin routes are never tracked.
Implementation target: app/[locale]/(site)/layout.tsx
```

Do **not** place tracking in `app/layout.tsx` (would wrap admin) or use pathname conditionals as the primary boundary.

---

## 3. Tests

### Required

1. **`resolve-tracking` unit tests** — full matrix including whitespace → empty; GTM+GA4 → GTM only; GTM+Meta → both.
2. **`canLoadTracking`** — returns `true` in V1.
3. **Layout wiring (static/source)** — `(site)/layout.tsx` imports `TrackingScripts`; `app/layout.tsx` and `app/admin/layout.tsx` do not.
4. **Optional shallow render** — providers emit expected script `id`s when given IDs.

### Not required

- Browser E2E against Google/Meta CDNs
- Network mocking of GTM/GA/fbevents
- Visual regression

### Success criteria

```txt
Public site + configured IDs → scripts load per matrix
Admin → never loads tracking
Empty settings → no scripts
```

---

## 4. Implementation order

1. `consent.ts` + `resolve-tracking.ts` + unit tests (TDD)
2. Provider components (GTM / GA4 / Meta) + optional script-id assertions
3. `TrackingScripts` orchestrator
4. Wire into `app/[locale]/(site)/layout.tsx`
5. Layout-wiring static tests + manual smoke on public homepage

## 5. Branch / PR

- Branch from current integrations line (or `feat/seo-completion-v1` once Integrations UI is merged)
- Title suggestion: `feat(integrations): inject GTM, GA4 fallback, and Meta Pixel on public site`

## 6. Follow-ups

```txt
Consent / PDPA banner gating via canLoadTracking()
SPA / soft-navigation page_view helpers
LINE OA surfaces
Format validation + admin duplicate warnings
Custom conversion events
@next/third-parties adoption (optional)
```
