import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export function Pagination({ page, pageSize, totalCount, totalPages, onPageChange, onPageSizeChange }) {
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Showing {startItem}–{endItem} of {totalCount} items</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="page-size-select" className="text-sm text-muted-foreground whitespace-nowrap">
            Per page:
          </label>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 px-2 rounded border border-input bg-background text-sm text-foreground focus:ring-2 focus:ring-ring"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={`ps-${size}`} value={size}>{size}</option>
            ))}
          </select>
        </div>

        {/* Page numbers */}
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm">…</span>
            ) : (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(p)}
                className={cn(
                  'min-w-[32px] h-8 rounded-md text-sm font-medium transition-colors',
                  p === page
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent'
                )}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      </div>
    </div>
  );
}

export default Pagination;
