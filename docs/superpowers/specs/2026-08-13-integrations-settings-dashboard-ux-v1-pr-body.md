# PR — Integrations Settings Dashboard UX V1

**Base:** prefer `feat/seo-completion-v1` if Consent-aware Diagnostics is already merged there; otherwise this work lives on `feat/integrations-consent-aware-diagnostics-v1` (stacked).

**Head:** `feat/integrations-consent-aware-diagnostics-v1`

**Title:**

```txt
feat(integrations): improve Integrations settings dashboard layout
```

**Body:**

## Summary

Presentation-only refactor of `/admin/settings/integrations` into a scannable dashboard:

- Widen form container `max-w-4xl` → `max-w-7xl`
- **Integration Overview** cards (Runtime only)
- Split **Runtime Status | Consent & Events** on desktop
- Shared `StatusBadge` across Overview / Runtime / Consent

No resolver, consent simulation, or API changes.

### Layout

```txt
Overview (GTM / GA4 / Meta / LINE)
Runtime Status | Consent & Events
Analytics → GTM → Meta → LINE → Save
```

### Soft invariants preserved

```txt
Never blocks Save
Never writes visitor consent
Never calls tracking providers from diagnostics
No EventsDebugPanel on admin
```

## Test plan

### Automated

- [x] eslint on touched files
- [x] `tests/resolve-consent-aware-diagnostics.test.ts`
- [x] `tests/resolve-integration-diagnostics.test.ts`
- [x] `tests/integrations-diagnostics-wiring.test.ts`

### Manual

- [ ] Desktop: overview 4-col; diagnostics 2-col; ~max-w-7xl
- [ ] Mobile: overview 2×2; Runtime then Consent stacked
- [ ] Overview ignores Consent toggles
- [ ] Consent Results update on toggle
- [ ] Secondary line shows ID or `No ID configured`
- [ ] Save works
- [ ] Public consent localStorage unchanged
- [ ] No EventsDebugPanel on `/admin`

## Spec / plan

- `docs/superpowers/specs/2026-08-13-integrations-settings-dashboard-ux-v1-design.md`
- `docs/superpowers/plans/2026-08-13-integrations-settings-dashboard-ux-v1.md`
