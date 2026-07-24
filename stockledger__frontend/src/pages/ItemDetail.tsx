/* SCREEN PLAN: Item Detail (/inventory/:id)
 * Layout: breadcrumb + header (name, SKU badge, status, meta) + tab bar + tab panel
 * Tabs: "Details" | "Change History"
 * Details: EDITOR = full edit form; VIEWER = read-only field grid
 * Change History: EDITOR = audit log timeline; VIEWER = access-restricted message
 * Header actions: "Delete Item" button (EDITOR only) → confirm dialog → navigate back
 * States: loading skeleton, error + retry, 404 item-not-found, success
 * Copy: "← Back to Inventory" / "Delete Item" / "Item not found — it may have been removed"
 * Slop risks: plain text breadcrumb → styled back link; generic error → specific message
 */

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ChevronLeft, Trash2, Package, Calendar, AlertCircle, Tag,
} from 'lucide-react';
import { format } from 'date-fns';
import { useInventoryItem, useDeleteItem } from '../hooks/useInventoryData';
import type { InventoryItem } from '../types/inventory';
import { ItemEditForm, ItemReadOnlyView } from './inventory/ItemEditForm';
import { ChangeHistoryTab } from './inventory/ChangeHistoryTab';
import { ConfirmDialog } from './inventory/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

type TabKey = 'details' | 'history';

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold',
      status === 'ACTIVE'
        ? 'bg-successBackground text-success border border-success/20'
        : 'bg-muted text-muted-foreground border border-border',
    )}>
      {status === 'ACTIVE' ? 'Active' : 'Discontinued'}
    </span>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse" aria-hidden="true">
      {/* Back link */}
      <div className="skeleton h-4 w-32 rounded" />
      {/* Header */}
      <div className="card p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="skeleton h-7 w-64 rounded" />
            <div className="flex gap-2">
              <div className="skeleton h-5 w-20 rounded" />
              <div className="skeleton h-5 w-16 rounded" />
            </div>
          </div>
          <div className="skeleton h-10 w-28 rounded-lg" />
        </div>
        <div className="flex gap-4">
          <div className="skeleton h-3.5 w-36 rounded" />
          <div className="skeleton h-3.5 w-36 rounded" />
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-4">
        <div className="skeleton h-9 w-20 rounded-lg" />
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>
      {/* Form skeleton */}
      <div className="card p-6 grid grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`fs-${i}`} className="flex flex-col gap-1.5">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditor = user?.role === 'EDITOR';

  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [localItem, setLocalItem] = useState<InventoryItem | null>(null);

  const { data: fetchedItem, isLoading, isError, error } = useInventoryItem(id ?? '');
  const item = localItem ?? fetchedItem;

  const deleteItem = useDeleteItem();

  const handleDelete = async () => {
    if (!item) return;
    try {
      await deleteItem.mutateAsync(item.id);
      toast.success(`${item.sku} removed from inventory`);
      navigate('/inventory');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete — try again';
      toast.error(msg);
      setDeleteConfirmOpen(false);
    }
  };

  const fmtDate = (d: string) => {
    try { return format(new Date(d), 'MMM d, yyyy HH:mm'); }
    catch { return d; }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) return <DetailSkeleton />;

  // ── Error ─────────────────────────────────────────────────────────────────
  if (isError || !item) {
    const is404 = error?.message?.includes('404') || error?.message?.includes('not found');
    return (
      <div className="flex flex-col gap-6">
        <Link
          to="/inventory"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary
                     transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronLeft size={15} />
          Back to Inventory
        </Link>
        <div role="alert" className="flex flex-col items-center justify-center min-h-[40vh] gap-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-errorBackground flex items-center justify-center">
            {is404
              ? <Package size={26} className="text-error" aria-hidden="true" />
              : <AlertCircle size={26} className="text-error" aria-hidden="true" />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-onBackground">
              {is404 ? 'Item not found' : 'Failed to load item'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              {is404
                ? 'This item may have been deleted or the link is incorrect.'
                : (error?.message ?? 'Failed to load item details — check your connection and try again')}
            </p>
          </div>
          <Link
            to="/inventory"
            className="px-5 py-2.5 rounded-lg bg-primary text-onPrimary text-sm font-semibold
                       hover:bg-primary/90 transition-colors min-h-[44px] flex items-center
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Back to Inventory
          </Link>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb back link */}
      <Link
        to="/inventory"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary
                   transition-colors w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <ChevronLeft size={15} />
        Back to Inventory
      </Link>

      {/* Item header card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Tag size={18} className="text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-onBackground truncate">{item.item_name}</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs bg-muted px-2.5 py-1 rounded-md text-muted-foreground select-all">
                {item.sku}
              </span>
              <StatusBadge status={item.status} />
              {item.category && (
                <span className="text-xs text-muted-foreground">
                  {item.category.name}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          {isEditor && (
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(true)}
              aria-label={`Delete ${item.item_name} from inventory`}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                         text-error border border-error/30 bg-errorBackground rounded-lg
                         hover:bg-error hover:text-onPrimary transition-colors duration-150 min-h-[44px]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
            >
              <Trash2 size={15} />
              Delete Item
            </button>
          )}
        </div>

        {/* Meta row */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground border-t border-border pt-4">
          <span className="flex items-center gap-1.5">
            <Calendar size={12} aria-hidden="true" />
            Created {fmtDate(item.created_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={12} aria-hidden="true" />
            Updated {fmtDate(item.updated_at)}
          </span>
          {item.supplier && (
            <span className="text-muted-foreground">
              Supplier: <span className="font-medium text-onBackground">{item.supplier.name}</span>
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border -mb-3">
        <div role="tablist" aria-label="Item detail sections" className="flex">
          {([
            { key: 'details' as const, label: 'Details' },
            { key: 'history' as const, label: 'Change History' },
          ]).map(({ key, label }) => (
            <button
              key={`detail-tab-${key}`}
              role="tab"
              aria-selected={activeTab === key}
              aria-controls={`tabpanel-${key}`}
              id={`detail-tab-btn-${key}`}
              onClick={() => setActiveTab(key)}
              className={cn(
                'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                activeTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-onBackground hover:border-border',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`detail-tab-btn-${activeTab}`}
        className="card p-6"
      >
        {activeTab === 'details' ? (
          isEditor
            ? <ItemEditForm item={item} onSaved={(updated) => setLocalItem(updated)} />
            : <ItemReadOnlyView item={item} />
        ) : (
          <ChangeHistoryTab itemId={item.id} isEditor={isEditor} />
        )}
      </div>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title={`Delete ${item.sku}?`}
        body={
          <>
            This will permanently remove <strong>{item.item_name}</strong> from inventory.
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete item"
        destructive
        isLoading={deleteItem.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
