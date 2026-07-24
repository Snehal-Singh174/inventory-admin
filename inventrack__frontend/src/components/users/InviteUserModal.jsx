import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Loader2 } from 'lucide-react';
import Button from '../ui/Button';

export function InviteUserModal({ open, onClose, onSubmit }) {
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { fullName: '', email: '', role: 'Viewer' },
  });

  if (!open) return null;

  const onFormSubmit = async (data) => {
    setServerError('');
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      setServerError(error.message || 'Failed to create user. Try again.');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setServerError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md bg-surface rounded-lg shadow-elevation-4 animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-modal-title"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 id="invite-modal-title" className="text-lg font-semibold text-foreground">
            Invite User
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-5 space-y-4">
          {serverError && (
            <div className="bg-errorBackground border border-error/20 rounded-md p-3" role="alert">
              <p className="text-sm text-error">{serverError}</p>
            </div>
          )}

          <div>
            <label htmlFor="invite-name" className="block text-sm font-medium text-foreground mb-1">
              Full Name
            </label>
            <input
              id="invite-name"
              type="text"
              placeholder="e.g. Priya Sharma"
              {...register('fullName', {
                required: 'Name is required',
                minLength: { value: 1, message: 'Name is required' },
                maxLength: { value: 100, message: 'Name must be 100 characters or fewer' },
              })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            {errors.fullName && (
              <p className="text-xs text-error mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              placeholder="name@company.com"
              {...register('email', {
                required: 'Enter a valid email address',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address',
                },
              })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            {errors.email && (
              <p className="text-xs text-error mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="invite-role" className="block text-sm font-medium text-foreground mb-1">
              Role
            </label>
            <select
              id="invite-role"
              {...register('role', { required: 'Select a role' })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:ring-2 focus:ring-ring"
            >
              <option value="Viewer">Viewer</option>
              <option value="Editor">Editor</option>
            </select>
            {errors.role && (
              <p className="text-xs text-error mt-1">{errors.role.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                  Sending…
                </>
              ) : (
                'Send Invite'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
