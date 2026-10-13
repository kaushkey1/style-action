import { describe, expect, it } from 'vitest';

import environment from '@/environment';
import { gbrainUrl } from '@/modules/agentic-brain/api/agenticBrainApi';

const GBRAIN_BACKEND =
  'https://api.create.sit.fyndx1.de/service/public/create-costing-agent';

// Deployed consoles (console.impetusz0.de / console.jioimpetus.com) have no
// /gbrain-api reverse proxy — a relative default resolves against the console
// origin and returns the SPA's index.html instead of JSON, so Brain pages
// silently fall back to mock data. The default must be the absolute backend
// URL, matching the production build. Local dev overrides it to the Vite
// proxy via window._conf (VITE_GBRAIN_API_BASE_URL in .env.local) because the
// backend's CORS allowlist does not include local dev origins.
describe('environment GBRAIN_API_BASE_URL', () => {
  it('defaults to the absolute gbrain backend URL when window._conf is absent', () => {
    expect(environment.GBRAIN_API_BASE_URL).toBe(GBRAIN_BACKEND);
  });

  it('gbrainUrl builds endpoint URLs against the backend, not the window origin', () => {
    expect(gbrainUrl('/api/gbrain/health')).toBe(
      `${GBRAIN_BACKEND}/api/gbrain/health`,
    );
  });
});
