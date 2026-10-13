import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { ApiService, IMPETUS_APP_BASE, IMPETUS_HEADERS } from '@/lib/api';

// AnR admin-config endpoints (ANR_ADMIN_CONFIG_PLAN.md): /v1.0/anr/config/*
// IMPETUS_APP_BASE already carries the /v1.0 segment.
const ANR_CONFIG_BASE = `${IMPETUS_APP_BASE}/anr/config`;

const STALE_TIME_CONFIG_MS = 5 * 60 * 1000;
const STALE_TIME_HISTORY_MS = 60 * 1000;

// ─── Response types (mirror app/anr/config_admin/service.py) ────────────────

export interface AnrParamCell {
  value: string;
  valueType: string;
}

/** {config_type: {fashion_grade: {param_key: {value, valueType}}}} */
export type AnrConfigTree = Record<string, Record<string, Record<string, AnrParamCell>>>;

/** Editable shape used by the page state: values only, all strings. */
export type AnrConfigValues = Record<string, Record<string, Record<string, string>>>;

export interface AnrStoreOverride {
  configType: string;
  fashionGrade: string;
  storeCode: string;
  paramKey: string;
  value: string;
  valueType: string;
}

export interface AnrConfigBlock {
  version: number;
  status: 'draft' | 'published';
  reason: string | null;
  effectiveFrom: string | null;
  createdBy: string | null;
  createdAt: string | null;
  publishedBy: string | null;
  publishedAt: string | null;
  config: AnrConfigTree;
  storeOverrides: AnrStoreOverride[];
}

export interface AnrConfigResponse {
  fashionGrades: string[];
  lifecycleGrades: string[];
  published: AnrConfigBlock | null;
  draft: AnrConfigBlock | null;
}

export interface AnrDraftSaveResult {
  config_id: string;
  version: number;
  status: string;
}

export interface AnrPublishResult {
  configId: string;
  version: number;
  status: string;
  reason: string;
  effectiveFrom: string | null;
  publishedBy: string | null;
  publishedAt: string | null;
  changedFields: number;
  notes: string[];
}

export interface AnrVersionRow {
  version: number;
  status: string;
  isLatestPublished: boolean;
  reason: string | null;
  effectiveFrom: string | null;
  createdBy: string | null;
  createdAt: string | null;
  publishedBy: string | null;
  publishedAt: string | null;
}

export interface AnrAuditRow {
  version: number | null;
  action: string;
  configType: string;
  fashionGrade: string;
  storeCode: string;
  paramKey: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string | null;
  changedAt: string | null;
  effectiveFrom: string | null;
  reason: string | null;
}

// ─── Error envelope parsing (same flat ok()/err() contract as space planning) ─

export interface AnrFieldError {
  tab: string;
  field: string;
  error: string;
}

export interface ParsedAnrApiError {
  status: number | null;
  message: string;
  fieldErrors: AnrFieldError[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readEnvelope(body: unknown, out: ParsedAnrApiError): void {
  if (!isRecord(body)) return;
  if (typeof body.message === 'string') out.message = body.message;
  if (typeof body.status_code === 'number') out.status = body.status_code;
  if (Array.isArray(body.errors)) {
    out.fieldErrors = body.errors.filter(isRecord).map((r) => ({
      tab: typeof r.tab === 'string' ? r.tab : '',
      field: typeof r.field === 'string' ? r.field : '',
      error: typeof r.error === 'string' ? r.error : '',
    }));
  }
}

export function parseAnrApiError(e: unknown): ParsedAnrApiError {
  const out: ParsedAnrApiError = { status: null, message: 'Request failed', fieldErrors: [] };
  if (!isRecord(e)) return out;
  if (typeof e.message === 'string') out.message = e.message;
  // The axios interceptor rejects with the envelope body itself — read it flat.
  readEnvelope(e, out);
  const response = e.response;
  if (isRecord(response)) {
    if (out.status === null && typeof response.status === 'number') out.status = response.status;
    readEnvelope(response.data, out);
  }
  return out;
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function anrGet<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const res = await ApiService.get(`${ANR_CONFIG_BASE}${path}`, {
    params,
    headers: IMPETUS_HEADERS,
  });
  return res.data?.data ?? res.data;
}

async function anrSend<T>(method: 'put' | 'post' | 'del', path: string, data?: unknown): Promise<T> {
  const res = await ApiService[method](`${ANR_CONFIG_BASE}${path}`, {
    data,
    headers: IMPETUS_HEADERS,
  });
  return res.data?.data ?? res.data;
}

// ─── Query keys + hooks ──────────────────────────────────────────────────────

export const anrConfigKeys = {
  all: ['anr-admin-config'] as const,
  config: () => [...anrConfigKeys.all, 'config'] as const,
  versions: () => [...anrConfigKeys.all, 'versions'] as const,
  audit: () => [...anrConfigKeys.all, 'audit'] as const,
};

export function useAnrConfig(): UseQueryResult<AnrConfigResponse, Error> {
  return useQuery({
    queryKey: anrConfigKeys.config(),
    queryFn: () => anrGet<AnrConfigResponse>(''),
    staleTime: STALE_TIME_CONFIG_MS,
  });
}

export function useAnrConfigVersions(): UseQueryResult<AnrVersionRow[], Error> {
  return useQuery({
    queryKey: anrConfigKeys.versions(),
    queryFn: async () => {
      const data = await anrGet<{ versions: AnrVersionRow[] }>('/versions');
      return data.versions ?? [];
    },
    staleTime: STALE_TIME_HISTORY_MS,
  });
}

export function useAnrAuditLog(): UseQueryResult<AnrAuditRow[], Error> {
  return useQuery({
    queryKey: anrConfigKeys.audit(),
    queryFn: async () => {
      const data = await anrGet<{ entries: AnrAuditRow[] }>('/audit');
      return data.entries ?? [];
    },
    staleTime: STALE_TIME_HISTORY_MS,
  });
}

export function useSaveAnrDraft(): UseMutationResult<
  AnrDraftSaveResult,
  Error,
  AnrConfigValues
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: AnrConfigValues) =>
      anrSend<AnrDraftSaveResult>('put', '/draft', { config }),
    onSuccess: () => {
      void queryClient.refetchQueries({ queryKey: anrConfigKeys.all, type: 'all' });
    },
  });
}

export function usePublishAnrConfig(): UseMutationResult<
  AnrPublishResult,
  Error,
  { reason: string; effective_from: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { reason: string; effective_from: string }) =>
      anrSend<AnrPublishResult>('post', '/publish', body),
    onSuccess: () => {
      void queryClient.refetchQueries({ queryKey: anrConfigKeys.all, type: 'all' });
    },
  });
}

export function useDiscardAnrDraft(): UseMutationResult<{ discarded: boolean }, Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => anrSend<{ discarded: boolean }>('del', '/draft'),
    onSuccess: () => {
      void queryClient.refetchQueries({ queryKey: anrConfigKeys.all, type: 'all' });
    },
  });
}
