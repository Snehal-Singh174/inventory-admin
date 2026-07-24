import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Wraps all authenticated routes.
 * - While the session is being validated: shows a page-shape skeleton
 *   (matches the AppLayout structure — avoids layout flash).
 * - No valid user: redirects to /login (replaces history entry so the back
 *   button doesn't loop back to a protected route).
 * - Valid user: renders children via <Outlet />.
 */
export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex bg-background"
        aria-live="polite"
        aria-busy="true"
        aria-label="Loading your session"
      >
        {/* Sidebar skeleton */}
        <div className="w-60 bg-sidebar flex-shrink-0 flex flex-col p-4 gap-4">
          <div className="skeleton h-8 w-36 rounded-md mb-4" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`nav-skel-${i}`} className="skeleton h-9 w-full rounded-lg" />
          ))}
        </div>
        {/* Main area skeleton */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-14 bg-headerBg border-b border-headerBorder flex items-center px-6 gap-4">
            <div className="skeleton h-5 w-40 rounded" />
            <div className="ml-auto skeleton h-8 w-8 rounded-full" />
          </div>
          <div className="p-6 space-y-4">
            <div className="skeleton h-7 w-48 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`card-skel-${i}`} className="skeleton h-24 rounded-lg" />
              ))}
            </div>
            <div className="skeleton h-64 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
