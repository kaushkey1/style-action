// ---------------------------------------------------------------------------
// Mock data for Regional Director tab sections
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export interface StoreRankingRow {
  rank: string;
  store: string;
  city: string;
  score: string;
  revSqft: string;
  st: string;
  stColor: string;
  isSeparator?: boolean;
}

export interface CompetitionAlert {
  text: string;
  time: string;
  severity: "high" | "medium" | "low";
}

export interface VMClusterRow {
  cluster: string;
  stores: number;
  vmScore: string;
  planogram: string;
  sop: string;
  status: string;
  statusColor: string;
}

// ---- Helpers --------------------------------------------------------------

function stColor(val: number): string {
  if (val >= 70) return "text-green-600";
  if (val >= 60) return "text-amber-500";
  return "text-red-500";
}

// ---- Store Rankings — Top & Bottom 5 -------------------------------------

export const STORE_RANKINGS: StoreRankingRow[] = [
  { rank: "#1", store: "Phoenix Palladium", city: "Mumbai", score: "94", revSqft: "₹2,180", st: "82%", stColor: stColor(82) },
  { rank: "#2", store: "Ambience Mall", city: "Gurgaon", score: "91", revSqft: "₹1,960", st: "79%", stColor: stColor(79) },
  { rank: "#3", store: "Inorbit Mall", city: "Hyderabad", score: "89", revSqft: "₹1,840", st: "76%", stColor: stColor(76) },
  { rank: "#4", store: "VR Mall", city: "Chennai", score: "88", revSqft: "₹1,780", st: "74%", stColor: stColor(74) },
  { rank: "#5", store: "Nexus Mall", city: "Bangalore", score: "87", revSqft: "₹1,720", st: "73%", stColor: stColor(73) },
  { rank: "—", store: "—", city: "—", score: "—", revSqft: "—", st: "—", stColor: "text-gray-400", isSeparator: true },
  { rank: "#205", store: "City Center", city: "Ranchi", score: "48", revSqft: "₹620", st: "38%", stColor: stColor(38) },
  { rank: "#206", store: "Central Mall", city: "Bhopal", score: "46", revSqft: "₹580", st: "35%", stColor: stColor(35) },
  { rank: "#207", store: "Town Plaza", city: "Varanasi", score: "44", revSqft: "₹540", st: "32%", stColor: stColor(32) },
  { rank: "#208", store: "Metro Mall", city: "Patna", score: "43", revSqft: "₹510", st: "31%", stColor: stColor(31) },
  { rank: "#209", store: "Star Mall", city: "Lucknow", score: "42", revSqft: "₹480", st: "28%", stColor: stColor(28) },
];

// ---- Competition Alerts ---------------------------------------------------

export const COMPETITION_ALERTS: CompetitionAlert[] = [
  { text: "Zara opened new store in Ambience Mall, Gurgaon — 200m from our location", time: "2h ago", severity: "high" },
  { text: "H&M running 40% off on summer collection — overlaps our pricing", time: "5h ago", severity: "high" },
  { text: "Westside launched loyalty program with 2x points on ethnic wear", time: "1d ago", severity: "high" },
  { text: "Max Fashion expanded kids section in 12 south stores", time: "2d ago", severity: "low" },
];

// ---- VM Compliance by Cluster ---------------------------------------------

const VM_STATUS_COLOR: Record<string, string> = {
  Good: "text-green-600",
  Watch: "text-amber-500",
  "At Risk": "text-orange-500",
  Critical: "text-red-500",
};

export const VM_COMPLIANCE: VMClusterRow[] = [
  { cluster: "West Metro", stores: 42, vmScore: "86%", planogram: "82%", sop: "92%", status: "Good", statusColor: VM_STATUS_COLOR["Good"]! },
  { cluster: "South Metro", stores: 38, vmScore: "82%", planogram: "78%", sop: "90%", status: "Watch", statusColor: VM_STATUS_COLOR["Watch"]! },
  { cluster: "North Metro", stores: 35, vmScore: "78%", planogram: "74%", sop: "88%", status: "Watch", statusColor: VM_STATUS_COLOR["Watch"]! },
  { cluster: "East Metro", stores: 28, vmScore: "74%", planogram: "68%", sop: "85%", status: "At Risk", statusColor: VM_STATUS_COLOR["At Risk"]! },
  { cluster: "Tier-2 West", stores: 32, vmScore: "72%", planogram: "66%", sop: "82%", status: "At Risk", statusColor: VM_STATUS_COLOR["At Risk"]! },
  { cluster: "Tier-2 South", stores: 34, vmScore: "70%", planogram: "64%", sop: "80%", status: "Critical", statusColor: VM_STATUS_COLOR["Critical"]! },
];
