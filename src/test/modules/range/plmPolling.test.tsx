import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import { fetchPlmSubmission, rangeKeys } from '@/modules/range/api/rangeApi';
import type { PlmSubmissionData } from '@/modules/range/api/rangeApi';
import { usePlmSubmission } from '@/modules/range/api/rangeHooks';

vi.mock('@/modules/range/api/rangeApi', async importOriginal => ({
  ...await importOriginal<typeof import('@/modules/range/api/rangeApi')>(),
  fetchPlmSubmission: vi.fn(),
}));

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

it('reads the saved PLM reply on remount without polling while awaiting a result', async () => {
  vi.useFakeTimers();
  const selection = { run_id: 'run-2', category: 'cat', subcategory: 'subcat', fashion_grade: '' };
  const pending: PlmSubmissionData = {
    ...selection, submission_id: 'submission-2', transport: 'kafka', status: 'PUBLISHED',
    display_status: 'Submitted to PLM', total: 1, greyed: 0,
    counts: { pending: 0, publishing: 0, published: 1, failed: 0, unknown: 0 },
    processing: {
      status: 'AWAITING_RESPONSE',
      counts: { awaiting: 1, success: 0, validation_failed: 0, skipped: 0, not_tracked: 0 },
    },
    created_at: '2026-09-17T05:00:00Z', plm_creation_status: 'not_tracked', legacy_result: null,
  };
  const failed: PlmSubmissionData = {
    ...pending, display_status: 'PLM Submission Failed',
    processing: {
      status: 'VALIDATION_FAILED',
      counts: { awaiting: 0, success: 0, validation_failed: 1, skipped: 0, not_tracked: 0 },
    },
  };
  vi.mocked(fetchPlmSubmission)
    .mockResolvedValueOnce({ transport: 'kafka', submission: pending })
    .mockResolvedValue({ transport: 'kafka', submission: failed });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => usePlmSubmission(selection), { wrapper });
  await act(() => vi.advanceTimersByTimeAsync(10));
  const overviewKey = rangeKeys.networkOverview({ hit: 'test' });
  client.setQueryData(overviewKey, { items: [{ status: 'Submitted to PLM' }] });
  await act(() => vi.advanceTimersByTimeAsync(10000));
  expect(fetchPlmSubmission).toHaveBeenCalledTimes(1);
  expect(hook.result.current.data?.submission?.processing?.status).toBe('AWAITING_RESPONSE');
  hook.unmount();

  const refreshed = renderHook(() => usePlmSubmission(selection), { wrapper });
  await act(() => vi.advanceTimersByTimeAsync(10));
  expect(fetchPlmSubmission).toHaveBeenCalledTimes(2);
  expect(refreshed.result.current.data?.submission?.processing?.status).toBe('VALIDATION_FAILED');
  expect(client.getQueryState(overviewKey)?.isInvalidated).toBe(true);
  refreshed.unmount();
  client.clear();
});

it('refreshes pending publication every two seconds and stops once published', async () => {
  vi.useFakeTimers();
  const selection = { run_id: 'run-1', category: 'cat', subcategory: 'subcat', fashion_grade: '' };
  const pending: PlmSubmissionData = {
    ...selection, submission_id: 'submission-1', transport: 'kafka', status: 'ACCEPTED',
    display_status: 'Submitting to PLM', total: 1, greyed: 0,
    counts: { pending: 1, publishing: 0, published: 0, failed: 0, unknown: 0 },
    created_at: '2026-09-17T05:00:00Z', plm_creation_status: 'not_tracked', legacy_result: null,
  };
  const published: PlmSubmissionData = {
    ...pending, status: 'PUBLISHED', display_status: 'Submitted to PLM',
    counts: { ...pending.counts, pending: 0, published: 1 },
  };
  vi.mocked(fetchPlmSubmission)
    .mockResolvedValueOnce({ transport: 'kafka', submission: pending })
    .mockResolvedValueOnce({
      transport: 'kafka', submission: {
        ...pending, status: 'PUBLISHING', counts: { ...pending.counts, pending: 0, publishing: 1 },
      },
    })
    .mockResolvedValue({ transport: 'kafka', submission: published });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const overviewKey = rangeKeys.networkOverview({ hit: 'test' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => usePlmSubmission(selection), { wrapper });
  await act(() => vi.advanceTimersByTimeAsync(10));
  expect(hook.result.current.data?.submission?.status).toBe('ACCEPTED');
  client.setQueryData(overviewKey, { items: [{ status: 'Submitting to PLM' }] });
  const itemsKey = rangeKeys.plmItems(pending.submission_id, 1);
  client.setQueryData(itemsKey, { items: [{ state: 'PENDING' }] });
  expect(client.getQueryState(overviewKey)?.isInvalidated).toBe(false);

  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(hook.result.current.data?.submission?.status).toBe('ACCEPTED');
  expect(fetchPlmSubmission).toHaveBeenCalledTimes(1);
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(hook.result.current.data?.submission?.status).toBe('PUBLISHING');
  expect(fetchPlmSubmission).toHaveBeenCalledTimes(2);
  await act(() => vi.advanceTimersByTimeAsync(2000));
  expect(hook.result.current.data?.submission?.display_status).toBe('Submitted to PLM');
  expect(fetchPlmSubmission).toHaveBeenCalledTimes(3);
  expect(client.getQueryState(overviewKey)?.isInvalidated).toBe(true);
  expect(client.getQueryState(itemsKey)?.isInvalidated).toBe(true);
  await act(() => vi.advanceTimersByTimeAsync(10000));
  expect(fetchPlmSubmission).toHaveBeenCalledTimes(3);
  hook.unmount();
  client.clear();
});

it.each(['FAILED', 'PARTIAL_FAILURE', 'NEEDS_REVIEW', 'PAUSED', 'HTTP_COMPLETED'] as const)(
  'does not poll a saved %s submission', async status => {
    vi.useFakeTimers();
    const selection = { run_id: 'run-3', category: 'cat', subcategory: 'subcat', fashion_grade: '' };
    const transport = status === 'HTTP_COMPLETED' ? 'http' : 'kafka';
    vi.mocked(fetchPlmSubmission).mockResolvedValue({
      transport,
      submission: {
        ...selection, submission_id: 'submission-3', transport, status, total: 1, greyed: 0,
        counts: { pending: 0, publishing: 0, published: 0, failed: 1, unknown: 0 },
        created_at: '2026-09-17T05:00:00Z', plm_creation_status: 'not_tracked', legacy_result: null,
      },
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const hook = renderHook(() => usePlmSubmission(selection), { wrapper });
    await act(() => vi.advanceTimersByTimeAsync(10000));
    expect(fetchPlmSubmission).toHaveBeenCalledTimes(1);
    hook.unmount();
    client.clear();
  },
);

it('stops publication refresh on a fetch error and resumes after a manual refresh', async () => {
  vi.useFakeTimers();
  const selection = { run_id: 'run-4', category: 'cat', subcategory: 'subcat', fashion_grade: '' };
  const pending: PlmSubmissionData = {
    ...selection, submission_id: 'submission-4', transport: 'kafka', status: 'ACCEPTED',
    total: 1, greyed: 0,
    counts: { pending: 1, publishing: 0, published: 0, failed: 0, unknown: 0 },
    created_at: '2026-09-17T05:00:00Z', plm_creation_status: 'not_tracked', legacy_result: null,
  };
  vi.mocked(fetchPlmSubmission)
    .mockResolvedValueOnce({ transport: 'kafka', submission: pending })
    .mockRejectedValueOnce(new Error('Status unavailable'))
    .mockResolvedValue({ transport: 'kafka', submission: pending });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => {
    const query = usePlmSubmission(selection);
    return { isError: query.isError, refetch: query.refetch };
  }, { wrapper });
  await act(() => vi.advanceTimersByTimeAsync(10));
  await act(() => vi.advanceTimersByTimeAsync(2010));
  expect(hook.result.current.isError).toBe(true);
  await act(() => vi.advanceTimersByTimeAsync(10000));
  expect(fetchPlmSubmission).toHaveBeenCalledTimes(2);
  await act(async () => { await hook.result.current.refetch(); });
  await act(() => vi.advanceTimersByTimeAsync(2010));
  expect(fetchPlmSubmission).toHaveBeenCalledTimes(4);
  hook.unmount();
  await act(() => vi.advanceTimersByTimeAsync(10000));
  expect(fetchPlmSubmission).toHaveBeenCalledTimes(4);
  client.clear();
});
