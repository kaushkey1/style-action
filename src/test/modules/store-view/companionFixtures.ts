import type {
  BusinessOverviewResponse, CompanionAiSummary, CompanionKpi, SalesDetailResponse,
  StoreDetailResponse, StoreDirRow, StorePerformanceResponse,
} from '@/modules/store-view/api/companionApi';
import type {
  DiscoveryCatalogueResponse, JourneyFunnelResponse, ProductCxResponse, ProductOverviewResponse,
} from '@/modules/store-view/api/productHealthTypes';

export const range = { from: '2026-09-28', to: '2026-09-29' };
export const quality = { trustworthy: true, responseIdsUnique: true, storeMatchCoveragePct: 100, note: null };
const kpi = (key: string, label: string, value: string): CompanionKpi => ({ key, label, value, trend: '', status: 'success' });

export const overview: ProductOverviewResponse = {
  hasData: true, notes: ['Catalogue uses the latest snapshot.'], cxDataQuality: quality,
  overviewKpis: [kpi('users', 'Active users', '7,731')],
  overviewTrends: { activeUsers: [], engagedSessions: [], funnelStarts: [], paymentSuccess: [], checkoutConv: [], scanSuccess: [], avgRating: [] },
  companyJourneyFunnel: [], convertedSplit: [], largestDropOffs: [], scannerOutcomes: [], experienceRatingDist: [], overviewAttention: [],
};

export const journey: JourneyFunnelResponse = {
  hasData: true, notes: [], journeyKpis: [kpi('recovery', 'Recovered after payment failure', '47')],
  funnelSessions: [{ label: 'Payment successful', value: 301 }, { label: 'Confirmed', value: 302 }],
  funnelUsers: [{ label: 'Payment successful', value: 201 }, { label: 'Confirmed', value: 202 }],
  scannerStages: [], scannerOutcomeBars: [], scannerByCity: [], scannerDropOff: { count: 0, pct: null },
  scanSuccessTrend: [], scanOutcomeStacked: [], scannerStageTable: [], cartCheckoutFunnel: [], checkoutOutcome: [], cartDropOffs: [], dailyConversionTrend: [],
  couponStageReach: [], couponOutcome: [], couponDetail: [], sessionsByPlatform: [], conversionByPlatform: [], sessionsByOs: [], conversionByOs: [],
};

export const discovery: DiscoveryCatalogueResponse = {
  hasData: true, notes: [], catalogueKpis: [
    kpi('complete_catalog', 'Complete catalogue', '569'),
    kpi('missing_catalog', 'Missing catalogue', '1,431'),
    kpi('completion_percentage', 'Catalogue completion', '28.45%'),
  ],
  catalogueCompletionPct: 28.45, snapshotTime: '2026-08-17T10:00:00',
  pipelineOverview: [
    { pipeline: 'SAP', total: '2,000', completed: '569', pct: '28.4%' },
    { pipeline: 'AJIO CE', total: '1,000', completed: '996', pct: '99.6%' },
  ],
  pipelineCompletion: [{ pipeline: 'SAP', value: 28.45 }, { pipeline: 'AJIO CE', value: 99.58 }],
  attributeFill: [], mediaCoverageByPipeline: [{ label: 'AJIO · video', value: 42 }],
  missingByPipeline: [], scanKpis: [], dailyScanVolume: [], dailyScanSuccess: [], scanOutcomeStacked: [], scanOutcomesBar: [],
  topScannedEans: [{ ean: 'AR439409', product: 'Shirt', scans: 7, found: 'Yes' }],
  topGapEans: [{ ean: 'Missing EAN', scans: 3, stores: 2, firstSeen: '2026-09-28' }], gapStores: [],
};

export const cx: ProductCxResponse = {
  hasData: true, notes: [], cxDataQuality: quality,
  cxKpis: [kpi('responses', 'Survey responses', '1,234')],
  cxTrends: { dailyResponses: [], ratingOverTime: [], difficultyOverTime: [] },
  cxRatingDist: [], purchaseDifficultySplit: [], difficultyCategories: [], writtenFeedbackParticipation: [], difficultyByStore: [], feedbackByStore: [], feedbackByState: [],
  cxFeedbackTable: Array.from({ length: 25 }, (_, index) => ({
    store: `Feedback store ${index + 1}`, state: 'Uttarakhand', responses: '10', avg: '4.25', positive: '75.0%', difficulty: '25.0%', wfp: '60.0%',
  })),
  surveyDeploymentInventory: [{ id: 'deployment-a', slot: 'checkout', survey: 'survey-a', deployedOn: '2026-09-28', status: 'Active', responses: 10 }],
};

export const briefing: CompanionAiSummary = {
  label: 'Product briefing', question: 'What changed in this period?', summary: 'Live catalogue completion is 28.45%.', updated_at: null, source: 'redis_today',
};

export const business: BusinessOverviewResponse = {
  overviewKpis: [kpi('orders', 'Completed orders', '23')], growthUnavailableNote: '',
  overviewTrends: { egmv: [], orders: [], customers: [], aov: [], orderingStores: [], fulfilment: [], paymentFailure: [] },
  orderLifecycle: [], topStoresByEgmv: [], revenueByState: [], ratingDistribution: [], purchaseDifficultySplit: [], attentionCards: [], cxDataQuality: quality,
};

export const stores: StorePerformanceResponse = {
  storeKpis: [kpi('ordering', 'Ordering stores', '1')], storeActivityMix: [],
  storeActivityTrends: { activeStores: [], orderingStores: [], scans: [], scanActiveStores: [] },
  orderRecency: [], topStoresByEgmv: [], topStoresByOrders: [], topStoresByScans: [], scansVsOrders: [],
};

export const storeRow: StoreDirRow = {
  uid: 1234, name: 'RRL Trends Dehradun', id: 'ST-TEA3', code: 'TEA3', city: 'Dehradun', state: 'Uttarakhand', activity: 'Ordering + scanning',
  orders: 23, egmv: '₹21.67 L', scans: 120, scanSuccess: '75.0%', lastOrder: '2026-09-29', daysSince: 1, lat: null, lng: null,
};

export const storeDetail: StoreDetailResponse = {
  name: 'RRL Trends Dehradun', code: 'TEA3', city: 'Dehradun', state: 'Uttarakhand', lat: null, lng: null,
  orders: 23, egmv: '₹21.67 L', scanAttempts: 120, scanSuccess: 90, scanSuccessRate: '75.0%', lastOrder: '2026-09-29',
  dailyOrders: [], dailyEgmv: [], dailyScans: [], topBrands: [], paymentSplit: [],
};

export const sales: SalesDetailResponse = {
  revenueByState: [{ label: 'Maharashtra', value: 5500000 }], salesKpis: [], orderValueHistogram: [], paymentModeShare: [],
  salesTrends: { monthlyOrders: [], monthlyEgmv: [] }, storesByEgmv: [], storesByOrderCount: [], topBrandsByEgmv: [], brandUnitsSold: [], ordersByState: [],
  salesTable: [{ date: '2026-09-29', orderId: 'test-order', store: 'Test store', state: 'Maharashtra', customer: 'T***', units: 1, egmv: '₹2,499.00', payment: 'UPI', status: 'Completed' }],
};

export const apiResponses: Record<string, unknown> = {
  '/companion/product-overview': overview, '/companion/journey-funnel': journey,
  '/companion/discovery-catalogue': discovery, '/companion/product-cx': cx,
  '/companion/ai-summary': briefing, '/companion/business-overview': business,
  '/companion/store-performance': stores, '/companion/store-locations': { stores: [] },
  '/companion/store-directory': { rows: [storeRow], total: 1 },
  '/companion/store-detail': storeDetail, '/companion/sales-detail': sales,
};
