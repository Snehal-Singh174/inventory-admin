/* SCREEN PLAN: User Management
 * Grid: N/A — full-width table
 * Sections: Page Header (title + Invite User CTA) → Filter Toolbar (search + role) → Users Table → Pagination
 * States: loading skeleton (6-col table) / error alert + retry / empty "No users match your filters" + clear / success table
 * Copy: "Users", "{totalCount} accounts", "Invite User", "No users match your filters."
 * Slop risks: Missing self-modification block, no confirm dialogs, generic table without role editing
 */
import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../context/auth-context';
import { useUsers } from '../hooks/useUsers';
import { UsersTable } from '../components/users/UsersTable';
import { InviteUserModal } from '../components/users/InviteUserModal';
import { Pagination } from '../components/inventory/Pagination';
import { AlertCircle, RefreshCw, UserPlus, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import { toast } from 'sonner';

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const {
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
    retry,
  } = useUsers();
  const [inviteOpen, setInviteOpen] = useState(false);

  const totalCount = state.status === 'success' ? state.meta?.totalCount || 0 : 0;
  const totalPages = state.status === 'success' ? state.meta?.totalPages || 1 : 1;

  const handleInvite = async (data) => {
    try {
      const response = await createUser(data);
      toast.success(`Invitation sent to ${data.email}`);
      if (response?.data?.temporaryPassword) {
        toast.info(`Temporary password: ${response.data.temporaryPassword}`, { duration: 10000 });
      }
      setInviteOpen(false);
    } catch (error) {
      throw error;
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await changeRole(userId, newRole);
      toast.success('Role updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update role');
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await toggleActive(userId);
      toast.success('User status updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update user status');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Users</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {state.status === 'success'
                ? `${totalCount.toLocaleString()} account${totalCount !== 1 ? 's' : ''}`
                : 'Loading accounts…'}
            </p>
          </div>
          <Button onClick={() => setInviteOpen(true)} className="self-start sm:self-auto">
            <UserPlus size={16} className="mr-2" />
            Invite User
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:ring-2 focus:ring-ring w-64"
            aria-label="Search users"
          />
          <select
            value={roleFilter}
            onChange={(e) => updateRoleFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:ring-2 focus:ring-ring"
            aria-label="Filter by role"
          >
            <option value="">All Roles</option>
            <option value="Editor">Editor</option>
            <option value="Viewer">Viewer</option>
          </select>
        </div>

        {/* Loading */}
        {state.status === 'loading' && <UsersTableSkeleton />}

        {/* Error */}
        {state.status === 'error' && (
          <div className="bg-errorBackground border border-error/20 rounded-lg p-6 flex items-start gap-3" role="alert">
            <AlertCircle size={20} className="text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-error">
                Failed to load users. Check your connection and try again.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={retry} className="flex-shrink-0">
              <RefreshCw size={14} className="mr-1.5" />
              Retry
            </Button>
          </div>
        )}

        {/* Empty */}
        {state.status === 'success' && state.data?.length === 0 && (
          <div className="bg-surface border border-border rounded-lg p-12 text-center">
            <Users size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No users match your filters.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your search or role filter.
            </p>
          </div>
        )}

        {/* Table */}
        {state.status === 'success' && state.data?.length > 0 && (
          <>
            <UsersTable
              users={state.data}
              currentUserId={currentUser?.id}
              onRoleChange={handleRoleChange}
              onToggleActive={handleToggleActive}
            />
            <Pagination
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              totalPages={totalPages}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}

        {/* Invite Modal */}
        <InviteUserModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          onSubmit={handleInvite}
        />
      </div>
    </AppLayout>
  );
}

function UsersTableSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden animate-pulse">
      <div className="grid grid-cols-6 gap-4 px-5 py-3 border-b border-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`uhdr-skel-${i}`} className="h-4 bg-muted rounded" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={`urow-skel-${i}`} className="grid grid-cols-6 gap-4 px-5 py-4 border-b border-border last:border-b-0">
          <div className="h-4 bg-muted/60 rounded" />
          <div className="h-4 bg-muted/60 rounded" />
          <div className="h-4 bg-muted/60 rounded w-3/4" />
          <div className="h-4 bg-muted/60 rounded w-1/2" />
          <div className="h-4 bg-muted/60 rounded" />
          <div className="h-4 bg-muted/60 rounded w-1/3" />
        </div>
      ))}
    </div>
  );
}

export default UserManagementPage;
