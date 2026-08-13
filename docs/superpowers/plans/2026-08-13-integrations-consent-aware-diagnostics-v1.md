# Integrations Consent-aware Diagnostics V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a soft, predictive **Consent & Events** section to the Integrations admin diagnostics panel with session-only Analytics/Marketing simulation toggles and per-channel Would Fire / Blocked / Suppressed / Not Configured results.

**Architecture:** Pure `resolveConsentAwareDiagnostics(settings, simulation)` composes existing `resolveIntegrationDiagnostics` for runtime status, then applies consent simulation rules. UI extends `IntegrationsDiagnosticsPanel` with session React state for toggles (default both ON). No APIs, no persistence, no live tracking calls.

**Tech Stack:** Existing Integrations admin page/form, Diagnostics V1 resolver/panel, `node:test` + `tsx`

**Spec:** `docs/superpowers/specs/2026-08-13-integrations-consent-aware-diagnostics-v1-design.md`

## Global Constraints

- Predictive only: saved settings + runtime rules + simulation — **no** visitor telemetry / event warehouse
- Soft-only: never block Save / PATCH; never write consent storage; never fire gtag/fbq/dataLayer from admin
- Simulation defaults: `analytics=true`, `marketing=true`; session-only; disclaimer required
- Provider rows only (GTM / GA4 / Meta / LINE OA) — **no** event matrix / Run Test Event in V1
- Reason codes are source of truth; UI labels derived from a single `REASON_LABELS` map
- Do not import event-adapter statuses (`not_mapped`, `provider_missing`, `runtime_disabled`, `fired`) into diagnostics vocabulary
- LINE configured → `outside_consent` + Would Fire; Meta capability note: `form_submit → Lead`
- Reuse Runtime V1 GTM→GA4 suppression (`suppressed_by_gtm`)
- Do not change public Consent / Custom Events / Runtime injection behavior

## File map

| Path | Responsibility |
|------|----------------|
| `components/integrations/resolve-consent-aware-diagnostics.ts` | Types, `REASON_LABELS`, `resolveConsentAwareDiagnostics` |
| `tests/resolve-consent-aware-diagnostics.test.ts` | Pure matrix tests |
| `features/settings/integrations-diagnostics-panel.tsx` | Runtime Status + new Consent & Events section |
| `tests/integrations-diagnostics-wiring.test.ts` | Extend: Consent & Events + disclaimer + no telemetry API |
| `docs/superpowers/specs/2026-08-13-integrations-consent-aware-diagnostics-v1-pr-body.md` | PR packaging (Task 4) |

`integrations-form.tsx` / page may stay unchanged if panel owns simulation state and only receives `IntegrationDiagnostics` (or settings). Prefer panel receives `diagnostics` and derives consent-aware results internally via `resolveConsentAwareDiagnostics` needing **settings** — so either:

- Pass `settings: IntegrationSettings` into the panel in addition to `diagnostics`, **or**
- Pass only `settings` and let panel call both resolvers, **or**
- Have form pass `settings` snapshot used for `resolveIntegrationDiagnostics`

**Locked approach for this plan:** Panel props become:

```ts
type Props = {
  diagnostics: IntegrationDiagnostics;
  settings: IntegrationSettings;
};
```

Form/page already have settings — pass them through. Panel keeps simulation in `useState`.

---

### Task 1: `resolveConsentAwareDiagnostics` + unit tests

**Files:**
- Create: `components/integrations/resolve-consent-aware-diagnostics.ts`
- Create: `tests/resolve-consent-aware-diagnostics.test.ts`

**Interfaces:**
- Produces:

```ts
export type SimulatedConsent = {
  analytics: boolean;
  marketing: boolean;
};

export type ConsentAwareReasonCode =
  | "would_fire"
  | "consent_blocked"
  | "suppressed_by_gtm"
  | "not_configured"
  | "outside_consent";

export type ConsentAwareSimulationResult =
  | "would_fire"
  | "blocked"
  | "suppressed"
  | "not_configured";

export type ConsentAwareChannel =
  | "gtm"
  | "ga4"
  | "meta"
  | "lineOa";

export type ConsentAwareChannelResult = {
  channel: ConsentAwareChannel;
  configured: boolean;
  runtimeStatus: "active" | "inactive" | "suppressed";
  requiresConsent: "analytics" | "marketing" | "none";
  simulationResult: ConsentAwareSimulationResult;
  reasonCode: ConsentAwareReasonCode;
  capabilityNotes?: string[];
};

export type ConsentAwareDiagnostics = {
  simulation: SimulatedConsent;
  channels: ConsentAwareChannelResult[];
};

export const DEFAULT_SIMULATED_CONSENT: SimulatedConsent = {
  analytics: true,
  marketing: true,
};

export const REASON_LABELS: Record<ConsentAwareReasonCode, string> = {
  would_fire: "Would fire under simulated consent",
  consent_blocked: "Blocked by simulated consent",
  suppressed_by_gtm: "Suppressed because GTM is active",
  not_configured: "Not configured",
  outside_consent: "Outside consent (LINE OA surfaces)",
};

export function resolveConsentAwareDiagnostics(
  settings: IntegrationSettings,
  simulation: SimulatedConsent,
): ConsentAwareDiagnostics;
```

**Evaluation order (per channel, from spec):**

1. not configured → `not_configured`
2. GA4 + GTM runtime suppressed → `suppressed` / `suppressed_by_gtm`
3. LINE configured → `would_fire` / `outside_consent`
4. required consent off → `blocked` / `consent_blocked`
5. else → `would_fire` / `would_fire`

Compose via `resolveIntegrationDiagnostics(settings)` for `runtimeStatus` + configured flags.

Capability notes:

- Meta: `["Supported events: form_submit → Lead"]`
- LINE: `["line_oa_click → Analytics only; no Meta mapping"]`
- GTM/GA4 optional: `["Public custom events use analytics consent"]` (include for clarity)

- [ ] **Step 1: Write failing tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_SIMULATED_CONSENT,
  REASON_LABELS,
  resolveConsentAwareDiagnostics,
} from "@/components/integrations/resolve-consent-aware-diagnostics";
import type { IntegrationSettings } from "@/lib/integration-settings";

const empty: IntegrationSettings = {
  gaMeasurementId: "",
  gtmContainerId: "",
  metaPixelId: "",
  lineOaId: "",
};

function byChannel(
  d: ReturnType<typeof resolveConsentAwareDiagnostics>,
  channel: string,
) {
  const row = d.channels.find((c) => c.channel === channel);
  assert.ok(row, `missing ${channel}`);
  return row!;
}

describe("resolveConsentAwareDiagnostics", () => {
  it("defaults helper is both ON", () => {
    assert.deepEqual(DEFAULT_SIMULATED_CONSENT, {
      analytics: true,
      marketing: true,
    });
  });

  it("empty settings → all not_configured", () => {
    const d = resolveConsentAwareDiagnostics(empty, DEFAULT_SIMULATED_CONSENT);
    for (const ch of d.channels) {
      assert.equal(ch.simulationResult, "not_configured");
      assert.equal(ch.reasonCode, "not_configured");
    }
  });

  it("both ON: GTM+Meta+LINE would_fire; GA4 suppressed when GTM set", () => {
    const d = resolveConsentAwareDiagnostics(
      {
        ...empty,
        gtmContainerId: "GTM-TEST",
        gaMeasurementId: "G-TEST",
        metaPixelId: "123",
        lineOaId: "@paseo",
      },
      { analytics: true, marketing: true },
    );
    assert.equal(byChannel(d, "gtm").reasonCode, "would_fire");
    assert.equal(byChannel(d, "ga4").reasonCode, "suppressed_by_gtm");
    assert.equal(byChannel(d, "ga4").simulationResult, "suppressed");
    assert.equal(byChannel(d, "meta").reasonCode, "would_fire");
    assert.equal(byChannel(d, "lineOa").reasonCode, "outside_consent");
  });

  it("analytics OFF blocks GTM/GA4; Meta can still would_fire", () => {
    const d = resolveConsentAwareDiagnostics(
      {
        ...empty,
        gtmContainerId: "GTM-TEST",
        metaPixelId: "123",
      },
      { analytics: false, marketing: true },
    );
    assert.equal(byChannel(d, "gtm").reasonCode, "consent_blocked");
    assert.equal(byChannel(d, "meta").reasonCode, "would_fire");
  });

  it("marketing OFF blocks Meta; GTM can still would_fire", () => {
    const d = resolveConsentAwareDiagnostics(
      {
        ...empty,
        gtmContainerId: "GTM-TEST",
        metaPixelId: "123",
      },
      { analytics: true, marketing: false },
    );
    assert.equal(byChannel(d, "gtm").reasonCode, "would_fire");
    assert.equal(byChannel(d, "meta").reasonCode, "consent_blocked");
  });

  it("GA4 alone would_fire when analytics ON and no GTM", () => {
    const d = resolveConsentAwareDiagnostics(
      { ...empty, gaMeasurementId: "G-ONLY" },
      { analytics: true, marketing: true },
    );
    assert.equal(byChannel(d, "ga4").reasonCode, "would_fire");
  });

  it("Meta includes form_submit Lead capability note", () => {
    const d = resolveConsentAwareDiagnostics(
      { ...empty, metaPixelId: "123" },
      DEFAULT_SIMULATED_CONSENT,
    );
    const meta = byChannel(d, "meta");
    assert.ok(meta.capabilityNotes?.some((n) => /form_submit.*Lead/i.test(n)));
  });

  it("REASON_LABELS covers every reason code", () => {
    for (const code of [
      "would_fire",
      "consent_blocked",
      "suppressed_by_gtm",
      "not_configured",
      "outside_consent",
    ] as const) {
      assert.equal(typeof REASON_LABELS[code], "string");
      assert.ok(REASON_LABELS[code].length > 0);
    }
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
node --import tsx --test tests/resolve-consent-aware-diagnostics.test.ts
```

- [ ] **Step 3: Implement resolver**

Implement evaluation order exactly as spec. For GA4 suppressed case: even if analytics consent is OFF, still report `suppressed_by_gtm` (Runtime wins over consent for reason — per spec step 2 before consent check).

- [ ] **Step 4: Run — expect PASS**

```bash
node --import tsx --test tests/resolve-consent-aware-diagnostics.test.ts tests/resolve-integration-diagnostics.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add components/integrations/resolve-consent-aware-diagnostics.ts \
  tests/resolve-consent-aware-diagnostics.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): add consent-aware diagnostics resolver

EOF
)"
```

---

### Task 2: Extend diagnostics panel UI (Consent & Events)

**Files:**
- Modify: `features/settings/integrations-diagnostics-panel.tsx`
- Modify: `features/settings/integrations-form.tsx` (pass `settings`)
- Modify: `app/admin/settings/integrations/page.tsx` if props chain requires it
- Modify: `tests/integrations-diagnostics-wiring.test.ts`

**Interfaces:**
- Consumes: `resolveConsentAwareDiagnostics`, `DEFAULT_SIMULATED_CONSENT`, `REASON_LABELS`
- Panel props:

```ts
type Props = {
  diagnostics: IntegrationDiagnostics;
  settings: IntegrationSettings;
};
```

- Session state:

```ts
const [simulation, setSimulation] = useState<SimulatedConsent>(DEFAULT_SIMULATED_CONSENT);
const consentAware = resolveConsentAwareDiagnostics(settings, simulation);
```

**UI structure (same card or clear subsection below Runtime Status):**

1. Existing Runtime Status block (unchanged semantics)
2. Divider / heading **Consent & Events**
3. Disclaimer text: `Simulation only. Does not affect visitor consent or tracking.`
4. Two checkboxes/toggles: Analytics Consent, Marketing Consent (default ON)
5. For each channel in `consentAware.channels` (stable order: gtm, ga4, meta, lineOa):
   - Title (Google Tag Manager / Google Analytics / Meta Pixel / LINE Official Account)
   - Runtime status (reuse marker or short label from `runtimeStatus`)
   - Requires: Analytics / Marketing / None
   - Simulated result label from `simulationResult` + `REASON_LABELS[reasonCode]`
   - capabilityNotes if present

**Forbidden:**
- `trackEvent`, `gtag`, `fbq`, `dataLayer`
- writing `localStorage` consent keys
- Run Test Event buttons
- fetch visitor events APIs

- [ ] **Step 1: Extend wiring tests**

```ts
it("diagnostics panel includes Consent & Events simulation UI", () => {
  const source = read("features/settings/integrations-diagnostics-panel.tsx");
  assert.match(source, /Consent & Events/);
  assert.match(source, /Simulation only/);
  assert.match(source, /resolveConsentAwareDiagnostics/);
  assert.match(source, /DEFAULT_SIMULATED_CONSENT/);
  assert.doesNotMatch(source, /trackEvent\(/);
  assert.doesNotMatch(source, /fbq\(|gtag\(/);
  assert.doesNotMatch(source, /Run Test Event/);
});

it("form passes settings into diagnostics panel", () => {
  const form = read("features/settings/integrations-form.tsx");
  assert.match(form, /IntegrationsDiagnosticsPanel/);
  assert.match(form, /settings=\{/);
});
```

- [ ] **Step 2: Implement panel + prop wiring**

Keep panel as client component if toggles need state — if currently server-safe, add `"use client"` at top when introducing `useState`.

Check current file: no `"use client"` today. **Add `"use client"`** because of simulation state.

- [ ] **Step 3: Run tests**

```bash
node --import tsx --test \
  tests/resolve-consent-aware-diagnostics.test.ts \
  tests/integrations-diagnostics-wiring.test.ts
```

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(integrations): add Consent & Events simulation to diagnostics panel

EOF
)"
```

---

### Task 3: Soft invariants + regression wiring guards

**Files:**
- Modify: `tests/integrations-diagnostics-wiring.test.ts` (additional guards)
- Touch resolver/panel only if gaps found

**Guards to lock:**

```ts
it("does not introduce consent storage writes in diagnostics panel", () => {
  const source = read("features/settings/integrations-diagnostics-panel.tsx");
  assert.doesNotMatch(source, /integration-consent-v1/);
  assert.doesNotMatch(source, /writeStoredConsent|localStorage\.setItem/);
});

it("integrations page remains soft (no save blocking from consent diagnostics)", () => {
  const form = read("features/settings/integrations-form.tsx");
  // still saves via existing PATCH path; no throw on consent simulation
  assert.match(form, /handleSubmit/);
  assert.doesNotMatch(form, /resolveConsentAwareDiagnostics\([\s\S]*throw/);
});

it("admin layout still has no public EventsDebugPanel", () => {
  assert.doesNotMatch(read("app/admin/layout.tsx"), /EventsDebugPanel/);
});
```

Re-run Diagnostics V1 + Consent-aware resolver tests to ensure no regression.

- [ ] **Step 1: Add guards + run full related suites**

```bash
node --import tsx --test \
  tests/resolve-consent-aware-diagnostics.test.ts \
  tests/resolve-integration-diagnostics.test.ts \
  tests/integrations-diagnostics-wiring.test.ts
```

- [ ] **Step 2: Commit if tests/docs-only changes; otherwise skip empty commit**

```bash
git add tests/integrations-diagnostics-wiring.test.ts
git commit -m "$(cat <<'EOF'
test(integrations): lock soft consent-aware diagnostics invariants

EOF
)"
```

---

### Task 4: Lint + smoke checklist + PR body

**Files:**
- Create: `docs/superpowers/specs/2026-08-13-integrations-consent-aware-diagnostics-v1-pr-body.md`

- [ ] **Step 1: Lint**

```bash
npx eslint \
  components/integrations/resolve-consent-aware-diagnostics.ts \
  features/settings/integrations-diagnostics-panel.tsx \
  features/settings/integrations-form.tsx \
  app/admin/settings/integrations/page.tsx
```

- [ ] **Step 2: Full related tests**

```bash
node --import tsx --test \
  tests/resolve-consent-aware-diagnostics.test.ts \
  tests/resolve-integration-diagnostics.test.ts \
  tests/integrations-diagnostics-wiring.test.ts
```

- [ ] **Step 3: Manual smoke (human)**

```txt
□ Default both ON → Would Fire (GA4 Suppressed if GTM+GA4)
□ Marketing OFF → Meta Blocked consent_blocked
□ Analytics OFF → GTM/GA4 Blocked; Meta Would Fire if marketing ON
□ LINE → outside_consent
□ Meta note form_submit → Lead
□ Save still works
□ Public consent localStorage unchanged
□ No EventsDebugPanel on /admin
```

- [ ] **Step 4: PR body + commit + push**

**Title:** `feat(integrations): add consent-aware diagnostics simulation on Integrations admin`

**Base:** `feat/seo-completion-v1` (or current trunk after Custom Events merges — prefer branch off latest trunk)

```bash
git commit -m "$(cat <<'EOF'
docs(integrations): add Consent-aware Diagnostics V1 PR body

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Pure resolver + reason codes + REASON_LABELS | Task 1 |
| Compose Diagnostics V1 / GTM suppress GA4 | Task 1 |
| LINE outside_consent + Meta Lead note | Task 1 |
| Panel Consent & Events + toggles + disclaimer | Task 2 |
| Pass settings; session defaults both ON | Task 2 |
| Soft invariants / no telemetry / no live track | Task 3 |
| Lint + smoke + PR | Task 4 |

## Out of scope

```txt
Run Test Event
Event matrix rows
Visitor telemetry APIs
Save blocking
Public runtime/consent changes
```
