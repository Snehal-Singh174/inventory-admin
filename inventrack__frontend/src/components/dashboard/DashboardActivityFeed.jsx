import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Activity, ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';

const ACTION_STYLES = {
  create: 'bg-successBackground text-success',
  update: 'bg-infoBackground text-info',
  delete: 'bg-errorBackground text-error',
  bulk_delete: 'bg-errorBackground text-error',
  bulk_status_update: 'bg-warningBackground text-warning',
};

function getTimeAgo(dateStr) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return 'recently';
  }
}

export function DashboardActivityFeed({ activities, onViewAll }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6 text-center">
        <Activity size={32} className="text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">No recent activity</p>
        <p className="text-xs text-muted-foreground mt-1">
          Actions on inventory items will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        <button
          onClick={onViewAll}
          className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          View full audit log
          <ArrowRight size={14} />
        </button>
      </div>
      <div className="divide-y divide-border">
        {activities.map((entry) => (
          <div key={`activity-${entry.id}`} className="px-5 py-3 flex items-center gap-3">
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider flex-shrink-0',
                ACTION_STYLES[entry.action] || 'bg-accent text-accent-foreground'
              )}
            >
              {entry.action?.replace('_', ' ')}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">
                <span className="font-medium">{entry.performer?.fullName || 'System'}</span>
                {' '}
                <span className="text-muted-foreground">
                  {entry.action === 'create' ? 'created' : entry.action === 'delete' ? 'deleted' : 'updated'}
                </span>
                {' '}
                <span className="font-medium">{entry.entityType}</span>
                {entry.entityName && (
                  <span className="text-muted-foreground"> "{entry.entityName}"</span>
                )}
              </p>
            </div>
            <time className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
              {getTimeAgo(entry.createdAt)}
            </time>
          </div>
        ))}
      </div>
    </div>
  );
}
