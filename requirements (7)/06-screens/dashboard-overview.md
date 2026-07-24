# Dashboard Overview

**Route:** `/dashboard`
**Auth:** Login required — Viewer, Editor
**Purpose:** Answer "what does my inventory look like right now, and what needs attention?" in one glance.

## Domain Intelligence Analysis (applied)
- **Primary user question:** "Do I have stock problems right now, and what changed recently?"
- **What makes them panic:** Items silently going low-stock or discontinued without anyone noticing.
- **Key metrics:** Total active SKUs, low-stock count (alert), discontinued count, total inventory value, recent activity feed.
- **Density target:** 4 KPI cards (1 hero: Total Inventory Value) + 1 alert card (Low Stock, conditional) + 1 activity feed + 1 chart (stock value by category).
- **Grid plan:** 5 cards possible (4 KPI + 1 alert) → 3+2 layout: hero card (Total Inventory Value) spans 2 cols in row 1 alongside "Active SKUs"; row 2: "Low Stock" (alert tint, red), "Discontinued", "Categories Tracked".

## Navigation Context
**Active nav item:** "Dashboard"
**Breadcrumb path:** None (top-level screen)
**Back navigation:** None
**Tabs on this screen:** None

## UI Component Hierarchy

```
[Dashboard Root]
├── [AppLayout]
│   ├── Sidebar (Dashboard active, Inventory, Audit Log*, Users*)  (* Editor only)
│   └── Topbar (search N/A here, user menu, logout)
└── [Main Content Area]
    ├── [Page Header]
    │   ├── Title: "Dashboard"
    │   └── Subtitle: "Inventory health at a glance"
    ├── [KPI Bento Grid]
    │   ├── Hero Card: "Total Inventory Value" (spans 2 cols)
    │   ├── Card: "Active SKUs"
    │   ├── Alert Card: "Low Stock Items" (red tint, warning icon, conditional)
    │   ├── Card: "Discontinued Items"
    │   └── Card: "Categories Tracked"
    ├── [Chart Section]
    │   └── BarChart: "Inventory Value by Category"
    └── [Recent Activity Feed]
        ├── List of last 8 audit log entries (Editor only — hidden for Viewer)
        └── "View full audit log →" link (Editor only)
```

## CTA Buttons & Actions
| Label | Variant | Location | Visible to roles | Disabled when | Loading behavior | Confirm dialog? |
|---|---|---|---|---|---|---|
| "View full audit log →" | ghost link | Below activity feed | Editor only | — | — | No |
| "Go to Inventory" | secondary | Low Stock alert card | Viewer, Editor | — | — | No |

## Components

| Component | What it shows | Interactions | States |
|-----------|--------------|--------------|--------|
| KPI cards | Total value, active SKU count, low stock count, discontinued count, category count | Click "Low Stock" card → navigates to /inventory?filter=low_stock | default / loading skeleton / error |
| Category value chart | Bar chart of inventory value per category | Hover tooltip shows exact value | default / loading skeleton / empty (no categories) |
| Activity feed | Recent audit entries: actor, action, entity, time-ago | Click entry → navigates to Audit Log filtered to that entity | default / loading skeleton / empty ("No recent activity") |

## Forms
None on this screen.

## API Calls

| Trigger | Method | Endpoint | Request payload | Response | Error handling | User-facing error message |
|---------|--------|----------|----------------|----------|----------------|--------------------------|
| Page load | GET | /api/v1/dashboard/summary | — | `{totalValue, activeSkus, lowStockCount, discontinuedCount, categoryCount, valueByCategory[], recentActivity[]}` | Retry button on failure | "Failed to load dashboard. Check your connection and try again." |
| Click Low Stock card | — | client-side navigation | — | — | — | — |

## States
**Empty:** If no inventory items exist at all: KPI cards show 0, chart area shows "No categories with stock yet. Add your first item to see it here." with CTA "Add Item" (Editor) or no CTA (Viewer).
**Loading:** Skeleton bento cards matching final layout, skeleton bar chart, skeleton activity rows.
**Error:** Page-level error alert div: "Failed to load dashboard. Check your connection and try again." with "Retry" button.
**Permission-denied:** N/A — both roles can view; Activity Feed section and its "View full audit log" link are simply omitted for Viewer (not shown as disabled, fully absent).
