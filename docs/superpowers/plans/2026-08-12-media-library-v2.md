# Media Library V2 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Media Library V2 Foundation MVP — expanded `Media` metadata, shared Media UX Kit (Search/Filter/Sort/Asset Drawer), Library manage + Picker select/view — without media_id migration or upload pipeline redesign.

**Architecture:** Expand Prisma `Media` in place. Extract metadata on upload + best-effort `media:backfill`. Build shared components under `features/media/` reused by `/admin/media` and `MediaPickerDialog`. Content modules keep URL strings.

**Tech Stack:** Next.js App Router, Prisma 6, Zod validators, node:test + tsx, local `public/uploads`, `image-size` for dimensions

**Spec:** `docs/superpowers/specs/media-library-v2/` (`01`–`05`)

## Global Constraints

- Domain term **Media Asset**; Prisma model remains **`Media`** (no rename)
- Folders stay **flat** — no `parentId`
- Content fields stay **URL strings** — no `media_id` / MediaReference / MediaUsage
- Upload UX stays **V1 Choose File** — no drag-drop / paste / queue
- Editorial metadata: **explicit Save Metadata** — no auto-save
- Soft-delete + light confirm — **no usage check**
- Soft-deleted rows excluded from all default Library/Picker queries (`deletedAt: null`)
- `width`/`height` only for `IMAGE`; non-images store `null`
- Filter options: **All · Images · PDF · Videos** (map to `MediaType`)
- Copy URL only from Drawer (not grid cards)
- Picker: Rename ❌ Move ❌ Delete ❌ Save Metadata ❌
- Library and Picker share Asset Drawer preview/info behavior
- Out of scope: storage providers, variants/WebP, nested folders, bulk actions, trash restore UI

## File map

| Path | Responsibility |
|------|----------------|
| `prisma/schema.prisma` | Expand `Media` fields |
| `lib/media-metadata.ts` | Extract mime/extension/dimensions from buffer |
| `lib/media.ts` | `buildMediaWhere` search/sort; shared select shape |
| `lib/media-upload.ts` | Client upload helper types |
| `app/api/upload/route.ts` | Persist system metadata on create |
| `app/api/media/route.ts` | List with search/filter/sort + expanded select |
| `app/api/media/[id]/route.ts` | PATCH metadata/rename/move; DELETE soft-delete |
| `validators/media.validator.ts` | List + patch schemas |
| `scripts/media-backfill.ts` | Best-effort historical enrichment |
| `package.json` | `media:backfill` script + `image-size` dep |
| `features/media/asset-drawer.tsx` | Shared drawer (library manage / picker view) |
| `features/media/media-toolbar.tsx` | Shared search/filter/sort |
| `features/media/media-grid.tsx` | Shared grid cards |
| `features/media/media-library.tsx` | Library composition |
| `features/media/media-picker-dialog.tsx` | Picker composition (select + view) |
| `features/media/delete-media-button.tsx` | Confirm copy aligned to spec |
| `app/admin/media/page.tsx` | Pass query params / expanded fields |
| `tests/media-metadata.test.ts` | Metadata helpers |
| `tests/media-where.test.ts` | Search/filter where builder |
| `tests/upload.test.ts` | Extend if helpers change |

---

### Task 1: Expand `Media` schema + metadata helpers

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `lib/media-metadata.ts`
- Create: `tests/media-metadata.test.ts`
- Modify: `package.json` (add `image-size`)

**Interfaces:**
- Produces: `extractMediaMetadata(buffer, { mimeType, originalName, mediaType }) → { originalName, mimeType, extension, width, height }`
- Produces: Prisma fields on `Media` as in spec `02-domain-model.md`

- [ ] **Step 1: Add dependency**

```bash
cd paseo-cms && npm install image-size
npm install -D @types/image-size
```

(If `@types/image-size` is unnecessary because the package ships types, skip the types package.)

- [ ] **Step 2: Write failing metadata tests**

Create `tests/media-metadata.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { extractMediaMetadata, extensionFromName } from "@/lib/media-metadata";

describe("extractMediaMetadata", () => {
  it("returns extension and mime for PDF without dimensions", () => {
    const buffer = Buffer.from("%PDF-1.4");
    const result = extractMediaMetadata(buffer, {
      mimeType: "application/pdf",
      originalName: "brief.pdf",
      mediaType: "PDF",
    });
    assert.equal(result.extension, "pdf");
    assert.equal(result.mimeType, "application/pdf");
    assert.equal(result.originalName, "brief.pdf");
    assert.equal(result.width, null);
    assert.equal(result.height, null);
  });

  it("reads width/height for a small PNG", () => {
    // 1x1 PNG
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const result = extractMediaMetadata(png, {
      mimeType: "image/png",
      originalName: "dot.png",
      mediaType: "IMAGE",
    });
    assert.equal(result.width, 1);
    assert.equal(result.height, 1);
    assert.equal(result.extension, "png");
  });

  it("returns null dimensions when image probe fails", () => {
    const result = extractMediaMetadata(Buffer.from("not-an-image"), {
      mimeType: "image/jpeg",
      originalName: "bad.jpg",
      mediaType: "IMAGE",
    });
    assert.equal(result.width, null);
    assert.equal(result.height, null);
  });
});

describe("extensionFromName", () => {
  it("strips dot and lowercases", () => {
    assert.equal(extensionFromName("Logo.PNG"), "png");
    assert.equal(extensionFromName("file"), null);
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
cd paseo-cms && npm test -- tests/media-metadata.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 4: Implement `lib/media-metadata.ts`**

```ts
import imageSize from "image-size";
import type { MediaType } from "@prisma/client";

export type ExtractedMediaMetadata = {
  originalName: string;
  mimeType: string | null;
  extension: string | null;
  width: number | null;
  height: number | null;
};

export function extensionFromName(name: string): string | null {
  const ext = name.includes(".") ? name.split(".").pop() : "";
  if (!ext) return null;
  return ext.toLowerCase().replace(/^\./, "") || null;
}

export function extractMediaMetadata(
  buffer: Buffer,
  input: { mimeType: string; originalName: string; mediaType: MediaType | "IMAGE" | "PDF" | "VIDEO" },
): ExtractedMediaMetadata {
  const extension = extensionFromName(input.originalName);
  let width: number | null = null;
  let height: number | null = null;

  if (input.mediaType === "IMAGE") {
    try {
      const size = imageSize(buffer);
      width = typeof size.width === "number" ? size.width : null;
      height = typeof size.height === "number" ? size.height : null;
    } catch {
      width = null;
      height = null;
    }
  }

  return {
    originalName: input.originalName,
    mimeType: input.mimeType || null,
    extension,
    width,
    height,
  };
}
```

- [ ] **Step 5: Expand Prisma `Media` model**

In `prisma/schema.prisma`, add nullable fields to `Media` (keep existing uuid id, `type`, `deletedAt`, indexes):

```prisma
  originalName String?
  mimeType     String?
  extension    String?
  width        Int?
  height       Int?
  altText      String?   @db.Text
  title        String?
  caption      String?   @db.Text
```

- [ ] **Step 6: Create migration**

```bash
cd paseo-cms && npx prisma migrate dev --name media_v2_metadata_fields
```

Expected: migration applied; `prisma generate` succeeds

- [ ] **Step 7: Re-run metadata tests — expect PASS**

```bash
cd paseo-cms && npm test -- tests/media-metadata.test.ts
```

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma prisma/migrations package.json package-lock.json lib/media-metadata.ts tests/media-metadata.test.ts
git commit -m "$(cat <<'EOF'
feat(media): expand Media metadata fields for V2 MVP

EOF
)"
```

---

### Task 2: Upload writes system metadata + list/query updates

**Files:**
- Modify: `app/api/upload/route.ts`
- Modify: `lib/media.ts`
- Modify: `validators/media.validator.ts`
- Modify: `app/api/media/route.ts`
- Create: `tests/media-where.test.ts`
- Modify: `lib/media-upload.ts` (types)

**Interfaces:**
- Consumes: `extractMediaMetadata`
- Produces: `buildMediaWhere({ folderId, type, q })` searching `filename | title | altText`
- Produces: list `orderBy` via `sort` query (`newest`|`oldest`|`name-asc`|`name-desc`)

- [ ] **Step 1: Write failing where-builder tests**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildMediaWhere, buildMediaOrderBy } from "@/lib/media";

describe("buildMediaWhere", () => {
  it("always excludes soft-deleted", () => {
    const where = buildMediaWhere({});
    assert.equal(where.deletedAt, null);
  });

  it("searches filename, title, and altText", () => {
    const where = buildMediaWhere({ q: "hero" });
    assert.ok(where.OR);
    assert.equal(Array.isArray(where.OR), true);
  });

  it("filters by type", () => {
    const where = buildMediaWhere({ type: "IMAGE" });
    assert.equal(where.type, "IMAGE");
  });
});

describe("buildMediaOrderBy", () => {
  it("maps sort keys", () => {
    assert.deepEqual(buildMediaOrderBy("oldest"), { createdAt: "asc" });
    assert.deepEqual(buildMediaOrderBy("name-desc"), { filename: "desc" });
    assert.deepEqual(buildMediaOrderBy(undefined), { createdAt: "desc" });
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd paseo-cms && npm test -- tests/media-where.test.ts
```

- [ ] **Step 3: Update `lib/media.ts`**

Replace `buildMediaWhere` search and add order helper:

```ts
export type MediaSort = "newest" | "oldest" | "name-asc" | "name-desc";

export function buildMediaWhere({
  folderId,
  type,
  q,
}: {
  folderId?: string;
  type?: MediaType;
  q?: string;
}): Prisma.MediaWhereInput {
  const where: Prisma.MediaWhereInput = { deletedAt: null };

  if (folderId && folderId !== "root" && folderId !== "") {
    where.folderId = folderId;
  }

  if (type) where.type = type;

  if (q) {
    where.OR = [
      { filename: { contains: q } },
      { title: { contains: q } },
      { altText: { contains: q } },
    ];
  }

  return where;
}

export function buildMediaOrderBy(sort?: MediaSort): Prisma.MediaOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "name-asc":
      return { filename: "asc" };
    case "name-desc":
      return { filename: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

export const mediaListSelect = {
  id: true,
  folderId: true,
  filename: true,
  originalName: true,
  path: true,
  type: true,
  size: true,
  mimeType: true,
  extension: true,
  width: true,
  height: true,
  altText: true,
  title: true,
  caption: true,
  createdAt: true,
  updatedAt: true,
} as const;
```

Update `MediaRecord` type to include the new optional fields used by UI.

- [ ] **Step 4: Update validator**

```ts
export const mediaListSchema = z.object({
  folderId: z.string().trim().optional(),
  type: z.enum(MEDIA_TYPE_VALUES).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(["newest", "oldest", "name-asc", "name-desc"]).optional(),
});

export const mediaPatchSchema = z.object({
  altText: z.string().max(500).nullable().optional(),
  title: z.string().max(200).nullable().optional(),
  caption: z.string().max(2000).nullable().optional(),
  filename: z.string().trim().min(1).max(255).optional(),
  folderId: z.string().uuid().nullable().optional(),
});
```

(Adjust `folderId` uuid check if IDs are not always uuid-shaped in fixtures — match existing id format.)

- [ ] **Step 5: Update `GET /api/media`**

Parse `sort`, use `buildMediaWhere` + `buildMediaOrderBy` + `mediaListSelect`.

- [ ] **Step 6: Update `POST /api/upload`**

After reading buffer, before `prisma.media.create`:

```ts
import { extractMediaMetadata } from "@/lib/media-metadata";

const mediaType = KIND_TO_MEDIA_TYPE[kind];
const meta = extractMediaMetadata(buffer, {
  mimeType: file.type,
  originalName: file.name,
  mediaType,
});

const media = await prisma.media.create({
  data: {
    folderId,
    filename: file.name,
    path: `/uploads/${storedFilename}`,
    type: mediaType,
    size: file.size,
    originalName: meta.originalName,
    mimeType: meta.mimeType,
    extension: meta.extension ?? extension.replace(/^\./, "").toLowerCase() || null,
    width: meta.width,
    height: meta.height,
  },
});
```

- [ ] **Step 7: Run tests**

```bash
cd paseo-cms && npm test -- tests/media-where.test.ts tests/media-metadata.test.ts tests/upload.test.ts
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add lib/media.ts lib/media-metadata.ts lib/media-upload.ts validators/media.validator.ts app/api/media/route.ts app/api/upload/route.ts tests/media-where.test.ts
git commit -m "$(cat <<'EOF'
feat(media): populate metadata on upload and expand list queries

EOF
)"
```

---

### Task 3: PATCH media + delete confirm copy

**Files:**
- Modify: `app/api/media/[id]/route.ts`
- Modify: `features/media/delete-media-button.tsx`

**Interfaces:**
- Produces: `PATCH /api/media/:id` body via `mediaPatchSchema`
- Produces: delete confirm text per spec (no usage claims)

- [ ] **Step 1: Implement PATCH on `[id]/route.ts`**

```ts
export async function PATCH(request: Request, { params }: RouteParams) {
  const { authorized, status } = await checkModuleAccess("media-library");
  if (!authorized) return NextResponse.json({ error: "Forbidden" }, { status });

  const { id } = await params;
  const body = await request.json();
  const parsed = mediaPatchSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const existing = await prisma.media.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.folderId) {
    const folder = await prisma.mediaFolder.findFirst({
      where: { id: parsed.data.folderId, deletedAt: null },
      select: { id: true },
    });
    if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  const media = await prisma.media.update({
    where: { id },
    data: {
      ...(parsed.data.altText !== undefined ? { altText: parsed.data.altText } : {}),
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.caption !== undefined ? { caption: parsed.data.caption } : {}),
      ...(parsed.data.filename !== undefined ? { filename: parsed.data.filename } : {}),
      ...(parsed.data.folderId !== undefined ? { folderId: parsed.data.folderId } : {}),
    },
    select: mediaListSelect,
  });

  return NextResponse.json({ media });
}
```

Keep existing DELETE soft-delete behavior (including current disk cleanup policy — do not expand to trash restore).

- [ ] **Step 2: Update delete confirm copy**

In `delete-media-button.tsx` (and Drawer delete), use:

```txt
Delete Asset

This asset will be removed from the Media Library.

You can restore it later if recovery is supported by the system.
```

Prefer a small confirm modal component if easy; `window.confirm` with the full text is acceptable for MVP if modal infrastructure is missing.

- [ ] **Step 3: Manual smoke**

```bash
cd paseo-cms && npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
git add app/api/media/[id]/route.ts features/media/delete-media-button.tsx validators/media.validator.ts
git commit -m "$(cat <<'EOF'
feat(media): add PATCH for metadata/rename/move and clarify delete confirm

EOF
)"
```

---

### Task 4: Shared Media UX Kit — Toolbar + Grid + Asset Drawer

**Files:**
- Create: `features/media/media-toolbar.tsx`
- Create: `features/media/media-grid.tsx`
- Create: `features/media/asset-drawer.tsx`
- Create: `features/media/types.ts` (shared `MediaListItem` type)

**Interfaces:**
- Produces: `AssetDrawer({ mode: "library" | "picker", asset, folders?, onClose, onSaved?, onSelect? })`
- Library mode: editable SEO fields + Save Metadata + Rename/Move/Delete/Copy/Download
- Picker mode: read-only metadata + Copy/Download + Select — **no** Rename/Move/Delete/Save

- [ ] **Step 1: Add shared type**

```ts
// features/media/types.ts
export type MediaListItem = {
  id: string;
  folderId: string | null;
  filename: string;
  originalName: string | null;
  path: string;
  type: "IMAGE" | "PDF" | "VIDEO";
  size: number;
  mimeType: string | null;
  extension: string | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  title: string | null;
  caption: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};
```

- [ ] **Step 2: Implement `MediaToolbar`**

Controlled props: `query`, `type`, `sort`, setters, labels:
- Search placeholder `Search media...`
- Filter: All / Images / PDF / Videos
- Sort: Newest / Oldest / A–Z / Z–A

- [ ] **Step 3: Implement `MediaGrid`**

Cards show thumbnail/icon, filename, size, date. Click selects/opens drawer. **No Copy URL on card.**

- [ ] **Step 4: Implement `AssetDrawer`**

Layout sections:
1. Preview
2. Asset Information (system + Created At / Updated At read-only; show `—` for nulls)
3. SEO Metadata (inputs only if `mode === "library"`)
4. Actions per mode

Library Save flow:

```txt
Edit Metadata → Save Metadata button → PATCH /api/media/:id → refresh local state
```

Copy URL: `navigator.clipboard.writeText` with absolute or site-relative public URL from `asset.path`.

Download: `<a href={path} download>` or window open.

Rename / Move: prompts or inline fields that PATCH `filename` / `folderId`.

Delete: confirm then DELETE; on success close drawer + callback.

Picker: primary button **Select** calling `onSelect(asset)` (caller maps to URL string via `asset.path`).

- [ ] **Step 5: Typecheck**

```bash
cd paseo-cms && npm run typecheck
```

- [ ] **Step 6: Commit**

```bash
git add features/media/types.ts features/media/media-toolbar.tsx features/media/media-grid.tsx features/media/asset-drawer.tsx
git commit -m "$(cat <<'EOF'
feat(media): add shared Media UX Kit drawer, toolbar, and grid

EOF
)"
```

---

### Task 5: Wire Library + Picker

**Files:**
- Modify: `features/media/media-library.tsx`
- Modify: `features/media/media-picker-dialog.tsx`
- Modify: `app/admin/media/page.tsx`

- [ ] **Step 1: Refactor `MediaLibrary`**

Compose Toolbar + Grid + Drawer (`mode="library"`). Keep flat folder sidebar (create/rename/delete). Upload remains `MediaUploadButton` (V1). Wire search/filter/sort either:
- client state filtering the server-provided list, **or**
- querystring + `router.refresh` / fetch `/api/media`

Prefer fetch `/api/media` for parity with Picker.

Ensure page `findMany` still uses `deletedAt: null` and returns new fields (or rely entirely on client fetch).

- [ ] **Step 2: Refactor `MediaPickerDialog`**

Reuse Toolbar + Grid + Drawer (`mode="picker"`). Keep V1 upload. On select, call existing `onSelect` with item that includes `path` so editors still store URL strings.

**Must not render** Rename / Move / Delete / Save Metadata in picker drawer.

- [ ] **Step 3: Manual acceptance checklist**

1. `/admin/media` — open drawer, edit alt/title/caption, Save, reload → persisted  
2. Copy URL from drawer works; grid has no copy control  
3. Delete shows confirm without “used in N places”  
4. Soft-deleted asset disappears from Library and Picker  
5. Picker in Post/Event/Promotion — search/filter/preview; select still sets URL string  
6. New upload shows mime/extension/dimensions for images  

- [ ] **Step 4: Validate**

```bash
cd paseo-cms && npm run validate
```

- [ ] **Step 5: Commit**

```bash
git add features/media/media-library.tsx features/media/media-picker-dialog.tsx app/admin/media/page.tsx features/media/media-upload-button.tsx
git commit -m "$(cat <<'EOF'
feat(media): wire shared UX Kit into Library and Picker

EOF
)"
```

---

### Task 6: Best-effort `media:backfill` command

**Files:**
- Create: `scripts/media-backfill.ts`
- Modify: `package.json` scripts

**Interfaces:**
- Produces: CLI that enriches null system metadata only; never renames/moves/changes `path`

- [ ] **Step 1: Implement script**

```ts
import { readFile } from "fs/promises";
import path from "path";

import { PrismaClient } from "@prisma/client";

import { extractMediaMetadata } from "../lib/media-metadata";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.media.findMany({
    where: {
      deletedAt: null,
      OR: [
        { mimeType: null },
        { extension: null },
        { originalName: null },
        { AND: [{ type: "IMAGE" }, { OR: [{ width: null }, { height: null }] } },
      ],
    },
    take: 5000,
  });

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const absolute = path.join(process.cwd(), "public", row.path.replace(/^\//, ""));
      const buffer = await readFile(absolute);
      const meta = extractMediaMetadata(buffer, {
        mimeType: row.mimeType ?? "",
        originalName: row.originalName ?? row.filename,
        mediaType: row.type,
      });

      await prisma.media.update({
        where: { id: row.id },
        data: {
          originalName: row.originalName ?? meta.originalName,
          mimeType: row.mimeType ?? meta.mimeType,
          extension: row.extension ?? meta.extension,
          width: row.type === "IMAGE" ? (row.width ?? meta.width) : null,
          height: row.type === "IMAGE" ? (row.height ?? meta.height) : null,
        },
      });
      updated += 1;
    } catch (error) {
      skipped += 1;
      console.warn(`[media:backfill] skip ${row.id} ${row.path}`, error);
    }
  }

  console.log(`media:backfill done updated=${updated} skipped=${skipped}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Add npm script**

```json
"media:backfill": "tsx scripts/media-backfill.ts"
```

- [ ] **Step 3: Run once locally (optional)**

```bash
cd paseo-cms && npm run media:backfill
```

Expected: completes; individual missing files only warn

- [ ] **Step 4: Commit**

```bash
git add scripts/media-backfill.ts package.json
git commit -m "$(cat <<'EOF'
feat(media): add best-effort media metadata backfill command

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Expand `Media` metadata fields | 1 |
| Flat folders unchanged | 5 (no schema parentId) |
| Hybrid backfill command | 6 |
| Upload populates system metadata | 2 |
| Shared Search/Filter/Sort | 4–5 |
| Asset Drawer Library manage | 4–5 |
| Explicit Save Metadata | 4 |
| Created At / Updated At in drawer | 4 |
| Picker select + view only | 5 |
| Picker returns URL string | 5 (unchanged contract) |
| Soft-delete + confirm, no usage | 3 |
| Exclude deleted from queries | 2 (where) + existing page filters |
| No media_id / usage / storage / upload queue | Global constraints |

## Placeholder / consistency review

- No TBD left in task steps
- Filter locked to All/Images/PDF/Videos
- Picker manage actions explicitly forbidden in Task 4–5
- Backfill must not modify paths (Task 6)

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-12-media-library-v2.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with executing-plans checkpoints  

Which approach?
