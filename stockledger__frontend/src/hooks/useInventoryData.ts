/**
 * Central data-fetching layer for Inventory screens.
 * All mutations invalidate their related queries for automatic UI refresh.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/apiClient';
import type {
  InventoryItem,
  ApiListResponse,
  ItemFilters,
  AuditLogEntry,
} from '../types/inventory';
import type { Category, Supplier } from '../types/referenceData';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) ?? '';

// ── Query-string builder ──────────────────────────────────────────────────────

export function buildItemsQueryString(filters: Omit<ItemFilters, 'page' | 'pageSize'> & { page?: number; pageSize?: number }): string {
  const p = new URLSearchParams();
  if (filters.keyword.trim())        p.set('keyword', filters.keyword.trim());
  if (filters.categoryIds.length)    p.set('category', filters.categoryIds.join(','));
  if (filters.status)                p.set('status', filters.status);
  if (filters.quantityMin.trim())    p.set('quantityMin', filters.quantityMin.trim());
  if (filters.quantityMax.trim())    p.set('quantityMax', filters.quantityMax.trim());
  p.set('sortBy', filters.sortBy || 'created_at');
  p.set('sortOrder', filters.sortOrder || 'desc');
  if (filters.page != null)         p.set('page', String(filters.page));
  if (filters.pageSize != null)     p.set('pageSize', String(filters.pageSize));
  return p.toString();
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Paginated, filtered, sorted item list. */
export function useInventoryItems(filters: ItemFilters) {
  const qs = buildItemsQueryString(filters);
  return useQuery<ApiListResponse<InventoryItem>>({
    queryKey: ['inventory-items', qs],
    queryFn: () => api.getList<ApiListResponse<InventoryItem>>(`/api/items?${qs}`),
    placeholderData: (prev) => prev,
  });
}

/** Four headline counts for KPI cards — each is a lightweight count-only query. */
export function useInventoryKpis() {
  const totalQ = useQuery<ApiListResponse<InventoryItem>>({
    queryKey: ['inv-kpi-total'],
    queryFn: () => api.getList<ApiListResponse<InventoryItem>>('/api/items?pageSize=1'),
    staleTime: 30_000,
  });
  const activeQ = useQuery<ApiListResponse<InventoryItem>>({
    queryKey: ['inv-kpi-active'],
    queryFn: () => api.getList<ApiListResponse<InventoryItem>>('/api/items?pageSize=1&status=ACTIVE'),
    staleTime: 30_000,
  });
  const lowStockQ = useQuery<ApiListResponse<InventoryItem>>({
    queryKey: ['inv-kpi-lowstock'],
    queryFn: () => api.getList<ApiListResponse<InventoryItem>>('/api/items?pageSize=1&status=ACTIVE&quantityMax=10'),
    staleTime: 30_000,
  });
  const discontinuedQ = useQuery<ApiListResponse<InventoryItem>>({
    queryKey: ['inv-kpi-disc'],
    queryFn: () => api.getList<ApiListResponse<InventoryItem>>('/api/items?pageSize=1&status=DISCONTINUED'),
    staleTime: 30_000,
  });
  return {
    totalSkus:       totalQ.data?.meta.total ?? 0,
    activeSkus:      activeQ.data?.meta.total ?? 0,
    lowStockItems:   lowStockQ.data?.meta.total ?? 0,
    discontinuedSkus: discontinuedQ.data?.meta.total ?? 0,
    isLoading: totalQ.isLoading || activeQ.isLoading || lowStockQ.isLoading || discontinuedQ.isLoading,
  };
}

/** Single inventory item by id. */
export function useInventoryItem(id: string) {
  return useQuery<InventoryItem>({
    queryKey: ['inventory-item', id],
    queryFn: () => api.get<InventoryItem>(`/api/items/${id}`),
    enabled: !!id,
    retry: 1,
  });
}

/** PATCH /api/items/:id */
export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation<InventoryItem, Error, { id: string; updates: Partial<InventoryItem> }>({
    mutationFn: ({ id, updates }) => api.patch<InventoryItem>(`/api/items/${id}`, updates),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['inventory-items'] });
      qc.invalidateQueries({ queryKey: ['inventory-item', id] });
      qc.invalidateQueries({ queryKey: ['inv-kpi-active'] });
      qc.invalidateQueries({ queryKey: ['inv-kpi-lowstock'] });
      qc.invalidateQueries({ queryKey: ['inv-kpi-disc'] });
    },
  });
}

/** DELETE /api/items/:id */
export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete<void>(`/api/items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items'] });
      qc.invalidateQueries({ queryKey: ['inv-kpi-total'] });
      qc.invalidateQueries({ queryKey: ['inv-kpi-active'] });
      qc.invalidateQueries({ queryKey: ['inv-kpi-disc'] });
    },
  });
}

/** POST /api/items/bulk-delete */
export function useBulkDelete() {
  const qc = useQueryClient();
  return useMutation<{ deletedCount: number }, Error, string[]>({
    mutationFn: (ids) => api.post<{ deletedCount: number }>('/api/items/bulk-delete', { ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items'] });
      qc.invalidateQueries({ queryKey: ['inv-kpi-total'] });
      qc.invalidateQueries({ queryKey: ['inv-kpi-active'] });
      qc.invalidateQueries({ queryKey: ['inv-kpi-disc'] });
    },
  });
}

/** POST /api/items/bulk-status */
export function useBulkStatus() {
  const qc = useQueryClient();
  return useMutation<{ updatedCount: number }, Error, { ids: string[]; status: string }>({
    mutationFn: ({ ids, status }) => api.post<{ updatedCount: number }>('/api/items/bulk-status', { ids, status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items'] });
      qc.invalidateQueries({ queryKey: ['inv-kpi-active'] });
      qc.invalidateQueries({ queryKey: ['inv-kpi-disc'] });
    },
  });
}

/** GET /api/categories — shared with reference-data settings. */
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get<Category[]>('/api/categories'),
    staleTime: 120_000,
  });
}

/** GET /api/suppliers */
export function useSuppliers() {
  return useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: () => api.get<Supplier[]>('/api/suppliers'),
    staleTime: 120_000,
  });
}

/** GET /api/audit-log/:entityId — EDITOR only, scoped to one item. */
export function useItemAuditLog(id: string, enabled: boolean) {
  return useQuery<ApiListResponse<AuditLogEntry>>({
    queryKey: ['audit-log', id],
    queryFn: () => api.getList<ApiListResponse<AuditLogEntry>>(`/api/audit-log/${id}?pageSize=50`),
    enabled: enabled && !!id,
  });
}

/**
 * Browser download for the current filtered view.
 * Uses raw fetch (binary blob) — the normal apiClient is for JSON only.
 */
export async function exportInventoryItems(filterQs: string): Promise<void> {
  const token = localStorage.getItem('sl_token') ?? sessionStorage.getItem('sl_token');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/items/export${filterQs ? `?${filterQs}` : ''}`, {
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    throw new Error(isTimeout ? 'Export timed out — try narrowing your filters' : 'Export failed — check your connection');
  }

  clearTimeout(timeoutId);

  if (!res.ok) throw new Error(`Export failed (${res.status})`);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `inventory-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
