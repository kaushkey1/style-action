import type { Product } from './types';

/** Source channel the style arrived through */
export type StyleSource = 'daas' | 'vendor' | 'rebuy';

/** Curation stage in the shortlisting funnel */
export type CurationStage = 'pool' | 'designer_shortlist' | 'buyer_shortlist' | 'final_approved';

/** Shortlist decision at each curation level */
export type ShortlistDecision = 'pending' | 'shortlisted' | 'rejected' | 'needs_modification';

/** Color variant for a style */
export interface Colorway {
  id: string;
  name: string;
  colorHex: string;
  images: string[];
  fabricSwatches: string[];
  available: boolean;
}

/** Annotation on a mood board style */
export interface MoodBoardAnnotation {
  styleId: string;
  note: string;
  author: string;
  updatedAt: string;
}

/** Send-back record when a collection is returned for revision */
export interface CollectionSendBack {
  podId: string;
  generalComment: string;
  flaggedStyles: Array<{ styleId: string; comment: string }>;
  sentBackBy: string;
  sentBackAt: string;
}

/** Brand DNA — comprehensive brand identity profile */
export interface BrandDNA {
  brandId: string;
  brandName: string;
  brandClassification: string;
  visualIdentity: {
    overview: string;
    masterPalette: string[];
    accessibilityNotes: string;
  };
  designGuardrails: {
    shouldDo: string[];
    shouldNotDo: string[];
  };
  marketPositioning: {
    brandTier: string;
    targetAudience: { genders: string[]; regions: string[] };
    ageRange: string;
    psychographics: string;
    styleArchetypes: string[];
    demographicSummary: string;
  };
  brandDescriptiveTags: string[];
  priceRange: { currency: string; min: number; median: number; max: number };
  primaryProductCategories: string[];
  culturalInfluences: {
    culturalReferences: string[];
    languageOrScriptUsage: string;
    sensitivityNotes: string;
    importantSymbolsOrMotifs: string[];
    subcultureAssociations: string[];
    festivalsOrOccasions: string[];
  };
  coreValuesAndVoice: {
    voiceStyle: string;
    heritageBackground: string;
    designThemeSummary: string;
    brandValuesAndTones: string;
    brandStoryAndIdeology: string;
  };
  sourceReferences: string[];
}

/** Extended style card — wraps Product with showroom workflow metadata */
export interface ShowroomStyle {
  product: Product;

  // Source & provenance
  source: StyleSource;
  vendorId?: string;
  vendorName?: string;

  // Curation state
  curationStage: CurationStage;
  shortlistStatus: {
    designer: ShortlistDecision;
    designerNote?: string;
    designerAt?: string;
    buyer: ShortlistDecision;
    buyerNote?: string;
    buyerAt?: string;
    categoryHead: ShortlistDecision;
    categoryHeadNote?: string;
    categoryHeadAt?: string;
  };

  // Commercial validation
  commercial: {
    mrp: number;
    asp: number;
    unitCost: number;
    margin: number;
    marginPass: boolean;
    sellThroughRate?: number;
  };

  // Source-specific metadata
  trendAttribution?: {
    signal: string;
    signalStrength: number;
    competitorGap?: string;
    trendDirection: 'rising' | 'stable' | 'declining';
  };
  bom?: {
    fabricCost: number;
    trimsCost: number;
    cmtCost: number;
    logisticsCost: number;
    totalLandedCost: number;
  };
  historicalPerformance?: {
    priorSeason: string;
    sellThrough: number;
    returnRate: number;
    storesStocked: number;
    totalStores: number;
    refreshNote?: string;
  };

  // POD & range assignment
  podId: string;
  podName: string;
  segmentId: string;
  subCategoryId: string;
  priceTier: 'entry' | 'mid' | 'premium';
  fashionGrade: 'core' | 'fashion';

  // Physical product details
  silhouetteDescription: string;
  fabricType: string;
  fabricSwatches: string[];
  unitCost: number | null;

  // Color variants
  colorways: Colorway[];
  activeColorwayId: string | null;

  // Mood board assignments
  moodBoardIds: string[];

  // Agent interactions
  agentFlags: {
    marginAlert?: boolean;
    gapFill?: boolean;
    conflictFlag?: boolean;
    autoSurfaced?: boolean;
  };
}

/** Mood board — thematic grouping of styles */
export interface MoodBoard {
  id: string;
  name: string;
  theme: string;
  description: string;
  colorStory: string[];
  styleIds: string[];
  annotations: MoodBoardAnnotation[];
  createdBy: string;
  podId: string;
  season: string;
  totalRevenue: number;
  constraintCheck: {
    passing: number;
    total: number;
    issues: string[];
  };
  createdAt: string;
  updatedAt: string;
}

/** Range constraint validation result */
export interface ConstraintCompliance {
  overallScore: number;
  checks: {
    optionCount: { actual: number; target: number; pass: boolean };
    segmentMix: {
      segments: { id: string; name: string; actual: number; target: number; pass: boolean }[];
    };
    coreFashionSplit: {
      coreActual: number; coreTarget: number;
      fashionActual: number; fashionTarget: number;
      pass: boolean;
    };
    priceLadder: {
      tiers: { tier: string; subCategory: string; covered: boolean }[];
      gaps: string[];
    };
    marginFloor: {
      passingStyles: number;
      failingStyles: number;
      pass: boolean;
    };
    otbBudget: {
      utilized: number; envelope: number;
      percentage: number; pass: boolean;
    };
    fabricPalette: { inPalette: number; outOfPalette: number; pass: boolean };
    fixtureCapacity: { mapped: number; total: number; pass: boolean };
  };
  issues: {
    severity: 'critical' | 'warning';
    description: string;
    recommendation: string;
  }[];
}

/** Collection progress for the Collection Progress Dashboard */
export interface CollectionProgress {
  podId: string;
  podName: string;
  season: string;
  poolCount: number;
  designerShortlistCount: number;
  buyerShortlistCount: number;
  finalApprovedCount: number;
  status: 'not_started' | 'designer_review' | 'buyer_review' | 'cat_head_review' | 'finalized';
  completionPercentage: number;
  atRisk: boolean;
  riskReason?: string;
  targetNDay?: string;
  designer: string;
  buyer: string;
  categoryHead: string;
  sendBacks?: CollectionSendBack[];
}

/** Showroom-level summary KPIs */
export interface ShowroomSummary {
  season: string;
  totalPods: number;
  podsFinalized: number;
  totalStylesApproved: number;
  totalStylesTarget: number;
  overallCompletion: number;
  avgMargin: number;
  avgComplianceScore: number;
  podsAtRisk: number;
  collections: CollectionProgress[];
}
