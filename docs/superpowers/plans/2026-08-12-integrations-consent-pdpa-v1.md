# Integrations Consent / PDPA V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate public GTM / GA4 / Meta behind category consent (Analytics / Marketing), with a first-visit banner, localStorage persistence, and a required footer path to reopen preferences — without gating LINE OA.

**Architecture:** Client `ConsentProvider` owns `StoredConsent` (`null` = undecided). Server resolves tracking IDs via existing `resolveTrackingConfiguration` / `getIntegrationSettings` and passes them as props into `ConsentAwareTrackingScripts` (no client fetch to integrations API). Category gates decide which providers mount. Replace unconditional `<TrackingScripts />` in `app/[locale]/layout.tsx`.

**Tech Stack:** Next.js App Router, next-intl, existing provider components, `localStorage`, `node:test` + `tsx`

**Spec:** `docs/superpowers/specs/2026-08-12-integrations-consent-pdpa-v1-design.md`

## Global Constraints

- Categories: Necessary (always) / Analytics (GTM+GA4) / Marketing (Meta)
- Initial: undecided → banner; no tracking until decided
- Storage: `localStorage` key `integration-consent-v1` only
- Undecided (`null`) ≠ Necessary-only (`{ analytics:false, marketing:false, updatedAt }`)
- Corrupt/missing storage → treat as undecided; **never throw**
- LINE OA outside consent; admin outside consent
- Server → props → client for tracking IDs — **no** `fetch("/api/settings/integrations")` from consent client
- Footer Cookie Settings reopen is **Required**
- Component name: `ConsentAwareTrackingScripts` (not generic ConsentAwareTracking)
- Do not change Diagnostics V1 / resolvers’ precedence rules

## File map

| Path | Responsibility |
|------|----------------|
| `components/integrations/consent-types.ts` | `ConsentPreferences`, `StoredConsent`, storage key constant |
| `components/integrations/consent-storage.ts` | read/write/parse localStorage; corrupt → null |
| `components/integrations/consent-gates.ts` | `canLoadAnalytics` / `canLoadMarketing` |
| `components/integrations/consent-provider.tsx` | Client context + banner open/close API |
| `components/integrations/consent-banner.tsx` | Banner / customize UI |
| `components/integrations/consent-aware-tracking-scripts.tsx` | Client gated providers from props |
| `components/integrations/tracking-config-loader.tsx` | Server: load settings → resolve → pass props |
| `components/integrations/cookie-settings-button.tsx` | Footer reopen control |
| `components/integrations/consent.ts` | Deprecate/remove runtime use of boolean `canLoadTracking` |
| `app/[locale]/layout.tsx` | Mount ConsentProvider + tracking loader; keep LineOaSurfaces |
| `features/layout/site-footer.tsx` | Cookie Settings button |
| `messages/th.json` / `en.json` | Consent copy |
| `tests/consent-storage.test.ts` | Parse + corrupt recovery |
| `tests/consent-gates.test.ts` | Gate matrix |
| `tests/consent-wiring.test.ts` | Layout / footer / no client integrations fetch |

---

### Task 1: Types, storage (incl. corrupt recovery), gates + tests

**Files:**
- Create: `components/integrations/consent-types.ts`
- Create: `components/integrations/consent-storage.ts`
- Create: `components/integrations/consent-gates.ts`
- Create: `tests/consent-storage.test.ts`
- Create: `tests/consent-gates.test.ts`

**Interfaces:**
- Produces:
  - `CONSENT_STORAGE_KEY = "integration-consent-v1"`
  - `ConsentPreferences`, `StoredConsent`
  - `readStoredConsent(): StoredConsent` (browser-safe; SSR → null)
  - `writeStoredConsent(prefs: ConsentPreferences): void`
  - `parseStoredConsent(raw: string | null): StoredConsent` — **corrupt → null, never throw**
  - `canLoadAnalytics(consent: StoredConsent): boolean`
  - `canLoadMarketing(consent: StoredConsent): boolean`

- [ ] **Step 1: Write failing storage + gate tests**

Explicit corrupt-recovery cases (required deliverable):

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseStoredConsent } from "@/components/integrations/consent-storage";
import {
  canLoadAnalytics,
  canLoadMarketing,
} from "@/components/integrations/consent-gates";

describe("parseStoredConsent", () => {
  it("returns null for missing / empty", () => {
    assert.equal(parseStoredConsent(null), null);
    assert.equal(parseStoredConsent(""), null);
  });

  it("returns null for corrupt JSON without throwing", () => {
    assert.equal(parseStoredConsent("{broken json"), null);
    assert.equal(parseStoredConsent("not-json"), null);
    assert.equal(parseStoredConsent("[]"), null);
  });

  it("returns null for invalid shape", () => {
    assert.equal(parseStoredConsent(JSON.stringify({ analytics: "yes" })), null);
    assert.equal(parseStoredConsent(JSON.stringify({ marketing: true })), null);
  });

  it("parses decided Necessary-only", () => {
    const raw = JSON.stringify({
      analytics: false,
      marketing: false,
      updatedAt: "2026-08-12T10:00:00.000Z",
    });
    const parsed = parseStoredConsent(raw);
    assert.ok(parsed);
    assert.equal(parsed!.analytics, false);
    assert.equal(parsed!.marketing, false);
  });

  it("parses accept-all", () => {
    const raw = JSON.stringify({
      analytics: true,
      marketing: true,
      updatedAt: "2026-08-12T10:00:00.000Z",
    });
    const parsed = parseStoredConsent(raw);
    assert.deepEqual(
      { analytics: parsed!.analytics, marketing: parsed!.marketing },
      { analytics: true, marketing: true },
    );
  });
});

describe("consent gates", () => {
  it("undecided loads nothing", () => {
    assert.equal(canLoadAnalytics(null), false);
    assert.equal(canLoadMarketing(null), false);
  });

  it("necessary-only loads nothing", () => {
    const c = { analytics: false, marketing: false, updatedAt: "x" };
    assert.equal(canLoadAnalytics(c), false);
    assert.equal(canLoadMarketing(c), false);
  });

  it("analytics-only loads analytics not marketing", () => {
    const c = { analytics: true, marketing: false, updatedAt: "x" };
    assert.equal(canLoadAnalytics(c), true);
    assert.equal(canLoadMarketing(c), false);
  });

  it("accept-all loads both", () => {
    const c = { analytics: true, marketing: true, updatedAt: "x" };
    assert.equal(canLoadAnalytics(c), true);
    assert.equal(canLoadMarketing(c), true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
node --import tsx --test tests/consent-storage.test.ts tests/consent-gates.test.ts
```

- [ ] **Step 3: Implement types, `parseStoredConsent` (try/catch → null), gates**

`parseStoredConsent` must:
1. try `JSON.parse`
2. validate `typeof analytics/marketing === "boolean"` and `typeof updatedAt === "string"`
3. on any failure → `null` (undecided)

`readStoredConsent` / `writeStoredConsent` may guard `typeof window === "undefined"`.

- [ ] **Step 4: Run — expect PASS**

```bash
node --import tsx --test tests/consent-storage.test.ts tests/consent-gates.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add components/integrations/consent-types.ts \
  components/integrations/consent-storage.ts \
  components/integrations/consent-gates.ts \
  tests/consent-storage.test.ts \
  tests/consent-gates.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): add consent storage helpers and category gates

EOF
)"
```

---

### Task 2: ConsentProvider + Banner UI + i18n

**Files:**
- Create: `components/integrations/consent-provider.tsx`
- Create: `components/integrations/consent-banner.tsx`
- Modify: `messages/th.json`, `messages/en.json` (new `consent` namespace)

**Interfaces:**
- Provider exposes: `consent: StoredConsent`, `isPreferencesOpen: boolean`, `acceptAll()`, `necessaryOnly()`, `saveCustom({analytics, marketing})`, `openPreferences()`, `closePreferences()`
- Banner visible when `consent === null` **or** `isPreferencesOpen`

- [ ] **Step 1: Add i18n keys** under `consent` (TH + EN), e.g.:

```json
"consent": {
  "title": "Cookies & privacy",
  "description": "We use analytics and marketing technologies to improve your experience. Necessary cookies are always on.",
  "acceptAll": "Accept all",
  "necessaryOnly": "Necessary only",
  "customize": "Customize",
  "save": "Save preferences",
  "analytics": "Analytics",
  "analyticsHelp": "Helps us understand site usage (e.g. Google Analytics / Tag Manager).",
  "marketing": "Marketing",
  "marketingHelp": "Used for advertising measurement (e.g. Meta Pixel).",
  "cookieSettings": "Cookie settings"
}
```

Thai equivalents in `th.json`.

- [ ] **Step 2: Implement ConsentProvider**

On mount: `setConsent(readStoredConsent())`.  
Writes decided prefs via `writeStoredConsent`.  
Hydration: start as `null` undecided until effect runs (acceptable for V1; avoids SSR mismatch). Tracking still gated false until decided.

- [ ] **Step 3: Implement ConsentBanner**

Actions: Accept all / Necessary only / Customize (toggles + Save).  
After decide: hide unless preferences reopened.

- [ ] **Step 4: Commit**

```bash
git add components/integrations/consent-provider.tsx \
  components/integrations/consent-banner.tsx \
  messages/th.json messages/en.json
git commit -m "$(cat <<'EOF'
feat(integrations): add consent provider and banner UI

EOF
)"
```

---

### Task 3: ConsentAwareTrackingScripts + layout wiring (server → props)

**Files:**
- Create: `components/integrations/consent-aware-tracking-scripts.tsx`
- Create: `components/integrations/tracking-config-loader.tsx` (Server Component)
- Modify: `app/[locale]/layout.tsx`
- Modify: `components/integrations/consent.ts` and `tests/resolve-tracking.test.ts` as needed (stop relying on always-true gate for runtime)
- Create / extend: `tests/consent-wiring.test.ts`

**CRITICAL pattern (merge gate):**

```txt
Server TrackingConfigLoader
  getIntegrationSettings() + resolveTrackingConfiguration()
  → props { gtmContainerId, gaMeasurementId, metaPixelId }

Client ConsentAwareTrackingScripts
  useConsent()
  if canLoadAnalytics → mount GTM/GA4 providers
  if canLoadMarketing → mount Meta

FORBIDDEN:
  Client fetch("/api/settings/integrations")
```

- [ ] **Step 1: Write failing wiring tests**

```ts
describe("consent wiring", () => {
  it("locale layout mounts ConsentProvider and does not mount bare TrackingScripts", () => {
    const layout = read("app/[locale]/layout.tsx");
    assert.match(layout, /ConsentProvider/);
    assert.doesNotMatch(layout, /<TrackingScripts\s*\/>/);
  });

  it("ConsentAwareTrackingScripts does not fetch integrations API", () => {
    const source = read("components/integrations/consent-aware-tracking-scripts.tsx");
    assert.doesNotMatch(source, /fetch\(/);
    assert.doesNotMatch(source, /\/api\/settings\/integrations/);
  });

  it("keeps consent off admin and root layouts", () => {
    assert.doesNotMatch(read("app/layout.tsx"), /ConsentProvider/);
    assert.doesNotMatch(read("app/admin/layout.tsx"), /ConsentProvider/);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
node --import tsx --test tests/consent-wiring.test.ts
```

- [ ] **Step 3: Implement client gated scripts**

```tsx
"use client";
// props: gtmContainerId, gaMeasurementId, metaPixelId: string | null
// if canLoadAnalytics(consent): render GTM/GA4 when ids present
// if canLoadMarketing(consent): render Meta when id present
```

- [ ] **Step 4: Implement server loader**

```tsx
// async function TrackingConfigLoader()
// try getIntegrationSettings + resolveTrackingConfiguration
// catch → return null
// else return <ConsentAwareTrackingScripts ...ids />
```

- [ ] **Step 5: Wire locale layout**

```tsx
<NextIntlClientProvider>
  <ConsentProvider>
    <ConsentBanner />
    <TrackingConfigLoader />
    <LineOaSurfaces />
    {children}
  </ConsentProvider>
</NextIntlClientProvider>
```

Remove `<TrackingScripts />`. Keep `tracking-scripts.tsx` file only if still useful as deprecated wrapper — prefer unused or delete usage only; do not leave double-inject.

Update `canLoadTracking` tests: either delete suite or assert deprecated helper behavior documented in code comment (gates are source of truth).

- [ ] **Step 6: Run tests — expect PASS**

```bash
node --import tsx --test tests/consent-storage.test.ts tests/consent-gates.test.ts tests/consent-wiring.test.ts tests/resolve-tracking.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add components/integrations/consent-aware-tracking-scripts.tsx \
  components/integrations/tracking-config-loader.tsx \
  "app/[locale]/layout.tsx" \
  components/integrations/consent.ts \
  tests/consent-wiring.test.ts \
  tests/resolve-tracking.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): gate tracking scripts with category consent

EOF
)"
```

---

### Task 4: Footer Cookie Settings (required reopen)

**Files:**
- Create: `components/integrations/cookie-settings-button.tsx`
- Modify: `features/layout/site-footer.tsx`
- Modify: `tests/consent-wiring.test.ts`
- Modify: `messages/*` if label only under `consent.cookieSettings`

- [ ] **Step 1: Extend wiring test**

```ts
it("footer exposes Cookie Settings reopen control", () => {
  const footer = read("features/layout/site-footer.tsx");
  assert.match(footer, /CookieSettingsButton|cookieSettings/);
});
```

- [ ] **Step 2: Implement button**

Client button calling `openPreferences()` from ConsentProvider. Must be usable inside footer under the same provider tree (locale layout wraps children that include footer via site pages — **verify**: homepage and `(site)` footer are under `[locale]/layout` → yes).

- [ ] **Step 3: Place next to Privacy / Terms links in footer bottom bar**

- [ ] **Step 4: Run tests + commit**

```bash
git commit -m "$(cat <<'EOF'
feat(integrations): add required Cookie Settings reopen in footer

EOF
)"
```

---

### Task 5: Lint + manual smoke + PR readiness

- [ ] **Step 1: Lint touched consent/layout/footer files**

- [ ] **Step 2: Manual smoke**

```txt
□ First visit (clear localStorage) → banner; no gtm/ga4/meta script ids
□ Accept all → scripts per configured IDs; banner hidden; reload persists
□ Necessary only → decided object in storage; no tracking scripts; banner hidden
□ Analytics only → GTM/GA4 ok; Meta off
□ Corrupt localStorage value → banner shows; no throw
□ Footer Cookie Settings → reopen preferences; can change and persist
□ LINE floating/footer still works without consent
□ /admin → no consent banner / no public tracking from this layout
```

- [ ] **Step 3: Push + PR**

**Title:** `feat(integrations): add category consent banner for tracking scripts`

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Types + undecided vs decided + corrupt → null | Task 1 |
| Category gates | Task 1 |
| Provider + banner + i18n | Task 2 |
| ConsentAwareTrackingScripts + server props (no client fetch) | Task 3 |
| Replace TrackingScripts in locale layout | Task 3 |
| Footer Cookie Settings required | Task 4 |
| Smoke matrix + PR | Task 5 |
| LINE / admin outside consent | Global Constraints |
