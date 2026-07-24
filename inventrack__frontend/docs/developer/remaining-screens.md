# Developer Docs: Remaining Screens (Dashboard, Audit Log, User Management)

## Architecture

### Route Protection
`ProtectedRoute` accepts an optional `requiredRole` prop. When set, users without the correct role are redirected to `/dashboard` with a toast notification.

```jsx
<ProtectedRoute requiredRole="Editor">
  <AuditLogPage />
</ProtectedRoute>
```

### Data Hooks
Each screen uses a dedicated hook that manages fetch state as a discriminated union:

| Hook | Endpoint | Features |
|------|----------|----------|
| `useDashboard` | GET /api/v1/dashboard/summary | Single fetch with retry |
| `useAuditLog` | GET /api/v1/audit-log | Filters, pagination, clear |
| `useUsers` | GET /api/v1/users | Search, role filter, CRUD actions |

### Component Structure

```
src/
├── pages/
│   ├── DashboardPage.jsx       — orchestrates KPI, chart, feed
│   ├── AuditLogPage.jsx        — orchestrates filters, table, pagination
│   └── UserManagementPage.jsx  — orchestrates search, table, invite modal
├── components/
│   ├── dashboard/
│   │   ├── DashboardKpiGrid.jsx    — 5 KPI bento cards (hero + alert)
│   │   ├── DashboardChart.jsx      — Recharts BarChart by category
│   │   ├── DashboardActivityFeed.jsx — Last 8 audit entries
│   │   └── DashboardSkeleton.jsx   — Loading skeleton
│   ├── audit/
│   │   ├── AuditFilters.jsx        — Entity/action/date filters
│   │   └── AuditTable.jsx          — Expandable table with diff panel
│   └── users/
│       ├── UsersTable.jsx          — Table with inline role edit + confirm
│       └── InviteUserModal.jsx     — Form modal with validation
├── hooks/
│   ├── useDashboard.js
│   ├── useAuditLog.js
│   └── useUsers.js
```

## Key Decisions

### Dashboard KPI Grid
- 3-column grid: hero card spans 2 cols (Total Inventory Value)
- Low Stock card conditionally applies red alert tint when count > 0
- Low Stock card is clickable → navigates to /inventory?status=Low+Stock
- Activity feed section only rendered for Editor role

### Audit Log Diff Panel
- Expand/collapse per row (single-select — only one expanded at a time)
- Before/after panels side-by-side on md+, stacked on mobile
- Color coding: red border + bg for "Before", green for "After"
- Falls back to "No field-level changes recorded" when both are null

### User Management Self-Modification Block
- Role badge disabled for current user's row (tooltip explains why)
- Deactivate button disabled for own row
- All destructive/role-changing actions require confirmation dialog
- Inline role edit: click badge → dropdown → select → confirm dialog → API call

### Toast Notifications
- Sonner `<Toaster>` added at Routes level (bottom-right, rich colors)
- Role redirect: `toast.error` with specific message per route
- CRUD success: `toast.success`
- API failures: `toast.error` with message

## API Integration

| Action | Method | Endpoint |
|--------|--------|----------|
| Load dashboard | GET | /api/v1/dashboard/summary |
| Load audit log | GET | /api/v1/audit-log?page&limit&entityType&action&userId&dateFrom&dateTo |
| Load users | GET | /api/v1/users?page&limit&search&role |
| Create user | POST | /api/v1/users |
| Change role | PATCH | /api/v1/users/:id |
| Toggle active | PATCH | /api/v1/users/:id/deactivate |
