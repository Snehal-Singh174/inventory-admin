import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/auth-context';
import AppLayout from '../components/AppLayout';

function renderAppLayout(role) {
  localStorage.setItem('inventrack_access_token', 'fake-token');
  localStorage.setItem('inventrack_user', JSON.stringify({
    id: '1', email: `${role.toLowerCase()}@inventrack.dev`, fullName: `Test ${role}`, role,
  }));

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider>
        <AppLayout>
          <div>Page Content</div>
        </AppLayout>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('AppLayout - Sidebar role-aware navigation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows Inventory nav link for Viewer', () => {
    renderAppLayout('Viewer');
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('hides Audit Log and Users for Viewer', () => {
    renderAppLayout('Viewer');
    expect(screen.queryByText('Audit Log')).not.toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('shows all nav items for Editor including Audit Log and Users', () => {
    renderAppLayout('Editor');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
    expect(screen.getByText('Audit Log')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('displays user name in topbar', () => {
    renderAppLayout('Editor');
    expect(screen.getByText('Test Editor')).toBeInTheDocument();
  });
});
