// Mock data for Buy Plan V3 - Category View vs Brand View

// ─── Types ──────────────────────────────────────────────────────────────

export type BuyPlanViewType = "category" | "brand";

export type BuyPlanStatus = "draft" | "pending_costing" | "costing_received" | "confirmed" | "approved";

export type FashionGroup = "APL-Fashion" | "APL-Fashion Basics" | "APL-Core" | "APL-Ultimate" | "APL-Fast Fashion";

export type Segment = "Men" | "Women" | "Kids";

export interface ColorOption {
  color: string;
  hexCode: string;
  isActive: boolean;
  quantity: number;
  suggestedQuantity: number;
  confirmedCost?: number;
  margin?: number;
  intakeValue?: number;
  mrp?: number; // Maximum Retail Price (system suggested, editable post-costing)
}

export interface Design {
  id: string;
  name: string;
  styleCode: string;
  brand: string;
  category: string; // Shirts, T-shirts, Tops, etc.
  imageUrl: string;
  asp: number;
  totalSuggestedQty: number;
  colorOptions: ColorOption[];
  attributes: {
    fabric?: string;
    fit?: string;
    pattern?: string;
    silhouette?: string;
  };
  avgCost?: number;
  avgMargin?: number;
  expectedRevenue?: number; // Expected revenue for this design (in Lakhs)
}

// Category View Structure
export interface CategoryBuyPlan {
  id: string;
  viewType: "category";
  rangePlan: string; // Range Plan name
  rangePlanId: string; // Range Plan ID for navigation
  hitMonth: string; // "2026-05"
  hitMonthDisplay: string; // "May 2026"
  pod: {
    id: string;
    name: string;
    subCategory: string;
    categoryHead: string;
  };
  fashionGrade: FashionGroup;
  designs: Design[];
  otbAllocated: number; // in Lakhs
  otbUsed: number;
  status: BuyPlanStatus;
  createdAt: string;
  updatedAt: string;
}

// Brand View Structure
export interface BrandBuyPlan {
  id: string;
  viewType: "brand";
  rangePlan: string; // Range Plan name
  rangePlanId: string; // Range Plan ID for navigation
  hitMonth: string;
  hitMonthDisplay: string;
  brand: string;
  segment: Segment;
  family: string; // Shirts, T-shirts, Tops, etc.
  fashionGrade: FashionGroup;
  designs: Design[];
  otbAllocated: number; // in Lakhs
  otbUsed: number;
  status: BuyPlanStatus;
  categoryHead: string;
  brandManager: string;
  createdAt: string;
  updatedAt: string;
}

export type BuyPlanV3 = CategoryBuyPlan | BrandBuyPlan;

// ─── Helper Functions ────────────────────────────────────────────────────

const calculateMargin = (cost: number, asp: number) => ((asp - cost) / asp) * 100;

export function getActiveOptionsCount(design: Design): number {
  return design.colorOptions.filter((c) => c.isActive).length;
}

export function getTotalQuantity(design: Design): number {
  return design.colorOptions.filter((c) => c.isActive).reduce((sum, c) => sum + c.quantity, 0);
}

export function getEstimatedRetailValue(design: Design): number {
  const totalQty = getTotalQuantity(design);
  return totalQty * design.asp;
}

export function getIntakeValue(design: Design): number {
  return design.colorOptions.filter((c) => c.isActive && c.intakeValue).reduce((sum, c) => sum + c.intakeValue!, 0);
}

export function getDesignRevenue(design: Design): number {
  if (design.expectedRevenue) {
    return design.expectedRevenue;
  }
  // Fallback calculation if not set
  const activeOptions = design.colorOptions.filter((c) => c.isActive);
  return activeOptions.reduce((sum, c) => {
    const price = c.mrp || design.asp;
    return sum + (c.quantity * price) / 100000; // in Lakhs
  }, 0);
}

export function getTotalExpectedRevenue(buyPlan: CategoryBuyPlan | BrandBuyPlan): number {
  return buyPlan.designs.reduce((sum, design) => sum + getDesignRevenue(design), 0);
}

export function getAverageASP(buyPlan: CategoryBuyPlan | BrandBuyPlan): number {
  const totalASP = buyPlan.designs.reduce((sum, design) => sum + design.asp, 0);
  const designCount = buyPlan.designs.length;
  return designCount > 0 ? Math.round(totalASP / designCount) : 0;
}

// ─── Mock Data Generation ────────────────────────────────────────────────

const createMockDesign = (
  id: string,
  name: string,
  brand: string,
  category: string,
  styleCode: string,
  hasCost: boolean = false,
): Design => {
  // More realistic ASP values based on category (₹1500-4500 range)
  const asp = 1499 + Math.floor(Math.random() * 3000);
  const baseQty = 15000 + Math.floor(Math.random() * 60000);

  // Calculate MRP with markup (typically 2.2x to 2.5x of cost for retail)
  const mrpMarkup = 2.3; // Typical retail markup

  const colors: ColorOption[] = [
    {
      color: "Black",
      hexCode: "#1e293b",
      isActive: true,
      quantity: Math.floor(baseQty * 0.35),
      suggestedQuantity: Math.floor(baseQty * 0.35),
      confirmedCost: hasCost ? Math.floor(asp * 0.44) : undefined,
      margin: hasCost ? calculateMargin(Math.floor(asp * 0.44), asp) : undefined,
      intakeValue: hasCost ? Math.floor(baseQty * 0.35) * Math.floor(asp * 0.44) : undefined,
      mrp: hasCost ? Math.floor(Math.floor(asp * 0.44) * mrpMarkup) : Math.floor(asp * 2.2), // System suggested MRP even in draft
    },
    {
      color: "Navy",
      hexCode: "#1e3a5f",
      isActive: true,
      quantity: Math.floor(baseQty * 0.25),
      suggestedQuantity: Math.floor(baseQty * 0.25),
      confirmedCost: hasCost ? Math.floor(asp * 0.44) : undefined,
      margin: hasCost ? calculateMargin(Math.floor(asp * 0.44), asp) : undefined,
      intakeValue: hasCost ? Math.floor(baseQty * 0.25) * Math.floor(asp * 0.44) : undefined,
      mrp: hasCost ? Math.floor(Math.floor(asp * 0.44) * mrpMarkup) : Math.floor(asp * 2.2), // System suggested MRP even in draft
    },
    {
      color: "White",
      hexCode: "#f8fafc",
      isActive: true,
      quantity: Math.floor(baseQty * 0.3),
      suggestedQuantity: Math.floor(baseQty * 0.3),
      confirmedCost: hasCost ? Math.floor(asp * 0.46) : undefined,
      margin: hasCost ? calculateMargin(Math.floor(asp * 0.46), asp) : undefined,
      intakeValue: hasCost ? Math.floor(baseQty * 0.3) * Math.floor(asp * 0.46) : undefined,
      mrp: hasCost ? Math.floor(Math.floor(asp * 0.46) * mrpMarkup) : Math.floor(asp * 2.25), // Slightly higher for white
    },
    {
      color: "Gray",
      hexCode: "#6b7280",
      isActive: false,
      quantity: 0,
      suggestedQuantity: Math.floor(baseQty * 0.05),
      confirmedCost: undefined,
      margin: undefined,
      intakeValue: undefined,
      mrp: Math.floor(asp * 2.2), // System suggested MRP even for inactive colors
    },
    {
      color: "Maroon",
      hexCode: "#7f1d1d",
      isActive: false,
      quantity: 0,
      suggestedQuantity: Math.floor(baseQty * 0.05),
      confirmedCost: undefined,
      margin: undefined,
      intakeValue: undefined,
      mrp: Math.floor(asp * 2.2), // System suggested MRP even for inactive colors
    },
  ];

  let avgCost: number | undefined;
  let avgMargin: number | undefined;
  let expectedRevenue: number | undefined;

  if (hasCost) {
    const activeOptions = colors.filter((c) => c.isActive && c.confirmedCost);
    const totalQty = activeOptions.reduce((sum, c) => sum + c.quantity, 0);
    const totalCost = activeOptions.reduce((sum, c) => sum + c.quantity * c.confirmedCost!, 0);
    avgCost = totalCost / totalQty;
    avgMargin = calculateMargin(avgCost, asp);

    // Calculate expected revenue using MRP and quantities
    expectedRevenue = activeOptions.reduce((sum, c) => sum + c.quantity * (c.mrp || asp), 0) / 100000; // in Lakhs
  } else {
    // For pre-costing, use ASP for revenue calculation
    const activeOptions = colors.filter((c) => c.isActive);
    const totalQty = activeOptions.reduce((sum, c) => sum + c.quantity, 0);
    expectedRevenue = (totalQty * asp) / 100000; // in Lakhs
  }

  return {
    id,
    name,
    styleCode,
    brand,
    category,
    imageUrl: `/api/placeholder/220/140`,
    asp,
    totalSuggestedQty: baseQty,
    colorOptions: colors,
    attributes: {
      fabric: "Cotton Blend",
      fit: "Regular",
      pattern: "Solid",
    },
    avgCost,
    avgMargin,
    expectedRevenue,
  };
};

// ─── Category View Mock Data ─────────────────────────────────────────────

export const mockCategoryBuyPlans: CategoryBuyPlan[] = [
  // May 2026 - Menswear Shirts - Fashion
  {
    id: "CBP-001",
    viewType: "category",
    rangePlan: "Summer 2026 Collection",
    rangePlanId: "rp-summer-2026",
    hitMonth: "2026-05",
    hitMonthDisplay: "May 2026",
    pod: {
      id: "pod-01",
      name: "Menswear Shirts",
      subCategory: "Shirts",
      categoryHead: "Priya K.",
    },
    fashionGrade: "APL-Fashion",
    designs: [
      createMockDesign("d-001", "Premium Oxford Shirt", "DNMX", "Shirts", "DNX-SH-001"),
      createMockDesign("d-002", "Casual Linen Shirt", "John Players", "Shirts", "JP-SH-002"),
      createMockDesign("d-003", "Business Formal", "Netplay", "Shirts", "NP-SH-003"),
      createMockDesign("d-004", "Weekend Casual", "DNMX", "Shirts", "DNX-SH-004"),
    ],
    otbAllocated: 3500,
    otbUsed: 2100,
    status: "draft",
    createdAt: "2024-03-01T10:00:00Z",
    updatedAt: "2024-03-01T10:00:00Z",
  },

  // May 2026 - Menswear Shirts - Core
  {
    id: "CBP-002",
    viewType: "category",
    rangePlan: "Summer 2026 Collection",
    rangePlanId: "rp-summer-2026",
    hitMonth: "2026-05",
    hitMonthDisplay: "May 2026",
    pod: {
      id: "pod-01",
      name: "Menswear Shirts",
      subCategory: "Shirts",
      categoryHead: "Priya K.",
    },
    fashionGrade: "APL-Core",
    designs: [
      createMockDesign("d-005", "Basic White Shirt", "Netplay", "Shirts", "NP-SH-005", true),
      createMockDesign("d-006", "Essential Blue", "DNMX", "Shirts", "DNX-SH-006", true),
      createMockDesign("d-007", "Classic Black", "John Players", "Shirts", "JP-SH-007", true),
    ],
    otbAllocated: 2800,
    otbUsed: 1800,
    status: "costing_received",
    createdAt: "2024-02-28T10:00:00Z",
    updatedAt: "2024-03-02T14:00:00Z",
  },

  // May 2026 - Women's Western Tops - Fashion
  {
    id: "CBP-003",
    rangePlan: "Monsoon 2026 Range",
    rangePlanId: "rp-monsoon-2026",
    viewType: "category",
    hitMonth: "2026-05",
    hitMonthDisplay: "May 2026",
    pod: {
      id: "pod-02",
      name: "Women's Western Tops",
      subCategory: "Tops",
      categoryHead: "Deepa R.",
    },
    fashionGrade: "APL-Fashion",
    designs: [
      createMockDesign("d-008", "Floral Crop Top", "Fig", "Tops", "FIG-TP-001", true),
      createMockDesign("d-009", "Peplum Blouse", "Rio", "Tops", "RIO-TP-002", true),
      createMockDesign("d-010", "Off-Shoulder Top", "Fig", "Tops", "FIG-TP-003", true),
      createMockDesign("d-011", "Ruffle Sleeve", "Rio", "Tops", "RIO-TP-004", true),
    ],
    otbAllocated: 4200,
    otbUsed: 3100,
    status: "confirmed",
    createdAt: "2024-02-25T10:00:00Z",
    updatedAt: "2024-03-03T09:00:00Z",
  },

  // June 2026 - Kids Boys - Fashion Basics
  {
    id: "CBP-004",
    rangePlan: "Monsoon 2026 Range",
    rangePlanId: "rp-monsoon-2026",
    viewType: "category",
    hitMonth: "2026-06",
    hitMonthDisplay: "June 2026",
    pod: {
      id: "pod-03",
      name: "Kids Boys 2-8",
      subCategory: "Boys",
      categoryHead: "Anand T.",
    },
    fashionGrade: "APL-Fashion Basics",
    designs: [
      createMockDesign("d-012", "Superhero Tee", "KB Team Spirit", "T-shirts", "KB-TS-001", true),
      createMockDesign("d-013", "Summer Shorts", "KB Team Spirit", "Shorts", "KB-SH-001", true),
      createMockDesign("d-014", "Polo Classic", "KB Team Spirit", "Polos", "KB-PL-001", true),
    ],
    otbAllocated: 1800,
    otbUsed: 1400,
    status: "approved",
    createdAt: "2024-02-20T10:00:00Z",
    updatedAt: "2024-03-01T15:00:00Z",
  },
];

// ─── Brand View Mock Data ────────────────────────────────────────────────

export const mockBrandBuyPlans: BrandBuyPlan[] = [
  // DNMX - Men - Shirts - Fashion - May 2026
  {
    id: "BBP-001",
    rangePlan: "DNMX Spring 2026",
    rangePlanId: "rp-dnmx-spring-2026",
    viewType: "brand",
    hitMonth: "2026-05",
    hitMonthDisplay: "May 2026",
    brand: "DNMX",
    segment: "Men",
    family: "Shirts",
    fashionGrade: "APL-Fashion",
    designs: [
      createMockDesign("d-b001", "DNMX Premium Oxford", "DNMX", "Shirts", "DNX-SH-001"),
      createMockDesign("d-b002", "DNMX Urban Casual", "DNMX", "Shirts", "DNX-SH-002"),
      createMockDesign("d-b003", "DNMX Street Style", "DNMX", "Shirts", "DNX-SH-003"),
    ],
    otbAllocated: 2200,
    otbUsed: 1500,
    status: "draft",
    categoryHead: "Priya K.",
    brandManager: "Rahul M.",
    createdAt: "2024-03-01T10:00:00Z",
    updatedAt: "2024-03-01T10:00:00Z",
  },

  // DNMX - Men - T-shirts - Core - May 2026
  {
    id: "BBP-002",
    rangePlan: "John Players SS26",
    rangePlanId: "rp-jp-ss26",
    viewType: "brand",
    hitMonth: "2026-05",
    hitMonthDisplay: "May 2026",
    brand: "DNMX",
    segment: "Men",
    family: "T-shirts",
    fashionGrade: "APL-Core",
    designs: [
      createMockDesign("d-b004", "DNMX Basic Crew", "DNMX", "T-shirts", "DNX-TS-001", true),
      createMockDesign("d-b005", "DNMX V-Neck Essential", "DNMX", "T-shirts", "DNX-TS-002", true),
      createMockDesign("d-b006", "DNMX Henley", "DNMX", "T-shirts", "DNX-TS-003", true),
      createMockDesign("d-b007", "DNMX Pocket Tee", "DNMX", "T-shirts", "DNX-TS-004", true),
    ],
    otbAllocated: 3200,
    otbUsed: 2400,
    status: "costing_received",
    categoryHead: "Priya K.",
    brandManager: "Rahul M.",
    createdAt: "2024-02-28T10:00:00Z",
    updatedAt: "2024-03-02T14:00:00Z",
  },

  // Fig - Women - Tops - Fashion - May 2026
  {
    id: "BBP-003",
    rangePlan: "Netplay Active 2026",
    rangePlanId: "rp-netplay-active-2026",
    viewType: "brand",
    hitMonth: "2026-05",
    hitMonthDisplay: "May 2026",
    brand: "Fig",
    segment: "Women",
    family: "Tops",
    fashionGrade: "APL-Fashion",
    designs: [
      createMockDesign("d-b008", "Fig Floral Fantasy", "Fig", "Tops", "FIG-TP-001", true),
      createMockDesign("d-b009", "Fig Urban Chic", "Fig", "Tops", "FIG-TP-002", true),
      createMockDesign("d-b010", "Fig Weekend Vibes", "Fig", "Tops", "FIG-TP-003", true),
      createMockDesign("d-b011", "Fig Office Elegance", "Fig", "Tops", "FIG-TP-004", true),
      createMockDesign("d-b012", "Fig Party Ready", "Fig", "Tops", "FIG-TP-005", true),
    ],
    otbAllocated: 4500,
    otbUsed: 3800,
    status: "confirmed",
    categoryHead: "Deepa R.",
    brandManager: "Anita S.",
    createdAt: "2024-02-25T10:00:00Z",
    updatedAt: "2024-03-03T09:00:00Z",
  },

  // John Players - Men - Shirts - Fashion Basics - June 2026
  {
    id: "BBP-004",
    rangePlan: "RIG Summer 2026",
    rangePlanId: "rp-rig-summer-2026",
    viewType: "brand",
    hitMonth: "2026-06",
    hitMonthDisplay: "June 2026",
    brand: "John Players",
    segment: "Men",
    family: "Shirts",
    fashionGrade: "APL-Fashion Basics",
    designs: [
      createMockDesign("d-b013", "JP Classic Formal", "John Players", "Shirts", "JP-SH-001", true),
      createMockDesign("d-b014", "JP Business Blue", "John Players", "Shirts", "JP-SH-002", true),
      createMockDesign("d-b015", "JP Executive", "John Players", "Shirts", "JP-SH-003", true),
    ],
    otbAllocated: 2600,
    otbUsed: 2100,
    status: "approved",
    categoryHead: "Priya K.",
    brandManager: "Vikram P.",
    createdAt: "2024-02-20T10:00:00Z",
    updatedAt: "2024-03-01T15:00:00Z",
  },

  // KB Team Spirit - Kids - T-shirts - Fashion - May 2026
  {
    id: "BBP-005",
    rangePlan: "Performax Sport 2026",
    rangePlanId: "rp-performax-sport-2026",
    viewType: "brand",
    hitMonth: "2026-05",
    hitMonthDisplay: "May 2026",
    brand: "KB Team Spirit",
    segment: "Kids",
    family: "T-shirts",
    fashionGrade: "APL-Fashion",
    designs: [
      createMockDesign("d-b016", "KB Adventure Time", "KB Team Spirit", "T-shirts", "KB-TS-001"),
      createMockDesign("d-b017", "KB Sports Star", "KB Team Spirit", "T-shirts", "KB-TS-002"),
      createMockDesign("d-b018", "KB Dino World", "KB Team Spirit", "T-shirts", "KB-TS-003"),
    ],
    otbAllocated: 1500,
    otbUsed: 1100,
    status: "pending_costing",
    categoryHead: "Anand T.",
    brandManager: "Sneha R.",
    createdAt: "2024-03-01T10:00:00Z",
    updatedAt: "2024-03-02T11:00:00Z",
  },
];

// ─── Aggregation Functions ───────────────────────────────────────────────

export function getBuyPlanStats(buyPlan: BuyPlanV3) {
  const totalDesigns = buyPlan.designs.length;
  const totalOptions = buyPlan.designs.reduce((sum, d) => sum + getActiveOptionsCount(d), 0);
  const notConfigured = buyPlan.designs.filter((d) => getActiveOptionsCount(d) === 0).length;

  let totalValue = 0;
  if (buyPlan.status === "draft" || buyPlan.status === "pending_costing") {
    totalValue = buyPlan.designs.reduce((sum, d) => sum + getEstimatedRetailValue(d), 0);
  } else {
    totalValue = buyPlan.designs.reduce((sum, d) => sum + getIntakeValue(d), 0);
  }

  return {
    totalDesigns,
    totalOptions,
    notConfigured,
    totalValue: totalValue / 100000, // Convert to Lakhs
    isEstimate: buyPlan.status === "draft" || buyPlan.status === "pending_costing",
  };
}

export function getOtbUsagePercentage(buyPlan: BuyPlanV3): number {
  const stats = getBuyPlanStats(buyPlan);
  return (stats.totalValue / buyPlan.otbAllocated) * 100;
}

// ─── Status Badge Config ─────────────────────────────────────────────────

export function getStatusBadgeConfig(status: BuyPlanStatus) {
  const configs: Record<BuyPlanStatus, { label: string; className: string; showPulse?: boolean }> = {
    draft: { label: "Draft", className: "bg-blue-100 text-blue-700" },
    pending_costing: { label: "Pending Costing", className: "bg-amber-100 text-amber-700", showPulse: true },
    costing_received: { label: "Costing Received", className: "bg-orange-100 text-orange-700" },
    confirmed: { label: "Pending Approval", className: "bg-amber-100 text-amber-700" },
    approved: { label: "Approved", className: "bg-green-100 text-green-700" },
  };
  return configs[status];
}

// ─── Fashion Grade Config ────────────────────────────────────────────────

export function getFashionGradeBadgeClass(fg: FashionGroup) {
  const classes = {
    "APL-Fashion": "bg-violet-100 text-violet-700",
    "APL-Fashion Basics": "bg-cyan-100 text-cyan-700",
    "APL-Core": "bg-indigo-100 text-indigo-700",
    "APL-Ultimate": "bg-blue-100 text-blue-700",
    "APL-Fast Fashion": "bg-pink-100 text-pink-700",
  };
  return classes[fg];
}

// ─── Fashion Grade Target Percentages ────────────────────────────────────

export const fashionGradeTargets = {
  "APL-Fashion": 30,
  "APL-Fashion Basics": 25,
  "APL-Core": 25,
  "APL-Ultimate": 10,
  "APL-Fast Fashion": 10,
};
