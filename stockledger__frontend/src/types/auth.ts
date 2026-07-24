/** Role values exactly as defined in the backend User model. */
export type UserRole = 'VIEWER' | 'EDITOR';

/** Authenticated user shape returned by /api/auth/me and /api/auth/login. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/** Shape of the data block returned by POST /api/auth/login. */
export interface LoginApiResponse {
  token: string;
  user: AuthUser;
}
