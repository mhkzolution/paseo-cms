# Integrations Validation & Diagnostics V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a soft Runtime Status + light format-warnings summary on `/admin/settings/integrations`, derived from saved settings via the same resolvers as public runtime.

**Architecture:** Pure `resolveIntegrationDiagnostics(settings)` wraps `resolveTrackingConfiguration` + `resolveLineOaUrl` (no duplicated precedence). Presentational panel above the form. After successful PATCH, recompute diagnostics from the saved JSON response (not draft fields). Prediction only — never verify CDN/network success; never block Save.

**Tech Stack:** Next.js App Router, existing Integrations form (client), `node:test` + `tsx`

**Spec:** `docs/superpowers/specs/2026-08-12-integrations-diagnostics-v1-design.md`

## Global Constraints

- Soft diagnostics only — no Save / PATCH / API blocking
- Saved values only — no live draft `watch()` diagnostics
- Summary panel above form only — no per-section badges
- Reuse `resolveTrackingConfiguration` + `resolveLineOaUrl` — do not reimplement GTM>GA4 ad hoc
- Prediction ≠ verification — copy stays “will inject / will not inject”
- Stable warning codes: `GA4_FORMAT` | `GTM_FORMAT` | `META_FORMAT` | `LINE_OA_EXPECTED_ID`
- Use `configured` (raw saved IDs) + `resolved.lineOaUrl`
- No new diagnostics API endpoint, no DOM probing, no Consent changes, no public runtime changes

## File map

| Path | Responsibility |
|------|----------------|
| `components/integrations/resolve-integration-diagnostics.ts` | Pure diagnostics resolver + types + status label helpers |
| `features/settings/integrations-diagnostics-panel.tsx` | Presentational Runtime Status + Warnings UI |
| `features/settings/integrations-form.tsx` | Mount panel; refresh diagnostics after successful save |
| `app/admin/settings/integrations/page.tsx` | Pass initial diagnostics (or settings for form to compute) |
| `tests/resolve-integration-diagnostics.test.ts` | Runtime matrix + warning codes |
| `tests/integrations-diagnostics-wiring.test.ts` | Static: page/form mounts panel |

---

### Task 1: resolveIntegrationDiagnostics + unit tests

**Files:**
- Create: `components/integrations/resolve-integration-diagnostics.ts`
- Create: `tests/resolve-integration-diagnostics.test.ts`

**Interfaces:**
- Consumes: `resolveTrackingConfiguration`, `resolveLineOaUrl`, `IntegrationSettings`
- Produces: `resolveIntegrationDiagnostics(settings): IntegrationDiagnostics` (+ exported types)

- [ ] **Step 1: Write failing tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveIntegrationDiagnostics } from "@/components/integrations/resolve-integration-diagnostics";
import type { IntegrationSettings } from "@/lib/integration-settings";

const empty: IntegrationSettings = {
  gaMeasurementId: "",
  gtmContainerId: "",
  metaPixelId: "",
  lineOaId: "",
};

describe("resolveIntegrationDiagnostics", () => {
  it("marks all channels inactive when empty", () => {
    const d = resolveIntegrationDiagnostics(empty);
    assert.deepEqual(d.runtime, {
      gtm: "inactive",
      ga4: "inactive",
      meta: "inactive",
      lineOa: "inactive",
    });
    assert.equal(d.warnings.length, 0);
  });

  it("marks GTM active and suppresses configured GA4", () => {
    const d = resolveIntegrationDiagnostics({
      ...empty,
      gtmContainerId: "GTM-TEST",
      gaMeasurementId: "G-TEST123",
    });
    assert.equal(d.runtime.gtm, "active");
    assert.equal(d.runtime.ga4, "suppressed");
    assert.equal(d.configured.gaMeasurementId, "G-TEST123");
    assert.equal(d.configured.gtmContainerId, "GTM-TEST");
  });

  it("marks GA4 active when only measurement id is set", () => {
    const d = resolveIntegrationDiagnostics({
      ...empty,
      gaMeasurementId: "G-ONLY",
    });
    assert.equal(d.runtime.ga4, "active");
    assert.equal(d.runtime.gtm, "inactive");
  });

  it("marks Meta and LINE independently active", () => {
    const d = resolveIntegrationDiagnostics({
      ...empty,
      metaPixelId: "123456789",
      lineOaId: "@thepaseo",
    });
    assert.equal(d.runtime.meta, "active");
    assert.equal(d.runtime.lineOa, "active");
    assert.equal(d.configured.lineOaId, "@thepaseo");
    assert.equal(d.resolved.lineOaUrl, "https://line.me/R/ti/p/@thepaseo");
  });

  it("emits format warnings with stable codes", () => {
    const d = resolveIntegrationDiagnostics({
      gaMeasurementId: "TEST123",
      gtmContainerId: "ABC123",
      metaPixelId: "abcde",
      lineOaId: "https://line.me/R/ti/p/@thepaseo",
    });
    const codes = d.warnings.map((w) => w.code).sort();
    assert.deepEqual(codes, [
      "GA4_FORMAT",
      "GTM_FORMAT",
      "LINE_OA_EXPECTED_ID",
      "META_FORMAT",
    ]);
    // LINE still active as prediction (identifier-only runtime)
    assert.equal(d.runtime.lineOa, "active");
  });

  it("does not warn on empty fields", () => {
    assert.equal(resolveIntegrationDiagnostics(empty).warnings.length, 0);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
node --import tsx --test tests/resolve-integration-diagnostics.test.ts
```

- [ ] **Step 3: Implement resolver**

Implement types + function per spec. Required behaviors:

```ts
import { resolveLineOaUrl } from "@/components/integrations/resolve-line-oa";
import { resolveTrackingConfiguration } from "@/components/integrations/resolve-tracking";
import type { IntegrationSettings } from "@/lib/integration-settings";

function configuredId(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function looksLikeLineUrl(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return /^https?:\/\//.test(v) || v.includes("line.me");
}

export function resolveIntegrationDiagnostics(settings: IntegrationSettings) {
  const tracking = resolveTrackingConfiguration(settings);
  const configuredGa = configuredId(settings.gaMeasurementId);
  const configuredGtm = configuredId(settings.gtmContainerId);
  const configuredMeta = configuredId(settings.metaPixelId);
  const lineOaUrl = resolveLineOaUrl(settings.lineOaId);

  // configured.lineOaId: normalized @id when non-empty (derive via same compact rules as resolveLineOaUrl)
  const lineCompact = (settings.lineOaId ?? "").trim().replace(/\s+/g, "");
  const configuredLine =
    lineCompact.length === 0
      ? null
      : lineCompact.startsWith("@")
        ? lineCompact
        : `@${lineCompact}`;

  const gtmActive = tracking.gtmContainerId !== null;
  const ga4Status = gtmActive
    ? configuredGa
      ? "suppressed"
      : "inactive"
    : tracking.gaMeasurementId
      ? "active"
      : "inactive";

  const warnings = [];
  if (configuredGa && !/^G-[A-Z0-9]+$/i.test(configuredGa)) {
    warnings.push({
      code: "GA4_FORMAT" as const,
      message: 'Expected a Measurement ID like "G-XXXXXXXX".',
    });
  }
  if (configuredGtm && !/^GTM-[A-Z0-9]+$/i.test(configuredGtm)) {
    warnings.push({
      code: "GTM_FORMAT" as const,
      message: 'Expected a Container ID like "GTM-XXXXXXX".',
    });
  }
  if (configuredMeta && !/^\d+$/.test(configuredMeta)) {
    warnings.push({
      code: "META_FORMAT" as const,
      message: "Meta Pixel IDs are usually numeric.",
    });
  }
  if (configuredId(settings.lineOaId) && looksLikeLineUrl(settings.lineOaId)) {
    warnings.push({
      code: "LINE_OA_EXPECTED_ID" as const,
      message:
        "Expected an OA identifier such as @thepaseo. The current value looks like a URL. Runtime will generate a URL from the value as entered.",
    });
  }

  return {
    runtime: {
      gtm: gtmActive ? "active" : "inactive",
      ga4: ga4Status,
      meta: tracking.metaPixelId ? "active" : "inactive",
      lineOa: lineOaUrl ? "active" : "inactive",
    },
    configured: {
      gtmContainerId: configuredGtm,
      gaMeasurementId: configuredGa,
      metaPixelId: configuredMeta,
      lineOaId: configuredLine,
    },
    resolved: { lineOaUrl },
    warnings,
  };
}
```

Also export a small label helper for the panel (optional in this task or Task 2):

```ts
export function runtimeStatusLabel(
  channel: "gtm" | "ga4" | "meta" | "lineOa",
  status: RuntimeChannelStatus,
): string {
  if (status === "active") return "Active";
  if (status === "inactive") return "Inactive";
  if (channel === "ga4") return "Suppressed by GTM";
  return "Suppressed";
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
node --import tsx --test tests/resolve-integration-diagnostics.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add components/integrations/resolve-integration-diagnostics.ts \
  tests/resolve-integration-diagnostics.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): add resolveIntegrationDiagnostics helper

EOF
)"
```

---

### Task 2: Diagnostics panel (presentational)

**Files:**
- Create: `features/settings/integrations-diagnostics-panel.tsx`

**Interfaces:**
- Consumes: `IntegrationDiagnostics`
- Produces: Runtime Status + Warnings UI (no fetch)

- [ ] **Step 1: Implement panel**

```tsx
import type { IntegrationDiagnostics } from "@/components/integrations/resolve-integration-diagnostics";
import { runtimeStatusLabel } from "@/components/integrations/resolve-integration-diagnostics";

type Props = {
  diagnostics: IntegrationDiagnostics;
};

export function IntegrationsDiagnosticsPanel({ diagnostics }: Props) {
  const { runtime, configured, resolved, warnings } = diagnostics;

  return (
    <section
      className="rounded-lg border border-black/10 bg-white p-4"
      aria-label="Runtime status"
    >
      <h2 className="text-sm font-semibold text-foreground">Runtime Status</h2>
      <p className="mt-1 text-xs text-muted">
        Predicted from saved settings. Does not verify that vendor scripts loaded successfully.
      </p>

      <ul className="mt-4 space-y-3 text-sm">
        <li>
          <p className="font-medium">Google Tag Manager — {runtimeStatusLabel("gtm", runtime.gtm)}</p>
          {configured.gtmContainerId ? (
            <p className="text-xs text-muted">Container: {configured.gtmContainerId}</p>
          ) : (
            <p className="text-xs text-muted">Not configured</p>
          )}
        </li>

        <li>
          <p className="font-medium">Google Analytics — {runtimeStatusLabel("ga4", runtime.ga4)}</p>
          {runtime.ga4 === "suppressed" ? (
            <p className="text-xs text-muted">
              Configured Measurement ID: {configured.gaMeasurementId}. Direct GA4 script will not be
              injected. Manage GA4 inside GTM.
            </p>
          ) : configured.gaMeasurementId ? (
            <p className="text-xs text-muted">Measurement ID: {configured.gaMeasurementId}</p>
          ) : (
            <p className="text-xs text-muted">Not configured</p>
          )}
        </li>

        <li>
          <p className="font-medium">Meta Pixel — {runtimeStatusLabel("meta", runtime.meta)}</p>
          {configured.metaPixelId ? (
            <p className="text-xs text-muted">Pixel ID: {configured.metaPixelId}</p>
          ) : (
            <p className="text-xs text-muted">Not configured</p>
          )}
        </li>

        <li>
          <p className="font-medium">LINE Official Account — {runtimeStatusLabel("lineOa", runtime.lineOa)}</p>
          {runtime.lineOa === "active" ? (
            <p className="text-xs text-muted">
              Floating button + footer link will be shown
              {resolved.lineOaUrl ? ` → ${resolved.lineOaUrl}` : ""}
            </p>
          ) : (
            <p className="text-xs text-muted">Not configured</p>
          )}
        </li>
      </ul>

      {warnings.length > 0 ? (
        <div className="mt-4 border-t border-black/10 pt-3">
          <h3 className="text-sm font-semibold text-foreground">Warnings</h3>
          <ul className="mt-2 space-y-1 text-xs text-amber-800">
            {warnings.map((w) => (
              <li key={w.code}>
                <span className="font-medium">{w.code}</span>: {w.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
```

Keep styling consistent with admin settings (border, muted text). Prefer text labels over color-only status.

- [ ] **Step 2: Commit**

```bash
git add features/settings/integrations-diagnostics-panel.tsx
git commit -m "$(cat <<'EOF'
feat(integrations): add Integrations diagnostics panel UI

EOF
)"
```

---

### Task 3: Wire page + form (saved load + post-save refresh)

**Files:**
- Modify: `app/admin/settings/integrations/page.tsx`
- Modify: `features/settings/integrations-form.tsx`
- Create: `tests/integrations-diagnostics-wiring.test.ts`

**Interfaces:**
- Page loads settings → computes initial diagnostics (or passes settings; form computes once)
- Form owns panel state; on successful PATCH, parse saved JSON → `resolveIntegrationDiagnostics(saved)` → setState

- [ ] **Step 1: Write failing wiring tests**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("integrations diagnostics wiring", () => {
  it("mounts IntegrationsDiagnosticsPanel from the form", () => {
    assert.match(
      read("features/settings/integrations-form.tsx"),
      /IntegrationsDiagnosticsPanel/,
    );
  });

  it("recomputes diagnostics from saved settings after save", () => {
    const source = read("features/settings/integrations-form.tsx");
    assert.match(source, /resolveIntegrationDiagnostics/);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
node --import tsx --test tests/integrations-diagnostics-wiring.test.ts
```

- [ ] **Step 3: Update form**

```tsx
import { useState } from "react";
import { resolveIntegrationDiagnostics } from "@/components/integrations/resolve-integration-diagnostics";
import type { IntegrationDiagnostics } from "@/components/integrations/resolve-integration-diagnostics";
import { IntegrationsDiagnosticsPanel } from "@/features/settings/integrations-diagnostics-panel";
import type { IntegrationSettings } from "@/lib/integration-settings";

interface IntegrationsFormProps {
  defaultValues: IntegrationFormValues;
  initialDiagnostics: IntegrationDiagnostics;
}

export function IntegrationsForm({ defaultValues, initialDiagnostics }: IntegrationsFormProps) {
  const [diagnostics, setDiagnostics] = useState(initialDiagnostics);
  // ...existing form state...

  const onSubmit = async (values: IntegrationFormValues) => {
    // ...existing fetch...
    if (!response.ok) { /* unchanged */ return; }

    const saved = (await response.json()) as IntegrationSettings;
    setDiagnostics(resolveIntegrationDiagnostics(saved));
    setIsSuccess(true);
    setServerMessage("Integrations settings saved.");
  };

  return (
    <form ...>
      <IntegrationsDiagnosticsPanel diagnostics={diagnostics} />
      {/* existing sections */}
    </form>
  );
}
```

Important: refresh diagnostics from **PATCH response body** (already returns saved integrations). Do **not** use unsaved form values.

- [ ] **Step 4: Update page**

```tsx
import { resolveIntegrationDiagnostics } from "@/components/integrations/resolve-integration-diagnostics";

const integrations = await getIntegrationSettings();
const diagnostics = resolveIntegrationDiagnostics(integrations);

<IntegrationsForm
  defaultValues={integrations}
  initialDiagnostics={diagnostics}
/>
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
node --import tsx --test \
  tests/resolve-integration-diagnostics.test.ts \
  tests/integrations-diagnostics-wiring.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add app/admin/settings/integrations/page.tsx \
  features/settings/integrations-form.tsx \
  tests/integrations-diagnostics-wiring.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): show runtime diagnostics on Integrations admin

EOF
)"
```

---

### Task 4: Lint + manual smoke + PR readiness

- [ ] **Step 1: Lint**

```bash
npx eslint \
  components/integrations/resolve-integration-diagnostics.ts \
  features/settings/integrations-diagnostics-panel.tsx \
  features/settings/integrations-form.tsx \
  app/admin/settings/integrations/page.tsx \
  tests/resolve-integration-diagnostics.test.ts \
  tests/integrations-diagnostics-wiring.test.ts
```

- [ ] **Step 2: Manual smoke on `/admin/settings/integrations`**

```txt
□ Empty settings → all Inactive, no warnings
□ GA4 only G-TEST123 → GA4 Active
□ GTM + GA4 → GTM Active, GA4 Suppressed + configured ID shown
□ Meta numeric → Active
□ LINE @thepaseo → Active + resolved URL shown
□ LINE https://line.me/... → Active prediction + LINE_OA_EXPECTED_ID warning
□ Bad GA4 TEST123 → GA4_FORMAT warning; Save still works
□ After Save → panel refreshes to saved state
□ No public runtime behavior change
```

- [ ] **Step 3: Push + PR**

**Title:** `feat(integrations): add runtime diagnostics summary on Integrations admin`

**Base:** current integrations / seo-completion line

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| `resolveIntegrationDiagnostics` + reuse tracking/LINE resolvers | Task 1 |
| Runtime matrix + warning codes | Task 1 |
| Summary panel + suppressed GA4 copy | Task 2 |
| Saved-only + post-save refresh | Task 3 |
| Soft only / no API block / prediction note | Global + Panel copy |
| Smoke + PR | Task 4 |
