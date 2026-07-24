/**
 * Data-fetching hook for the Audit Log screen.
 * Uses TanStack Query with placeholderData to preserve the previous page
 * during pagination so the table never blanks out mid-navigation.
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import type { AuditLogEntry, ApiListResponse } from '../types/inventory';

export interface AuditLogFilters {
  dateFrom:   string;
  dateTo:     string;
  userId:     string;
  action:     string;
  entityType: string;
  search:     string;
  page:       number;
  pageSize:   number;
}

export const DEFAULT_AUDIT_FILTERS: AuditLogFilters = {
  dateFrom:   '',
  dateTo:     '',
  userId:     '',
  action:     '',
  entityType: '',
  search:     '',
  page:       1,
  pageSize:   25,
};

export function buildAuditQueryString(filters: AuditLogFilters): string {
  const p = new URLSearchParams();
  if (filters.dateFrom)   p.set('dateFrom',   filters.dateFrom);
  if (filters.dateTo)     p.set('dateTo',     filters.dateTo);
  if (filters.userId)     p.set('userId',     filters.userId);
  if (filters.action)     p.set('action',     filters.action);
  if (filters.entityType) p.set('entityType', filters.entityType);
  if (filters.search)     p.set('search',     filters.search);
  p.set('page',     String(filters.page));
  p.set('pageSize', String(filters.pageSize));
  return p.toString();
}

export function useAuditLog(filters: AuditLogFilters) {
  const qs = buildAuditQueryString(filters);
  return useQuery<ApiListResponse<AuditLogEntry>>({
    queryKey: ['audit-log', qs],
    queryFn: () =>
      api.getList<ApiListResponse<AuditLogEntry>>(`/api/audit-log?${qs}`),
    placeholderData: (prev) => prev,
  });
}
