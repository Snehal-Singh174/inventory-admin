/**
 * API Client — central fetch utility with 10s timeout + 2-retry exponential backoff.
 * All requests attach Bearer token from localStorage when available.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function fetchWithTimeout(url, options, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry(url, options, retries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);

      if (response.ok) {
        const data = await response.json();
        return data;
      }

      const errorBody = await response.json().catch(() => ({}));
      const apiError = new ApiError(
        errorBody.error || `Request failed with status ${response.status}`,
        response.status,
        errorBody.code || 'UNKNOWN'
      );

      if (response.status >= 400 && response.status < 500) {
        throw apiError;
      }

      lastError = apiError;
    } catch (error) {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      if (error.name === 'AbortError') {
        lastError = new ApiError('Request timed out', 408, 'TIMEOUT');
      } else if (!(error instanceof ApiError)) {
        lastError = new ApiError(
          'Network error — check your connection',
          0,
          'NETWORK_ERROR'
        );
      } else {
        lastError = error;
      }
    }

    if (attempt < retries) {
      const delay = Math.pow(2, attempt) * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

function getAuthHeaders() {
  const token = localStorage.getItem('inventrack_access_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function fetchBlobWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new ApiError(
        errorBody.error || `Export failed with status ${response.status}`,
        response.status,
        errorBody.code || 'UNKNOWN'
      );
    }

    return response.blob();
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  get(endpoint) {
    return fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
  },

  post(endpoint, body) {
    return fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
  },

  patch(endpoint, body) {
    return fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
  },

  delete(endpoint, body) {
    return fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  getBlob(endpoint) {
    return fetchBlobWithTimeout(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
  },
};

export { ApiError };
export default apiClient;
