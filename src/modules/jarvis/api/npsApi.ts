// ─── NPS API Client ─────────────────────────────────────────────────────────
// Fetches NPS survey responses from the Jarvis NPS backend endpoint.
// Uses the same apiUrl() + tenant headers pattern as smartiApi.ts.

import { apiUrl, getActiveTenantId, getActiveOrgUuid } from '@/lib/utils';

import type { NPSResponse } from '../data/npsUtils';

const NPS_BASE = '/jarvis/nps';

/**
 * Fetch NPS responses for a store within a date range.
 * Returns the same NPSResponse[] shape that npsUtils.ts expects.
 */
export async function fetchNPSResponses(
  storeCode: string,
  startDate: string,
  endDate: string,
): Promise<NPSResponse[]> {
  const path = `${NPS_BASE}/stores/${storeCode}/responses`;
  const url = new URL(apiUrl(path), window.location.origin);
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('endDate', endDate);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'X-Tenant-ID': getActiveTenantId(),
      'X-Org-ID': getActiveOrgUuid(),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NPS API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<NPSResponse[]>;
}
