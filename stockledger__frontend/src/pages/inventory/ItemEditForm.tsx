import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { useUpdateItem, useCategories, useSuppliers } from '../../hooks/useInventoryData';
import type { InventoryItem } from '../../types/inventory';
import { cn } from '../../utils/cn';

interface ItemFormValues {
  item_name: string;
  sku: string;
  category_id: string;
  supplier_id: string;
  quantity: number;
  unit_cost: number;
  status: 'ACTIVE' | 'DISCONTINUED';
}

interface ItemEditFormProps {
  item: InventoryItem;
  onSaved: (updated: InventoryItem) => void;
}

// ── Read-only field display ───────────────────────────────────────────────────

function ReadOnlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-onBackground">{value ?? <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

export function ItemReadOnlyView({ item }: { item: InventoryItem }) {
  const fmtCost = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <ReadOnlyField label="Item Name" value={item.item_name} />
      <ReadOnlyField label="SKU" value={
        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{item.sku}</span>
      } />
      <ReadOnlyField label="Category" value={item.category?.name} />
      <ReadOnlyField label="Quantity on Hand" value={
        <span className="tabular-nums font-semibold">{item.quantity.toLocaleString()}</span>
      } />
      <ReadOnlyField label="Unit Cost" value={
        <span className="tabular-nums">{fmtCost(item.unit_cost)}</span>
      } />
      <ReadOnlyField label="Total Value" value={
        <span className="tabular-nums">{fmtCost(item.quantity * item.unit_cost)}</span>
      } />
      <ReadOnlyField label="Supplier" value={item.supplier?.name} />
      <ReadOnlyField label="Status" value={
        <span className={cn(
          'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
          item.status === 'ACTIVE' ? 'bg-successBackground text-success' : 'bg-muted text-muted-foreground',
        )}>
          {item.status === 'ACTIVE' ? 'Active' : 'Discontinued'}
        </span>
      } />
    </dl>
  );
}

// ── Edit form ─────────────────────────────────────────────────────────────────

const FIELD_CLASS = cn(
  'w-full h-10 px-3 text-sm rounded-lg border border-border bg-surface text-onBackground',
  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary',
  'transition-colors duration-150 disabled:opacity-50',
);

export function ItemEditForm({ item, onSaved }: ItemEditFormProps) {
  const updateItem = useUpdateItem();
  const { data: categories = [] } = useCategories();
  const { data: suppliers = [] } = useSuppliers();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ItemFormValues>({
    defaultValues: {
      item_name:   item.item_name,
      sku:         item.sku,
      category_id: item.category_id,
      supplier_id: item.supplier_id,
      quantity:    item.quantity,
      unit_cost:   item.unit_cost,
      status:      item.status,
    },
  });

  // Sync form when item prop changes (e.g. after a refetch)
  useEffect(() => {
    reset({
      item_name:   item.item_name,
      sku:         item.sku,
      category_id: item.category_id,
      supplier_id: item.supplier_id,
      quantity:    item.quantity,
      unit_cost:   item.unit_cost,
      status:      item.status,
    });
  }, [item.id, reset]);

  const onSubmit = async (values: ItemFormValues) => {
    try {
      const updated = await updateItem.mutateAsync({
        id: item.id,
        updates: {
          item_name:   values.item_name.trim(),
          sku:         values.sku.trim().toUpperCase(),
          category_id: values.category_id,
          supplier_id: values.supplier_id,
          quantity:    Math.floor(Number(values.quantity)),
          unit_cost:   parseFloat(Number(values.unit_cost).toFixed(2)),
          status:      values.status,
        },
      });
      toast.success('Changes saved successfully');
      onSaved(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save — try again';
      toast.error(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Unsaved changes indicator */}
      {isDirty && (
        <div className="mb-5 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-warningBackground border border-warning/20 text-sm text-warning">
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
          </svg>
          You have unsaved changes
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Item Name */}
        <div className="lg:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="field-item-name" className="text-sm font-medium text-onBackground">
            Item Name <span className="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="field-item-name"
            type="text"
            className={cn(FIELD_CLASS, errors.item_name && 'border-error focus:ring-error')}
            {...register('item_name', {
              required: 'Item name is required',
              maxLength: { value: 150, message: 'Item name must be 150 characters or fewer' },
            })}
          />
          {errors.item_name && (
            <p role="alert" className="text-xs text-error">{errors.item_name.message}</p>
          )}
        </div>

        {/* SKU */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="field-sku" className="text-sm font-medium text-onBackground">
            SKU <span className="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="field-sku"
            type="text"
            className={cn(FIELD_CLASS, 'font-mono uppercase', errors.sku && 'border-error focus:ring-error')}
            {...register('sku', {
              required: 'SKU is required',
              maxLength: { value: 50, message: 'SKU must be 50 characters or fewer' },
            })}
          />
          {errors.sku && (
            <p role="alert" className="text-xs text-error">{errors.sku.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="field-category" className="text-sm font-medium text-onBackground">
            Category <span className="text-error" aria-hidden="true">*</span>
          </label>
          <select
            id="field-category"
            className={cn(FIELD_CLASS, 'cursor-pointer', errors.category_id && 'border-error focus:ring-error')}
            {...register('category_id', { required: 'Category is required' })}
          >
            <option value="">Select category…</option>
            {categories.map(c => (
              <option key={`cat-${c.id}`} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.category_id && (
            <p role="alert" className="text-xs text-error">{errors.category_id.message}</p>
          )}
        </div>

        {/* Supplier */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="field-supplier" className="text-sm font-medium text-onBackground">
            Supplier <span className="text-error" aria-hidden="true">*</span>
          </label>
          <select
            id="field-supplier"
            className={cn(FIELD_CLASS, 'cursor-pointer', errors.supplier_id && 'border-error focus:ring-error')}
            {...register('supplier_id', { required: 'Supplier is required' })}
          >
            <option value="">Select supplier…</option>
            {suppliers.map(s => (
              <option key={`sup-${s.id}`} value={s.id}>{s.name}</option>
            ))}
          </select>
          {errors.supplier_id && (
            <p role="alert" className="text-xs text-error">{errors.supplier_id.message}</p>
          )}
        </div>

        {/* Quantity */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="field-qty" className="text-sm font-medium text-onBackground">
            Quantity on Hand <span className="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="field-qty"
            type="number"
            min={0}
            className={cn(FIELD_CLASS, 'tabular-nums', errors.quantity && 'border-error focus:ring-error')}
            {...register('quantity', {
              required: 'Quantity is required',
              min: { value: 0, message: 'Quantity cannot be negative' },
              valueAsNumber: true,
            })}
          />
          {errors.quantity && (
            <p role="alert" className="text-xs text-error">{errors.quantity.message}</p>
          )}
        </div>

        {/* Unit Cost */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="field-cost" className="text-sm font-medium text-onBackground">
            Unit Cost ($) <span className="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="field-cost"
            type="number"
            min={0}
            step="0.01"
            className={cn(FIELD_CLASS, 'tabular-nums', errors.unit_cost && 'border-error focus:ring-error')}
            {...register('unit_cost', {
              required: 'Unit cost is required',
              min: { value: 0, message: 'Unit cost cannot be negative' },
              valueAsNumber: true,
            })}
          />
          {errors.unit_cost && (
            <p role="alert" className="text-xs text-error">{errors.unit_cost.message}</p>
          )}
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="field-status" className="text-sm font-medium text-onBackground">Status</label>
          <select id="field-status" className={cn(FIELD_CLASS, 'cursor-pointer')} {...register('status')}>
            <option value="ACTIVE">Active</option>
            <option value="DISCONTINUED">Discontinued</option>
          </select>
        </div>
      </div>

      {/* Save / Cancel */}
      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border">
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150',
            'bg-primary text-onPrimary hover:bg-primary/90 active:scale-95 min-h-[44px]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            'disabled:opacity-50 disabled:pointer-events-none',
          )}
        >
          {isSubmitting ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <Save size={15} />
          )}
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => reset()}
          disabled={isSubmitting || !isDirty}
          className="px-4 py-2.5 text-sm font-medium text-muted-foreground bg-muted rounded-lg
                     hover:bg-border hover:text-onBackground transition-colors duration-150 min-h-[44px]
                     disabled:opacity-40 disabled:pointer-events-none
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Discard changes
        </button>
      </div>
    </form>
  );
}
