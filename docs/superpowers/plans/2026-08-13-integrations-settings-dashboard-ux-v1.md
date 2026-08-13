# Integrations Settings Dashboard UX V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `/admin/settings/integrations` presentation into a wider dashboard with Runtime overview cards and a split Runtime | Consent diagnostics layout — without changing resolvers, simulation logic, or APIs.

**Architecture:** UI-only. Keep `resolveIntegrationDiagnostics` and `resolveConsentAwareDiagnostics` as sources of truth. Extract a shared `StatusBadge`. Widen form to `max-w-7xl`. Overview reads Runtime only. Diagnostics become two surface cards at `lg+`.

**Tech Stack:** Next.js App Router, React client components, Tailwind CSS utility tokens already used in admin settings (`border-border`, `bg-surface`, `text-muted`, etc.), existing Node test wiring suite.

## Global Constraints

- Presentation only — do not modify `components/integrations/resolve-*.ts` behavior or exports unless a type-only re-export is unavoidable (prefer zero resolver edits).
- Overview = Runtime only (Decision A).
- Container: `max-w-7xl` (not unbounded `w-full`).
- Settings sections remain single-column stack.
- Shared `StatusBadge` required for Overview, Runtime rows, Consent Result.
- Overview secondary line: configured ID/URL or exactly `No ID configured`.
- Preserve soft invariants: no Save blocking, no consent localStorage writes, no tracking calls, no EventsDebugPanel on admin.
- Preserve wiring-test substrings: `Consent & Events`, `Simulation only`.
- Do not change tests unless string/snapshot matches require updates — never weaken soft assertions.

## File map

| File | Responsibility |
|------|----------------|
| Create: `features/settings/integration-status-badge.tsx` | Shared dumb badge |
| Modify: `features/settings/integrations-diagnostics-panel.tsx` | Overview + split layout + badge usage |
| Modify: `features/settings/integrations-form.tsx` | `max-w-4xl` → `max-w-7xl` |
| Touch only if needed: `tests/integrations-diagnostics-wiring.test.ts` | String matches if copy structure moves |
| Do not modify: `resolve-consent-aware-diagnostics.ts`, `resolve-integration-diagnostics.ts`, section form files (unless trivial spacing) |

---

### Task 1: Shared StatusBadge

**Files:**
- Create: `features/settings/integration-status-badge.tsx`
- Test: none required (presentational); verify by TypeScript compile / eslint later
- Modify: none yet (wired in Task 2–3)

**Interfaces:**
- Consumes: none
- Produces:

```ts
export type StatusBadgeTone = "success" | "warning" | "danger" | "muted";

export type StatusBadgeProps = {
  label: string;
  tone: StatusBadgeTone;
  className?: string;
};

export function StatusBadge({ label, tone, className }: StatusBadgeProps): JSX.Element;
```

Tone classes (exact Tailwind; adjust only if token missing):

| Tone | Classes |
|------|---------|
| success | `bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200` |
| warning | `bg-amber-50 text-amber-900 ring-1 ring-amber-200` |
| danger | `bg-red-50 text-red-800 ring-1 ring-red-200` |
| muted | `bg-neutral-100 text-muted ring-1 ring-border` (or `bg-muted/40` if that utility exists in project) |

- [ ] **Step 1: Create `integration-status-badge.tsx`**

```tsx
import { cn } from "@/lib/utils"; // only if `cn` already exists; otherwise template literal / clsx already used in repo

const TONE_CLASS: Record<StatusBadgeTone, string> = {
  success: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  warning: "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
  danger: "bg-red-50 text-red-800 ring-1 ring-red-200",
  muted: "bg-neutral-100 text-muted ring-1 ring-border",
};

export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return (
    <span
      className={
        /* merge: inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium + TONE_CLASS[tone] + className */
      }
    >
      {label}
    </span>
  );
}
```

If `@/lib/utils` / `cn` does not exist, use string concatenation; do not add a new dependency.

- [ ] **Step 2: Export only the badge — no status mapping yet**

Mapping from runtime/simulation enums stays in the diagnostics panel so the badge remains dumb.

- [ ] **Step 3: Commit**

```bash
git add features/settings/integration-status-badge.tsx
git commit -m "$(cat <<'EOF'
feat(integrations): add shared StatusBadge for diagnostics dashboard

EOF
)"
```

---

### Task 2: Widen form + Integration Overview cards

**Files:**
- Modify: `features/settings/integrations-form.tsx` (container class only)
- Modify: `features/settings/integrations-diagnostics-panel.tsx`
- Consumes: `StatusBadge`, `diagnostics.runtime`, `diagnostics.configured`, `diagnostics.resolved`, `runtimeStatusLabel`

**Interfaces:**
- Consumes: `StatusBadge` from Task 1; existing `IntegrationDiagnostics` props
- Produces: Overview section above diagnostics split (split itself may still be stacked until Task 3)

- [ ] **Step 1: Widen form container**

In `integrations-form.tsx`, change:

```tsx
className="grid max-w-4xl gap-6"
```

to:

```tsx
className="grid max-w-7xl gap-6"
```

- [ ] **Step 2: Add runtime → badge helpers in the panel**

```ts
function runtimeTone(status: RuntimeChannelStatus): StatusBadgeTone {
  if (status === "active") return "success";
  if (status === "suppressed") return "warning";
  return "muted";
}
```

Use existing `runtimeStatusLabel(channel, status)` for the badge `label`.

- [ ] **Step 3: Add Overview secondary line helpers**

```ts
function overviewSecondary(channel: ChannelKey, diagnostics: IntegrationDiagnostics): string {
  // return configured id/url or exactly "No ID configured"
}
```

Rules from spec §4:

| Channel | Value |
|---------|-------|
| gtm | `configured.gtmContainerId` or `No ID configured` |
| ga4 | `configured.gaMeasurementId` or `No ID configured` |
| meta | `configured.metaPixelId` or `No ID configured` |
| lineOa | `resolved.lineOaUrl` (or configured LINE URL field already used) or `No ID configured` |

Truncate in UI with `truncate` + `title={full}`.

- [ ] **Step 4: Render Overview**

At top of panel (before Runtime/Consent):

```tsx
<section aria-label="Integration overview" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
  {/* 4 cards: short name GTM/GA4/Meta/LINE, StatusBadge from runtime, secondary line */}
</section>
```

Card chrome: `rounded-lg border border-border bg-surface p-4 shadow-sm`.

**Critical:** Overview must read `diagnostics.runtime` only — do not pass `simulation` / `consentAware` into Overview.

- [ ] **Step 5: Smoke mentally — Marketing OFF must not change Overview**

No code path from `setSimulation` into Overview props.

- [ ] **Step 6: Commit**

```bash
git add features/settings/integrations-form.tsx features/settings/integrations-diagnostics-panel.tsx
git commit -m "$(cat <<'EOF'
feat(integrations): widen settings dashboard and add runtime overview cards

EOF
)"
```

---

### Task 3: Split Runtime | Consent columns + restyle rows

**Files:**
- Modify: `features/settings/integrations-diagnostics-panel.tsx`
- Optional: leave settings section files untouched

**Interfaces:**
- Consumes: existing `resolveConsentAwareDiagnostics`, `REASON_LABELS`, `DEFAULT_SIMULATED_CONSENT`, `StatusBadge`
- Produces: final dashboard layout matching design §2–§6

- [ ] **Step 1: Remove single outer shell if it wraps everything**

Prefer structure:

```tsx
<>
  <Overview />
  <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm" aria-labelledby="runtime-status-heading">
      ...
    </section>
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm" aria-labelledby="consent-events-heading">
      ...
    </section>
  </div>
</>
```

Panel root may be a `div` with `className="grid gap-6"` instead of one big `section`.

- [ ] **Step 2: Runtime column headers**

```txt
h2: Runtime Status
p:  Current provider configuration
```

Keep predictive note (existing copy about saved settings / vendor scripts) as additional muted text if it still fits; do not drop meaning.

Replace `RuntimeStatusMarker` inline prose with `StatusBadge` + meta lines. Keep suppressed-GA4 explanatory sentence.

Warnings stay under Runtime column.

- [ ] **Step 3: Consent column headers + disclaimer**

```txt
h2: Consent & Events
p:  Simulation only. Does not affect visitor consent or tracking.
```

Must keep substrings `Consent & Events` and `Simulation only` for wiring tests.

- [ ] **Step 4: Keep toggles behavior identical**

Same `useState(DEFAULT_SIMULATED_CONSENT)`, same checkbox handlers, fieldset + sr-only legend. Visual only polish allowed.

- [ ] **Step 5: Consent channel cards**

For each `consentAware.channels` row:

```txt
Title (CHANNEL_TITLES)
Requires → chip/pill with REQUIRES_CONSENT_LABELS (not StatusBadge)
Result → StatusBadge from simulationResult
Reason → REASON_LABELS[reasonCode]
capabilityNotes
```

Simulation tone map:

```ts
function simulationTone(result: ConsentAwareSimulationResult): StatusBadgeTone {
  if (result === "would_fire") return "success";
  if (result === "blocked") return "danger";
  if (result === "suppressed") return "warning";
  return "muted";
}
```

Card chrome: `rounded-md border border-border/80 bg-background p-3` (or equivalent).

- [ ] **Step 6: Delete obsolete marker components if unused**

Remove `RuntimeStatusMarker` / `SimulationResultMarker` only after all call sites use `StatusBadge`.

- [ ] **Step 7: Commit**

```bash
git add features/settings/integrations-diagnostics-panel.tsx
git commit -m "$(cat <<'EOF'
feat(integrations): split diagnostics into Runtime and Consent dashboard columns

EOF
)"
```

---

### Task 4: Lint, tests, smoke, packaging

**Files:**
- Verify: panel, form, badge
- Touch tests only if string assertions fail
- Create (optional): `docs/superpowers/specs/2026-08-13-integrations-settings-dashboard-ux-v1-pr-body.md` if opening a PR

**Interfaces:** none new

- [ ] **Step 1: ESLint touched files**

```bash
npx eslint \
  features/settings/integration-status-badge.tsx \
  features/settings/integrations-diagnostics-panel.tsx \
  features/settings/integrations-form.tsx
```

Expected: clean

- [ ] **Step 2: Re-run related tests**

```bash
node --import tsx --test \
  tests/resolve-consent-aware-diagnostics.test.ts \
  tests/resolve-integration-diagnostics.test.ts \
  tests/integrations-diagnostics-wiring.test.ts
```

Expected: all pass. If wiring fails on structure-only strings, update matches minimally without weakening soft invariants.

- [ ] **Step 3: Manual smoke (human)**

```txt
□ Desktop overview 4-col + diagnostics 2-col within max-w-7xl
□ Mobile overview 2×2; Runtime then Consent stack
□ Overview ignores Consent toggles
□ Consent Results update on toggle
□ Secondary line ID or "No ID configured"
□ Save works
□ No consent localStorage mutation from admin simulation
□ No EventsDebugPanel on /admin
```

- [ ] **Step 4: PR body (optional packaging)**

Title:

```txt
feat(integrations): improve Integrations settings dashboard layout
```

Base: current epic base branch (likely `feat/seo-completion-v1` or the Consent-aware Diagnostics branch if stacking — confirm with human). Prefer stacking on the Consent-aware Diagnostics branch if that PR is not yet merged, to avoid layout conflicts.

- [ ] **Step 5: Commit packaging docs if any**

```bash
git add docs/superpowers/specs/2026-08-13-integrations-settings-dashboard-ux-v1-pr-body.md
git commit -m "$(cat <<'EOF'
docs(integrations): add Settings Dashboard UX V1 PR packaging

EOF
)"
```

---

## Execution notes

- Recommended: subagent-driven development with human checkpoint after each task.
- Do not mix Custom Events or resolver feature work into this PR.
- If Consent-aware Diagnostics V1 is still open, implement this UX on the same branch **or** branch from that head — avoid rebasing onto a base that lacks the Consent panel.
