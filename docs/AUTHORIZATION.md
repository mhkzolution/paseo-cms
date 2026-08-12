# Authorization

This document reflects the certified authorization model for The Paseo CMS.
Permissions are defined once in `lib/admin-permissions.ts` and enforced across
admin UI, middleware, and API layers.

## Source of truth

- Registry: `ADMIN_MODULE_PERMISSIONS` in `lib/admin-permissions.ts`
- Module IDs: `AdminModuleId` in `types/index.ts`
- Role tiers: `SUPER_ADMIN_ROLES`, `ADMIN_ROLES`, `CONTENT_EDITOR_ROLES`,
  `MARKETING_CONTENT_ROLES`

Do not add local role arrays to API routes. Use `checkModuleAccess(moduleId)`.

## Enforcement layers

| Layer | File | Mechanism |
| --- | --- | --- |
| Navigation | `lib/admin-navigation.ts` | `getModuleRoles(item.id)` |
| Middleware | `proxy.ts` | `findModulePermissionForPathname()` |
| Admin pages | `lib/rbac.ts` | `requireModuleAccess(moduleId)` |
| API routes | `lib/rbac.ts` | `checkModuleAccess(moduleId)` |
| Search API | `lib/search-access.ts` | `authorizeSearchRequest()` |

`/api/**` is excluded from the middleware matcher. API routes must enforce
access in the handler.

## Public endpoints

These endpoints are intentionally unauthenticated:

- `POST /api/contact`
- `POST /api/leasing` (reCAPTCHA validated)
- `GET /api/search?scope=public` (published content only)

All other API handlers require registry-backed authorization.

## Adding a new admin module

1. Add the module to `ADMIN_MODULE_PERMISSIONS` with a unique `routePrefix`.
2. Add the `AdminModuleId` to `types/index.ts` if needed.
3. Add a navigation item in `lib/admin-navigation.ts` with matching `id`.
4. Protect admin pages with `requireModuleAccess(moduleId)`.
5. Protect API routes with `checkModuleAccess(moduleId)`.
6. Register API routes in `tests/api-authorization-guard.test.ts`.

## CI guards

`tests/api-authorization-guard.test.ts` fails the build if:

- any `app/api/**` route uses `checkRole(`
- any `app/api/**` route defines a local `*_ROLES` constant
- any API route file is missing from `API_ROUTE_REGISTRY`

`tests/admin-page-authorization-guard.test.ts` fails the build if:

- any non-exempt `app/admin/**/page.tsx` omits `requireModuleAccess()`
- any admin page uses legacy `requireRole()` or API-style `checkModuleAccess()`

Exempt admin pages (no page-level module guard required):

- `/admin` — root redirect
- `/admin/dashboard` — authenticated landing (TD-04)
- Legacy redirect-only banner shims documented in the certification report

Run authorization tests:

```bash
npm test -- tests/api-authorization-guard.test.ts tests/admin-page-authorization-guard.test.ts tests/api-phase*.test.ts tests/search-access.test.ts tests/admin-permissions.test.ts
```

## Certified status

- API routes: 100% registry-backed (no legacy `checkRole()` in `app/api/**`)
- Admin pages: `requireModuleAccess()` or equivalent feature-level guard
- Drift prevention: zero-tolerance CI guards
- Certification verdict: **APPROVED**
