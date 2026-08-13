# Integrations Settings Dashboard UX V3 Design

**Date:** 2026-08-13  
**Status:** Final Spec — ready for implementation  

**Depends on:** Dashboard UX V1 + V2  
**Scope:** Remove Integrations form `max-w-7xl` ceiling; keep layouts; cap settings inputs at `max-w-xl`. UI-only.

## Root cause

```txt
AdminShell <main>     = full width after sidebar (no max-w)
Integrations form     = max-w-7xl (1280px), left-aligned
→ large empty right gutter on wide desktops
```

## Decisions

| # | Choice |
|---|--------|
| 1 | Form: `w-full max-w-none` |
| 2 | Inputs: `max-w-xl` wrapper — **same pattern in all 4 sections** |
| 3 | No AdminShell / resolver / API / sticky / right summary changes |

## Implementation

1. `integrations-form.tsx`: `className="grid w-full max-w-none gap-6"`
2. Analytics / Tag Manager / Meta / LINE sections — wrap each field block:

```tsx
<div className="max-w-xl">
  <label … />
  <p … />
  <input className="mt-1.5 w-full …" … />
  {error}
</div>
```

Prefer wrapper `max-w-xl` (not only on `<input>`) so label + help + control share one measure.

## Smoke

```txt
□ No large empty right gutter from form max-width
□ Cards expand with content area
□ Inputs stop ~max-w-xl
□ Layouts / soft invariants unchanged
```
