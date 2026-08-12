# PR — Integrations Validation & Diagnostics V1

**Base:** `feat/seo-completion-v1`  
**Head:** `feat/integrations-foundation-v1`

**Title:**

```txt
feat(integrations): add runtime diagnostics summary on Integrations admin
```

**Body:**

## Summary

Adds a soft **Runtime Status** panel on `/admin/settings/integrations` that predicts what public runtime will inject from **saved** settings — using the same resolvers as production (`resolveTrackingConfiguration`, `resolveLineOaUrl`).

Also shows light format warnings with stable codes. Never blocks Save.

### Behavior

| Scenario | Panel |
|----------|--------|
| Empty | all Inactive, no warnings |
| GA4 only `G-…` | GA4 Active |
| GTM + GA4 | GTM Active, GA4 **Suppressed** (configured ID still shown) |
| URL-like LINE | LINE Active + `LINE_OA_EXPECTED_ID` warning |
| Bad-looking GTM `ABC123` | warning `GTM_FORMAT`, Save still works |

### Architecture

```txt
Saved settings
  → resolveTrackingConfiguration / resolveLineOaUrl
  → resolveIntegrationDiagnostics
  → IntegrationsDiagnosticsPanel
```

After Save: recompute from PATCH response JSON (not draft `watch()`).

### Included

- Pure diagnostics resolver + unit tests
- Summary panel (Active / Inactive / Suppressed — suppressed is amber, not error)
- Page + form wiring; static guards against draft watch / diagnostics endpoint
- Prediction disclaimer (not network verification)

### Out of scope

- Save/API blocking
- Live draft diagnostics
- Diagnostics API endpoint
- DOM/CDN probing
- Consent / PDPA
- Public runtime behavior changes

## Test plan

### Automated

- [x] `tests/resolve-integration-diagnostics.test.ts`
- [x] `tests/integrations-diagnostics-wiring.test.ts`
- [x] eslint on touched files

### Manual smoke

- [ ] Case 1 Empty → all Inactive, no warnings
- [ ] Case 2 GA4 only → Active
- [ ] Case 3 GTM + GA4 → Active + Suppressed + configured ID copy
- [ ] Case 4 URL-like LINE → Active + `LINE_OA_EXPECTED_ID`
- [ ] Case 5 Invalid-looking GTM → `GTM_FORMAT`, Save OK
- [ ] After Save → panel refreshes from saved values

## Spec / plan

- `docs/superpowers/specs/2026-08-12-integrations-diagnostics-v1-design.md`
- `docs/superpowers/plans/2026-08-12-integrations-diagnostics-v1.md`

## Commits

- `9102392` / `1c8d17a` docs: design + plan
- `a8cb78d` resolveIntegrationDiagnostics
- `7caa2e2` diagnostics panel UI
- `40fac5c` admin page/form wiring
