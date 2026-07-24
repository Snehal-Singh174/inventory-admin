/* SCREEN PLAN: Audit Log
 * Grid: N/A — full-width table
 * Sections: Page Header → Filter Toolbar → Audit Table (expandable rows) → Pagination
 * States: loading skeleton (6-col table rows) / error alert + retry / empty "No changes match these filters" + clear / success table
 * Copy: "Audit Log", "{totalCount} recorded changes", "No changes match these filters.", "No changes recorded yet. Actions on inventory items will appear here."
 * Slop risks: Generic diff view, missing badge colors, non-functional filter, no expandable state
 */
import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { useAuditLog } from '../hooks/useAuditLog';
import { AuditFilters } from '../components/audit/AuditFilters';
import { AuditTable } from '../components/audit/AuditTable';
import { Pagination } from '../components/inventory/Pagination';
import { AlertCircle, RefreshCw, ClipboardList } from 'lucide-react';
import Button from '../components/ui/Button';

export function AuditLogPage() {
  const {
    state,
    filters,
    page,
    pageSize,
    hasActiveFilters,
    updateFilters,
    clearFilters,
    setPage,
    setPageSize,
    retry,
  } = useAuditLog();

  const totalCount = state.status === 'success' ? state.meta?.totalCount || 0 : 0;
  const totalPages = state.status === 'success' ? state.meta?.totalPages || 1 : 1;

  return (
    <AppLayout>
      <div className="space-y-5 max-w-screen-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {state.status === 'success'
              ? `${totalCount.toLocaleString()} recorded change${totalCount !== 1 ? 's' : ''}`
              : 'Loading changes…'}
          </p>
        </div>

        <AuditFilters
          filters={filters}
          onFilterChange={updateFilters}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        />

        {state.status === 'loading' && <AuditTableSkeleton />}

        {state.status === 'error' && (
          <div className="bg-errorBackground border border-error/20 rounded-lg p-6 flex items-start gap-3" role="alert">
            <AlertCircle size={20} className="text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-error">
                Failed to load audit log. Check your connection and try again.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={retry} className="flex-shrink-0">
              <RefreshCw size={14} className="mr-1.5" />
              Retry
            </Button>
          </div>
        )}

        {state.status === 'success' && state.data?.length === 0 && (
          <div className="bg-surface border border-border rounded-lg p-12 text-center">
            <ClipboardList size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">
              {hasActiveFilters
                ? 'No changes match these filters.'
                : 'No changes recorded yet.'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {hasActiveFilters
                ? 'Try adjusting your filters or clear them to see all entries.'
                : 'Actions on inventory items will appear here.'}
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-3">
                Clear filters
              </Button>
            )}
          </div>
        )}

        {state.status === 'success' && state.data?.length > 0 && (
          <>
            <AuditTable entries={state.data} />
            <Pagination
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}

function AuditTableSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden animate-pulse">
      <div className="grid grid-cols-6 gap-4 px-5 py-3 border-b border-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`hdr-skel-${i}`} className="h-4 bg-muted rounded" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={`row-skel-${i}`} className="grid grid-cols-6 gap-4 px-5 py-4 border-b border-border last:border-b-0">
          <div className="h-4 bg-muted/60 rounded" />
          <div className="h-4 bg-muted/60 rounded" />
          <div className="h-4 bg-muted/60 rounded w-3/4" />
          <div className="h-4 bg-muted/60 rounded" />
          <div className="h-4 bg-muted/60 rounded w-5/6" />
          <div className="h-4 bg-muted/60 rounded w-8" />
        </div>
      ))}
    </div>
  );
}

export default AuditLogPage;
