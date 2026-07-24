import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, AlertCircle, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../lib/apiClient';
import { cn } from '../../utils/cn';
import type { Category } from '../../types/referenceData';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalState = null | { mode: 'add' } | { mode: 'edit'; category: Category };

interface CategoryFormValues {
  name: string;
  description: string;
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function CategorySkeleton() {
  return (
    <div aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={`cat-skel-${i}`} className="flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0">
          <div className="skeleton h-3.5 w-36 rounded" />
          <div className="skeleton h-3.5 w-52 rounded ml-4 flex-1" />
          <div className="skeleton h-5 w-8 rounded ml-auto" />
          <div className="skeleton h-3.5 w-20 rounded" />
          <div className="skeleton h-7 w-14 rounded" />
        </div>
      ))}
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function CategoryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-3 p-4 rounded-lg bg-errorBackground border border-error/20 m-4">
      <AlertCircle size={16} className="text-error flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-error">Failed to load categories</p>
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

function CategoryEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
        <Tag size={24} strokeWidth={1.5} className="text-muted-foreground" aria-hidden="true" />
      </div>
      <div>
        <p className="text-base font-semibold text-onBackground">No categories yet</p>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
          Add your first category to start organizing inventory items by type.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-onPrimary
                   text-sm font-medium hover:bg-primary/90 transition-colors duration-150 min-h-[44px]
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Plus size={15} aria-hidden="true" />
        Add Category
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function CategoryTab() {
  const queryClient = useQueryClient();
  const [modalState, setModalState] = useState<ModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: categories, isLoading, isError, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/api/categories'),
  });

  const saveMutation = useMutation<Category, Error, { id?: string; data: Partial<CategoryFormValues> }>({
    mutationFn: ({ id, data }) =>
      id
        ? api.patch<Category>(`/api/categories/${id}`, data)
        : api.post<Category>('/api/categories', data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(vars.id ? 'Category updated' : 'Category created');
      setModalState(null);
    },
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete<void>(`/api/categories/${deleteTarget.id}`);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`${deleteTarget.name} deleted`);
    } catch {
      // Any server error on delete is the race-condition: item was linked after page load
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
          Add Category
        </button>
      </div>

      {/* Table card */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div aria-live="polite" aria-busy="true" aria-label="Loading categories">
            <CategorySkeleton />
          </div>
        ) : isError ? (
          <CategoryError onRetry={() => refetch()} />
        ) : !categories?.length ? (
          <CategoryEmpty onAdd={() => setModalState({ mode: 'add' })} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground w-[28%]">Name</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground">Description</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground w-[80px]">Items</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground w-[120px]">Created</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground w-[90px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr
                    key={`cat-row-${cat.id}`}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors duration-100 group"
                  >
                    <td className="px-4 py-3 font-medium text-onBackground">{cat.name}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[280px]">
                      {cat.description
                        ? <span className="line-clamp-1">{cat.description}</span>
                        : <span className="italic opacity-50 text-xs">No description</span>}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {cat.item_count > 0 ? (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-infoBackground text-info">
                          {cat.item_count}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(cat.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          onClick={() => setModalState({ mode: 'edit', category: cat })}
                          aria-label={`Edit ${cat.name}`}
                          className="p-2 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10
                                     transition-colors duration-150 focus-visible:outline-none
                                     focus-visible:ring-2 focus-visible:ring-primary min-h-[36px] min-w-[36px]"
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>

                        {cat.item_count > 0 ? (
                          /* Disabled delete — guarded by item_count */
                          <span className="relative group/del inline-flex">
                            <span
                              aria-disabled="true"
                              aria-label={`Cannot delete — ${cat.item_count} item${cat.item_count !== 1 ? 's' : ''} use this category`}
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
                              Cannot delete — {cat.item_count} item{cat.item_count !== 1 ? 's' : ''} use this category
                            </span>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeleteTarget(cat)}
                            aria-label={`Delete ${cat.name}`}
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
        <CategoryModal
          state={modalState}
          onClose={() => { setModalState(null); saveMutation.reset(); }}
          onSubmit={(data) =>
            saveMutation.mutate({
              id: modalState.mode === 'edit' ? modalState.category.id : undefined,
              data: { name: data.name.trim(), description: data.description.trim() || undefined },
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
          entity="category"
          isDeleting={isDeleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────

interface CategoryModalProps {
  state: Exclude<ModalState, null>;
  onClose: () => void;
  onSubmit: (data: CategoryFormValues) => void;
  isSaving: boolean;
  serverError: string | null;
}

function CategoryModal({ state, onClose, onSubmit, isSaving, serverError }: CategoryModalProps) {
  const defaultValues: CategoryFormValues = state.mode === 'edit'
    ? { name: state.category.name, description: state.category.description ?? '' }
    : { name: '', description: '' };

  const { register, handleSubmit, formState: { errors } } = useForm<CategoryFormValues>({ defaultValues });

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isSaving) onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, isSaving]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cat-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-onBackground/40 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget && !isSaving) onClose(); }}
    >
      <div className="bg-surface rounded-xl shadow-elevation-3 w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 id="cat-modal-title" className="text-base font-semibold text-onBackground">
            {state.mode === 'add' ? 'Add Category' : 'Edit Category'}
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
          <div className="px-6 py-5 flex flex-col gap-5">
            {/* Server-side error */}
            {serverError && (
              <div role="alert" className="flex items-center gap-2.5 p-3 rounded-lg bg-errorBackground border border-error/20 text-sm text-error">
                <AlertCircle size={15} className="flex-shrink-0" aria-hidden="true" />
                {serverError}
              </div>
            )}

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cat-modal-name" className="text-sm font-medium text-onBackground">
                Name <span className="text-error ml-0.5" aria-hidden="true">*</span>
              </label>
              <input
                id="cat-modal-name"
                type="text"
                placeholder="e.g. Electronics"
                autoComplete="off"
                className={cn(
                  'h-10 w-full rounded-md border px-3 text-sm bg-surface text-onBackground',
                  'placeholder:text-muted-foreground transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                  errors.name ? 'border-error' : 'border-border hover:border-muted-foreground',
                )}
                {...register('name', {
                  required: 'Category name is required',
                  maxLength: { value: 60, message: 'Name must be 60 characters or fewer' },
                })}
              />
              {errors.name && (
                <p role="alert" className="text-xs text-error">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cat-modal-desc" className="text-sm font-medium text-onBackground">
                Description
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="cat-modal-desc"
                rows={3}
                placeholder="Optional — helps other editors know what belongs here"
                className={cn(
                  'w-full rounded-md border border-border px-3 py-2 text-sm bg-surface text-onBackground',
                  'placeholder:text-muted-foreground resize-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                  'hover:border-muted-foreground transition-colors duration-150',
                )}
                {...register('description', {
                  maxLength: { value: 255, message: 'Description must be 255 characters or fewer' },
                })}
              />
              {errors.description && (
                <p role="alert" className="text-xs text-error">{errors.description.message}</p>
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
                state.mode === 'add' ? 'Create Category' : 'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
