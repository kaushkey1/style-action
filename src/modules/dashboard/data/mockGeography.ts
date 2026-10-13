// ---------------------------------------------------------------------------
// Mock data for Geography tab sections
// ---------------------------------------------------------------------------

// ---- Types ----------------------------------------------------------------

export interface GeoKeyMetric {
  icon: string;
  label: string;
  value: string;
  target: string;
  status: "on_track" | "warning" | "critical";
}

export interface RegionBar {
  region: string;
  value: number;
  color: string;
}

export interface CityTierSlice {
  name: string;
  value: number;
  color: string;
}

export interface SimpleTableConfig {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface PodSummaryCard {
  label: string;
  value: string;
  subtitle: string;
  valueColor: string;
  borderColor: string;
}

export interface PodRow {
  podName: string;
  states: string;
  stores: string;
  revenue: string;
  revPerStore: string;
  st: string;
  stColor: string;
  gm: string;
  aged: string;
  agedColor: string;
  status: "on_track" | "watch" | "critical";
}

// ---- Key Metrics ----------------------------------------------------------

export const GEO_KEY_METRICS: GeoKeyMetric[] = [
  { icon: "trending-up", label: "Avg Sell-Through", value: "68%", target: "\u226570%", status: "on_track" },
  { icon: "alert-triangle", label: "Avg Aged Inventory", value: "18%", target: "<10%", status: "critical" },
];

// ---- Revenue by Region (Horizontal Bar) -----------------------------------

export const REVENUE_BY_REGION: RegionBar[] = [
  { region: "West", value: 24.4, color: "#6366f1" },
  { region: "South", value: 22.2, color: "#a855f7" },
  { region: "North", value: 18.0, color: "#f97316" },
  { region: "East", value: 9.0, color: "#14b8a6" },
  { region: "Central", value: 4.8, color: "#3b82f6" },
];

// ---- Store Mix by City Tier (Pie) -----------------------------------------

export const STORE_MIX_BY_TIER: CityTierSlice[] = [
  { name: "Metro", value: 46, color: "#6366f1" },
  { name: "Tier-1", value: 28, color: "#a855f7" },
  { name: "Tier-2", value: 16, color: "#14b8a6" },
  { name: "Tier-3", value: 10, color: "#06b6d4" },
];

// ---- Zone-wise Performance Summary ----------------------------------------

export const ZONE_PERFORMANCE: SimpleTableConfig = {
  title: "Zone-wise Performance Summary",
  headers: ["Zone", "Stores", "Revenue (Cr/day)", "Rev/Store (L)", "ST%", "GM%", "Aged%", "Status"],
  rows: [
    ["West", "508", "\u20B924.4", "\u20B94.8", "71%", "42.4%", "17%", "On Track"],
    ["South", "502", "\u20B922.2", "\u20B94.4", "70%", "42.2%", "18%", "On Track"],
    ["North", "434", "\u20B918.0", "\u20B94.1", "67%", "41.3%", "21%", "Watch"],
    ["East", "270", "\u20B99.0", "\u20B93.3", "60%", "39.0%", "27%", "Critical"],
    ["Central", "164", "\u20B94.8", "\u20B92.9", "63%", "40.4%", "22%", "Watch"],
    ["New Stores", "253", "\u20B92.6", "\u20B91.0", "71%", "44.1%", "8%", "On Track"],
  ],
};

// ---- Top 10 States by Revenue ---------------------------------------------

export const TOP_STATES: SimpleTableConfig = {
  title: "Top 10 States by Revenue",
  headers: ["State", "Stores", "Revenue (Cr/day)", "Rev/Store (L)", "ST%", "GM%", "Aged%"],
  rows: [
    ["Maharashtra", "286", "\u20B916.8", "\u20B95.9", "74%", "43.4%", "14%"],
    ["Karnataka", "198", "\u20B99.2", "\u20B94.6", "72%", "42.8%", "15%"],
    ["Delhi NCR", "248", "\u20B912.4", "\u20B95.0", "69%", "41.8%", "19%"],
    ["Tamil Nadu", "164", "\u20B97.8", "\u20B94.8", "71%", "42.2%", "16%"],
    ["Gujarat", "222", "\u20B98.4", "\u20B93.8", "68%", "41.6%", "19%"],
    ["Telangana", "122", "\u20B95.6", "\u20B94.6", "70%", "42.0%", "17%"],
    ["Rajasthan", "96", "\u20B93.2", "\u20B93.3", "65%", "40.8%", "22%"],
    ["West Bengal", "108", "\u20B94.2", "\u20B93.9", "63%", "39.8%", "24%"],
    ["Uttar Pradesh", "112", "\u20B93.6", "\u20B93.2", "62%", "40.2%", "23%"],
    ["Kerala", "86", "\u20B93.4", "\u20B94.0", "69%", "41.4%", "18%"],
  ],
};

// ---- City Tier Performance ------------------------------------------------

export const CITY_TIER_TABLE: SimpleTableConfig = {
  title: "City Tier Performance",
  headers: ["Tier", "Stores", "Revenue (Cr/day)", "Rev/Store (L)", "ST%", "GM%", "Aged%", "SPSF (\u20B9)"],
  rows: [
    ["Metro (Top 8)", "986", "\u20B951.2", "\u20B95.2", "72%", "42.8%", "16%", "\u20B912,400"],
    ["Tier-1 (30 cities)", "600", "\u20B918.4", "\u20B93.1", "66%", "41.2%", "21%", "\u20B98,200"],
    ["Tier-2 (80 cities)", "332", "\u20B97.2", "\u20B92.2", "62%", "40.0%", "24%", "\u20B95,800"],
    ["Tier-3 (others)", "213", "\u20B91.6", "\u20B90.8", "58%", "38.6%", "28%", "\u20B93,400"],
  ],
};

// ---- POD Summary Cards ----------------------------------------------------

export const POD_SUMMARY: PodSummaryCard[] = [
  { label: "Total Stores", value: "2,131", subtitle: "Across 10 PODs", valueColor: "text-gray-900", borderColor: "border-l-gray-300" },
  { label: "On Track PODs", value: "3", subtitle: "Meeting all targets", valueColor: "text-green-600", borderColor: "border-l-green-500" },
  { label: "Watch PODs", value: "5", subtitle: "Below 1+ targets", valueColor: "text-amber-500", borderColor: "border-l-amber-500" },
  { label: "Critical PODs", value: "2", subtitle: "Needs intervention", valueColor: "text-red-500", borderColor: "border-l-red-500" },
];

// ---- 10 Operations PODs — Performance Overview ----------------------------

export const POD_PERFORMANCE: PodRow[] = [
  { podName: "Central", states: "Indore, Bhopal, Raipur", stores: "164", revenue: "\u20B94.8 Cr/day", revPerStore: "\u20B92.9 L", st: "63%", stColor: "text-amber-500", gm: "40.4%", aged: "22%", agedColor: "text-amber-500", status: "watch" },
  { podName: "East Metro", states: "Kolkata, Bhubaneswar", stores: "142", revenue: "\u20B95.8 Cr/day", revPerStore: "\u20B94.1 L", st: "62%", stColor: "text-red-500", gm: "39.4%", aged: "26%", agedColor: "text-red-500", status: "critical" },
  { podName: "East Tier-2", states: "Patna, Ranchi, Guwahati", stores: "128", revenue: "\u20B93.2 Cr/day", revPerStore: "\u20B92.5 L", st: "58%", stColor: "text-red-500", gm: "38.6%", aged: "28%", agedColor: "text-red-500", status: "critical" },
  { podName: "New Stores & Reno", states: "Pan-India (new openings)", stores: "253", revenue: "\u20B92.6 Cr/day", revPerStore: "\u20B91.0 L", st: "71%", stColor: "text-green-600", gm: "44.1%", aged: "8%", agedColor: "text-green-600", status: "on_track" },
  { podName: "North Metro", states: "Delhi, Gurgaon, Noida", stores: "248", revenue: "\u20B912.4 Cr/day", revPerStore: "\u20B95.0 L", st: "69%", stColor: "text-amber-500", gm: "41.8%", aged: "19%", agedColor: "text-amber-500", status: "watch" },
  { podName: "North Tier-2", states: "Lucknow, Jaipur, Chandigarh", stores: "186", revenue: "\u20B95.6 Cr/day", revPerStore: "\u20B93.0 L", st: "64%", stColor: "text-amber-500", gm: "40.8%", aged: "23%", agedColor: "text-amber-500", status: "watch" },
  { podName: "South Metro", states: "Bangalore, Chennai, Hyderabad", stores: "284", revenue: "\u20B914.8 Cr/day", revPerStore: "\u20B95.2 L", st: "72%", stColor: "text-green-600", gm: "42.6%", aged: "16%", agedColor: "text-green-600", status: "on_track" },
  { podName: "South Tier-2", states: "Coimbatore, Vizag, Kochi, Mysore", stores: "218", revenue: "\u20B97.4 Cr/day", revPerStore: "\u20B93.4 L", st: "67%", stColor: "text-amber-500", gm: "41.6%", aged: "20%", agedColor: "text-amber-500", status: "watch" },
  { podName: "West Metro", states: "Mumbai, Pune, Ahmedabad", stores: "312", revenue: "\u20B918.2 Cr/day", revPerStore: "\u20B95.8 L", st: "74%", stColor: "text-green-600", gm: "43.2%", aged: "14%", agedColor: "text-green-600", status: "on_track" },
  { podName: "West Tier-2", states: "Surat, Vadodara, Rajkot, Nagpur", stores: "196", revenue: "\u20B96.2 Cr/day", revPerStore: "\u20B93.2 L", st: "66%", stColor: "text-amber-500", gm: "41.2%", aged: "21%", agedColor: "text-amber-500", status: "watch" },
];
