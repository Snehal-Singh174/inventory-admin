/** Core inventory domain types — mirrors backend InventoryItem model. */

export type ItemStatus = 'ACTIVE' | 'DISCONTINUED';

export interface ItemCategory {
  id: string;
  name: string;
}

export interface ItemSupplier {
  id: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  item_name: string;
  sku: string;
  category_id: string;
  quantity: number;
  unit_cost: number;
  total_value: number;
  supplier_id: string;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  category: ItemCategory | null;
  supplier: ItemSupplier | null;
}

export interface ListMeta {
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: ListMeta;
}

export interface AuditActor {
  id: string;
  name: string;
  email: string;
}

export interface AuditLogEntry {
  id: string;
  entity_type: 'INVENTORY_ITEM' | 'CATEGORY' | 'SUPPLIER';
  entity_id: string;
  entity_label: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  user_id: string;
  before_values: Record<string, unknown> | null;
  after_values: Record<string, unknown> | null;
  changed_fields: string[] | null;
  created_at: string;
  actor?: AuditActor;
}

/** Flat filter state — serialised into/from URL search params. */
export interface ItemFilters {
  keyword: string;
  categoryIds: string[];
  status: string;
  quantityMin: string;
  quantityMax: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

/** All 7 data columns — used for column-visibility toggle. */
export type ColumnKey = 'item_name' | 'sku' | 'category' | 'quantity' | 'unit_cost' | 'supplier' | 'status';

export const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'item_name',  label: 'Item Name'  },
  { key: 'sku',        label: 'SKU'        },
  { key: 'category',   label: 'Category'   },
  { key: 'quantity',   label: 'Qty'        },
  { key: 'unit_cost',  label: 'Unit Cost'  },
  { key: 'supplier',   label: 'Supplier'   },
  { key: 'status',     label: 'Status'     },
];
