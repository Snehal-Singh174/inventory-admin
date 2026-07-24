/* SCREEN PLAN: Add/Edit Item Modal
 * Sections: header (title + close), form body, footer (cancel + submit)
 * States: loading (edit mode fetch), error (field-level inline), success (toast + close)
 * Copy: "Add Item"/"Edit Item — {name}", "Adding…"/"Saving…", field errors per spec
 * Slop risks: no loading state on submit, no field validation, no unsaved changes warning
 */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { apiClient, ApiError } from '../../utils/api-client';
import Button from '../ui/Button';

export function AddEditItemModal({
  open,
  onClose,
  mode = 'create', // 'create' | 'edit'
  itemId,
  categories = [],
  suppliers = [],
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setError,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      itemName: '',
      sku: '',
      categoryId: '',
      quantity: 0,
      unitCost: 0,
      supplierId: '',
      status: 'Active',
      reorderPoint: 10,
    },
  });

  // Fetch item data for edit mode
  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && itemId) {
      setLoading(true);
      setFetchError(null);
      apiClient.get(`/api/v1/inventory/${itemId}`)
        .then((response) => {
          const item = response.data;
          reset({
            itemName: item.itemName || '',
            sku: item.sku || '',
            categoryId: item.categoryId || '',
            quantity: item.quantity ?? 0,
            unitCost: item.unitCost ?? 0,
            supplierId: item.supplierId || '',
            status: item.status || 'Active',
            reorderPoint: item.reorderPoint ?? 10,
          });
          if (item.reorderPoint != null) setMoreOptionsOpen(true);
          setLoading(false);
        })
        .catch((err) => {
          setFetchError(err instanceof ApiError ? err.message : 'This item no longer exists.');
          setLoading(false);
        });
    } else {
      reset({
        itemName: '',
        sku: '',
        categoryId: '',
        quantity: 0,
        unitCost: 0,
        supplierId: '',
        status: 'Active',
        reorderPoint: 10,
      });
      setMoreOptionsOpen(false);
      setFetchError(null);
    }
  }, [open, mode, itemId, reset]);

  const handleClose = () => {
    if (isDirty && !submitting) {
      const confirmed = window.confirm('Discard changes?');
      if (!confirmed) return;
    }
    onClose();
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        itemName: data.itemName.trim(),
        sku: data.sku.trim(),
        categoryId: data.categoryId,
        quantity: Number(data.quantity),
        unitCost: Number(data.unitCost),
        supplierId: data.supplierId,
        status: data.status,
      };

      if (moreOptionsOpen && data.reorderPoint !== undefined && data.reorderPoint !== '') {
        payload.reorderPoint = Number(data.reorderPoint);
      }

      if (mode === 'create') {
        await apiClient.post('/api/v1/inventory', payload);
        onSuccess('Item added successfully');
      } else {
        await apiClient.patch(`/api/v1/inventory/${itemId}`, payload);
        onSuccess('Item updated');
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409 && err.message.toLowerCase().includes('sku')) {
          setError('sku', { type: 'server', message: 'This SKU already exists' });
        } else if (err.status === 409) {
          setError('root', { type: 'server', message: 'Item changed since you loaded it. Refresh and try again.' });
        } else {
          setError('root', { type: 'server', message: err.message });
        }
      } else {
        setError('root', { type: 'server', message: 'Failed to save. Check your connection and try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const title = mode === 'create' ? 'Add Item' : `Edit Item — ${watch('itemName') || ''}`;
  const submitLabel = mode === 'create'
    ? (submitting ? 'Adding…' : 'Add Item')
    : (submitting ? 'Saving…' : 'Save Changes');

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface rounded-lg shadow-elevation-4 animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface z-10">
          <h2 id="modal-title" className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={`skel-${i}`} className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : fetchError ? (
          <div className="p-6">
            <div className="p-4 rounded-lg bg-errorBackground text-error text-sm" role="alert">
              {fetchError}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="p-6 space-y-4">
              {errors.root && (
                <div className="p-3 rounded-lg bg-errorBackground text-error text-sm" role="alert">
                  {errors.root.message}
                </div>
              )}

              {/* Item Name */}
              <div className="space-y-1.5">
                <label htmlFor="modal-itemName" className="text-sm font-medium text-foreground">
                  Item Name <span className="text-error">*</span>
                </label>
                <input
                  id="modal-itemName"
                  type="text"
                  placeholder="e.g. Wireless Barcode Scanner"
                  className={cn(
                    'w-full h-10 px-3 rounded-md border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    errors.itemName ? 'border-error' : 'border-input'
                  )}
                  {...register('itemName', {
                    required: 'Item name is required',
                    maxLength: { value: 150, message: 'Maximum 150 characters' },
                  })}
                />
                {errors.itemName && <p className="text-xs text-error">{errors.itemName.message}</p>}
              </div>

              {/* SKU */}
              <div className="space-y-1.5">
                <label htmlFor="modal-sku" className="text-sm font-medium text-foreground">
                  SKU <span className="text-error">*</span>
                </label>
                <input
                  id="modal-sku"
                  type="text"
                  placeholder="e.g. WBS-2200"
                  className={cn(
                    'w-full h-10 px-3 rounded-md border bg-background text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    errors.sku ? 'border-error' : 'border-input'
                  )}
                  {...register('sku', {
                    required: 'SKU is required',
                    maxLength: { value: 50, message: 'Maximum 50 characters' },
                    pattern: { value: /^[a-zA-Z0-9\-]+$/, message: 'Only letters, numbers, and hyphens' },
                  })}
                />
                {errors.sku && <p className="text-xs text-error">{errors.sku.message}</p>}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label htmlFor="modal-category" className="text-sm font-medium text-foreground">
                  Category <span className="text-error">*</span>
                </label>
                <select
                  id="modal-category"
                  className={cn(
                    'w-full h-10 px-3 rounded-md border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    errors.categoryId ? 'border-error' : 'border-input'
                  )}
                  {...register('categoryId', { required: 'Select a category' })}
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={`modal-cat-${c.id}`} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-xs text-error">{errors.categoryId.message}</p>}
              </div>

              {/* Quantity + Unit Cost row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="modal-quantity" className="text-sm font-medium text-foreground">
                    Quantity <span className="text-error">*</span>
                  </label>
                  <input
                    id="modal-quantity"
                    type="number"
                    min="0"
                    className={cn(
                      'w-full h-10 px-3 rounded-md border bg-background text-sm text-foreground font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      errors.quantity ? 'border-error' : 'border-input'
                    )}
                    {...register('quantity', {
                      required: 'Quantity is required',
                      min: { value: 0, message: 'Quantity cannot be negative' },
                      validate: (v) => Number.isInteger(Number(v)) || 'Must be a whole number',
                    })}
                  />
                  {errors.quantity && <p className="text-xs text-error">{errors.quantity.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="modal-unitCost" className="text-sm font-medium text-foreground">
                    Unit Cost <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <input
                      id="modal-unitCost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className={cn(
                        'w-full h-10 pl-7 pr-3 rounded-md border bg-background text-sm text-foreground font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        errors.unitCost ? 'border-error' : 'border-input'
                      )}
                      {...register('unitCost', {
                        required: 'Enter a valid cost (e.g. 19.99)',
                        min: { value: 0, message: 'Cost cannot be negative' },
                      })}
                    />
                  </div>
                  {errors.unitCost && <p className="text-xs text-error">{errors.unitCost.message}</p>}
                </div>
              </div>

              {/* Supplier */}
              <div className="space-y-1.5">
                <label htmlFor="modal-supplier" className="text-sm font-medium text-foreground">
                  Supplier <span className="text-error">*</span>
                </label>
                <select
                  id="modal-supplier"
                  className={cn(
                    'w-full h-10 px-3 rounded-md border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    errors.supplierId ? 'border-error' : 'border-input'
                  )}
                  {...register('supplierId', { required: 'Select a supplier' })}
                >
                  <option value="">Select supplier…</option>
                  {suppliers.map((s) => (
                    <option key={`modal-sup-${s.id}`} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {errors.supplierId && <p className="text-xs text-error">{errors.supplierId.message}</p>}
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label htmlFor="modal-status" className="text-sm font-medium text-foreground">
                  Status <span className="text-error">*</span>
                </label>
                <select
                  id="modal-status"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  {...register('status')}
                >
                  <option value="Active">Active</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
              </div>

              {/* More options disclosure */}
              <div className="border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setMoreOptionsOpen(!moreOptionsOpen)}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  aria-expanded={moreOptionsOpen}
                >
                  {moreOptionsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  More options
                </button>

                {moreOptionsOpen && (
                  <div className="mt-3 space-y-1.5 animate-fade-in">
                    <label htmlFor="modal-reorderPoint" className="text-sm font-medium text-foreground">
                      Reorder Point <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <input
                      id="modal-reorderPoint"
                      type="number"
                      min="0"
                      className={cn(
                        'w-full h-10 px-3 rounded-md border bg-background text-sm text-foreground font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        errors.reorderPoint ? 'border-error' : 'border-input'
                      )}
                      {...register('reorderPoint', {
                        min: { value: 0, message: 'Enter a valid number' },
                        validate: (v) => !v || Number.isInteger(Number(v)) || 'Enter a valid number',
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Items at or below this quantity show a Low Stock badge
                    </p>
                    {errors.reorderPoint && <p className="text-xs text-error">{errors.reorderPoint.message}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border sticky bottom-0 bg-surface">
              <Button type="button" variant="ghost" onClick={handleClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                loading={submitting}
                disabled={submitting || (mode === 'edit' && !isDirty)}
                className="min-w-[120px]"
              >
                {submitLabel}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AddEditItemModal;
