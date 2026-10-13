import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilters } from '@/hooks/useFilters';

interface TestItem {
  id: number;
  category: string;
  status: string;
}

const items: TestItem[] = [
  { id: 1, category: 'fruit', status: 'active' },
  { id: 2, category: 'vegetable', status: 'active' },
  { id: 3, category: 'fruit', status: 'inactive' },
  { id: 4, category: 'grain', status: 'active' },
];

const initialFilters = { category: 'all', status: 'all' };

describe('useFilters', () => {
  describe('initial state', () => {
    it('returns all items when all filters are "all"', () => {
      const { result } = renderHook(() =>
        useFilters(items, initialFilters)
      );

      expect(result.current.results).toEqual(items);
    });

    it('has hasActive as false initially', () => {
      const { result } = renderHook(() =>
        useFilters(items, initialFilters)
      );

      expect(result.current.hasActive).toBe(false);
    });

    it('initializes filters to the provided defaults', () => {
      const { result } = renderHook(() =>
        useFilters(items, initialFilters)
      );

      expect(result.current.filters).toEqual({
        category: 'all',
        status: 'all',
      });
    });
  });

  describe('setFilter', () => {
    it('filters items by a single filter', () => {
      const { result } = renderHook(() =>
        useFilters(items, initialFilters)
      );

      act(() => {
        result.current.setFilter('category', 'fruit');
      });

      expect(result.current.results).toHaveLength(2);
      expect(result.current.results.every((i) => i.category === 'fruit')).toBe(
        true
      );
    });

    it('sets hasActive to true when a filter is active', () => {
      const { result } = renderHook(() =>
        useFilters(items, initialFilters)
      );

      act(() => {
        result.current.setFilter('category', 'fruit');
      });

      expect(result.current.hasActive).toBe(true);
    });

    it('filters items by multiple filters', () => {
      const { result } = renderHook(() =>
        useFilters(items, initialFilters)
      );

      act(() => {
        result.current.setFilter('category', 'fruit');
      });
      act(() => {
        result.current.setFilter('status', 'active');
      });

      expect(result.current.results).toHaveLength(1);
      expect(result.current.results[0]).toEqual({
        id: 1,
        category: 'fruit',
        status: 'active',
      });
    });

    it('returns all items when filter is reset to "all"', () => {
      const { result } = renderHook(() =>
        useFilters(items, initialFilters)
      );

      act(() => {
        result.current.setFilter('category', 'fruit');
      });
      expect(result.current.results).toHaveLength(2);

      act(() => {
        result.current.setFilter('category', 'all');
      });
      expect(result.current.results).toEqual(items);
    });

    it('returns empty array when no items match', () => {
      const { result } = renderHook(() =>
        useFilters(items, initialFilters)
      );

      act(() => {
        result.current.setFilter('category', 'dairy');
      });

      expect(result.current.results).toHaveLength(0);
    });
  });

  describe('clearAll', () => {
    it('resets all filters to "all"', () => {
      const { result } = renderHook(() =>
        useFilters(items, initialFilters)
      );

      act(() => {
        result.current.setFilter('category', 'fruit');
        result.current.setFilter('status', 'active');
      });

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.filters).toEqual({
        category: 'all',
        status: 'all',
      });
    });

    it('sets hasActive to false after clearing', () => {
      const { result } = renderHook(() =>
        useFilters(items, initialFilters)
      );

      act(() => {
        result.current.setFilter('category', 'fruit');
      });
      expect(result.current.hasActive).toBe(true);

      act(() => {
        result.current.clearAll();
      });
      expect(result.current.hasActive).toBe(false);
    });

    it('returns all items after clearing', () => {
      const { result } = renderHook(() =>
        useFilters(items, initialFilters)
      );

      act(() => {
        result.current.setFilter('category', 'fruit');
      });

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.results).toEqual(items);
    });
  });

  describe('hasActive', () => {
    it('is false when all filters are "all"', () => {
      const { result } = renderHook(() =>
        useFilters(items, initialFilters)
      );

      expect(result.current.hasActive).toBe(false);
    });

    it('is true when at least one filter is not "all"', () => {
      const { result } = renderHook(() =>
        useFilters(items, initialFilters)
      );

      act(() => {
        result.current.setFilter('status', 'active');
      });

      expect(result.current.hasActive).toBe(true);
    });

    it('becomes false when all active filters are reset to "all"', () => {
      const { result } = renderHook(() =>
        useFilters(items, initialFilters)
      );

      act(() => {
        result.current.setFilter('status', 'active');
      });
      expect(result.current.hasActive).toBe(true);

      act(() => {
        result.current.setFilter('status', 'all');
      });
      expect(result.current.hasActive).toBe(false);
    });
  });
});
