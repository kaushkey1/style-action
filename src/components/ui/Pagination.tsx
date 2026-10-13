/* eslint-disable react-refresh/only-export-components -- exporting both component and hook */
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 25, 50],
  className,
}: PaginationProps) {
  const [pageInput, setPageInput] = useState(String(currentPage));

  const start = totalItems != null ? (currentPage - 1) * pageSize + 1 : null;
  const end = totalItems != null ? Math.min(currentPage * pageSize, totalItems) : null;

  const handlePageInputChange = (value: string) => {
    setPageInput(value);
  };

  const handlePageInputBlur = () => {
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
    }
  };

  // Update local input when currentPage changes from external source
  if (String(currentPage) !== pageInput && !document.activeElement?.matches('input[type="number"]')) {
    setPageInput(String(currentPage));
  }

  return (
    <div className={cn('flex items-center justify-between px-4 py-3 border-t border-gray-100', className)}>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-gray-600">Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 px-2 pr-8 text-base sm:text-xs border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:border-transparent"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
        {totalItems != null && start != null && end != null && (
          <span className={cn('text-xs text-gray-600', onPageSizeChange && 'sm:ml-4')}>
            {start}–{end} of {totalItems}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-gray-600">Page</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={pageInput}
            onChange={(e) => handlePageInputChange(e.target.value)}
            onBlur={handlePageInputBlur}
            onKeyDown={handlePageInputKeyDown}
            className="w-12 h-8 px-2 text-base sm:text-xs text-center border border-gray-300 rounded focus:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:border-transparent"
          />
          <span className="text-xs text-gray-600">of {totalPages}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 sm:p-1.5 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 sm:p-1.5 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Hook for paginated data */
export function usePagination<T>(items: T[], pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  return {
    totalPages,
    totalItems: items.length,
    pageSize,
    getPageItems: (currentPage: number) => {
      const start = (currentPage - 1) * pageSize;
      return items.slice(start, start + pageSize);
    },
  };
}
