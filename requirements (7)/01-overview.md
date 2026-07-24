# Product Overview

## What It Is

An internal, login-gated admin tool for managing physical/digital inventory across an organization. It replaces spreadsheets and ad-hoc trackers with a single dense, sortable, filterable inventory table backed by a relational database (PostgreSQL via Supabase), with full change history (audit log) and role-based access control. Two roles exist: **Viewers**, who need visibility into stock levels for reporting/decision-making, and **Editors**, who own the data — adding, updating, bulk-managing, and correcting inventory records. `[User-stated]`

## Who Uses It

| Role | Description | Frequency | Primary job |
|------|-------------|-----------|-------------|
| Viewer | Ops/finance/warehouse staff who need to check stock, cost, and supplier data but must not alter it | Daily, on-demand | Look up item availability, export reports, check status |
| Editor | Inventory managers / warehouse admins responsible for data accuracy | Multiple times/day | Add new SKUs, correct quantities, retire discontinued items, manage bulk changes, review who-changed-what |

## The Transformation

| Before | After |
|--------|-------|
| Inventory tracked in spreadsheets with no change history | Single source of truth with full audit trail (who/what/when) |
| No role separation — anyone with file access can edit | Enforced Viewer/Editor permissions at UI and API layer |
| Manual filtering/searching in spreadsheet | Server-backed filters (category, status, quantity range, keyword) + sortable/paginated table |
| Ad-hoc exports (copy-paste) | One-click Excel export of the current filtered view |
| No accountability for changes (who edited what) | Every create/update/delete logged with before/after values |
| One-by-one edits only | Bulk actions (bulk delete, bulk status update) via row checkboxes |

## Scope

**Included:**
- Login-based authentication with two roles (Viewer, Editor)
- Inventory table: paginated, sortable, filterable (category, status, quantity range, keyword search on name+SKU)
- Editor CRUD: add item, inline-edit row, bulk delete, bulk status update
- Excel (.xlsx) export of the current filtered/sorted view
- Audit log: every create/update/delete with actor, before/after diff, timestamp — Editor-visible tab
- Dense admin UI: sidebar nav, full-width table, sticky header
- User/role management screen for assigning Viewer/Editor roles
- Dashboard overview: summary KPIs (total items, low stock, discontinued count, recent activity)

**Excluded (not requested — explicitly out of scope for this spec):**
- Multi-warehouse / multi-location inventory tracking
- Purchase order / procurement workflow
- Barcode scanning / mobile app
- Real-time stock sync with external e-commerce platforms
- Automated reorder alerts / email notifications (noted as a future integration in 07-integrations.md)
- Multi-tenant / multi-organization support

## Replacement Rationale

N/A — this is a greenfield build, not a SaaS replacement. The rationale is internal: eliminate spreadsheet-based inventory tracking, which lacks access control, audit trail, and bulk operations. `[User-stated]`
