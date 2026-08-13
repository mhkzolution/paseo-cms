# Integrations Settings Dashboard UX V5 — Split Workspace Design

**Date:** 2026-08-13  
**Status:** Implementing  

**Scope:** UI-only workspace layout. No resolver / consent / API changes.

## Layout

Desktop (`xl+`):

```txt
Left ~60%                    Right ~40%
Connection Status            Monitoring
Configuration 2×2            Runtime Status
Save                         Consent & Events
```

Mobile (`< xl`): stack — Connection Status → Configuration → Monitoring.

## Connection Status

Compact list (not overview cards). Runtime-only + StatusBadge.

## Monitoring

Runtime above Consent (stacked in right column — avoids nested 2-col crush).
