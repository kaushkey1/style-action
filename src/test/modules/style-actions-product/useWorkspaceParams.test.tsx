import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useWorkspaceParams } from '@/modules/style-actions-product/components/useWorkspaceParams';

// A controllable router: setSearchParams queues navigations, and the test decides when each one commits (renders).
// This reproduces the S2-C53 race deterministically: the first fill's navigation commits after a click's navigation
// was issued, then the page's effect calls fill again because its identity changed.
const router = vi.hoisted(() => ({
  current: new URLSearchParams(),
  queued: [] as string[],
  setter: null as null | ((next: URLSearchParams) => void),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useSearchParams: () => {
      // A new setter per committed location, as the real router recreates setSearchParams on navigation.
      const setter = (next: URLSearchParams): void => {
        router.queued.push(next.toString());
      };
      router.setter = setter;
      return [router.current, setter] as const;
    },
  };
});

function commit(search: string, rerender: () => void): void {
  router.current = new URLSearchParams(search);
  act(() => rerender());
}

beforeEach(() => {
  router.current = new URLSearchParams('store=8080');
  router.queued = [];
});

describe('useWorkspaceParams URL writes (S2-C43, S2-C53)', () => {
  it('keeps a click that lands while the first fill is still navigating', () => {
    const { result, rerender } = renderHook(() => useWorkspaceParams());
    act(() => {
      result.current.fill({ snap: 'snap_fx0929', dc: 'S3KG', store: '8080' });
      result.current.update({ option: '700000002_RED' });
    });
    expect(router.queued).toEqual(['store=8080&snap=snap_fx0929&dc=S3KG', 'store=8080&snap=snap_fx0929&dc=S3KG&option=700000002_RED']);

    // The fill's navigation commits first; the page's effect then calls fill again (its identity changed).
    commit(router.queued[0] ?? '', rerender);
    act(() => result.current.fill({ snap: 'snap_fx0929', dc: 'S3KG', store: '8080' }));
    expect(router.queued).toHaveLength(2);

    // A further change builds on the click, not on the older committed URL.
    act(() => result.current.update({ panel: 'health' }));
    expect(router.queued[2]).toBe('store=8080&snap=snap_fx0929&dc=S3KG&option=700000002_RED&panel=health');

    commit(router.queued[1] ?? '', rerender);
    commit(router.queued[2] ?? '', rerender);
    act(() => result.current.update({ code: 'BLANK_OPTION' }));
    expect(router.queued[3]).toBe('store=8080&snap=snap_fx0929&dc=S3KG&option=700000002_RED&panel=health&code=BLANK_OPTION');
  });

  it('does not navigate when fill has nothing to add', () => {
    router.current = new URLSearchParams('store=8080&snap=s1&dc=S3KG');
    const { result } = renderHook(() => useWorkspaceParams());
    act(() => result.current.fill({ snap: 's2', dc: 'V012', store: 'TX3X' }));
    act(() => result.current.fill({ snap: null, dc: null }));
    expect(router.queued).toEqual([]);
  });

  it('does not navigate for an update that changes nothing', () => {
    router.current = new URLSearchParams('store=8080');
    const { result } = renderHook(() => useWorkspaceParams());
    act(() => result.current.update({ store: '8080', option: null }));
    expect(router.queued).toEqual([]);
  });

  it('chains two changes made in the same tick (S2-C43)', () => {
    router.current = new URLSearchParams('snap=s1');
    const { result } = renderHook(() => useWorkspaceParams());
    act(() => {
      result.current.update({ ranking: 'data_gaps' });
      result.current.update({ store: '9591' });
    });
    expect(router.queued.at(-1)).toBe('snap=s1&ranking=data_gaps&store=9591');
  });

  it('adopts a navigation from elsewhere, such as a link or the back button', () => {
    const { result, rerender } = renderHook(() => useWorkspaceParams());
    act(() => result.current.update({ option: 'A' }));
    commit('store=5943', rerender);
    act(() => result.current.update({ option: 'B' }));
    expect(router.queued.at(-1)).toBe('store=5943&option=B');
  });
});
