import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersTable } from '../components/users/UsersTable';
import { InviteUserModal } from '../components/users/InviteUserModal';

const mockUsers = [
  {
    id: 'user-1',
    fullName: 'Aisha Patel',
    email: 'aisha@inventrack.dev',
    role: 'Editor',
    isActive: true,
    lastLoginAt: '2026-07-23T10:00:00Z',
  },
  {
    id: 'user-2',
    fullName: 'Marcus Lee',
    email: 'marcus@inventrack.dev',
    role: 'Viewer',
    isActive: true,
    lastLoginAt: '2026-07-22T08:30:00Z',
  },
  {
    id: 'user-3',
    fullName: 'Elena Rodriguez',
    email: 'elena@inventrack.dev',
    role: 'Viewer',
    isActive: false,
    lastLoginAt: null,
  },
];

describe('UsersTable', () => {
  it('renders all users with all columns', () => {
    render(
      <UsersTable
        users={mockUsers}
        currentUserId="user-1"
        onRoleChange={() => {}}
        onToggleActive={() => {}}
      />
    );
    expect(screen.getByText('Aisha Patel')).toBeInTheDocument();
    expect(screen.getByText('Marcus Lee')).toBeInTheDocument();
    expect(screen.getByText('Elena Rodriguez')).toBeInTheDocument();
    expect(screen.getByText('aisha@inventrack.dev')).toBeInTheDocument();
    expect(screen.getByText('(you)')).toBeInTheDocument();
  });

  it('shows Active/Deactivated status badges', () => {
    render(
      <UsersTable
        users={mockUsers}
        currentUserId="user-1"
        onRoleChange={() => {}}
        onToggleActive={() => {}}
      />
    );
    const activeBadges = screen.getAllByText('Active');
    expect(activeBadges.length).toBe(2);
    expect(screen.getByText('Deactivated')).toBeInTheDocument();
  });

  it('disables role edit for current user (self)', () => {
    render(
      <UsersTable
        users={mockUsers}
        currentUserId="user-1"
        onRoleChange={() => {}}
        onToggleActive={() => {}}
      />
    );
    const selfRoleButton = screen.getByLabelText('You cannot change your own role');
    expect(selfRoleButton).toBeDisabled();
  });

  it('opens confirm dialog when changing another user role', () => {
    render(
      <UsersTable
        users={mockUsers}
        currentUserId="user-1"
        onRoleChange={() => {}}
        onToggleActive={() => {}}
      />
    );
    // Click Marcus's role badge to edit
    const marcusRoleBtn = screen.getByLabelText("Change Marcus Lee's role from Viewer");
    fireEvent.click(marcusRoleBtn);
    // A select dropdown should appear
    const roleSelect = screen.getByLabelText("Change role for Marcus Lee");
    fireEvent.change(roleSelect, { target: { value: 'Editor' } });
    // Confirm dialog should appear
    expect(screen.getByText("Change Marcus Lee's role?")).toBeInTheDocument();
  });

  it('blocks deactivation of own account', () => {
    render(
      <UsersTable
        users={mockUsers}
        currentUserId="user-1"
        onRoleChange={() => {}}
        onToggleActive={() => {}}
      />
    );
    const selfDeactivateBtn = screen.getByLabelText('You cannot deactivate yourself');
    expect(selfDeactivateBtn).toBeDisabled();
  });
});

describe('InviteUserModal', () => {
  it('does not render when closed', () => {
    render(<InviteUserModal open={false} onClose={() => {}} onSubmit={() => {}} />);
    expect(screen.queryByText('Invite User')).not.toBeInTheDocument();
  });

  it('renders form when open with all fields', () => {
    render(<InviteUserModal open={true} onClose={() => {}} onSubmit={() => {}} />);
    expect(screen.getByText('Invite User')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(screen.getByText('Send Invite')).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    render(<InviteUserModal open={true} onClose={() => {}} onSubmit={() => {}} />);
    fireEvent.click(screen.getByText('Send Invite'));
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('calls onSubmit with form data', async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    render(<InviteUserModal open={true} onClose={() => {}} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@company.com' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'Editor' } });
    fireEvent.click(screen.getByText('Send Invite'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        fullName: 'Test User',
        email: 'test@company.com',
        role: 'Editor',
      });
    });
  });
});
