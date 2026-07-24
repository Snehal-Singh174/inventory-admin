import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  /** When true, the confirm button uses destructive (red) styling. */
  destructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  destructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus confirm button on open; close on Escape
  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-onBackground/40 animate-fade-in"
        aria-hidden="true"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative bg-surface rounded-xl shadow-elevation-3 border border-border w-full max-w-md animate-scale-in p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          {destructive && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-errorBackground flex items-center justify-center">
              <AlertTriangle size={18} className="text-error" aria-hidden="true" />
            </div>
          )}
          <div className="flex-1">
            <h2 id="confirm-dialog-title" className="text-base font-semibold text-onBackground">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close dialog"
            className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center
                       text-muted-foreground hover:bg-muted hover:text-onBackground
                       transition-colors duration-150 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="text-sm text-muted-foreground leading-relaxed">{body}</div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-onBackground bg-muted rounded-lg
                       hover:bg-border transition-colors duration-150 disabled:opacity-50
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                       min-h-[40px]"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-150',
              'disabled:opacity-50 min-h-[40px]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              destructive
                ? 'bg-error text-onPrimary hover:bg-error/90 focus-visible:ring-error'
                : 'bg-primary text-onPrimary hover:bg-primary/90 focus-visible:ring-primary',
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing…
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
