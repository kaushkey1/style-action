import { useState, useMemo } from 'react';

export function usePagination<T>(
  items: T[],
  options: { pageSize: number }
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [prevItems, setPrevItems] = useState(items);

  // Synchronous reset when items reference changes -- no extra render
  if (items !== prevItems) {
    setPrevItems(items);
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }

  const totalPages = Math.max(1, Math.ceil(items.length / options.pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * options.pageSize;
    return items.slice(start, start + options.pageSize);
  }, [items, safePage, options.pageSize]);

  return {
    pageItems,
    currentPage: safePage,
    setCurrentPage,
    totalPages,
    totalItems: items.length,
  };
}
