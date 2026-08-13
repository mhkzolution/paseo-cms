# Integrations Settings Dashboard UX V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill remaining desktop horizontal space on Integrations by wrapping settings in a Configuration 2×2 grid with `items-start`, right-aligned Save, and shorter Overview empty-state copy — UI only.

**Architecture:** Keep V1 diagnostics panel. Change only `integrations-form.tsx` structure and Overview secondary strings in the panel. No resolver/API changes.

**Tech Stack:** Existing React form sections, Tailwind `lg:grid-cols-2 lg:items-start`, shared `StatusBadge` from V1.

## Global Constraints

- UI-only; do not modify `resolve-integration-diagnostics` / `resolve-consent-aware-diagnostics`.
- Configuration cards: independent height (`lg:items-start`).
- Save after Configuration grid with `flex justify-end`.
- Overview empty copy exactly: `Container missing` / `Measurement ID missing` / `Pixel ID missing` / `LINE OA missing`.
- Preserve soft wiring invariants and substrings `Consent & Events`, `Simulation only`.
- Implement on `feat/integrations-consent-aware-diagnostics-v1`.

## File map

| File | Change |
|------|--------|
| Modify: `features/settings/integrations-form.tsx` | Configuration section + 2×2 + Save |
| Modify: `features/settings/integrations-diagnostics-panel.tsx` | Overview empty secondary strings |
| Docs: `docs/superpowers/specs/2026-08-13-integrations-settings-dashboard-ux-v2-design.md` | already written |
| Optional: V2 PR body after smoke |

---

### Task 1: Configuration 2×2 + Save justify-end

**Files:**
- Modify: `features/settings/integrations-form.tsx`

**Interfaces:**
- Consumes: existing section components + Button
- Produces: Configuration landmark wrapping 2×2 grid + save row

- [ ] **Step 1: Wrap settings in Configuration section**

Replace flat stack of four sections + left Save with:

```tsx
<section
  aria-labelledby="integration-configuration-heading"
  className="grid gap-4"
>
  <header>
    <h2
      id="integration-configuration-heading"
      className="text-base font-semibold text-foreground"
    >
      Integration Configuration
    </h2>
    <p className="mt-1 text-sm text-muted">
      Manage provider credentials and identifiers
    </p>
  </header>

  <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
    <IntegrationsAnalyticsSection register={register} errors={errors} />
    <IntegrationsTagManagerSection register={register} errors={errors} />
    <IntegrationsMetaSection register={register} errors={errors} />
    <IntegrationsLineSection register={register} errors={errors} />
  </div>

  {serverMessage ? (
    <p className={isSuccess ? "text-sm text-emerald-700" : "text-sm text-destructive"}>
      {serverMessage}
    </p>
  ) : null}

  <div className="flex justify-end">
    <Button type="submit" isLoading={isSubmitting}>
      Save Integrations
    </Button>
  </div>
</section>
```

Keep diagnostics panel above this section. Keep `max-w-7xl` on form.

- [ ] **Step 2: Confirm no `items-stretch`**

Grid must include `lg:items-start` (or rely on default stretch avoidance — prefer explicit `lg:items-start`).

- [ ] **Step 3: Commit**

```bash
git add features/settings/integrations-form.tsx
git commit -m "$(cat <<'EOF'
feat(integrations): lay out configuration settings in a 2x2 dashboard grid

EOF
)"
```

---

### Task 2: Overview empty secondary copy

**Files:**
- Modify: `features/settings/integrations-diagnostics-panel.tsx` (`overviewSecondary`)

**Interfaces:**
- Consumes: same diagnostics fields
- Produces: channel-specific missing strings

- [ ] **Step 1: Update `overviewSecondary` empty branches**

```ts
function overviewSecondary(channel: ChannelKey, diagnostics: IntegrationDiagnostics): string {
  const { configured, resolved } = diagnostics;
  if (channel === "gtm") return configured.gtmContainerId ?? "Container missing";
  if (channel === "ga4") return configured.gaMeasurementId ?? "Measurement ID missing";
  if (channel === "meta") return configured.metaPixelId ?? "Pixel ID missing";
  return resolved.lineOaUrl ?? configured.lineOaId ?? "LINE OA missing";
}
```

- [ ] **Step 2: Commit**

```bash
git add features/settings/integrations-diagnostics-panel.tsx
git commit -m "$(cat <<'EOF'
feat(integrations): shorten overview empty-state secondary labels

EOF
)"
```

---

### Task 3: Lint, tests, packaging

- [ ] **Step 1: ESLint**

```bash
npx eslint \
  features/settings/integrations-form.tsx \
  features/settings/integrations-diagnostics-panel.tsx
```

- [ ] **Step 2: Tests**

```bash
node --import tsx --test \
  tests/resolve-consent-aware-diagnostics.test.ts \
  tests/resolve-integration-diagnostics.test.ts \
  tests/integrations-diagnostics-wiring.test.ts
```

- [ ] **Step 3: Manual smoke checklist from design §8**

- [ ] **Step 4: Optional PR body + commit docs**

Title: `feat(integrations): complete Integrations settings dashboard layout (V2)`

- [ ] **Step 5: Push branch**

---

## Execution notes

- Same branch as Consent-aware Diagnostics + Dashboard UX V1.
- Do not introduce sticky Save in this plan.
