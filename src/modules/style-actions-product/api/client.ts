import { resolveUrl, STYLE_ACTION_APP_BASE } from '@/lib/api';
import { getActiveOrgUuid, getActiveTenantId } from '@/lib/utils';
import { STYLE_ACTIONS_DEMO } from './demoMode';

import type { ApiErrorBody } from './types';

export class StyleActionsApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** The error body's `detail`, for example `{limit, store_count}` on `scope_too_large`. */
  readonly detail: unknown;

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.message ?? `Request failed with status ${status}`);
    this.status = status;
    this.code = body?.code ?? 'request_failed';
    this.detail = body?.detail ?? null;
  }
}

/**
 * Codes that go into a request path (snapshot, Distribution Centre, store and option ids) must be plain identifiers:
 * letters, digits, "_" and "-", at most 80 characters. encodeURIComponent leaves "." and ".." intact, so a URL parameter
 * like ".." could otherwise reach another path (S2-C66 L7). Real codes are e.g. snap_01054c103f43, S3KG, 8080, TX3X and
 * 700000001_BLU.
 */
const PATH_CODE = /^[A-Za-z0-9_-]{1,80}$/;

export type PathCodeKind = 'snapshot' | 'dc' | 'store' | 'option';

const NOT_FOUND_CODE: Readonly<Record<PathCodeKind, string>> = {
  snapshot: 'snapshot_not_found',
  dc: 'dc_not_found',
  store: 'store_not_found',
  option: 'option_store_not_found',
};

const KIND_LABEL: Readonly<Record<PathCodeKind, string>> = {
  snapshot: 'snapshot',
  dc: 'Distribution Centre',
  store: 'store',
  option: 'option',
};

export function isPathCode(value: string | null | undefined): value is string {
  return typeof value === 'string' && PATH_CODE.test(value);
}

/**
 * A code ready for a request path. An invalid code never reaches the network: it fails as the same 404 the backend
 * would give for an unknown code, so every view shows its "not found" state.
 */
export function pathCode(value: string | null | undefined, kind: PathCodeKind): string {
  if (!isPathCode(value)) {
    throw new StyleActionsApiError(404, { code: NOT_FOUND_CODE[kind], message: `This ${KIND_LABEL[kind]} code is not valid` });
  }
  return value;
}

export function styleActionsBaseUrl(): string {
  return resolveUrl(STYLE_ACTION_APP_BASE);
}

function headers(): Record<string, string> {
  return { 'X-Org-ID': getActiveOrgUuid(), 'X-Tenant-ID': getActiveTenantId(), Accept: 'application/json' };
}

type QueryValue = string | number | boolean | undefined | null;

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const search = params.toString();
  return `${styleActionsBaseUrl()}${path}${search ? `?${search}` : ''}`;
}

async function parse<T>(response: Response): Promise<T> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = body && typeof body === 'object' && 'code' in body ? (body as ApiErrorBody) : null;
    throw new StyleActionsApiError(response.status, error);
  }
  return body as T;
}

export async function apiGet<T>(path: string, query?: Record<string, QueryValue>): Promise<T> {
  if (STYLE_ACTIONS_DEMO) {
    const { demoResponse } = await import('../data/demoApi');
    return parse<T>(demoResponse('GET', path, query));
  }
  const response = await fetch(buildUrl(path, query), { headers: headers(), credentials: 'include' });
  return parse<T>(response);
}

/** POST with a JSON body, or with no body at all when `body` is undefined (e.g. extendSnapshot). */
export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  if (STYLE_ACTIONS_DEMO) {
    const { demoResponse } = await import('../data/demoApi');
    return parse<T>(demoResponse('POST', path));
  }
  const init: RequestInit =
    body === undefined
      ? { method: 'POST', headers: headers(), credentials: 'include' }
      : { method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) };
  const response = await fetch(buildUrl(path), init);
  return parse<T>(response);
}
