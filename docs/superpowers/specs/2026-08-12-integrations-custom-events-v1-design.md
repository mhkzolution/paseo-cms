# Integrations Custom Events V1 Design

**Date:** 2026-08-12  
**Status:** Final Spec — ready for implementation plan  

**Depends on:** Integrations Platform V1 (Runtime + LINE OA Surfaces + Diagnostics + Consent / PDPA)  
**Scope:** Code-only event catalog + `trackEvent()` + runtime-aware adapters + minimal public call-site wiring + client debug ring

## Goal

Prove end-to-end that public **interaction events** can be sent through a single API:

```txt
UI Action
  → trackEvent()
  → runtime-aware adapters
  → GTM / GA4 / Meta (when allowed)
```

while reusing Consent gates and Runtime transport rules, and remaining **debuggable** without Admin Diagnostics.

Success criteria:

```txt
✓ Events fire for real call sites
✓ Consent blocks/allows correctly
✓ Provider runtime receives events (no double-count)
✓ Debug ring explains fired vs skipped + reason
```

## Architecture

**Approach — Single `trackEvent` entry + adapter fan-out**

```txt
UI call site
  → trackEvent(name, payload?)
  → catalog check
       unknown → no-op + event-level debug status unknown_event
                 (does NOT enter adapter pipeline)
  → resolve active adapters (runtime-aware)
  → each adapter:
        consent check (adapter layer)
        map / dispatch OR skip with adapter status reason
  → debug ring (when debug flag enabled)
```

UI components must **not** call `gtag` / `fbq` / `dataLayer` directly. All tracking goes through `trackEvent(...)`.

### Module layout (proposed)

Prefer colocation with existing integrations under `components/integrations/` (repo has no `lib/integrations` today):

```txt
components/integrations/events/
├── types.ts
├── catalog.ts
├── track-event.ts
├── debug-ring.ts
├── debug-panel.tsx
└── adapters/
    ├── types.ts
    ├── resolve-adapters.ts
    ├── gtm.ts
    ├── ga4.ts
    └── meta.ts
```

Exact paths may be adjusted in the implementation plan to match import conventions; responsibilities stay the same.

There is **no** LINE event adapter. LINE is a **call site** (`line_oa_click`) that fans out to analytics transports only.

## Decisions

| # | Topic | Choice |
|---|-------|--------|
| 1 | Event source | **Code-only catalog** (no CMS registry) |
| 2 | Delivery | **Runtime-aware adapters** |
| 3 | Consent | Checked at **adapter layer**; Meta uses marketing consent; `line_oa_click` does not map to Meta |
| 4 | Meta mapping | **B-minimal:** `form_submit` → `Lead` only |
| 5 | `page_view` | Catalog only — **no auto-fire** |
| 6 | Call sites | **B-minimal:** wire `line_oa_click`, `phone_click`, `form_submit` |
| 7 | Debug | Client **debug ring** + flag-gated panel (not Admin Diagnostics) |
| 8 | Payloads | **Typed per wired event** |

### Naming convention

```txt
snake_case only
```

Examples: `page_view`, `phone_click`, `line_oa_click`, `form_submit`  
Avoid mixed styles (`PhoneClick`, `phoneClick`, `phone-click`).

## Non-Goals

```txt
No CMS Event Registry / Event Builder / Rules Engine
No auto page_view / SPA virtual pageviews
No document-level click delegation / global interception
No Admin Diagnostics event stream (future Consent-aware Diagnostics epic)
No Zod / schema_version / event_version / dynamic custom_properties
No Meta trackCustom or dynamic Meta mapping
No admin configuration for event maps
No wiring email_click / contact_click in V1
No LINE provider event adapter
```

---

## 1. Catalog

```ts
type EventName =
  | "page_view"
  | "phone_click"
  | "email_click"
  | "contact_click"
  | "line_oa_click"
  | "form_submit";
```

| Event | In catalog | Wired in V1 | Notes |
|-------|------------|-------------|-------|
| `page_view` | ✅ | ❌ | Manual/test only; Runtime owns base page impressions |
| `phone_click` | ✅ | ✅ | Shared tel surfaces |
| `email_click` | ✅ | ❌ | Catalog only |
| `contact_click` | ✅ | ❌ | Catalog only (taxonomy still ambiguous) |
| `line_oa_click` | ✅ | ✅ | Floating + footer |
| `form_submit` | ✅ | ✅ | **Success path only** (not submit-button click) |

Catalog entries do **not** carry a `marketing` category in V1. Events are interaction signals; adapters decide consent + destination.

---

## 2. API & payload contracts

```ts
trackEvent("phone_click", { location: "footer" });
trackEvent("line_oa_click", { surface: "floating" });
trackEvent("form_submit", { formId: "contact" });
```

### Typed payloads (wired events)

```ts
type PhoneClickPayload = {
  location?: "footer" | "branch_card" | "directory";
};

type LineOaClickPayload = {
  surface: "floating" | "footer";
};

type FormSubmitPayload = {
  formId: string;
};

type EventPayloadMap = {
  phone_click: PhoneClickPayload;
  line_oa_click: LineOaClickPayload;
  form_submit: FormSubmitPayload;
  email_click: undefined;
  contact_click: undefined;
  page_view: undefined;
};
```

### Unknown event

```txt
No throw
No crash
No adapter dispatch
Debug event-level status = unknown_event
```

**Implementation note:** `unknown_event` is an **event-level** debug status recorded when the name is rejected **before** the adapter pipeline. It is **not** an adapter status.

---

## 3. Runtime-aware adapters

### Analytics transport invariant (Runtime V1 — must not regress)

```txt
IF GTM active
  → dispatch analytics events via GTM (dataLayer) ONLY
  → do NOT dispatch direct GA4 / gtag for the same event

IF GTM inactive AND GA4 active
  → dispatch via direct GA4 (gtag)

IF neither active
  → analytics adapters skip: provider_missing | runtime_disabled
```

This matches Runtime V1: **GTM overrides direct GA4**; never both.

### Marketing transport

```txt
Meta is independent of GTM/GA4
Meta adapter runs when Meta Pixel is available
Meta adapter checks marketing consent
```

### Meta map (V1)

```ts
const META_EVENT_MAP = {
  form_submit: "Lead",
} as const;
```

| Catalog event | GA4 / GTM | Meta |
|---------------|-----------|------|
| `page_view` | Manual/test only | — (Runtime pageview only) |
| `phone_click` | ✅ | no-op (`not_mapped`) |
| `email_click` | catalog only | — |
| `contact_click` | catalog only | — |
| `line_oa_click` | ✅ | no-op (`not_mapped`) |
| `form_submit` | ✅ | `Lead` |

No `fbq('trackCustom', ...)` in V1.

---

## 4. Consent (adapter layer)

Consent is enforced **inside adapters**, not at the top of `trackEvent` as a single early return for all destinations.

```txt
trackEvent()
  → dispatch to resolved adapters
       Analytics adapter(s) → require analytics consent
       Meta adapter         → require marketing consent
```

When blocked: adapter status `consent_blocked`, **no-op**, no throw.

Rationale: future providers (TikTok, LinkedIn, CAPI) can add adapters without rewriting the catalog.

`line_oa_click` is treated as an **analytics engagement** event (same family as phone/email/contact). It does **not** leave the consent system, and does **not** map to Meta in V1.

---

## 5. Call sites (V1)

### `line_oa_click`

- LINE Floating CTA → `{ surface: "floating" }`
- LINE Footer link → `{ surface: "footer" }`

### `phone_click`

Wire shared / high-reuse tel surfaces only (e.g. footer, branch card, directory card patterns already in the product). Prefer one shared handler/component rather than hunting every `tel:` in the repo.

Payload: `{ location?: "footer" | "branch_card" | "directory" }`

### `form_submit`

**Implementation note:** wire on **successful submit / success path only**, not on submit-button click.

```txt
form_submit = conversion success
```

This keeps GA4 and Meta `Lead` semantically aligned.

Payload: `{ formId: string }` for the primary public form(s) in scope.

### Explicitly out of V1 wiring

- `email_click`, `contact_click`, `page_view`
- No event delegation, no document listeners, no global click interception

---

## 6. Debug ring & panel

### Flag

Enable via either (or both):

```txt
localStorage.setItem("integration-events-debug", "1")
```

and/or

```txt
?eventsDebug=1
```

(Implementation may persist query flag into localStorage for convenience.)

### Ring

- In-memory ring buffer
- Keep last **20–50** events (plan may pick a single number, e.g. 30)
- Overwrite oldest

### Debug record shape

```ts
type DebugAdapterResult = {
  adapter: "gtm" | "ga4" | "meta";
  status:
    | "fired"
    | "not_mapped"
    | "consent_blocked"
    | "provider_missing"
    | "runtime_disabled";
  reason?: string;
};

type DebugEvent = {
  name: string;
  timestamp: number;
  payload?: unknown;
  /** Event-level status when rejected before adapters (e.g. unknown_event) */
  status?: "unknown_event";
  consent?: {
    analytics: boolean;
    marketing: boolean;
  };
  adapters?: DebugAdapterResult[];
};
```

**Implementation note:** When `status === "unknown_event"`, omit adapter results (pipeline never ran).

### UI

- Lightweight fixed panel (debug/flag only)
- Show recent events + adapter outcomes
- No search / filter / export
- **Not** integrated into Admin Integrations Diagnostics

---

## 7. Fail-soft rules

```txt
Unknown event name     → no-op + debug unknown_event
Consent blocked        → adapter skipped consent_blocked
Provider not mounted   → adapter skipped provider_missing
Transport disabled     → adapter skipped runtime_disabled
Not in Meta map        → meta skipped not_mapped
Exceptions in adapter  → catch, skip, do not crash page
```

---

## 8. Testing & smoke

### Automated (expected)

- Catalog / payload typing helpers (as practical)
- Adapter resolve: GTM active ⇒ no direct GA4 dispatch
- Meta map: only `form_submit` → Lead
- Unknown event → no throw + debug status
- Consent blocked → skip with reason
- Wiring tests: LINE / phone / form success call `trackEvent` (static source asserts acceptable, matching prior epics)

### Manual smoke

```txt
□ Debug flag on → panel visible
□ line_oa_click floating/footer → GA4/GTM fired (with analytics consent); Meta not_mapped
□ phone_click → analytics fired; Meta not_mapped
□ form_submit success → analytics fired; Meta Lead fired (with marketing consent)
□ Marketing off → Meta consent_blocked; analytics still can fire
□ Analytics off → GTM/GA4 consent_blocked
□ Unknown event → unknown_event in ring; no crash
□ GTM + GA4 configured → analytics via GTM only (no double gtag)
□ Admin unaffected; no event panel on /admin
```

---

## 9. Implementation order (suggested)

1. Types + catalog + `trackEvent` stub + debug ring
2. Adapters + resolve (GTM XOR GA4, Meta map) + consent checks
3. Debug panel + flag gating + mount under ConsentProvider tree
4. Wire `line_oa_click` + `phone_click` + `form_submit` success
5. Tests + lint + smoke + PR

---

## Spec coverage checklist

| Requirement | Section |
|-------------|---------|
| Code-only catalog + snake_case | Decisions / §1 |
| Single `trackEvent` entry | Architecture |
| Runtime-aware adapters + GTM XOR GA4 invariant | §3 |
| Consent at adapter layer | §4 |
| Meta B-minimal Lead map | §3 |
| No auto page_view | §1 / §5 |
| B-minimal call sites | §5 |
| form_submit = success path only | §5 |
| Typed payloads | §2 |
| unknown_event event-level | §2 / §6 |
| Debug ring + panel | §6 |
| Fail-soft | §7 |

---

## Follow-ups (explicitly later)

```txt
Custom Events V1.1 — wire email_click / refine contact_click taxonomy
Analytics Enrichment V2 — auto/virtual page_view ownership
Event Registry V2 — CMS / hybrid catalog
Consent-aware Diagnostics — admin visibility into blocked channels / recent events
Validation Enforcement V2 — soft diagnostics → policy engine
```
