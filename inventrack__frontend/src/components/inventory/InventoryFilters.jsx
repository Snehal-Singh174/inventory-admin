/* SCREEN PLAN: Inventory Filters
 * Sections: keyword search (debounced 300ms), category multi-select, status dropdown, quantity range, clear filters, column visibility
 * States: default / active (badge counts) / invalid range
 * Copy: "Search by name or SKU…", "All Statuses", "Clear filters"
 * Slop risks: no debounce, filter requires submit button, no clear button, generic labels
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, SlidersHorizontal, Columns3 } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Discontinued', label: 'Discontinued' },
];

const ALL_COLUMNS = [
  { key: 'itemName', label: 'Item Name', required: true },
  { key: 'sku', label: 'SKU' },
  { key: 'category', label: 'Category' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'unitCost', label: 'Unit Cost' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'status', label: 'Status' },
  { key: 'updatedAt', label: 'Last Updated' },
];

export function InventoryFilters({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  categories = [],
  visibleColumns,
  onVisibleColumnsChange,
}) {
  const [localKeyword, setLocalKeyword] = useState(filters.keyword || '');
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const debounceRef = useRef(null);
  const colMenuRef = useRef(null);
  const catMenuRef = useRef(null);

  useEffect(() => {
    setLocalKeyword(filters.keyword || '');
  }, [filters.keyword]);

  const handleKeywordChange = useCallback((e) => {
    const value = e.target.value;
    setLocalKeyword(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFilterChange('keyword', value);
    }, 300);
  }, [onFilterChange]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target)) {
        setColMenuOpen(false);
      }
      if (catMenuRef.current && !catMenuRef.current.contains(e.target)) {
        setCatMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCategories = filters.categoryId ? filters.categoryId.split(',').filter(Boolean) : [];

  const handleCategoryToggle = (catId) => {
    const current = selectedCategories.includes(catId)
      ? selectedCategories.filter((c) => c !== catId)
      : [...selectedCategories, catId];
    onFilterChange('categoryId', current.join(','));
  };

  const handleColumnToggle = (colKey) => {
    const col = ALL_COLUMNS.find((c) => c.key === colKey);
    if (col?.required) return;
    const newCols = visibleColumns.includes(colKey)
      ? visibleColumns.filter((c) => c !== colKey)
      : [...visibleColumns, colKey];
    onVisibleColumnsChange(newCols);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Keyword search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={localKeyword}
          onChange={handleKeywordChange}
          placeholder="Search by name or SKU…"
          className="w-full h-9 pl-9 pr-8 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
          aria-label="Search inventory items"
        />
        {localKeyword && (
          <button
            onClick={() => { setLocalKeyword(''); onFilterChange('keyword', ''); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent text-muted-foreground"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category multi-select */}
      <div className="relative" ref={catMenuRef}>
        <button
          onClick={() => setCatMenuOpen(!catMenuOpen)}
          className={cn(
            'flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm font-medium transition-all',
            selectedCategories.length > 0
              ? 'border-primary text-primary bg-primary/5'
              : 'border-input text-foreground hover:bg-accent'
          )}
          aria-expanded={catMenuOpen}
          aria-label="Filter by category"
        >
          <SlidersHorizontal size={14} />
          <span>Category</span>
          {selectedCategories.length > 0 && (
            <span className="ml-1 flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {selectedCategories.length}
            </span>
          )}
        </button>
        {catMenuOpen && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-surface border border-border rounded-lg shadow-elevation-2 z-50 py-1 animate-scale-in max-h-60 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">No categories available</p>
            ) : (
              categories.map((cat) => (
                <label
                  key={`cat-filter-${cat.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => handleCategoryToggle(cat.id)}
                    className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                  />
                  <span className="text-foreground">{cat.name}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* Status dropdown */}
      <select
        value={filters.status || ''}
        onChange={(e) => onFilterChange('status', e.target.value)}
        className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={`status-opt-${opt.value}`} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Quantity range */}
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          value={filters.minQuantity || ''}
          onChange={(e) => onFilterChange('minQuantity', e.target.value)}
          placeholder="Min qty"
          className="w-20 h-9 px-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Minimum quantity"
        />
        <span className="text-muted-foreground text-xs">–</span>
        <input
          type="number"
          min="0"
          value={filters.maxQuantity || ''}
          onChange={(e) => onFilterChange('maxQuantity', e.target.value)}
          placeholder="Max qty"
          className="w-20 h-9 px-2 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Maximum quantity"
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
          <X size={14} className="mr-1" />
          Clear filters
        </Button>
      )}

      {/* Column visibility toggle */}
      <div className="relative ml-auto" ref={colMenuRef}>
        <button
          onClick={() => setColMenuOpen(!colMenuOpen)}
          className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-input text-sm text-foreground hover:bg-accent transition-colors"
          aria-label="Toggle column visibility"
          aria-expanded={colMenuOpen}
        >
          <Columns3 size={14} />
          <span className="hidden sm:inline">Columns</span>
        </button>
        {colMenuOpen && (
          <div className="absolute top-full right-0 mt-1 w-48 bg-surface border border-border rounded-lg shadow-elevation-2 z-50 py-1 animate-scale-in">
            {ALL_COLUMNS.map((col) => (
              <label
                key={`col-vis-${col.key}`}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors',
                  col.required && 'opacity-50 cursor-not-allowed'
                )}
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.key)}
                  onChange={() => handleColumnToggle(col.key)}
                  disabled={col.required}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <span className="text-foreground">{col.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { ALL_COLUMNS };
export default InventoryFilters;
