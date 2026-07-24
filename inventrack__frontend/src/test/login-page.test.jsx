import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/auth-context';
import LoginPage from '../pages/LoginPage';

const renderLogin = (initialEntries = ['/login']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
};

function getEmailInput() {
  return screen.getByLabelText('Email');
}

function getPasswordInput() {
  return screen.getByLabelText('Password');
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the sign-in form with email and password fields', () => {
    renderLogin();
    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders the brand panel with tagline on desktop', () => {
    renderLogin();
    expect(screen.getByText('One source of truth for stock, cost, and change history.')).toBeInTheDocument();
  });

  it('renders demo credentials table with Use buttons', () => {
    renderLogin();
    expect(screen.getByText('editor@inventrack.dev')).toBeInTheDocument();
    expect(screen.getByText('viewer@inventrack.dev')).toBeInTheDocument();
    const useButtons = screen.getAllByRole('button', { name: /use/i });
    expect(useButtons).toHaveLength(2);
  });

  it('autofills form when Use button is clicked for Editor', async () => {
    const user = userEvent.setup();
    renderLogin();

    const useButtons = screen.getAllByRole('button', { name: /use/i });
    await user.click(useButtons[0]);

    expect(getEmailInput()).toHaveValue('editor@inventrack.dev');
    expect(getPasswordInput()).toHaveValue('Editor123!');
  });

  it('autofills form when Use button is clicked for Viewer', async () => {
    const user = userEvent.setup();
    renderLogin();

    const useButtons = screen.getAllByRole('button', { name: /use/i });
    await user.click(useButtons[1]);

    expect(getEmailInput()).toHaveValue('viewer@inventrack.dev');
    expect(getPasswordInput()).toHaveValue('Viewer123!');
  });

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(getEmailInput(), 'notvalid');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    });
  });

  it('shows validation error for missing password', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(getEmailInput(), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('displays error banner on 401 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Invalid email or password', code: 'UNAUTHORIZED', status: 401 }),
    });

    const user = userEvent.setup();
    renderLogin();

    await user.type(getEmailInput(), 'wrong@test.com');
    await user.type(getPasswordInput(), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials — use the demo accounts below to sign in')).toBeInTheDocument();
    });
  });

  it('shows password toggle button', async () => {
    const user = userEvent.setup();
    renderLogin();

    const passwordInput = getPasswordInput();
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByLabelText(/show password/i);
    await user.click(toggleBtn);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('shows loading state when submitting', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { accessToken: 'tok', refreshToken: 'ref', user: { id: '1', email: 'e@e.com', fullName: 'Test', role: 'Editor' } },
          status: 200,
        }),
      }), 500))
    );

    const user = userEvent.setup();
    renderLogin();

    await user.type(getEmailInput(), 'editor@inventrack.dev');
    await user.type(getPasswordInput(), 'Editor123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Signing in…')).toBeInTheDocument();
    });
  });
});
