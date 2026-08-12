# PR — Integrations Consent / PDPA V1

**Base:** `feat/seo-completion-v1`  
**Head:** `feat/integrations-foundation-v1`

**Title:**

```txt
feat(integrations): add category consent banner for tracking scripts
```

**Body:**

## Summary

Adds a **category consent banner** (Necessary / Analytics / Marketing) on the public locale site before GTM / GA4 / Meta inject. Preferences persist in `localStorage` (`integration-consent-v1`). LINE OA surfaces stay outside consent. Footer **Cookie settings** reopens preferences for decided users.

### Behavior

| Consent | GTM/GA4 | Meta | LINE | Banner |
|---------|---------|------|------|--------|
| Undecided (`null`) | Off | Off | On | Show |
| Necessary only | Off | Off | On | Hide |
| Analytics only | On* | Off | On | Hide |
| Accept all | On* | On* | On | Hide |

\* Only when corresponding IDs are configured in Integrations settings.

Corrupt / missing storage → treat as undecided (`null`) → banner returns; no throw.

### Architecture

```txt
Server TrackingConfigLoader
  getIntegrationSettings() + resolveTrackingConfiguration()
    ↓ props { gtmContainerId, gaMeasurementId, metaPixelId }
Client ConsentAwareTrackingScripts
  canLoadAnalytics → GTM/GA4
  canLoadMarketing → Meta

ConsentProvider + ConsentBanner + CookieSettingsButton (footer)
LineOaSurfaces — ungated
```

**Hard rule:** no client `fetch("/api/settings/integrations")`.

### Included

- Storage helpers + category gates + unit tests
- ConsentProvider / Banner / i18n (TH+EN)
- ConsentAwareTrackingScripts + TrackingConfigLoader (server → props)
- Locale layout mount (Provider + Banner + Loader + LINE)
- Footer Cookie Settings reopen via `openPreferences()`
- Wiring tests locking layout / no client fetch / admin isolation
- Removed unused `tracking-scripts.tsx` (replaced by loader path)

### Out of scope

- Cookie / SSR mirror of consent
- DB / per-user consent sync
- Google Consent Mode deep integration
- Gating LINE OA or admin surfaces
- Custom Events wiring
- Validation Enforcement
- Diagnostics panel changes

## Test plan

### Automated

- [x] `tests/consent-storage.test.ts`
- [x] `tests/consent-gates.test.ts`
- [x] `tests/consent-wiring.test.ts`
- [x] `tests/resolve-tracking.test.ts` / runtime + LINE wiring suites still green
- [x] eslint on touched consent / layout / footer files

### Manual smoke

- [ ] First visit (clear `integration-consent-v1`) → banner; no `gtm-bootstrap` / `ga4-loader` / `meta-pixel`
- [ ] Accept all → scripts per configured IDs; banner hidden; reload persists
- [ ] Necessary only → decided `{analytics:false,marketing:false}` in storage; no tracking scripts
- [ ] Customize Analytics only → GTM/GA4 on; Meta off
- [ ] Corrupt localStorage → banner shows; no throw
- [ ] Footer Cookie settings → reopen; Save / Cancel / Escape
- [ ] LINE floating + footer still work without consent
- [ ] `/admin` → no consent banner / no public tracking from this layout
- [ ] No new console errors on public pages

## Spec / plan

- `docs/superpowers/specs/2026-08-12-integrations-consent-pdpa-v1-design.md`
- `docs/superpowers/plans/2026-08-12-integrations-consent-pdpa-v1.md`

## Commits

- `4a3b24d` / `ee43778` docs: design + plan
- `2c51774` consent storage + gates
- `0324015` provider + banner + i18n
- `c601bb1` ConsentAwareTrackingScripts + layout
- `cf5ffa6` footer Cookie Settings reopen
- (Task 5) cleanup deprecated TrackingScripts + lint-safe hydration / banner seed
