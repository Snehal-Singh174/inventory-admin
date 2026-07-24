import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

const ACTION_BADGE_STYLES = {
  create: 'bg-successBackground text-success',
  update: 'bg-infoBackground text-info',
  delete: 'bg-errorBackground text-error',
  bulk_delete: 'bg-errorBackground text-error',
  bulk_status_update: 'bg-warningBackground text-warning',
};

function formatTimestamp(dateStr) {
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${date} at ${time}`;
  } catch {
    return dateStr;
  }
}

function DiffPanel({ beforeValues, afterValues }) {
  const allKeys = new Set([
    ...Object.keys(beforeValues || {}),
    ...Object.keys(afterValues || {}),
  ]);

  if (allKeys.size === 0) {
    return (
      <p className="text-xs text-muted-foreground italic px-4 py-3">
        No field-level changes recorded for this entry.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
      <div className="rounded-md border border-error/20 bg-error/5 p-3">
        <p className="text-[11px] font-semibold text-error uppercase tracking-wider mb-2">Before</p>
        <div className="space-y-1.5">
          {Array.from(allKeys).map((key) => {
            const val = beforeValues?.[key];
            if (val === undefined) return null;
            return (
              <div key={`before-${key}`} className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-muted-foreground min-w-[100px]">{key}:</span>
                <span className="text-xs text-error line-through">{String(val)}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-md border border-success/20 bg-success/5 p-3">
        <p className="text-[11px] font-semibold text-success uppercase tracking-wider mb-2">After</p>
        <div className="space-y-1.5">
          {Array.from(allKeys).map((key) => {
            const val = afterValues?.[key];
            if (val === undefined) return null;
            return (
              <div key={`after-${key}`} className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-muted-foreground min-w-[100px]">{key}:</span>
                <span className="text-xs text-success font-medium">{String(val)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AuditTable({ entries }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-surface border border-border rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-accent/30">
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-8" />
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timestamp</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entity</th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Summary</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <React.Fragment key={`audit-row-${entry.id}`}>
                <tr
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-muted/50',
                    isExpanded && 'bg-accent/40'
                  )}
                  onClick={() => toggleExpand(entry.id)}
                  aria-expanded={isExpanded}
                >
                  <td className="px-4 py-3">
                    <button
                      aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                      className="p-0.5 text-muted-foreground"
                      tabIndex={-1}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap font-mono">
                    {formatTimestamp(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-medium whitespace-nowrap">
                    {entry.performer?.fullName || entry.performedBy || 'System'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider',
                      ACTION_BADGE_STYLES[entry.action] || 'bg-accent text-accent-foreground'
                    )}>
                      {entry.action?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                    <span className="font-medium">{entry.entityType}</span>
                    {entry.entityName && (
                      <span className="text-muted-foreground ml-1">"{entry.entityName}"</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                    {entry.summary || getSummary(entry)}
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={6} className="bg-accent/20 border-t border-border">
                      <DiffPanel
                        beforeValues={entry.beforeValues}
                        afterValues={entry.afterValues}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function getSummary(entry) {
  if (entry.action === 'create') return `Created ${entry.entityType?.toLowerCase()}`;
  if (entry.action === 'delete') return `Deleted ${entry.entityType?.toLowerCase()}`;
  if (entry.action === 'update') {
    const fields = Object.keys(entry.afterValues || {});
    if (fields.length > 0) return `Updated ${fields.join(', ')}`;
    return `Updated ${entry.entityType?.toLowerCase()}`;
  }
  if (entry.action === 'bulk_delete') return 'Bulk deleted items';
  if (entry.action === 'bulk_status_update') return 'Bulk status change';
  return entry.action || 'Change recorded';
}
