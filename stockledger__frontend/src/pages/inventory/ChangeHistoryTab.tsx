import React from 'react';
import { format } from 'date-fns';
import { Clock, UserCircle, ShieldOff, AlertCircle } from 'lucide-react';
import { useItemAuditLog } from '../../hooks/useInventoryData';
import type { AuditLogEntry } from '../../types/inventory';
import { cn } from '../../utils/cn';

interface ChangeHistoryTabProps {
  itemId: string;
  isEditor: boolean;
}

// ── Action badge ──────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: AuditLogEntry['action'] }) {
  const config = {
    CREATE: { label: 'Created', cls: 'bg-successBackground text-success' },
    UPDATE: { label: 'Updated', cls: 'bg-infoBackground text-info' },
    DELETE: { label: 'Deleted', cls: 'bg-errorBackground text-error' },
  } as const;
  const { label, cls } = config[action];
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold', cls)}>
      {label}
    </span>
  );
}

// ── Changed fields display ────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  item_name: 'Item Name',
  sku: 'SKU',
  category_id: 'Category',
  quantity: 'Quantity',
  unit_cost: 'Unit Cost',
  supplier_id: 'Supplier',
  status: 'Status',
};

function ChangedFields({ fields, before, after }: {
  fields: string[];
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  if (!fields.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {fields.map(f => {
        const label = FIELD_LABELS[f] ?? f;
        const beforeVal = before?.[f] != null ? String(before[f]) : '—';
        const afterVal  = after?.[f]  != null ? String(after[f])  : '—';
        return (
          <div key={`cf-${f}`} className="flex items-center gap-1 text-xs bg-muted rounded px-2 py-1">
            <span className="font-medium text-onBackground">{label}:</span>
            <span className="line-through text-muted-foreground">{beforeVal}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium text-onBackground">{afterVal}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={`hist-skel-${i}`} className="flex gap-4">
          <div className="skeleton w-8 h-8 rounded-full flex-shrink-0 mt-0.5" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex gap-3">
              <div className="skeleton h-5 w-16 rounded" />
              <div className="skeleton h-4 w-28 rounded" />
              <div className="skeleton h-4 w-20 rounded ml-auto" />
            </div>
            <div className="skeleton h-3 w-48 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ChangeHistoryTab({ itemId, isEditor }: ChangeHistoryTabProps) {
  const { data, isLoading, isError, error } = useItemAuditLog(itemId, isEditor);

  if (!isEditor) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-4">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
          <ShieldOff size={22} className="text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Change history is visible to Editors only.
        </p>
      </div>
    );
  }

  if (isLoading) return <HistorySkeleton />;

  if (isError) {
    return (
      <div role="alert" className="flex items-center gap-3 p-4 rounded-lg bg-errorBackground border border-error/20">
        <AlertCircle size={18} className="text-error flex-shrink-0" />
        <p className="text-sm text-error">
          {error?.message ?? 'Failed to load change history — try refreshing'}
        </p>
      </div>
    );
  }

  const entries = data?.data ?? [];

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3">
        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
          <Clock size={22} className="text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-onBackground">No changes recorded yet</p>
        <p className="text-xs text-muted-foreground">
          Edits, status changes, and deletions will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1" role="list" aria-label="Change history">
      {entries.map((entry, i) => {
        const actor = entry.actor?.name ?? 'Unknown';
        const timestamp = (() => {
          try {
            return format(new Date(entry.created_at), 'MMM d, yyyy HH:mm');
          } catch {
            return entry.created_at;
          }
        })();
        const isLast = i === entries.length - 1;

        return (
          <div
            key={`hist-entry-${entry.id}`}
            role="listitem"
            className="flex gap-4 group"
          >
            {/* Timeline spine */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-background',
                  entry.action === 'CREATE' && 'bg-successBackground ring-success/20',
                  entry.action === 'UPDATE' && 'bg-infoBackground ring-info/20',
                  entry.action === 'DELETE' && 'bg-errorBackground ring-error/20',
                )}
              >
                <UserCircle
                  size={16}
                  className={cn(
                    entry.action === 'CREATE' && 'text-success',
                    entry.action === 'UPDATE' && 'text-info',
                    entry.action === 'DELETE' && 'text-error',
                  )}
                  aria-hidden="true"
                />
              </div>
              {!isLast && <div className="w-px flex-1 bg-border mt-1" aria-hidden="true" />}
            </div>

            {/* Content */}
            <div className={cn('flex-1 pb-5', isLast && 'pb-2')}>
              <div className="flex flex-wrap items-center gap-2">
                <ActionBadge action={entry.action} />
                <span className="text-sm font-medium text-onBackground">{actor}</span>
                <span className="text-xs text-muted-foreground ml-auto">{timestamp}</span>
              </div>
              {entry.action === 'UPDATE' && entry.changed_fields && (
                <ChangedFields
                  fields={entry.changed_fields}
                  before={entry.before_values}
                  after={entry.after_values}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
