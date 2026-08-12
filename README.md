# The Paseo CMS

A corporate CMS built with Next.js App Router, TypeScript, TailwindCSS, Prisma, MySQL,
and NextAuth, per `AI_RULES.md`, `DATABASE.md`, and `PROJECT_REQUIREMENTS.md`.

## Progress

**Phase 1 — done**

- [x] Initialize Project (Next.js 16, TypeScript strict mode, TailwindCSS)
- [x] Configure Prisma (schema generated from `DATABASE.md`)
- [x] Configure MySQL (via `DATABASE_URL`)
- [x] Configure Authentication (NextAuth / Auth.js, JWT sessions, 5 roles)
- [x] Configure Upload (route handler for image / PDF / video)
- [x] Configure Admin Layout (sidebar + topbar shell, role-aware nav)

**Phase 2 — done**

- [x] Dashboard — live counts (Pages, Posts, Events, Promotions, Stores, Media, Users)
- [x] Users — list, create, edit, soft-delete (`/admin/users`, Route Handlers at `/api/users`)
- [x] Roles — read-only role reference + capability matrix + headcount per role (`/admin/roles`)
- [x] Media Library — grid view, upload, soft-delete + disk cleanup (`/admin/media`)

**Phase 3 — done**

- [x] Pages, Posts/News, Events, Promotions, Branches, Stores, Gallery, and Categories
- [x] CRUD admin pages and Route Handlers for each module
- [x] Soft-delete support across content resources

**Phase 4 — done**

- [x] Search — public search API plus admin preview page
- [x] SEO — global metadata, Open Graph, Twitter card, JSON-LD, sitemap, and robots
- [x] Contact — public submissions API plus admin inbox/status workflow
- [x] Settings — site identity, public URL, contact channels, and social links

**Phase 5 — done**

- [x] Testing — Node test runner coverage for validators and upload helpers
- [x] Optimization — production Next.js config, standalone build, cache headers, route hardening
- [x] Documentation — project, validation, and deployment docs
- [x] Production Deployment — PM2 ecosystem config and Nginx sample

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and NEXTAUTH_SECRET
npx prisma migrate dev --name init
npx prisma db seed     # creates a Super Admin (see prisma/seed.ts for credentials)
npm run dev
```

Generate a real `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

Visit `/login` to sign in, then `/admin/dashboard`.

## Quality gates

Run the same checks before deployment:

```bash
npm run validate
npm run build
```

Individual commands are also available:

```bash
npm run lint
npm run typecheck
npm run test
npx prisma validate
```

## Folder structure

Matches `AI_RULES.md`:

```
app/          Routes (App Router) — front site, /admin, /login, API route handlers
components/   Reusable UI (components/ui) and admin shell (components/admin)
features/     Feature-scoped components (e.g. features/auth, features/users, features/media)
hooks/        Client-side hooks (e.g. use-current-user)
lib/          Server/client utilities — prisma client, auth config, rbac, upload, formatting
types/        Shared TypeScript types and module augmentations
validators/   Zod schemas
prisma/       schema.prisma and seed.ts
```

## Role enforcement (defense in depth)

Authorization is centralized in `lib/admin-permissions.ts` (`ADMIN_MODULE_PERMISSIONS`).
Roles are enforced in four places — add new modules to the registry first, then wire each layer:

1. `lib/admin-navigation.ts` — sidebar visibility via `getModuleRoles(item.id)`.
2. `proxy.ts` — authentication plus registry longest-prefix checks for `/admin/*`.
3. Admin pages — `requireModuleAccess(moduleId)` from `lib/rbac.ts`.
4. API route handlers — `checkModuleAccess(moduleId)` from `lib/rbac.ts` (or
   `authorizeSearchRequest()` for `/api/search` when `scope` is not `public`).

The registry is the source of truth for role mappings. CI guards in
`tests/api-authorization-guard.test.ts` block `checkRole()` and local `*_ROLES`
constants under `app/api/**`. `tests/admin-page-authorization-guard.test.ts`
blocks new admin pages that omit `requireModuleAccess()` (with documented
exemptions for `/admin`, `/admin/dashboard`, and legacy redirect shims).

See [`docs/AUTHORIZATION.md`](./docs/AUTHORIZATION.md) for the certified model,
public endpoints, and extension workflow.

## Production

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the Ubuntu, PM2, Nginx, MySQL, and
release checklist. The production build uses Next.js standalone output; deploy
`.next/standalone`, `.next/static`, `public`, `prisma`, `package.json`, and
`ecosystem.config.cjs`.

## Notes & assumptions made during scaffolding

- **News**: `DATABASE.md` has no separate `news` table, so the front-end "News"
  section is modeled as `Post` filtered by `Category`. Revisit if News needs
  fields Posts don't have.
- **Uploads**: Phase 1 saves files to `public/uploads` on local disk (simple
  for a single-server PM2/Nginx deployment per `PROJECT_REQUIREMENTS.md`).
  Swap `app/api/upload/route.ts` for S3/object storage if you scale to
  multiple servers. `DELETE /api/media/[id]` also removes the file from disk.
- **Roles**: there's no `roles` table — roles are a fixed enum on `User`, per
  `AI_RULES.md`. `/admin/roles` is therefore a reference/headcount view, not a
  CRUD screen. If you need editable, granular permissions later, that's a new
  `permissions` table plus a rework of `lib/rbac.ts`.
- **Status enums**: `ContentStatus` (DRAFT/PUBLISHED/ARCHIVED) is shared by
  Page and Post; `UserStatus` (ACTIVE/INACTIVE/SUSPENDED) is separate, since
  `DATABASE.md` lists `status` generically on both without defining values.
- **User CRUD via Route Handlers**: per `AI_RULES.md` ("API: Use Route
  Handlers"), Users/Media mutations go through `/api/users/*` and
  `/api/media/*` rather than Server Actions, called from client forms with
  `fetch`.
- **Settings/SEO storage**: global settings and SEO defaults use the
  `settings` key-value table. `lib/settings.ts` centralizes defaults,
  normalization, and upserts.

## Stack reference

See `AI_RULES.md` for the full set of conventions this scaffold follows
(TypeScript strict mode, no `any`, named exports, early returns, SOLID,
next/image, accessible HTML, etc.) — keep following them as you build out
Phases 3–5.
# paseo-cms
