import React from 'react';

export function DashboardSkeleton({ isEditor }) {
  return (
    <div className="space-y-6">
      {/* KPI Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-surface border border-border rounded-lg p-5 animate-pulse">
          <div className="h-3 w-32 bg-muted rounded mb-3" />
          <div className="h-9 w-40 bg-muted rounded" />
        </div>
        <div className="bg-surface border border-border rounded-lg p-5 animate-pulse">
          <div className="h-3 w-24 bg-muted rounded mb-3" />
          <div className="h-9 w-20 bg-muted rounded" />
        </div>
        <div className="bg-surface border border-border rounded-lg p-5 animate-pulse">
          <div className="h-3 w-28 bg-muted rounded mb-3" />
          <div className="h-9 w-16 bg-muted rounded" />
        </div>
        <div className="bg-surface border border-border rounded-lg p-5 animate-pulse">
          <div className="h-3 w-32 bg-muted rounded mb-3" />
          <div className="h-9 w-16 bg-muted rounded" />
        </div>
        <div className="bg-surface border border-border rounded-lg p-5 animate-pulse">
          <div className="h-3 w-28 bg-muted rounded mb-3" />
          <div className="h-9 w-16 bg-muted rounded" />
        </div>
      </div>
      {/* Chart skeleton */}
      <div className="bg-surface border border-border rounded-lg p-5 animate-pulse">
        <div className="h-5 w-48 bg-muted rounded mb-4" />
        <div className="h-[280px] bg-muted/50 rounded" />
      </div>
      {/* Activity feed skeleton (Editor only) */}
      {isEditor && (
        <div className="bg-surface border border-border rounded-lg animate-pulse">
          <div className="px-5 pt-5 pb-3">
            <div className="h-5 w-36 bg-muted rounded" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={`skel-feed-${i}`} className="px-5 py-3 flex items-center gap-3">
                <div className="h-5 w-16 bg-muted rounded" />
                <div className="flex-1 h-4 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
