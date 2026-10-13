import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { ApiService, apiFetch, appApiFetch, resolveUrl, STYLE_ACTION_BASE, STYLE_ACTION_APP_BASE } from '@/lib/api';

vi.mock('@/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/environment')>();
  return {
    ...actual,
    default: { ...actual.default, API_BASE_URL: 'https://api.impetusz0.de', DEV_COOKIES: '' },
  };
});

beforeEach(() => vi.stubEnv('VITE_STYLE_ACTIONS_API_TARGET', ''));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('API routing in development', () => {
  it('keeps existing Impetus application requests on the development proxy', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: {} });
    await appApiFetch('/orgconfig/resolve-org', { org_id: 1 });
    expect(get).toHaveBeenCalledWith(
      '/service/application/impetus-agentic/v1.0/orgconfig/resolve-org',
      expect.objectContaining({ params: { org_id: 1 } }),
    );
    expect(axios.defaults.withCredentials).toBe(true);
  });

  it('keeps existing Impetus public requests on the development proxy', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: {} });
    await apiFetch('/inventory');
    expect(get).toHaveBeenCalledWith(
      '/service/public/impetus-agentic/v1.0/inventory',
      expect.any(Object),
    );
  });

  it('adds the env host to both Style Action service paths without changing endpoint versions', () => {
    expect(resolveUrl(`${STYLE_ACTION_BASE}/v1/health`))
      .toBe('https://api.impetusz0.de/service/public/style-action/v1/health');
    expect(resolveUrl(`${STYLE_ACTION_APP_BASE}/v1/snapshots`))
      .toBe('https://api.impetusz0.de/service/application/style-action/v1/snapshots');
  });

  it('keeps an explicit absolute endpoint unchanged', async () => {
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ data: {} });
    await ApiService.get('https://example.test/health');
    expect(get).toHaveBeenCalledWith('https://example.test/health', expect.any(Object));
  });

  it('uses the deployed API host in production even with the local target set', () => {
    vi.stubEnv('VITE_STYLE_ACTIONS_API_TARGET', 'http://127.0.0.1:8100');
    vi.stubEnv('DEV', false);
    expect(resolveUrl(`${STYLE_ACTION_APP_BASE}/v1/health`))
      .toBe('https://api.impetusz0.de/service/application/style-action/v1/health');
  });
});
