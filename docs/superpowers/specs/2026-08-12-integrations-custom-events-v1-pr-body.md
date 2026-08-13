# PR — Integrations Custom Events V1

**Base:** `feat/seo-completion-v1`  
**Head:** `feat/integrations-custom-events-v1`

**Title:**

```txt
feat(integrations): add custom event runtime with consent-aware adapters
```

**Body:**

## Summary

Adds a code-only **Custom Events** runtime: single `trackEvent()` API, runtime-aware adapters (GTM XOR Direct GA4, Meta independent), adapter-layer consent, B-minimal Meta `Lead` mapping, three public call sites, and a flag-gated client debug panel.

### Behavior

| Event | Wired | Analytics (GTM/GA4) | Meta |
|-------|-------|---------------------|------|
| `line_oa_click` | Floating + Footer | ✅ | not_mapped |
| `phone_click` | Footer + BranchContact | ✅ | not_mapped |
| `form_submit` | Leasing **success** only | ✅ | `Lead` |
| `page_view` / `email_click` / `contact_click` | Catalog only | — | — |

Consent (adapter layer):

- Analytics adapters → `canLoadAnalytics`
- Meta adapter → `canLoadMarketing`
- Blocked → no-op + debug status (`consent_blocked` / `not_mapped` / …)

Transport invariant (Runtime V1):

```txt
GTM active → dataLayer only (never also gtag)
GTM inactive + GA4 active → gtag
Meta → independent
```

### Architecture

```txt
UI call site
  → trackEvent(name, payload?)
  → catalog check (unknown_event = event-level, no adapters)
  → resolveAdapters(config)
  → each adapter: map / consent / provider / fire
  → debug ring (when flag on)
```

`TrackingConfigLoader` mounts `EventRuntimeProvider` + `ConsentAwareTrackingScripts` + `EventsDebugPanel`.

### Included

- Catalog + typed payloads + debug ring (max 30)
- Adapters: GTM / GA4 / Meta (`form_submit` → Lead only)
- Flag-gated debug panel (`integration-events-debug` / `?eventsDebug=1`)
- Explicit wiring: LINE, phone, leasing success
- Unit + wiring tests

### Out of scope

- CMS Event Registry / Event Builder
- Auto `page_view` / SPA virtual pageviews
- Global click delegation
- Admin Diagnostics event stream
- Meta `trackCustom` / dynamic maps
- Wiring `email_click` / `contact_click`

## Test plan

### Automated

- [x] `tests/events-catalog.test.ts`
- [x] `tests/events-resolve-adapters.test.ts`
- [x] `tests/events-meta-map.test.ts`
- [x] `tests/events-wiring.test.ts`
- [x] Consent / runtime / LINE wiring suites still green
- [x] eslint on touched event / wiring files

### Manual smoke

- [ ] `localStorage.integration-events-debug=1` (or `?eventsDebug=1`) → panel visible
- [ ] LINE floating/footer → analytics fired; meta `not_mapped`
- [ ] Footer / branch phone → analytics fired; meta `not_mapped`
- [ ] Leasing success → analytics fired; Meta Lead (marketing on)
- [ ] Marketing off → meta `consent_blocked`; analytics can fire
- [ ] Analytics off → gtm/ga4 `consent_blocked`; Meta Lead can fire if marketing on
- [ ] `trackEvent("nope")` → `unknown_event`; no adapters
- [ ] GTM + GA4 configured → only gtm adapter (no double-count)
- [ ] `/admin` → no EventsDebugPanel
- [ ] No new console errors

## Spec / plan

- `docs/superpowers/specs/2026-08-12-integrations-custom-events-v1-design.md`
- `docs/superpowers/plans/2026-08-12-integrations-custom-events-v1.md`

## Commits

- `711eda3` / `681c4bc` docs: design + plan (on trunk / branch base)
- `f72e843` catalog + trackEvent core
- `e5319c5` runtime-aware adapters + consent
- `8f03488` EventRuntime + debug panel
- `3b2f98a` line_oa_click + phone_click
- `2bfbc4f` form_submit on leasing success
- (Task 6) lint fix + PR body
