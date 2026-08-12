# PR — Integrations Runtime V1

**Base:** `feat/seo-completion-v1`  
**Head:** `feat/integrations-foundation-v1`

**Title:**

```txt
feat(integrations): inject GTM, GA4 fallback, and Meta Pixel on public site
```

**Body:**

## Summary

Injects configured tracking scripts on the public site only.

Builds on Integrations Foundation + Admin UI (already on the base line) by adding a fail-safe runtime that reads integration settings and mounts GTM / GA4 / Meta via `next/script`.

### Behavior

| Settings | Public site scripts |
|----------|---------------------|
| Empty | none |
| GA4 only | `ga4-loader` + `ga4-config` |
| GTM only | `gtm-bootstrap` (+ noscript) |
| GTM + GA4 | GTM only (direct GA4 suppressed) |
| Meta only / with others | `meta-pixel` (+ noscript) when set |
| Admin (`/admin/**`) | never tracked |

### Architecture

```txt
canLoadTracking()
  → getIntegrationSettings()  (try/catch → null)
  → resolveTrackingConfiguration()
  → GoogleTagManager | GoogleAnalytics | MetaPixel
```

Mounted only in `app/[locale]/layout.tsx` (covers homepage `/` and all locale public routes; not `(site)/layout` alone — homepage lives outside `(site)`).

### Included

- Consent stub: `canLoadTracking()` → `true` (PDPA hook later)
- Pure resolution + unit tests (GTM overrides GA4, whitespace → null)
- Providers: GTM / GA4 / Meta (`afterInteractive`, stable script ids)
- `TrackingScripts` async Server Component + fail-safe
- Static wiring tests (site only; root + admin must not import)

### Out of scope

- Consent banner / PDPA UI
- LINE OA runtime
- Admin tracking
- Event helpers beyond default PageView / GTM bootstrap

## Test plan

### Automated

- [x] `node --import tsx --test tests/resolve-tracking.test.ts`
- [x] `node --import tsx --test tests/integrations-runtime-wiring.test.ts`

### Manual smoke (ADMIN session + public site)

- [ ] Empty integrations → no `gtm-bootstrap` / `ga4-*` / `meta-pixel` in public DOM
- [ ] GA4 only → `ga4-loader` + `ga4-config`; no GTM
- [ ] GTM only → `gtm-bootstrap` (+ noscript); no `ga4-*`
- [ ] GTM + GA4 → GTM only (no `ga4-*`)
- [ ] Meta only → `meta-pixel` present
- [ ] Meta + GTM → both present; still no direct GA4 if GA4 also set
- [ ] `/admin/**` → no tracking script ids
- [ ] (Optional) settings fetch failure does not 500 the homepage

## Known issues (unrelated)

- Repo-wide lint/build debt on parent branch (e.g. categories page-auth / API module tests)
- ESLint warning on Meta noscript `<img>` (expected pixel fallback tradeoff)

## Spec / plan

- `docs/superpowers/specs/2026-08-12-integrations-runtime-v1-design.md`
- `docs/superpowers/plans/2026-08-12-integrations-runtime-v1.md`

## Commits (Runtime)

- `870b269` docs: Runtime V1 design
- `8f6b240` docs: Runtime V1 plan + fail-safe notes
- `9a7e529` consent + resolve-tracking + tests
- `4408988` GTM / GA4 / Meta providers
- `2e7b781` TrackingScripts orchestrator
- `2260202` mount on public site layout
