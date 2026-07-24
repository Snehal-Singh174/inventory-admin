import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, AlertCircle, Truck } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { cn } from '../../utils/cn';
import type { Supplier } from '../../types/referenceData';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalState = null | { mode: 'add' } | { mode: 'edit'; supplier: Supplier };

interface SupplierFormValues {
  name: string;
  contact_email: string;
  phone: string;
  address: string;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function SupplierSkeleton() {
  return (
    <div aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={`sup-skel-${i}`} className="flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0">
          <div className="skeleton h-3.5 w-40 rounded" />
          <div className="skeleton h-3.5 w-40 rounded flex-1" />
          <div className="skeleton h-3.5 w-28 rounded" />
          <div className="skeleton h-5 w-8 rounded ml-auto" />
          <div className="skeleton h-7 w-14 rounded" />
        </div>
      ))}
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function SupplierError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 p-4 rounded-lg bg-errorBackground border border-error/20 m-4">
      <AlertCircle size={16} className="text-error flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-error">Failed to load suppliers</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Check your connection and try again.</p>
      </div>
      <button
        onClick={onRetry}
        className="text-sm font-medium text-error hover:underline flex-shrink-0
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
      >
        Retry
      </button>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function SupplierEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
        <Truck size={24} strokeWidth={1.5} className="text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <p className="text-base font-semibold text-onBackground">No suppliers yet</p>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
          Add your first supplier to link inventory items to their source.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-onPrimary
                   text-sm font-medium hover:bg-primary/90 transition-colors duration-150 min-h-[44px]
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Plus size={15} aria-hidden="true" />
        Add Supplier
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SupplierTab() {
  const queryClient = useQueryClient();
  const [modalState, setModalState] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: suppliers, isLoading, isError, refetch } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get<Supplier[]>('/api/suppliers'),
  });

  const saveMutation = useMutation<Supplier, Error, { id?: string; data: Partial<SupplierFormValues> }>({
    mutationFn: ({ id, data }) =>
      id
        ? api.patch<Supplier>(`/api/suppliers/${id}`, data)
        : api.post<Supplier>('/api/suppliers', data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(vars.id ? 'Supplier updated' : 'Supplier created');
      setModalState(null);
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete<void>(`/api/suppliers/${deleteTarget.id}`);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(`${deleteTarget.name} deleted`);
    } catch {
      toast.error('Cannot delete — now in use. Refresh and try again.');
      refetch();
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setModalState({ mode: 'add' })}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-onPrimary
                     text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all duration-150
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                     focus-visible:ring-offset-2 min-h-[44px]"
        >
          <Plus size={15} aria-hidden="true" />
          Add Supplier
        </button>
      </div>

      {/* Table card */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div aria-live="polite" aria-busy="true" aria-label="Loading suppliers">
            <SupplierSkeleton />
          </div>
        ) : isError ? (
          <SupplierError onRetry={() => refetch()} />
        ) : !suppliers?.length ? (
          <SupplierEmpty onAdd={() => setModalState({ mode: 'add' })} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground w-[22%]">Name</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground w-[24%]">Contact Email</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground w-[18%]">Phone</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground w-[80px]">Items</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground w-[90px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((sup) => (
                  <tr
                    key={`sup-row-${sup.id}`}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors duration-100 group"
                  >
                    <td className="px-4 py-3 font-medium text-onBackground">{sup.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sup.contact_email
                        ? <a href={`mailto:${sup.contact_email}`} className="hover:text-primary hover:underline transition-colors duration-150">{sup.contact_email}</a>
                        : <span className="italic opacity-50 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sup.phone ?? <span className="italic opacity-50 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {sup.item_count > 0 ? (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-infoBackground text-info">
                          {sup.item_count}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          onClick={() => setModalState({ mode: 'edit', supplier: sup })}
                          aria-label={`Edit ${sup.name}`}
                          className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10
                                     transition-colors duration-150 focus-visible:outline-none
                                     focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] min-w-[36px]"
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>

                        {sup.item_count > 0 ? (
                          <span className="relative group/del inline-flex">
                            <span
                              aria-disabled="true"
                              aria-label={`Cannot delete — ${sup.item_count} item${sup.item_count !== 1 ? 's' : ''} use this supplier`}
                              className="p-2 rounded-md text-muted-foreground/35 cursor-not-allowed inline-flex
                                         items-center justify-center min-h-[36px] min-w-[36px]"
                            >
                              <Trash2 size={14} aria-hidden="true" />
                            </span>
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute bottom-full right-0 mb-1.5 z-20
                                         px-2.5 py-1.5 rounded-md bg-onBackground text-surface text-xs
                                         whitespace-nowrap shadow-elevation-2
                                         opacity-0 group-hover/del:opacity-100 transition-opacity duration-150"
                            >
                              Cannot delete — {sup.item_count} item{sup.item_count !== 1 ? 's' : ''} use this supplier
                            </span>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeleteTarget(sup)}
                            aria-label={`Delete ${sup.name}`}
                            className="p-2 rounded-md text-muted-foreground hover:text-error hover:bg-errorBackground
                                       transition-colors duration-150 focus-visible:outline-none
                                       focus-visible:ring-2 focus-visible:ring-error min-h-[36px] min-w-[36px]"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {modalState !== null && (
        <SupplierModal
          state={modalState}
          onClose={() => { setModalState(null); saveMutation.reset(); }}
          onSubmit={(data) =>
            saveMutation.mutate({
              id: modalState.mode === 'edit' ? modalState.supplier.id : undefined,
              data: {
                name: data.name.trim(),
                contact_email: data.contact_email.trim() || undefined,
                phone: data.phone.trim() || undefined,
                address: data.address.trim() || undefined,
              },
            })
          }
          isSaving={saveMutation.isPending}
          serverError={saveMutation.isError ? (saveMutation.error?.message ?? 'An error occurred') : null}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteConfirmDialog
          name={deleteTarget.name}
          entity="supplier"
          isDeleting={isDeleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────

interface SupplierModalProps {
  state: Exclude<ModalState, null>;
  onClose: () => void;
  onSubmit: (data: SupplierFormValues) => void;
  isSaving: boolean;
  serverError: string | null;
}

function SupplierModal({ state, onClose, onSubmit, isSaving, serverError }: SupplierModalProps) {
  const defaultValues: SupplierFormValues = state.mode === 'edit'
    ? {
        name: state.supplier.name,
        contact_email: state.supplier.contact_email ?? '',
        phone: state.supplier.phone ?? '',
        address: state.supplier.address ?? '',
      }
    : { name: '', contact_email: '', phone: '', address: '' };

  const { register, handleSubmit, formState: { errors } } = useForm<SupplierFormValues>({ defaultValues });

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isSaving) onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, isSaving]);

  const inputClass = (hasError?: boolean) => cn(
    'h-10 w-full rounded-md border px-3 text-sm bg-surface text-onBackground',
    'placeholder:text-muted-foreground transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
    hasError ? 'border-error' : 'border-border hover:border-muted-foreground',
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sup-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-onBackground/40 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget && !isSaving) onClose(); }}
    >
      <div className="bg-surface rounded-xl shadow-elevation-3 w-full max-w-lg animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 id="sup-modal-title" className="text-base font-semibold text-onBackground">
            {state.mode === 'add' ? 'Add Supplier' : 'Edit Supplier'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close dialog"
            className="p-1.5 rounded-md text-muted-foreground hover:text-onBackground hover:bg-muted
                       transition-colors duration-150 focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="px-6 py-5 flex flex-col gap-4">
            {/* Server-side error */}
            {serverError && (
              <div role="alert" className="flex items-center gap-2.5 p-3 rounded-lg bg-errorBackground border border-error/20 text-sm text-error">
                <AlertCircle size={15} className="flex-shrink-0" aria-hidden="true" />
                {serverError}
              </div>
            )}

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sup-modal-name" className="text-sm font-medium text-onBackground">
                Name <span className="text-error ml-0.5" aria-hidden="true">*</span>
              </label>
              <input
                id="sup-modal-name"
                type="text"
                placeholder="e.g. Acme Distribution Co."
                autoComplete="off"
                className={inputClass(!!errors.name)}
                {...register('name', {
                  required: 'Supplier name is required',
                  maxLength: { value: 100, message: 'Name must be 100 characters or fewer' },
                })}
              />
              {errors.name && (
                <p role="alert" className="text-xs text-error">{errors.name.message}</p>
              )}
            </div>

            {/* Contact Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sup-modal-email" className="text-sm font-medium text-onBackground">
                Contact Email
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="sup-modal-email"
                type="email"
                placeholder="orders@acmedist.com"
                autoComplete="off"
                className={inputClass(!!errors.contact_email)}
                {...register('contact_email', {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              {errors.contact_email && (
                <p role="alert" className="text-xs text-error">{errors.contact_email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sup-modal-phone" className="text-sm font-medium text-onBackground">
                Phone
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="sup-modal-phone"
                type="text"
                placeholder="+1 (555) 010-2000"
                autoComplete="off"
                className={inputClass(false)}
                {...register('phone')}
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sup-modal-address" className="text-sm font-medium text-onBackground">
                Address
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="sup-modal-address"
                rows={2}
                placeholder="Optional"
                className={cn(
                  'w-full rounded-md border border-border px-3 py-2 text-sm bg-surface text-onBackground',
                  'placeholder:text-muted-foreground resize-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                  'hover:border-muted-foreground transition-colors duration-150',
                )}
                {...register('address', {
                  maxLength: { value: 255, message: 'Address must be 255 characters or fewer' },
                })}
              />
              {errors.address && (
                <p role="alert" className="text-xs text-error">{errors.address.message}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-muted/30 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground min-h-[40px]
                         hover:text-onBackground hover:bg-muted transition-colors duration-150
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg
                         bg-primary text-onPrimary text-sm font-medium min-w-[130px] min-h-[40px]
                         hover:bg-primary/90 active:scale-95 transition-all duration-150
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                         focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                state.mode === 'add' ? 'Create Supplier' : 'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
