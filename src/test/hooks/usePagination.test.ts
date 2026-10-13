import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/usePagination';

const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

describe('usePagination', () => {
  describe('basic pagination', () => {
    it('returns the first page of items', () => {
      const { result } = renderHook(() =>
        usePagination(items, { pageSize: 10 })
      );

      expect(result.current.pageItems).toHaveLength(10);
      expect(result.current.pageItems[0]!.id).toBe(1);
      expect(result.current.pageItems[9]!.id).toBe(10);
    });

    it('starts on page 1', () => {
      const { result } = renderHook(() =>
        usePagination(items, { pageSize: 10 })
      );

      expect(result.current.currentPage).toBe(1);
    });

    it('calculates totalPages correctly', () => {
      const { result } = renderHook(() =>
        usePagination(items, { pageSize: 10 })
      );

      expect(result.current.totalPages).toBe(3);
    });

    it('returns totalItems count', () => {
      const { result } = renderHook(() =>
        usePagination(items, { pageSize: 10 })
      );

      expect(result.current.totalItems).toBe(25);
    });
  });

  describe('page navigation', () => {
    it('navigates to page 2', () => {
      const { result } = renderHook(() =>
        usePagination(items, { pageSize: 10 })
      );

      act(() => {
        result.current.setCurrentPage(2);
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.pageItems).toHaveLength(10);
      expect(result.current.pageItems[0]!.id).toBe(11);
    });

    it('returns partial page for last page', () => {
      const { result } = renderHook(() =>
        usePagination(items, { pageSize: 10 })
      );

      act(() => {
        result.current.setCurrentPage(3);
      });

      expect(result.current.pageItems).toHaveLength(5);
      expect(result.current.pageItems[0]!.id).toBe(21);
      expect(result.current.pageItems[4]!.id).toBe(25);
    });
  });

  describe('items change behavior', () => {
    it('resets to page 1 when items reference changes', () => {
      const { result, rerender } = renderHook(
        ({ data }) => usePagination(data, { pageSize: 10 }),
        { initialProps: { data: items } }
      );

      act(() => {
        result.current.setCurrentPage(3);
      });
      expect(result.current.currentPage).toBe(3);

      const newItems = items.slice(0, 5);
      rerender({ data: newItems });

      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('returns totalPages of at least 1 for empty items', () => {
      const { result } = renderHook(() =>
        usePagination([], { pageSize: 10 })
      );

      expect(result.current.totalPages).toBe(1);
      expect(result.current.pageItems).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);
    });

    it('handles pageSize larger than items count', () => {
      const smallList = [{ id: 1 }, { id: 2 }];
      const { result } = renderHook(() =>
        usePagination(smallList, { pageSize: 10 })
      );

      expect(result.current.totalPages).toBe(1);
      expect(result.current.pageItems).toHaveLength(2);
    });

    it('clamps currentPage to totalPages when items shrink', () => {
      const { result, rerender } = renderHook(
        ({ data }) => usePagination(data, { pageSize: 10 }),
        { initialProps: { data: items } }
      );

      act(() => {
        result.current.setCurrentPage(3);
      });
      expect(result.current.currentPage).toBe(3);

      // Items change resets to page 1 due to reference change
      const twoItems = [{ id: 1 }, { id: 2 }];
      rerender({ data: twoItems });

      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalPages).toBe(1);
    });

    it('handles exactly one page of items', () => {
      const exactPage = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
      const { result } = renderHook(() =>
        usePagination(exactPage, { pageSize: 10 })
      );

      expect(result.current.totalPages).toBe(1);
      expect(result.current.pageItems).toHaveLength(10);
    });
  });
});
