# Task 6 Report: Content Wiring + Smoke

## Status

Implemented Audit Infrastructure V1 Phase 6 for Posts, Events, and Promotions.

## Changes

- Added `lib/audit-content.ts` with the required action resolver, include-list snapshot picker, SEO flattening, actor mapping, and content-specific snapshot aliases.
- Added dependency-injected `lib/content-audit.ts` handlers for CREATE, UPDATE/PUBLISH/UNPUBLISH, and DELETE.
- Wired one audit handler call after each successful Post, Event, and Promotion POST/PATCH/DELETE mutation.
- PATCH routes preload the prior entity and SEO allowlist fields; DELETE routes preload `id`, `title`, and `slug` before soft deletion.
- Kept RESTORE, Pages, Media, Users, bulk actions, relation diffs, and Audit UI out of scope.

## TDD Evidence

- Added `tests/audit-content.test.ts`; the red run failed with `Cannot find module '@/lib/audit-content'`.
- Implemented the helpers; the focused green run passed 10 tests.
- Added `tests/content-audit.test.ts`; the red run failed with `Cannot find module '@/lib/content-audit'`.
- Implemented the handlers; the focused green run passed 3 tests.
- Handler tests assert one captured audit input per mutation and verify action/module/entity metadata plus before/after snapshots.

## Automated Verification

- Audit regression command: 53 tests passed, 0 failed.
- Changed-file ESLint: passed.
- `git diff --check`: passed.
- `npm run typecheck`: blocked by pre-existing errors outside Task 6 files. The second run reported no errors in any Task 6 file.

## Manual Smoke Checklist

Manual authenticated smoke was not executed because no authenticated browser/API session fixture was available. Run this checklist before merge:

- [ ] Login → exactly 1 `LOGIN` / `AUTH` / `INFO` row.
- [ ] Create Post → exactly 1 `CREATE` / `POSTS` row.
- [ ] Update Post title → exactly 1 `UPDATE` / `POSTS` row with `changes.title`.
- [ ] Publish Post (`DRAFT` → `PUBLISHED`) → exactly 1 `PUBLISH` / `POSTS` row.
- [ ] Unpublish Post (`PUBLISHED` → `DRAFT`) → exactly 1 `UNPUBLISH` / `POSTS` row.
- [ ] Delete Post → exactly 1 `DELETE` / `POSTS` / `WARNING` row.
- [ ] Create Event → exactly 1 `CREATE` / `EVENTS` row.
- [ ] Delete Promotion → exactly 1 `DELETE` / `PROMOTIONS` / `WARNING` row.
- [ ] Confirm one PATCH never creates two or more audit rows.
