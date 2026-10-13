// ---------------------------------------------------------------------------
// Mock data for Financial tab
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export interface MarginFlowBar {
  name: string;
  value: number;
  color: string;
}

export interface FinancialKeyMetric {
  label: string;
  value: string;
  target: string;
  status: "on_track" | "warning" | "critical";
  icon: string;
}

// ---- Margin Flow (Vertical Bar Chart) ------------------------------------

export const MARGIN_FLOW: MarginFlowBar[] = [
  { name: "Intake Margin", value: 49.2, color: "#6366f1" },
  { name: "Markdown Impact", value: -8.1, color: "#ef4444" },
  { name: "Gross Margin", value: 41.7, color: "#22c55e" },
];

// ---- Key Metrics ----------------------------------------------------------

export const FINANCIAL_KEY_METRICS: FinancialKeyMetric[] = [
  { label: "OTB Consumption", value: "87%", target: "≥90%", status: "on_track", icon: "target" },
  { label: "Fashion Mix", value: "38%", target: "≥50%", status: "critical", icon: "zap" },
  { label: "Season End GM% Projection", value: "43.8%", target: "≥45%", status: "warning", icon: "trending-up" },
  { label: "First-Through Velocity", value: "42%", target: "≥55%", status: "warning", icon: "refresh-cw" },
];
