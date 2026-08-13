# Integrations Custom Events V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a code-only `trackEvent()` runtime with runtime-aware adapters (GTM XOR Direct GA4, Meta independent), adapter-layer consent, B-minimal Meta `Lead` mapping, three public call sites, and a flag-gated client debug ring.

**Architecture:** Client-only event pipeline under `components/integrations/events/`. `TrackingConfigLoader` also mounts `EventRuntimeProvider` with the same resolved IDs passed to tracking scripts (IDs always available for adapter resolve, even when consent blocks script mount). `trackEvent` validates catalog → resolves adapters → each adapter checks consent / mapping / provider → fail-soft. UI never calls `gtag` / `fbq` / `dataLayer` directly.

**Tech Stack:** Next.js App Router, existing ConsentProvider + consent-gates, Runtime providers (`gtm-bootstrap` / `ga4-*` / `meta-pixel`), `node:test` + `tsx`

**Spec:** `docs/superpowers/specs/2026-08-12-integrations-custom-events-v1-design.md`

## Global Constraints

- Code-only catalog; snake_case event names only
- Single entry: `trackEvent(...)` — no direct provider calls from UI
- Analytics transport invariant: **GTM active → dataLayer only; never also gtag**. GTM inactive + GA4 active → gtag only
- Meta independent; V1 map **only** `form_submit` → `Lead` (no `trackCustom`)
- Consent checked at **adapter layer** (analytics vs marketing); no-op when blocked
- `unknown_event` is **event-level** (before adapters); not an adapter status
- `page_view` catalog only — **no auto-fire**, no layout/route wiring
- Wire only: `line_oa_click`, `phone_click`, `form_submit` (**success path only**)
- Debug: in-memory ring (30 events), flag `integration-events-debug=1` and/or `?eventsDebug=1`; not Admin Diagnostics
- Fail-soft everywhere; never throw into UI
- Do not change Diagnostics resolvers, Consent storage model, or Runtime ID resolution rules

## File map

| Path | Responsibility |
|------|----------------|
| `components/integrations/events/types.ts` | Event names, payload map, debug types, runtime config type |
| `components/integrations/events/catalog.ts` | `isCatalogEvent(name)`, `EVENT_NAMES` |
| `components/integrations/events/debug-ring.ts` | Ring buffer + debug flag helpers |
| `components/integrations/events/track-event.ts` | `trackEvent` orchestration |
| `components/integrations/events/event-runtime-context.tsx` | Provider: resolved IDs + consent snapshot helpers for adapters |
| `components/integrations/events/adapters/types.ts` | Adapter interface + result status union |
| `components/integrations/events/adapters/resolve-adapters.ts` | GTM XOR GA4 + Meta selection from runtime config |
| `components/integrations/events/adapters/gtm.ts` | `dataLayer.push` |
| `components/integrations/events/adapters/ga4.ts` | `gtag('event', ...)` |
| `components/integrations/events/adapters/meta.ts` | `fbq('track', 'Lead')` for `form_submit` only |
| `components/integrations/events/debug-panel.tsx` | Flag-gated UI panel |
| `components/integrations/events/tracked-phone-link.tsx` | Client `tel:` link that fires `phone_click` |
| `components/integrations/tracking-config-loader.tsx` | Also mount EventRuntimeProvider + DebugPanel |
| `components/integrations/line-floating-button.tsx` | `line_oa_click` surface=floating |
| `components/integrations/line-footer-link.tsx` | `line_oa_click` surface=footer |
| `features/layout/site-footer.tsx` | Use TrackedPhoneLink for tel hrefs |
| `features/branches/shared/branch-contact.tsx` | Use TrackedPhoneLink (`branch_card`) |
| `features/leasing/leasing-form.tsx` | `form_submit` on **success** only (`formId: "leasing"`) |
| `tests/events-catalog.test.ts` | Catalog + unknown handling |
| `tests/events-resolve-adapters.test.ts` | GTM XOR GA4 + Meta presence |
| `tests/events-meta-map.test.ts` | Meta map / not_mapped |
| `tests/events-wiring.test.ts` | Static wiring guards |

---

### Task 1: Types, catalog, debug ring, trackEvent core + tests

**Files:**
- Create: `components/integrations/events/types.ts`
- Create: `components/integrations/events/catalog.ts`
- Create: `components/integrations/events/debug-ring.ts`
- Create: `components/integrations/events/track-event.ts`
- Create: `tests/events-catalog.test.ts`

**Interfaces:**
- Produces:
  - `EventName`, `EventPayloadMap`, `TrackEventArgs`
  - `isCatalogEvent(name: string): name is EventName`
  - `DEBUG_FLAG_KEY = "integration-events-debug"`
  - `isEventsDebugEnabled(): boolean`
  - `pushDebugEvent(entry: DebugEvent): void`
  - `getDebugEvents(): DebugEvent[]`
  - `clearDebugEvents(): void` (tests)
  - `trackEvent<E extends EventName>(name: E, ...args: EventPayloadMap[E] extends undefined ? [] | [undefined] : [EventPayloadMap[E]]): void`
  - For unknown string at runtime: if not in catalog → push debug `{ name, timestamp, status: "unknown_event" }` and return (no adapters)

**Note:** In Task 1, `trackEvent` may resolve zero adapters (stub `dispatch` that only handles unknown + records a minimal debug entry when flag on). Full adapter dispatch lands in Task 2 — but unknown_event behavior must be complete here.

- [ ] **Step 1: Write failing catalog / unknown-event tests**

```ts
import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { isCatalogEvent } from "@/components/integrations/events/catalog";
import {
  clearDebugEvents,
  getDebugEvents,
  pushDebugEvent,
} from "@/components/integrations/events/debug-ring";
import { trackEvent } from "@/components/integrations/events/track-event";

describe("catalog", () => {
  it("accepts snake_case catalog names", () => {
    assert.equal(isCatalogEvent("phone_click"), true);
    assert.equal(isCatalogEvent("form_submit"), true);
    assert.equal(isCatalogEvent("page_view"), true);
  });

  it("rejects unknown names", () => {
    assert.equal(isCatalogEvent("phone_clik"), false);
    assert.equal(isCatalogEvent("PhoneClick"), false);
  });
});

describe("trackEvent unknown", () => {
  beforeEach(() => {
    clearDebugEvents();
    // Force debug on for tests
    (globalThis as { localStorage?: Storage }).localStorage = {
      getItem: (k: string) => (k === "integration-events-debug" ? "1" : null),
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  });

  it("unknown event is no-op with event-level unknown_event and no adapters", () => {
    trackEvent("phone_clik" as "phone_click");
    const events = getDebugEvents();
    assert.equal(events.length, 1);
    assert.equal(events[0]?.status, "unknown_event");
    assert.equal(events[0]?.adapters, undefined);
  });
});

describe("debug ring", () => {
  beforeEach(() => clearDebugEvents());

  it("keeps at most 30 events", () => {
    for (let i = 0; i < 35; i++) {
      pushDebugEvent({ name: `e_${i}`, timestamp: i });
    }
    assert.equal(getDebugEvents().length, 30);
    assert.equal(getDebugEvents()[0]?.name, "e_5");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
node --import tsx --test tests/events-catalog.test.ts
```

Expected: FAIL (modules missing)

- [ ] **Step 3: Implement types, catalog, debug-ring, trackEvent stub**

`types.ts` (core):

```ts
export type EventName =
  | "page_view"
  | "phone_click"
  | "email_click"
  | "contact_click"
  | "line_oa_click"
  | "form_submit";

export type PhoneClickPayload = {
  location?: "footer" | "branch_card" | "directory";
};

export type LineOaClickPayload = {
  surface: "floating" | "footer";
};

export type FormSubmitPayload = {
  formId: string;
};

export type EventPayloadMap = {
  phone_click: PhoneClickPayload;
  line_oa_click: LineOaClickPayload;
  form_submit: FormSubmitPayload;
  email_click: undefined;
  contact_click: undefined;
  page_view: undefined;
};

export type DebugAdapterStatus =
  | "fired"
  | "not_mapped"
  | "consent_blocked"
  | "provider_missing"
  | "runtime_disabled";

export type DebugAdapterResult = {
  adapter: "gtm" | "ga4" | "meta";
  status: DebugAdapterStatus;
  reason?: string;
};

export type DebugEvent = {
  name: string;
  timestamp: number;
  payload?: unknown;
  status?: "unknown_event";
  consent?: { analytics: boolean; marketing: boolean };
  adapters?: DebugAdapterResult[];
};

export type EventRuntimeConfig = {
  gtmContainerId: string | null;
  gaMeasurementId: string | null;
  metaPixelId: string | null;
};
```

`track-event.ts` Task 1 behavior:

```ts
export function trackEvent(name: string, payload?: unknown): void {
  if (!isCatalogEvent(name)) {
    if (isEventsDebugEnabled()) {
      pushDebugEvent({ name, timestamp: Date.now(), payload, status: "unknown_event" });
    }
    return;
  }
  // Task 2: dispatch adapters. Task 1: optional debug record with empty adapters when flag on.
  if (isEventsDebugEnabled()) {
    pushDebugEvent({ name, timestamp: Date.now(), payload, adapters: [] });
  }
}
```

Export a typed overload wrapper if practical; runtime entry may accept `string` for unknown_event tests.

- [ ] **Step 4: Run tests — expect PASS**

```bash
node --import tsx --test tests/events-catalog.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add components/integrations/events/types.ts \
  components/integrations/events/catalog.ts \
  components/integrations/events/debug-ring.ts \
  components/integrations/events/track-event.ts \
  tests/events-catalog.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): add custom events catalog and trackEvent core

EOF
)"
```

---

### Task 2: Adapters + resolve (GTM XOR GA4) + Meta map + consent + trackEvent dispatch

**Files:**
- Create: `components/integrations/events/adapters/types.ts`
- Create: `components/integrations/events/adapters/resolve-adapters.ts`
- Create: `components/integrations/events/adapters/gtm.ts`
- Create: `components/integrations/events/adapters/ga4.ts`
- Create: `components/integrations/events/adapters/meta.ts`
- Create: `components/integrations/events/event-runtime-context.tsx`
- Modify: `components/integrations/events/track-event.ts`
- Create: `tests/events-resolve-adapters.test.ts`
- Create: `tests/events-meta-map.test.ts`

**Interfaces:**
- Consumes: `EventRuntimeConfig`, `canLoadAnalytics` / `canLoadMarketing`, `StoredConsent` / consent from context
- Produces:
  - `resolveAdapters(config: EventRuntimeConfig): Array<"gtm" | "ga4" | "meta">`
    - If `config.gtmContainerId` → include `"gtm"`, **do not** include `"ga4"` even if ga id somehow present
    - Else if `config.gaMeasurementId` → include `"ga4"`
    - If `config.metaPixelId` → include `"meta"`
  - Each adapter `dispatch({ name, payload, consent, config }): DebugAdapterResult`
  - `EventRuntimeProvider` + `useEventRuntime(): { config: EventRuntimeConfig; getConsent(): StoredConsent }`
  - `trackEvent` uses runtime context when available; if called outside provider → treat transports as missing / skip safely (no throw)

**Consent order inside each adapter:**

1. Meta only: if name not in `META_EVENT_MAP` → `not_mapped`
2. If consent gate fails → `consent_blocked`
3. If config id null OR global (`dataLayer` / `gtag` / `fbq`) missing → `provider_missing`
4. Else fire → `fired` (wrap in try/catch; on error skip without throw)

**Meta map:**

```ts
export const META_EVENT_MAP = {
  form_submit: "Lead",
} as const;
```

**GTM fire:** `window.dataLayer.push({ event: name, ...payload fields flattened carefully })`  
**GA4 fire:** `window.gtag("event", name, payloadObject)`  
**Meta fire:** `window.fbq("track", "Lead")` for form_submit only

- [ ] **Step 1: Write failing resolve + meta tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveAdapters } from "@/components/integrations/events/adapters/resolve-adapters";
import { META_EVENT_MAP } from "@/components/integrations/events/adapters/meta";

describe("resolveAdapters", () => {
  it("prefers GTM and excludes GA4 when both configured", () => {
    assert.deepEqual(
      resolveAdapters({
        gtmContainerId: "GTM-X",
        gaMeasurementId: "G-X", // should be ignored by invariant even if passed
        metaPixelId: null,
      }),
      ["gtm"],
    );
  });

  it("uses GA4 when GTM absent", () => {
    assert.deepEqual(
      resolveAdapters({
        gtmContainerId: null,
        gaMeasurementId: "G-X",
        metaPixelId: null,
      }),
      ["ga4"],
    );
  });

  it("includes meta independently", () => {
    assert.deepEqual(
      resolveAdapters({
        gtmContainerId: "GTM-X",
        gaMeasurementId: null,
        metaPixelId: "123",
      }),
      ["gtm", "meta"],
    );
  });
});

describe("META_EVENT_MAP", () => {
  it("maps only form_submit to Lead", () => {
    assert.equal(META_EVENT_MAP.form_submit, "Lead");
    assert.equal(Object.keys(META_EVENT_MAP).length, 1);
  });
});
```

Also add a unit test that meta adapter returns `not_mapped` for `phone_click` and `consent_blocked` when marketing false (pure function test with injected consent + fake config; stub window if needed).

- [ ] **Step 2: Run — expect FAIL**

```bash
node --import tsx --test tests/events-resolve-adapters.test.ts tests/events-meta-map.test.ts
```

- [ ] **Step 3: Implement adapters + context + wire trackEvent dispatch**

`resolve-adapters.ts`:

```ts
export function resolveAdapters(config: EventRuntimeConfig): Array<"gtm" | "ga4" | "meta"> {
  const out: Array<"gtm" | "ga4" | "meta"> = [];
  if (config.gtmContainerId) {
    out.push("gtm");
  } else if (config.gaMeasurementId) {
    out.push("ga4");
  }
  if (config.metaPixelId) {
    out.push("meta");
  }
  return out;
}
```

`EventRuntimeProvider`: client provider holding `config`. Expose `useEventRuntime()`. Consent: call `useConsent()` inside provider or inside `trackEvent` via a getter registered on mount — prefer `trackEvent` reading from a module-level runtime ref set by the provider (`setEventRuntime(...)`) so call sites stay sync and non-hook.

Recommended pattern (keeps `trackEvent` callable from click handlers without hooks):

```ts
// event-runtime-context.tsx
let runtimeRef: { config: EventRuntimeConfig; consent: StoredConsent } | null = null;

export function EventRuntimeProvider({ config, children }) {
  const { consent } = useConsent();
  useEffect(() => {
    runtimeRef = { config, consent };
    return () => { runtimeRef = null; };
  }, [config, consent]);
  // also update ref synchronously during render for same-tick clicks:
  runtimeRef = { config, consent };
  return children;
}

export function getEventRuntime() {
  return runtimeRef;
}
```

Then `trackEvent` uses `getEventRuntime()`, `resolveAdapters`, runs adapters, pushes debug when flag on (include consent snapshot + adapter results). Always record debug when flag on, including fired paths.

- [ ] **Step 4: Run tests — expect PASS**

```bash
node --import tsx --test \
  tests/events-catalog.test.ts \
  tests/events-resolve-adapters.test.ts \
  tests/events-meta-map.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add components/integrations/events \
  tests/events-resolve-adapters.test.ts \
  tests/events-meta-map.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): add runtime-aware event adapters with consent

EOF
)"
```

---

### Task 3: Debug panel + mount EventRuntime in TrackingConfigLoader

**Files:**
- Create: `components/integrations/events/debug-panel.tsx`
- Modify: `components/integrations/tracking-config-loader.tsx`
- Modify: `tests/events-wiring.test.ts` (create)
- Modify: `tests/consent-wiring.test.ts` only if needed (do not break existing asserts)

**Interfaces:**
- Consumes: `getDebugEvents`, `isEventsDebugEnabled`, EventRuntimeProvider
- Produces: `EventsDebugPanel` visible only when debug enabled
- `TrackingConfigLoader` structure:

```tsx
export async function TrackingConfigLoader() {
  let settings;
  try {
    settings = await getIntegrationSettings();
  } catch {
    return null;
  }
  const config = resolveTrackingConfiguration(settings);
  return (
    <EventRuntimeProvider
      config={{
        gtmContainerId: config.gtmContainerId,
        gaMeasurementId: config.gaMeasurementId,
        metaPixelId: config.metaPixelId,
      }}
    >
      <ConsentAwareTrackingScripts
        gtmContainerId={config.gtmContainerId}
        gaMeasurementId={config.gaMeasurementId}
        metaPixelId={config.metaPixelId}
      />
      <EventsDebugPanel />
    </EventRuntimeProvider>
  );
}
```

**Debug flag:** `isEventsDebugEnabled()` true when `localStorage.integration-events-debug === "1"` OR (client) URL has `eventsDebug=1`. On detecting query flag, may set localStorage for persistence (optional, document in code comment).

Panel: fixed small list of last events; no search/filter/export. Not mounted in admin layouts.

- [ ] **Step 1: Write wiring test**

```ts
it("TrackingConfigLoader mounts EventRuntimeProvider and EventsDebugPanel", () => {
  const source = read("components/integrations/tracking-config-loader.tsx");
  assert.match(source, /EventRuntimeProvider/);
  assert.match(source, /EventsDebugPanel/);
  assert.match(source, /ConsentAwareTrackingScripts/);
});

it("does not auto-fire page_view in locale layout", () => {
  const layout = read("app/[locale]/layout.tsx");
  assert.doesNotMatch(layout, /trackEvent\(\s*["']page_view["']/);
});
```

- [ ] **Step 2: Implement panel + loader wiring**

- [ ] **Step 3: Run tests**

```bash
node --import tsx --test tests/events-wiring.test.ts tests/consent-wiring.test.ts
```

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(integrations): mount event runtime and flag-gated debug panel

EOF
)"
```

---

### Task 4: Wire `line_oa_click` + `phone_click`

**Files:**
- Modify: `components/integrations/line-floating-button.tsx` → client component with `onClick={() => trackEvent("line_oa_click", { surface: "floating" })}`
- Modify: `components/integrations/line-footer-link.tsx` → same with `surface: "footer"`
- Create: `components/integrations/events/tracked-phone-link.tsx`
- Modify: `features/layout/site-footer.tsx` — replace tel `<a>` with `<TrackedPhoneLink location="footer" href=...>`
- Modify: `features/branches/shared/branch-contact.tsx` — `location="branch_card"`
- Modify: `tests/events-wiring.test.ts` — assert trackEvent / TrackedPhoneLink usage

**Do not** wire every `tel:` in the repo (about/location/store/leasing-branches stay unwired in V1 unless already using `branch-contact`). Spec B-minimal = shared high-reuse surfaces: footer + branch-contact.

`TrackedPhoneLink`:

```tsx
"use client";
export function TrackedPhoneLink({
  href,
  location,
  className,
  children,
}: {
  href: string;
  location?: "footer" | "branch_card" | "directory";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => trackEvent("phone_click", { location })}
    >
      {children}
    </a>
  );
}
```

LINE buttons: add `"use client"` if not already; keep markup; add onClick track.

- [ ] **Step 1: Extend wiring tests for LINE + phone**

```ts
it("LINE surfaces call trackEvent line_oa_click", () => {
  assert.match(read("components/integrations/line-floating-button.tsx"), /line_oa_click/);
  assert.match(read("components/integrations/line-footer-link.tsx"), /line_oa_click/);
});

it("footer and branch-contact use TrackedPhoneLink", () => {
  assert.match(read("features/layout/site-footer.tsx"), /TrackedPhoneLink/);
  assert.match(read("features/branches/shared/branch-contact.tsx"), /TrackedPhoneLink/);
});
```

- [ ] **Step 2: Implement wiring**

- [ ] **Step 3: Run tests + commit**

```bash
node --import tsx --test tests/events-wiring.test.ts tests/line-oa-surfaces-wiring.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): wire line_oa_click and phone_click call sites

EOF
)"
```

---

### Task 5: Wire `form_submit` on leasing success path

**Files:**
- Modify: `features/leasing/leasing-form.tsx`
- Modify: `tests/events-wiring.test.ts`

**Critical:** call `trackEvent` only after successful response — beside `setSubmitState("success")`, **not** on button click / not on validation failure / not on API error.

```ts
if (!response.ok) {
  // error path — do NOT track
  ...
  return;
}

trackEvent("form_submit", { formId: "leasing" });
setSubmitState("success");
```

- [ ] **Step 1: Wiring test**

```ts
it("leasing form tracks form_submit only on success path", () => {
  const source = read("features/leasing/leasing-form.tsx");
  assert.match(source, /trackEvent\(\s*["']form_submit["']/);
  assert.match(source, /formId:\s*["']leasing["']/);
  // Ensure track is not in the early error return block only — assert success proximity:
  assert.match(source, /trackEvent\([\s\S]*form_submit[\s\S]*setSubmitState\(\s*["']success["']/);
});
```

(If regex too brittle, assert `trackEvent("form_submit"` exists and `setSubmitState("error")` block does not contain `trackEvent`.)

- [ ] **Step 2: Implement + run tests + commit**

```bash
git commit -m "$(cat <<'EOF'
feat(integrations): fire form_submit on leasing success for Meta Lead

EOF
)"
```

---

### Task 6: Lint + full test suite + smoke checklist + PR body

**Files:**
- Create: `docs/superpowers/specs/2026-08-12-integrations-custom-events-v1-pr-body.md`
- Touch only as needed for lint fixes

- [ ] **Step 1: Lint touched files**

```bash
npx eslint components/integrations/events \
  components/integrations/tracking-config-loader.tsx \
  components/integrations/line-floating-button.tsx \
  components/integrations/line-footer-link.tsx \
  features/layout/site-footer.tsx \
  features/branches/shared/branch-contact.tsx \
  features/leasing/leasing-form.tsx
```

- [ ] **Step 2: Run all related tests**

```bash
node --import tsx --test \
  tests/events-catalog.test.ts \
  tests/events-resolve-adapters.test.ts \
  tests/events-meta-map.test.ts \
  tests/events-wiring.test.ts \
  tests/consent-wiring.test.ts \
  tests/consent-gates.test.ts \
  tests/integrations-runtime-wiring.test.ts \
  tests/line-oa-surfaces-wiring.test.ts
```

Expected: all PASS

- [ ] **Step 3: Manual smoke checklist (human)**

```txt
□ Enable debug: localStorage.integration-events-debug=1 ; reload
□ line_oa floating/footer → debug shows ga4|gtm fired; meta not_mapped
□ phone_click footer → analytics fired; meta not_mapped
□ leasing form success → analytics fired; meta Lead fired (marketing on)
□ marketing off → meta consent_blocked; analytics can still fire
□ analytics off → gtm/ga4 consent_blocked
□ unknown via console trackEvent("nope") → unknown_event; no adapters
□ GTM+GA4 saved → only gtm adapter present (no ga4 double)
□ /admin → no EventsDebugPanel / no public event wiring required
□ No new console errors
```

- [ ] **Step 4: Write PR body + commit docs**

Title: `feat(integrations): add custom event runtime with consent-aware adapters`

- [ ] **Step 5: Push branch / open PR against `feat/seo-completion-v1` (or current integrations trunk)**

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Code-only catalog + snake_case | Task 1 |
| `trackEvent` single entry + unknown_event event-level | Task 1 |
| Typed payloads (types) | Task 1 |
| Runtime-aware adapters + GTM XOR GA4 | Task 2 |
| Consent at adapter layer | Task 2 |
| Meta `form_submit` → Lead only | Task 2 |
| Debug ring | Task 1 |
| Debug panel + flag | Task 3 |
| EventRuntime mount with resolved IDs | Task 3 |
| No auto page_view | Task 3 (wiring guard) |
| `line_oa_click` + `phone_click` | Task 4 |
| `form_submit` success-only | Task 5 |
| Fail-soft / lint / smoke / PR | Task 6 |

## Out of scope (do not implement)

```txt
email_click / contact_click wiring
auto page_view
CMS registry
Admin diagnostics event stream
trackCustom / dynamic Meta maps
Global click delegation
```
