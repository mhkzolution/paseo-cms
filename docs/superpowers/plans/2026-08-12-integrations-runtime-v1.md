# Integrations Runtime V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inject GTM, GA4 (fallback when GTM absent), and Meta Pixel on public site routes only, driven by existing integration settings.

**Architecture:** Server `TrackingScripts` orchestrator loads settings, gates via `canLoadTracking()`, resolves via pure `resolveTrackingConfiguration()`, then renders provider components with `next/script`. Mount only in `app/[locale]/layout.tsx` (covers homepage + `(site)/*`; admin stays untracked).

**Tech Stack:** Next.js App Router, `next/script`, existing `getIntegrationSettings()`, `node:test` + `tsx`

**Spec:** `docs/superpowers/specs/2026-08-12-integrations-runtime-v1-design.md`

## Global Constraints

- GTM overrides direct GA4; Meta always independent when configured
- Public-only: `app/[locale]/layout.tsx` — never `app/layout.tsx`, `app/admin/**`, or `(site)/layout.tsx` alone (homepage bypasses `(site)`)
- Consent: `canLoadTracking()` returns `true` in V1 (abstraction only)
- Trim IDs before resolution; whitespace → unset
- Fail-safe: settings fetch failure → render null (do not break the page)
- Script strategy: `afterInteractive`
- Stable script ids: `gtm-bootstrap`, `ga4-loader`, `ga4-config`, `meta-pixel`
- Noscript fallbacks are not part of script-id assertions
- No consent UI, LINE surfaces, format validation, SPA tracking, or API/UI contract changes
- Site-wide settings only (no tenant scope)

## File map

| Path | Responsibility |
|------|----------------|
| `components/integrations/consent.ts` | `canLoadTracking()` |
| `components/integrations/resolve-tracking.ts` | `resolveTrackingConfiguration()` |
| `components/integrations/google-tag-manager.tsx` | GTM script + noscript |
| `components/integrations/google-analytics.tsx` | gtag.js fallback |
| `components/integrations/meta-pixel.tsx` | Meta Pixel + noscript |
| `components/integrations/tracking-scripts.tsx` | Server orchestrator |
| `app/[locale]/layout.tsx` | Mount `<TrackingScripts />` |
| `tests/resolve-tracking.test.ts` | Resolution matrix |
| `tests/integrations-runtime-wiring.test.ts` | Layout import / script-id checks |

---

### Task 1: Consent + resolve-tracking + tests (Phase 1)

**Files:**
- Create: `components/integrations/consent.ts`
- Create: `components/integrations/resolve-tracking.ts`
- Create: `tests/resolve-tracking.test.ts`

**Interfaces:**
- Produces:
  - `canLoadTracking(): boolean`
  - `resolveTrackingConfiguration(settings: IntegrationSettings): TrackingConfiguration`

- [ ] **Step 1: Write failing tests**

`tests/resolve-tracking.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canLoadTracking } from "@/components/integrations/consent";
import { resolveTrackingConfiguration } from "@/components/integrations/resolve-tracking";
import type { IntegrationSettings } from "@/lib/integration-settings";

const empty: IntegrationSettings = {
  gaMeasurementId: "",
  gtmContainerId: "",
  metaPixelId: "",
  lineOaId: "",
};

describe("canLoadTracking", () => {
  it("returns true in Runtime V1", () => {
    assert.equal(canLoadTracking(), true);
  });
});

describe("resolveTrackingConfiguration", () => {
  it("returns all null when empty", () => {
    assert.deepEqual(resolveTrackingConfiguration(empty), {
      gtmContainerId: null,
      gaMeasurementId: null,
      metaPixelId: null,
    });
  });

  it("injects GA4 when only gaMeasurementId is set", () => {
    assert.deepEqual(
      resolveTrackingConfiguration({ ...empty, gaMeasurementId: "G-TEST123" }),
      { gtmContainerId: null, gaMeasurementId: "G-TEST123", metaPixelId: null },
    );
  });

  it("injects GTM when only gtmContainerId is set", () => {
    assert.deepEqual(
      resolveTrackingConfiguration({ ...empty, gtmContainerId: "GTM-TEST" }),
      { gtmContainerId: "GTM-TEST", gaMeasurementId: null, metaPixelId: null },
    );
  });

  it("prefers GTM over direct GA4 when both are set", () => {
    assert.deepEqual(
      resolveTrackingConfiguration({
        ...empty,
        gtmContainerId: "GTM-TEST",
        gaMeasurementId: "G-TEST123",
      }),
      { gtmContainerId: "GTM-TEST", gaMeasurementId: null, metaPixelId: null },
    );
  });

  it("injects Meta independently", () => {
    assert.deepEqual(
      resolveTrackingConfiguration({ ...empty, metaPixelId: "123456789" }),
      { gtmContainerId: null, gaMeasurementId: null, metaPixelId: "123456789" },
    );
  });

  it("injects GTM and Meta together", () => {
    assert.deepEqual(
      resolveTrackingConfiguration({
        ...empty,
        gtmContainerId: "GTM-TEST",
        gaMeasurementId: "G-TEST123",
        metaPixelId: "123456789",
      }),
      { gtmContainerId: "GTM-TEST", gaMeasurementId: null, metaPixelId: "123456789" },
    );
  });

  it("treats whitespace-only IDs as empty", () => {
    assert.deepEqual(
      resolveTrackingConfiguration({
        ...empty,
        gtmContainerId: "  ",
        gaMeasurementId: "\t",
        metaPixelId: "   ",
      }),
      { gtmContainerId: null, gaMeasurementId: null, metaPixelId: null },
    );
  });

  it("trims IDs before evaluation", () => {
    assert.deepEqual(
      resolveTrackingConfiguration({
        ...empty,
        gaMeasurementId: "  G-TRIM  ",
        metaPixelId: " 999 ",
      }),
      { gtmContainerId: null, gaMeasurementId: "G-TRIM", metaPixelId: "999" },
    );
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
node --import tsx --test tests/resolve-tracking.test.ts
```

- [ ] **Step 3: Implement**

`components/integrations/consent.ts`:

```ts
/** V1: always allow tracking. Future PDPA will gate here. */
export function canLoadTracking(): boolean {
  return true;
}
```

`components/integrations/resolve-tracking.ts`:

```ts
import type { IntegrationSettings } from "@/lib/integration-settings";

export type TrackingConfiguration = {
  gtmContainerId: string | null;
  gaMeasurementId: string | null;
  metaPixelId: string | null;
};

function normalizeId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveTrackingConfiguration(
  settings: IntegrationSettings,
): TrackingConfiguration {
  const gtmContainerId = normalizeId(settings.gtmContainerId);
  const gaRaw = normalizeId(settings.gaMeasurementId);
  const metaPixelId = normalizeId(settings.metaPixelId);

  return {
    gtmContainerId,
    gaMeasurementId: gtmContainerId ? null : gaRaw,
    metaPixelId,
  };
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
node --import tsx --test tests/resolve-tracking.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add components/integrations/consent.ts components/integrations/resolve-tracking.ts tests/resolve-tracking.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): add tracking consent gate and resolution rules

EOF
)"
```

---

### Task 2: Provider components (Phase 2)

**Files:**
- Create: `components/integrations/google-tag-manager.tsx`
- Create: `components/integrations/google-analytics.tsx`
- Create: `components/integrations/meta-pixel.tsx`
- Create / extend: `tests/integrations-runtime-wiring.test.ts` (script id assertions via source read or shallow render)

**Interfaces:**
- Consumes: non-null ID strings as props
- Produces: markup with stable script `id`s

- [ ] **Step 1: Write failing script-id source tests**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("integrations provider script ids", () => {
  it("declares gtm-bootstrap in GoogleTagManager", () => {
    assert.match(read("components/integrations/google-tag-manager.tsx"), /id=["']gtm-bootstrap["']/);
  });

  it("declares ga4-loader and ga4-config in GoogleAnalytics", () => {
    const source = read("components/integrations/google-analytics.tsx");
    assert.match(source, /id=["']ga4-loader["']/);
    assert.match(source, /id=["']ga4-config["']/);
  });

  it("declares meta-pixel in MetaPixel", () => {
    assert.match(read("components/integrations/meta-pixel.tsx"), /id=["']meta-pixel["']/);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
node --import tsx --test tests/integrations-runtime-wiring.test.ts
```

- [ ] **Step 3: Implement providers**

`google-tag-manager.tsx` — standard GTM snippet with `next/script` `id="gtm-bootstrap"` + noscript iframe.

`google-analytics.tsx` — load gtag.js (`id="ga4-loader"`) + inline config (`id="ga4-config"`) calling `gtag('config', id)`.

`meta-pixel.tsx` — fbq bootstrap (`id="meta-pixel"`) + PageView + noscript img.

Use `strategy="afterInteractive"`. Escape IDs safely in inline scripts (JSON.stringify for string literals).

- [ ] **Step 4: Run — expect PASS**

```bash
node --import tsx --test tests/integrations-runtime-wiring.test.ts tests/resolve-tracking.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add components/integrations/google-tag-manager.tsx \
  components/integrations/google-analytics.tsx \
  components/integrations/meta-pixel.tsx \
  tests/integrations-runtime-wiring.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): add GTM, GA4, and Meta Pixel script providers

EOF
)"
```

---

### Task 3: TrackingScripts orchestrator (Phase 3)

**Files:**
- Create: `components/integrations/tracking-scripts.tsx`

**Interfaces:**
- Consumes: `getIntegrationSettings`, `canLoadTracking`, `resolveTrackingConfiguration`, providers
- Produces: async Server Component that returns null or providers

- [ ] **Step 1: Implement orchestrator with fail-safe**

```tsx
import { GoogleAnalytics } from "@/components/integrations/google-analytics";
import { GoogleTagManager } from "@/components/integrations/google-tag-manager";
import { MetaPixel } from "@/components/integrations/meta-pixel";
import { canLoadTracking } from "@/components/integrations/consent";
import { resolveTrackingConfiguration } from "@/components/integrations/resolve-tracking";
import { getIntegrationSettings } from "@/lib/integration-settings";

export async function TrackingScripts() {
  if (!canLoadTracking()) return null;

  let settings;
  try {
    settings = await getIntegrationSettings();
  } catch {
    return null;
  }

  const config = resolveTrackingConfiguration(settings);

  return (
    <>
      {config.gtmContainerId ? <GoogleTagManager containerId={config.gtmContainerId} /> : null}
      {config.gaMeasurementId ? <GoogleAnalytics measurementId={config.gaMeasurementId} /> : null}
      {config.metaPixelId ? <MetaPixel pixelId={config.metaPixelId} /> : null}
    </>
  );
}
```

- [ ] **Step 2: Add source assertion that TrackingScripts try/catches settings**

Extend `tests/integrations-runtime-wiring.test.ts`:

```ts
it("fails soft when settings cannot be loaded", () => {
  const source = read("components/integrations/tracking-scripts.tsx");
  assert.match(source, /try\s*\{/);
  assert.match(source, /getIntegrationSettings/);
  assert.match(source, /catch/);
});
```

- [ ] **Step 3: Run tests — expect PASS**

```bash
node --import tsx --test tests/integrations-runtime-wiring.test.ts tests/resolve-tracking.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add components/integrations/tracking-scripts.tsx tests/integrations-runtime-wiring.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): add TrackingScripts server orchestrator

EOF
)"
```

---

### Task 4: Layout wiring + static tests (Phase 4)

**Files:**
- Modify: `app/[locale]/(site)/layout.tsx`
- Modify: `tests/integrations-runtime-wiring.test.ts`

- [ ] **Step 1: Write failing layout wiring tests**

```ts
describe("integrations layout wiring", () => {
  it("mounts TrackingScripts on the public site layout only", () => {
    assert.match(
      read("app/[locale]/(site)/layout.tsx"),
      /TrackingScripts/,
    );
    assert.doesNotMatch(read("app/layout.tsx"), /TrackingScripts/);
    assert.doesNotMatch(read("app/admin/layout.tsx"), /TrackingScripts/);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
node --import tsx --test tests/integrations-runtime-wiring.test.ts
```

- [ ] **Step 3: Wire layout**

```tsx
import { TrackingScripts } from "@/components/integrations/tracking-scripts";
import { SiteFooter } from "@/features/layout/site-footer";
import { SiteHeaderLoader } from "@/features/layout/site-header-loader";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <TrackingScripts />
      <SiteHeaderLoader />
      {children}
      <SiteFooter />
    </>
  );
}
```

Note: `TrackingScripts` is async Server Component — valid as child of Server Component layout in Next App Router. If the layout must stay sync, keep it as async child (supported).

- [ ] **Step 4: Run — expect PASS**

```bash
node --import tsx --test tests/integrations-runtime-wiring.test.ts tests/resolve-tracking.test.ts
```

- [ ] **Step 5: Lint changed files**

```bash
npx eslint components/integrations/**/*.{ts,tsx} app/[locale]/\(site\)/layout.tsx tests/resolve-tracking.test.ts tests/integrations-runtime-wiring.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add "app/[locale]/(site)/layout.tsx" tests/integrations-runtime-wiring.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): mount tracking scripts on public site layout

EOF
)"
```

---

### Task 5: Manual smoke + PR readiness (Phase 5)

- [ ] **Step 1: Manual checklist (ADMIN session + public site)**

```txt
✅ Public homepage with empty integrations → no gtm/ga/meta scripts in DOM
✅ Set GTM only → gtm-bootstrap (+ noscript) present; no ga4-*
✅ Set GA4 only → ga4-loader + ga4-config; no gtm
✅ Set GTM + GA4 → GTM only (no ga4-*)
✅ Set Meta → meta-pixel present (alone or with GTM)
✅ /admin/** → no tracking script ids
✅ Settings fetch failure path does not 500 the homepage (optional fault injection)
```

- [ ] **Step 2: Push + open PR**

```bash
git push -u origin HEAD
```

**Title:** `feat(integrations): inject GTM, GA4 fallback, and Meta Pixel on public site`

**Base:** current integrations / seo-completion line as appropriate

Include Known Issues for unrelated repo lint/build debt.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| `canLoadTracking` + resolve matrix + trim | Task 1 |
| GTM / GA4 / Meta providers + script ids | Task 2 |
| Orchestrator + fail-safe try/catch | Task 3 |
| Public site layout only | Task 4 |
| Manual smoke + PR | Task 5 |
| No consent UI / LINE / admin tracking | Global Constraints |
