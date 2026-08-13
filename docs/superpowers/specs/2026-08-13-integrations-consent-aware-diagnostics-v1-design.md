# Integrations Consent-aware Diagnostics V1 Design

**Date:** 2026-08-13  
**Status:** Final Spec — ready for implementation plan  

**Depends on:** Integrations Diagnostics V1 + Consent / PDPA V1 + Custom Events V1 (consent categories, adapter consent rules, Meta `form_submit → Lead` capability)  
**Scope:** Soft, predictive **Consent & Events** section on `/admin/settings/integrations` — simulate Analytics / Marketing consent and show Would Fire / Blocked / Suppressed / Not Configured per provider channel

## Goal

Help admins answer, on one Integrations page:

```txt
✓ Provider configured?
✓ Runtime active / suppressed / inactive?
✓ Which consent category is required?
✓ Under simulated consent, would it fire or be blocked?
✓ If blocked/suppressed — why? (stable reason code)
✓ Capability notes (e.g. Meta: form_submit → Lead)
```

without visitor telemetry, without event warehouses, and without executing live tracking from admin.

## Architecture

**Approach — Predictive resolver + session-only simulation UI**

```txt
Saved IntegrationSettings
  ↓
resolveIntegrationDiagnostics()          (existing Runtime Status)
  ↓
resolveConsentAwareDiagnostics(
  settings | existing diagnostics,
  simulatedConsent
)                                        (new — pure prediction)
  ↓
IntegrationsDiagnosticsPanel
  ├─ Runtime Status (existing)
  └─ Consent & Events (new)
       ├─ Simulate Analytics / Marketing toggles (session-only)
       ├─ Disclaimer
       └─ Provider rows: GTM / GA4 / Meta / LINE OA
```

No new diagnostics API. No DB writes for simulation. No `gtag` / `fbq` / `dataLayer` calls from admin.

## Decisions

| # | Topic | Choice |
|---|-------|--------|
| 1 | Surface | Expand existing Integrations Diagnostics (`/admin/settings/integrations`) |
| 2 | Data source | **A-minimal** Predictive / Operator Preview (settings + rules + simulation) |
| 3 | Simulation UX | **B** In-panel Analytics / Marketing toggles (no Run Test Event) |
| 4 | Diagnostic unit | **A** Provider / Channel rows + optional capability notes |
| 5 | Defaults + policy | Both consents **ON** by default; **soft-only**; session-only; disclaimer required |
| 6 | Vocabulary | Results + stable reason codes (set A) |

## Non-Goals

```txt
No visitor telemetry / event warehouse / backend event storage
No Run Test Event buttons in V1
No firing live gtag/fbq/dataLayer from admin
No writing integration-consent-v1 or cookie banner state
No Save / PATCH blocking
No event matrix (phone_click / form_submit rows) in V1
No Admin EventsDebugPanel duplicate of public debug overlay
No Validation Enforcement
No changing public runtime or consent storage behavior
```

---

## 1. Page structure

```txt
/admin/settings/integrations

─────────────────
Runtime Status          (Diagnostics V1 — unchanged semantics)
─────────────────
GTM / GA4 / Meta / LINE
warnings (format heuristics)

─────────────────
Consent & Events        (new)
─────────────────
Disclaimer
Simulation toggles
Provider rows + capability notes
```

One page, one mental model:

```txt
Integration → Configured? → Active? → Receiving under consent? → Blocked why?
```

---

## 2. Simulation inputs

```ts
type SimulatedConsent = {
  analytics: boolean;
  marketing: boolean;
};
```

### Defaults

```txt
analytics = true
marketing = true
```

### Rules

- Session-only React state (or equivalent) — **never** persist to DB / localStorage as visitor consent
- Does **not** modify public `ConsentProvider` / banner / `integration-consent-v1`
- Changing toggles re-runs pure evaluation only
- Soft: never blocks Save

### Disclaimer (required)

English example:

```txt
Simulation only. Does not affect visitor consent or tracking.
```

Thai copy may be used if the admin UI locale is Thai; keep meaning identical.

---

## 3. Results & reason codes

### Results (display)

```txt
Would Fire
Blocked
Suppressed
Not Configured
```

### Reason codes (stable)

| Code | Meaning |
|------|---------|
| `would_fire` | Under simulation, channel would inject / run |
| `consent_blocked` | Required consent category is OFF in simulation |
| `suppressed_by_gtm` | GA4 configured but GTM wins (Runtime V1 invariant) |
| `not_configured` | No saved ID for channel |
| `outside_consent` | Channel not gated by consent (LINE OA surfaces) |

**Do not** import event-adapter statuses into this vocabulary:

```txt
not_mapped
provider_missing
runtime_disabled
fired   ← use "Would Fire" instead (predictive, not executed)
```

---

## 4. Provider rows

Evaluate **GTM, GA4, Meta, LINE OA** independently under simulation.

### Consent requirements

| Channel | Requires |
|---------|----------|
| GTM | Analytics |
| GA4 | Analytics |
| Meta | Marketing |
| LINE OA | None (`outside_consent`) |

### Evaluation order (per channel)

1. If not configured → **Not Configured** / `not_configured`
2. Else if GA4 and GTM configured/active per Runtime rules → **Suppressed** / `suppressed_by_gtm` (GA4 only; ignore consent for suppression reason — Runtime wins)
3. Else if LINE OA configured → **Would Fire** / `outside_consent`
4. Else if required consent OFF in simulation → **Blocked** / `consent_blocked`
5. Else → **Would Fire** / `would_fire`

Notes:

- “Configured” uses the same saved-ID notion as Diagnostics V1 (`resolveIntegrationDiagnostics` / resolvers).
- GTM vs GA4 precedence must match `resolveTrackingConfiguration` (GTM suppresses direct GA4).
- Meta does **not** get suppressed by GTM.

### Capability notes (read-only, optional per row)

| Channel | Note |
|---------|------|
| Meta | `Supported events: form_submit → Lead` |
| LINE OA | `line_oa_click → Analytics only; no Meta mapping` |
| GTM / GA4 | Optional short note that public custom events use analytics consent |

No event matrix UI in V1.

---

## 5. Pure resolver API (proposed)

```ts
type ConsentAwareChannelResult = {
  channel: "gtm" | "ga4" | "meta" | "lineOa";
  configured: boolean;
  runtimeStatus: "active" | "inactive" | "suppressed"; // from Diagnostics V1
  requiresConsent: "analytics" | "marketing" | "none";
  simulationResult: "would_fire" | "blocked" | "suppressed" | "not_configured";
  reasonCode:
    | "would_fire"
    | "consent_blocked"
    | "suppressed_by_gtm"
    | "not_configured"
    | "outside_consent";
  capabilityNotes?: string[];
};

type ConsentAwareDiagnostics = {
  simulation: SimulatedConsent;
  channels: ConsentAwareChannelResult[];
};

function resolveConsentAwareDiagnostics(
  settings: IntegrationSettings,
  simulation: SimulatedConsent,
): ConsentAwareDiagnostics;
```

Implementation may compose `resolveIntegrationDiagnostics(settings)` internally to avoid duplicating Runtime Status logic.

---

## 6. Soft / safety invariants

```txt
Never blocks Save / PATCH / API
Never writes consent storage
Never modifies cookie banner state
Never modifies visitor consent
Never fires live gtag / fbq / dataLayer from admin
Never calls tracking provider networks
Diagnostics = Read / Evaluate / Explain — not Execute
```

---

## 7. UI behavior

- Place **Consent & Events** below Runtime Status in the existing diagnostics panel (or adjacent section in the same card)
- Simulation toggles at top of section + disclaimer
- Each provider row shows:
  - Configured (yes/no or ID summary consistent with V1)
  - Runtime status (Active / Inactive / Suppressed)
  - Requires consent label
  - Simulated result + humanized reason from `reasonCode`
  - Capability notes when present
- After successful Integrations save, Runtime Status refreshes from saved values as today; simulation toggles keep session state (do not reset unless remount — either behavior OK if documented; prefer **keep session toggles** across save)

---

## 8. Testing & smoke

### Automated

- Pure resolver matrix:
  - both ON → configured channels Would Fire (except GA4 suppressed when GTM)
  - analytics OFF → GTM/GA4 Blocked `consent_blocked`; Meta can Would Fire if ON
  - marketing OFF → Meta Blocked; GTM/GA4 can Would Fire if ON
  - empty settings → Not Configured
  - LINE configured → Would Fire + `outside_consent`
- Wiring: panel contains Consent & Events + disclaimer; no fetch of visitor events API
- Soft: no Save-blocking hooks introduced

### Manual smoke

```txt
□ Default both ON → healthy Would Fire (and GA4 Suppressed if GTM+GA4)
□ Toggle marketing OFF → Meta Blocked consent_blocked
□ Toggle analytics OFF → GTM/GA4 Blocked; Meta still Would Fire if marketing ON
□ LINE shows outside_consent
□ Meta shows form_submit → Lead note
□ Save still works with warnings/simulation present
□ Simulation does not change public banner / localStorage consent
□ /admin does not load public EventsDebugPanel
```

---

## 9. Implementation order (suggested)

1. Types + `resolveConsentAwareDiagnostics` + unit tests
2. Extend Integrations diagnostics panel UI (toggles + rows + disclaimer)
3. Wire into existing page/form refresh path (saved settings only)
4. Lint + smoke + PR

---

## Spec coverage checklist

| Requirement | Section |
|-------------|---------|
| Expand existing Integrations diagnostics | §1 / Decision #1 |
| Predictive A-minimal data source | §2 / Decision #2 |
| Simulate toggles, no Run Test Event | §2 / Decision #3 |
| Provider rows + capability notes | §4 / Decision #4 |
| Defaults ON + soft + disclaimer | §2 / §6 / Decision #5 |
| Result vocab + reason codes | §3 / Decision #6 |
| LINE outside_consent | §4 |
| Meta form_submit → Lead note | §4 |
| No telemetry / no live tracking from admin | Non-Goals / §6 |

---

## Follow-ups (later)

```txt
Consent-aware Diagnostics V1.1 — session-local Run Test Event (isolated / mocked)
Event-level diagnostics matrix (Custom Events V1.1 adjacent)
Visitor telemetry warehouse (explicitly out of Integrations Diagnostics)
Validation Enforcement V2
```
