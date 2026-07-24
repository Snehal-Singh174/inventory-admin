import React from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DeleteConfirmDialogProps {
  /** Entity display name shown in the dialog copy. */
  name: string;
  /** Lowercase singular entity label, e.g. "category" or "supplier". */
  entity: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Modal confirmation dialog for destructive deletes.
 * Shared by CategoryTab and SupplierTab.
 * Closes on Escape (unless deletion is in-flight).
 */
export function DeleteConfirmDialog({
  name,
  entity,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel, isDeleting]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="del-confirm-title"
      aria-describedby="del-confirm-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-onBackground/40 animate-fade-in"
    >
      <div className="bg-surface rounded-xl shadow-elevation-3 w-full max-w-sm animate-scale-in p-6 flex flex-col gap-5">
        {/* Icon + copy */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-errorBackground flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-error" aria-hidden="true" />
          </div>
          <div>
            <h2 id="del-confirm-title" className="text-base font-semibold text-onBackground">
              Delete {entity}?
            </h2>
            <p id="del-confirm-desc" className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-onBackground">{name}</span> will be
              permanently removed. This cannot be undone.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground min-h-[40px]',
              'hover:text-onBackground hover:bg-muted transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg min-h-[40px]',
              'bg-error text-onPrimary text-sm font-medium min-w-[90px]',
              'hover:bg-error/90 active:scale-95 transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            )}
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Deleting…
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
