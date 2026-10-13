import { ApiService, IMPETUS_APP_BASE } from '@/lib/api';

const STORE_INTELLIGENCE_BASE = `${IMPETUS_APP_BASE}/store-intelligence`;

const STORE_INTELLIGENCE_HEADERS: Record<string, string> = {
  'X-Org-ID': 'reliance-trends',
  'X-Tenant-ID': 'trends-retail',
  'Content-Type': 'application/json',
};

interface ApiEnvelope<T> {
  ok?: boolean;
  data?: T | null;
  message?: string;
  errors?: unknown;
}

export type StoreIntelligenceSortField =
  | 'fashionForwardness'
  | 'affluenceScore'
  | 'youthIndex'
  | 'familyIndex'
  | 'destinationScore'
  | 'lfl_2y_cagr_pct'
  | 'growth_yoy_pct';

export type StoreIntelligenceSortDirection = 'asc' | 'desc';

export interface StoreIntelligenceListItem {
  store_id: string;
  store_name: string | null;
  signal: string | null;
  lfl_2y_cagr_pct: number | null;
  growth_yoy_pct: number | null;
  fashionForwardness: number | null;
  affluenceScore: number | null;
  youthIndex: number | null;
  familyIndex: number | null;
  destinationScore: number | null;
  cluster: string | null;
}

export interface StoreIntelligenceListResponse {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  stores: StoreIntelligenceListItem[];
}

export interface StoreIntelligenceListParams {
  [key: string]: string | number | undefined;
  page?: number;
  limit?: number;
  year_month?: string;
  cluster?: string;
  search?: string;
  order_by?: StoreIntelligenceSortField;
  order_direction?: StoreIntelligenceSortDirection;
}

export interface StoreIntelligenceCategoryDemandProfileItem {
  category?: string | null;
  category_desc?: string | null;
  segment_std?: string | null;
  sales_index: string | number | null;
  growth_yoy_pct: string | number | null;
  lfl_2y_cagr_pct?: string | number | null;
  gmrof_rs_per_sft?: string | number | null;
  sell_through_rate: number | null;
  monthly_revenue?: number | string | null;
  signal: string | null;
  best_period?: string | null;
  best_rev?: string | number | null;
}

export interface StoreIntelligenceCategoryBestPeriodBenchmarkItem {
  category: string;
  best_period: string | null;
  best_rev: string | null;
  current_rev: string | null;
  pct_of_best_status: string | null;
  lfl_2y_cagr_pct: string | null;
}

export interface StoreIntelligenceStoreRatings {
  store_id: string;
  store_name: string | null;
  google_place_id: string | null;
  google_name: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_maps_url: string | null;
  reviews: string | null;
}

export interface StoreIntelligenceCompetitionItem {
  store_id: string;
  competitor_name: string | null;
  estimated_size_sft: number | null;
  distance_km: number | null;
  google_rating: number | null;
  latitude: number | null;
  longitude: number | null;
  /** Brand logo URL — populated by the backend/CDN (optional until that ships). */
  logo_url?: string | null;
}

export interface StoreIntelligenceDetailResponse {
  store_id: string;
  store_name: string | null;
  cluster: string | null;
  fashionForwardness: number | null;
  affluenceScore: number | null;
  youthIndex: number | null;
  familyIndex: number | null;
  destinationScore: number | null;
  lfl_2y_cagr_pct: number | null;
  growth_yoy_pct: number | null;
  gmrof_rs_per_sft: number | null;
  catchment_summary: string | null;
  shoppers_summary: string | null;
  demand_summary: string | null;
  situation_summary: string | null;
  last_year_lakhs: number | null;
  this_year_lakhs: number | null;
  detailed_json_cdn_url: string | null;
  detailed_analysis_pdf_cdn_url: string | null;
  analysis_data: Record<string, unknown> | null;
  category_demand_profile: StoreIntelligenceCategoryDemandProfileItem[];
  category_best_period_benchmarking?: StoreIntelligenceCategoryBestPeriodBenchmarkItem[];
  store_ratings: StoreIntelligenceStoreRatings | null;
  competition_analysis: StoreIntelligenceCompetitionItem[];
}

function unwrapEnvelope<T>(payload: ApiEnvelope<T> | undefined, fallbackMessage: string): T {
  if (payload?.data != null) {
    return payload.data;
  }

  throw new Error(payload?.message ?? fallbackMessage);
}

export const storeIntelligenceApi = {
  list: async (params: StoreIntelligenceListParams): Promise<StoreIntelligenceListResponse> => {
    const res = await ApiService.get(`${STORE_INTELLIGENCE_BASE}/stores`, {
      params,
      headers: STORE_INTELLIGENCE_HEADERS,
    });

    return unwrapEnvelope<StoreIntelligenceListResponse>(
      res.data as ApiEnvelope<StoreIntelligenceListResponse>,
      'Failed to load store intelligence stores',
    );
  },

  detail: async (
    storeId: string,
    params?: Pick<StoreIntelligenceListParams, 'year_month'>,
  ): Promise<StoreIntelligenceDetailResponse> => {
    const res = await ApiService.get(`${STORE_INTELLIGENCE_BASE}/stores/${encodeURIComponent(storeId)}`, {
      params,
      headers: STORE_INTELLIGENCE_HEADERS,
    });

    return unwrapEnvelope<StoreIntelligenceDetailResponse>(
      res.data as ApiEnvelope<StoreIntelligenceDetailResponse>,
      `Store with ID '${storeId}' not found`,
    );
  },
};
