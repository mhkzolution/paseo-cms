# Integrations Consent / PDPA V1 Design

**Date:** 2026-08-12  
**Status:** Final Spec — ready for implementation plan  

**Depends on:** Integrations Runtime V1 (GTM / GA4 / Meta providers, `resolveTrackingConfiguration`, locale layout mount) + LINE OA Surfaces (out of consent scope)  
**Scope:** Category consent banner + localStorage preference gating public tracking scripts only

## Goal

Before loading GTM / GA4 / Meta on the public site, visitors must see a consent UI and choose Analytics / Marketing preferences. Preferences persist in `localStorage`. LINE OA surfaces and Necessary site functions remain available without consent.

## Architecture

**Approach 1 — Client ConsentProvider + category-gated tracking**

```txt
app/[locale]/layout.tsx
  ↓
ConsentProvider (client)          read/write localStorage
  ├─ ConsentBanner / Modal        undecided → show; decided → hide (reopen via footer)
  ├─ ConsentAwareTrackingScripts  analytics? → GTM/GA4; marketing? → Meta
  └─ children (site content)
      └─ LineOaSurfaces           OUTSIDE consent (unchanged)
```

Server continues to resolve *which* IDs would inject (`resolveTrackingConfiguration`). Client consent decides *whether* those providers mount.

## Decisions

| Topic | Choice |
|-------|--------|
| Consent model | **Categories:** Necessary (always on) / Analytics / Marketing |
| Initial behavior | **Banner first** — no tracking until choice |
| Runtime scope | **GTM + GA4 + Meta only** (not LINE, not all outbound links) |
| Storage | **localStorage** (`integration-consent-v1`) |
| Undecided vs decided | **Distinguish explicitly** (`null` / undecided ≠ Necessary-only) |
| Reopen preferences | **Required** — Footer “Cookie Settings” reopens UI |
| Gates | `canLoadAnalytics` / `canLoadMarketing` (not a single boolean) |

## Non-Goals

```txt
No cookie storage in V1 (optional V2 SSR mirror)
No DB / per-user consent sync
No LINE OA / contact surface gating
No IAB TCF / CMP vendor SDK
No Google Consent Mode deep integration in V1
No admin CMS editor for banner copy (i18n files only)
No Diagnostics V1 changes (future Diagnostics can show consent requirements)
No Validation Enforcement
No Custom Events wiring yet (must reuse same consent gates later)
```

---

## 1. Consent decision model

### Types

```ts
export type ConsentPreferences = {
  analytics: boolean;
  marketing: boolean;
  updatedAt: string; // ISO-8601
};

/** No stored value → undecided (show banner). */
export type StoredConsent = ConsentPreferences | null;
```

| Storage | Meaning | Banner | Analytics | Marketing |
|---------|---------|--------|-----------|-----------|
| `null` / missing / corrupt | **Undecided** | Show | false | false |
| `{ analytics, marketing, updatedAt }` | **Decided** | Hide (until reopen) | as stored | as stored |

**Do not** treat “Necessary only” as the same as undecided.  
Necessary-only is a **decided** object:

```json
{ "analytics": false, "marketing": false, "updatedAt": "..." }
```

### Storage key

```txt
integration-consent-v1
```

Payload example:

```json
{
  "analytics": true,
  "marketing": false,
  "updatedAt": "2026-08-12T10:00:00.000Z"
}
```

Necessary is implied always-on and is **not** stored.

---

## 2. Category mapping

| Category | Integrations | Notes |
|----------|--------------|-------|
| Necessary | Theme, locale, auth session, cart (future), etc. | Always on; no consent gate |
| Analytics | GTM, GA4 | Via `resolveTrackingConfiguration` then mount if `canLoadAnalytics` |
| Marketing | Meta Pixel | Mount if `canLoadMarketing` |
| Outside V1 | LINE OA floating + footer, normal outbound links | Never gated by consent |

V1 treats GTM as an Analytics container. If GTM later loads marketing tags inside the container, refine policy in a later epic (e.g. Consent Mode / split containers).

---

## 3. Gates (replace boolean `canLoadTracking` for runtime)

```ts
export function canLoadAnalytics(consent: StoredConsent): boolean {
  return consent?.analytics === true;
}

export function canLoadMarketing(consent: StoredConsent): boolean {
  return consent?.marketing === true;
}
```

Undecided (`null`) → both false.

**Migration note:** Existing `canLoadTracking(): boolean` stub (always `true`) must **not** remain the runtime gate. Prefer:

- Remove its use from tracking orchestration, **or**
- Redefine as deprecated helper that is **not** used for category-aware injection

Tracking orchestration becomes category-aware:

```ts
if (canLoadAnalytics(consent)) {
  // mount GTM and/or GA4 per resolveTrackingConfiguration
}
if (canLoadMarketing(consent)) {
  // mount Meta when configured
}
```

---

## 4. Components

### `ConsentProvider` (client)

- On mount: read `integration-consent-v1`; expose `StoredConsent` + `setConsent` / `acceptAll` / `necessaryOnly` / `openPreferences`
- Persist decided preferences to localStorage
- Provide reopen signal for footer link

### Consent banner / preferences UI (client)

- Visible when consent is **undecided**, or when user reopens preferences
- Actions:
  - **Accept all** → `{ analytics: true, marketing: true, updatedAt }`
  - **Necessary only** → `{ analytics: false, marketing: false, updatedAt }`
  - **Customize** → toggles for Analytics + Marketing → Save (decided)
- Copy via next-intl (TH/EN); short PDPA-oriented language
- After decide: hide banner; keep preferences reopenable

### `ConsentAwareTrackingScripts` (client) — name required

Replaces server-only unconditional mount of tracking providers for consent V1.

Responsibilities:

1. Obtain resolved tracking configuration (IDs). Preferred pattern: Server Component parent loads settings + `resolveTrackingConfiguration`, passes **serializable IDs** as props into this client component (avoid client calling integrations API if possible).
2. Read consent from `ConsentProvider`.
3. Mount existing providers only when gated:
   - Analytics → `GoogleTagManager` / `GoogleAnalytics`
   - Marketing → `MetaPixel`

Fail-soft: settings load failure → render nothing (same spirit as Runtime V1).

**Do not** name this generically `ConsentAwareTracking` — keep `ConsentAwareTrackingScripts` so future embeds/maps/videos can use distinct components.

### Footer “Cookie Settings” — **Required**

- Link in public `SiteFooter` (and thus homepage + site pages)
- Opens consent preferences UI (same modal/banner customize mode)
- Without this, decided users have no path to change preferences under localStorage-only V1

### Layout mount

```txt
app/[locale]/layout.tsx
  ConsentProvider
    ConsentBanner (or portal)
    ConsentAwareTrackingScripts
    LineOaSurfaces          (unchanged; outside consent)
    {children}
```

Never mount consent UI / tracking gate in `app/layout.tsx` or `app/admin/**`.

---

## 5. Runtime matrix

| Consent | Analytics | Marketing | GTM/GA4 | Meta | LINE |
|---------|-----------|-----------|---------|------|------|
| Undecided | false | false | Off | Off | On |
| Necessary only | false | false | Off | Off | On |
| Analytics only | true | false | On* | Off | On |
| Accept all | true | true | On* | On* | On |

\* Only if corresponding IDs are configured in Integrations settings.

---

## 6. Tests

### Required

1. Storage helpers: missing/corrupt → `null` (undecided); round-trip serialize decided object
2. `canLoadAnalytics` / `canLoadMarketing` matrix including undecided
3. Static: locale layout mounts ConsentProvider + ConsentAwareTrackingScripts; admin/root do not
4. Static: SiteFooter includes Cookie Settings reopen affordance
5. Manual smoke: first visit no tracking scripts; accept analytics → GTM/GA4; marketing off → no Meta; LINE still present; reopen from footer works

### Not required

- Legal review automation
- Cross-device sync
- Consent Mode ping to Google

### Success criteria

```txt
Undecided ≠ Necessary-only (banner vs hidden)
No tracking scripts before choice
Category gates respected
Preference persists on reload
Footer can reopen preferences
LINE unaffected
Admin unaffected
```

---

## 7. Implementation order

1. Consent types + localStorage helpers + gate functions + unit tests
2. ConsentProvider + banner/preferences UI + i18n
3. ConsentAwareTrackingScripts (wire providers + resolved IDs)
4. Replace server `TrackingScripts` mount path in locale layout with consent-aware flow
5. Footer Cookie Settings (required)
6. Update/remove obsolete `canLoadTracking` runtime usage + tests
7. Manual smoke + PR

## 8. Branch / PR

- Branch from current post–Diagnostics integrations line
- Title suggestion: `feat(integrations): add category consent banner for tracking scripts`

## 9. Follow-ups

```txt
Cookie mirror for SSR hints
Google Consent Mode v2
GTM marketing-tag policy refinement
Consent signals in Diagnostics panel
Custom Events gated by analytics/marketing
Per-tenant consent copy in CMS
Validation Enforcement policies
```
