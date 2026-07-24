import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { api, storeToken, clearStoredToken } from '../lib/apiClient';
import type { AuthUser, LoginApiResponse } from '../types/auth';

interface AuthContextValue {
  /** Authenticated user, or null when logged out / loading. */
  user: AuthUser | null;
  /** True while the initial token-validation request is in flight. */
  isLoading: boolean;
  /**
   * Authenticate with email + password.
   * `rememberMe=true` stores the token in localStorage (survives browser close).
   * Throws with a user-visible message on failure.
   */
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  /** Clear session. Navigate to /login in the calling component. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: validate any existing stored token
  useEffect(() => {
    const token =
      localStorage.getItem('sl_token') ??
      sessionStorage.getItem('sl_token');

    if (!token) {
      setIsLoading(false);
      return;
    }

    api
      .get<AuthUser>('/api/auth/me')
      .then(userData => setUser(userData))
      .catch(() => {
        // Token is invalid or expired — clear it silently
        clearStoredToken();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (
    email: string,
    password: string,
    rememberMe = false,
  ): Promise<void> => {
    const { token, user: authUser } = await api.post<LoginApiResponse>(
      '/api/auth/login',
      { email, password },
    );
    storeToken(token, rememberMe);
    setUser(authUser);
  };

  const logout = (): void => {
    clearStoredToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be called inside <AuthProvider>');
  }
  return ctx;
}
