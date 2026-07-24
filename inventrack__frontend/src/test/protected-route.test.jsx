import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock sonner
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
  Toaster: () => null,
}));

// Mock auth context
const mockUseAuth = vi.fn();
vi.mock('../context/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

import { ProtectedRoute } from '../components/ProtectedRoute';
import { toast } from 'sonner';

function renderWithRouter(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users to /login', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
    renderWithRouter(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>,
      { route: '/dashboard' }
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children for authenticated users without role requirement', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'Viewer' } });
    renderWithRouter(
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>,
      { route: '/dashboard' }
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects Viewer away from Editor-only routes with toast', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'Viewer' } });
    renderWithRouter(
      <ProtectedRoute requiredRole="Editor"><div>Editor Only</div></ProtectedRoute>,
      { route: '/audit-log' }
    );
    expect(screen.queryByText('Editor Only')).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalled();
  });

  it('allows Editor to access Editor-only routes', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, user: { role: 'Editor' } });
    renderWithRouter(
      <ProtectedRoute requiredRole="Editor"><div>Editor Only</div></ProtectedRoute>,
      { route: '/audit-log' }
    );
    expect(screen.getByText('Editor Only')).toBeInTheDocument();
  });
});
