# User Roles & Permissions

## Roles

| Role | Who they are | What they do |
|------|-------------|--------------|
| Viewer | Staff who need read access to inventory data (ops, finance, warehouse floor) | View inventory table, filter/sort/search, view dashboard KPIs, export filtered view to Excel |
| Editor | Inventory managers / admins who own data accuracy | Everything a Viewer can do, plus: add/edit/delete items, bulk actions, view audit log, manage users/roles |

`[Assumed]` No third "Admin" role exists per spec ("Two roles: Viewer and Editor... Editors can... full CRUD"). Editor is treated as the highest privilege tier and therefore owns user/role management. This is flagged in 12-open-questions.md#1 for confirmation — if a dedicated Admin tier is desired, User Management should be split into its own role.

## Permission Matrix

| Feature / Action | Viewer | Editor |
|------------------|--------|--------|
| Login | ✅ | ✅ |
| View inventory table | ✅ | ✅ |
| Sort / filter / search inventory | ✅ | ✅ |
| Export filtered inventory to .xlsx | ✅ | ✅ |
| View dashboard KPIs | ✅ | ✅ |
| Add new inventory item | ❌ | ✅ |
| Inline-edit inventory row | ❌ | ✅ |
| Bulk delete items | ❌ | ✅ |
| Bulk status update | ❌ | ✅ |
| Select rows via checkboxes | 👁️ (checkboxes hidden/disabled) | ✅ |
| View audit log tab | ❌ | ✅ |
| View before/after diff on audit entries | ❌ | ✅ |
| View user management screen | ❌ | ✅ |
| Create/deactivate user accounts | ❌ | ✅ |
| Change a user's role | ❌ | ✅ |
| Manage categories/suppliers (lookup data) | ❌ | ✅ |

Legend: ✅ full access · 👁️ visible but read-only / disabled · ❌ not visible or blocked

## What Each Role Cannot Do

- **Viewer** cannot: create, edit, delete, or bulk-modify any inventory item; select rows for bulk action; view the audit log; view or manage user accounts; change any role assignment. Attempting any mutating API call as a Viewer is rejected server-side with `403 Forbidden` regardless of UI state.
- **Editor** cannot: view or restore hard-deleted audit log records (none exist — audit log is append-only and immutable, even to Editors); impersonate another user's session; bypass the requirement that every mutation is logged (logging is enforced at the middleware layer, not optional per-request).

## Enforcement Level

- **UI-only:** Hiding the "Add Item", bulk-action checkboxes, Audit Log tab, and Users nav item from Viewers. This improves UX but is not the security boundary.
- **API-enforced (the actual security boundary):** Every mutating endpoint (`POST`, `PATCH`, `DELETE` under `/api/v1/inventory`, `/api/v1/users`) is wrapped by a role-check middleware that validates the JWT's `role` claim server-side and returns `403 Forbidden` for Viewers, regardless of what the client sends. `GET /api/v1/audit-log` and `GET /api/v1/users` are similarly role-gated server-side — a Viewer cannot retrieve this data even via direct API call.
