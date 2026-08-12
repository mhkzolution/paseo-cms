# Integrations LINE OA Surfaces V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a public LINE Official Account floating CTA and footer link when Integrations `lineOaId` is configured — no new CMS fields.

**Architecture:** Pure `resolveLineOaUrl()` builds `https://line.me/R/ti/p/@<id>`. `LineOaSurfaces` (Server Component) fail-soft-loads integrations settings and renders `LineFloatingButton` from `app/[locale]/layout.tsx`. `SiteFooter` extends its existing `getSettings` load with `lineOaId` (no second `getIntegrationSettings()` call) and renders `LineFooterLink` when resolved.

**Tech Stack:** Next.js App Router, next-intl, `react-icons/fa` (`FaLine`), existing `getIntegrationSettings` / `getSettings`, `node:test` + `tsx`

**Spec:** `docs/superpowers/specs/2026-08-12-integrations-line-oa-surfaces-v1-design.md`

## Global Constraints

- Source field: `lineOaId` only — no toggles, no `lineOaUrl`, no migration
- URL: `https://line.me/R/ti/p/` + normalized `@id`; OA identifier expected (no URL prefix stripping)
- Visibility: empty/whitespace → hide both surfaces; set → show both
- Floating: fixed bottom-right, all viewports, `target="_blank"`, `rel="noopener noreferrer"`
- Mount floating only in `app/[locale]/layout.tsx` — never `app/layout.tsx`, `app/admin/**`, or `(site)/layout` alone
- Fail-soft: integrations fetch failure → render nothing (do not crash)
- Footer: prefer extending existing `getSettings(...)` with `lineOaId`; avoid a dedicated `getIntegrationSettings()` in `SiteFooter`
- Icon: reuse `FaLine` (same as `SiteSocialIcons`)
- Keep General Settings `lineUrl` social icon behavior unchanged
- z-index: above content (footer `z-20`), below modals (`z-50`) — prefer `z-40`

## File map

| Path | Responsibility |
|------|----------------|
| `components/integrations/resolve-line-oa.ts` | `resolveLineOaUrl()` |
| `components/integrations/line-floating-button.tsx` | Floating CTA |
| `components/integrations/line-footer-link.tsx` | Footer OA link |
| `components/integrations/line-oa-surfaces.tsx` | Orchestrator (floating) |
| `app/[locale]/layout.tsx` | Mount `<LineOaSurfaces />` |
| `features/layout/site-footer.tsx` | Wire `LineFooterLink` via extended settings keys |
| `messages/th.json` / `messages/en.json` | Floating + footer LINE labels |
| `tests/resolve-line-oa.test.ts` | URL resolution matrix |
| `tests/line-oa-surfaces-wiring.test.ts` | Layout / fail-soft / footer source asserts |

---

### Task 1: resolveLineOaUrl + unit tests

**Files:**
- Create: `components/integrations/resolve-line-oa.ts`
- Create: `tests/resolve-line-oa.test.ts`

**Interfaces:**
- Produces: `resolveLineOaUrl(raw: string | null | undefined): string | null`

- [ ] **Step 1: Write failing tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveLineOaUrl } from "@/components/integrations/resolve-line-oa";

describe("resolveLineOaUrl", () => {
  it("returns null for empty / whitespace / nullish", () => {
    assert.equal(resolveLineOaUrl(""), null);
    assert.equal(resolveLineOaUrl("   "), null);
    assert.equal(resolveLineOaUrl(null), null);
    assert.equal(resolveLineOaUrl(undefined), null);
  });

  it("builds line.me deep link from @id", () => {
    assert.equal(
      resolveLineOaUrl("@thepaseo"),
      "https://line.me/R/ti/p/@thepaseo",
    );
  });

  it("prepends @ when missing", () => {
    assert.equal(
      resolveLineOaUrl("thepaseo"),
      "https://line.me/R/ti/p/@thepaseo",
    );
  });

  it("trims and strips internal whitespace", () => {
    assert.equal(
      resolveLineOaUrl(" @thepaseo "),
      "https://line.me/R/ti/p/@thepaseo",
    );
  });

  it("does not parse pasted LINE URLs (identifier-only contract)", () => {
    const pasted = "https://line.me/R/ti/p/@thepaseo";
    assert.equal(
      resolveLineOaUrl(pasted),
      `https://line.me/R/ti/p/@${pasted}`,
    );
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
node --import tsx --test tests/resolve-line-oa.test.ts
```

- [ ] **Step 3: Implement**

```ts
export function resolveLineOaUrl(raw: string | null | undefined): string | null {
  const compacted = (raw ?? "").trim().replace(/\s+/g, "");
  if (!compacted) return null;
  const id = compacted.startsWith("@") ? compacted : `@${compacted}`;
  return `https://line.me/R/ti/p/${id}`;
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
node --import tsx --test tests/resolve-line-oa.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add components/integrations/resolve-line-oa.ts tests/resolve-line-oa.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): add resolveLineOaUrl helper

EOF
)"
```

---

### Task 2: Presentational surfaces (Floating + Footer link)

**Files:**
- Create: `components/integrations/line-floating-button.tsx`
- Create: `components/integrations/line-footer-link.tsx`
- Modify: `messages/th.json` — under `footer` (and/or a small `integrations` / `line` namespace if cleaner)
- Modify: `messages/en.json` — same keys

**Interfaces:**
- Consumes: `href: string`
- Produces: accessible links using `FaLine`, `target="_blank"`, `rel="noopener noreferrer"`

- [ ] **Step 1: Add i18n strings**

Suggested keys (adjust if project prefers nesting under `footer`):

```json
"lineOaContact": "ติดต่อเราทาง LINE",
"lineOaFooter": "LINE Official Account"
```

English:

```json
"lineOaContact": "Contact us on LINE",
"lineOaFooter": "LINE Official Account"
```

- [ ] **Step 2: Implement `LineFloatingButton`**

```tsx
import { FaLine } from "react-icons/fa";

type LineFloatingButtonProps = {
  href: string;
  label: string;
};

export function LineFloatingButton({ href, label }: LineFloatingButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#06C755] text-white shadow-lg transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#06C755]"
    >
      <FaLine className="h-7 w-7" aria-hidden />
    </a>
  );
}
```

Pass `label` from a Server parent via `getTranslations` (do not hardcode English inside the component).

- [ ] **Step 3: Implement `LineFooterLink`**

```tsx
import { FaLine } from "react-icons/fa";

type LineFooterLinkProps = {
  href: string;
  label: string;
};

export function LineFooterLink({ href, label }: LineFooterLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-paseo-dark"
    >
      <FaLine className="h-4 w-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </a>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/integrations/line-floating-button.tsx \
  components/integrations/line-footer-link.tsx \
  messages/th.json messages/en.json
git commit -m "$(cat <<'EOF'
feat(integrations): add LINE OA floating and footer link components

EOF
)"
```

---

### Task 3: LineOaSurfaces orchestrator + layout mount

**Files:**
- Create: `components/integrations/line-oa-surfaces.tsx`
- Modify: `app/[locale]/layout.tsx`
- Create: `tests/line-oa-surfaces-wiring.test.ts` (layout + fail-soft asserts; footer assert added in Task 4)

**Interfaces:**
- Consumes: `getIntegrationSettings`, `resolveLineOaUrl`, `LineFloatingButton`
- Produces: async Server Component returning null or floating button

- [ ] **Step 1: Write failing wiring tests (layout + fail-soft)**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("LINE OA surfaces wiring", () => {
  it("mounts LineOaSurfaces on the locale layout only", () => {
    assert.match(read("app/[locale]/layout.tsx"), /LineOaSurfaces/);
    assert.doesNotMatch(read("app/layout.tsx"), /LineOaSurfaces/);
    assert.doesNotMatch(read("app/admin/layout.tsx"), /LineOaSurfaces/);
    assert.doesNotMatch(read("app/[locale]/(site)/layout.tsx"), /LineOaSurfaces/);
  });

  it("fails soft when settings cannot be loaded", () => {
    const source = read("components/integrations/line-oa-surfaces.tsx");
    assert.match(source, /try\s*\{/);
    assert.match(source, /getIntegrationSettings/);
    assert.match(source, /catch/);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
node --import tsx --test tests/line-oa-surfaces-wiring.test.ts
```

- [ ] **Step 3: Implement orchestrator**

```tsx
import { getTranslations } from "next-intl/server";

import { LineFloatingButton } from "@/components/integrations/line-floating-button";
import { resolveLineOaUrl } from "@/components/integrations/resolve-line-oa";
import { getIntegrationSettings } from "@/lib/integration-settings";

export async function LineOaSurfaces() {
  let settings;
  try {
    settings = await getIntegrationSettings();
  } catch {
    return null;
  }

  const href = resolveLineOaUrl(settings.lineOaId);
  if (!href) return null;

  const t = await getTranslations("footer");
  return <LineFloatingButton href={href} label={t("lineOaContact")} />;
}
```

- [ ] **Step 4: Wire locale layout**

In `app/[locale]/layout.tsx`, next to `TrackingScripts`:

```tsx
import { LineOaSurfaces } from "@/components/integrations/line-oa-surfaces";
// ...
<TrackingScripts />
<LineOaSurfaces />
{children}
```

- [ ] **Step 5: Run — expect PASS**

```bash
node --import tsx --test tests/line-oa-surfaces-wiring.test.ts tests/resolve-line-oa.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add components/integrations/line-oa-surfaces.tsx \
  "app/[locale]/layout.tsx" \
  tests/line-oa-surfaces-wiring.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): mount LINE OA floating surface on locale layout

EOF
)"
```

---

### Task 4: Footer wiring (no duplicate integrations fetch)

**Files:**
- Modify: `features/layout/site-footer.tsx`
- Modify: `tests/line-oa-surfaces-wiring.test.ts`

**Interfaces:**
- Consumes: `resolveLineOaUrl`, `LineFooterLink`, existing footer settings load
- Produces: footer OA link when `lineOaId` resolves

- [ ] **Step 1: Extend wiring test**

```ts
it("wires LineFooterLink via SiteFooter without getIntegrationSettings", () => {
  const source = read("features/layout/site-footer.tsx");
  assert.match(source, /LineFooterLink|resolveLineOaUrl/);
  assert.doesNotMatch(source, /getIntegrationSettings/);
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
node --import tsx --test tests/line-oa-surfaces-wiring.test.ts
```

- [ ] **Step 3: Wire SiteFooter**

Prefer (exact shape may adapt to current `getSettings` typing):

```ts
import { LineFooterLink } from "@/components/integrations/line-footer-link";
import { resolveLineOaUrl } from "@/components/integrations/resolve-line-oa";
import {
  DEFAULT_INTEGRATION_SETTINGS,
  DEFAULT_SETTINGS,
  getSettings,
  SETTINGS_KEYS,
} from "@/lib/settings";

const FOOTER_SETTINGS_KEYS = [...SETTINGS_KEYS, "lineOaId"] as const;

// in SiteFooter:
const settings = await getSettings(FOOTER_SETTINGS_KEYS, {
  ...DEFAULT_SETTINGS,
  lineOaId: DEFAULT_INTEGRATION_SETTINGS.lineOaId,
});
const lineOaHref = resolveLineOaUrl(settings.lineOaId);
```

Render near Follow Us / social block (or leasing contact column if visually clearer — prefer Follow Us section):

```tsx
{lineOaHref ? (
  <LineFooterLink href={lineOaHref} label={t("lineOaFooter")} />
) : null}
```

Do **not** import `getIntegrationSettings` in this file.

- [ ] **Step 4: Run — expect PASS**

```bash
node --import tsx --test tests/line-oa-surfaces-wiring.test.ts tests/resolve-line-oa.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add features/layout/site-footer.tsx tests/line-oa-surfaces-wiring.test.ts
git commit -m "$(cat <<'EOF'
feat(integrations): add LINE OA footer link from lineOaId

EOF
)"
```

---

### Task 5: Lint + manual smoke + PR readiness

- [ ] **Step 1: Lint touched files**

```bash
npx eslint components/integrations/resolve-line-oa.ts \
  components/integrations/line-floating-button.tsx \
  components/integrations/line-footer-link.tsx \
  components/integrations/line-oa-surfaces.tsx \
  "app/[locale]/layout.tsx" \
  features/layout/site-footer.tsx \
  tests/resolve-line-oa.test.ts \
  tests/line-oa-surfaces-wiring.test.ts
```

- [ ] **Step 2: Manual smoke checklist**

```txt
✅ Empty lineOaId → no floating, no footer OA link
✅ lineOaId=@thepaseo → floating + footer → https://line.me/R/ti/p/@thepaseo
✅ Homepage (/) shows floating
✅ Inner page e.g. /about shows floating + footer
✅ /admin/** → no floating
✅ lineUrl social icon still independent
✅ Floating aria-label present; z-index below modals
```

- [ ] **Step 3: Push + open PR**

```bash
git push -u origin HEAD
```

**Title:** `feat(integrations): add LINE OA floating CTA and footer link`

**Base:** current post–Runtime V1 line (`feat/seo-completion-v1` or `main` as appropriate)

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| `resolveLineOaUrl` + identifier-only contract | Task 1 |
| Floating + Footer presentational (`FaLine`, a11y, z-40) | Task 2 |
| `LineOaSurfaces` fail-soft + locale layout mount | Task 3 |
| Footer via extended `getSettings` (no `getIntegrationSettings`) | Task 4 |
| Smoke + PR | Task 5 |
| No `(site)`-only mount / no admin / no new fields | Global Constraints |
