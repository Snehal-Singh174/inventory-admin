# Screen Index

| # | Screen | Route | Auth | Priority |
|---|--------|-------|------|----------|
| 1 | Login | `/login` | Public | P0 |
| 2 | Dashboard Overview | `/dashboard` | Login required (Viewer, Editor) | P1 |
| 3 | Inventory List | `/inventory` | Login required (Viewer, Editor) | P0 |
| 4 | Add/Edit Item Modal | overlay on `/inventory` (no dedicated route; deep-linkable via `/inventory?item=:id&mode=edit`) | Editor only | P0 |
| 5 | Audit Log | `/audit-log` | Editor only | P0 |
| 6 | User Management | `/users` | Editor only | P0 |

skill-version: screen-generation-v1 (rocket:screen-generation)
