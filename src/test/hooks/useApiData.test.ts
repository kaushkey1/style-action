import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApiData } from '@/hooks/useApiData';

describe('useApiData', () => {
  it('starts in loading state', () => {
    const fetcher = vi.fn(() => new Promise<string>(() => {}));
    const { result } = renderHook(() => useApiData(fetcher, []));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('sets data on successful fetch', async () => {
    const fetcher = vi.fn(() => Promise.resolve({ items: [1, 2, 3] }));
    const { result } = renderHook(() => useApiData(fetcher, []));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({ items: [1, 2, 3] });
    expect(result.current.error).toBeNull();
  });

  it('sets error on failed fetch', async () => {
    const fetcher = vi.fn(() => Promise.reject(new Error('Network error')));
    const { result } = renderHook(() => useApiData(fetcher, []));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Network error');
  });

  it('handles non-Error rejection', async () => {
    const fetcher = vi.fn(() => Promise.reject('string error'));
    const { result } = renderHook(() => useApiData(fetcher, []));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('string error');
  });

  it('cancels stale requests', async () => {
    let callCount = 0;
    const fetcher = vi.fn(() => {
      callCount++;
      const current = callCount;
      return new Promise<string>((resolve) => {
        setTimeout(() => resolve(`result-${current}`), current === 1 ? 100 : 10);
      });
    });

    const { result, rerender } = renderHook(
      ({ dep }) => useApiData(fetcher, [dep]),
      { initialProps: { dep: 1 } }
    );

    // Trigger a second fetch before the first resolves
    rerender({ dep: 2 });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Only the second (newer) result should be set
    expect(result.current.data).toBe('result-2');
  });
});
