import React, { useRef, useEffect, useState } from 'react';
import { Search, X, Download, Columns3, Check } from 'lucide-react';
import { useCategories } from '../../hooks/useInventoryData';
import type { ItemFilters, ColumnKey, ALL_COLUMNS } from '../../types/inventory';
import { ALL_COLUMNS as COLUMNS } from '../../types/inventory';
import { cn } from '../../utils/cn';

interface InventoryFiltersProps {
  filters: ItemFilters;
  visibleColumns: Set<ColumnKey>;
  isExporting: boolean;
  onKeywordChange: (v: string) => void;
  onCategoryChange: (ids: string[]) => void;
  onStatusChange: (v: string) => void;
  onQtyMinChange: (v: string) => void;
  onQtyMaxChange: (v: string) => void;
  onColumnToggle: (col: ColumnKey) => void;
  onClearAll: () => void;
  onExport: () => void;
}

const STATUS_OPTIONS = [
  { value: '',             label: 'All statuses' },
  { value: 'ACTIVE',       label: 'Active'       },
  { value: 'DISCONTINUED', label: 'Discontinued' },
];

// ── Category multi-select dropdown ────────────────────────────────────────────

function CategorySelect({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: categories = [] } = useCategories();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  };

  const label = selectedIds.length === 0
    ? 'Category'
    : selectedIds.length === 1
    ? (categories.find(c => c.id === selectedIds[0])?.name ?? '1 selected')
    : `${selectedIds.length} categories`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'h-9 px-3 text-sm rounded-lg border flex items-center gap-2 transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          selectedIds.length > 0
            ? 'border-primary text-primary bg-primary/5'
            : 'border-border text-muted-foreground bg-surface hover:border-primary/50',
        )}
      >
        {label}
        {selectedIds.length > 0 ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear category filter"
            onClick={(e) => { e.stopPropagation(); onChange([]); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onChange([]); } }}
            className="ml-1 text-primary/70 hover:text-primary"
          >
            <X size={12} />
          </span>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Categories"
          aria-multiselectable="true"
          className="absolute z-30 top-full mt-1 left-0 min-w-[180px] bg-surface border border-border
                     rounded-lg shadow-elevation-2 py-1 max-h-60 overflow-y-auto"
        >
          {categories.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No categories found</p>
          ) : (
            categories.map(cat => (
              <button
                key={`cat-opt-${cat.id}`}
                role="option"
                aria-selected={selectedIds.includes(cat.id)}
                onClick={() => toggle(cat.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors duration-100',
                  'hover:bg-muted focus-visible:outline-none focus-visible:bg-muted',
                  selectedIds.includes(cat.id) && 'text-primary',
                )}
              >
                <span className={cn('w-4 h-4 rounded border border-border flex-shrink-0 flex items-center justify-center',
                  selectedIds.includes(cat.id) && 'bg-primary border-primary')}>
                  {selectedIds.includes(cat.id) && <Check size={10} className="text-onPrimary" />}
                </span>
                <span className="truncate">{cat.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Columns toggle ────────────────────────────────────────────────────────────

function ColumnsToggle({
  visibleColumns,
  onToggle,
}: {
  visibleColumns: Set<ColumnKey>;
  onToggle: (col: ColumnKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle column visibility"
        className="h-9 px-3 text-sm rounded-lg border border-border text-muted-foreground
                   bg-surface hover:border-primary/50 flex items-center gap-2
                   transition-colors duration-150 focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Columns3 size={15} />
        <span className="hidden sm:inline">Columns</span>
      </button>

      {open && (
        <div className="absolute z-30 top-full mt-1 right-0 min-w-[160px] bg-surface border border-border
                        rounded-lg shadow-elevation-2 py-1">
          {COLUMNS.map(col => (
            <button
              key={`col-toggle-${col.key}`}
              type="button"
              onClick={() => onToggle(col.key)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                         hover:bg-muted transition-colors duration-100"
            >
              <span className={cn('w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center',
                visibleColumns.has(col.key)
                  ? 'bg-primary border-primary'
                  : 'border-border')}>
                {visibleColumns.has(col.key) && <Check size={10} className="text-onPrimary" />}
              </span>
              {col.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main filters bar ──────────────────────────────────────────────────────────

export function InventoryFilters({
  filters,
  visibleColumns,
  isExporting,
  onKeywordChange,
  onCategoryChange,
  onStatusChange,
  onQtyMinChange,
  onQtyMaxChange,
  onColumnToggle,
  onClearAll,
  onExport,
}: InventoryFiltersProps) {
  const hasActiveFilters =
    !!filters.keyword ||
    filters.categoryIds.length > 0 ||
    !!filters.status ||
    !!filters.quantityMin ||
    !!filters.quantityMax;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Keyword search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search by name or SKU…"
          value={filters.keyword}
          onChange={e => onKeywordChange(e.target.value)}
          className="h-9 w-full pl-9 pr-3 text-sm rounded-lg border border-border bg-surface
                     text-onBackground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                     transition-colors duration-150"
          aria-label="Search inventory by name or SKU"
        />
      </div>

      {/* Category multi-select */}
      <CategorySelect selectedIds={filters.categoryIds} onChange={onCategoryChange} />

      {/* Status select */}
      <select
        value={filters.status}
        onChange={e => onStatusChange(e.target.value)}
        aria-label="Filter by status"
        className="h-9 px-3 text-sm rounded-lg border border-border bg-surface text-onBackground
                   focus:outline-none focus:ring-2 focus:ring-primary appearance-none
                   cursor-pointer transition-colors duration-150 pr-7"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '14px' }}
      >
        {STATUS_OPTIONS.map(o => (
          <option key={`status-opt-${o.value}`} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Quantity range */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          placeholder="Qty min"
          value={filters.quantityMin}
          onChange={e => onQtyMinChange(e.target.value)}
          aria-label="Minimum quantity filter"
          className="h-9 w-20 px-2 text-sm rounded-lg border border-border bg-surface text-onBackground
                     placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary
                     transition-colors duration-150 tabular-nums"
        />
        <span className="text-muted-foreground text-xs">—</span>
        <input
          type="number"
          min={0}
          placeholder="max"
          value={filters.quantityMax}
          onChange={e => onQtyMaxChange(e.target.value)}
          aria-label="Maximum quantity filter"
          className="h-9 w-20 px-2 text-sm rounded-lg border border-border bg-surface text-onBackground
                     placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary
                     transition-colors duration-150 tabular-nums"
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          className="h-9 px-3 text-sm font-medium text-muted-foreground hover:text-onBackground
                     flex items-center gap-1.5 rounded-lg hover:bg-muted transition-colors duration-150
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X size={14} />
          Clear
        </button>
      )}

      {/* Column visibility toggle */}
      <ColumnsToggle visibleColumns={visibleColumns} onToggle={onColumnToggle} />

      {/* Export button */}
      <button
        type="button"
        onClick={onExport}
        disabled={isExporting}
        aria-label="Export inventory to Excel"
        className="h-9 px-4 text-sm font-semibold bg-primary text-onPrimary rounded-lg
                   hover:bg-primary/90 active:scale-95 transition-all duration-150
                   disabled:opacity-60 disabled:pointer-events-none flex items-center gap-2
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                   focus-visible:ring-offset-2"
      >
        {isExporting ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <Download size={15} />
        )}
        Export
      </button>
    </div>
  );
}
