# Integrations Settings Dashboard UX V4 Design

**Date:** 2026-08-13  
**Status:** Final Spec — implementing  

**Depends on:** Dashboard UX V1–V3  
**Scope:** UI-only density + hierarchy. No width / AdminShell / resolver / API changes.

## Decisions

| # | Choice |
|---|--------|
| 1 | Runtime dense rows; secondary line only when useful |
| 2 | Consent compact `dl` layout |
| 3 | Explicit Monitoring + Configuration hierarchy (`border-t pt-8`) |
| 4 | Dense by default; expand only when useful |
| 5 | Preserve soft invariants + `Consent & Events` / `Simulation only` strings |

## Runtime secondary lines

| Case | Secondary |
|------|-----------|
| Inactive / empty | none |
| Active + ID | optional muted ID/URL |
| GA4 Suppressed | one-line manage-in-GTM note |
| LINE Active | surfaces note |
| Warnings | Warnings block below |

## Consent

```txt
Title
Requires  chip
Result    StatusBadge
Reason    REASON_LABELS
notes…
```

via `dl` `grid-cols-[auto_1fr]`.
