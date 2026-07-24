/* SCREEN PLAN: InventoryTable
 * Grid: Full-width data table, 10 columns (checkbox + 8 data + actions)
 * Sections: sticky header → sortable columns, body rows → striped/hover, inline edit
 * States: loading skeleton, error alert, empty (no items / no filter match), success
 * Copy: sort arrows, low-stock badge, status badges
 * Slop risks: missing sort indicators, no hover states, missing inline edit, uniform text
 */
import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2, Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

const SORT_COLUMNS = {
  itemName: 'itemName',
  sku: 'sku',
  category: 'categoryName',
  quantity: 'quantity',
  unitCost: 'unitCost',
  supplier: 'supplierName',
  status: 'status',
  updatedAt: 'updatedAt',
};

function SortHeader({ label, column, sort, onSort }) {
  const isActive = sort.sortBy === column;
  const Icon = isActive
    ? sort.sortOrder === 'asc' ? ArrowUp : ArrowDown
    : ArrowUpDown;

  return (
    <button
      onClick={() => onSort(column)}
      className={cn(
        'flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap',
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      )}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <Icon size={14} className="flex-shrink-0" />
    </button>
  );
}

function StatusBadge({ status }) {
  const isActive = status === 'Active';
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      isActive ? 'bg-successBackground text-success' : 'bg-accent text-muted-foreground'
    )}>
      {status}
    </span>
  );
}

function LowStockBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-warningBackground text-warning ml-1.5">
      <AlertTriangle size={10} />
      Low Stock
    </span>
  );
}

function InlineEditRow({
  item,
  categories,
  suppliers,
  visibleColumns,
  onSave,
  onCancel,
}) {
  const [editValues, setEditValues] = useState({
    quantity: item.quantity,
    unitCost: item.unitCost,
    status: item.status,
    categoryId: item.categoryId,
    supplierId: item.supplierId,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const newErrors = {};
    if (editValues.quantity < 0 || !Number.isInteger(Number(editValues.quantity))) {
      newErrors.quantity = 'Quantity cannot be negative';
    }
    if (Number(editValues.unitCost) < 0) {
      newErrors.unitCost = 'Cost cannot be negative';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const changes = {};
      if (Number(editValues.quantity) !== item.quantity) changes.quantity = Number(editValues.quantity);
      if (Number(editValues.unitCost) !== item.unitCost) changes.unitCost = Number(editValues.unitCost);
      if (editValues.status !== item.status) changes.status = editValues.status;
      if (editValues.categoryId !== item.categoryId) changes.categoryId = editValues.categoryId;
      if (editValues.supplierId !== item.supplierId) changes.supplierId = editValues.supplierId;

      if (Object.keys(changes).length === 0) {
        onCancel();
        return;
      }
      await onSave(item.id, changes);
    } catch {
      setSaving(false);
    }
  };

  return (
    <>
      {visibleColumns.includes('itemName') && (
        <td className="px-3 py-2.5 text-sm text-foreground font-medium">{item.itemName}</td>
      )}
      {visibleColumns.includes('sku') && (
        <td className="px-3 py-2.5 text-sm text-muted-foreground font-mono">{item.sku}</td>
      )}
      {visibleColumns.includes('category') && (
        <td className="px-3 py-2.5">
          <select
            value={editValues.categoryId}
            onChange={(e) => setEditValues((p) => ({ ...p, categoryId: e.target.value }))}
            className="h-8 px-2 rounded border border-primary bg-background text-sm text-foreground focus:ring-2 focus:ring-ring w-full max-w-[140px]"
          >
            {categories.map((c) => (
              <option key={`edit-cat-${c.id}`} value={c.id}>{c.name}</option>
            ))}
          </select>
        </td>
      )}
      {visibleColumns.includes('quantity') && (
        <td className="px-3 py-2.5">
          <input
            type="number"
            min="0"
            value={editValues.quantity}
            onChange={(e) => { setEditValues((p) => ({ ...p, quantity: e.target.value })); setErrors((p) => ({ ...p, quantity: undefined })); }}
            className={cn(
              'h-8 w-20 px-2 rounded border bg-background text-sm text-foreground font-mono tabular-nums focus:ring-2 focus:ring-ring',
              errors.quantity ? 'border-error' : 'border-primary'
            )}
            aria-label="Edit quantity"
          />
          {errors.quantity && <p className="text-xs text-error mt-0.5">{errors.quantity}</p>}
        </td>
      )}
      {visibleColumns.includes('unitCost') && (
        <td className="px-3 py-2.5">
          <div className="flex items-center gap-0.5">
            <span className="text-sm text-muted-foreground">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={editValues.unitCost}
              onChange={(e) => { setEditValues((p) => ({ ...p, unitCost: e.target.value })); setErrors((p) => ({ ...p, unitCost: undefined })); }}
              className={cn(
                'h-8 w-24 px-2 rounded border bg-background text-sm text-foreground font-mono tabular-nums focus:ring-2 focus:ring-ring',
                errors.unitCost ? 'border-error' : 'border-primary'
              )}
              aria-label="Edit unit cost"
            />
          </div>
          {errors.unitCost && <p className="text-xs text-error mt-0.5">{errors.unitCost}</p>}
        </td>
      )}
      {visibleColumns.includes('supplier') && (
        <td className="px-3 py-2.5">
          <select
            value={editValues.supplierId}
            onChange={(e) => setEditValues((p) => ({ ...p, supplierId: e.target.value }))}
            className="h-8 px-2 rounded border border-primary bg-background text-sm text-foreground focus:ring-2 focus:ring-ring w-full max-w-[140px]"
          >
            {suppliers.map((s) => (
              <option key={`edit-sup-${s.id}`} value={s.id}>{s.name}</option>
            ))}
          </select>
        </td>
      )}
      {visibleColumns.includes('status') && (
        <td className="px-3 py-2.5">
          <select
            value={editValues.status}
            onChange={(e) => setEditValues((p) => ({ ...p, status: e.target.value }))}
            className="h-8 px-2 rounded border border-primary bg-background text-sm text-foreground focus:ring-2 focus:ring-ring"
          >
            <option value="Active">Active</option>
            <option value="Discontinued">Discontinued</option>
          </select>
        </td>
      )}
      {visibleColumns.includes('updatedAt') && (
        <td className="px-3 py-2.5 text-sm text-muted-foreground">{formatDate(item.updatedAt)}</td>
      )}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-1.5 rounded-md bg-successBackground text-success hover:bg-success hover:text-success-foreground transition-colors disabled:opacity-50"
            aria-label="Save changes"
          >
            <Check size={14} />
          </button>
          <button
            onClick={onCancel}
            disabled={saving}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors disabled:opacity-50"
            aria-label="Cancel editing"
          >
            <X size={14} />
          </button>
        </div>
      </td>
    </>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

function formatCurrency(value) {
  if (value == null) return '$0.00';
  return `$${Number(value).toFixed(2)}`;
}

export function InventoryTable({
  items,
  sort,
  onSort,
  visibleColumns,
  isEditor,
  selectedIds,
  onSelectToggle,
  onSelectAll,
  editingRowId,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteRow,
  categories,
  suppliers,
}) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id));
  const someSelected = items.some((item) => selectedIds.includes(item.id)) && !allSelected;

  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-left">
        <thead className="sticky top-0 bg-surface-elevated border-b border-border z-10">
          <tr>
            {isEditor && (
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={onSelectAll}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
                  aria-label="Select all rows"
                />
              </th>
            )}
            {visibleColumns.includes('itemName') && (
              <th className="px-3 py-3" scope="col">
                <SortHeader label="Item Name" column="itemName" sort={sort} onSort={onSort} />
              </th>
            )}
            {visibleColumns.includes('sku') && (
              <th className="px-3 py-3" scope="col">
                <SortHeader label="SKU" column="sku" sort={sort} onSort={onSort} />
              </th>
            )}
            {visibleColumns.includes('category') && (
              <th className="px-3 py-3" scope="col">
                <SortHeader label="Category" column="categoryName" sort={sort} onSort={onSort} />
              </th>
            )}
            {visibleColumns.includes('quantity') && (
              <th className="px-3 py-3" scope="col">
                <SortHeader label="Quantity" column="quantity" sort={sort} onSort={onSort} />
              </th>
            )}
            {visibleColumns.includes('unitCost') && (
              <th className="px-3 py-3" scope="col">
                <SortHeader label="Unit Cost" column="unitCost" sort={sort} onSort={onSort} />
              </th>
            )}
            {visibleColumns.includes('supplier') && (
              <th className="px-3 py-3" scope="col">
                <SortHeader label="Supplier" column="supplierName" sort={sort} onSort={onSort} />
              </th>
            )}
            {visibleColumns.includes('status') && (
              <th className="px-3 py-3" scope="col">
                <SortHeader label="Status" column="status" sort={sort} onSort={onSort} />
              </th>
            )}
            {visibleColumns.includes('updatedAt') && (
              <th className="px-3 py-3" scope="col">
                <SortHeader label="Last Updated" column="updatedAt" sort={sort} onSort={onSort} />
              </th>
            )}
            {isEditor && (
              <th className="w-24 px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item, index) => {
            const isEditing = editingRowId === item.id;
            const isSelected = selectedIds.includes(item.id);
            const isLowStock = item.reorderPoint != null && item.quantity <= item.reorderPoint;

            return (
              <tr
                key={`inv-row-${item.id}`}
                className={cn(
                  'transition-colors duration-150',
                  index % 2 === 0 ? 'bg-surface' : 'bg-accent/30',
                  isSelected && 'bg-primary/5',
                  !isEditing && 'hover:bg-muted/50 group'
                )}
              >
                {isEditor && (
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectToggle(item.id)}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-ring cursor-pointer"
                      aria-label={`Select ${item.itemName}`}
                    />
                  </td>
                )}
                {isEditing ? (
                  <InlineEditRow
                    item={item}
                    categories={categories}
                    suppliers={suppliers}
                    visibleColumns={visibleColumns}
                    onSave={onSaveEdit}
                    onCancel={onCancelEdit}
                  />
                ) : (
                  <>
                    {visibleColumns.includes('itemName') && (
                      <td className="px-3 py-2.5 text-sm font-medium text-foreground">{item.itemName}</td>
                    )}
                    {visibleColumns.includes('sku') && (
                      <td className="px-3 py-2.5 text-sm text-muted-foreground font-mono">{item.sku}</td>
                    )}
                    {visibleColumns.includes('category') && (
                      <td className="px-3 py-2.5 text-sm text-foreground">{item.categoryName || '—'}</td>
                    )}
                    {visibleColumns.includes('quantity') && (
                      <td className="px-3 py-2.5 text-sm text-foreground font-mono tabular-nums">
                        {item.quantity}
                        {isLowStock && <LowStockBadge />}
                      </td>
                    )}
                    {visibleColumns.includes('unitCost') && (
                      <td className="px-3 py-2.5 text-sm text-foreground font-mono tabular-nums">
                        {formatCurrency(item.unitCost)}
                      </td>
                    )}
                    {visibleColumns.includes('supplier') && (
                      <td className="px-3 py-2.5 text-sm text-foreground">{item.supplierName || '—'}</td>
                    )}
                    {visibleColumns.includes('status') && (
                      <td className="px-3 py-2.5">
                        <StatusBadge status={item.status} />
                      </td>
                    )}
                    {visibleColumns.includes('updatedAt') && (
                      <td className="px-3 py-2.5 text-sm text-muted-foreground">{formatDate(item.updatedAt)}</td>
                    )}
                    {isEditor && (
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onStartEdit(item.id)}
                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={`Edit ${item.itemName}`}
                            title="Edit item"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => onDeleteRow(item)}
                            className="p-1.5 rounded-md hover:bg-errorBackground text-muted-foreground hover:text-error transition-colors"
                            aria-label={`Delete ${item.itemName}`}
                            title="Delete item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryTable;
