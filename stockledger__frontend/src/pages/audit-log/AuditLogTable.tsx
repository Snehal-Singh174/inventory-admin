/* SCREEN PLAN: AuditLogTable
 * Columns (7): expand-toggle | Timestamp | User | Entity | Action | Fields Changed | Summary
 * States: loading (8 skeleton rows × 7 cols) | error (specific msg + retry) |
 *         empty (entity-specific msg + hint) | success (rows + pagination)
 * Expandable rows: ChevronRight/Down toggle → colspan=7 details pane with FieldDiffViewer
 * Action badges: CREATE=green, UPDATE=blue, DELETE=red — semantic tints, not text only
 * Entity link: INVENTORY_ITEM + non-DELETE → Link to /inventory/:id
 *              INVENTORY_ITEM + DELETE     → plain text + "(deleted)" badge
 *              CATEGORY / SUPPLIER         → plain text (no detail page)
 * Slop risks: icon-only expand with no aria-label; raw hex badge colors;
 *             text-link entity names; no pagination total count
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  AlertCircle,
  ScrollText,
  RefreshCw,
} from 'lucide-react';
import type { AuditLogEntry } from '../../types/inventory';
import { FieldDiffViewer } from './FieldDiffViewer';
import { PaginationBar } from './AuditLogPagination';
import { cn } from '../../utils/cn';

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTION_CONFIG = {
  CREATE: { label: 'Create', cls: 'bg-successBackground text-success' },
  UPDATE: { label: 'Update', cls: 'bg-infoBackground text-info'       },
  DELETE: { label: 'Delete', cls: 'bg-errorBackground text-error'     },
} as const;

const ENTITY_LABELS: Record<AuditLogEntry['entity_type'], string> = {
  INVENTORY_ITEM: 'Item',
  CATEGORY:       'Category',
  SUPPLIER:       'Supplier',
};

const ENTITY_TYPE_CLS: Record<AuditLogEntry['entity_type'], string> = {
  INVENTORY_ITEM: 'bg-primary/10 text-primary',
  CATEGORY:       'bg-warningBackground text-warning',
  SUPPLIER:       'bg-muted text-muted-foreground',
};

const COL_SPAN = 7;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTs(iso: string): { date: string; time: string } {
  const d   = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function buildSummary(entry: AuditLogEntry): string {
  if (entry.action !== 'UPDATE') return '—';
  const fields = entry.changed_fields;
  if (!fields || fields.length === 0) return '—';
  const first = fields[0];
  const before = entry.before_values?.[first];
  const after  = entry.after_values?.[first];
  const label  = first.replace(/_/g, ' ');
  let summary = `${label}: ${before ?? '—'} → ${after ?? '—'}`;
  if (fields.length > 1) summary += ` +${fields.length - 1} more`;
  return summary;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: AuditLogEntry['action'] }) {
  const cfg = ACTION_CONFIG[action];
  return (
    <span className={cn('badge font-semibold tracking-wide', cfg.cls)}>
      {cfg.label}
    </span>
  );
}

function EntityCell({ entry }: { entry: AuditLogEntry }) {
  const typeLabel = ENTITY_LABELS[entry.entity_type];
  const typeCls   = ENTITY_TYPE_CLS[entry.entity_type];
  const isDeleted = entry.action === 'DELETE';
  const isItem    = entry.entity_type === 'INVENTORY_ITEM';

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className={cn('badge text-[10px] self-start font-semibold', typeCls)}>
        {typeLabel}
      </span>
      <div className="flex items-center gap-1.5 min-w-0">
        {isItem && !isDeleted ? (
          <Link
            to={`/inventory/${entry.entity_id}`}
            className="text-sm font-medium text-primary hover:underline underline-offset-2
                       truncate max-w-[180px] focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-primary rounded"
          >
            {entry.entity_label}
          </Link>
        ) : (
          <span className="text-sm font-medium text-onSurface truncate max-w-[180px]">
            {entry.entity_label}
          </span>
        )}
        {isDeleted && (
          <span className="flex-shrink-0 text-[10px] font-medium text-muted-foreground
                           bg-muted border border-border rounded px-1.5 py-0.5">
            deleted
          </span>
        )}
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <tbody aria-live="polite" aria-busy="true" aria-label="Loading audit log entries">
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={`skel-row-${i}`} className="border-b border-border">
          <td className="py-3 pl-4 pr-2 w-8">
            <div className="skeleton h-5 w-5 rounded" />
          </td>
          <td className="py-3 px-4">
            <div className="skeleton h-4 w-24 rounded mb-1" />
            <div className="skeleton h-3 w-14 rounded" />
          </td>
          <td className="py-3 px-4">
            <div className="skeleton h-4 w-28 rounded mb-1" />
            <div className="skeleton h-3 w-20 rounded" />
          </td>
          <td className="py-3 px-4">
            <div className="skeleton h-4 w-16 rounded mb-1" />
            <div className="skeleton h-4 w-24 rounded" />
          </td>
          <td className="py-3 px-4">
            <div className="skeleton h-5 w-14 rounded-full" />
          </td>
          <td className="py-3 px-4">
            <div className="skeleton h-4 w-32 rounded" />
          </td>
          <td className="py-3 px-4">
            <div className="skeleton h-4 w-40 rounded" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

// ── Row with expandable diff ──────────────────────────────────────────────────

function AuditRow({
  entry,
  expanded,
  onToggle,
}: {
  entry:    AuditLogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const ts      = formatTs(entry.created_at);
  const summary = buildSummary(entry);
  const fields  = entry.changed_fields ?? [];

  return (
    <>
      <tr
        className={cn(
          'border-b border-border transition-colors duration-100',
          'hover:bg-muted/50 group',
          expanded && 'bg-muted/30',
        )}
      >
        {/* Expand toggle */}
        <td className="py-3 pl-4 pr-2 w-8">
          <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? 'Collapse row details' : 'Expand row details'}
            aria-expanded={expanded}
            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground
                       hover:text-onBackground hover:bg-muted transition-colors duration-100
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {expanded
              ? <ChevronDown size={14} strokeWidth={2.5} />
              : <ChevronRight size={14} strokeWidth={2.5} />
            }
          </button>
        </td>

        {/* Timestamp */}
        <td className="py-3 px-4 min-w-[110px]">
          <p className="text-sm font-medium text-onSurface tabular-nums">{ts.date}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{ts.time}</p>
        </td>

        {/* User */}
        <td className="py-3 px-4 min-w-[140px]">
          {entry.actor ? (
            <>
              <p className="text-sm font-medium text-onSurface truncate max-w-[160px]">
                {entry.actor.name}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                {entry.actor.email}
              </p>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Unknown</span>
          )}
        </td>

        {/* Entity */}
        <td className="py-3 px-4 min-w-[180px]">
          <EntityCell entry={entry} />
        </td>

        {/* Action */}
        <td className="py-3 px-4">
          <ActionBadge action={entry.action} />
        </td>

        {/* Fields changed */}
        <td className="py-3 px-4 min-w-[140px]">
          {fields.length > 0 ? (
            <span className="text-xs text-onSurface/80 leading-relaxed">
              {fields.slice(0, 3).map((f) => f.replace(/_/g, ' ')).join(', ')}
              {fields.length > 3 && (
                <span className="text-muted-foreground"> +{fields.length - 3}</span>
              )}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>

        {/* Before/After summary */}
        <td className="py-3 px-4 min-w-[180px]">
          <span className="text-xs text-onSurface/70 font-mono">{summary}</span>
        </td>
      </tr>

      {/* Expanded diff pane */}
      {expanded && (
        <tr className="bg-muted/20 border-b border-border">
          <td colSpan={COL_SPAN} className="px-8 py-4">
            <FieldDiffViewer entry={entry} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main table component ──────────────────────────────────────────────────────

interface AuditLogTableProps {
  entries:         AuditLogEntry[];
  isLoading:       boolean;
  isError:         boolean;
  errorMessage:    string;
  onRetry:         () => void;
  total:           number;
  page:            number;
  pageSize:        number;
  onPageChange:    (p: number) => void;
  onPageSizeChange:(s: number) => void;
  hasActiveFilters: boolean;
}

export function AuditLogTable({
  entries,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  hasActiveFilters,
}: AuditLogTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else              next.add(id);
      return next;
    });
  };

  return (
    <div className="card overflow-hidden">
      {/* Error state */}
      {isError && !isLoading && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 bg-errorBackground border-b border-error/20"
        >
          <AlertCircle size={18} className="text-error flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-error">Failed to load audit log</p>
            <p className="text-xs text-error/80 mt-0.5">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg
                       bg-error text-onPrimary hover:bg-error/90 active:scale-95 transition-all
                       duration-150 flex-shrink-0 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-primary"
          >
            <RefreshCw size={12} aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {/* expand */}
              <th scope="col" className="py-3 pl-4 pr-2 w-8" aria-label="Expand row" />
              <th scope="col" className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Timestamp
              </th>
              <th scope="col" className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                User
              </th>
              <th scope="col" className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Entity
              </th>
              <th scope="col" className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Action
              </th>
              <th scope="col" className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Fields Changed
              </th>
              <th scope="col" className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Before / After
              </th>
            </tr>
          </thead>

          {/* Loading state */}
          {isLoading && <TableSkeleton />}

          {/* Success state */}
          {!isLoading && !isError && entries.length > 0 && (
            <tbody>
              {entries.map((entry) => (
                <AuditRow
                  key={`audit-row-${entry.id}`}
                  entry={entry}
                  expanded={expandedIds.has(entry.id)}
                  onToggle={() => toggleRow(entry.id)}
                />
              ))}
            </tbody>
          )}

          {/* Empty state */}
          {!isLoading && !isError && entries.length === 0 && (
            <tbody>
              <tr>
                <td colSpan={COL_SPAN} className="py-16 px-4 text-center">
                  <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                    <div
                      className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <ScrollText size={22} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold text-onBackground">
                      {hasActiveFilters
                        ? 'No entries match your filters'
                        : 'No audit entries recorded yet'}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {hasActiveFilters
                        ? 'Try adjusting the date range, user, action type, or entity type filters.'
                        : 'Audit entries are created automatically when inventory items, categories, or suppliers are added, updated, or removed.'}
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && !isError && total > 0 && (
        <div className="border-t border-border px-2">
          <PaginationBar
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}
