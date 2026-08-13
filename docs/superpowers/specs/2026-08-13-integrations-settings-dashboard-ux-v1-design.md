# Integrations Settings Dashboard UX V1 Design

**Date:** 2026-08-13  
**Status:** Final Spec — ready for implementation plan  

**Depends on:** Integrations Diagnostics V1 + Consent-aware Diagnostics V1 (panel + resolvers already shipped)  
**Scope:** Presentation-only layout refactor of `/admin/settings/integrations` into a scannable Integrations Dashboard — overview cards, split diagnostics, shared status badges. **No business-logic changes.**

## Goal

Turn the Integrations admin page from a narrow left-stacked form into a desktop-friendly dashboard so operators can:

```txt
✓ Scan GTM / GA4 / Meta / LINE runtime status at a glance
✓ Compare Runtime Status vs Consent & Events side-by-side
✓ Keep settings forms readable without a heavy redesign
```

without changing diagnostics resolvers, consent simulation behavior, API contracts, or soft invariants.

## Architecture

**Approach — Widen + Split Diagnostics (UI only)**

```txt
IntegrationsForm                    max-w-4xl → max-w-7xl
└── IntegrationsDiagnosticsPanel
    ├── IntegrationOverviewCards    Runtime only (Decision A)
    │   └── StatusBadge × 4
    ├── DiagnosticsSplit            lg: 2 columns
    │   ├── Runtime Status          Current provider configuration
    │   │   └── Channel rows + StatusBadge
    │   └── Consent & Events        Simulation only
    │       ├── Analytics / Marketing toggles
    │       └── ConsentChannelCard × 4 + StatusBadge
    └── (Settings sections unchanged — single-column stack)
```

**Source of truth (unchanged):**

```txt
resolveIntegrationDiagnostics(settings)           → Runtime / Overview
resolveConsentAwareDiagnostics(settings, sim)     → Consent & Events
```

No new diagnostics API. No resolver changes. No consent storage writes. No tracking calls.

## Decisions

| # | Topic | Choice |
|---|-------|--------|
| 1 | Layout approach | **Widen + Split Diagnostics** — overview + 2-col diagnostics; settings stay stacked |
| 2 | Overview source | **A — Runtime only** — never updates from Consent simulation toggles |
| 3 | Container width | **`max-w-7xl`** (not unbounded `w-full`) |
| 4 | Settings grid | **Single column** — no 2×2 Analytics/GTM/Meta/LINE in V1 |
| 5 | StatusBadge | **Single shared component** used by Overview, Runtime rows, and Consent rows |
| 6 | Overview secondary line | Configured ID summary when available; otherwise **"No ID configured"** |
| 7 | Logic / API | **Untouched** — presentation layer only |

## Non-Goals

```txt
No changes to resolveIntegrationDiagnostics
No changes to resolveConsentAwareDiagnostics
No changes to SimulatedConsent defaults or reason codes
No Save / PATCH blocking
No visitor consent / localStorage writes
No gtag / fbq / dataLayer / trackEvent / fetch from diagnostics
No EventsDebugPanel on admin
No Settings 2×2 grid
No Overview simulation-aware status (Decision B/C deferred)
No new design-system package beyond a local StatusBadge helper
No Validation Enforcement
```

---

## 1. Component hierarchy

```txt
IntegrationsSettingsPage
└── IntegrationsForm                         (container width only)
    ├── IntegrationsDiagnosticsPanel
    │   ├── IntegrationOverviewCards         (NEW presentational)
    │   │   └── StatusBadge                  (shared)
    │   ├── RuntimeStatusColumn              (existing content, restyled)
    │   │   ├── StatusBadge
    │   │   └── WarningsList?
    │   └── ConsentEventsColumn              (existing content, restyled)
    │       ├── SimulationToggles
    │       ├── ConsentChannelCard × N
    │       └── StatusBadge
    ├── IntegrationsAnalyticsSection
    ├── IntegrationsTagManagerSection
    ├── IntegrationsMetaSection
    ├── IntegrationsLineSection
    └── Save
```

Implementation may keep helpers in `integrations-diagnostics-panel.tsx` or extract:

- `features/settings/integration-status-badge.tsx`
- optional small presentational pieces colocated under `features/settings/`

Extraction of **StatusBadge** as a dedicated module is **required** (Decision #5). Other splits are optional if the panel file stays readable.

---

## 2. Desktop layout (`lg+`)

```txt
max-w-7xl

Integration Overview
┌──────────┬──────────┬──────────┬──────────┐
│ GTM      │ GA4      │ Meta     │ LINE     │
│ [Active] │ [Supp.]  │ [Active] │ [Active] │
│ GTM-…    │ G-…      │ 123…     │ https…   │
└──────────┴──────────┴──────────┴──────────┘

┌─────────────────────────┬───────────────────────────┐
│ Runtime Status          │ Consent & Events          │
│ Current provider        │ Simulation only           │
│ configuration           │ Does not affect visitor…  │
│                         │ ☐ Analytics  ☐ Marketing  │
│ GTM   [Active]          │                           │
│ …                       │ Meta Pixel                │
│ Warnings?               │ Requires [Marketing]      │
│                         │ Result   [Blocked]        │
│                         │ Reason   …                │
└─────────────────────────┴───────────────────────────┘

Analytics Settings
Tag Manager Settings
Meta Settings
LINE Settings
[Save Integrations]
```

Grid:

- Overview: `grid-cols-2 lg:grid-cols-4`
- Diagnostics: `lg:grid-cols-2 lg:items-start`
- Prefer **two separate surface cards** for Runtime / Consent (no single outer shell wrapping everything)

---

## 3. Mobile layout (`< lg`)

```txt
Overview (2×2)
Runtime Status (full width)
Consent & Events (full width)
Analytics → GTM → Meta → LINE → Save
```

Stack diagnostics columns. Overview remains `grid-cols-2`.

---

## 4. Integration Overview (Runtime only)

### Purpose

Answer: **ตอนนี้ระบบถูกตั้งค่าไว้อย่างไร?**

Does **not** answer simulated consent questions.

### Card contents

| Element | Rule |
|---------|------|
| Provider short name | `GTM` / `GA4` / `Meta` / `LINE` |
| StatusBadge | From `diagnostics.runtime.*` via `runtimeStatusLabel` semantics (`active` / `suppressed` / `inactive`) |
| Secondary line (configured) | Show configured ID / URL summary (truncate + `title` for full value) |
| Secondary line (not configured) | **`No ID configured`** — never invent placeholder IDs |

### Secondary line mapping

| Channel | Configured value | Empty |
|---------|------------------|-------|
| GTM | `configured.gtmContainerId` | `No ID configured` |
| GA4 | `configured.gaMeasurementId` | `No ID configured` |
| Meta | `configured.metaPixelId` | `No ID configured` |
| LINE | `resolved.lineOaUrl` or configured URL field already used by Runtime | `No ID configured` |

When status is Inactive / not configured, badge shows inactive label; secondary line still uses **"No ID configured"** (not blank, not `"—"`).

### Example

```txt
GTM
[Active]
GTM-XXXXXX

Meta
[Inactive]
No ID configured
```

---

## 5. Runtime Status column

### Headers

```txt
Runtime Status
Current provider configuration
```

Plus existing predictive disclaimer (or fold into subtitle): predicted from saved settings; does not verify vendor script load.

### Rows

Replace long inline prose markers (`✓` / `⚠` / `○` sentences) with:

```txt
Provider full name
[StatusBadge]
meta line (container / measurement / pixel / LINE surfaces) — keep existing explanatory copy for suppressed GA4 etc.
```

Warnings block stays under Runtime column when present.

---

## 6. Consent & Events column

### Headers

```txt
Consent & Events
Simulation only
```

Keep full disclaimer text required by Consent-aware Diagnostics V1:

```txt
Simulation only. Does not affect visitor consent or tracking.
```

(Wiring tests match `"Consent & Events"` and `"Simulation only"` — preserve these substrings.)

### Toggles

Unchanged behavior: session `useState(DEFAULT_SIMULATED_CONSENT)`; Analytics + Marketing checkboxes; fieldset + sr-only legend.

### Provider result cards

Structured layout (not prose dump):

```txt
Meta Pixel

Requires
[Marketing]          ← pill / muted chip (not StatusBadge)

Result
[Blocked]            ← StatusBadge (simulation result)

Reason
Requires marketing consent (or REASON_LABELS[code])

capability notes…
```

Map simulation results:

| `simulationResult` | Badge label |
|--------------------|-------------|
| `would_fire` | Would Fire |
| `blocked` | Blocked |
| `suppressed` | Suppressed |
| `not_configured` | Not Configured |

---

## 7. Shared `StatusBadge`

**Required:** one reusable presentational component.

### Consumers

```txt
Overview cards
Runtime Status rows
Consent & Events Result badges
```

### Visual variants

| Variant | Use | Suggested Tailwind |
|---------|-----|--------------------|
| `active` / success | Runtime active, Would Fire | `bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200` |
| `suppressed` / warning | Runtime suppressed, simulation suppressed | `bg-amber-50 text-amber-900 ring-1 ring-amber-200` |
| `blocked` / danger | Simulation blocked | `bg-red-50 text-red-800 ring-1 ring-red-200` |
| `inactive` / muted | Inactive, Not Configured | `bg-muted/40 text-muted ring-1 ring-border` (or equivalent existing tokens) |

### Rules

- Always show **text label** (never color-only)
- Decorative dots/icons: `aria-hidden`
- Prefer `rounded-md px-2 py-0.5 text-xs font-medium`
- Do not invent new status vocabulary outside existing runtime + simulation enums

Suggested props shape (illustrative):

```ts
type StatusBadgeProps = {
  label: string;
  tone: "success" | "warning" | "danger" | "muted";
};
```

Mapping helpers stay in the panel (or colocated) — badge itself stays dumb.

---

## 8. Tailwind / design language

Stay consistent with ThePaseo CMS admin:

```txt
border-border
bg-surface
bg-background
text-foreground
text-muted
shadow-sm
rounded-lg / rounded-md
accent-paseo on checkboxes
```

SaaS dashboard feel (Vercel / Stripe / Clerk / Resend): clear hierarchy, badges, dense-but-breathing cards — **not** a new brand skin.

Form container:

```tsx
className="grid max-w-7xl gap-6"
```

---

## 9. Accessibility

```txt
✓ Overview: section with aria-label (e.g. "Integration overview")
✓ Status never color-only — badge text required
✓ Diagnostics columns: visible h2 headings
✓ Simulation fieldset + sr-only legend retained
✓ Truncated IDs/URLs expose full value via title
✓ Focus rings preserved on toggles / Save
✓ Decorative icons aria-hidden
```

---

## 10. Soft / safety invariants (must preserve)

```txt
Never blocks Save
Never writes integration-consent-v1 / localStorage consent
Never calls gtag / fbq / dataLayer / trackEvent / fetch from diagnostics UI
No EventsDebugPanel on /admin
No draft-watch diagnostics
```

Existing wiring tests in `tests/integrations-diagnostics-wiring.test.ts` remain the contract. Update only if presentation renames break string matches — do **not** weaken soft assertions.

---

## 11. Before / After

| | Before | After |
|--|--------|--------|
| Width | `max-w-4xl` | `max-w-7xl` |
| Overview | none | 4 Runtime summary cards |
| Diagnostics | one tall stacked card | Runtime \| Consent split (`lg`) |
| Status UI | inline ✓/⚠/○ prose | shared `StatusBadge` |
| Consent rows | prose Requires/Result | structured cards |
| Settings | stack | stack (gap only) |
| Resolvers / API | — | unchanged |

---

## 12. Implementation outline

| Task | Deliverable |
|------|-------------|
| T1 | `StatusBadge` shared component + tone mapping |
| T2 | Form `max-w-7xl` + Overview cards (Runtime + secondary line rules) |
| T3 | Split Runtime / Consent columns; restyle rows + consent cards |
| T4 | Lint + re-run diagnostics / consent-aware / wiring tests + manual smoke |

Optional: PR packaging after smoke.

---

## 13. Manual smoke checklist

```txt
□ Desktop: overview 4-col; diagnostics 2-col; page uses ~max-w-7xl
□ Mobile: overview 2×2; Runtime then Consent stacked
□ Overview ignores Consent toggles (Marketing OFF does not change Overview Meta)
□ Consent toggles still change Consent Result badges only
□ Secondary line shows real ID or "No ID configured"
□ Save still works (soft)
□ Public consent localStorage unchanged
□ No EventsDebugPanel on /admin
□ Disclaimer / "Simulation only" / "Consent & Events" copy still present
```

---

## Spec self-review

```txt
✓ No unresolved placeholders
✓ Decision A vs Consent simulation separation explicit
✓ max-w-7xl locked (not unbounded)
✓ StatusBadge shared requirement locked
✓ Overview secondary line rules locked
✓ Non-goals exclude resolver/API/settings 2×2
✓ Wiring test copy substrings called out
✓ Scope is UI-only
```
