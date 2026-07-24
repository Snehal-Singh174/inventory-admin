/**
 * Central API fetch wrapper.
 * - 10-second AbortController timeout on every request
 * - 2-retry exponential backoff for network errors and timeouts
 * - Automatic JWT attachment from localStorage / sessionStorage
 * - 401 interceptor: clears token and hard-redirects to /login when a
 *   stored session token is present (expired session), otherwise throws
 *   so the login form can display the inline error banner.
 */

const _rawBase = (import.meta.env.VITE_API_BASE_URL as string) ?? '';
// Render's `fromService.host` returns a bare hostname — ensure it has a scheme.
const BASE_URL = _rawBase && !_rawBase.startsWith('http') ? `https://${_rawBase}` : _rawBase;
const MAX_RETRIES = 2;
const TIMEOUT_MS = 10_000;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface FetchOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

/** Read token from persistent (localStorage) or session (sessionStorage) storage. */
function getStoredToken(): string | null {
  return (
    localStorage.getItem('sl_token') ?? sessionStorage.getItem('sl_token')
  );
}

/** Clear token from both storages (used on logout or 401 with existing session). */
export function clearStoredToken(): void {
  localStorage.removeItem('sl_token');
  sessionStorage.removeItem('sl_token');
}

/** Persist token; `persistent=true` survives browser close. */
export function storeToken(token: string, persistent: boolean): void {
  if (persistent) {
    localStorage.setItem('sl_token', token);
  } else {
    sessionStorage.setItem('sl_token', token);
  }
}

async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
  attempt = 0,
): Promise<T> {
  const token = getStoredToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    // Retry only on network / timeout errors, not on HTTP-level failures
    if (attempt < MAX_RETRIES) {
      const backoffMs = Math.pow(2, attempt) * 500; // 500ms → 1000ms
      await new Promise(r => setTimeout(r, backoffMs));
      return apiFetch<T>(path, options, attempt + 1);
    }
    const isTimeout =
      err instanceof Error && err.name === 'AbortError';
    throw new Error(
      isTimeout
        ? 'Request timed out — please try again'
        : 'Network error — check your connection and try again',
    );
  }

  clearTimeout(timeoutId);

  // 401 handling: session-expired vs. bad credentials
  if (res.status === 401) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    if (token) {
      // Existing session has expired — hard redirect clears all React state cleanly
      clearStoredToken();
      window.location.href = '/login';
    }
    throw new Error(body.error ?? 'Invalid credentials');
  }

  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({})) as { error?: string; message?: string };
    throw new Error(
      body.error ?? body.message ?? `Request failed (${res.status})`,
    );
  }

  // 204 No Content — DELETE and some other endpoints return no body
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  // Backend wraps responses in { data: ... } via sendData()
  const payload = await res.json() as { data: T } | T;
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'data' in (payload as object)
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

/**
 * Like apiFetch but returns the FULL response body without data-unwrapping.
 * Required for paginated list endpoints that return { data: T[], meta: ListMeta }.
 */
async function apiFetchFull<T>(path: string, attempt = 0): Promise<T> {
  const token = getStoredToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method: 'GET', headers, signal: controller.signal });
  } catch (err) {
    clearTimeout(timeoutId);
    if (attempt < MAX_RETRIES) {
      const backoffMs = Math.pow(2, attempt) * 500;
      await new Promise(r => setTimeout(r, backoffMs));
      return apiFetchFull<T>(path, attempt + 1);
    }
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    throw new Error(isTimeout ? 'Request timed out — please try again' : 'Network error — check your connection and try again');
  }

  clearTimeout(timeoutId);

  if (res.status === 401) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    if (token) { clearStoredToken(); window.location.href = '/login'; }
    throw new Error(body.error ?? 'Invalid credentials');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(body.error ?? body.message ?? `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get:     <T>(path: string)                  => apiFetch<T>(path, { method: 'GET' }),
  /** For paginated endpoints returning { data: T[], meta: ListMeta } — no data-unwrapping. */
  getList: <T>(path: string)                  => apiFetchFull<T>(path),
  post:    <T>(path: string, body?: unknown)  => apiFetch<T>(path, { method: 'POST', body }),
  put:     <T>(path: string, body?: unknown)  => apiFetch<T>(path, { method: 'PUT', body }),
  patch:   <T>(path: string, body?: unknown)  => apiFetch<T>(path, { method: 'PATCH', body }),
  delete:  <T>(path: string)                  => apiFetch<T>(path, { method: 'DELETE' }),
};
