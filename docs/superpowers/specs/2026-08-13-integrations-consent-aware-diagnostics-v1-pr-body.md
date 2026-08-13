# PR — Integrations Consent-aware Diagnostics V1

**Base:** `feat/seo-completion-v1`  
**Head:** `feat/integrations-consent-aware-diagnostics-v1`

**Title:**

```txt
feat(integrations): add consent-aware diagnostics simulation on Integrations admin
```

**Body:**

## Summary

Extends the Integrations admin **Runtime Status** panel with a soft, predictive **Consent & Events** section. Admins can simulate Analytics / Marketing consent (session-only) and see whether GTM / GA4 / Meta / LINE OA **Would Fire**, **Blocked**, **Suppressed**, or **Not Configured** — with stable reason codes.

No visitor telemetry. No live tracking calls from admin. Never blocks Save.

### Behavior

| Simulation | Typical result |
|------------|----------------|
| Both ON (default) | Configured channels Would Fire; GA4 Suppressed if GTM+GA4 |
| Marketing OFF | Meta Blocked (`consent_blocked`) |
| Analytics OFF | GTM/GA4 Blocked; Meta can still Would Fire |
| LINE configured | Would Fire (`outside_consent`) |

Capability notes:

- Meta: `form_submit → Lead`
- LINE: `line_oa_click → Analytics only; no Meta mapping`

### Architecture

```txt
Saved settings
  → resolveIntegrationDiagnostics (existing)
  → resolveConsentAwareDiagnostics(settings, simulation)
  → IntegrationsDiagnosticsPanel
       Runtime Status
       Consent & Events (toggles + channel rows)
```

Reason codes are source of truth; UI labels come from `REASON_LABELS`.

### Soft invariants

```txt
Never blocks Save
Never writes integration-consent-v1 / visitor consent
Never calls gtag / fbq / dataLayer / trackEvent / fetch from diagnostics
No EventsDebugPanel on admin
```

### Included

- Pure `resolveConsentAwareDiagnostics` + unit matrix
- Panel Consent & Events UI + session toggles + disclaimer
- Form passes saved `settings` into panel
- Wiring guards for soft / no-telemetry invariants

### Out of scope

- Run Test Event
- Event matrix rows
- Visitor event warehouse / telemetry APIs
- Validation Enforcement / Save blocking
- Public runtime or consent behavior changes

## Test plan

### Automated

- [x] `tests/resolve-consent-aware-diagnostics.test.ts`
- [x] `tests/resolve-integration-diagnostics.test.ts` (regression)
- [x] `tests/integrations-diagnostics-wiring.test.ts`
- [x] eslint on touched files

### Manual smoke

- [ ] Default both ON → Would Fire (GA4 Suppressed if GTM+GA4)
- [ ] Marketing OFF → Meta Blocked `consent_blocked`
- [ ] Analytics OFF → GTM/GA4 Blocked; Meta Would Fire if marketing ON
- [ ] LINE → `outside_consent`
- [ ] Meta note shows `form_submit → Lead`
- [ ] Save still works
- [ ] Public consent localStorage unchanged
- [ ] `/admin` has no EventsDebugPanel

## Spec / plan

- `docs/superpowers/specs/2026-08-13-integrations-consent-aware-diagnostics-v1-design.md`
- `docs/superpowers/plans/2026-08-13-integrations-consent-aware-diagnostics-v1.md`

## Commits

- `5d34cd3` / `1b18b8a` docs: design + plan
- `37987e5` consent-aware diagnostics resolver
- `6bffef0` Consent & Events panel UI
- `b2a6779` soft invariant wiring tests
- (Task 4) PR body
