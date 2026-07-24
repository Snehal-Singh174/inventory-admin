import React from 'react';
import { Trash2, RefreshCw, X } from 'lucide-react';
import Button from '../ui/Button';

export function BulkActionBar({ selectedCount, onBulkDelete, onBulkStatusUpdate, onClearSelection }) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-surface border border-border rounded-lg shadow-elevation-3 animate-slide-up"
      role="toolbar"
      aria-label="Bulk actions"
    >
      <span className="text-sm font-medium text-foreground whitespace-nowrap">
        {selectedCount} selected
      </span>

      <div className="h-5 w-px bg-border" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onBulkStatusUpdate('Active')}
        className="text-success"
      >
        <RefreshCw size={14} className="mr-1.5" />
        Set Active
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onBulkStatusUpdate('Discontinued')}
        className="text-warning"
      >
        <RefreshCw size={14} className="mr-1.5" />
        Set Discontinued
      </Button>

      <div className="h-5 w-px bg-border" />

      <Button
        variant="ghost"
        size="sm"
        onClick={onBulkDelete}
        className="text-error hover:bg-errorBackground"
      >
        <Trash2 size={14} className="mr-1.5" />
        Delete
      </Button>

      <button
        onClick={onClearSelection}
        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors ml-1"
        aria-label="Clear selection"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default BulkActionBar;
