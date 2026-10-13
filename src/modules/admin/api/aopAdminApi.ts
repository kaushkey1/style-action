import { ApiService, appApiFetch, appApiPost, getImpetusHeaders, IMPETUS_APP_BASE } from '@/lib/api';
import type { ConfigResponse, GridFilters, GridResponse, Metric, Preview, SaveRequest, SaveResult } from '../types/aopAdmin';

const BASE = '/sales-plan/admin';

export const aopAdminApi = {
  config: (): Promise<ConfigResponse> =>
    appApiFetch(`${BASE}/config`, undefined, { skipForbiddenRedirect: true }),
  parameters: (configId: string | null, filters: GridFilters): Promise<GridResponse> =>
    appApiFetch(`${BASE}/parameters`, { ...(configId ? { config_id: configId } : {}), ...filters }),
  preview: (request: SaveRequest, cycleId?: string): Promise<Preview> =>
    appApiPost(`${BASE}/config/preview${cycleId ? `?cycle_id=${encodeURIComponent(cycleId)}` : ''}`, request),
  save: async (request: SaveRequest): Promise<SaveResult> => {
    const response = await ApiService.patch(`${IMPETUS_APP_BASE}${BASE}/config`, {
      data: request, headers: getImpetusHeaders(), skipForbiddenRedirect: true,
    });
    return response.data.data;
  },
  metrics: (): Promise<{ items: Metric[] }> => appApiFetch(`${BASE}/metrics`),
};

export function aopError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') return error.message;
  return 'The request failed. Your pending changes have been retained.';
}
