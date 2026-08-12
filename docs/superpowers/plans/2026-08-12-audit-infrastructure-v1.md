# Audit Infrastructure V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Sprint 1 audit infrastructure so Auth, Settings, Localization, Posts, Events, and Promotions write append-only smart-diff rows to `audit_logs` with no UI.

**Architecture:** Explicit call-site after successful mutations. Framework-agnostic `buildDiff` + `createAuditLog` (fail-open). Thin `getAuditRequestContext` for Next.js headers only. Content status transitions use a locked Action Resolution Table (`PUBLISH` / `UNPUBLISH` / `UPDATE`).

**Tech Stack:** Prisma 6 + MySQL, Next.js App Router, NextAuth v5 (`next-auth@5`), TypeScript, `node:test` + `tsx`

**Spec:** `docs/superpowers/specs/audit-logs-v1.md`

## Global Constraints

- Audit failures must never affect the primary business operation (fail-open; API still 200/201)
- Single mutation → exactly one audit row
- `DELETE` = soft delete (`deletedAt`); no physical delete tracking
- `UNPUBLISH` only for `PUBLISHED → DRAFT`
- Store smart `changes` only — never full content snapshots
- `audit-diff.ts` / `audit-log.ts` must not import Next.js
- No UI, middleware, queue, event bus, relation diff, RESTORE caller, or failed-login audit
- Match enums/model/indexes exactly from the approved spec

## File map

| Path | Responsibility |
|------|----------------|
| `prisma/schema.prisma` | `AuditAction`, `AuditModule`, `AuditSeverity`, `AuditLog` |
| `prisma/migrations/*_add_audit_logs/` | MySQL migration |
| `lib/audit-diff.ts` | `buildDiff()` smart diff |
| `lib/audit-log.ts` | `createAuditLog()`, `getDefaultSeverity()`, types |
| `lib/audit-request.ts` | Next.js headers → `{ ipAddress, userAgent }` |
| `lib/audit-content.ts` | `resolveContentAction`, `pickContentAuditSnapshot`, `toAuditActor` |
| `lib/auth.ts` | LOGIN / LOGOUT events |
| `app/api/settings/route.ts` | Site settings UPDATE audit |
| `app/api/settings/localization/route.ts` | Localization UPDATE audit |
| `app/api/posts/route.ts` + `[id]/route.ts` | Post CREATE/UPDATE/PUBLISH/UNPUBLISH/DELETE |
| `app/api/events/route.ts` + `[id]/route.ts` | Event same actions |
| `app/api/promotions/route.ts` + `[id]/route.ts` | Promotion same actions |
| `tests/audit-diff.test.ts` | Diff engine unit tests |
| `tests/audit-log.test.ts` | Severity + change selection unit tests |

---

### Task 1: Prisma Schema + Migration (Phase 1)

**Files:**
- Modify: `prisma/schema.prisma`
- Create: migration via Prisma CLI

**Interfaces:**
- Produces: Prisma client models/enums `AuditLog`, `AuditAction`, `AuditModule`, `AuditSeverity`

- [ ] **Step 1: Add enums after existing enums block (after `SitemapChangeFrequency`)**

Append:

```prisma
enum AuditAction {
  CREATE
  UPDATE
  DELETE
  RESTORE
  PUBLISH
  UNPUBLISH
  LOGIN
  LOGOUT
}

enum AuditModule {
  AUTH
  POSTS
  EVENTS
  PROMOTIONS
  PAGES
  SETTINGS
  LOCALIZATION
  MEDIA
  USERS
}

enum AuditSeverity {
  INFO
  WARNING
  CRITICAL
}
```

- [ ] **Step 2: Add AuditLog model at end of models section (before EOF)**

```prisma
/// Append-only system audit trail.
/// DELETE = soft delete (set deletedAt). RESTORE = clear deletedAt.
/// Never soft-delete or update AuditLog rows.
model AuditLog {
  id         String @id @default(uuid())

  userId     String?
  userName   String?
  userRole   Role?

  action     AuditAction
  module     AuditModule
  severity   AuditSeverity @default(INFO)

  entityId   String?
  entityType String?
  entityName String?
  entitySlug String?

  changes    Json?

  ipAddress  String?
  userAgent  String?

  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([module])
  @@index([action])
  @@index([severity])
  @@index([createdAt])
  @@index([module, createdAt])
  @@index([action, createdAt])
  @@map("audit_logs")
}
```

- [ ] **Step 3: Validate schema**

Run: `npx prisma validate`  
Expected: schema is valid

- [ ] **Step 4: Create and apply migration**

Run: `npx prisma migrate dev --name add_audit_logs`  
Expected: migration created; client generated; `audit_logs` table exists

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`  
Expected: PASS (or only pre-existing unrelated errors — new schema should not introduce errors)

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "$(cat <<'EOF'
feat(audit): add AuditLog schema and migration

EOF
)"
```

#### Phase 1 Verification Checklist

- [ ] Migration ผ่าน
- [ ] `npx prisma validate` ผ่าน
- [ ] `npm run typecheck` ผ่าน
- [ ] No Audit UI added

---

### Task 2: `audit-diff.ts` (Phase 2)

**Files:**
- Create: `lib/audit-diff.ts`
- Create: `tests/audit-diff.test.ts`

**Interfaces:**
- Produces: `buildDiff(before, after) → Record<string, DiffValue> | null`
- Consumes: none

- [ ] **Step 1: Write failing tests**

```ts
// tests/audit-diff.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildDiff } from "@/lib/audit-diff";

describe("buildDiff", () => {
  it("returns null when nothing changed", () => {
    assert.equal(buildDiff({ title: "A" }, { title: "A" }), null);
  });

  it("diffs normal fields with before/after", () => {
    assert.deepEqual(buildDiff({ title: "Old Title" }, { title: "New Title" }), {
      title: { before: "Old Title", after: "New Title" },
    });
  });

  it("ignores createdAt updatedAt deletedAt", () => {
    assert.equal(
      buildDiff(
        { title: "A", createdAt: "1", updatedAt: "1", deletedAt: null },
        { title: "A", createdAt: "2", updatedAt: "2", deletedAt: "x" },
      ),
      null,
    );
  });

  it("masks sensitive fields", () => {
    assert.deepEqual(buildDiff({ smtpPassword: "old" }, { smtpPassword: "new" }), {
      smtpPassword: { changed: true, masked: true },
    });
  });

  it("marks long-text fields without values", () => {
    assert.deepEqual(buildDiff({ content: "long a" }, { content: "long b" }), {
      content: { changed: true },
    });
  });

  it("shallow-compares arrays without nested diff", () => {
    assert.deepEqual(buildDiff({ tags: ["a", "b"] }, { tags: ["a", "b", "c"] }), {
      tags: { before: ["a", "b"], after: ["a", "b", "c"] },
    });
  });

  it("treats null before as create-style after values", () => {
    assert.deepEqual(buildDiff(null, { title: "Hello", content: "body" }), {
      title: { before: null, after: "Hello" },
      content: { changed: true },
    });
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `node --import tsx --test tests/audit-diff.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `lib/audit-diff.ts`**

```ts
const IGNORE_KEYS = new Set(["createdAt", "updatedAt", "deletedAt"]);
const MASK_KEYS = new Set(["password", "token", "secret", "apiKey", "smtpPassword"]);
const LONG_TEXT_KEYS = new Set([
  "content",
  "customJsonLd",
  "metadata",
  "schemaOverrides",
  "robotsDirectives",
]);

export type DiffValue =
  | { before: unknown; after: unknown }
  | { changed: true; masked?: true };

export type DiffResult = Record<string, DiffValue>;

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(obj[key])}`).join(",")}}`;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a === "object" || typeof b === "object") {
    return stableSerialize(a) === stableSerialize(b);
  }
  return false;
}

export function buildDiff(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): DiffResult | null {
  const left = before ?? {};
  const right = after ?? {};
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  const result: DiffResult = {};

  for (const key of keys) {
    if (IGNORE_KEYS.has(key)) continue;

    const beforeValue = left[key] ?? null;
    const afterValue = right[key] ?? null;
    if (valuesEqual(beforeValue, afterValue)) continue;

    if (MASK_KEYS.has(key)) {
      result[key] = { changed: true, masked: true };
      continue;
    }

    if (LONG_TEXT_KEYS.has(key)) {
      result[key] = { changed: true };
      continue;
    }

    result[key] = { before: beforeValue, after: afterValue };
  }

  return Object.keys(result).length === 0 ? null : result;
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `node --import tsx --test tests/audit-diff.test.ts`  
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/audit-diff.ts tests/audit-diff.test.ts
git commit -m "$(cat <<'EOF'
feat(audit): add smart buildDiff helper

EOF
)"
```

#### Phase 2 Verification Checklist

- [ ] `tests/audit-diff.test.ts` ผ่าน
- [ ] Empty diff → `null`
- [ ] Mask / LongText / Ignore ตรง spec
- [ ] No Next.js imports in `lib/audit-diff.ts`

---

### Task 3: `audit-log.ts` + `audit-request.ts` (Phase 3)

**Files:**
- Create: `lib/audit-log.ts`
- Create: `lib/audit-request.ts`
- Create: `tests/audit-log.test.ts`

**Interfaces:**
- Consumes: `buildDiff` from `lib/audit-diff.ts`; Prisma `AuditAction` / `AuditModule` / `AuditSeverity` / `Role`
- Produces:
  - `getDefaultSeverity(action: AuditAction): AuditSeverity`
  - `createAuditLog(input: CreateAuditLogInput): Promise<void>`
  - `getAuditRequestContext(): AuditRequestContext`
  - types `AuditActor`, `AuditRequestContext`, `CreateAuditLogInput`

- [ ] **Step 1: Write failing unit tests for severity + change selection (pure helpers extracted or tested via exported functions)**

```ts
// tests/audit-log.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuditAction } from "@prisma/client";

import { getDefaultSeverity, resolveAuditChanges } from "@/lib/audit-log";

describe("getDefaultSeverity", () => {
  it("maps DELETE to WARNING", () => {
    assert.equal(getDefaultSeverity(AuditAction.DELETE), "WARNING");
  });

  it("maps other actions to INFO", () => {
    assert.equal(getDefaultSeverity(AuditAction.LOGIN), "INFO");
    assert.equal(getDefaultSeverity(AuditAction.UPDATE), "INFO");
    assert.equal(getDefaultSeverity(AuditAction.PUBLISH), "INFO");
  });
});

describe("resolveAuditChanges", () => {
  it("uses explicit changes escape hatch", () => {
    const changes = { title: { before: "a", after: "b" } };
    assert.equal(resolveAuditChanges({ changes }), changes);
  });

  it("returns null when no before/after and no changes", () => {
    assert.equal(resolveAuditChanges({}), null);
  });

  it("builds diff when before/after provided", () => {
    assert.deepEqual(resolveAuditChanges({ before: { title: "a" }, after: { title: "b" } }), {
      title: { before: "a", after: "b" },
    });
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `node --import tsx --test tests/audit-log.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `lib/audit-log.ts`**

```ts
import {
  AuditAction,
  AuditModule,
  AuditSeverity,
  type Role,
  Prisma,
} from "@prisma/client";

import { buildDiff } from "@/lib/audit-diff";
import { prisma } from "@/lib/prisma";

export type AuditActor = {
  id: string;
  name: string;
  role?: Role | null;
};

export type AuditRequestContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type CreateAuditLogInput = {
  user?: AuditActor | null;
  action: AuditAction;
  module: AuditModule;
  severity?: AuditSeverity;
  entityId?: string | null;
  entityType?: string | null;
  entityName?: string | null;
  entitySlug?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  changes?: Record<string, unknown> | null;
  context?: AuditRequestContext | null;
};

export function getDefaultSeverity(action: AuditAction): AuditSeverity {
  return action === AuditAction.DELETE ? AuditSeverity.WARNING : AuditSeverity.INFO;
}

export function resolveAuditChanges(input: {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  changes?: Record<string, unknown> | null;
}): Record<string, unknown> | null {
  if ("changes" in input) {
    return input.changes ?? null;
  }
  if (input.before || input.after) {
    return buildDiff(input.before, input.after);
  }
  return null;
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  try {
    const severity = input.severity ?? getDefaultSeverity(input.action);
    const changes = resolveAuditChanges(input);

    await prisma.auditLog.create({
      data: {
        userId: input.user?.id ?? null,
        userName: input.user?.name ?? null,
        userRole: input.user?.role ?? null,
        action: input.action,
        module: input.module,
        severity,
        entityId: input.entityId ?? null,
        entityType: input.entityType ?? null,
        entityName: input.entityName ?? null,
        entitySlug: input.entitySlug ?? null,
        changes: changes === null ? Prisma.JsonNull : (changes as Prisma.InputJsonValue),
        ipAddress: input.context?.ipAddress ?? null,
        userAgent: input.context?.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write audit log", {
      action: input.action,
      module: input.module,
      entityId: input.entityId,
      error,
    });
  }
}

export { AuditAction, AuditModule, AuditSeverity };
```

Escape hatch rule: if the `changes` property is present (including explicit `null`), use it; otherwise buildDiff when before/after exist; otherwise `null`.

- [ ] **Step 4: Implement `lib/audit-request.ts`**

```ts
import { headers } from "next/headers";

import type { AuditRequestContext } from "@/lib/audit-log";

export async function getAuditRequestContext(): Promise<AuditRequestContext> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ipAddress =
    forwarded?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    null;
  const userAgent = headerStore.get("user-agent");

  return {
    ipAddress,
    userAgent,
  };
}
```

- [ ] **Step 5: Run unit tests**

Run: `node --import tsx --test tests/audit-log.test.ts tests/audit-diff.test.ts`  
Expected: PASS

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`  
Expected: PASS for new files

- [ ] **Step 7: Commit**

```bash
git add lib/audit-log.ts lib/audit-request.ts tests/audit-log.test.ts
git commit -m "$(cat <<'EOF'
feat(audit): add createAuditLog helper and request context adapter

EOF
)"
```

#### Phase 3 Verification Checklist

- [ ] Unit tests ผ่าน
- [ ] Fail-open implemented (try/catch, no rethrow)
- [ ] `lib/audit-log.ts` has no Next.js imports
- [ ] `lib/audit-request.ts` is the only Next adapter
- [ ] Typecheck ผ่าน

---

### Task 4: Auth Wiring (Phase 4)

**Files:**
- Modify: `lib/auth.ts`

**Interfaces:**
- Consumes: `createAuditLog`, `AuditAction`, `AuditModule`, `getAuditRequestContext`
- Produces: LOGIN on `events.signIn`; LOGOUT best-effort on `events.signOut`

- [ ] **Step 1: Add events to NextAuth config in `lib/auth.ts`**

Import and append `events` alongside existing `callbacks`:

```ts
import { AuditAction, AuditModule, createAuditLog } from "@/lib/audit-log";
import { getAuditRequestContext } from "@/lib/audit-request";
import type { Role } from "@prisma/client";

// inside NextAuth({ ... })
events: {
  async signIn({ user }) {
    await createAuditLog({
      user: {
        id: user.id ?? "",
        name: user.name ?? user.email ?? "Unknown",
        role: (user.role as Role | undefined) ?? null,
      },
      action: AuditAction.LOGIN,
      module: AuditModule.AUTH,
      context: await getAuditRequestContext(),
    });
  },
  async signOut(message) {
    const token = "token" in message ? message.token : null;
    const user =
      token?.id
        ? {
            id: String(token.id),
            name: typeof token.name === "string" ? token.name : "Unknown",
            role: (token.role as Role | undefined) ?? null,
          }
        : null;

    await createAuditLog({
      user,
      action: AuditAction.LOGOUT,
      module: AuditModule.AUTH,
      context: await getAuditRequestContext(),
    });
  },
},
```

If `user.id` is empty on signIn, still write the row (fail-open path already covers DB errors); prefer skipping only when authorize failed (event will not fire).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`  
Expected: PASS

- [ ] **Step 3: Manual smoke (LOGIN)**

1. Start app (`npm run dev`)
2. Log in with a valid admin user
3. Query DB: `SELECT action, module, severity, userName, ipAddress FROM audit_logs ORDER BY createdAt DESC LIMIT 5;`
4. Expected: exactly one new `LOGIN` / `AUTH` / `INFO` row for that login

- [ ] **Step 4: Commit**

```bash
git add lib/auth.ts
git commit -m "$(cat <<'EOF'
feat(audit): record LOGIN and LOGOUT via NextAuth events

EOF
)"
```

#### Phase 4 Verification Checklist

- [ ] Typecheck ผ่าน
- [ ] Manual LOGIN creates one AUTH row
- [ ] LOGOUT does not throw even if actor is incomplete
- [ ] Failed password does not create LOGIN row

---

### Task 5: Settings + Localization Wiring (Phase 5)

**Files:**
- Modify: `app/api/settings/route.ts`
- Modify: `app/api/settings/localization/route.ts`

**Interfaces:**
- Consumes: `createAuditLog`, `AuditAction`, `AuditModule`, `getAuditRequestContext`, session from `checkModuleAccess`
- Produces: one `UPDATE` row per successful PATCH

- [ ] **Step 1: Wire `PATCH` in `app/api/settings/route.ts`**

Replace the PATCH handler body pattern with:

```ts
import { AuditAction, AuditModule, createAuditLog } from "@/lib/audit-log";
import { getAuditRequestContext } from "@/lib/audit-request";

export async function PATCH(request: Request) {
  const { authorized, status, session } = await checkModuleAccess("settings");
  if (!authorized) return forbiddenError(status);

  const parsed = settingsSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const before = await getSettings(SETTINGS_KEYS, DEFAULT_SETTINGS);
  await saveSettings(parsed.data);

  await createAuditLog({
    user: session?.user
      ? { id: session.user.id, name: session.user.name ?? "", role: session.user.role }
      : null,
    action: AuditAction.UPDATE,
    module: AuditModule.SETTINGS,
    entityType: "SiteSettings",
    entityName: "Global Settings",
    before,
    after: parsed.data,
    context: await getAuditRequestContext(),
  });

  return NextResponse.json({ settings: parsed.data });
}
```

- [ ] **Step 2: Wire `PATCH` in `app/api/settings/localization/route.ts`**

```ts
import { AuditAction, AuditModule, createAuditLog } from "@/lib/audit-log";
import { getAuditRequestContext } from "@/lib/audit-request";
import { LOCALIZATION_SETTING_ID } from "@/lib/localization-settings";

export async function PATCH(request: Request) {
  const { authorized, status, session } = await checkModuleAccess("localization");
  if (!authorized) return forbiddenError(status);

  const parsed = localizationSchema.safeParse(await request.json());
  if (!parsed.success) return validationError(parsed.error);

  const before = await getLocalizationSettings();
  const localization = await saveLocalizationSettings(normalizeLocalizationSettings(parsed.data));

  await createAuditLog({
    user: session?.user
      ? { id: session.user.id, name: session.user.name ?? "", role: session.user.role }
      : null,
    action: AuditAction.UPDATE,
    module: AuditModule.LOCALIZATION,
    entityId: LOCALIZATION_SETTING_ID,
    entityType: "LocalizationSetting",
    entityName: "Localization",
    before: before as unknown as Record<string, unknown>,
    after: localization as unknown as Record<string, unknown>,
    context: await getAuditRequestContext(),
  });

  return NextResponse.json({ localization });
}
```

`LocalizationSettings` has no `id` field — use constant `LOCALIZATION_SETTING_ID` (`"default"`) from `lib/localization-settings.ts` as `entityId`.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`  
Expected: PASS

- [ ] **Step 4: Manual smoke**

1. PATCH localization (change timezone or currency)
2. Expect exactly one `UPDATE` / `LOCALIZATION` row with `entityName = Localization`
3. PATCH site settings (change `siteTagline`)
4. Expect exactly one `UPDATE` / `SETTINGS` row with `entityName = Global Settings`

- [ ] **Step 5: Commit**

```bash
git add app/api/settings/route.ts app/api/settings/localization/route.ts
git commit -m "$(cat <<'EOF'
feat(audit): audit site settings and localization updates

EOF
)"
```

#### Phase 5 Verification Checklist

- [ ] Typecheck ผ่าน
- [ ] Settings PATCH → 1 row, fixed entityName
- [ ] Localization PATCH → 1 row, fixed entityName
- [ ] Primary PATCH still returns success when audit write fails (fail-open already unit-covered via try/catch; do not break production helper to test)

---

### Task 6: Content Wiring + Smoke Tests (Phase 6)

**Files:**
- Create: `lib/audit-content.ts`
- Create: `tests/audit-content.test.ts`
- Modify: `app/api/posts/route.ts`
- Modify: `app/api/posts/[id]/route.ts`
- Modify: `app/api/events/route.ts`
- Modify: `app/api/events/[id]/route.ts`
- Modify: `app/api/promotions/route.ts`
- Modify: `app/api/promotions/[id]/route.ts`

**Interfaces:**
- Consumes: `createAuditLog`, enums, `getAuditRequestContext`
- Produces:
  - `toAuditActor(sessionUser)`
  - `resolveContentAction(beforeStatus, afterStatus)`
  - `pickContentAuditSnapshot(entity)`

- [ ] **Step 1: Write failing tests for content helpers**

```ts
// tests/audit-content.test.ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { AuditAction } from "@prisma/client";

import { pickContentAuditSnapshot, resolveContentAction } from "@/lib/audit-content";

describe("resolveContentAction", () => {
  it("DRAFT → PUBLISHED = PUBLISH", () => {
    assert.equal(resolveContentAction("DRAFT", "PUBLISHED"), AuditAction.PUBLISH);
  });

  it("PUBLISHED → DRAFT = UNPUBLISH", () => {
    assert.equal(resolveContentAction("PUBLISHED", "DRAFT"), AuditAction.UNPUBLISH);
  });

  it("PUBLISHED → ARCHIVED = UPDATE", () => {
    assert.equal(resolveContentAction("PUBLISHED", "ARCHIVED"), AuditAction.UPDATE);
  });

  it("DRAFT → DRAFT = UPDATE", () => {
    assert.equal(resolveContentAction("DRAFT", "DRAFT"), AuditAction.UPDATE);
  });

  it("PUBLISHED → PUBLISHED = UPDATE", () => {
    assert.equal(resolveContentAction("PUBLISHED", "PUBLISHED"), AuditAction.UPDATE);
  });
});

describe("pickContentAuditSnapshot", () => {
  it("includes allowlisted fields and flattens seo", () => {
    const snapshot = pickContentAuditSnapshot({
      title: "T",
      slug: "t",
      excerpt: "e",
      subtitle: "s",
      status: "DRAFT",
      publishedAt: null,
      featuredImage: null,
      content: "SHOULD_NOT_APPEAR",
      seo: {
        seoTitle: "SEO",
        seoDescription: "Desc",
        focusKeyword: "k",
        canonicalUrl: "https://example.com",
        noindex: false,
        nofollow: false,
        customJsonLd: { x: 1 },
      },
    });

    assert.equal(snapshot.title, "T");
    assert.equal(snapshot.seoTitle, "SEO");
    assert.equal("content" in snapshot, false);
    assert.equal("customJsonLd" in snapshot, false);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `node --import tsx --test tests/audit-content.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement `lib/audit-content.ts`**

```ts
import { AuditAction, type ContentStatus, type Role } from "@prisma/client";

import type { AuditActor } from "@/lib/audit-log";

type SeoLike = {
  seoTitle?: string | null;
  seoDescription?: string | null;
  focusKeyword?: string | null;
  canonicalUrl?: string | null;
  noindex?: boolean | null;
  nofollow?: boolean | null;
} | null | undefined;

type ContentLike = {
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  subtitle?: string | null;
  status?: ContentStatus | string | null;
  publishedAt?: Date | string | null;
  featuredImage?: string | null;
  seo?: SeoLike;
};

export function toAuditActor(user: {
  id: string;
  name?: string | null;
  role?: Role | string | null;
} | null | undefined): AuditActor | null {
  if (!user?.id) return null;
  return {
    id: user.id,
    name: user.name ?? "",
    role: (user.role as Role | null | undefined) ?? null,
  };
}

export function resolveContentAction(
  beforeStatus: string | null | undefined,
  afterStatus: string | null | undefined,
): AuditAction {
  if (beforeStatus !== "PUBLISHED" && afterStatus === "PUBLISHED") {
    return AuditAction.PUBLISH;
  }
  if (beforeStatus === "PUBLISHED" && afterStatus === "DRAFT") {
    return AuditAction.UNPUBLISH;
  }
  return AuditAction.UPDATE;
}

export function pickContentAuditSnapshot(entity: ContentLike): Record<string, unknown> {
  const publishedAt =
    entity.publishedAt instanceof Date
      ? entity.publishedAt.toISOString()
      : (entity.publishedAt ?? null);

  return {
    title: entity.title ?? null,
    slug: entity.slug ?? null,
    excerpt: entity.excerpt ?? null,
    subtitle: entity.subtitle ?? null,
    status: entity.status ?? null,
    publishedAt,
    featuredImage: entity.featuredImage ?? null,
    seoTitle: entity.seo?.seoTitle ?? null,
    seoDescription: entity.seo?.seoDescription ?? null,
    focusKeyword: entity.seo?.focusKeyword ?? null,
    canonicalUrl: entity.seo?.canonicalUrl ?? null,
    noindex: entity.seo?.noindex ?? null,
    nofollow: entity.seo?.nofollow ?? null,
  };
}
```

- [ ] **Step 4: Run content helper tests — expect PASS**

Run: `node --import tsx --test tests/audit-content.test.ts`  
Expected: PASS

- [ ] **Step 5: Wire Posts CREATE (`app/api/posts/route.ts`)**

After successful `$transaction`, before `return NextResponse.json`:

```ts
import { AuditAction, AuditModule, createAuditLog } from "@/lib/audit-log";
import { getAuditRequestContext } from "@/lib/audit-request";
import { pickContentAuditSnapshot, toAuditActor } from "@/lib/audit-content";

// after `const post = await prisma.$transaction(...)`
if (post) {
  await createAuditLog({
    user: toAuditActor(session?.user),
    action: AuditAction.CREATE,
    module: AuditModule.POSTS,
    entityId: post.id,
    entityType: "Post",
    entityName: post.title,
    entitySlug: post.slug,
    before: null,
    after: pickContentAuditSnapshot(post),
    context: await getAuditRequestContext(),
  });
}
```

- [ ] **Step 6: Wire Posts PATCH + DELETE (`app/api/posts/[id]/route.ts`)**

In PATCH:
1. Change the pre-load query from `{ id, slug }` to include audit snapshot fields + status + seo allowlist:

```ts
const existing = await prisma.post.findFirst({
  where: { id, deletedAt: null },
  include: {
    seo: {
      select: {
        seoTitle: true,
        seoDescription: true,
        focusKeyword: true,
        canonicalUrl: true,
        noindex: true,
        nofollow: true,
      },
    },
  },
});
if (!existing) return NextResponse.json({ error: "Post not found" }, { status: 404 });
```

2. Keep using `existing.slug` where `current.slug` was used.
3. After transaction succeeds (`post` returned), audit once:

```ts
import { AuditModule, createAuditLog } from "@/lib/audit-log";
import { getAuditRequestContext } from "@/lib/audit-request";
import {
  pickContentAuditSnapshot,
  resolveContentAction,
  toAuditActor,
} from "@/lib/audit-content";

const { authorized, status, session } = await checkModuleAccess("news");
// ... existing update logic using `existing` ...

if (post) {
  await createAuditLog({
    user: toAuditActor(session?.user),
    action: resolveContentAction(existing.status, post.status),
    module: AuditModule.POSTS,
    entityId: post.id,
    entityType: "Post",
    entityName: post.title,
    entitySlug: post.slug,
    before: pickContentAuditSnapshot(existing),
    after: pickContentAuditSnapshot(post),
    context: await getAuditRequestContext(),
  });
}
```

In DELETE:

```ts
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { authorized, status, session } = await checkModuleAccess("news");
  if (!authorized) return forbiddenError(status);

  const { id } = await params;
  const existing = await prisma.post.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, title: true, slug: true },
  });

  await prisma.post.update({ where: { id }, data: { deletedAt: new Date() } });

  if (existing) {
    await createAuditLog({
      user: toAuditActor(session?.user),
      action: AuditAction.DELETE,
      module: AuditModule.POSTS,
      entityId: existing.id,
      entityType: "Post",
      entityName: existing.title,
      entitySlug: existing.slug,
      context: await getAuditRequestContext(),
    });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 7: Wire Events (same pattern as Posts)**

`app/api/events/route.ts` POST:
- module `AuditModule.EVENTS`
- entityType `"Event"`
- `toAuditActor(session?.user)`, `pickContentAuditSnapshot(event)`, `AuditAction.CREATE`

`app/api/events/[id]/route.ts` PATCH:
- preload full event + seo select (same fields as posts)
- `resolveContentAction(existing.status, event.status)`
- module `EVENTS`, entityType `"Event"`

`app/api/events/[id]/route.ts` DELETE:
- preload `{ id, title, slug }`
- soft-delete
- `AuditAction.DELETE`, module `EVENTS`, entityType `"Event"`
- exactly one `createAuditLog` call

- [ ] **Step 8: Wire Promotions (same pattern as Posts)**

`app/api/promotions/route.ts` POST:
- module `AuditModule.PROMOTIONS`
- entityType `"Promotion"`
- `AuditAction.CREATE`

`app/api/promotions/[id]/route.ts` PATCH:
- preload + `resolveContentAction`
- module `PROMOTIONS`, entityType `"Promotion"`

`app/api/promotions/[id]/route.ts` DELETE:
- preload title/slug
- `AuditAction.DELETE`, module `PROMOTIONS`, entityType `"Promotion"`

- [ ] **Step 9: Run all audit unit tests + typecheck**

```bash
node --import tsx --test tests/audit-diff.test.ts tests/audit-log.test.ts tests/audit-content.test.ts
npm run typecheck
```

Expected: PASS

- [ ] **Step 10: Manual smoke matrix**

| Action | How | Expected row |
|--------|-----|--------------|
| LOGIN | Sign in | 1 × `LOGIN` / `AUTH` / `INFO` |
| UPDATE | PATCH post title only | 1 × `UPDATE` / `POSTS` with `changes.title` |
| PUBLISH | PATCH post status DRAFT→PUBLISHED | 1 × `PUBLISH` / `POSTS` |
| UNPUBLISH | PATCH post status PUBLISHED→DRAFT | 1 × `UNPUBLISH` / `POSTS` |
| DELETE | DELETE post | 1 × `DELETE` / `POSTS` / `WARNING` |
| Event CREATE | POST event | 1 × `CREATE` / `EVENTS` |
| Promotion DELETE | DELETE promotion | 1 × `DELETE` / `PROMOTIONS` / `WARNING` |

Also verify: one PATCH does **not** create 2+ rows.

- [ ] **Step 11: Full validate (optional but preferred before merge)**

Run: `npm run validate`  
Expected: lint + typecheck + tests + prisma validate PASS

- [ ] **Step 12: Commit**

```bash
git add lib/audit-content.ts tests/audit-content.test.ts \
  app/api/posts/route.ts app/api/posts/[id]/route.ts \
  app/api/events/route.ts app/api/events/[id]/route.ts \
  app/api/promotions/route.ts app/api/promotions/[id]/route.ts
git commit -m "$(cat <<'EOF'
feat(audit): wire posts events promotions audit call-sites

EOF
)"
```

#### Phase 6 Verification Checklist

- [ ] Unit tests ผ่าน (`audit-diff`, `audit-log`, `audit-content`)
- [ ] Typecheck ผ่าน
- [ ] Build ผ่าน (`npm run build`) when practical
- [ ] Manual smoke matrix ผ่าน
- [ ] Single mutation → exactly one audit row
- [ ] No Audit UI / no middleware / no RESTORE caller

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| Schema enums + AuditLog + indexes + entitySlug | Task 1 |
| Smart diff ignore/mask/longtext/null/shallow | Task 2 |
| createAuditLog + severity override + fail-open + context rename | Task 3 |
| LOGIN / LOGOUT best-effort | Task 4 |
| Settings + Localization fixed entityName | Task 5 |
| Action resolution table + snapshot include/exclude | Task 6 |
| Posts/Events/Promotions CREATE/UPDATE/PUBLISH/UNPUBLISH/DELETE | Task 6 |
| Single-row smoke + DELETE WARNING | Task 6 |
| Non-goals (no UI/middleware/queue) | All tasks — do not implement |

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-12-audit-infrastructure-v1.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks
2. **Inline Execution** — execute tasks in this session with executing-plans checkpoints

Which approach?
