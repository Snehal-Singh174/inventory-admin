import React from 'react';
import { Trash2, CheckCircle2, XCircle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface BulkActionBarProps {
  selectedCount: number;
  isLoading: boolean;
  onBulkDelete: () => void;
  onBulkSetActive: () => void;
  onBulkSetDiscontinued: () => void;
  onDeselectAll: () => void;
}

export function BulkActionBar({
  selectedCount,
  isLoading,
  onBulkDelete,
  onBulkSetActive,
  onBulkSetDiscontinued,
  onDeselectAll,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label={`${selectedCount} items selected — bulk actions`}
      className="animate-scale-in rounded-xl border border-primary/30 bg-infoBackground px-4 py-3
                 flex flex-wrap items-center gap-3"
    >
      {/* Count */}
      <span className="text-sm font-semibold text-info tabular-nums">
        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
      </span>

      <span aria-hidden="true" className="hidden sm:block w-px h-5 bg-border" />

      {/* Bulk set active */}
      <button
        type="button"
        onClick={onBulkSetActive}
        disabled={isLoading}
        aria-label="Set selected items to Active"
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150',
          'bg-successBackground text-success border border-success/20',
          'hover:bg-success hover:text-onSecondary disabled:opacity-50 min-h-[36px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success',
        )}
      >
        <CheckCircle2 size={14} />
        Set Active
      </button>

      {/* Bulk set discontinued */}
      <button
        type="button"
        onClick={onBulkSetDiscontinued}
        disabled={isLoading}
        aria-label="Set selected items to Discontinued"
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150',
          'bg-muted text-muted-foreground border border-border',
          'hover:bg-border hover:text-onBackground disabled:opacity-50 min-h-[36px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        )}
      >
        <XCircle size={14} />
        Set Discontinued
      </button>

      {/* Bulk delete */}
      <button
        type="button"
        onClick={onBulkDelete}
        disabled={isLoading}
        aria-label="Delete selected items"
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150',
          'bg-errorBackground text-error border border-error/20',
          'hover:bg-error hover:text-onPrimary disabled:opacity-50 min-h-[36px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error',
        )}
      >
        <Trash2 size={14} />
        Delete
      </button>

      {/* Deselect all */}
      <button
        type="button"
        onClick={onDeselectAll}
        aria-label="Deselect all items"
        className="ml-auto flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm
                   text-muted-foreground hover:text-onBackground hover:bg-muted
                   transition-colors duration-150 focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-primary min-h-[36px]"
      >
        <X size={14} />
        <span className="hidden sm:inline">Deselect all</span>
      </button>
    </div>
  );
}
