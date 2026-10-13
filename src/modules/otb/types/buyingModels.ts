export type BuyingModelId =
  | "BM-1"
  | "BM-2"
  | "BM-3"
  | "BM-4"
  | "BM-5"
  | "BM-6"
  | "BM-7"
  | "BM-8";

export type InventoryOwnership =
  | "retailer-owned"
  | "vendor-consignment"
  | "brand-managed"
  | "seller-owned";

export type MilestoneStatus =
  | "complete"
  | "on_track"
  | "at_risk"
  | "not_due"
  | "overdue"
  | "upcoming"
  | "current";

export interface BuyingModelMeta {
  id: BuyingModelId;
  label: string;
  shortLabel: string;
  code: string;
  inventoryOwnership: InventoryOwnership;
  consumesOtb: boolean;
  leadTime: string;
  goesThroughRaPipeline: boolean;
  nDayStart: string;
  marginRange: string;
}

export interface BmAllocationSummary {
  buyingModelId: BuyingModelId;
  code: string;
  shortLabel: string;
  sharePct: number;
  optionTarget: number;
  optionsBuilt: number;
  milestoneStatus: MilestoneStatus;
}

export interface Milestone {
  name: string;
  nDay: string;
  date: string;
  isComplete: boolean;
  status: MilestoneStatus;
}

export interface BmMilestoneChain {
  buyingModelId: BuyingModelId;
  milestones: Milestone[];
}

export interface CategoryExecutionProfile {
  categoryId: string;
  categoryName: string;
  season: string;
  totalOtb: number;
  totalOptions: number;
  bmAllocations: BmAllocationSummary[];
  channelSplit: {
    offline: number;
    online: number;
    marketplace: number;
    social: number;
  };
  bmChannelMatrix: Record<BuyingModelId, {
    offline: number;
    online: number;
    marketplace: number;
    social: number;
  }>;
  sourcingEngineSplit: {
    scaleMargin: number;
    fastResponse: number;
    testRepeat: number;
  };
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
    marginRange: "65-70%"
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
    marginRange: "55-65%"
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
    marginRange: "55-60%"
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
    marginRange: "40-50%"
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
    marginRange: "55-65%"
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
    marginRange: "25-35%"
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
    marginRange: "15-25%"
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
    marginRange: "10-20%"
  }
};

export const BM_MILESTONE_TEMPLATES: Record<BuyingModelId, Array<{ name: string; nDay: string }>> = {
  "BM-1": [
    { name: "Trend Brief", nDay: "N-120" },
    { name: "Design Lock", nDay: "N-90" },
    { name: "Sample Approval", nDay: "N-60" },
    { name: "Production Order", nDay: "N-30" }
  ],
  "BM-2": [
    { name: "Brief to Vendor", nDay: "N-90" },
    { name: "Vendor Submits Designs", nDay: "N-60" },
    { name: "Review & Approve", nDay: "N-45" },
    { name: "Production Order", nDay: "N-30" }
  ],
  "BM-3": [
    { name: "Buying Brief Published", nDay: "N-75" },
    { name: "Vendor Submissions Due", nDay: "N-45" },
    { name: "Shortlist & Negotiate", nDay: "N-30" },
    { name: "PO Placed", nDay: "N-15" }
  ],
  "BM-4": [
    { name: "Catalog Received", nDay: "N-30" },
    { name: "Styles Selected", nDay: "N-15" },
    { name: "Order Placed", nDay: "N-7" }
  ],
  "BM-5": [
    { name: "Brand Brief", nDay: "N-120" },
    { name: "Design Start", nDay: "N-90" },
    { name: "Brand Gate 1", nDay: "N-75" },
    { name: "Sample Approval", nDay: "N-60" },
    { name: "Production Order", nDay: "N-30" }
  ],
  "BM-6": [
    { name: "Vendor Proposes Stock", nDay: "N-15" },
    { name: "Stock Ships", nDay: "N-7" },
    { name: "Stock Received", nDay: "N-Day" }
  ],
  "BM-7": [],
  "BM-8": []
};

export function getBuyingModelColor(bmId: BuyingModelId): { bg: string; text: string; border: string } {
  const model = BUYING_MODELS[bmId];

  if (model.goesThroughRaPipeline) {
    return {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200"
    };
  } else if (bmId === "BM-6") {
    return {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200"
    };
  } else {
    return {
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200"
    };
  }
}

export function getMilestoneStatusColor(status: MilestoneStatus): { bg: string; text: string; icon?: string } {
  switch (status) {
    case "complete":
      return { bg: "bg-green-100", text: "text-green-700", icon: "Check" };
    case "on_track":
      return { bg: "bg-indigo-100", text: "text-indigo-700" };
    case "current":
      return { bg: "bg-blue-100", text: "text-blue-700" };
    case "at_risk":
      return { bg: "bg-amber-100", text: "text-amber-700", icon: "AlertTriangle" };
    case "overdue":
      return { bg: "bg-red-100", text: "text-red-700", icon: "AlertCircle" };
    case "not_due":
    case "upcoming":
    default:
      return { bg: "bg-gray-100", text: "text-gray-600" };
  }
}