import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiGet, apiPost, StyleActionsApiError, styleActionsBaseUrl } from '@/modules/style-actions-product/api/client';

vi.mock('@/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/environment')>();
  return { ...actual, default: { ...actual.default, API_BASE_URL: 'https://api.example.test/', DEV_COOKIES: '' } };
});

describe('style-actions-product API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the shared API host and application service path', () => {
    expect(styleActionsBaseUrl()).toBe('https://api.example.test/service/application/style-action');
  });

  it('sends organisation headers and drops empty query values', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await apiGet('/v1/stores', { snapshot_id: 'snap_1', store_code: undefined, q: '' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.example.test/service/application/style-action/v1/stores?snapshot_id=snap_1');
    expect((init.headers as Record<string, string>)['X-Org-ID']).toBeTruthy();
  });

  it('raises the backend error code and message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 'snapshot_not_found', message: 'Snapshot x was not found' }), { status: 404 }),
    ));
    await expect(apiGet('/v1/snapshots/x')).rejects.toMatchObject({ status: 404, code: 'snapshot_not_found' });
  });

  it('keeps the error detail for the caller', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 'scope_too_large', message: 'too many', detail: { limit: 4, store_count: 5 } }), { status: 422 }),
    ));
    await expect(apiPost('/v1/snapshots', {})).rejects.toMatchObject({ status: 422, code: 'scope_too_large', detail: { limit: 4, store_count: 5 } });
  });

  it('posts JSON and handles non-JSON failures', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('boom', { status: 502 }));
    vi.stubGlobal('fetch', fetchMock);
    const error = await apiPost('/v1/snapshots', { as_of: '2026-09-29' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(StyleActionsApiError);
    expect((error as StyleActionsApiError).code).toBe('request_failed');
    expect((fetchMock.mock.calls[0] as [string, RequestInit])[1].method).toBe('POST');
  });
});
