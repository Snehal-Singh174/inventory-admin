/**
 * FieldDiffViewer — renders a field-by-field before/after comparison for an
 * audit log entry. Handles all three actions:
 *   CREATE  — only "After" column (nothing existed before)
 *   DELETE  — only "Before" column (entity was removed)
 *   UPDATE  — both columns, highlighting changed values
 */

import React from 'react';
import type { AuditLogEntry } from '../../types/inventory';
import { cn } from '../../utils/cn';

// Fields that carry no business meaning for the diff display
const SYSTEM_FIELDS = new Set([
  'id', 'created_at', 'updated_at', 'created_by', 'updated_by',
]);

const FIELD_LABELS: Record<string, string> = {
  item_name:     'Item Name',
  sku:           'SKU',
  category_id:   'Category ID',
  quantity:      'Quantity',
  unit_cost:     'Unit Cost',
  total_value:   'Total Value',
  supplier_id:   'Supplier ID',
  status:        'Status',
  name:          'Name',
  description:   'Description',
  contact_email: 'Contact Email',
  phone:         'Phone',
  address:       'Address',
  is_active:     'Active',
};

function humanLabel(field: string): string {
  return (
    FIELD_LABELS[field] ??
    field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    if (
      field.includes('cost') ||
      field.includes('value') ||
      field.includes('price')
    ) {
      return `$${value.toFixed(2)}`;
    }
    return String(value);
  }
  return String(value);
}

interface FieldDiffViewerProps {
  entry: AuditLogEntry;
}

export function FieldDiffViewer({ entry }: FieldDiffViewerProps) {
  const { action, changed_fields, before_values, after_values } = entry;

  let fields: string[] = [];
  if (action === 'CREATE' && after_values) {
    fields = Object.keys(after_values).filter((f) => !SYSTEM_FIELDS.has(f));
  } else if (action === 'DELETE' && before_values) {
    fields = Object.keys(before_values).filter((f) => !SYSTEM_FIELDS.has(f));
  } else if (action === 'UPDATE') {
    // Use changed_fields if available; fall back to all keys present in before/after
    fields =
      changed_fields ??
      Object.keys({ ...before_values, ...after_values }).filter(
        (f) => !SYSTEM_FIELDS.has(f),
      );
  }

  if (fields.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2 italic">
        No field-level details recorded for this entry.
      </p>
    );
  }

  const showBefore = action !== 'CREATE';
  const showAfter  = action !== 'DELETE';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse min-w-[320px]">
        <thead>
          <tr>
            <th
              scope="col"
              className="text-left pb-2 pr-6 text-muted-foreground font-semibold
                         uppercase tracking-wide text-[10px] w-36"
            >
              Field
            </th>
            {showBefore && (
              <th
                scope="col"
                className="text-left pb-2 pr-6 text-muted-foreground font-semibold
                           uppercase tracking-wide text-[10px]"
              >
                Before
              </th>
            )}
            {showAfter && (
              <th
                scope="col"
                className="text-left pb-2 text-muted-foreground font-semibold
                           uppercase tracking-wide text-[10px]"
              >
                After
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {fields.map((field) => {
            const before = before_values?.[field];
            const after  = after_values?.[field];
            const changed = action === 'UPDATE' && String(before) !== String(after);

            return (
              <tr key={`diff-${entry.id}-${field}`} className="hover:bg-muted/30">
                <td className="py-1.5 pr-6 font-medium text-onSurface">
                  {humanLabel(field)}
                </td>

                {showBefore && (
                  <td className="py-1.5 pr-6 font-mono text-onSurface/80">
                    {changed ? (
                      <span className="bg-errorBackground text-error px-1.5 py-0.5 rounded">
                        {formatValue(field, before)}
                      </span>
                    ) : (
                      <span>{formatValue(field, before)}</span>
                    )}
                  </td>
                )}

                {showAfter && (
                  <td className="py-1.5 font-mono text-onSurface/80">
                    {changed ? (
                      <span className="bg-successBackground text-success px-1.5 py-0.5 rounded">
                        {formatValue(field, after)}
                      </span>
                    ) : (
                      <span>{formatValue(field, after)}</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
