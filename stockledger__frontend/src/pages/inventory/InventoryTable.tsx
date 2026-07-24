/* SCREEN PLAN: Inventory Table
 * Columns: checkbox | item_name | sku | category | quantity | unit_cost | supplier | status | actions
 * Inline edit: click qty/unit_cost cell (EDITOR) → input, Enter/blur = save, Esc = cancel
 * Status change: click badge (EDITOR) → ACTIVE/DISCONTINUED dropdown
 * Sort: click header → toggle asc/desc, active column highlighted
 * Row hover: actions visible + edit cursor on editable cells
 * States: skeleton rows (10), error alert, entity-specific empty, data rows
 * Slop risks: text-link actions → icon buttons; no hover state; missing column visibility
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Trash2, AlertCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateItem } from '../../hooks/useInventoryData';
import type { InventoryItem, ColumnKey } from '../../types/inventory';
import { cn } from '../../utils/cn';

type EditingCell = { id: string; field: 'quantity' | 'unit_cost'; value: string } | null;

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  onRetry: () => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (col: string) => void;
  selectedIds: Set<string>;
  onSelectAll: (itemIds: string[]) => void;
  onSelectRow: (id: string) => void;
  isEditor: boolean;
  visibleColumns: Set<ColumnKey>;
  onDeleteRequest: (id: string) => void;
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
        status === 'ACTIVE'
          ? 'bg-successBackground text-success'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {status === 'ACTIVE' ? 'Active' : 'Discontinued'}
    </span>
  );
}

// ── SortHeader ────────────────────────────────────────────────────────────────

function SortHeader({
  col,
  label,
  sortBy,
  sortOrder,
  onSort,
  className,
}: {
  col: string;
  label: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (c: string) => void;
  className?: string;
}) {
  const active = sortBy === col;
  return (
    <th scope="col" className={cn('px-4 py-3 text-left', className)}>
      <button
        type="button"
        onClick={() => onSort(col)}
        className={cn(
          'flex items-center gap-1 text-xs font-semibold uppercase tracking-wide',
          'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-primary rounded',
          active ? 'text-primary' : 'text-muted-foreground hover:text-onBackground',
        )}
      >
        {label}
        {active
          ? sortOrder === 'asc'
            ? <ArrowUp size={12} />
            : <ArrowDown size={12} />
          : <ArrowUpDown size={12} className="opacity-40" />}
      </button>
    </th>
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <tr key={`skel-row-${i}`} aria-hidden="true">
          <td className="px-4 py-3.5"><div className="skeleton h-4 w-4 rounded" /></td>
          <td className="px-4 py-3.5"><div className="skeleton h-3.5 w-40 rounded" /></td>
          <td className="px-4 py-3.5"><div className="skeleton h-3.5 w-24 rounded" /></td>
          <td className="px-4 py-3.5"><div className="skeleton h-3.5 w-24 rounded" /></td>
          <td className="px-4 py-3.5"><div className="skeleton h-3.5 w-12 rounded" /></td>
          <td className="px-4 py-3.5"><div className="skeleton h-3.5 w-16 rounded" /></td>
          <td className="px-4 py-3.5"><div className="skeleton h-3.5 w-28 rounded" /></td>
          <td className="px-4 py-3.5"><div className="skeleton h-5 w-20 rounded" /></td>
          <td className="px-4 py-3.5"><div className="skeleton h-4 w-14 rounded" /></td>
        </tr>
      ))}
    </>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

export function InventoryTable({
  items, isLoading, isError, errorMessage, onRetry,
  sortBy, sortOrder, onSort,
  selectedIds, onSelectAll, onSelectRow,
  isEditor, visibleColumns, onDeleteRequest,
}: InventoryTableProps) {
  const navigate = useNavigate();
  const updateItem = useUpdateItem();

  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [savedCell, setSavedCell] = useState<string | null>(null);
  const [statusDropId, setStatusDropId] = useState<string | null>(null);
  const statusDropRef = useRef<HTMLDivElement>(null);

  // Close status dropdown on outside click
  useEffect(() => {
    if (!statusDropId) return;
    const handler = (e: MouseEvent) => {
      if (statusDropRef.current && !statusDropRef.current.contains(e.target as Node)) {
        setStatusDropId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusDropId]);

  const flashSaved = useCallback((key: string) => {
    setSavedCell(key);
    setTimeout(() => setSavedCell(null), 1000);
  }, []);

  const commitEdit = useCallback((item: InventoryItem, cell: EditingCell) => {
    if (!cell) return;
    const rawVal = cell.value.trim();
    const numVal = parseFloat(rawVal);
    if (rawVal === '' || isNaN(numVal) || numVal < 0) {
      setEditingCell(null);
      return;
    }
    const updates =
      cell.field === 'quantity'
        ? { quantity: Math.floor(numVal) }
        : { unit_cost: parseFloat(numVal.toFixed(2)) };

    // Only save if changed
    const currentVal = cell.field === 'quantity' ? item.quantity : item.unit_cost;
    if (numVal === currentVal) { setEditingCell(null); return; }

    updateItem.mutate(
      { id: cell.id, updates },
      {
        onSuccess: () => {
          toast.success(`${cell.field === 'quantity' ? 'Quantity' : 'Unit cost'} updated`);
          flashSaved(`${cell.id}-${cell.field}`);
        },
        onError: (err) => toast.error(err.message ?? 'Failed to update — try again'),
      },
    );
    setEditingCell(null);
  }, [updateItem, flashSaved]);

  const handleStatusChange = useCallback((item: InventoryItem, newStatus: string) => {
    if (item.status === newStatus) { setStatusDropId(null); return; }
    setStatusDropId(null);
    updateItem.mutate(
      { id: item.id, updates: { status: newStatus as 'ACTIVE' | 'DISCONTINUED' } },
      {
        onSuccess: () => toast.success(`Status updated to ${newStatus === 'ACTIVE' ? 'Active' : 'Discontinued'}`),
        onError: (err) => toast.error(err.message ?? 'Failed to update status'),
      },
    );
  }, [updateItem]);

  const allPageSelected = items.length > 0 && items.every(i => selectedIds.has(i.id));
  const somePageSelected = items.some(i => selectedIds.has(i.id)) && !allPageSelected;

  const fmtCost = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v);

  const cols = visibleColumns;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              {/* Select-all checkbox */}
              <th scope="col" className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  ref={(el) => { if (el) el.indeterminate = somePageSelected; }}
                  onChange={() => onSelectAll(items.map(i => i.id))}
                  aria-label={allPageSelected ? 'Deselect all on this page' : 'Select all on this page'}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                />
              </th>
              {cols.has('item_name') && <SortHeader col="item_name" label="Item Name" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="min-w-[180px]" />}
              {cols.has('sku')       && <SortHeader col="sku"       label="SKU"       sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />}
              {cols.has('category')  && <SortHeader col="category"  label="Category"  sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />}
              {cols.has('quantity')  && <SortHeader col="quantity"  label="Qty"       sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />}
              {cols.has('unit_cost') && <SortHeader col="unit_cost" label="Unit Cost" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />}
              {cols.has('supplier')  && <SortHeader col="supplier"  label="Supplier"  sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />}
              {cols.has('status')    && <SortHeader col="status"    label="Status"    sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />}
              <th scope="col" className="px-4 py-3 w-20">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody aria-live="polite" aria-busy={isLoading}>
            {isLoading ? (
              <SkeletonRows />
            ) : isError ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div role="alert" className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-errorBackground flex items-center justify-center">
                      <AlertCircle size={20} className="text-error" />
                    </div>
                    <p className="text-sm font-semibold text-onBackground">{errorMessage}</p>
                    <button
                      onClick={onRetry}
                      className="px-4 py-2 text-sm font-medium bg-primary text-onPrimary rounded-lg
                                 hover:bg-primary/90 transition-colors min-h-[36px]
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Try again
                    </button>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Package size={22} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold text-onBackground">No inventory items match your filters</p>
                    <p className="text-xs text-muted-foreground">Try adjusting or clearing your search filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isSelected = selectedIds.has(item.id);
                const isEditingQty  = editingCell?.id === item.id && editingCell.field === 'quantity';
                const isEditingCost = editingCell?.id === item.id && editingCell.field === 'unit_cost';

                return (
                  <tr
                    key={`inv-row-${item.id}`}
                    className={cn(
                      'group border-b border-border last:border-0 transition-colors duration-100',
                      isSelected ? 'bg-primary/5' : 'hover:bg-muted/50',
                    )}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectRow(item.id)}
                        aria-label={`Select ${item.item_name}`}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                      />
                    </td>

                    {/* Item Name */}
                    {cols.has('item_name') && (
                      <td className="px-4 py-3.5 font-medium text-onBackground">
                        <button
                          type="button"
                          onClick={() => navigate(`/inventory/${item.id}`)}
                          className="text-left hover:text-primary hover:underline transition-colors truncate max-w-[200px] block"
                        >
                          {item.item_name}
                        </button>
                      </td>
                    )}

                    {/* SKU */}
                    {cols.has('sku') && (
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground tabular-nums">
                        {item.sku}
                      </td>
                    )}

                    {/* Category */}
                    {cols.has('category') && (
                      <td className="px-4 py-3.5 text-muted-foreground">{item.category?.name ?? '—'}</td>
                    )}

                    {/* Quantity — inline editable */}
                    {cols.has('quantity') && (
                      <td
                        className={cn(
                          'px-4 py-3.5 tabular-nums transition-colors duration-500',
                          savedCell === `${item.id}-quantity` && 'bg-successBackground',
                        )}
                      >
                        {isEditor && isEditingQty ? (
                          <input
                            type="number"
                            min={0}
                            autoFocus
                            value={editingCell?.value ?? ''}
                            onChange={e => setEditingCell(c => c ? { ...c, value: e.target.value } : null)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); commitEdit(item, editingCell); }
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            onBlur={() => commitEdit(item, editingCell)}
                            className="w-20 h-7 px-2 text-sm rounded border border-primary bg-surface
                                       tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        ) : (
                          <span
                            onClick={() => isEditor && setEditingCell({ id: item.id, field: 'quantity', value: String(item.quantity) })}
                            title={isEditor ? 'Click to edit quantity' : undefined}
                            className={cn(
                              'tabular-nums text-onBackground',
                              isEditor && 'cursor-pointer rounded px-1 -mx-1 hover:bg-warningBackground transition-colors',
                            )}
                          >
                            {item.quantity}
                          </span>
                        )}
                      </td>
                    )}

                    {/* Unit Cost — inline editable */}
                    {cols.has('unit_cost') && (
                      <td
                        className={cn(
                          'px-4 py-3.5 tabular-nums transition-colors duration-500',
                          savedCell === `${item.id}-unit_cost` && 'bg-successBackground',
                        )}
                      >
                        {isEditor && isEditingCost ? (
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            autoFocus
                            value={editingCell?.value ?? ''}
                            onChange={e => setEditingCell(c => c ? { ...c, value: e.target.value } : null)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); commitEdit(item, editingCell); }
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            onBlur={() => commitEdit(item, editingCell)}
                            className="w-24 h-7 px-2 text-sm rounded border border-primary bg-surface
                                       tabular-nums focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        ) : (
                          <span
                            onClick={() => isEditor && setEditingCell({ id: item.id, field: 'unit_cost', value: String(item.unit_cost) })}
                            title={isEditor ? 'Click to edit unit cost' : undefined}
                            className={cn(
                              'tabular-nums text-onBackground',
                              isEditor && 'cursor-pointer rounded px-1 -mx-1 hover:bg-warningBackground transition-colors',
                            )}
                          >
                            {fmtCost(item.unit_cost)}
                          </span>
                        )}
                      </td>
                    )}

                    {/* Supplier */}
                    {cols.has('supplier') && (
                      <td className="px-4 py-3.5 text-muted-foreground">{item.supplier?.name ?? '—'}</td>
                    )}

                    {/* Status — inline dropdown for EDITOR */}
                    {cols.has('status') && (
                      <td className="px-4 py-3.5">
                        {isEditor ? (
                          <div ref={statusDropId === item.id ? statusDropRef : undefined} className="relative inline-block">
                            <button
                              type="button"
                              onClick={() => setStatusDropId(id => id === item.id ? null : item.id)}
                              aria-label={`Change status: currently ${item.status}`}
                              aria-haspopup="listbox"
                              aria-expanded={statusDropId === item.id}
                            >
                              <StatusBadge status={item.status} />
                            </button>
                            {statusDropId === item.id && (
                              <div
                                role="listbox"
                                aria-label="Select status"
                                className="absolute z-30 top-full mt-1 left-0 bg-surface border border-border
                                           rounded-lg shadow-elevation-2 overflow-hidden py-1 min-w-[140px]"
                              >
                                {(['ACTIVE', 'DISCONTINUED'] as const).map(s => (
                                  <button
                                    key={`status-opt-${item.id}-${s}`}
                                    role="option"
                                    aria-selected={item.status === s}
                                    type="button"
                                    onClick={() => handleStatusChange(item, s)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted"
                                  >
                                    <StatusBadge status={s} />
                                    {item.status === s && <span className="ml-auto text-primary text-xs">✓</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <StatusBadge status={item.status} />
                        )}
                      </td>
                    )}

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          type="button"
                          onClick={() => navigate(`/inventory/${item.id}`)}
                          aria-label={`View details for ${item.item_name}`}
                          title="View item details"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-info hover:bg-infoBackground
                                     transition-colors duration-150 focus-visible:outline-none
                                     focus-visible:ring-2 focus-visible:ring-primary min-h-[32px] min-w-[32px]"
                        >
                          <Eye size={15} />
                        </button>
                        {isEditor && (
                          <button
                            type="button"
                            onClick={() => onDeleteRequest(item.id)}
                            aria-label={`Delete ${item.item_name}`}
                            title="Delete this item — cannot be undone"
                            className="p-1.5 rounded-md text-muted-foreground hover:text-error hover:bg-errorBackground
                                       transition-colors duration-150 focus-visible:outline-none
                                       focus-visible:ring-2 focus-visible:ring-error min-h-[32px] min-w-[32px]"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
