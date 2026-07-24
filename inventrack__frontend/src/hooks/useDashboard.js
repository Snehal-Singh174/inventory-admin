import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api-client';

export function useDashboard() {
  const [state, setState] = useState({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const response = await apiClient.get('/api/v1/dashboard/summary');
      setState({ status: 'success', data: response.data });
    } catch (error) {
      setState({
        status: 'error',
        error: error.message || 'Failed to load dashboard. Check your connection and try again.',
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { state, retry: load };
}
