import type { ClusterId } from './storeIntelligence.types';

export type ViewMode = 'store' | 'category' | 'space';

export type StoreGrade = 'A+' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface NetworkMetrics {
  totalStores: number;
  networkNPI: number;
  sell: number;
  lyGrowth: number;
  idGap: number;
  fillRate: number;
}

export interface CategorySummary {
  id: string;
  name: string;
  itemCount: number;
  storeCount: number;
  lastSeasonItems: number;
  potentialNPI: number;
  recoNPI: number;
  ctrSth: number;
  overOpn: number;
  score: number;
}

export interface Store {
  id: string;
  name: string;
  format: string;
  grade: StoreGrade;
  region: string;
  city: string;
  state: string;
  sqft: number | null;
  monthlyRevenue: number | null;
  potentialNPI: number;
  recoNPI: number;
  ctrSth: number;
  options: number;
  score: number;
  categories: string[];
  latitude: number;
  longitude: number;
  cluster: ClusterId;
  clusterLabel: string;
  competitiveGapScore: number;
  catchmentAffluence: number;
  twinGapSpsf: number;
  hasReclassificationTrigger: boolean;
  noosPct?: number | null;
  fashionPct?: number | null;
  grossSales?: number | null;
  aop?: number | null;
  otbTotal?: number | null;
  stockValue?: number | null;
  totalOptions?: number | null;
  optionsInStock?: number | null;
  monthClosingStockQty?: number | null;
  total_gross_margin?: number | null;
  lyGrowth?: number | null;
  totalUsableSqft?: number | null;
  nrmPct?: number | null;
  storeAgeMonths?: number | null;
}

export interface CategoryOTBBudget {
  current: number;
  target: number;
  percentage: number;
}

export interface TargetLayer {
  base: number;
  baseChange: number;
  mid: number;
  midChange: number;
  top: number;
  topChange: number;
  totalPercentage: number;
}

export interface BuyingParallel {
  planned: number;
  actual: number;
  variance: number;
  percentage: number;
}

export interface RangeStructure {
  totalOptions: number;
  newOptions: number;
  carryForward: number;
  distribution: {
    label: string;
    percentage: number;
    color: string;
  }[];
}

export interface Proposition {
  target: number;
  achieved: number;
  percentage: number;
  lyComparison: number;
}

export interface FTPTrend {
  name: string;
  value: number;
  color: string;
}

export interface StoryPerformance {
  ay: number;
  al: number;
  at: number;
  as: number;
}

export interface OptionMixItem {
  name: string;
  classic: number;
  fashionBase: number;
  fashionPulse: number;
  fastFashion: number;
  total: number;
}

export interface GradeOption {
  name: string;
  values: { grade: string; value: number; color: string }[];
}

export interface CategoryDetails {
  otbBudget: CategoryOTBBudget;
  targetLayer: TargetLayer;
  buyingParallels: BuyingParallel;
  rangeStructure: RangeStructure;
  proposition: Proposition;
  ftpTrends: FTPTrend[];
  storyPerformance: StoryPerformance;
  optionMix: OptionMixItem[];
  grades: string[];
  gradeOptions: GradeOption[];
}

export interface UnifiedPlanningState {
  viewMode: ViewMode;
  networkMetrics: NetworkMetrics;
  categories: CategorySummary[];
  expandedCategoryId: string | null;
  categoryDetails: Record<string, CategoryDetails>;
  stores: Store[];
  selectedStoreId: string | null;
  expandedStoreId: string | null;
  selectedGrades: StoreGrade[];
  isLoading: boolean;
}
