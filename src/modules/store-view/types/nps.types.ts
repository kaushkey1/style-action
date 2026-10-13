export interface NPSStorePerformance {
  nps_score: number;
  totalResponses: number;
  avgScore: number;
  points: number;
  currNps: number;
  prevNps: number;
}

export interface NPSStoreInfo {
  store_code: string;
  description: string;
  city: string;
  state: string;
  format: string;
  sub_format: string;
}

export interface NPSStoreDetailsResponse {
  store: NPSStoreInfo;
  performance: NPSStorePerformance;
  averageRatings: Record<string, number>;
}

export interface NPSDPIDriver {
  category: string;
  displayName: string;
  dpi: number;
  totalSelected: number;
  selectedPercent: number;
  promoterCount: number;
  detractorCount: number;
  passiveCount: number;
  promoterPercent: number;
  detractorPercent: number;
  tag: string;
}

export interface NPSDPIResponse {
  drivers: NPSDPIDriver[];
  totalRespondents: number;
}

export interface NPSFeedbackItem {
  feedbackId: string;
  npsScore: number;
  responseDate: string;
  otherFeedback: string;
}

export interface NPSFeedbackPagination {
  page: number;
  limit: number;
  totalPages: number;
  totalFeedback: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface NPSFeedbackResponse {
  data: NPSFeedbackItem[];
  pagination: NPSFeedbackPagination;
}

export interface NPSAISummaryData {
  summary: string;
  filter_type?: string;
  start_date?: string;
  end_date?: string;
  updated_at?: string;
}
