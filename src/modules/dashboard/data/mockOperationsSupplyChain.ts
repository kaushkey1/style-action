// ---------------------------------------------------------------------------
// Mock data for Operations & Supply Chain tab
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export interface VendorPerformanceBar {
  vendor: string;
  fillRate: number;
  otif: number;
}

export interface KeyMetricCard {
  icon: string;
  label: string;
  value: string;
  target: string;
  status: "on_track" | "warning" | "critical";
}

export interface PipelineCard {
  label: string;
  value: string;
  borderColor: string;
}

export interface SimpleTableConfig {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface LeadTimeBucket {
  label: string;
  count: number;
  color: string;
}

// ---- Top Vendor Performance (Grouped Horizontal Bar) ----------------------

export const VENDOR_PERFORMANCE: VendorPerformanceBar[] = [
  { vendor: "Page Industries", fillRate: 96, otif: 95 },
  { vendor: "Shahi Exports", fillRate: 94, otif: 91 },
  { vendor: "Welspun India", fillRate: 90, otif: 89 },
  { vendor: "Gokaldas Exports", fillRate: 91, otif: 88 },
  { vendor: "Arvind Ltd", fillRate: 88, otif: 82 },
  { vendor: "Raymond", fillRate: 85, otif: 78 },
];

// ---- Key Metrics ----------------------------------------------------------

export const OPS_KEY_METRICS: KeyMetricCard[] = [
  { icon: "clock", label: "GRN On-Time %", value: "82%", target: "≥90%", status: "warning" },
  { icon: "alert-triangle", label: "Delayed POs", value: "24", target: "≤15", status: "critical" },
];

// ---- Procurement Pipeline -------------------------------------------------

export const PROCUREMENT_PIPELINE: PipelineCard[] = [
  { label: "OPEN PRS", value: "342", borderColor: "border-l-green-500" },
  { label: "OPEN POS", value: "1,248", borderColor: "border-l-amber-500" },
  { label: "GRN PENDING", value: "186", borderColor: "border-l-indigo-500" },
];

// ---- Top Vendors by Volume ------------------------------------------------

export const VENDOR_VOLUME_TABLE: SimpleTableConfig = {
  title: "Top Vendors by Volume",
  headers: ["Vendor", "Open POs", "Fill Rate", "Avg Lead Time", "OTIF%"],
  rows: [
    ["Shahi Exports", "86", "94%", "28d", "91%"],
    ["Gokaldas Exports", "72", "91%", "30d", "88%"],
    ["Arvind Ltd", "68", "88%", "34d", "82%"],
    ["Page Industries", "54", "96%", "22d", "95%"],
    ["Raymond", "48", "85%", "36d", "78%"],
    ["Aditya Birla Fashion", "42", "82%", "38d", "74%"],
    ["Welspun India", "38", "90%", "26d", "89%"],
    ["Vardhman Textiles", "34", "87%", "32d", "84%"],
  ],
};

// ---- PO Lead Time Distribution --------------------------------------------

export const LEAD_TIME_DISTRIBUTION: LeadTimeBucket[] = [
  { label: "≤20 days", count: 18, color: "#22c55e" },
  { label: "21–30 days", count: 34, color: "#22c55e" },
  { label: "31–40 days", count: 28, color: "#f59e0b" },
  { label: "41–60 days", count: 14, color: "#f97316" },
  { label: ">60 days", count: 6, color: "#ef4444" },
];
