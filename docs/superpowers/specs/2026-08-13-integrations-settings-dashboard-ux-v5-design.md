# Integrations Settings Dashboard UX V5 Design

**Date:** 2026-08-13  
**Status:** Final Spec — implementing  

**Depends on:** Dashboard UX V1–V4  
**Scope:** **Reorder only** — Setup First / Observe Later. No Overview actionable cards. No width/resolver/API changes.

## Goal

Put Configuration (primary job) above Monitoring so admins see setup fields before diagnostics.

## Page order

```txt
Overview cards
Configuration (2×2 + Save)
────────
Monitoring (Runtime | Consent)
```

## Decisions

| # | Choice |
|---|--------|
| 1 | Reorder only (A) |
| 2 | Keep V4 density inside Monitoring |
| 3 | Overview cards unchanged (no Needs Setup / Configure →) |
| 4 | Deferred: V5.1 actionable overview, V7+ drawers |

## Implementation

- Split diagnostics panel so Overview can render above Configuration, Monitoring below.
- Form section order: Overview → Configuration → Monitoring header + Runtime/Consent.
- Preserve soft invariants and wiring substrings.
