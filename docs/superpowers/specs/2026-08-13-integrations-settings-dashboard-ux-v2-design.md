# Integrations Settings Dashboard UX V2 Design

**Date:** 2026-08-13  
**Status:** Final Spec — ready for implementation  

**Depends on:** Integrations Settings Dashboard UX V1 (overview + Runtime \| Consent split + `max-w-7xl` + shared `StatusBadge`)  
**Scope:** Presentation-only — Configuration 2×2 grid, Monitoring vs Configuration hierarchy, Save `justify-end`, denser Overview empty-state copy. **No business-logic changes.**

## Goal

Eliminate the remaining empty right-side space on desktop Integrations by placing provider settings in a 2×2 configuration grid, and clarify page hierarchy as **Monitoring** vs **Configuration**.

## Architecture

```txt
form max-w-7xl
├── IntegrationsDiagnosticsPanel          Monitoring (V1 — unchanged structure)
│   ├── Overview cards (Runtime only)
│   └── Runtime | Consent
└── Integration Configuration             NEW wrapper section
    ├── heading + subtitle
    ├── grid lg:grid-cols-2 items-start
    │   ├── Analytics
    │   ├── GTM
    │   ├── Meta
    │   └── LINE
    ├── server message
    └── Save (flex justify-end)
```

Resolvers / consent simulation / API / soft invariants: **untouched**.

## Decisions

| # | Topic | Choice |
|---|-------|--------|
| 1 | Settings layout | **2×2** at `lg+`; stack on mobile |
| 2 | Card height | **A — Independent** (`items-start`, not stretch) |
| 3 | Save placement | **A — After Configuration grid** |
| 4 | Save alignment | **`justify-end`** |
| 5 | Sticky action bar | **Deferred to V2.1** |
| 6 | Hierarchy | Explicit **Integration Configuration** section |
| 7 | Overview empty copy | Short **`… missing`** strings (scan-first) |
| 8 | Logic / API | Untouched |

## Non-Goals

```txt
No sticky Save bar (V2.1)
No equal-height settings cards
No resolver / consent / API changes
No Save blocking
No visitor consent writes
No tracking calls from admin diagnostics
No EventsDebugPanel on admin
```

---

## 1. Page structure

### Desktop

```txt
Overview (4)

Runtime Status | Consent & Events

Integration Configuration
Manage provider credentials and identifiers

Analytics | GTM
Meta      | LINE

                         [ Save Integrations ]
```

### Mobile

```txt
Overview 2×2
Runtime
Consent
Configuration heading
Analytics → GTM → Meta → LINE
[ Save ]
```

---

## 2. Form markup (illustrative)

```tsx
<form className="grid max-w-7xl gap-6">
  <IntegrationsDiagnosticsPanel diagnostics={…} settings={…} />

  <section
    aria-labelledby="integration-configuration-heading"
    className="grid gap-4"
  >
    <header>
      <h2 id="integration-configuration-heading" className="text-base font-semibold text-foreground">
        Integration Configuration
      </h2>
      <p className="mt-1 text-sm text-muted">
        Manage provider credentials and identifiers
      </p>
    </header>

    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <IntegrationsAnalyticsSection … />
      <IntegrationsTagManagerSection … />
      <IntegrationsMetaSection … />
      <IntegrationsLineSection … />
    </div>

    {serverMessage ? <p className="…">{serverMessage}</p> : null}

    <div className="flex justify-end">
      <Button type="submit" isLoading={isSubmitting}>
        Save Integrations
      </Button>
    </div>
  </section>
</form>
```

Section card chrome stays inside each `*Section` component (unchanged).

DOM / tab order: Analytics → Tag Manager → Meta → LINE.

---

## 3. Overview secondary-line polish

Still **Runtime only**. When configured, show ID/URL (truncate + `title`). When empty, use short copy:

| Channel | Empty secondary |
|---------|-----------------|
| GTM | `Container missing` |
| GA4 | `Measurement ID missing` |
| Meta | `Pixel ID missing` |
| LINE | `LINE OA missing` |

Do **not** use `—`, `N/A`, or generic `No ID configured` in V2.

Optional later (not required): `title` tooltip with longer explanation — V2 may set `title` to the same short string or a slightly longer hint; keep implementation simple.

---

## 4. Accessibility

```txt
✓ Configuration section has visible h2 + aria-labelledby
✓ Single submit button (no sticky duplicate)
✓ Settings cards remain independent landmarks (existing section headings)
✓ Monitoring panel headings unchanged from V1
```

---

## 5. Soft / safety invariants (preserve)

```txt
Never blocks Save
Never writes integration-consent-v1 / visitor consent
Never calls gtag / fbq / dataLayer / trackEvent from diagnostics
No EventsDebugPanel on /admin
No draft-watch diagnostics
```

---

## 6. Before / After

| | V1 | V2 |
|--|----|----|
| Settings | 1-col stack | 2×2 independent cards |
| Hierarchy | flat | Monitoring + Configuration |
| Save | left after stack | right after Configuration |
| Overview empty | `No ID configured` | channel `… missing` |
| Horizontal balance | still left-heavy | fills content width |
| Resolvers | — | unchanged |

---

## 7. Implementation outline

| Task | Deliverable |
|------|-------------|
| T1 | Form Configuration wrapper + 2×2 + Save `justify-end` |
| T2 | Overview empty secondary copy |
| T3 | Lint + related tests + smoke |

## 8. Manual smoke

```txt
□ Desktop: Analytics|GTM / Meta|LINE; cards not equal-height forced
□ Configuration heading above grid
□ Save justify-end under grid
□ Mobile: settings stack
□ Overview empty uses … missing strings
□ Overview ignores Consent toggles
□ Save still works; soft invariants hold
```

---

## Spec self-review

```txt
✓ Empty overview copy locked to short “… missing”
✓ Save justify-end locked; sticky deferred
✓ items-start locked
✓ No resolver changes
✓ Scope UI-only
```
