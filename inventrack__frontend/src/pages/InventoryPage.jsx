/* SCREEN PLAN: Inventory List
 * Grid: Full-width table with filter toolbar above, pagination below
 * Sections (in order): Page header (title + CTAs) → Filter toolbar → Bulk action bar (conditional) → Data table → Pagination
 * States: loading skeleton / error alert with retry / empty (no items + no match) / success table
 * Copy: "Inventory", "{N} items", "Add Item", "Export", "Failed to load inventory…", "No inventory items yet…"
 * Slop risks: missing column sort, generic empty state, no bulk actions, missing export, missing inline edit
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Download, Plus, Package, RefreshCw } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/auth-context';
import { useInventory, useCategories, useSuppliers } from '../hooks/useInventory';
import { InventoryFilters, ALL_COLUMNS } from '../components/inventory/InventoryFilters';
import { InventoryTable } from '../components/inventory/InventoryTable';
import { Pagination } from '../components/inventory/Pagination';
import { BulkActionBar } from '../components/inventory/BulkActionBar';
import { AddEditItemModal } from '../components/inventory/AddEditItemModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ApiError } from '../utils/api-client';
import Button from '../components/ui/Button';

const DEFAULT_VISIBLE_COLUMNS = ALL_COLUMNS.map((c) => c.key);

export function InventoryPage() {
  const { user } = useAuth();
  const isEditor = user?.role === 'Editor';

  const {
    items, meta, status, error, filters, sort, page, pageSize,
    hasActiveFilters, fetchItems, updateFilter, clearFilters, updateSort,
    setPage, setPageSize, updateItem, deleteItem, bulkUpdateStatus, bulkDelete, exportItems,
  } = useInventory();

  const { categories, fetchCategories } = useCategories();
  const { suppliers, fetchSuppliers } = useSuppliers();

  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_VISIBLE_COLUMNS);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingRowId, setEditingRowId] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [modalItemId, setModalItemId] = useState(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', description: '', onConfirm: null, loading: false });

  // Initial fetch
  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
  }, []);

  // Fetch whenever query params change
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Clear selection when items change
  useEffect(() => {
    setSelectedIds([]);
  }, [items]);

  const handleSelectToggle = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const allIds = items.map((i) => i.id);
    const allSelected = allIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : allIds);
  }, [items, selectedIds]);

  const handleStartEdit = useCallback((id) => {
    setEditingRowId(id);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingRowId(null);
  }, []);

  const handleSaveEdit = useCallback(async (id, changes) => {
    try {
      await updateItem(id, changes);
      toast.success('Item updated');
      setEditingRowId(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error('Item changed since you loaded it. Refresh and try again.');
      } else {
        toast.error('Failed to save changes. Try again.');
      }
      throw err;
    }
  }, [updateItem]);

  const handleDeleteRow = useCallback((item) => {
    setConfirmDialog({
      open: true,
      title: `Delete "${item.itemName}"?`,
      description: 'This cannot be undone from the UI.',
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          await deleteItem(item.id);
          toast.success(`"${item.itemName}" deleted`);
          setConfirmDialog({ open: false, title: '', description: '', onConfirm: null, loading: false });
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) {
            toast.error('This item was already deleted.');
          } else {
            toast.error('Failed to delete item. Try again.');
          }
          setConfirmDialog((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  }, [deleteItem]);

  const handleBulkDelete = useCallback(() => {
    const count = selectedIds.length;
    setConfirmDialog({
      open: true,
      title: `Delete ${count} items?`,
      description: 'This cannot be undone from the UI.',
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          await bulkDelete(selectedIds);
          toast.success(`${count} items deleted`);
          setSelectedIds([]);
          setConfirmDialog({ open: false, title: '', description: '', onConfirm: null, loading: false });
        } catch (err) {
          toast.error('One or more items changed since you loaded this page. Refresh and try again.');
          setConfirmDialog((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  }, [selectedIds, bulkDelete]);

  const handleBulkStatusUpdate = useCallback((newStatus) => {
    const count = selectedIds.length;
    setConfirmDialog({
      open: true,
      title: `Update status for ${count} items to ${newStatus}?`,
      description: `This will change the status of all selected items.`,
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          await bulkUpdateStatus(selectedIds, newStatus);
          toast.success(`${count} items updated to ${newStatus}`);
          setSelectedIds([]);
          setConfirmDialog({ open: false, title: '', description: '', onConfirm: null, loading: false });
        } catch (err) {
          toast.error('One or more items changed since you loaded this page. Refresh and try again.');
          setConfirmDialog((prev) => ({ ...prev, loading: false }));
        }
      },
    });
  }, [selectedIds, bulkUpdateStatus]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportItems();
      toast.success('Export ready — check your downloads');
    } catch {
      toast.error('Export failed. Try again.');
    } finally {
      setExporting(false);
    }
  }, [exportItems]);

  const handleOpenCreateModal = useCallback(() => {
    setModalMode('create');
    setModalItemId(null);
    setModalOpen(true);
  }, []);

  const handleModalSuccess = useCallback((message) => {
    toast.success(message);
    fetchItems();
  }, [fetchItems]);

  // Render states
  const renderContent = () => {
    if (status === 'loading' && items.length === 0) {
      return <TableSkeleton visibleColumns={visibleColumns} isEditor={isEditor} />;
    }

    if (status === 'error') {
      return (
        <div className="p-6 text-center" role="alert">
          <div className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-errorBackground text-error text-sm mb-4">
            <RefreshCw size={16} />
            {error || 'Failed to load inventory. Check your connection and try again.'}
          </div>
          <div>
            <Button variant="default" size="sm" onClick={fetchItems}>
              <RefreshCw size={14} className="mr-1.5" />
              Retry
            </Button>
          </div>
        </div>
      );
    }

    if (status === 'success' && items.length === 0) {
      if (hasActiveFilters) {
        return (
          <div className="py-16 text-center">
            <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-base font-semibold text-foreground mb-1">No items match your filters</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search or filter criteria.
            </p>
            <Button variant="ghost" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        );
      }
      return (
        <div className="py-16 text-center">
          <Package size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground mb-1">No inventory items yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first item to get started tracking your inventory.
          </p>
          {isEditor && (
            <Button variant="default" onClick={handleOpenCreateModal}>
              <Plus size={16} className="mr-1.5" />
              Add Item
            </Button>
          )}
        </div>
      );
    }

    return (
      <>
        <InventoryTable
          items={items}
          sort={sort}
          onSort={updateSort}
          visibleColumns={visibleColumns}
          isEditor={isEditor}
          selectedIds={selectedIds}
          onSelectToggle={handleSelectToggle}
          onSelectAll={handleSelectAll}
          editingRowId={editingRowId}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onSaveEdit={handleSaveEdit}
          onDeleteRow={handleDeleteRow}
          categories={categories}
          suppliers={suppliers}
        />
        <Pagination
          page={meta.page}
          pageSize={meta.limit}
          totalCount={meta.totalCount}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      </>
    );
  };

  return (
    <AppLayout>
      <Toaster position="bottom-right" richColors closeButton />

      <div className="w-full max-w-screen-2xl mx-auto space-y-4">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Inventory</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {meta.totalCount > 0 ? `${meta.totalCount} items` : 'Manage your inventory'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              loading={exporting}
              disabled={exporting || (status === 'success' && items.length === 0 && !hasActiveFilters)}
              aria-label="Export inventory to Excel"
            >
              <Download size={16} className="mr-1.5" />
              {exporting ? 'Exporting…' : 'Export'}
            </Button>
            {isEditor && (
              <Button variant="default" size="sm" onClick={handleOpenCreateModal}>
                <Plus size={16} className="mr-1.5" />
                Add Item
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <InventoryFilters
          filters={filters}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          categories={categories}
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}
        />

        {/* Table content */}
        {renderContent()}
      </div>

      {/* Bulk action bar */}
      {isEditor && (
        <BulkActionBar
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
          onBulkStatusUpdate={handleBulkStatusUpdate}
          onClearSelection={() => setSelectedIds([])}
        />
      )}

      {/* Add/Edit modal */}
      <AddEditItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        itemId={modalItemId}
        categories={categories}
        suppliers={suppliers}
        onSuccess={handleModalSuccess}
      />

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, title: '', description: '', onConfirm: null, loading: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel="Confirm"
        variant="destructive"
        loading={confirmDialog.loading}
      />
    </AppLayout>
  );
}

function TableSkeleton({ visibleColumns, isEditor }) {
  const colCount = visibleColumns.length + (isEditor ? 2 : 0);
  return (
    <div className="border border-border rounded-lg overflow-hidden" aria-live="polite" aria-busy="true">
      <table className="w-full">
        <thead className="bg-surface-elevated border-b border-border">
          <tr>
            {Array.from({ length: colCount }).map((_, i) => (
              <th key={`skel-th-${i}`} className="px-3 py-3">
                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 10 }).map((_, rowIdx) => (
            <tr key={`skel-row-${rowIdx}`} className="border-b border-border">
              {Array.from({ length: colCount }).map((_, colIdx) => (
                <td key={`skel-cell-${rowIdx}-${colIdx}`} className="px-3 py-3">
                  <div className="h-4 w-full max-w-[120px] bg-muted rounded animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryPage;
