import React, { useState } from 'react';
import { ShieldOff, ShieldCheck, KeyRound } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ConfirmDialog } from '../ui/ConfirmDialog';

function formatDate(dateStr) {
  if (!dateStr) return 'Never';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Unknown';
  }
}

const ROLE_OPTIONS = ['Viewer', 'Editor'];

export function UsersTable({ users, currentUserId, onRoleChange, onToggleActive }) {
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [editingRoleId, setEditingRoleId] = useState(null);

  const handleRoleClick = (user) => {
    if (user.id === currentUserId) return;
    setEditingRoleId(user.id);
  };

  const handleRoleSelect = (user, newRole) => {
    setEditingRoleId(null);
    if (newRole === user.role) return;
    setConfirmDialog({
      type: 'role',
      title: `Change ${user.fullName}'s role?`,
      description: `Change role from ${user.role} to ${newRole}? This takes effect immediately.`,
      onConfirm: () => {
        onRoleChange(user.id, newRole);
        setConfirmDialog(null);
      },
    });
  };

  const handleDeactivate = (user) => {
    const isActive = user.isActive;
    setConfirmDialog({
      type: 'deactivate',
      title: `${isActive ? 'Deactivate' : 'Reactivate'} ${user.fullName}?`,
      description: isActive
        ? `${user.fullName} will be immediately signed out and unable to log in.`
        : `${user.fullName} will be able to log in again.`,
      onConfirm: () => {
        onToggleActive(user.id);
        setConfirmDialog(null);
      },
    });
  };

  return (
    <>
      <div className="bg-surface border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/30">
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Login</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <tr key={`user-row-${user.id}`} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">
                    {user.fullName}
                    {isSelf && <span className="ml-1.5 text-[10px] text-muted-foreground">(you)</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap font-mono text-xs">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    {editingRoleId === user.id ? (
                      <select
                        autoFocus
                        defaultValue={user.role}
                        onChange={(e) => handleRoleSelect(user, e.target.value)}
                        onBlur={() => setEditingRoleId(null)}
                        className="h-7 px-2 rounded border border-input bg-background text-xs text-foreground focus:ring-2 focus:ring-ring"
                        aria-label={`Change role for ${user.fullName}`}
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={`role-opt-${role}`} value={role}>{role}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => handleRoleClick(user)}
                        disabled={isSelf}
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-colors',
                          user.role === 'Editor'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-info/10 text-info',
                          !isSelf && 'hover:ring-1 hover:ring-ring cursor-pointer',
                          isSelf && 'cursor-not-allowed opacity-70'
                        )}
                        title={isSelf ? 'You cannot change your own role' : `Click to change role`}
                        aria-label={isSelf ? 'You cannot change your own role' : `Change ${user.fullName}'s role from ${user.role}`}
                      >
                        {user.role}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      user.isActive
                        ? 'bg-successBackground text-success'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {user.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(user.lastLoginAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeactivate(user)}
                        disabled={isSelf}
                        className={cn(
                          'p-1.5 rounded-md transition-colors',
                          isSelf
                            ? 'text-muted-foreground/40 cursor-not-allowed'
                            : user.isActive
                              ? 'text-muted-foreground hover:bg-error/10 hover:text-error'
                              : 'text-muted-foreground hover:bg-success/10 hover:text-success'
                        )}
                        aria-label={isSelf ? 'You cannot deactivate yourself' : user.isActive ? `Deactivate ${user.fullName}` : `Reactivate ${user.fullName}`}
                        title={isSelf ? 'You cannot deactivate yourself' : user.isActive ? 'Deactivate' : 'Reactivate'}
                      >
                        {user.isActive ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                      </button>
                      <button
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        aria-label={`Reset password for ${user.fullName}`}
                        title="Reset password"
                      >
                        <KeyRound size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(confirmDialog)}
        onClose={() => setConfirmDialog(null)}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        title={confirmDialog?.title || ''}
        description={confirmDialog?.description || ''}
        confirmLabel={confirmDialog?.type === 'deactivate' ? 'Confirm' : 'Change Role'}
        variant={confirmDialog?.type === 'deactivate' ? 'destructive' : 'warning'}
      />
    </>
  );
}
