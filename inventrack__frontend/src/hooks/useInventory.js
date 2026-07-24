import { useState, useCallback, useRef, useEffect } from 'react';
import { apiClient, ApiError } from '../utils/api-client';

const DEFAULT_PAGE_SIZE = 25;

export function useInventory() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ totalCount: 0, page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 0 });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    keyword: '',
    categoryId: '',
    status: '',
    minQuantity: '',
    maxQuantity: '',
  });
  const [sort, setSort] = useState({ sortBy: 'updatedAt', sortOrder: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const abortRef = useRef(null);

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(pageSize));
    if (sort.sortBy) params.set('sortBy', sort.sortBy);
    if (sort.sortOrder) params.set('sortOrder', sort.sortOrder);
    if (filters.keyword) params.set('keyword', filters.keyword);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.status) params.set('status', filters.status);
    if (filters.minQuantity) params.set('minQuantity', filters.minQuantity);
    if (filters.maxQuantity) params.set('maxQuantity', filters.maxQuantity);
    return params.toString();
  }, [page, pageSize, sort, filters]);

  const fetchItems = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const qs = buildQueryString();
      const response = await apiClient.get(`/api/v1/inventory?${qs}`);
      setItems(response.data);
      setMeta(response.meta);
      setStatus('success');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load inventory. Check your connection and try again.');
      }
      setStatus('error');
    }
  }, [buildQueryString]);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ keyword: '', categoryId: '', status: '', minQuantity: '', maxQuantity: '' });
    setPage(1);
  }, []);

  const hasActiveFilters = Boolean(
    filters.keyword || filters.categoryId || filters.status || filters.minQuantity || filters.maxQuantity
  );

  const updateSort = useCallback((column) => {
    setSort((prev) => {
      if (prev.sortBy === column) {
        return { sortBy: column, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' };
      }
      return { sortBy: column, sortOrder: 'asc' };
    });
    setPage(1);
  }, []);

  const updateItem = useCallback(async (id, changes) => {
    const response = await apiClient.patch(`/api/v1/inventory/${id}`, changes);
    setItems((prev) => prev.map((item) => (item.id === id ? response.data : item)));
    return response.data;
  }, []);

  const deleteItem = useCallback(async (id) => {
    await apiClient.delete(`/api/v1/inventory/${id}`);
    setItems((prev) => prev.filter((item) => item.id !== id));
    setMeta((prev) => ({ ...prev, totalCount: prev.totalCount - 1 }));
  }, []);

  const bulkUpdateStatus = useCallback(async (ids, newStatus) => {
    const response = await apiClient.patch('/api/v1/inventory/bulk-status', { ids, status: newStatus });
    setItems((prev) =>
      prev.map((item) => (ids.includes(item.id) ? { ...item, status: newStatus } : item))
    );
    return response.data;
  }, []);

  const bulkDelete = useCallback(async (ids) => {
    const response = await apiClient.patch('/api/v1/inventory/bulk-delete', { ids });
    setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
    setMeta((prev) => ({ ...prev, totalCount: prev.totalCount - ids.length }));
    return response.data;
  }, []);

  const exportItems = useCallback(async () => {
    const qs = buildQueryString();
    const blob = await apiClient.getBlob(`/api/v1/inventory/export?${qs}`);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().slice(0, 10);
    link.download = `inventory-export-${today}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [buildQueryString]);

  return {
    items,
    meta,
    status,
    error,
    filters,
    sort,
    page,
    pageSize,
    hasActiveFilters,
    fetchItems,
    updateFilter,
    clearFilters,
    updateSort,
    setPage,
    setPageSize,
    updateItem,
    deleteItem,
    bulkUpdateStatus,
    bulkDelete,
    exportItems,
  };
}

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/v1/categories');
      setCategories(response.data || []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { categories, loading, fetchCategories };
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/v1/suppliers');
      setSuppliers(response.data || []);
    } catch {
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { suppliers, loading, fetchSuppliers };
}
