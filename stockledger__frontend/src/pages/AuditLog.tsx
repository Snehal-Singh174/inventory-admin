/* SCREEN PLAN: Audit Log (/audit-log)
 * Layout: page header (title + entry count) → filter toolbar → table
 * Filter state: URL search params (shareable, back/forward navigation)
 * Actor registry: accumulates unique actors from all pages loaded so far
 * States: all four handled by AuditLogTable
 * 403 guard: user.role !== 'EDITOR' → ForbiddenView (never calls the API)
 * Copy: "Audit Log" / "A complete record of all changes made to inventory items,
 *        categories, and suppliers." / "Back to Inventory" on 403
 * Slop risks: 403 as blank page → full branded forbidden view;
 *             no actor filter → dynamic registry; raw hex badge → tokens only
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ScrollText, ShieldOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAuditLog, DEFAULT_AUDIT_FILTERS } from '../hooks/useAuditLog';
import type { AuditLogFilters } from '../hooks/useAuditLog';
import { AuditLogFiltersBar } from './audit-log/AuditLogFilters';
import type { AuditActor } from './audit-log/AuditLogFilters';
import { AuditLogTable } from './audit-log/AuditLogTable';

// ── 403 view ──────────────────────────────────────────────────────────────────

function ForbiddenView() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-16 h-16 rounded-full bg-errorBackground flex items-center justify-center mb-6"
        aria-hidden="true"
      >
        <ShieldOff size={28} className="text-error" />
      </div>
      <h1 className="text-2xl font-bold text-onBackground mb-2">Access Restricted</h1>
      <p className="text-sm text-muted-foreground max-w-xs mb-8 leading-relaxed">
        You don&apos;t have permission to view this page. Audit logs are only accessible
        to Editors.
      </p>
      <Link
        to="/inventory"
        className="inline-flex items-center gap-2 h-10 px-5 text-sm font-semibold
                   bg-primary text-onPrimary rounded-lg hover:bg-primary/90 active:scale-95
                   transition-all duration-150 focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to Inventory
      </Link>
    </div>
  );
}

// ── URL params ↔ filter state helpers ─────────────────────────────────────────

function readFiltersFromParams(params: URLSearchParams): AuditLogFilters {
  return {
    dateFrom:   params.get('dateFrom')   ?? DEFAULT_AUDIT_FILTERS.dateFrom,
    dateTo:     params.get('dateTo')     ?? DEFAULT_AUDIT_FILTERS.dateTo,
    userId:     params.get('userId')     ?? DEFAULT_AUDIT_FILTERS.userId,
    action:     params.get('action')     ?? DEFAULT_AUDIT_FILTERS.action,
    entityType: params.get('entityType') ?? DEFAULT_AUDIT_FILTERS.entityType,
    search:     params.get('search')     ?? DEFAULT_AUDIT_FILTERS.search,
    page:       Number(params.get('page'))     || DEFAULT_AUDIT_FILTERS.page,
    pageSize:   Number(params.get('pageSize')) || DEFAULT_AUDIT_FILTERS.pageSize,
  };
}

function filtersToParams(filters: AuditLogFilters): Record<string, string> {
  const result: Record<string, string> = {};
  if (filters.dateFrom)   result.dateFrom   = filters.dateFrom;
  if (filters.dateTo)     result.dateTo     = filters.dateTo;
  if (filters.userId)     result.userId     = filters.userId;
  if (filters.action)     result.action     = filters.action;
  if (filters.entityType) result.entityType = filters.entityType;
  if (filters.search)     result.search     = filters.search;
  if (filters.page > 1)            result.page     = String(filters.page);
  if (filters.pageSize !== 25)     result.pageSize = String(filters.pageSize);
  return result;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AuditLog() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFiltersFromParams(searchParams);

  // Accumulate actors across all pages so the user dropdown stays populated
  const [actorRegistry, setActorRegistry] = useState<Map<string, AuditActor>>(new Map());

  // Don't fetch for Viewers — they see the 403 view immediately
  const isEditor = user?.role === 'EDITOR';

  const { data, isLoading, isError, error, refetch } = useAuditLog(
    isEditor ? filters : { ...DEFAULT_AUDIT_FILTERS, pageSize: 1 },
  );

  useEffect(() => {
    if (!data?.data?.length) return;
    setActorRegistry((prev) => {
      const next = new Map(prev);
      for (const entry of data.data) {
        if (entry.actor) next.set(entry.actor.id, entry.actor);
      }
      return next;
    });
  }, [data]);

  const handleFiltersChange = useCallback(
    (patch: Partial<AuditLogFilters>) => {
      const updated = { ...filters, ...patch };
      setSearchParams(filtersToParams(updated), { replace: true });
    },
    [filters, setSearchParams],
  );

  const handleClearAll = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handlePageChange = useCallback(
    (p: number) => handleFiltersChange({ page: p }),
    [handleFiltersChange],
  );

  const handlePageSizeChange = useCallback(
    (s: number) => handleFiltersChange({ pageSize: s, page: 1 }),
    [handleFiltersChange],
  );

  const actors = Array.from(actorRegistry.values());
  const total  = data?.meta?.total ?? 0;

  const hasActiveFilters =
    !!filters.dateFrom   ||
    !!filters.dateTo     ||
    !!filters.userId     ||
    !!filters.action     ||
    !!filters.entityType ||
    !!filters.search;

  // ── 403 guard ────────────────────────────────────────────────────────────
  if (!isEditor) {
    return <ForbiddenView />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <ScrollText size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-onBackground leading-tight">
              Audit Log
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              A complete record of all changes to inventory items, categories, and suppliers.
            </p>
          </div>
        </div>

        {/* Total badge — updates to reflect current filter */}
        {!isLoading && !isError && (
          <div className="flex items-center gap-2 self-center">
            <span className="text-sm text-muted-foreground tabular-nums">
              {total.toLocaleString('en-US')} entr{total === 1 ? 'y' : 'ies'}
              {hasActiveFilters && ' matching filters'}
            </span>
          </div>
        )}
      </div>

      {/* ── Filter toolbar ─────────────────────────────────────────── */}
      <div className="card p-4">
        <AuditLogFiltersBar
          filters={filters}
          actors={actors}
          onFiltersChange={handleFiltersChange}
          onClearAll={handleClearAll}
        />
      </div>

      {/* ── Table (all 4 states handled inside) ───────────────────── */}
      <AuditLogTable
        entries={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        errorMessage={
          error instanceof Error
            ? error.message
            : 'Failed to load audit log — check your connection and try again.'
        }
        onRetry={refetch}
        total={total}
        page={filters.page}
        pageSize={filters.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
}
