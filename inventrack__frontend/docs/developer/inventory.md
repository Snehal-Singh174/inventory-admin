# Developer Guide — Inventory Module

## Architecture

```
src/
├── pages/
│   └── InventoryPage.jsx          # Main page orchestrator
├── components/inventory/
│   ├── InventoryFilters.jsx       # Filter toolbar (search, category, status, qty range, columns)
│   ├── InventoryTable.jsx         # Data table with sort, inline edit, row actions
│   ├── Pagination.jsx             # Rich pagination bar (page numbers, size selector)
│   ├── BulkActionBar.jsx          # Fixed bottom bar for bulk operations
│   └── AddEditItemModal.jsx       # Create/edit form modal
└── hooks/
    └── useInventory.js            # Data fetching, filtering, CRUD, export logic
```

## Key Patterns

### State Management

- **Server state**: `useInventory()` custom hook manages items, meta, filters, sort, pagination
- **Local UI state**: `useState` in `InventoryPage` for selections, editing row, modal, confirm dialog
- **Form state**: `react-hook-form` in `AddEditItemModal` with field-level validation

### API Integration

All calls go through `src/utils/api-client.js` (10s timeout, 2-retry backoff).

| Action | Method | Endpoint |
|--------|--------|----------|
| List items | GET | `/api/v1/inventory?page&limit&sortBy&sortOrder&keyword&categoryId&status&minQuantity&maxQuantity` |
| Create item | POST | `/api/v1/inventory` |
| Update item | PATCH | `/api/v1/inventory/:id` |
| Delete item | DELETE | `/api/v1/inventory/:id` |
| Bulk status | PATCH | `/api/v1/inventory/bulk-status` |
| Bulk delete | PATCH | `/api/v1/inventory/bulk-delete` |
| Export .xlsx | GET | `/api/v1/inventory/export?<same filters>` |
| Categories | GET | `/api/v1/categories` |
| Suppliers | GET | `/api/v1/suppliers` |

### Permission Model

- **Editor**: Full CRUD — checkboxes, add button, inline edit, row actions, bulk bar
- **Viewer**: Read-only table — no checkboxes, no add button, no action icons

Determined by `user.role` from AuthContext. UI hides controls; API enforces with 403.

### Filter Behavior

- Keyword search debounced 300ms (timer-based)
- Category is multi-select (comma-separated IDs in query)
- Status is single-select dropdown
- Quantity range: min/max numeric inputs
- All filters update results immediately (no submit button)
- Column visibility toggle for 8 data columns

### Inline Edit Flow

1. Click pencil icon → row cells become editable inputs
2. Edit quantity/cost/category/supplier/status
3. Click checkmark to save → PATCH with only changed fields
4. 409 conflict → toast with refresh guidance
5. Success → row reverts to read mode, toast "Item updated"

### Export Flow

1. Click "Export" → button shows "Exporting…" spinner
2. GET `/api/v1/inventory/export` with current filter params
3. Response is binary blob → trigger browser download
4. Filename: `inventory-export-YYYY-MM-DD.xlsx`

### Modal (Add/Edit)

- **Create mode**: Empty form, status defaults to "Active"
- **Edit mode**: Fetches item by ID, pre-fills form
- Reorder Point behind "More options" disclosure toggle
- Unsaved changes warning on close (window.confirm)
- Field validation: required fields, SKU pattern, non-negative numbers
- Server errors: 409 duplicate SKU → inline field error

## Design Tokens

All colors use CSS custom properties defined in `src/styles/tailwind.css`:
- Status badges: `successBackground/success` (Active), `accent/muted-foreground` (Discontinued)
- Low stock: `warningBackground/warning`
- Error states: `errorBackground/error`

## Testing

Run tests: `npx vitest run src/test/inventory-page.test.jsx`

Tests mock the API client and verify:
- Correct rendering for both roles
- Filter/sort/pagination interaction with API
- Inline edit workflow
- Export trigger and toast feedback
- All four states (loading, error, empty, success)
