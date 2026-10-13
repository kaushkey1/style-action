// Range Architecture Types - Based on Complete Specification v3.0

// ========== Buying Model Types ==========
export type BuyingModelId = "BM-1" | "BM-2" | "BM-3" | "BM-4" | "BM-5" | "BM-6" | "BM-7" | "BM-8";

export interface BuyingModelMeta {
  id: BuyingModelId;
  label: string;
  shortLabel: string;
  code: string;
  inventoryOwnership: "retailer-owned" | "vendor-consignment" | "brand-managed" | "seller-owned";
  consumesOtb: boolean;
  goesThroughRaPipeline: boolean;
  leadTime: string;
  nDayStart: string;
  lockTier: 1 | 2 | 3 | 4 | null;
}

export const BUYING_MODELS: Record<BuyingModelId, BuyingModelMeta> = {
  "BM-1": {
    id: "BM-1",
    label: "Private Label — In-House Design",
    shortLabel: "In-House",
    code: "BM-1",
    inventoryOwnership: "retailer-owned",
    consumesOtb: true,
    goesThroughRaPipeline: true,
    leadTime: "90-120 days",
    nDayStart: "N-120",
    lockTier: 1
  },
  "BM-2": {
    id: "BM-2",
    label: "Private Label — ODM",
    shortLabel: "ODM",
    code: "BM-2",
    inventoryOwnership: "retailer-owned",
    consumesOtb: true,
    goesThroughRaPipeline: true,
    leadTime: "60-90 days",
    nDayStart: "N-90",
    lockTier: 2
  },
  "BM-3": {
    id: "BM-3",
    label: "Vendor Design Submission",
    shortLabel: "Vendor Nom.",
    code: "BM-3",
    inventoryOwnership: "retailer-owned",
    consumesOtb: true,
    goesThroughRaPipeline: true,
    leadTime: "45-75 days",
    nDayStart: "N-75",
    lockTier: 2
  },
  "BM-4": {
    id: "BM-4",
    label: "External Brand Curation",
    shortLabel: "Ext. Brand",
    code: "BM-4",
    inventoryOwnership: "retailer-owned",
    consumesOtb: true,
    goesThroughRaPipeline: true,
    leadTime: "15-30 days",
    nDayStart: "N-30",
    lockTier: 3
  },
  "BM-5": {
    id: "BM-5",
    label: "Licensed Brand",
    shortLabel: "Licensed",
    code: "BM-5",
    inventoryOwnership: "retailer-owned",
    consumesOtb: true,
    goesThroughRaPipeline: true,
    leadTime: "90-120 days",
    nDayStart: "N-120",
    lockTier: 1
  },
  "BM-6": {
    id: "BM-6",
    label: "Consignment / SOR",
    shortLabel: "Consignment",
    code: "BM-6",
    inventoryOwnership: "vendor-consignment",
    consumesOtb: false,
    goesThroughRaPipeline: false,
    leadTime: "7-15 days",
    nDayStart: "N-15",
    lockTier: 4
  },
  "BM-7": {
    id: "BM-7",
    label: "Concession / SIS",
    shortLabel: "SIS",
    code: "BM-7",
    inventoryOwnership: "brand-managed",
    consumesOtb: false,
    goesThroughRaPipeline: false,
    leadTime: "N/A",
    nDayStart: "N/A",
    lockTier: null
  },
  "BM-8": {
    id: "BM-8",
    label: "Marketplace",
    shortLabel: "Marketplace",
    code: "BM-8",
    inventoryOwnership: "seller-owned",
    consumesOtb: false,
    goesThroughRaPipeline: false,
    leadTime: "N/A",
    nDayStart: "N/A",
    lockTier: null
  }
};

// ========== Status Types ==========
export type Status = "New" | "Ongoing" | "Completed" | "On Track" | "Optimal" | "Healthy" | "Locked" | "At Risk" | "Monitor" | "Low" | "Planning" | "Complete" | "Not Due" | "Overdue";
export type Priority = "Critical" | "Urgent" | "Medium" | "Opportunity";
export type Phase = "Range Planning" | "Designing" | "Costing" | "Sourcing";
export type MilestoneStatus = "complete" | "on_track" | "at_risk" | "not_due" | "overdue";

export const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  "On Track": { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "Optimal":  { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "Healthy":  { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "Locked":   { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "Complete": { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "Completed": { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "At Risk":  { bg: "bg-red-50",   text: "text-red-700",   dot: "bg-red-500" },
  "Overdue":  { bg: "bg-red-50",   text: "text-red-700",   dot: "bg-red-500" },
  "Monitor":  { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "Low":      { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "Planning": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "Ongoing":  { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  "New":      { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  "Not Due":  { bg: "bg-gray-100", text: "text-gray-500",  dot: "bg-gray-400" },
  "Approved": { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "Sent":     { bg: "bg-blue-50",  text: "text-blue-700",  dot: "bg-blue-500" },
  "Rejected": { bg: "bg-red-50",   text: "text-red-700",   dot: "bg-red-500" },
  "Draft":    { bg: "bg-gray-100", text: "text-gray-500",  dot: "bg-gray-400" },
  "Pending":  { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "RA Generated":          { bg: "bg-gray-100", text: "text-gray-500",  dot: "bg-gray-400" },
  "Submitted to PLM":      { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "Partially Submitted":   { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "PLM Submission Failed": { bg: "bg-red-50",   text: "text-red-700",   dot: "bg-red-500" },
};

export const PRIORITY_CONFIG: Record<Priority, { bg: string; text: string; border: string; dot: string }> = {
  "Critical":    { bg: "bg-red-50",   text: "text-red-700",   border: "border-red-200",   dot: "bg-red-500" },
  "Urgent":      { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  "Medium":      { bg: "bg-blue-50",  text: "text-blue-700",  border: "border-blue-200",  dot: "bg-blue-500" },
  "Opportunity": { bg: "bg-blue-50",  text: "text-blue-700",  border: "border-blue-200",  dot: "bg-blue-500" }
};

// ========== Core Data Types ==========

// Universal Range Row (output of all workflow modes)
export interface RangeRow {
  id: string;
  familyId: string;
  brickCode: string;
  brickName: string;
  silhouette: string;
  fabric: string;
  fit: string;
  pattern: string;
  neckType: string | null;
  sleeveType: string | null;
  colour: string;
  optionCount: number;
  buyQty: number;
  priceRangeMin: number;
  priceRangeMax: number;
  asp: number;
  buyingModelId: BuyingModelId;
  source: "historical" | "ftf" | "historical+ftf" | "vendor_submission" | "brand_catalog" | "consignment_proposal";
  status: "draft" | "accepted" | "locked";
  vendorId?: string;
  vendorName?: string;
  brandName?: string;
  submissionId?: string;
  proposalId?: string;
  commissionPct?: number;
  sampleStatus?: "not_required" | "pending" | "approved" | "rejected";
}

// BM Allocation Summary (used across multiple screens)
export interface BmAllocationSummary {
  buyingModelId: BuyingModelId;
  code: string;
  shortLabel: string;
  sharePct: number;
  optionTarget: number;
  optionsBuilt: number;
  qtyTarget?: number;
  milestoneStatus: MilestoneStatus;
  lockDeadline?: string | null;     // ISO date or null for BM-7/8
  daysUntilLock?: number | null;
}

// Network Level Types
export interface RANetworkKPI {
  rangeLockProgress: {
    value: number;
    lockedSegments: number;
    totalSegments: number;
    optionsLocked: number;
    totalOptions: number;
    raLocked: number;
    raTarget: number;
    nonRaLocked: number;
    nonRaTarget: number;
    unlockedSegments: string[];
    deadlineDate: string;
    daysRemaining: number;
  };
  coreFashionSplit: {
    core: number;
    fashion: number;
    targetCore: number;
    targetFashion: number;
    status: Status;
  };
  fixtureUtilization: {
    value: number;
    capacity: number;
    planned: number;
    density: number;
    targetDensity: number;
    status: Status;
  };
  ftfAdoption: {
    value: number;
    adopted: number;
    partial: number;
    ignored: number;
    ftfOptions: number;
    totalOptions: number;
    status: Status;
  };
}

// Segment Level Types
export interface RASegment {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  category: string;
  season: string;
  phase: Phase;
  totalOptions: number;
  optionsLocked: number;
  raOptions: number;
  raOptionTarget: number;
  nonRaOptions: number;
  nonRaOptionTarget: number;
  buyQty: number;
  coreSplit: number;
  fashionSplit: number;
  fixtureUtilization: number;
  ftfAdoption: number;
  storesCovered: number;
  totalStores: number;
  status: Status;
  isLocked: boolean;
  alertMessage?: string;
  bmCount: number;
  families: RAFamily[];
}

// Family Level Types
export interface RAFamily {
  id: string;
  code: string;
  name: string;
  segmentId: string;
  options: number;
  optionTarget?: number;
  buyQty: number;
  budget?: number; // Directional based on historical ASP
  fashionPct: number;
  ftfPct: number;
  stores: number;
  totalStores?: number;
  status: Status;
  alertMessage?: string;
  bmCount: number;
  bmAllocations: BmAllocationSummary[];
  raPlanPct: number;
  vendorPct: number;
  contributionPct?: number;
  progressPct?: number;
  stage?: string;
  risk?: "Low" | "Medium" | "High" | "Critical";
}

// Brick Level Types
export interface RABrick {
  id: string;
  familyId: string;
  name: string;
  silhouette: string;
  fabric: string;
  print: string;
  pattern?: string;
  priceRange: {
    hist: string;
    sys: string;
    buyer: string;
  };
  optionCount: {
    hist: number;
    sys: number;
    buyer: number;
  };
  totalQty: {
    hist: number;
    sys: number;
    buyer: number;
  };
  source: string;
  buyingModelId: BuyingModelId | null;
  isBmEditable: boolean;
  isPlaceholder: boolean;
  progressPct?: number;
  status?: Status;
  alertMessage?: string;
}

// System Recommendations
export interface SystemRecommendation {
  id: string;
  priority: Priority;
  type: "bm_milestone" | "inventory" | "allocation" | "performance" | "ftf" | "lock";
  action: string;
  description: string;
  segments?: string[];
  metric?: string;
  impact?: string;
  linkedKpi?: string;
  rationale?: string;
  segmentId?: string;
  familyId?: string;
  buyingModelId?: BuyingModelId;
  actionButton?: {
    label: string;
    link?: string;
  };
  isExpanded?: boolean;
}

// Store Range Types
export interface StoreRangeCard {
  id: string;
  storeCode: string;
  storeName: string;
  storeGrade: "A0" | "A1" | "A2" | "A3" | "B" | "C";
  storeRank: number;
  totalOptions: number;
  aopAchievement: number;
  otbFit: number;
  fixtureUtilization: number;
  segmentCount: number;
  fixtureCount: number;
  isTopPerformer: boolean;
}

// Channel Split
export interface ChannelSplit {
  offline: number;
  online: number;
  offlineBreakdown: {
    eboA0A1: number;
    eboA2A3: number;
    factory: number;
  };
  onlineBreakdown: {
    ajio: number;
    d2c: number;
    social: number;
  };
}

// Hit (Season) Selection
export interface Hit {
  id: string;
  name: string;
  season: string;
  year: number;
  startDate: string;
  endDate: string;
  n120Date: string;
  daysUntilN120: number;
  isActive: boolean;
}