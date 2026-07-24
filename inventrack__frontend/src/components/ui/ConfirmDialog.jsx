import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  loading = false,
}) {
  if (!open) return null;

  const iconColorMap = {
    destructive: 'text-error bg-errorBackground',
    warning: 'text-warning bg-warningBackground',
    default: 'text-info bg-infoBackground',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md bg-surface rounded-lg shadow-elevation-4 animate-scale-in"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={cn('p-2 rounded-full flex-shrink-0', iconColorMap[variant])}>
              <AlertTriangle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 id="confirm-dialog-title" className="text-base font-semibold text-foreground">
                {title}
              </h3>
              <p id="confirm-dialog-desc" className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 rounded-md hover:bg-accent text-muted-foreground transition-colors flex-shrink-0"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
