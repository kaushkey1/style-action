// ---------------------------------------------------------------------------
// Mock data for Inventory Health tab sections
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export interface AgeDistributionSlice {
  name: string;
  value: number;
  color: string;
}

export interface InventoryCategoryBar {
  category: string;
  value: number;
  color: string;
}

export interface KeyMetricCard {
  icon: string;
  label: string;
  value: string;
  target: string;
  status: "on_track" | "warning" | "critical";
}

export interface StockDistributionCard {
  label: string;
  value: string;
  borderColor: string;
}

export interface SimpleTableConfig {
  title: string;
  headers: string[];
  rows: string[][];
}

// ---- Inventory Age Distribution (Pie) -------------------------------------

export const AGE_DISTRIBUTION: AgeDistributionSlice[] = [
  { name: "0\u201330 days", value: 28, color: "#22c55e" },
  { name: "31\u201360 days", value: 24, color: "#eab308" },
  { name: "61\u201390 days", value: 18, color: "#f97316" },
  { name: "91\u2013180 days", value: 17, color: "#d97706" },
  { name: ">180 days", value: 13, color: "#ef4444" },
];

// ---- Inventory by Category (Horizontal Bar) -------------------------------

export const INVENTORY_BY_CATEGORY: InventoryCategoryBar[] = [
  { category: "Menswear", value: 720, color: "#6366f1" },
  { category: "Women Indian", value: 580, color: "#8b5cf6" },
  { category: "External Brands", value: 480, color: "#ec4899" },
  { category: "Women Western", value: 440, color: "#14b8a6" },
  { category: "Non-Apparel", value: 380, color: "#06b6d4" },
  { category: "Kids", value: 280, color: "#3b82f6" },
];

// ---- Key Metrics ----------------------------------------------------------

export const KEY_METRICS: KeyMetricCard[] = [
  {
    icon: "sparkles",
    label: "Fresh Inventory",
    value: "52%",
    target: "\u226568%",
    status: "warning",
  },
  {
    icon: "clock",
    label: "Inventory Days",
    value: "95 days",
    target: "\u226490 days",
    status: "warning",
  },
  {
    icon: "alert-triangle",
    label: "NOOS Stockout (Stores)",
    value: "38",
    target: "0",
    status: "critical",
  },
  {
    icon: "package",
    label: "Broken Set Options",
    value: "1,247",
    target: "\u2264500",
    status: "critical",
  },
];

// ---- Stock Distribution ---------------------------------------------------

export const STOCK_DISTRIBUTION: StockDistributionCard[] = [
  {
    label: "STORE STOCK",
    value: "\u20B91,680 Cr",
    borderColor: "border-l-green-500",
  },
  {
    label: "WAREHOUSE",
    value: "\u20B9520 Cr",
    borderColor: "border-l-amber-500",
  },
  {
    label: "IN TRANSIT",
    value: "\u20B9180 Cr",
    borderColor: "border-l-indigo-500",
  },
];

// ---- Broken Set Analysis --------------------------------------------------

export const BROKEN_SET_TABLE: SimpleTableConfig = {
  title: "Broken Set Analysis",
  headers: [
    "Category",
    "Total Options",
    "Broken Sets",
    "Broken%",
    "Value at Risk",
    "Avg Missing Sizes",
  ],
  rows: [
    ["Menswear", "3,420", "486", "14.2%", "\u20B942 Cr", "2.1"],
    ["Women Indian", "2,860", "312", "10.9%", "\u20B928 Cr", "1.8"],
    ["Women Western", "2,140", "218", "10.2%", "\u20B919 Cr", "1.6"],
    ["Kids", "1,680", "124", "7.4%", "\u20B98 Cr", "1.4"],
    ["Non-Apparel", "1,240", "72", "5.8%", "\u20B95 Cr", "1.2"],
    ["External Brands", "1,560", "35", "2.2%", "\u20B93 Cr", "1.1"],
  ],
};

// ---- Category-wise Inventory Health ---------------------------------------

export const CATEGORY_HEALTH_TABLE: SimpleTableConfig = {
  title: "Category-wise Inventory Health",
  headers: [
    "Category",
    "Stock Value",
    "Aged%",
    "Fresh%",
    "Shrinkage%",
    "DOI",
    "Turnover",
  ],
  rows: [
    ["Menswear", "\u20B9620 Cr", "17%", "56%", "1.2%", "88d", "4.1x"],
    ["Women Indian", "\u20B9480 Cr", "27%", "43%", "0.9%", "112d", "3.3x"],
    ["Women Western", "\u20B9380 Cr", "17%", "55%", "1.1%", "92d", "4.0x"],
    ["Kids", "\u20B9260 Cr", "12%", "63%", "0.8%", "78d", "4.7x"],
    ["Non-Apparel", "\u20B9340 Cr", "17%", "57%", "1.4%", "86d", "4.2x"],
    ["External Brands", "\u20B9400 Cr", "21%", "50%", "0.6%", "98d", "3.7x"],
  ],
};
