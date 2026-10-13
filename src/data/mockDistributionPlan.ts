// ─── Distribution Plan Types ─────────────────────────────────────────────────

export type ClusterType = "A" | "A1" | "A2" | "A3";
export type FashionGrade = "APL-Core" | "APL-Fashion" | "APL-Ultimate" | "APL-Fashion Basics";
export type AllocationStatus = "draft" | "in_progress" | "pending_approval" | "approved" | "executed";
export type AllocationPhase = "pre_step" | "step_1" | "step_2" | "step_3" | "step_3_5" | "step_4" | "completed";

// MCH Hierarchy
export interface MCH {
  segment: string;
  family: string;
  class: string;
  brick: string;
}

// Store information
export interface Store {
  storeId: string;
  storeName: string;
  cluster: ClusterType;
  dcId: string;
  dcName: string;
  aopTargetRevenue: number;
  region: string;
  city: string;
  code: string; // Store code like RAK0, R300, etc.
}

// Size profile for stores
export interface StoreSizeProfile {
  storeId: string;
  mch: MCH;
  fashionGrade: FashionGrade;
  sizeRatios: Record<string, number>; // e.g., {S: 10, M: 35, L: 40, XL: 15}
  pivotalSizes: string[]; // Sizes covering 80% of volume
  effectiveSSU: number; // Sum of size ratios
}

// Bought option from Buy Plan
export interface BoughtOption {
  optionId: string;
  styleName: string;
  styleCode: string;
  color: string;
  mch: MCH;
  fashionGrade: FashionGrade;
  mrp: number;
  totalBuyQty: number;
  sizeSetRatio: Record<string, number>;
  buyBySize: Record<string, number>;
  imageUrl: string;
  brand: string;
}

// Store allocation record
export interface StoreAllocation {
  storeId: string;
  optionId: string;
  p1Qty: number; // Ship to store
  p3Qty: number; // Hold at DC
  p1BySize: Record<string, number>;
  p3BySize: Record<string, number>;
  score: number;
  raMatchId?: string;
  allocationType: "primary" | "residual_phase_a" | "residual_phase_b";
}

// Distribution Plan main entity
export interface DistributionPlan {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: string;
  status: AllocationStatus | 'dp_generated' | 'submitted_to_procuro' | 'partially_submitted';
  currentPhase: AllocationPhase;
  buyPlanId: string; // Associated Buy Plan (one-to-one)
  hitMonth: string; // Hit month display like "May 2024"

  // Configuration
  config: {
    sizeTailThreshold: number; // Default 5%
    unitsTargetPct: number; // Default 100%
    unitsCapPct: number; // Default 120%
    maxSizeSets: number; // Default 2
    pivotalThresholdPct: number; // Default 80%
    clusterPriority: Record<ClusterType, number>; // Priority order
  };

  // Summary metrics
  metrics: {
    totalStores: number;
    totalOptions: number;
    totalBuyQty: number;
    totalAllocatedQty: number;
    allocationRate: number;
    p1Qty: number;
    p3Qty: number;
    avgFillRate: number;
    storesWithShortfall: number;
  };

  // Validation results
  validation: {
    criticalIssues: ValidationIssue[];
    warningIssues: ValidationIssue[];
    validationTime?: Date;
  };

  // Allocation results by phase
  allocations: StoreAllocation[];
}

export interface ValidationIssue {
  code: string;
  severity: "CRITICAL" | "WARNING";
  description: string;
  affectedRows: number;
  details: string[];
}

// Planogram capacity
export interface PlanogramCapacity {
  storeId: string;
  mch: MCH;
  fashionGrade: FashionGrade;
  optionsCapacity: number;
  unitsCapacity: number;
  currentOptions: number;
  currentUnits: number;
}

// RA Demand
export interface RADemand {
  storeId: string;
  mch: MCH;
  fashionGrade: FashionGrade;
  raOptionId: string;
  demandQty: number;
  mrpMin: number;
  mrpMax: number;
  attributes: {
    fit?: string;
    fibre?: string;
    pattern?: string;
    length?: string;
  };
}

// Phase-wise allocation summary
export interface AllocationSummary {
  phase: AllocationPhase;
  timestamp: Date;
  optionsAllocated: number;
  quantityAllocated: number;
  storesServed: number;
  details: {
    clusterBreakdown: Record<ClusterType, number>;
    gradeBreakdown: Record<FashionGrade, number>;
  };
}

// ─── Mock Data Generation ────────────────────────────────────────────────────

// Generate stores with codes matching the image format
export const mockStores: Store[] = [
  // A cluster stores (Premium) - using codes like RAK0, R300, etc.
  {
    storeId: "S001",
    storeName: "Phoenix Mall Mumbai",
    cluster: "A",
    dcId: "DC01",
    dcName: "Mumbai DC",
    aopTargetRevenue: 85000000,
    region: "West",
    city: "Mumbai",
    code: "RAK0",
  },
  {
    storeId: "S002",
    storeName: "Select City Delhi",
    cluster: "A",
    dcId: "DC02",
    dcName: "Delhi DC",
    aopTargetRevenue: 78000000,
    region: "North",
    city: "Delhi",
    code: "R300",
  },
  {
    storeId: "S003",
    storeName: "Forum Mall Bangalore",
    cluster: "A",
    dcId: "DC03",
    dcName: "Bangalore DC",
    aopTargetRevenue: 72000000,
    region: "South",
    city: "Bangalore",
    code: "R400",
  },
  {
    storeId: "S004",
    storeName: "Quest Mall Kolkata",
    cluster: "A",
    dcId: "DC04",
    dcName: "Kolkata DC",
    aopTargetRevenue: 68000000,
    region: "East",
    city: "Kolkata",
    code: "R500",
  },
  {
    storeId: "S005",
    storeName: "Palladium Mumbai",
    cluster: "A",
    dcId: "DC01",
    dcName: "Mumbai DC",
    aopTargetRevenue: 82000000,
    region: "West",
    city: "Mumbai",
    code: "R600",
  },
  {
    storeId: "S006",
    storeName: "VR Mall Chennai",
    cluster: "A",
    dcId: "DC03",
    dcName: "Bangalore DC",
    aopTargetRevenue: 75000000,
    region: "South",
    city: "Chennai",
    code: "R700",
  },

  // A1 cluster stores
  {
    storeId: "S011",
    storeName: "Inorbit Mall Pune",
    cluster: "A1",
    dcId: "DC01",
    dcName: "Mumbai DC",
    aopTargetRevenue: 55000000,
    region: "West",
    city: "Pune",
    code: "R101",
  },
  {
    storeId: "S012",
    storeName: "City Centre Gurgaon",
    cluster: "A1",
    dcId: "DC02",
    dcName: "Delhi DC",
    aopTargetRevenue: 52000000,
    region: "North",
    city: "Gurgaon",
    code: "R102",
  },
  {
    storeId: "S013",
    storeName: "Express Avenue Chennai",
    cluster: "A1",
    dcId: "DC03",
    dcName: "Bangalore DC",
    aopTargetRevenue: 48000000,
    region: "South",
    city: "Chennai",
    code: "R103",
  },
  {
    storeId: "S014",
    storeName: "Mantri Mall Hyderabad",
    cluster: "A1",
    dcId: "DC03",
    dcName: "Bangalore DC",
    aopTargetRevenue: 46000000,
    region: "South",
    city: "Hyderabad",
    code: "R104",
  },
  {
    storeId: "S015",
    storeName: "DLF Mall Noida",
    cluster: "A1",
    dcId: "DC02",
    dcName: "Delhi DC",
    aopTargetRevenue: 50000000,
    region: "North",
    city: "Noida",
    code: "R105",
  },
  {
    storeId: "S016",
    storeName: "Mall of India Bengaluru",
    cluster: "A1",
    dcId: "DC03",
    dcName: "Bangalore DC",
    aopTargetRevenue: 54000000,
    region: "South",
    city: "Bangalore",
    code: "R106",
  },

  // A2 cluster stores
  {
    storeId: "S021",
    storeName: "VR Mall Surat",
    cluster: "A2",
    dcId: "DC01",
    dcName: "Mumbai DC",
    aopTargetRevenue: 35000000,
    region: "West",
    city: "Surat",
    code: "R201",
  },
  {
    storeId: "S022",
    storeName: "Pacific Mall Dehradun",
    cluster: "A2",
    dcId: "DC02",
    dcName: "Delhi DC",
    aopTargetRevenue: 32000000,
    region: "North",
    city: "Dehradun",
    code: "R202",
  },
  {
    storeId: "S023",
    storeName: "Lulu Mall Kochi",
    cluster: "A2",
    dcId: "DC03",
    dcName: "Bangalore DC",
    aopTargetRevenue: 30000000,
    region: "South",
    city: "Kochi",
    code: "R203",
  },
  {
    storeId: "S024",
    storeName: "City Mall Bhubaneswar",
    cluster: "A2",
    dcId: "DC04",
    dcName: "Kolkata DC",
    aopTargetRevenue: 28000000,
    region: "East",
    city: "Bhubaneswar",
    code: "R204",
  },
  {
    storeId: "S025",
    storeName: "Nexus Mall Ahmedabad",
    cluster: "A2",
    dcId: "DC01",
    dcName: "Mumbai DC",
    aopTargetRevenue: 33000000,
    region: "West",
    city: "Ahmedabad",
    code: "R205",
  },
  {
    storeId: "S026",
    storeName: "Elante Mall Chandigarh",
    cluster: "A2",
    dcId: "DC02",
    dcName: "Delhi DC",
    aopTargetRevenue: 34000000,
    region: "North",
    city: "Chandigarh",
    code: "R206",
  },

  // A3 cluster stores
  {
    storeId: "S031",
    storeName: "DB Mall Bhopal",
    cluster: "A3",
    dcId: "DC02",
    dcName: "Delhi DC",
    aopTargetRevenue: 22000000,
    region: "Central",
    city: "Bhopal",
    code: "R301",
  },
  {
    storeId: "S032",
    storeName: "Central Mall Patna",
    cluster: "A3",
    dcId: "DC04",
    dcName: "Kolkata DC",
    aopTargetRevenue: 20000000,
    region: "East",
    city: "Patna",
    code: "R302",
  },
  {
    storeId: "S033",
    storeName: "Treasure Mall Indore",
    cluster: "A3",
    dcId: "DC01",
    dcName: "Mumbai DC",
    aopTargetRevenue: 18000000,
    region: "Central",
    city: "Indore",
    code: "R303",
  },
  {
    storeId: "S034",
    storeName: "Forum Mall Mysore",
    cluster: "A3",
    dcId: "DC03",
    dcName: "Bangalore DC",
    aopTargetRevenue: 16000000,
    region: "South",
    city: "Mysore",
    code: "R304",
  },
  {
    storeId: "S035",
    storeName: "City Centre Raipur",
    cluster: "A3",
    dcId: "DC02",
    dcName: "Delhi DC",
    aopTargetRevenue: 19000000,
    region: "Central",
    city: "Raipur",
    code: "R305",
  },
  {
    storeId: "S036",
    storeName: "Mall Road Ludhiana",
    cluster: "A3",
    dcId: "DC02",
    dcName: "Delhi DC",
    aopTargetRevenue: 21000000,
    region: "North",
    city: "Ludhiana",
    code: "R306",
  },
];

// Sample bought options
export const mockBoughtOptions: BoughtOption[] = [
  {
    optionId: "OPT001",
    styleName: "Classic Polo Shirt",
    styleCode: "PLO-001",
    color: "Navy Blue",
    mch: { segment: "Apparel", family: "Tops", class: "T-Shirts", brick: "Polo" },
    fashionGrade: "APL-Core",
    mrp: 1499,
    totalBuyQty: 5000,
    sizeSetRatio: { S: 1, M: 3, L: 3, XL: 2, XXL: 1 },
    buyBySize: { S: 500, M: 1500, L: 1500, XL: 1000, XXL: 500 },
    imageUrl: "https://images.unsplash.com/photo-1527719327859-c6ce80353573",
    brand: "Netplay",
  },
  {
    optionId: "OPT002",
    styleName: "Floral Print Dress",
    styleCode: "DRS-045",
    color: "Pink",
    mch: { segment: "Apparel", family: "Dresses", class: "Casual", brick: "Midi" },
    fashionGrade: "APL-Fashion",
    mrp: 2499,
    totalBuyQty: 3000,
    sizeSetRatio: { XS: 1, S: 2, M: 3, L: 2, XL: 1 },
    buyBySize: { XS: 333, S: 667, M: 1000, L: 667, XL: 333 },
    imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1",
    brand: "Karigari",
  },
  {
    optionId: "OPT003",
    styleName: "Slim Fit Jeans",
    styleCode: "JNS-210",
    color: "Dark Blue",
    mch: { segment: "Apparel", family: "Bottoms", class: "Denim", brick: "Jeans" },
    fashionGrade: "APL-Core",
    mrp: 1999,
    totalBuyQty: 4500,
    sizeSetRatio: { "28": 1, "30": 2, "32": 3, "34": 2, "36": 1 },
    buyBySize: { "28": 500, "30": 1000, "32": 1500, "34": 1000, "36": 500 },
    imageUrl: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a",
    brand: "John Players",
  },
  {
    optionId: "OPT004",
    styleName: "Designer Kurta",
    styleCode: "KRT-089",
    color: "Maroon",
    mch: { segment: "Apparel", family: "Ethnic", class: "Kurta", brick: "Embroidered" },
    fashionGrade: "APL-Ultimate",
    mrp: 3999,
    totalBuyQty: 2000,
    sizeSetRatio: { S: 1, M: 2, L: 2, XL: 1 },
    buyBySize: { S: 333, M: 667, L: 667, XL: 333 },
    imageUrl: "https://images.unsplash.com/photo-1594739394785-8e9a5a1cf6b5",
    brand: "Ethnix",
  },
];

// Sample distribution plans
export const mockDistributionPlans: DistributionPlan[] = [
  {
    id: "DP001",
    name: "Summer 2024 Core Distribution",
    createdAt: new Date("2024-03-15"),
    createdBy: "Planning Team",
    status: "dp_generated" as const,
    currentPhase: "completed",
    buyPlanId: "CBP-001",
    hitMonth: "May 2024",

    config: {
      sizeTailThreshold: 5,
      unitsTargetPct: 100,
      unitsCapPct: 120,
      maxSizeSets: 2,
      pivotalThresholdPct: 80,
      clusterPriority: { A: 1, A1: 2, A2: 3, A3: 4 },
    },

    metrics: {
      totalStores: 16,
      totalOptions: 45,
      totalBuyQty: 125000,
      totalAllocatedQty: 118500,
      allocationRate: 94.8,
      p1Qty: 85000,
      p3Qty: 33500,
      avgFillRate: 92.3,
      storesWithShortfall: 2,
    },

    validation: {
      criticalIssues: [],
      warningIssues: [
        {
          code: "V-06",
          severity: "WARNING",
          description: "MCH×FG in RA demand with no matching bought options",
          affectedRows: 3,
          details: ["Apparel/Tops/Shirts/Formal - APL-Ultimate has demand but no bought options"],
        },
      ],
      validationTime: new Date("2024-03-15T10:30:00"),
    },

    allocations: [], // Would contain detailed allocations
  },
  {
    id: "DP002",
    name: "Festive 2024 Fashion Distribution",
    createdAt: new Date("2024-03-18"),
    createdBy: "Merchandising Team",
    status: "submitted_to_procuro" as const,
    currentPhase: "step_3",
    buyPlanId: "CBP-003",
    hitMonth: "September 2024",

    config: {
      sizeTailThreshold: 5,
      unitsTargetPct: 100,
      unitsCapPct: 120,
      maxSizeSets: 2,
      pivotalThresholdPct: 75,
      clusterPriority: { A: 1, A1: 1, A2: 2, A3: 3 }, // A and A1 same priority
    },

    metrics: {
      totalStores: 16,
      totalOptions: 68,
      totalBuyQty: 180000,
      totalAllocatedQty: 95000, // In progress
      allocationRate: 52.8,
      p1Qty: 72000,
      p3Qty: 23000,
      avgFillRate: 78.5,
      storesWithShortfall: 5,
    },

    validation: {
      criticalIssues: [
        {
          code: "V-02",
          severity: "CRITICAL",
          description: "Options with zero or negative buy quantity",
          affectedRows: 1,
          details: ["Option OPT-X45 has total_buy_qty = 0"],
        },
      ],
      warningIssues: [
        {
          code: "V-07",
          severity: "WARNING",
          description: "Planogram units capacity less than current units",
          affectedRows: 2,
          details: ["Store S012 - Negative headroom for Apparel/Dresses/Casual"],
        },
      ],
      validationTime: new Date("2024-03-18T14:15:00"),
    },

    allocations: [],
  },
  {
    id: "DP003",
    name: "Winter 2024 Basic Distribution",
    createdAt: new Date("2024-03-20"),
    createdBy: "Operations Team",
    status: "partially_submitted" as const,
    currentPhase: "pre_step",
    buyPlanId: "BBP-001",
    hitMonth: "December 2024",

    config: {
      sizeTailThreshold: 5,
      unitsTargetPct: 100,
      unitsCapPct: 120,
      maxSizeSets: 2,
      pivotalThresholdPct: 80,
      clusterPriority: { A: 1, A1: 2, A2: 3, A3: 4 },
    },

    metrics: {
      totalStores: 16,
      totalOptions: 0,
      totalBuyQty: 0,
      totalAllocatedQty: 0,
      allocationRate: 0,
      p1Qty: 0,
      p3Qty: 0,
      avgFillRate: 0,
      storesWithShortfall: 0,
    },

    validation: {
      criticalIssues: [],
      warningIssues: [],
    },

    allocations: [],
  },
];

// Helper functions for generating allocation data
export function generateStoreSizeProfile(storeId: string, mch: MCH, fashionGrade: FashionGrade): StoreSizeProfile {
  const store = mockStores.find((s) => s.storeId === storeId);

  // Generate size ratios based on cluster (premium stores have different profiles)
  const baseRatios =
    store?.cluster === "A"
      ? { XS: 5, S: 15, M: 35, L: 30, XL: 10, XXL: 5 }
      : store?.cluster === "A1"
        ? { XS: 3, S: 17, M: 38, L: 28, XL: 10, XXL: 4 }
        : store?.cluster === "A2"
          ? { XS: 2, S: 18, M: 40, L: 25, XL: 10, XXL: 5 }
          : { XS: 1, S: 19, M: 42, L: 23, XL: 10, XXL: 5 };

  // Calculate pivotal sizes (covering 80% of volume)
  const sortedSizes = Object.entries(baseRatios).sort((a, b) => b[1] - a[1]);
  const totalVolume = Object.values(baseRatios).reduce((sum, val) => sum + val, 0);
  let cumulativeVolume = 0;
  const pivotalSizes: string[] = [];

  for (const [size, ratio] of sortedSizes) {
    cumulativeVolume += ratio;
    pivotalSizes.push(size);
    if (cumulativeVolume / totalVolume >= 0.8) break;
  }

  return {
    storeId,
    mch,
    fashionGrade,
    sizeRatios: baseRatios,
    pivotalSizes,
    effectiveSSU: totalVolume,
  };
}

export function getDistributionPlanById(id: string): DistributionPlan | undefined {
  return mockDistributionPlans.find((dp) => dp.id === id);
}

export function getStoreById(storeId: string): Store | undefined {
  return mockStores.find((s) => s.storeId === storeId);
}

export function getBoughtOptionById(optionId: string): BoughtOption | undefined {
  return mockBoughtOptions.find((o) => o.optionId === optionId);
}

// Allocation phase descriptions
export const allocationPhaseDescriptions: Record<AllocationPhase, string> = {
  pre_step: "Computing effective size sets per store",
  step_1: "Calculating minimum reserved quantities",
  step_2: "Scoring and matching options to RA demand",
  step_3: "Allocating by store priority",
  step_3_5: "Residual allocation for unmet demand",
  step_4: "Splitting between P1 (store) and P3 (DC)",
  completed: "Allocation completed",
};

// Status badge configurations
export function getStatusBadgeConfig(status: AllocationStatus | 'dp_generated' | 'submitted_to_procuro' | 'partially_submitted') {
  const configs = {
    draft: { label: "Draft", variant: "default" as const },
    in_progress: { label: "In Progress", variant: "warning" as const },
    pending_approval: { label: "Pending Approval", variant: "warning" as const },
    approved: { label: "Approved", variant: "success" as const },
    executed: { label: "Executed", variant: "success" as const },
    dp_generated: { label: "DP Generated", variant: "info" as const },
    submitted_to_procuro: { label: "DP Submitted", variant: "success" as const },
    partially_submitted: { label: "DP Partially Submitted", variant: "warning" as const },
  };
  return configs[status] || configs.draft;
}
