// ── API Response Envelope ────────────────────────────────────────────
export interface ApiEnvelope<T> {
  data: T | null;
  message: string;
  status_code: number;
}

// ── GET /store-planogram/filters ─────────────────────────────────────
export interface BrandFilter {
  brand_id: string;
  brand_id_desc: string;
}

export interface FiltersData {
  brands: BrandFilter[];
}

// ── GET /store-planogram/summary ─────────────────────────────────────
export interface FashionGradeMixItem {
  fashion_grade: string;
  quantity: number;
  percentage: number;
}

export interface SummaryData {
  total_sites: number;
  total_options: number;
  total_quantity: number;
  fashion_grade_mix: FashionGradeMixItem[];
}

// ── POST /store-planogram/upload — success ───────────────────────────
export interface UploadSuccessData {
  total_rows: number;
  upserted: number;
  sites_affected: number;
  options_changed: number;
  qty_changed: number;
  errors: [];
}

// ── POST /store-planogram/upload — validation error ──────────────────
export interface UploadValidationErrorItem {
  row: number;
  site?: string;
  brand_id?: string;
  field: string;
  value: string | null;
  message: string;
}

export interface ErrorSummaryItem {
  field: string;
  label: string;
  count: number;
  rows: number[];
}

export interface UploadValidationErrorData {
  total_rows: number;
  inserted: number;
  updated: number;
  errors: UploadValidationErrorItem[];
  error_summary?: ErrorSummaryItem[];
  message: string;
}

// ── GET /store-planogram/uploads ─────────────────────────────────────
// NOTE: numeric fields come as strings from the API
export interface UploadHistoryItem {
  upload_id: string;
  brand_id: string;
  brand_id_desc: string;
  uploaded_by: string;
  uploaded_at: string;
  status: 'success' | 'failed';
  total_rows: string;
  sites_affected: string;
  options_changed: string;
  qty_changed: string;
  errors_count: string;
  changes: string;
}

export interface UploadsData {
  uploads: UploadHistoryItem[];
}

// ── Client-side UI types ─────────────────────────────────────────────
export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'success'
  | 'validation_error'
  | 'server_error';

export interface UploadResult {
  file: { name: string; size: number };
  successData?: UploadSuccessData;
  validationErrors?: UploadValidationErrorData;
  totalRows?: number;
  errorMessage?: string;
}
