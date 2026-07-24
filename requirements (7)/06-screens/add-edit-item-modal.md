# Add/Edit Item Modal

**Route:** Overlay on `/inventory` (optionally deep-linked `/inventory?item=:id&mode=edit`)
**Auth:** Login required — Editor only
**Purpose:** Create a new InventoryItem or edit an existing one's full field set in a focused, single-purpose form.

## Domain Intelligence Analysis (applied)
- **Form mode:** Back-office / complete field set (not progressive onboarding) — Editors are committed power users who need every field visible at once.
- **Fields:** item_name, sku, category (select), quantity, unit_cost, supplier (select), status (select), reorder_point (optional, advanced).

## Navigation Context
**Active nav item:** "Inventory" (parent screen remains active/dimmed behind modal overlay)
**Breadcrumb path:** None — modal, not a routed page
**Back navigation:** Close (X), click outside, or Escape — returns to Inventory List
**Tabs on this screen:** None

## UI Component Hierarchy

```
[Add/Edit Item Modal]
├── [Modal Header]
│   ├── Title: "Add Item" (create mode) / "Edit Item — {item_name}" (edit mode)
│   └── Close button (X)
├── [Modal Body — Form]
│   ├── Item Name (text input)
│   ├── SKU (text input)
│   ├── Category (select — populated from Category entity)
│   ├── Quantity (number input)
│   ├── Unit Cost (currency input, $ prefix)
│   ├── Supplier (select — populated from Supplier entity)
│   ├── Status (select: Active / Discontinued)
│   └── "More options" disclosure toggle
│       └── Reorder Point (number input, optional) — helper text: "Items at or below this quantity show a Low Stock badge"
└── [Modal Footer]
    ├── "Cancel" — ghost button
    └── "Add Item" (create) / "Save Changes" (edit) — primary button
```

## CTA Buttons & Actions
| Label | Variant | Location | Visible to roles | Disabled when | Loading behavior | Confirm dialog? |
|---|---|---|---|---|---|---|
| "Add Item" / "Save Changes" | primary | modal footer, right | Editor only | required field missing, or (edit mode) no changes made | spinner replaces label → "Adding…" / "Saving…", width locked | No |
| "Cancel" | ghost | modal footer, left | Editor only | — | — | Yes, only if form has unsaved changes: "Discard changes?" |
| Close (X) | icon | modal header, top-right | Editor only | — | — | Same as Cancel |
| "More options" | disclosure toggle | above Reorder Point | Editor only | — | — | No |

## Components

| Component | What it shows | Interactions | States |
|-----------|--------------|--------------|--------|
| Item Name input | Free text, 1–150 chars | Type | default / error / disabled during submit |
| SKU input | Free text, unique | Type | default / error (duplicate) / disabled |
| Category select | Dropdown of existing categories | Select, or "+ Add category" inline create `[Assumed convenience feature]` | default / error (required) |
| Quantity input | Integer ≥ 0 | Type, stepper buttons | default / error (negative) |
| Unit Cost input | Decimal ≥ 0, $ prefix | Type | default / error (negative/invalid format) |
| Supplier select | Dropdown of existing suppliers | Select | default / error (required) |
| Status select | Active / Discontinued | Select | default |
| Reorder Point input | Integer ≥ 0, optional | Type | default / hidden until "More options" expanded |

## Forms

### Add/Edit Item Form
| Field | Type | Required | Validation rules | Error message shown to user | Placeholder / Default |
|-------|------|----------|------------------|-----------------------------|----------------------|
| Item Name | text | Yes | 1–150 chars | "Item name is required" | "e.g. Wireless Barcode Scanner" |
| SKU | text | Yes | unique, alphanumeric + hyphens, 1–50 chars | "This SKU already exists" / "SKU is required" | "e.g. WBS-2200" |
| Category | select | Yes | must be an existing category | "Select a category" | "Select category…" |
| Quantity | number | Yes | integer ≥ 0 | "Quantity cannot be negative" | 0 |
| Unit Cost | currency | Yes | decimal ≥ 0, max 2 decimal places | "Enter a valid cost (e.g. 19.99)" | "$0.00" |
| Supplier | select | Yes | must be an existing supplier | "Select a supplier" | "Select supplier…" |
| Status | select | Yes | Active or Discontinued | — | "Active" (default for new items) |
| Reorder Point | number | No (optional) | integer ≥ 0 | "Enter a valid number" | 10 |

**Submit behavior:** create mode → `POST /api/v1/inventory`; edit mode → `PATCH /api/v1/inventory/:id` (only changed fields sent). On success, modal closes and toast confirms; Inventory List table refetches/updates the affected row.
**Success state:** Toast "Item added successfully" (create) or "Item updated" (edit); modal closes; table reflects change immediately.

## API Calls

| Trigger | Method | Endpoint | Request payload | Response | Error handling | User-facing error message |
|---------|--------|----------|----------------|----------|----------------|--------------------------|
| Modal opens (edit mode) | GET | /api/v1/inventory/:id | — | full item record | 404 → close modal, toast | "This item no longer exists." |
| Modal opens (create/edit) | GET | /api/v1/categories, /api/v1/suppliers | — | lists for selects | fallback: selects show "Failed to load" with retry | "Failed to load categories/suppliers." |
| Submit (create) | POST | /api/v1/inventory | full field set | created item | 409 duplicate SKU → inline field error | "This SKU already exists" |
| Submit (edit) | PATCH | /api/v1/inventory/:id | changed fields only | updated item | 409 conflict → toast | "Item changed since you loaded it. Refresh and try again." |

## States
**Empty:** N/A — form always has a defined field set; create mode starts blank (Status defaults to "Active"), edit mode pre-fills from fetched record.
**Loading:** On open (edit mode), skeleton form fields while fetching the record and category/supplier lists; submit button shows spinner during save.
**Error:** Field-level inline errors under each invalid field; page-level fetch failure shows an error state inside the modal body with "Retry" button, footer buttons disabled until retry succeeds.
**Permission-denied:** N/A — this screen is Editor-only and unreachable by Viewers (route/action hidden in UI, and API rejects with 403 if a Viewer token is used directly).
