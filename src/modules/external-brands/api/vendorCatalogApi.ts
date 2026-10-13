import { appApiFetch, appApiPut, ApiService, IMPETUS_APP_BASE, IMPETUS_HEADERS } from '@/lib/api';

const VENDOR_CATALOG = '/vendor-catalog';

// ─── Catalog Listing (Screen 1) ────────────────────────────────────────────

export interface CatalogListItem {
  run_id: string | null;
  brand: string | null;
  season: string | null;
  class_desc: string | null;
  brick_desc: string | null;
  total_styles: number | null;
  total_articles: number | null;
  total_qty: number | null;
  total_colors: number | null;
  min_rrp: number | null;
  max_rrp: number | null;
  avg_score: number | null;
  currency: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Pagination {
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
}

export interface CatalogListResponse {
  items: CatalogListItem[];
  pagination: Pagination;
}

export interface CatalogFiltersResponse {
  brands: string[];
  seasons: string[];
  classes: string[];
  bricks: string[];
}

export interface CatalogListParams {
  brand?: string;
  season?: string;
  class_desc?: string;
  brick?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

// ─── Catalog Detail (Screen 2) ─────────────────────────────────────────────

export interface CatalogDetail {
  run_id: string;
  brand: string | null;
  season: string | null;
  data_source: string | null;
  total_styles: number | null;
  total_rows: number | null;
  total_bricks: number | null;
  total_colors: number | null;
  drops: string | null;
  genders: string | null;
  avg_score: number | null;
  total_moq: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CatalogDetailResponse {
  catalog: CatalogDetail;
  coverage: Record<string, unknown>;
  brand_concentrations: unknown[];
}

export interface StyleColor {
  name: string | null;
  /** Underlying SKU codes for this colour name (multiple if the catalogue has shades sharing one name). */
  codes: string[];
  /** Total predicted_qty across all size rows for this colour. */
  qty: number;
  /** User selection — true if at least one underlying colour_code is not rejected. */
  opted_in: boolean;
}

export interface StyleItem {
  run_id: string;
  style_code: string | null;
  style_description: string | null;
  brand: string | null;
  brick_desc: string | null;
  brick_code: string | null;
  class_desc: string | null;
  item_class_desc: string | null;
  sub_category: string | null;
  gender: string | null;
  season: string | null;
  catalogue_season: string | null;
  drop: string | null;
  rrp: number | null;
  fob: number | null;
  rrp_inr: number | null;
  fob_inr: number | null;
  fx_rate_gbp_inr: number | null;
  currency: string | null;
  gim_pct: number | null;
  nim_pct: number | null;
  moq: number | null;
  predicted_qty: number;
  est_revenue_gbp: number | null;
  lead_time_days: number | null;
  inventory_type: string | null;
  coo: string | null;
  supplier: string | null;
  sustainability: string | null;
  fabric_text: string | null;
  extracted_fit: string | null;
  extracted_pattern: string | null;
  extracted_fabric: string | null;
  extracted_neckline: string | null;
  extracted_sleeve: string | null;
  extracted_color_family: string | null;
  extracted_wash: string | null;
  performance_score: number | null;
  confidence: number | null;
  normalised_score: number | null;
  rank_in_brick: number | null;
  total_in_brick: number | null;
  scoring_method: string | null;
  color_count: number;
  colors: StyleColor[];
  size_count: number;
  size_run: string[];
  image_url: string | null;
  range_requirements: Record<string, string> | null;
  ra_style_code: string | null;
  similarity_pct: number | null;
}

export interface StylesListResponse {
  items: StyleItem[];
  pagination: Pagination;
}

export interface StylesListParams {
  brick?: string;
  drop?: string;
  gender?: string;
  score_min?: number;
  score_max?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

// ─── Fetch functions ───────────────────────────────────────────────────────

export async function fetchCatalogList(params: CatalogListParams = {}): Promise<CatalogListResponse> {
  return appApiFetch<CatalogListResponse>(`${VENDOR_CATALOG}/catalog`, { ...params });
}

export async function fetchCatalogFilters(): Promise<CatalogFiltersResponse> {
  return appApiFetch<CatalogFiltersResponse>(`${VENDOR_CATALOG}/catalog/filters`);
}

export async function fetchCatalogDetail(runId: string): Promise<CatalogDetailResponse> {
  return appApiFetch<CatalogDetailResponse>(`${VENDOR_CATALOG}/catalog/${runId}`);
}

export async function fetchStyles(runId: string, params: StylesListParams = {}): Promise<StylesListResponse> {
  return appApiFetch<StylesListResponse>(`${VENDOR_CATALOG}/catalog/${runId}/styles`, { ...params });
}

// ─── Style edits (qty / mrp / cost) ────────────────────────────────────

export interface StyleColorEdit {
  colour_code: string;
  colour_desc?: string;
  qty?: number;
  opted_in?: boolean;
}

export interface StyleEditItem {
  style_code: string;
  qty?: number;
  mrp?: number;
  cost?: number;
  colors?: StyleColorEdit[];
}

export interface StyleEditResult {
  style_code: string;
  status: 'ok' | 'error';
  applied: Record<string, number>;
  error: string | null;
}

export interface StyleEditBatchResponse {
  results: StyleEditResult[];
  success_count: number;
  error_count: number;
}

export async function updateStyles(
  runId: string,
  edits: StyleEditItem[],
): Promise<StyleEditBatchResponse> {
  return appApiPut<StyleEditBatchResponse>(
    `${VENDOR_CATALOG}/catalog/${runId}/styles`,
    { edits },
  );
}

// ─── Catalog upload ────────────────────────────────────────────────────

export interface UploadCatalogResponse {
  run_id: string | null;
  filename: string;
  rows_in_file: number;
  rows_inserted: number;
  rows_skipped: number;
  errors: string[];
}

export async function uploadCatalogFile(args: {
  file: File;
  seasons: string[];
  classes: string[];
  bricks: string[];
}): Promise<UploadCatalogResponse> {
  const form = new FormData();
  form.append('file', args.file);
  for (const s of args.seasons) form.append('seasons', s);
  for (const c of args.classes) form.append('classes', c);
  for (const b of args.bricks) form.append('bricks', b);
  const res = await ApiService.axios({
    method: 'POST',
    url: `${IMPETUS_APP_BASE}${VENDOR_CATALOG}/upload`,
    data: form,
    headers: IMPETUS_HEADERS,
  });
  return (res.data?.data ?? res.data) as UploadCatalogResponse;
}

// ─── Query key factory ─────────────────────────────────────────────────────

export const vendorCatalogKeys = {
  all: ['external-brands-vendor-catalog'] as const,
  catalogLists: () => [...vendorCatalogKeys.all, 'catalog-list'] as const,
  catalogList: (params: CatalogListParams) => [...vendorCatalogKeys.catalogLists(), params] as const,
  catalogFilters: () => [...vendorCatalogKeys.all, 'catalog-filters'] as const,
  catalogDetail: (runId: string) => [...vendorCatalogKeys.all, 'catalog-detail', runId] as const,
  styles: (runId: string, params: StylesListParams) => [...vendorCatalogKeys.all, 'styles', runId, params] as const,
};
