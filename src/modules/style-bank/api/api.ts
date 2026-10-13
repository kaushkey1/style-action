import environment from '@/environment';

const API_BASE_URL = environment.ENV !== 'production'
  ? '/api/style-bank'
  : environment.STYLE_BANK_API_BASE_URL;

// ── API response types ────────────────────────────────────────────────────

export interface ApiGarmentImages {
  garment: string;
  garment_uhd: string;
  sheet: string;
  sheet_uhd: string;
  artwork: string;
  artwork_uhd: string;
  swatch: string;
  swatch_uhd: string;
}

export interface ApiBomResult {
  fabric_cost: number;
  labor_cost: number;
  trims_cost: number;
  margin_percent: number;
}

export interface ApiGarment {
  garment_id: string;
  brand_name: string;
  theme_name: string;
  category: string;
  garment_type: string;
  segment: string;
  fabric: string;
  gsm: string;
  fabric_composition: string;
  colors: string[];
  key_details: string;
  prompt: string;
  added_services: string[];
  images: ApiGarmentImages;
  cost_per_unit: number | null;
  bom_result: ApiBomResult | null;
}

export interface ApiResponse {
  data: ApiGarment[];
  total: number;
  limit: number;
  offset: number;
  available_filters: AvailableFilters;
}

export interface ApiFilterParams {
  brand_names?: string[];
  categories?: string[];
  segments?: string[];
  limit?: number;
  offset?: number;
  sort_by?: 'created_at' | 'brand_name' | 'category';
  sort_order?: 'asc' | 'desc';
  include_bom?: boolean;
}

export interface AvailableFilters {
  brands: string[];
  categories: string[];
  segments: string[];
  garment_types: string[];
  fabrics: string[];
}

export interface FilterOptions {
  categories: string[];
  brands: string[];
  segments: string[];
}

// ── Query param builder ───────────────────────────────────────────────────

function buildParams(params: ApiFilterParams): URLSearchParams {
  const sp = new URLSearchParams();

  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.offset != null) sp.set('offset', String(params.offset));
  if (params.sort_by) sp.set('sort_by', params.sort_by);
  if (params.sort_order) sp.set('sort_order', params.sort_order);
  if (params.include_bom) sp.set('include_bom', 'true');

  params.brand_names?.forEach((b) => sp.append('brand_names', b));
  params.categories?.forEach((c) => sp.append('categories', c));
  params.segments?.forEach((s) => sp.append('segments', s));

  return sp;
}

// ── Fetch helpers ─────────────────────────────────────────────────────────

export async function fetchDesigns(params: ApiFilterParams = {}): Promise<ApiResponse> {
  const sp = buildParams({ limit: 100, ...params });
  const res = await fetch(`${API_BASE_URL}?${sp}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch designs: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<ApiResponse>;
}

export async function fetchDesignDetail(garmentId: string): Promise<ApiGarment | null> {
  // The API has no single-item endpoint, so we fetch with include_bom and
  // search the results. We use a large limit in case the item is deep in the set.
  const res = await fetchDesigns({ limit: 1000, include_bom: true });
  return res.data.find((g) => g.garment_id === garmentId) ?? null;
}

