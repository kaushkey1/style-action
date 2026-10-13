import { ApiService, IMPETUS_APP_BASE, IMPETUS_HEADERS } from '@/lib/api';

/**
 * Shared fetcher for the warehouse-backed store endpoints
 * (audit, sales, Google reviews) served by impetus-agentic-central.
 *
 * These deliberately do NOT use `appApiFetch`. It unwraps the response envelope
 * with `res.data?.data ?? res.data`, so an envelope carrying `data: null` — the
 * documented "no data for this store" response — falls through the `??` and
 * returns the envelope object itself. That is truthy, so callers would treat
 * "no data" as data and crash on the missing fields.
 *
 * Going through `ApiService` keeps everything else: the shared axios instance,
 * credentials, and the 401/403 interceptors. `resolveUrl` makes the path
 * relative in dev (so the Vite proxy handles it) and absolute against
 * API_BASE_URL in production.
 */

/** Axios rejects with the response body, so the status can be in either shape. */
function statusOf(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const e = error as { status?: number; status_code?: number; response?: { status?: number } };
  return e.response?.status ?? e.status_code ?? e.status;
}

export async function fetchStoreData<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T | null> {
  try {
    const response = await ApiService.get(`${IMPETUS_APP_BASE}${path}`, {
      params,
      headers: IMPETUS_HEADERS,
      // Widget-level call: a 403 must not bounce the whole page to /unauthorized.
      skipForbiddenRedirect: true,
    });
    return (response.data?.data as T | null) ?? null;
  } catch (error) {
    // A 404 means "nothing here for this store", which is a normal outcome for
    // a store outside the warehouse. Treat it as an empty result so the widget
    // renders its empty state instead of erroring — an error would be retried
    // and, for anything wired into a page-level loading gate, would keep the
    // page in a skeleton. Real faults (5xx, network) still reject.
    if (statusOf(error) === 404) return null;
    throw error;
  }
}
