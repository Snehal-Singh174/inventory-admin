# User Flows — Cross-Screen Journeys

## Master Journey Map

```mermaid
flowchart LR
  A[Login] --> B[Dashboard Overview]
  B --> C[Inventory List]
  B --> D[Audit Log]
  B --> E[User Management]
  C --> F[Add/Edit Item]
  C --> G[Bulk Actions]
  C --> H[Export .xlsx]
  F -.->|writes entry to| D
  G -.->|writes entries to| D
  E -.->|role change affects| C
  E -.->|role change affects| D

  classDef entry fill:#2563eb,color:#fff,stroke:none
  class A entry
```

---

## Cross-Screen Flows

### Flow: First Login → Landing on Dashboard

**Actor:** Viewer or Editor
**Trigger:** User navigates to the app URL
**Preconditions:** User has a valid account provisioned by an Editor
**Screens involved:** Login → Dashboard Overview

#### User Flow Diagram

```mermaid
flowchart TD
  Start([User opens app URL]) --> HasSession{Valid session/token in storage?}
  HasSession -->|Yes| Dashboard[→ Dashboard Overview]
  HasSession -->|No| Login[→ Login Screen]
  Login --> Submit[User submits email + password]
  Submit --> Validate{Credentials valid?}
  Validate -->|No| Error[Show 'Invalid credentials — use the demo accounts below to sign in']
  Error --> Login
  Validate -->|Yes| Active{Account is_active = true?}
  Active -->|No| Deactivated[Show 'This account has been deactivated. Contact your administrator.']
  Deactivated --> Login
  Active -->|Yes| IssueToken[Issue JWT + refresh token, Auto]
  IssueToken --> Dashboard
```

#### Sequence Diagram

```mermaid
sequenceDiagram
  participant U as User
  participant FE as React SPA
  participant BE as Node.js API
  participant DB as PostgreSQL

  U->>FE: Enter email + password, click "Sign In"
  FE->>BE: POST /api/v1/auth/login {email, password}
  BE->>DB: SELECT user WHERE email=?
  alt user not found or password mismatch
    BE-->>FE: 401 {error: "Invalid credentials"}
    FE-->>U: Show inline error, "Invalid credentials — use the demo accounts below to sign in"
  else user.is_active = false
    BE-->>FE: 403 {error: "Account deactivated"}
    FE-->>U: Show "This account has been deactivated. Contact your administrator."
  else success
    BE->>DB: INSERT Session, UPDATE user.last_login_at
    BE-->>FE: 200 {accessToken, refreshToken, user: {id, role, name}}
    FE->>FE: Store tokens, redirect to /dashboard
    FE-->>U: Render Dashboard Overview
  end
```

#### Step-by-Step

| Step | Screen | Actor action | System response | Error handling |
|------|--------|-------------|-----------------|----------------|
| 1 | Login | Enters email + password | Client-side validation (format) | Empty/invalid format → inline field error |
| 2 | Login | Clicks "Sign In" | POST /api/v1/auth/login | Network failure → toast "Failed to sign in. Check your connection and try again." |
| 3 | Login | — | Server validates credentials + active flag | Wrong creds → 401; inactive account → 403 |
| 4 | Dashboard | Lands on dashboard | GET /api/v1/dashboard/summary | Failure → error banner, retry button |

---

### Flow: Editor Adds a New Item, Reviews It in Audit Log

**Actor:** Editor
**Trigger:** Clicks "Add Item" on Inventory List
**Preconditions:** Logged in as Editor
**Screens involved:** Inventory List → Add/Edit Item Modal → (implicitly) Audit Log

#### User Flow Diagram

```mermaid
flowchart TD
  Start([Editor on Inventory List]) --> Click[Click 'Add Item']
  Click --> Modal[Add/Edit Item Modal opens]
  Modal --> Fill[Fill item_name, sku, category, quantity, unit_cost, supplier, status]
  Fill --> Submit[Click 'Add Item' submit button]
  Submit --> Validate{All required fields valid + SKU unique?}
  Validate -->|No, SKU duplicate| DupError[Inline error: 'This SKU already exists']
  DupError --> Fill
  Validate -->|No, missing field| FieldError[Inline error under field]
  FieldError --> Fill
  Validate -->|Yes| Create[Auto: create InventoryItem, write AuditLog action=create]
  Create --> Toast[Toast: 'Item added successfully']
  Toast --> Close[Modal closes, table refreshes with new row]
  Close --> Verify[Editor opens Audit Log tab]
  Verify --> SeeEntry[Sees new entry: action=create, performed_by=Editor, after_values populated]
```

#### Sequence Diagram

```mermaid
sequenceDiagram
  participant E as Editor
  participant FE as React SPA
  participant BE as Node.js API
  participant DB as PostgreSQL

  E->>FE: Fill form, click "Add Item"
  FE->>BE: POST /api/v1/inventory {item_name, sku, category_id, quantity, unit_cost, supplier_id, status}
  BE->>DB: SELECT 1 FROM inventory_item WHERE sku=?
  alt SKU already exists
    BE-->>FE: 409 {error: "This SKU already exists"}
    FE-->>E: Inline field error on SKU input
  else valid
    BE->>DB: BEGIN TRANSACTION
    BE->>DB: INSERT INTO inventory_item (...)
    BE->>DB: INSERT INTO audit_log (entity_type='InventoryItem', action='create', after_values=<row>)
    BE->>DB: COMMIT
    BE-->>FE: 201 {data: <new item>}
    FE-->>E: Toast "Item added successfully", modal closes, table row inserted
  end
  E->>FE: Navigate to Audit Log tab
  FE->>BE: GET /api/v1/audit-log?entity_type=InventoryItem
  BE->>DB: SELECT * FROM audit_log ORDER BY created_at DESC
  BE-->>FE: 200 {data: [...]}
  FE-->>E: Renders new audit row at top
```

#### Step-by-Step

| Step | Screen | Actor action | System response | Error handling |
|------|--------|-------------|-----------------|----------------|
| 1 | Inventory List | Click "Add Item" | Opens modal | — |
| 2 | Add/Edit Modal | Fill fields, submit | POST /api/v1/inventory | Duplicate SKU → 409 inline error; missing required field → client + server validation error |
| 3 | Inventory List | Modal closes | Table refetches page 1 with new item visible (or highlights if on current page) | API failure after submit → toast "Item was created but the list failed to refresh — reload the page" |
| 4 | Audit Log | Opens tab | GET /api/v1/audit-log | Failure → error banner with retry |

---

### Flow: Editor Bulk-Selects Items and Bulk-Updates Status

**Actor:** Editor
**Trigger:** Selects 2+ row checkboxes on Inventory List
**Preconditions:** Logged in as Editor, at least one item visible in current filtered view
**Screens involved:** Inventory List only (bulk action bar is inline)

#### User Flow Diagram

```mermaid
flowchart TD
  Start([Editor viewing Inventory List]) --> Select[Check 2+ row checkboxes]
  Select --> BulkBar[Bulk action bar slides up from bottom]
  BulkBar --> Choose{Choose action}
  Choose -->|Bulk Status Update| PickStatus[Select new status: Active or Discontinued]
  PickStatus --> Confirm1[Confirm dialog: 'Update status for N items?']
  Confirm1 -->|Cancel| BulkBar
  Confirm1 -->|Confirm| ApplyStatus[Auto: update N rows, write N AuditLog entries action=bulk_status_update]
  Choose -->|Bulk Delete| Confirm2[Confirm dialog: 'Delete N items? This cannot be undone from the UI.']
  Confirm2 -->|Cancel| BulkBar
  Confirm2 -->|Confirm| ApplyDelete[Auto: soft-delete N rows, write N AuditLog entries action=bulk_delete]
  ApplyStatus --> Toast1[Toast: 'N items updated']
  ApplyDelete --> Toast2[Toast: 'N items deleted']
  Toast1 --> Refresh[Table refreshes, selection cleared]
  Toast2 --> Refresh
```

#### Sequence Diagram

```mermaid
sequenceDiagram
  participant E as Editor
  participant FE as React SPA
  participant BE as Node.js API
  participant DB as PostgreSQL

  E->>FE: Select rows, click "Update Status", confirm dialog
  FE->>BE: PATCH /api/v1/inventory/bulk-status {ids: [...], status: "Discontinued"}
  BE->>DB: BEGIN TRANSACTION
  loop for each id
    BE->>DB: UPDATE inventory_item SET status=? WHERE id=?
    BE->>DB: INSERT INTO audit_log (action='bulk_status_update', before_values, after_values)
  end
  alt any row fails (e.g. item was deleted concurrently)
    BE->>DB: ROLLBACK
    BE-->>FE: 409 {error: "One or more items changed since you loaded this page. Refresh and try again."}
    FE-->>E: Error toast, no rows modified
  else all succeed
    BE->>DB: COMMIT
    BE-->>FE: 200 {updated: N}
    FE-->>E: Toast "N items updated", selection cleared, table refetches
  end
```

#### Step-by-Step

| Step | Screen | Actor action | System response | Error handling |
|------|--------|-------------|-----------------|----------------|
| 1 | Inventory List | Check row checkboxes | Bulk action bar appears with count | — |
| 2 | Inventory List | Click "Update Status" / "Delete" | Confirm modal with exact count and consequence | Cancel → dialog closes, no change |
| 3 | Inventory List | Confirm | PATCH/DELETE bulk endpoint, transactional | Partial failure → full rollback, error toast, nothing applied (atomic) |
| 4 | Inventory List | — | Toast + table refresh + selection cleared | — |

---

## Data Flow

```mermaid
graph LR
  subgraph Inputs
    I1[Login form]
    I2[Add/Edit Item form]
    I3[Inline row edit]
    I4[Bulk action selection]
    I5[Filter/search controls]
  end
  subgraph Processing
    P1[Auth middleware - JWT verify + role check]
    P2[Validation layer - zod/schema]
    P3[Audit logging middleware - diff capture]
    P4[Query builder - filters/sort/pagination]
  end
  subgraph Storage
    S1[(PostgreSQL: users, inventory_item, category, supplier, audit_log, session)]
  end
  subgraph Outputs
    O1[Inventory table render]
    O2[Audit log table render]
    O3[.xlsx export file download]
    O4[Dashboard KPI cards]
    O5[Toast/error notifications]
  end

  I1 --> P1 --> S1
  I2 --> P2 --> P3 --> S1
  I3 --> P2 --> P3 --> S1
  I4 --> P2 --> P3 --> S1
  I5 --> P4 --> S1
  S1 --> O1
  S1 --> O2
  P4 --> O3
  S1 --> O4
  P3 --> O5
```
