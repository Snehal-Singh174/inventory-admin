import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '../utils/api-client';
import { toast } from 'sonner';

export function useUsers() {
  const [state, setState] = useState({ status: 'loading' });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);

      const response = await apiClient.get(`/api/v1/users?${params.toString()}`);
      setState({ status: 'success', data: response.data, meta: response.meta });
    } catch (error) {
      setState({
        status: 'error',
        error: error.message || 'Failed to load users. Check your connection and try again.',
      });
    }
  }, [page, pageSize, search, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const createUser = useCallback(async (userData) => {
    const response = await apiClient.post('/api/v1/users', userData);
    load();
    return response;
  }, [load]);

  const changeRole = useCallback(async (userId, role) => {
    const response = await apiClient.patch(`/api/v1/users/${userId}`, { role });
    load();
    return response;
  }, [load]);

  const toggleActive = useCallback(async (userId) => {
    const response = await apiClient.patch(`/api/v1/users/${userId}/deactivate`);
    load();
    return response;
  }, [load]);

  const updateSearch = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const updateRoleFilter = useCallback((value) => {
    setRoleFilter(value);
    setPage(1);
  }, []);

  return {
    state,
    search,
    roleFilter,
    page,
    pageSize,
    updateSearch,
    updateRoleFilter,
    setPage,
    setPageSize,
    createUser,
    changeRole,
    toggleActive,
    retry: load,
  };
}
