# Integrations Validation & Diagnostics V1 Design

**Date:** 2026-08-12  
**Status:** Final Spec — ready for implementation plan  

**Depends on:** Integrations Foundation + Admin UI + Runtime V1 + LINE OA Surfaces (`getIntegrationSettings`, `resolveTrackingConfiguration`, `resolveLineOaUrl`, `/admin/settings/integrations`)  
**Scope:** Soft, saved-config diagnostics summary on the Integrations admin page — predict what public runtime will do; light format heuristics as warnings only

## Goal

When admins configure GA4 / GTM / Meta / LINE OA IDs, the Integrations page shows a clear **Runtime Status** summary derived from the same resolvers as production — so they can answer “what will the site render?” and “does this value look suspicious?” without DevTools and without blocking Save.

## Architecture

**Approach 1 — Pure diagnostics resolver + Admin summary panel**

```txt
DB (saved IntegrationSettings)
  ↓
resolveTrackingConfiguration()     (existing — GTM > GA4, Meta independent)
resolveLineOaUrl()                 (existing — LINE deep link or null)
  ↓
resolveIntegrationDiagnostics()    (new — pure prediction layer)
  ↓
IntegrationsDiagnosticsPanel       (summary above the form)
```

No new diagnostics API, no DOM/CDN probing, no live draft state.

## Decisions

| Topic | Choice |
|-------|--------|
| Severity | **Soft only** — warn/inform; never block Save / PATCH / API |
| Source | **Saved values only** — DB-backed; refresh after successful save |
| UI | **Summary panel** above the Integrations form |
| Content | **Runtime status + light format heuristics** |
| Approach | Pure `resolveIntegrationDiagnostics` + panel (no probe, no new endpoint) |
| Enforcement | Out of scope (future Validation Enforcement epic) |
| Consent | Out of scope (`canLoadTracking` remains unchanged) |

## Non-Goals

```txt
No Save / API / PATCH blocking based on format
No live draft / watch()-based diagnostics
No per-section badges in V1
No GET /api/.../diagnostics endpoint
No homepage HTML / script-id probing from admin
No verification that Google/Meta/LINE networks succeed
No Consent / PDPA
No changing public runtime injection rules
No new Integrations setting keys
```

---

## 1. Prediction, not verification

**Diagnostics is a prediction layer, not an execution verification layer.**

| Diagnostics says | Means | Does **not** mean |
|------------------|-------|-------------------|
| GTM Active | Resolver would inject GTM | GTM container exists, gtm.js loaded, or network OK |
| GA4 Suppressed | Direct GA4 script will not inject | GA4 is absent from GTM |
| Meta Active | Meta Pixel component would render | fbevents loaded successfully |
| LINE OA Active | Floating + footer link would show | User can open LINE app |

Admin copy should stay in “will / will not inject” language, not “verified live”.

---

## 2. `resolveIntegrationDiagnostics`

### Signature

```ts
import type { IntegrationSettings } from "@/lib/integration-settings";

export type RuntimeChannelStatus = "active" | "inactive" | "suppressed";

export type DiagnosticsWarningCode =
  | "GA4_FORMAT"
  | "GTM_FORMAT"
  | "META_FORMAT"
  | "LINE_OA_EXPECTED_ID";

export type DiagnosticsWarning = {
  code: DiagnosticsWarningCode;
  message: string;
};

export type IntegrationDiagnostics = {
  runtime: {
    gtm: RuntimeChannelStatus;   // active | inactive
    ga4: RuntimeChannelStatus;   // active | suppressed | inactive
    meta: RuntimeChannelStatus;  // active | inactive
    lineOa: RuntimeChannelStatus; // active | inactive
  };
  configured: {
    gtmContainerId: string | null;
    gaMeasurementId: string | null; // raw configured value even if suppressed
    metaPixelId: string | null;
    lineOaId: string | null;        // normalized OA id (@…) or null if empty
  };
  resolved: {
    lineOaUrl: string | null;       // from resolveLineOaUrl
  };
  warnings: DiagnosticsWarning[];
};

export function resolveIntegrationDiagnostics(
  settings: IntegrationSettings,
): IntegrationDiagnostics;
```

### Runtime status rules

Use existing resolvers; do not reimplement precedence ad hoc.

1. Normalize via `resolveTrackingConfiguration(settings)` and `resolveLineOaUrl(settings.lineOaId)`.
2. Also keep **configured** (trimmed non-empty) IDs separately so suppressed channels still show what was saved.

| Channel | Rule |
|---------|------|
| `gtm` | resolved GTM id → `active`, else `inactive` |
| `ga4` | if GTM active and configured GA4 → `suppressed`; else if resolved GA4 → `active`; else `inactive` |
| `meta` | resolved Meta → `active`, else `inactive` |
| `lineOa` | `resolveLineOaUrl` non-null → `active`, else `inactive` |

**Critical copy case — GTM active + GA4 configured:**

```txt
Google Analytics
⚠ Suppressed by GTM

Configured Measurement ID: G-TEST123
Direct GA4 script will not be injected.
Manage GA4 inside GTM.
```

### Light format heuristics (warnings only)

Emit only when the configured value is non-empty. Never block persistence.

| Code | When (soft heuristic) | Message intent |
|------|------------------------|----------------|
| `GA4_FORMAT` | configured GA4 does not match `/^G-[A-Z0-9]+$/i` | Expected Measurement ID like `G-XXXXXXXX` |
| `GTM_FORMAT` | configured GTM does not match `/^GTM-[A-Z0-9]+$/i` | Expected Container ID like `GTM-XXXXXXX` |
| `META_FORMAT` | configured Meta is not mostly digits | Pixel IDs are usually numeric |
| `LINE_OA_EXPECTED_ID` | value looks like a URL (`http(s)://` or contains `line.me`) | Expected OA id e.g. `@thepaseo`; runtime builds URL from value as entered |

Heuristics are intentionally conservative and may false-positive; that is acceptable because severity is soft.

Warning **codes** are stable for tests and future API/export. UI may localize `message` later; V1 may use English (or existing admin language) strings in the resolver or map codes → copy in the panel.

---

## 3. Admin UI

### Placement

Above the Integrations form on `/admin/settings/integrations`:

```txt
┌─────────────────────────────────────┐
│ Runtime Status                      │
│ ✓ GTM Active — Container: GTM-…     │
│ ⚠ GA4 Suppressed by GTM — …         │
│ ✓ Meta Pixel Active                 │
│ ℹ / ✓ LINE OA …                     │
├─────────────────────────────────────┤
│ Warnings (if any)                   │
│ ⚠ GA4_FORMAT …                      │
└─────────────────────────────────────┘

[ Integrations form … ]
```

### Refresh behavior

- Initial load: diagnostics from server-loaded saved settings.
- After successful Save: refresh diagnostics from **saved** response / re-fetch settings (not from unsaved draft fields).
- Optional short success note: diagnostics reflect saved configuration.

### Accessibility / presentation

- Use clear status markers (text + color is fine; do not rely on color alone).
- Do not imply live network verification.

---

## 4. Implementation sketch

| Piece | Responsibility |
|-------|----------------|
| `components/integrations/resolve-integration-diagnostics.ts` (or under `lib/`) | Pure `resolveIntegrationDiagnostics` |
| `features/settings/integrations-diagnostics-panel.tsx` | Renders diagnostics object |
| `app/admin/settings/integrations/page.tsx` + form | Mount panel; pass saved settings; refresh after save |
| `tests/resolve-integration-diagnostics.test.ts` | Matrix + warning codes |

Prefer colocating the pure helper next to other integration resolvers.

---

## 5. Tests

### Required

1. **Runtime matrix**
   - empty → all inactive, no warnings
   - GTM only → gtm active
   - GA4 only → ga4 active
   - GTM + GA4 → gtm active, ga4 **suppressed**, `configured.gaMeasurementId` still set
   - Meta / LINE independent active
2. **Warning codes**
   - bad GA4 / GTM / Meta / URL-like LINE emit expected codes
   - empty fields emit no format warnings
3. Optional static: Integrations page / form includes diagnostics panel

### Not required

- Browser E2E against Google/Meta
- API contract tests for a diagnostics endpoint
- Live draft watch tests

### Success criteria

```txt
Admin sees predicted runtime from saved settings
GTM suppressing GA4 is explicit and prominent
Suspicious formats → soft warnings with stable codes
Save never blocked by diagnostics
```

---

## 6. Implementation order

1. `resolveIntegrationDiagnostics` + unit tests (TDD)
2. Diagnostics panel component (presentational)
3. Wire into Integrations page / form (saved load + post-save refresh)
4. Manual smoke on `/admin/settings/integrations`
5. PR

## 7. Branch / PR

- Branch from current post–LINE OA integrations line
- Title suggestion: `feat(integrations): add runtime diagnostics summary on Integrations admin`

## 8. Follow-ups

```txt
Validation Enforcement V2 (optional hard block policies)
Live draft preview section (Saved vs Draft)
Per-section badges
Diagnostics API / export
Consent-aware “would load after consent” status
DOM probe / “last verified at” (expensive, optional)
Footer UX Refinement (P3 — separate)
```
