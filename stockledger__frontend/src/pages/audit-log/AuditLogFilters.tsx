/**
 * AuditLogFiltersBar — filter toolbar for the Audit Log screen.
 * All controls fire onChange immediately → parent updates URL params → table re-queries.
 * No submit button; no page reload.
 */

import React from 'react';
import { Search, X, CalendarDays } from 'lucide-react';
import type { AuditLogFilters } from '../../hooks/useAuditLog';

export interface AuditActor {
  id:    string;
  name:  string;
  email: string;
}

interface AuditLogFiltersBarProps {
  filters:          AuditLogFilters;
  actors:           AuditActor[];
  onFiltersChange:  (patch: Partial<AuditLogFilters>) => void;
  onClearAll:       () => void;
}

const ACTION_OPTIONS = [
  { value: '',       label: 'All actions' },
  { value: 'CREATE', label: 'Create'      },
  { value: 'UPDATE', label: 'Update'      },
  { value: 'DELETE', label: 'Delete'      },
];

const ENTITY_OPTIONS = [
  { value: '',               label: 'All entity types'  },
  { value: 'INVENTORY_ITEM', label: 'Inventory Items'   },
  { value: 'CATEGORY',       label: 'Categories'        },
  { value: 'SUPPLIER',       label: 'Suppliers'         },
];

const CHEVRON_STYLE = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat' as const,
  backgroundPosition: 'right 8px center' as const,
  backgroundSize: '14px' as const,
};

const SELECT_CLS =
  'h-9 px-3 pr-8 text-sm rounded-lg border border-border bg-surface text-onBackground ' +
  'focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer ' +
  'transition-colors duration-150';

const DATE_CLS =
  'h-9 pl-8 pr-3 text-sm rounded-lg border border-border bg-surface text-onBackground ' +
  'focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-150';

export function AuditLogFiltersBar({
  filters,
  actors,
  onFiltersChange,
  onClearAll,
}: AuditLogFiltersBarProps) {
  const hasActiveFilters =
    !!filters.dateFrom ||
    !!filters.dateTo   ||
    !!filters.userId   ||
    !!filters.action   ||
    !!filters.entityType ||
    !!filters.search;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* ── Entity name search ────────────────────────────────────── */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search by entity name…"
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value, page: 1 })}
          aria-label="Search audit log by entity name"
          className="h-9 w-full pl-9 pr-3 text-sm rounded-lg border border-border bg-surface
                     text-onBackground placeholder:text-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                     transition-colors duration-150"
        />
      </div>

      {/* ── Date from ─────────────────────────────────────────────── */}
      <div className="relative">
        <CalendarDays
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="date"
          value={filters.dateFrom}
          max={filters.dateTo || undefined}
          onChange={(e) => onFiltersChange({ dateFrom: e.target.value, page: 1 })}
          aria-label="Filter from date"
          className={DATE_CLS}
        />
      </div>

      {/* ── Date to ───────────────────────────────────────────────── */}
      <div className="relative">
        <CalendarDays
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="date"
          value={filters.dateTo}
          min={filters.dateFrom || undefined}
          onChange={(e) => onFiltersChange({ dateTo: e.target.value, page: 1 })}
          aria-label="Filter to date"
          className={DATE_CLS}
        />
      </div>

      {/* ── User filter ───────────────────────────────────────────── */}
      <select
        value={filters.userId}
        onChange={(e) => onFiltersChange({ userId: e.target.value, page: 1 })}
        aria-label="Filter by user"
        className={SELECT_CLS}
        style={CHEVRON_STYLE}
      >
        <option value="">All users</option>
        {actors.map((actor) => (
          <option key={`actor-opt-${actor.id}`} value={actor.id}>
            {actor.name}
          </option>
        ))}
      </select>

      {/* ── Action type ───────────────────────────────────────────── */}
      <select
        value={filters.action}
        onChange={(e) => onFiltersChange({ action: e.target.value, page: 1 })}
        aria-label="Filter by action type"
        className={SELECT_CLS}
        style={CHEVRON_STYLE}
      >
        {ACTION_OPTIONS.map((o) => (
          <option key={`action-opt-${o.value || 'all'}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* ── Entity type ───────────────────────────────────────────── */}
      <select
        value={filters.entityType}
        onChange={(e) => onFiltersChange({ entityType: e.target.value, page: 1 })}
        aria-label="Filter by entity type"
        className={SELECT_CLS}
        style={CHEVRON_STYLE}
      >
        {ENTITY_OPTIONS.map((o) => (
          <option key={`entity-opt-${o.value || 'all'}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* ── Clear all ─────────────────────────────────────────────── */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          className="h-9 px-3 text-sm font-medium text-muted-foreground hover:text-onBackground
                     flex items-center gap-1.5 rounded-lg hover:bg-muted transition-colors
                     duration-150 focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-primary"
        >
          <X size={14} aria-hidden="true" />
          Clear all
        </button>
      )}
    </div>
  );
}
