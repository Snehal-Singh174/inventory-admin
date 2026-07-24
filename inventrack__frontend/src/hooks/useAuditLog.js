import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api-client';

export function useAuditLog() {
  const [state, setState] = useState({ status: 'loading' });
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    userId: '',
    dateFrom: '',
    dateTo: '',
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (filters.entityType) params.set('entityType', filters.entityType);
      if (filters.action) params.set('action', filters.action);
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);

      const response = await apiClient.get(`/api/v1/audit-log?${params.toString()}`);
      setState({ status: 'success', data: response.data, meta: response.meta });
    } catch (error) {
      setState({
        status: 'error',
        error: error.message || 'Failed to load audit log. Check your connection and try again.',
      });
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ entityType: '', action: '', userId: '', dateFrom: '', dateTo: '' });
    setPage(1);
  }, []);

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return {
    state,
    filters,
    page,
    pageSize,
    hasActiveFilters,
    updateFilters,
    clearFilters,
    setPage,
    setPageSize,
    retry: load,
  };
}
