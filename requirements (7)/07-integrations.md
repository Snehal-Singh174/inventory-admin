# Integration Requirements

## Integration Catalog

| Integration | Category | Direction | Auth | Depth | Priority | Source |
|-------------|----------|-----------|------|-------|----------|--------|
| Excel export (.xlsx) generation | File generation (server-side library, not a third-party API) | Outbound (file download) | N/A — internal | Deep (server generates file matching exact filtered/sorted view) | P0 | User-stated |
| Supabase PostgreSQL | Data storage | Bidirectional | Connection string / service role key | Deep — primary datastore | P0 | User-stated |
| Email notifications (password reset, low-stock alert) | Notification | Outbound | API key (e.g. Resend/SMTP) | Shallow — not requested, recommended future addition | P2 — Future | Inferred |

## API Surface

**Base URL:** `/api/v1`
**Auth method:** Bearer JWT (`Authorization: Bearer <token>`), issued by `/api/v1/auth/login`

**Key resources:**

| Resource | Endpoints | Roles |
|----------|-----------|-------|
| Auth | `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh` | Public (login), Viewer+Editor (logout/refresh) |
| Inventory | `GET /inventory`, `POST /inventory`, `PATCH /inventory/:id`, `DELETE /inventory/:id`, `PATCH /inventory/bulk-status`, `DELETE /inventory/bulk` | GET: Viewer+Editor; all mutations: Editor only |
| Inventory Export | `GET /inventory/export` (query params mirror `GET /inventory` filters) | Viewer + Editor |
| Categories | `GET /categories`, `POST /categories` | GET: Viewer+Editor; POST: Editor only |
| Suppliers | `GET /suppliers`, `POST /suppliers` | GET: Viewer+Editor; POST: Editor only |
| Audit Log | `GET /audit-log`, `GET /audit-log/:id` | Editor only |
| Users | `GET /users`, `POST /users`, `PATCH /users/:id`, `PATCH /users/:id/deactivate` | Editor only |
| Dashboard | `GET /dashboard/summary` | Viewer + Editor |

**Webhook events:** None — internal tool, no outbound webhooks required at this scope.
