// ── Store Intelligence Types ──
// From spec §14.1 verbatim

export type CompetitorTier = 'direct' | 'aspirational' | 'value' | 'online';
export type PricePositioning = 'entry' | 'mid' | 'premium' | 'multi-tier';
export type GapSeverity = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationType =
  | 'category-expansion'
  | 'competitive-response'
  | 'cluster-strategy'
  | 'size-curve'
  | 'demand-anomaly'
  | 'returns-spike'
  | 'aop-variance'
  | 'grade-mismatch';
export type ClusterId = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8';

// ── Competitor ──

export interface Competitor {
  id: string;
  storeName: string;
  brandChain: string;
  tier: CompetitorTier;
  latitude: number;
  longitude: number;
  estimatedSft: number;
  estimatedSpsf: number;
  categoryFocus: string[];
  pricePositioning: PricePositioning;
  vmQualityScore: number; // 1-10
  rating: number; // 1.0-5.0 (Google Maps-style)
  status: 'active' | 'closed' | 'renovation';
  lastSurveyed: string; // ISO date
}

export interface StoreCompetitorEntry {
  competitorId: string;
  distanceMeters: number;
  threatLevel: 'high' | 'medium' | 'low';
}

// ── Competitive Gap Score ──

export interface CompetitiveGapScore {
  storeId: string;
  overallScore: number; // 0-100
  dimensions: {
    optionBreadth: number;
    priceLadder: number;
    sizeAvailability: number;
    newnessCadence: number;
    vmDisplay: number;
    digitalPresence: number;
  };
  gapBand: 'leader' | 'competitive' | 'gap-exists' | 'at-risk';
  topGap: string;
  competitors: StoreCompetitorEntry[];
}

// ── Catchment Profile ──

export interface CatchmentProfile {
  storeId: string;
  affluenceScore: number; // 0-100
  fashionForwardness: number; // 0-100
  familyIndex: number; // 0-100
  youthIndex: number; // 0-100
  destinationScore: number; // 0-100
  catchmentPopulation: number;
  estimatedApparelSpend: number; // ₹ Cr/year
  currentMarketShare: number; // %
}

// ── Cross-Format Intelligence ──

export interface CrossFormatSignals {
  storeId: string;
  smartBazaarPresent: boolean;
  smartBazaarDistance?: number; // km
  smartBazaarApparelAdjacentSales?: number; // ₹ Cr
  catchmentPotentialMultiplier: number;
  ajioOrdersPerMonth: number;
  ajioTopCategory: string;
  onlineDemandLeakage: number; // %
  ajioRushEnabled: boolean;
  ajioRushOrdersPerMonth?: number;
  freshStoresNearby: number;
}

// ── Demand Profile ──

export interface CategoryDemandProfile {
  category: string;
  segment: string;
  family: string;
  salesIndex: number; // >1 = over-indexes
  growthYoY: number; // %
  lflGrowth: number; // %
  lflGrowth2Y: number; // % — 2-year CAGR
  bestPeriod: {
    period: string;
    revenue: number;
    currentRevenue: number;
    percentOfBest: number;
    driver: string;
  };
  sellThrough30: number; // %
  gmrof: number;
  demandSignal: 'very-strong' | 'strong' | 'stable' | 'weak' | 'declining';
}

export interface PriceAffinityDistribution {
  entry: number; // % (<₹500)
  mid: number; // % (₹500-999)
  premium: number; // % (₹1000+)
  networkEntry: number;
  networkMid: number;
  networkPremium: number;
}

export interface SizeCurveHealth {
  category: string;
  sizeAccuracy: number; // %
  topOosSize: string;
  lostSalesEstimate: number; // ₹/month
}

export interface StoreDemandProfile {
  storeId: string;
  categoryDemand: CategoryDemandProfile[];
  priceAffinity: PriceAffinityDistribution;
  sizeCurveHealth: SizeCurveHealth[];
  newnessAbsorptionRate: number; // %
  customerLoyaltyIndex: number; // %
  basketDepthScore: number;
  brandAffluenceScore: number; // 1-4 scale
}

// ── Customer Persona ──

export interface CustomerPersona {
  name: string;
  customerPercent: number;
  revenuePercent: number;
  avgBasket: number;
  visitFrequency: number; // per month
  brandAffluence: number; // 1=Value, 2=Mid, 3=Premium, 4=Aspirational
  keyCategories: string[];
}

export interface CustomerHealthMetrics {
  activeCustomers90Day: number;
  vsGradeAvg: number; // %
  newCustomerRate: number; // %
  repeatRate: number; // %
  churnRate180Day: number; // %
}

export interface StoreCustomerProfile {
  storeId: string;
  personas: CustomerPersona[];
  health: CustomerHealthMetrics;
}

// ── Performance Twin ──

export interface TwinMetric {
  metric: string;
  currentValue: number;
  twinValue: number;
  gap: number;
  gapPercent: number;
  unit: string; // '₹', '%', '×', 'days', 'options'
  priority: GapSeverity;
}

export interface StoreTwinAnalysis {
  storeId: string;
  metrics: TwinMetric[];
  revenueUpliftMonthly: number;
  marginImprovementAnnual: number;
  overallGapSeverity: GapSeverity;
}

// ── Store Cluster ──

export interface StoreCluster {
  id: ClusterId;
  label: string;
  profile: string;
  storeCount: number;
  avgSpsf: number;
  avgCompetitiveGap: number;
  avgAffluence: number;
  avgFashionPercent: number;
  avgAsp: number;
  competitiveIntensity: 'very-low' | 'low' | 'medium' | 'high';
  typicalGrades: string[];
  keyCharacteristic: string;
}

// ── Store Intelligence Profile (Master) ──

export interface StoreIntelligenceProfile {
  storeId: string;
  storeName: string;
  grade: string;
  cluster: ClusterId;
  clusterLabel: string;
  demandProfile: StoreDemandProfile;
  competitiveGap: CompetitiveGapScore;
  catchment: CatchmentProfile;
  crossFormat: CrossFormatSignals;
  customerProfile: StoreCustomerProfile;
  twinAnalysis: StoreTwinAnalysis;
  lastUpdated: string; // ISO datetime
}

// ── Recommendations ──

export type HandoffState = 'available' | 'pending' | 'resolved';

export interface IntelligenceRecommendation {
  id: string;
  type: RecommendationType;
  storeId: string;
  storeName: string;
  title: string;
  evidence: string[];
  action: string;
  source: string;
  impactSpsf: number;
  impactGmrof: number;
  impactRevenueMonthly: number;
  severity: GapSeverity;
  status: 'pending' | 'sent-to-space-planning' | 'sent-to-otb' | 'applied' | 'dismissed';
  createdAt: string;
  // Handoff lifecycle
  handoffState?: HandoffState;
  handoffTarget?: string;
  handoffDate?: string;
  resolvedDate?: string;
  resolvedSummary?: string;
  // AI rationale
  aiRationale?: string;
  // Event-driven
  isEventDriven?: boolean;
  eventName?: string;
  eventDate?: string;
  readinessStatus?: 'prepared' | 'not-prepared';
}

// ── AOP Reconciliation ──

export interface AopTwinReconciliation {
  storeId: string;
  items: {
    metric: string;
    aopTarget: string;
    twinRecommendation: string;
    gap: string;
    explanation: string;
  }[];
}

// ── Reclassification Trigger ──

export interface ReclassificationTrigger {
  storeId: string;
  triggerType: 'spsf-shift' | 'competitor-change' | 'catchment-change' | 'cluster-outlier';
  description: string;
  currentGrade: string;
  recommendedGrade: string;
  currentCluster: ClusterId;
  recommendedCluster?: ClusterId;
  detectedAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'deferred';
}

// ── Basket Intelligence ──

export interface BasketIntelligence {
  storeId: string;
  avgBasketSize: number; // items
  avgBasketValue: number; // ₹
  crossSellRate: number; // %
  topCombinations: { primary: string; secondary: string; frequency: number }[];
  basketTrend: 'growing' | 'stable' | 'declining';
  vsGradeAvg: number; // % relative to grade average
}

// ── Returns Intelligence ──

export interface ReturnsIntelligence {
  storeId: string;
  returnRate: number; // %
  topReturnReasons: { reason: string; percentage: number }[];
  categoryReturns: { category: string; returnRate: number; topReason: string }[];
  exchangeRate: number; // % of returns that become exchanges
  netRevenueImpact: number; // ₹/month lost
  vsGradeAvg: number; // % relative to grade average
}

// ── Demand Forecasting ──

export interface DemandForecast {
  storeId: string;
  nextMonthForecast: number; // ₹ revenue
  nextQuarterForecast: number; // ₹ revenue
  forecastAccuracy: number; // % — last 3 months accuracy
  seasonalPeak: string; // e.g., "Diwali 2026"
  peakUplift: number; // % above baseline
  categoryForecasts: { category: string; nextMonthRevenue: number; trend: 'up' | 'flat' | 'down' }[];
}

// ── Deep Research (Full Store Analysis) ──

export interface StoreDeepResearch {
  storeId: string;
  positioning: {
    statement: string;
    differentiator: string;
    fashionCoreSplit: { fashion: number; core: number };
  };
  catchmentDeepDive: {
    narrative: string;
    incomeBands: { band: string; percent: number; profile: string }[];
    culturalProfile: string;
    shoppingBehavior: string;
    priceSensitivity: string;
  };
  competitiveLandscape: {
    intensityScore: string;
    biggestThreat: string;
    gapsToExploit: string;
    whatCompetitorsDoBetter: string;
  };
  demandSignals: {
    topCategories: { rank: number; category: string; priceRange: string; why: string }[];
    underservedCategories: string;
    seasonalPatterns: { period: string; pattern: string }[];
    weatherImpact: string;
    onlineCompetition: string;
  };
  categoryMixRecommendation: { category: string; percent: number; notes: string }[];
  priceArchitecture: { band: string; percent: number; rationale: string }[];
  topActions: { title: string; description: string }[];
}

// ── Admin Config Types ──

export interface ClusterDimensionWeights {
  salesPerformance: number;
  customerMix: number;
  catchmentProfile: number;
  competitiveIntensity: number;
  formatAdjacency: number;
}

export interface ReclassificationRule {
  id: string;
  name: string;
  threshold: string;
  enabled: boolean;
}

export interface CatchmentConfig {
  primaryRadius: number;
  secondaryRadius: number;
  competitorProximityThreshold: number;
  crossFormatLinkageRadius: number;
  affluenceWeights: {
    income: number;
    lifestyle: number;
    consumption: number;
  };
}
