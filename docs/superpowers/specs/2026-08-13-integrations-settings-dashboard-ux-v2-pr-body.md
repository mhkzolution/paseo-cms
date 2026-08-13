# PR addendum — Integrations Settings Dashboard UX V2

**Branch:** `feat/integrations-consent-aware-diagnostics-v1`  
**Title (if separate):** `feat(integrations): complete Integrations settings dashboard layout (V2)`

## Summary

V2 fills remaining desktop horizontal space after V1:

- **Integration Configuration** section (Monitoring vs Configuration hierarchy)
- Settings **2×2** grid (`lg:grid-cols-2 lg:items-start`)
- Save **`justify-end`** under the grid
- Overview empty secondary: `Container missing` / `Measurement ID missing` / `Pixel ID missing` / `LINE OA missing`

Still UI-only — resolvers / consent / API unchanged.

## Manual smoke

```txt
□ Desktop 2×2 settings; independent card heights
□ Configuration heading above grid
□ Save right-aligned under grid
□ Mobile settings stack
□ Overview … missing strings when empty
□ Overview ignores Consent toggles
□ Save works; soft invariants hold
```
