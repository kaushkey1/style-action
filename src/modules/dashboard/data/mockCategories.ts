// ---------------------------------------------------------------------------
// Mock data for Categories tab
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export interface CategoryKeyMetric {
  label: string;
  value: string;
  target: string;
  status: "on_track" | "warning" | "critical";
  icon: string;
}

export interface PodSummaryCard {
  label: string;
  value: string;
  valueColor: string;
  borderColor: string;
}

export interface PodBadge {
  label: string;
  count: number;
  variant: "default" | "success" | "warning" | "error";
}

export interface CategorySubRow {
  subCategory: string;
  brands: string;
  revenue: string;
  st: string;
  stColor: string;
  gm: string;
  agedInv: string;
  agedColor: string;
  fresh: string;
  status: "on_track" | "warning" | "critical" | "watch";
}

export interface CategoryData {
  name: string;
  pods: PodBadge[];
  rows: CategorySubRow[];
}

// ---- Key Metrics ----------------------------------------------------------

export const CATEGORY_KEY_METRICS: CategoryKeyMetric[] = [
  { label: "Top-Up POs Pending", value: "8", target: "0", status: "warning", icon: "package-check" },
  { label: "Options Aged >45d", value: "42", target: "≤10", status: "critical", icon: "clock" },
];

// ---- Product Pod Summary --------------------------------------------------

export const POD_SUMMARY: PodSummaryCard[] = [
  { label: "Total Product Pods", value: "24", valueColor: "text-gray-900", borderColor: "border-l-indigo-500" },
  { label: "On Track", value: "10", valueColor: "text-green-600", borderColor: "border-l-green-500" },
  { label: "Watch", value: "10", valueColor: "text-amber-500", borderColor: "border-l-amber-500" },
  { label: "Critical", value: "4", valueColor: "text-red-600", borderColor: "border-l-red-500" },
];

// ---- Helpers for status colors -------------------------------------------

/** ST%: green ≥70%, amber 60–69%, red <60% */
function stColor(val: number): string {
  if (val >= 70) return "text-green-600";
  if (val >= 60) return "text-amber-500";
  return "text-red-500";
}

/** Aged Inv%: green ≤15%, amber 16–24%, red ≥25% */
function agedColor(val: number): string {
  if (val <= 15) return "text-green-600";
  if (val <= 24) return "text-amber-500";
  return "text-red-500";
}

// ---- Per-Category Data ---------------------------------------------------

export const CATEGORIES: CategoryData[] = [
  {
    name: "Menswear",
    pods: [
      { label: "pods", count: 6, variant: "default" },
      { label: "on track", count: 3, variant: "success" },
      { label: "watch", count: 2, variant: "warning" },
      { label: "critical", count: 1, variant: "error" },
    ],
    rows: [
      { subCategory: "Casuals", brands: "12", revenue: "₹68 Cr", st: "72%", stColor: stColor(72), gm: "44.0%", agedInv: "14%", agedColor: agedColor(14), fresh: "59%", status: "on_track" },
      { subCategory: "Formals", brands: "8", revenue: "₹42 Cr", st: "65%", stColor: stColor(65), gm: "46.0%", agedInv: "19%", agedColor: agedColor(19), fresh: "48%", status: "watch" },
      { subCategory: "Ethnic", brands: "6", revenue: "₹32 Cr", st: "58%", stColor: stColor(58), gm: "39.1%", agedInv: "28%", agedColor: agedColor(28), fresh: "40%", status: "critical" },
      { subCategory: "Denims", brands: "10", revenue: "₹28 Cr", st: "71%", stColor: stColor(71), gm: "43.0%", agedInv: "15%", agedColor: agedColor(15), fresh: "57%", status: "on_track" },
      { subCategory: "Innerwear", brands: "5", revenue: "₹12 Cr", st: "74%", stColor: stColor(74), gm: "48.0%", agedInv: "10%", agedColor: agedColor(10), fresh: "65%", status: "on_track" },
      { subCategory: "Activewear", brands: "7", revenue: "₹6 Cr", st: "69%", stColor: stColor(69), gm: "42.0%", agedInv: "16%", agedColor: agedColor(16), fresh: "55%", status: "watch" },
    ],
  },
  {
    name: "Women Indian",
    pods: [
      { label: "pods", count: 5, variant: "default" },
      { label: "on track", count: 1, variant: "success" },
      { label: "watch", count: 3, variant: "warning" },
      { label: "critical", count: 1, variant: "error" },
    ],
    rows: [
      { subCategory: "Sarees", brands: "8", revenue: "₹38 Cr", st: "56%", stColor: stColor(56), gm: "38.0%", agedInv: "30%", agedColor: agedColor(30), fresh: "38%", status: "critical" },
      { subCategory: "Suits & Kurtas", brands: "10", revenue: "₹42 Cr", st: "62%", stColor: stColor(62), gm: "41.0%", agedInv: "22%", agedColor: agedColor(22), fresh: "46%", status: "watch" },
      { subCategory: "Lehengas", brands: "4", revenue: "₹18 Cr", st: "54%", stColor: stColor(54), gm: "37.0%", agedInv: "34%", agedColor: agedColor(34), fresh: "35%", status: "watch" },
      { subCategory: "Dress Materials", brands: "6", revenue: "₹12 Cr", st: "68%", stColor: stColor(68), gm: "42.0%", agedInv: "18%", agedColor: agedColor(18), fresh: "52%", status: "on_track" },
      { subCategory: "Dupattas", brands: "5", revenue: "₹6 Cr", st: "65%", stColor: stColor(65), gm: "40.0%", agedInv: "20%", agedColor: agedColor(20), fresh: "50%", status: "watch" },
    ],
  },
  {
    name: "Women Western",
    pods: [
      { label: "pods", count: 4, variant: "default" },
      { label: "on track", count: 2, variant: "success" },
      { label: "watch", count: 1, variant: "warning" },
      { label: "critical", count: 1, variant: "error" },
    ],
    rows: [
      { subCategory: "Tops & Tees", brands: "9", revenue: "₹36 Cr", st: "70%", stColor: stColor(70), gm: "44.0%", agedInv: "15%", agedColor: agedColor(15), fresh: "58%", status: "on_track" },
      { subCategory: "Dresses", brands: "7", revenue: "₹28 Cr", st: "66%", stColor: stColor(66), gm: "42.0%", agedInv: "19%", agedColor: agedColor(19), fresh: "51%", status: "watch" },
      { subCategory: "Bottomwear", brands: "8", revenue: "₹26 Cr", st: "68%", stColor: stColor(68), gm: "43.0%", agedInv: "17%", agedColor: agedColor(17), fresh: "55%", status: "on_track" },
      { subCategory: "Winterwear", brands: "5", revenue: "₹18 Cr", st: "55%", stColor: stColor(55), gm: "36.0%", agedInv: "26%", agedColor: agedColor(26), fresh: "42%", status: "critical" },
    ],
  },
  {
    name: "Kids",
    pods: [
      { label: "pods", count: 3, variant: "default" },
      { label: "on track", count: 2, variant: "success" },
      { label: "watch", count: 1, variant: "warning" },
    ],
    rows: [
      { subCategory: "Boys", brands: "8", revenue: "₹34 Cr", st: "76%", stColor: stColor(76), gm: "42.0%", agedInv: "11%", agedColor: agedColor(11), fresh: "64%", status: "on_track" },
      { subCategory: "Girls", brands: "7", revenue: "₹30 Cr", st: "73%", stColor: stColor(73), gm: "41.0%", agedInv: "13%", agedColor: agedColor(13), fresh: "62%", status: "on_track" },
      { subCategory: "Infants", brands: "4", revenue: "₹16 Cr", st: "68%", stColor: stColor(68), gm: "40.0%", agedInv: "16%", agedColor: agedColor(16), fresh: "56%", status: "watch" },
    ],
  },
  {
    name: "Non-Apparel",
    pods: [
      { label: "pods", count: 3, variant: "default" },
      { label: "on track", count: 1, variant: "success" },
      { label: "watch", count: 1, variant: "warning" },
      { label: "critical", count: 1, variant: "error" },
    ],
    rows: [
      { subCategory: "Footwear", brands: "10", revenue: "₹22 Cr", st: "64%", stColor: stColor(64), gm: "45.0%", agedInv: "20%", agedColor: agedColor(20), fresh: "50%", status: "watch" },
      { subCategory: "Accessories", brands: "8", revenue: "₹12 Cr", st: "70%", stColor: stColor(70), gm: "48.0%", agedInv: "14%", agedColor: agedColor(14), fresh: "58%", status: "on_track" },
      { subCategory: "Home & Living", brands: "5", revenue: "₹6 Cr", st: "56%", stColor: stColor(56), gm: "36.8%", agedInv: "32%", agedColor: agedColor(32), fresh: "38%", status: "critical" },
    ],
  },
  {
    name: "External Brands",
    pods: [
      { label: "pods", count: 3, variant: "default" },
      { label: "on track", count: 1, variant: "success" },
      { label: "watch", count: 2, variant: "warning" },
    ],
    rows: [
      { subCategory: "Premium", brands: "15", revenue: "₹28 Cr", st: "68%", stColor: stColor(68), gm: "34.0%", agedInv: "18%", agedColor: agedColor(18), fresh: "52%", status: "on_track" },
      { subCategory: "Mid-Tier", brands: "12", revenue: "₹24 Cr", st: "65%", stColor: stColor(65), gm: "32.0%", agedInv: "22%", agedColor: agedColor(22), fresh: "48%", status: "watch" },
      { subCategory: "Value", brands: "8", revenue: "₹14 Cr", st: "66%", stColor: stColor(66), gm: "35.0%", agedInv: "24%", agedColor: agedColor(24), fresh: "44%", status: "watch" },
    ],
  },
];
