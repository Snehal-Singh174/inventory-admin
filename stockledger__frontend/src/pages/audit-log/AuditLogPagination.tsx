/**
 * PaginationBar — rich pagination control for the Audit Log table.
 * Page number list with smart ellipsis, items-per-page selector, and count display.
 */

import React from 'react';
import { cn } from '../../utils/cn';

export interface PaginationProps {
  total:            number;
  page:             number;
  pageSize:         number;
  onPageChange:     (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

export function PaginationBar({
  total, page, pageSize, onPageChange, onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end   = Math.min(total, page * pageSize);

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3)              pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  const btnCls = (active: boolean, disabled?: boolean) =>
    cn(
      'h-8 min-w-[32px] px-2 text-sm rounded-md transition-colors duration-100',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      active   && 'bg-primary text-onPrimary font-semibold',
      !active && !disabled && 'text-onBackground hover:bg-muted',
      disabled && 'text-muted-foreground cursor-not-allowed opacity-50',
    );

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 pb-1 px-2">
      <p className="text-sm text-muted-foreground tabular-nums select-none">
        {total === 0 ? '0 entries' : `${start}–${end} of ${total} entries`}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={btnCls(false, page <= 1)}
        >
          ‹
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground select-none">…</span>
          ) : (
            <button
              key={`page-btn-${p}`}
              type="button"
              onClick={() => onPageChange(p as number)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
              className={btnCls(p === page)}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className={btnCls(false, page >= totalPages)}
        >
          ›
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="audit-page-size" className="text-sm text-muted-foreground whitespace-nowrap">
          Rows per page
        </label>
        <select
          id="audit-page-size"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-8 px-2 pr-6 text-sm rounded-md border border-border bg-surface text-onBackground
                     focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 4px center',
            backgroundSize: '12px',
          }}
        >
          {[10, 25, 50, 100].map((s) => (
            <option key={`ps-${s}`} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
