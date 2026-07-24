import React from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';

const ENTITY_TYPES = [
  { value: '', label: 'All Entities' },
  { value: 'InventoryItem', label: 'Inventory Item' },
  { value: 'User', label: 'User' },
];

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'bulk_delete', label: 'Bulk Delete' },
  { value: 'bulk_status_update', label: 'Bulk Status Update' },
];

export function AuditFilters({ filters, onFilterChange, hasActiveFilters, onClear }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={filters.entityType}
        onChange={(e) => onFilterChange({ entityType: e.target.value })}
        className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:ring-2 focus:ring-ring min-w-[140px]"
        aria-label="Filter by entity type"
      >
        {ENTITY_TYPES.map((opt) => (
          <option key={`ent-${opt.value}`} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select
        value={filters.action}
        onChange={(e) => onFilterChange({ action: e.target.value })}
        className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:ring-2 focus:ring-ring min-w-[140px]"
        aria-label="Filter by action"
      >
        {ACTION_TYPES.map((opt) => (
          <option key={`act-${opt.value}`} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <input
        type="date"
        value={filters.dateFrom}
        onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
        className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:ring-2 focus:ring-ring"
        aria-label="Start date"
        placeholder="From"
      />

      <input
        type="date"
        value={filters.dateTo}
        onChange={(e) => onFilterChange({ dateTo: e.target.value })}
        className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:ring-2 focus:ring-ring"
        aria-label="End date"
        placeholder="To"
      />

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
          <X size={14} className="mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
