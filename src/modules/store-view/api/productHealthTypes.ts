import type { CxDataQuality, CompanionKpi as Kpi, CompanionAttentionCard as AttentionCard, DatePoint, LabelValue } from './companionApi';

type TableRow = Record<string, string | number>;
interface OverviewTrends {
  activeUsers: DatePoint[];
  engagedSessions: DatePoint[];
  funnelStarts: DatePoint[];
  paymentSuccess: DatePoint[];
  checkoutConv: DatePoint[];
  scanSuccess: DatePoint[];
  avgRating: DatePoint[];
}
interface CxTrends {
  dailyResponses: DatePoint[];
  ratingOverTime: DatePoint[];
  difficultyOverTime: DatePoint[];
}
interface DropOff { count: number; pct: number | null }
interface ScanOutcome { date: string; found: number; notFound: number; apiError: number; other: number; [key: string]: string | number }
interface ScannerStage { stage: string; users: number; sessions: number; events: number }
interface Progress { label: string; pct: number }
interface ScannedEan { ean: string; product: string; scans: number; found: string }
interface GapEan { ean: string; scans: number; stores: number; firstSeen: string }
interface GapStore { store: string; state: string; gapScans: number; gapEans: number }
interface ProductSection { hasData: boolean; notes: string[] }

export interface ProductOverviewResponse extends ProductSection {
  cxDataQuality: CxDataQuality;
  overviewKpis: Kpi[];
  overviewTrends: OverviewTrends;
  companyJourneyFunnel: LabelValue[];
  convertedSplit: LabelValue[];
  largestDropOffs: LabelValue[];
  scannerOutcomes: LabelValue[];
  experienceRatingDist: LabelValue[];
  overviewAttention: AttentionCard[];
}

export interface JourneyFunnelResponse extends ProductSection {
  journeyKpis: Kpi[];
  funnelSessions: LabelValue[];
  funnelUsers: LabelValue[];
  scannerStages: LabelValue[];
  scannerOutcomeBars: LabelValue[];
  scannerByCity: LabelValue[];
  scannerDropOff: DropOff;
  scanSuccessTrend: DatePoint[];
  scanOutcomeStacked: ScanOutcome[];
  scannerStageTable: ScannerStage[];
  cartCheckoutFunnel: LabelValue[];
  checkoutOutcome: LabelValue[];
  cartDropOffs: LabelValue[];
  dailyConversionTrend: DatePoint[];
  couponStageReach: LabelValue[];
  couponOutcome: LabelValue[];
  couponDetail: TableRow[];
  sessionsByPlatform: LabelValue[];
  conversionByPlatform: TableRow[];
  sessionsByOs: LabelValue[];
  conversionByOs: TableRow[];
}

export interface DiscoveryCatalogueResponse extends ProductSection {
  catalogueKpis: Kpi[];
  catalogueCompletionPct: number | null;
  snapshotTime: string;
  pipelineOverview: TableRow[];
  pipelineCompletion: TableRow[];
  attributeFill: Progress[];
  mediaCoverageByPipeline: LabelValue[];
  missingByPipeline: TableRow[];
  scanKpis: Kpi[];
  dailyScanVolume: DatePoint[];
  dailyScanSuccess: DatePoint[];
  scanOutcomeStacked: ScanOutcome[];
  scanOutcomesBar: LabelValue[];
  topScannedEans: ScannedEan[];
  topGapEans: GapEan[];
  gapStores: GapStore[];
}

export interface ProductCxResponse extends ProductSection {
  cxDataQuality: CxDataQuality;
  cxKpis: Kpi[];
  cxTrends: CxTrends;
  cxRatingDist: LabelValue[];
  purchaseDifficultySplit: LabelValue[];
  difficultyCategories: LabelValue[];
  writtenFeedbackParticipation: LabelValue[];
  difficultyByStore: LabelValue[];
  feedbackByStore: LabelValue[];
  feedbackByState: LabelValue[];
  cxFeedbackTable: TableRow[];
  surveyDeploymentInventory: TableRow[];
}
