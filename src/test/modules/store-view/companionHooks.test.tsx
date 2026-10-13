import { useState, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { companionApi } from '@/modules/store-view/api/companionApi';
import { useProductOverview, useJourneyFunnel, useDiscoveryCatalogue, useProductCx, useStoreDetail } from '@/modules/store-view/api/companionHooks';
import { apiFetch } from '@/lib/api';

vi.mock('@/lib/api', () => ({ apiFetch: vi.fn().mockResolvedValue({ hasData: false, notes: [] }), apiPost: vi.fn() }));

function Wrapper({ children }: PropsWithChildren) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false } } }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Product Health API wiring', () => {
  it.each([
    [useProductOverview, '/companion/product-overview'],
    [useJourneyFunnel, '/companion/journey-funnel'],
    [useDiscoveryCatalogue, '/companion/discovery-catalogue'],
    [useProductCx, '/companion/product-cx'],
  ] as const)('passes dates and refetches when the range changes (%s)', async (useSection, path) => {
    const from = '2026-09-28';
    const { result, rerender } = renderHook(({ to }) => useSection({ from, to }), { initialProps: { to: '2026-09-28' }, wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiFetch).toHaveBeenCalledWith(path, { from, to: '2026-09-28' });
    rerender({ to: '2026-09-29' });
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith(path, { from, to: '2026-09-29' }));
  });

  it.each([
    [companionApi.productOverview, '/companion/product-overview'],
    [companionApi.journeyFunnel, '/companion/journey-funnel'],
    [companionApi.discoveryCatalogue, '/companion/discovery-catalogue'],
    [companionApi.productCx, '/companion/product-cx'],
  ] as const)('omits dates for All time (%s)', async (fetchSection, path) => {
    await fetchSection({});
    expect(apiFetch).toHaveBeenCalledWith(path, {});
  });

  it('disables store detail requests when UID is unavailable', () => {
    const { result } = renderHook(() => useStoreDetail(null, {}), { wrapper: Wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('uses numeric UID for store detail and preserves retryable failures', async () => {
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('Unavailable'));
    const { result } = renderHook(() => useStoreDetail('1234', {}), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(apiFetch).toHaveBeenCalledWith('/companion/store-detail', { uid: '1234' });
    expect(result.current.data).toBeUndefined();
  });
});
