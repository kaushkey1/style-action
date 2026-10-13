import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getBrowserConfig } = require('../../config.cjs') as {
  getBrowserConfig: (env?: Record<string, string | undefined>) => Record<string, string>;
};

describe('getBrowserConfig', () => {
  it('maps VITE runtime flags into browser config', () => {
    const config = getBrowserConfig({
      API_PROXY_TARGET: 'https://example.com',
      VITE_USE_MOCK_DATA: 'true',
      VITE_USE_BIGQUERY: 'true',
      VITE_BIGQUERY_PROJECT: 'retail-prod',
    });

    expect(config.USE_MOCK_DATA).toBe('true');
    expect(config.USE_BIGQUERY).toBe('true');
    expect(config.BIGQUERY_PROJECT).toBe('retail-prod');
  });

  it('uses secure defaults when runtime flags are absent', () => {
    const config = getBrowserConfig({});

    expect(config.USE_MOCK_DATA).toBe('false');
    expect(config.USE_BIGQUERY).toBe('false');
    expect(config.BIGQUERY_PROJECT).toBe('fynd-jio-impetus-prod');
  });

  it('omits GBRAIN_API_BASE_URL unless explicitly configured', () => {
    const config = getBrowserConfig({});

    expect(config).not.toHaveProperty('GBRAIN_API_BASE_URL');
  });

  it('passes GBRAIN_API_BASE_URL through when configured', () => {
    expect(
      getBrowserConfig({ GBRAIN_API_BASE_URL: '/gbrain-api' })
        .GBRAIN_API_BASE_URL,
    ).toBe('/gbrain-api');
    expect(
      getBrowserConfig({ VITE_GBRAIN_API_BASE_URL: '/gbrain-api' })
        .GBRAIN_API_BASE_URL,
    ).toBe('/gbrain-api');
  });
});
