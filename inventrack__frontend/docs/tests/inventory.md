# Test Report — Inventory List & Add/Edit Item Modal

## Summary

| Metric | Value |
|--------|-------|
| Test file | `src/test/inventory-page.test.jsx` |
| Total tests | 17 |
| Passed | 17 |
| Failed | 0 |
| Framework | Vitest + React Testing Library |

## Test Coverage

### InventoryPage (14 tests)

| # | Test | Acceptance Criteria |
|---|------|---------------------|
| 1 | Renders page title and inventory items | AC1: paginated view |
| 2 | Renders sortable column headers with sort arrows | AC1: sortable columns |
| 3 | Calls API with sort param when column header clicked | AC1: sort triggers API |
| 4 | Shows low stock badge for items at/below reorder point | Domain correctness |
| 5 | Renders filter toolbar (search, status, quantity range) | AC2: advanced filters |
| 6 | Renders pagination with correct info and page size options | AC1: pagination controls |
| 7 | Shows Editor controls: Add Item, checkboxes, row actions | AC3/AC4: CRUD controls |
| 8 | Hides Editor controls for Viewer role | Permissions: read-only |
| 9 | Shows bulk action bar when rows are selected | AC3: bulk actions |
| 10 | Enters inline edit mode on edit icon click | AC4: inline edit |
| 11 | Triggers export and shows success toast | AC5: .xlsx export |
| 12 | Shows empty state when no items exist | 4-state coverage |
| 13 | Shows error state with retry on API failure | 4-state coverage |
| 14 | Renders column visibility toggle | Column density feature |

### AddEditItemModal (3 tests)

| # | Test | Acceptance Criteria |
|---|------|---------------------|
| 15 | Opens modal with form fields when Add Item clicked | AC4: modal form |
| 16 | Validates required fields on submit | Form validation |
| 17 | Shows reorder point behind More options disclosure | Progressive disclosure |

## Mocking Strategy

- `apiClient` fully mocked — GET/POST/PATCH/DELETE/getBlob
- `useAuth` mocked for Editor and Viewer role switching
- `sonner` toast mocked for success/error assertions
- Mock data uses realistic inventory items with varied statuses and quantities
