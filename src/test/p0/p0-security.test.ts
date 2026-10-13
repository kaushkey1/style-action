/**
 * P0 security regression suite (Pillar 4 — frontend/BFF).
 *
 * Each test encodes a documented pen-test / audit finding so it can never
 * silently regress. They are SKIPPED today because the fix they assert does not
 * exist yet. As each Phase-0 fix lands, switch `it.skip` → `it` so the gate
 * enforces it. See docs/ci-cd/cicd-gates.md §C.
 *
 * Note: many of the prototype's security findings are really backend-enforcement
 * concerns (authz, tenant isolation) and live in impetus-agentic-central's P0
 * suite. This file covers only what the SPA / Node BFF can enforce.
 */
import { describe, it, expect } from 'vitest';

const NOT_YET = 'enable when the corresponding Phase-0 fix lands (see docs/ci-cd/cicd-gates-plan.md)';

describe('P0 security regression suite', () => {
  it.skip(`P0-FE-1: SKIP_AUTH can never be true in a production build — ${NOT_YET}`, () => {
    // build with mode=production; assert the bundled config has SKIP_AUTH=false and no bypass path
    expect(false).toBe(true);
  });

  it.skip(`P0-FE-2: BFF proxy rejects //host / absolute-URL paths (SSRF) — ${NOT_YET}`, () => {
    // import { resolveUpstream } from server.cjs; expect it to reject '/api//evil.com/x'
    expect(false).toBe(true);
  });

  it.skip(`P0-FE-3: BFF emits security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) — ${NOT_YET}`, () => {
    expect(false).toBe(true);
  });

  it.skip(`P0-FE-4: middleware has no admin/password default (fails closed) — ${NOT_YET}`, () => {
    expect(false).toBe(true);
  });

  it.skip(`P0-FE-5: report/blob render output-encodes API data (no stored XSS) — ${NOT_YET}`, () => {
    expect(false).toBe(true);
  });

  it.skip(`P0-FE-6: API/LLM-supplied URLs are scheme-validated before href/iframe/window.open — ${NOT_YET}`, () => {
    expect(false).toBe(true);
  });

  it.skip(`P0-FE-7: /env-config exposes only intended public fields (no DEV_COOKIES, etc.) — ${NOT_YET}`, () => {
    expect(false).toBe(true);
  });

  it.skip(`P0-FE-8: no client-built SQL (bigquery.ts constructs no query strings) — ${NOT_YET}`, () => {
    expect(false).toBe(true);
  });

  it.skip(`P0-FE-9: state-changing requests carry a CSRF token — ${NOT_YET}`, () => {
    expect(false).toBe(true);
  });
});
