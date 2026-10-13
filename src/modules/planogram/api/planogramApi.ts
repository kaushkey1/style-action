import { apiFetch, apiFetchBlob, ApiService, IMPETUS_BASE, IMPETUS_HEADERS } from '@/lib/api';
import type {
  FiltersData,
  SummaryData,
  UploadSuccessData,
  UploadValidationErrorData,
  UploadsData,
  ApiEnvelope,
} from '../types/planogram.types';

const PLANOGRAM = '/store-planogram';

// ── GET /store-planogram/filters ─────────────────────────────────────

export function fetchPlanogramFilters(): Promise<FiltersData> {
  return apiFetch<FiltersData>(`${PLANOGRAM}/filters`);
}

// ── GET /store-planogram/summary ─────────────────────────────────────

export function fetchPlanogramSummary(brandId: string): Promise<SummaryData> {
  return apiFetch<SummaryData>(`${PLANOGRAM}/summary`, { brand_id: brandId });
}

// ── GET /store-planogram/download ────────────────────────────────────

export async function downloadPlanogram(brandId: string): Promise<void> {
  const filename = `store_planogram_${brandId}.xlsx`;
  await apiFetchBlob(`${PLANOGRAM}/download`, { brand_id: brandId }, filename);
}

// ── POST /store-planogram/upload ─────────────────────────────────────

export type UploadPlanogramResult =
  | { success: true; data: UploadSuccessData }
  | { success: false; validationErrors?: UploadValidationErrorData; errorMessage: string };

export async function uploadPlanogram(
  file: File,
  brandId: string,
  signal?: AbortSignal,
): Promise<UploadPlanogramResult> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await ApiService.axios({
      method: 'POST',
      url: `${IMPETUS_BASE}${PLANOGRAM}/upload`,
      params: { brand_id: brandId },
      data: formData,
      headers: {
        ...IMPETUS_HEADERS,
        // Let the browser set Content-Type with boundary for multipart
      },
      signal,
    });

    const envelope = res.data as ApiEnvelope<UploadSuccessData>;
    return { success: true, data: envelope.data! };
  } catch (err: unknown) {
    // axios interceptor rejects with response.data for non-2xx
    const body = err as Record<string, unknown>;

    // Check if it's a validation error (has errors array in data)
    const data = body.data as Record<string, unknown> | null | undefined;
    if (data && Array.isArray(data.errors) && data.errors.length > 0) {
      return {
        success: false,
        validationErrors: data as unknown as UploadValidationErrorData,
        errorMessage: String(body.message ?? 'Validation failed'),
      };
    }

    // Generic server/network error
    const message =
      typeof body.message === 'string'
        ? body.message
        : 'Upload processing failed. Please try again.';

    return { success: false, errorMessage: message };
  }
}

// ── GET /store-planogram/uploads ─────────────────────────────────────

export function fetchUploadHistory(params?: {
  limit?: number;
  offset?: number;
}): Promise<UploadsData> {
  return apiFetch<UploadsData>(`${PLANOGRAM}/uploads`, params);
}
