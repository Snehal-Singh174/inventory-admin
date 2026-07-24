/* SCREEN PLAN: Inventory Dashboard (/inventory)
 * Grid: KPI row (4 cards) + filter bar + optional bulk bar + table + pagination
 * Filter state: URL search params for shareability and back/forward
 * Selection state: local useState<Set<string>> — not persisted
 * States: loading (skeleton), error (specific + retry), empty (entity msg + CTA), success
 * Copy: "Inventory" / "Track stock levels, costs, and status across all SKUs"
 *       Empty: "No inventory items match your filters"
 *       Error: "Failed to load inventory — check your connection and try again"
 * Slop risks: generic KPI cards → semantic tints per card; no bulk animation → scale-in
 */

import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useInventoryItems,
  useBulkDelete,
  useBulkStatus,
  buildItemsQueryString,
  exportInventoryItems,
} from '../hooks/useInventoryData';
import type { ItemFilters, ColumnKey } from '../types/inventory';
import { ALL_COLUMNS } from '../types/inventory';
import { InventoryKpiCards } from './inventory/InventoryKpiCards';
import { InventoryFilters } from './inventory/InventoryFilters';
import { BulkActionBar } from './inventory/BulkActionBar';
import { InventoryTable } from './inventory/InventoryTable';
import { ConfirmDialog } from './inventory/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

// ── Pagination bar ────────────────────────────────────────────────────────────

function PaginationBar({
  total, page, pageSize, onPageChange, onPageSizeChange,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = Math.min(total, (page - 1) * pageSize + 1);
  const end = Math.min(total, page * pageSize);

  const pageBtns = () => {
    const pages: (number | '…')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('…');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('…');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-1 text-sm">
      <p className="text-muted-foreground tabular-nums">
        {total === 0 ? 'No items' : `${start}–${end} of ${total.toLocaleString()} items`}
      </p>
      <div className="flex items-center gap-2">
        {/* Prev */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40
                     disabled:pointer-events-none transition-colors min-h-[32px] min-w-[32px]"
        >
          <ChevronLeft size={15} />
        </button>

        {pageBtns().map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">…</span>
          ) : (
            <button
              key={`page-${p}`}
              type="button"
              onClick={() => onPageChange(p as number)}
              aria-label={`Go to page ${p}`}
              aria-current={page === p ? 'page' : undefined}
              className={cn(
                'w-8 h-8 rounded-lg text-sm transition-colors',
                page === p
                  ? 'bg-primary text-onPrimary font-semibold'
                  : 'border border-border hover:bg-muted text-onBackground',
              )}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40
                     disabled:pointer-events-none transition-colors min-h-[32px] min-w-[32px]"
        >
          <ChevronRight size={15} />
        </button>

        {/* Items per page */}
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          aria-label="Items per page"
          className="h-8 px-2 text-sm rounded-lg border border-border bg-surface text-onBackground
                     focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          {[10, 20, 50].map(s => (
            <option key={`ps-${s}`} value={s}>{s} / page</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function InventoryDashboard() {
  const { user } = useAuth();
  const isEditor = user?.role === 'EDITOR';
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Derive filter state from URL ──────────────────────────────────────────
  const filters: ItemFilters = {
    keyword:      searchParams.get('keyword') ?? '',
    categoryIds:  searchParams.get('category')?.split(',').filter(Boolean) ?? [],
    status:       searchParams.get('status') ?? '',
    quantityMin:  searchParams.get('quantityMin') ?? '',
    quantityMax:  searchParams.get('quantityMax') ?? '',
    sortBy:       searchParams.get('sortBy') ?? 'created_at',
    sortOrder:    (searchParams.get('sortOrder') as 'asc' | 'desc') ?? 'desc',
    page:         Math.max(1, parseInt(searchParams.get('page') ?? '1', 10)),
    pageSize:     parseInt(searchParams.get('pageSize') ?? '20', 10),
  };

  const updateFilter = (updates: Partial<Record<string, string>>, resetPage = true) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === '' || v == null) next.delete(k);
        else next.set(k, v);
      });
      if (resetPage) next.delete('page');
      return next;
    });
  };

  // ── Column visibility ─────────────────────────────────────────────────────
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(ALL_COLUMNS.map(c => c.key)),
  );
  const toggleColumn = (col: ColumnKey) =>
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(col) && next.size > 1) next.delete(col);
      else next.add(col);
      return next;
    });

  // ── Row selection ─────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const handleSelectAll = (ids: string[]) =>
    setSelectedIds(prev => {
      const allSelected = ids.every(id => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      }
      return new Set([...prev, ...ids]);
    });
  const handleSelectRow = (id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data, isLoading, isError, error, refetch } = useInventoryItems(filters);
  const items = data?.data ?? [];
  const meta  = data?.meta ?? { total: 0, page: 1, pageSize: filters.pageSize };

  // ── Mutations ─────────────────────────────────────────────────────────────
  const bulkDelete = useBulkDelete();
  const bulkStatus = useBulkStatus();

  // ── Delete confirm state ──────────────────────────────────────────────────
  type ConfirmState =
    | null
    | { type: 'single-delete'; id: string; name: string }
    | { type: 'bulk-delete' }
    | { type: 'bulk-status'; status: 'ACTIVE' | 'DISCONTINUED' };
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const handleConfirm = async () => {
    if (!confirmState) return;
    try {
      if (confirmState.type === 'bulk-delete') {
        const ids = [...selectedIds];
        const { deletedCount } = await bulkDelete.mutateAsync(ids);
        toast.success(`${deletedCount} item${deletedCount !== 1 ? 's' : ''} deleted`);
        setSelectedIds(new Set());
      } else if (confirmState.type === 'bulk-status') {
        const ids = [...selectedIds];
        const { updatedCount } = await bulkStatus.mutateAsync({ ids, status: confirmState.status });
        const label = confirmState.status === 'ACTIVE' ? 'Active' : 'Discontinued';
        toast.success(`${updatedCount} item${updatedCount !== 1 ? 's' : ''} set to ${label}`);
        setSelectedIds(new Set());
      }
      setConfirmState(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg);
      setConfirmState(null);
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const qs = buildItemsQueryString({ ...filters, page: undefined, pageSize: undefined });
      await exportInventoryItems(qs);
      toast.success('Inventory exported to Excel');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  // ── Sort handler ──────────────────────────────────────────────────────────
  const handleSort = useCallback((col: string) => {
    const newOrder = filters.sortBy === col && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    updateFilter({ sortBy: col, sortOrder: newOrder }, false);
  }, [filters.sortBy, filters.sortOrder]);

  const confirmIsLoading = bulkDelete.isPending || bulkStatus.isPending;

  const confirmTitle = !confirmState ? '' :
    confirmState.type === 'bulk-delete' ? `Delete ${selectedIds.size} item${selectedIds.size !== 1 ? 's' : ''}?` :
    confirmState.type === 'bulk-status' ? `Set ${selectedIds.size} item${selectedIds.size !== 1 ? 's' : ''} to ${confirmState.status === 'ACTIVE' ? 'Active' : 'Discontinued'}?` : '';

  const confirmBody = !confirmState ? '' :
    confirmState.type === 'bulk-delete'
      ? `This will permanently remove ${selectedIds.size} item${selectedIds.size !== 1 ? 's' : ''} from inventory. This action cannot be undone.`
      : `${selectedIds.size} selected item${selectedIds.size !== 1 ? 's' : ''} will have their status updated. You can change it again at any time.`;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <LayoutDashboard size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-onBackground">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track stock levels, costs, and status across all SKUs
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <InventoryKpiCards />

      {/* Filters */}
      <InventoryFilters
        filters={filters}
        visibleColumns={visibleColumns}
        isExporting={isExporting}
        onKeywordChange={v => updateFilter({ keyword: v })}
        onCategoryChange={ids => updateFilter({ category: ids.join(',') })}
        onStatusChange={v => updateFilter({ status: v })}
        onQtyMinChange={v => updateFilter({ quantityMin: v })}
        onQtyMaxChange={v => updateFilter({ quantityMax: v })}
        onColumnToggle={toggleColumn}
        onClearAll={() => setSearchParams(new URLSearchParams())}
        onExport={handleExport}
      />

      {/* Bulk action bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        isLoading={confirmIsLoading}
        onBulkDelete={() => setConfirmState({ type: 'bulk-delete' })}
        onBulkSetActive={() => setConfirmState({ type: 'bulk-status', status: 'ACTIVE' })}
        onBulkSetDiscontinued={() => setConfirmState({ type: 'bulk-status', status: 'DISCONTINUED' })}
        onDeselectAll={() => setSelectedIds(new Set())}
      />

      {/* Table */}
      <InventoryTable
        items={items}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message ?? 'Failed to load inventory — check your connection and try again'}
        onRetry={refetch}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSort={handleSort}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
        isEditor={isEditor}
        visibleColumns={visibleColumns}
        onDeleteRequest={() => {}} // individual delete goes through detail page for now
      />

      {/* Pagination */}
      {!isLoading && !isError && (
        <PaginationBar
          total={meta.total}
          page={filters.page}
          pageSize={filters.pageSize}
          onPageChange={p => updateFilter({ page: String(p) }, false)}
          onPageSizeChange={s => updateFilter({ pageSize: String(s) })}
        />
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={!!confirmState}
        title={confirmTitle}
        body={confirmBody}
        confirmLabel={confirmState?.type === 'bulk-delete' ? 'Delete items' : 'Update status'}
        destructive={confirmState?.type === 'bulk-delete'}
        isLoading={confirmIsLoading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
