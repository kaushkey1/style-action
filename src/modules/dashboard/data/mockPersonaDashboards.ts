// Persona-specific dashboard mock data
// Each section provides data structures consumed by PersonaDashboardCards.tsx

// ─── Revenue Scoreboard (Apex, CEO, Regional) ─────────────────────────

export interface RevenueRow {
  label: string;
  actual: string;
  plan: string;
  achievement: number;
  status: "on-track" | "warning" | "critical";
}

export const revenueScoreboard: RevenueRow[] = [
  {
    label: "Today",
    actual: "₹74 Cr",
    plan: "₹100 Cr",
    achievement: 74,
    status: "critical",
  },
  {
    label: "MTD (Feb)",
    actual: "₹1,110 Cr",
    plan: "₹1,200 Cr",
    achievement: 92,
    status: "warning",
  },
  {
    label: "YTD (FY26)",
    actual: "₹9,862 Cr",
    plan: "₹10,500 Cr",
    achievement: 94,
    status: "on-track",
  },
];

// ─── Worst Performer (Apex) ────────────────────────────────────────────

export interface WorstPerformer {
  type: "category" | "geography";
  name: string;
  metric: string;
  value: string;
  target: string;
  rootCause: string;
  agentAction: string;
}

export const worstPerformers: WorstPerformer[] = [
  {
    type: "category",
    name: "Women's Indian Wear",
    metric: "Aged Inventory",
    value: "27%",
    target: "<10%",
    rootCause: "Sarees & Dupattas at 30%, Lehengas at 34%",
    agentAction: "Liquidation Agent queued 420 SKUs for markdown",
  },
  {
    type: "geography",
    name: "East Tier-2 POD",
    metric: "Sell-Through",
    value: "58%",
    target: "≥70%",
    rootCause: "28% aged inventory, weak footfall in 12 stores",
    agentAction: "Allocation Agent redistributing 88 slow movers",
  },
];

// ─── Value Chain Health (CEO, Ops) ─────────────────────────────────────

export interface ValueChainDomain {
  id: string;
  name: string;
  s1Count: number;
  s2Count: number;
  totalExceptions: number;
  status: "on-track" | "warning" | "critical";
}

export const valueChainDomains: ValueChainDomain[] = [
  {
    id: "PLAN",
    name: "PLAN",
    s1Count: 0,
    s2Count: 2,
    totalExceptions: 8,
    status: "on-track",
  },
  {
    id: "BUY",
    name: "BUY",
    s1Count: 1,
    s2Count: 3,
    totalExceptions: 14,
    status: "warning",
  },
  {
    id: "MAKE",
    name: "MAKE",
    s1Count: 2,
    s2Count: 4,
    totalExceptions: 18,
    status: "critical",
  },
  {
    id: "MOVE",
    name: "MOVE",
    s1Count: 1,
    s2Count: 2,
    totalExceptions: 10,
    status: "warning",
  },
  {
    id: "SELL",
    name: "SELL",
    s1Count: 3,
    s2Count: 5,
    totalExceptions: 22,
    status: "critical",
  },
];

// ─── Category Leaderboard (CEO) ────────────────────────────────────────

export interface CategoryTeamRow {
  rank: number;
  team: string;
  sellThrough15d: number;
  target: number;
  strikes: number;
  trend: "up" | "down" | "flat";
}

export const categoryLeaderboard: CategoryTeamRow[] = [
  {
    rank: 1,
    team: "Kids Basics",
    sellThrough15d: 38,
    target: 30,
    strikes: 0,
    trend: "up",
  },
  {
    rank: 2,
    team: "Men's Casuals",
    sellThrough15d: 34,
    target: 30,
    strikes: 0,
    trend: "up",
  },
  {
    rank: 3,
    team: "Women's Western",
    sellThrough15d: 32,
    target: 30,
    strikes: 0,
    trend: "flat",
  },
  {
    rank: 4,
    team: "Footwear",
    sellThrough15d: 29,
    target: 30,
    strikes: 1,
    trend: "down",
  },
  {
    rank: 5,
    team: "Men's Formals",
    sellThrough15d: 26,
    target: 30,
    strikes: 1,
    trend: "down",
  },
  {
    rank: 6,
    team: "Women's Indian",
    sellThrough15d: 22,
    target: 30,
    strikes: 2,
    trend: "down",
  },
  {
    rank: 7,
    team: "Non-Apparel",
    sellThrough15d: 20,
    target: 30,
    strikes: 2,
    trend: "down",
  },
];

// ─── Store Health Distribution (CEO, Regional) ─────────────────────────

export interface StoreHealthBucket {
  label: string;
  count: number;
  color: string;
}

export const storeHealthDistribution: StoreHealthBucket[] = [
  { label: "Green (on-track)", count: 124, color: "bg-success" },
  { label: "Amber (watch)", count: 58, color: "bg-warning" },
  { label: "Red (at-risk)", count: 27, color: "bg-error" },
];

// ─── Category P&L (Category Director) ──────────────────────────────────

export interface CategoryPnlMetric {
  label: string;
  value: string;
  target: string;
  status: "on-track" | "warning" | "critical";
}

export const categoryPnl: CategoryPnlMetric[] = [
  {
    label: "Gross Revenue",
    value: "₹58 Cr",
    target: "₹62 Cr",
    status: "warning",
  },
  { label: "Gross Margin", value: "44.2%", target: "≥45%", status: "warning" },
  { label: "Markdown%", value: "28%", target: "≤25%", status: "critical" },
  { label: "GMROI", value: "2.1x", target: "≥2.5x", status: "warning" },
];

// ─── Fashion Pyramid (Category Director) ───────────────────────────────

export interface FashionPyramidTier {
  tier: string;
  actual: number;
  target: number;
  status: "on-track" | "warning" | "critical";
}

export const fashionPyramid: FashionPyramidTier[] = [
  { tier: "Core", actual: 35, target: 40, status: "warning" },
  { tier: "Essential", actual: 27, target: 25, status: "on-track" },
  { tier: "Fashion", actual: 28, target: 25, status: "warning" },
  { tier: "Trend", actual: 10, target: 10, status: "on-track" },
];

// ─── Option Lifecycle (Category Director) ──────────────────────────────

export interface LifecycleBand {
  label: string;
  count: number;
  pct: number;
  color: string;
}

export const optionLifecycle: LifecycleBand[] = [
  { label: "0–30d", count: 1240, pct: 28, color: "bg-green-500" },
  { label: "31–60d", count: 890, pct: 20, color: "bg-green-400" },
  { label: "61–90d", count: 720, pct: 16, color: "bg-yellow-400" },
  { label: "91–120d", count: 540, pct: 12, color: "bg-yellow-500" },
  { label: "121–150d", count: 380, pct: 9, color: "bg-orange-400" },
  { label: "151–180d", count: 210, pct: 5, color: "bg-orange-500" },
  { label: ">180d", count: 420, pct: 10, color: "bg-red-500" },
];

// ─── PO Pipeline (Sourcing Director) ───────────────────────────────────

export interface POStage {
  stage: string;
  count: number;
  value: string;
  color: string;
}

export const poPipeline: POStage[] = [
  { stage: "Placed", count: 120, value: "₹180 Cr", color: "bg-blue-500" },
  { stage: "Confirmed", count: 98, value: "₹147 Cr", color: "bg-blue-400" },
  {
    stage: "In Production",
    count: 72,
    value: "₹108 Cr",
    color: "bg-yellow-500",
  },
  {
    stage: "Quality Check",
    count: 28,
    value: "₹42 Cr",
    color: "bg-purple-500",
  },
  { stage: "Shipped", count: 89, value: "₹134 Cr", color: "bg-green-500" },
  { stage: "Delayed", count: 24, value: "₹36 Cr", color: "bg-red-500" },
];

// ─── Vendor Risk (Sourcing Director) ───────────────────────────────────

export interface VendorRisk {
  name: string;
  fillRate: number;
  onTime: number;
  openPOs: number;
  riskLevel: "high" | "medium" | "low";
}

export const vendorRisks: VendorRisk[] = [
  {
    name: "Pearl Global",
    fillRate: 68,
    onTime: 62,
    openPOs: 34,
    riskLevel: "high",
  },
  {
    name: "Gokaldas Exports",
    fillRate: 72,
    onTime: 68,
    openPOs: 48,
    riskLevel: "high",
  },
  {
    name: "Bombay Rayon",
    fillRate: 78,
    onTime: 74,
    openPOs: 28,
    riskLevel: "medium",
  },
  {
    name: "Aditya Birla Fashion",
    fillRate: 82,
    onTime: 78,
    openPOs: 42,
    riskLevel: "medium",
  },
];

// ─── Campaign Dashboard (Marketing Director) ──────────────────────────

export interface CampaignRow {
  name: string;
  channel: string;
  spend: string;
  revenue: string;
  roas: number;
  status: "live" | "scheduled" | "completed";
}

export const activeCampaigns: CampaignRow[] = [
  {
    name: "Summer Essentials",
    channel: "Multi-channel",
    spend: "₹4.2 Cr",
    revenue: "₹17.6 Cr",
    roas: 4.2,
    status: "live",
  },
  {
    name: "Loyalty Week",
    channel: "WhatsApp + Email",
    spend: "₹0.6 Cr",
    revenue: "₹4.1 Cr",
    roas: 6.8,
    status: "live",
  },
  {
    name: "New Store Launch",
    channel: "In-Store + Local",
    spend: "₹1.2 Cr",
    revenue: "₹3.7 Cr",
    roas: 3.1,
    status: "live",
  },
  {
    name: "Monsoon Preview",
    channel: "Meta + Google",
    spend: "₹0 Cr",
    revenue: "-",
    roas: 0,
    status: "scheduled",
  },
];

export const blendedROAS = 3.8;

// ─── Channel Mix (Marketing Director) ──────────────────────────────────

export interface ChannelMixRow {
  channel: string;
  revenuePct: number;
  revenue: string;
  growth: string;
  color: string;
}

export const channelMix: ChannelMixRow[] = [
  {
    channel: "Store",
    revenuePct: 68,
    revenue: "₹475 Cr",
    growth: "+4%",
    color: "bg-primary",
  },
  {
    channel: "Online",
    revenuePct: 18,
    revenue: "₹126 Cr",
    growth: "+12%",
    color: "bg-blue-400",
  },
  {
    channel: "Marketplace",
    revenuePct: 11,
    revenue: "₹77 Cr",
    growth: "+8%",
    color: "bg-yellow-500",
  },
  {
    channel: "Social",
    revenuePct: 3,
    revenue: "₹21 Cr",
    growth: "+28%",
    color: "bg-green-500",
  },
];

// ─── Customer Health (Marketing Director) ──────────────────────────────

export interface CustomerMetric {
  label: string;
  value: string;
  change: string;
  status: "on-track" | "warning" | "critical";
}

export const customerHealth: CustomerMetric[] = [
  { label: "CRM Base", value: "4.2M", change: "+5%", status: "on-track" },
  { label: "Loyalty Members", value: "1.8M", change: "+8%", status: "warning" },
  {
    label: "Repeat Purchase (90d)",
    value: "28%",
    change: "-2%",
    status: "warning",
  },
  { label: "Avg CLV", value: "₹8,400", change: "+3%", status: "on-track" },
];

// ─── Store Ranking (Regional Director) ─────────────────────────────────

export interface StoreRankRow {
  rank: number;
  name: string;
  city: string;
  score: number;
  revPerSqft: string;
  sellThrough: string;
  position: "top" | "bottom";
}

export const storeRankings: StoreRankRow[] = [
  {
    rank: 1,
    name: "Phoenix Palladium",
    city: "Mumbai",
    score: 94,
    revPerSqft: "₹2,180",
    sellThrough: "82%",
    position: "top",
  },
  {
    rank: 2,
    name: "Ambience Mall",
    city: "Gurgaon",
    score: 91,
    revPerSqft: "₹1,960",
    sellThrough: "79%",
    position: "top",
  },
  {
    rank: 3,
    name: "Inorbit Mall",
    city: "Hyderabad",
    score: 89,
    revPerSqft: "₹1,840",
    sellThrough: "76%",
    position: "top",
  },
  {
    rank: 207,
    name: "Town Plaza",
    city: "Varanasi",
    score: 44,
    revPerSqft: "₹540",
    sellThrough: "32%",
    position: "bottom",
  },
  {
    rank: 208,
    name: "Metro Mall",
    city: "Patna",
    score: 43,
    revPerSqft: "₹510",
    sellThrough: "31%",
    position: "bottom",
  },
  {
    rank: 209,
    name: "Star Mall",
    city: "Lucknow",
    score: 42,
    revPerSqft: "₹480",
    sellThrough: "28%",
    position: "bottom",
  },
];

// ─── Competition Alerts (Regional Director) ────────────────────────────

export interface CompetitionAlert {
  text: string;
  severity: "high" | "medium" | "low";
  time: string;
}

export const competitionAlerts: CompetitionAlert[] = [
  {
    text: "Zara opened new store in Ambience Mall, Gurgaon — 200m from our location",
    severity: "high",
    time: "2h ago",
  },
  {
    text: "H&M running 40% off on summer collection — overlaps our pricing",
    severity: "high",
    time: "5h ago",
  },
  {
    text: "Westside launched loyalty program with 2x points on ethnic wear",
    severity: "medium",
    time: "1d ago",
  },
  {
    text: "FabIndia price reduction on linen range — 15% below our ASP",
    severity: "medium",
    time: "3d ago",
  },
];

// ─── VM Compliance (Regional Director) ─────────────────────────────────

export interface VMClusterRow {
  cluster: string;
  stores: number;
  vmScore: number;
  planogramPct: number;
  sopPct: number;
  status: "good" | "watch" | "at-risk" | "critical";
}

export const vmComplianceClusters: VMClusterRow[] = [
  {
    cluster: "West Metro",
    stores: 42,
    vmScore: 86,
    planogramPct: 82,
    sopPct: 92,
    status: "good",
  },
  {
    cluster: "South Metro",
    stores: 38,
    vmScore: 82,
    planogramPct: 78,
    sopPct: 90,
    status: "watch",
  },
  {
    cluster: "North Metro",
    stores: 35,
    vmScore: 78,
    planogramPct: 74,
    sopPct: 88,
    status: "watch",
  },
  {
    cluster: "East Metro",
    stores: 28,
    vmScore: 74,
    planogramPct: 68,
    sopPct: 85,
    status: "at-risk",
  },
  {
    cluster: "Tier-2 West",
    stores: 32,
    vmScore: 72,
    planogramPct: 66,
    sopPct: 82,
    status: "at-risk",
  },
  {
    cluster: "Tier-2 South",
    stores: 34,
    vmScore: 70,
    planogramPct: 64,
    sopPct: 80,
    status: "critical",
  },
];

// ─── Resolution Funnel (Ops Lead) ──────────────────────────────────────

export interface FunnelStep {
  label: string;
  count: number;
  color: string;
}

export const resolutionFunnel: FunnelStep[] = [
  { label: "Detected", count: 248, color: "bg-blue-500" },
  { label: "Triaged", count: 210, color: "bg-blue-400" },
  { label: "Agent Assigned", count: 186, color: "bg-yellow-500" },
  { label: "In Progress", count: 142, color: "bg-yellow-400" },
  { label: "Resolved", count: 118, color: "bg-green-500" },
  { label: "Escalated", count: 44, color: "bg-red-500" },
];

// ─── Delivery SLA (Ops Lead) ───────────────────────────────────────────

export interface DeliverySLAMetric {
  label: string;
  value: string;
  target: string;
  status: "on-track" | "warning" | "critical";
}

export const deliverySLA: DeliverySLAMetric[] = [
  {
    label: "On-Time Delivery",
    value: "91%",
    target: "≥95%",
    status: "warning",
  },
  { label: "Order Fill Rate", value: "94%", target: "≥97%", status: "warning" },
  { label: "Split Shipments", value: "12%", target: "≤8%", status: "critical" },
  {
    label: "Returns Processing",
    value: "4.2 days",
    target: "≤3 days",
    status: "critical",
  },
];

// ─── Config Health (Admin) ─────────────────────────────────────────────

export interface ConfigMetric {
  label: string;
  value: string;
  detail: string;
}

export const configHealth: ConfigMetric[] = [
  { label: "KPIs Configured", value: "42 / 48", detail: "6 pending setup" },
  { label: "Exception Rules", value: "186 active", detail: "12 disabled" },
  { label: "Agent Policies", value: "22 deployed", detail: "3 in draft" },
  { label: "User Roles", value: "8 active", detail: "124 users assigned" },
];

export interface AuditEntry {
  action: string;
  user: string;
  time: string;
}

export const recentAudit: AuditEntry[] = [
  {
    action: "Updated KPI threshold: Aged Inventory target changed to <10%",
    user: "admin@reliance.com",
    time: "2h ago",
  },
  {
    action: "Added exception rule: Vendor fill rate <85% triggers S2",
    user: "ops@reliance.com",
    time: "4h ago",
  },
  {
    action: "Deployed Markdown Agent v2.3 to production",
    user: "admin@reliance.com",
    time: "1d ago",
  },
  {
    action: "Created new role: Regional Planner with range access",
    user: "admin@reliance.com",
    time: "1d ago",
  },
  {
    action: "Updated store grade for 12 stores (A3 → A2 promotion)",
    user: "ops@reliance.com",
    time: "2d ago",
  },
];

// ─── Persona Insight Layer ───────────────────────────────────────────

export interface PersonaInsight {
  id: string;
  headline: string;
  detail: string;
  status: "on-track" | "warning" | "critical";
  metric?: string;
  action?: string;
}

export interface PersonaInsightData {
  morningQuestion: string;
  summary: string;
  insights: PersonaInsight[];
  agentActions: {
    agentId?: string;
    agentName: string;
    action: string;
    outcome: string;
  }[];
}

export const personaInsights: Record<string, PersonaInsightData> = {
  apex: {
    morningQuestion: "Is the \u20B913,150 Cr business on track?",
    summary:
      "Revenue tracking at 92% of plan. Aged inventory remains the biggest drag on margin. Footwear outperforming, Women Indian underperforming.",
    insights: [
      {
        id: "apex-1",
        headline: "Revenue gap widening",
        detail:
          "Daily run rate \u20B974 Cr vs \u20B9100 Cr plan. MTD at 92% (\u20B91,110 Cr of \u20B91,200 Cr). Gap concentrated in Women Indian and External Brands.",
        status: "critical",
        metric: "\u20B926 Cr/day gap",
        action:
          "Category heads briefed, chase orders triggered for top performers",
      },
      {
        id: "apex-2",
        headline: "Menswear Formal EBITDA negative",
        detail:
          "Third consecutive week of negative EBITDA. Sell-through at 58%, lowest in Menswear. Strike 3 review scheduled.",
        status: "critical",
        metric: "-\u20B91.2 Cr MTD",
        action: "Markdown ladder activated, liquidation agent monitoring",
      },
      {
        id: "apex-3",
        headline: "Aged stock at \u20B9325 Cr",
        detail:
          "\u20B9325 Cr in >180-day stock (13.1% of total). Women Indian worst at 27%. Liquidation batch routed to B2B channel.",
        status: "warning",
        metric: "13.1% of inventory",
        action: "Liquidation agent triggered for oldest batch",
      },
    ],
    agentActions: [
      {
        agentName: "Replenishment Engine",
        action: "Auto-generated 23 replenishment POs for fast-moving styles",
        outcome: "Fill rate maintained at 94%",
      },
      {
        agentName: "Price Sentinel",
        action: "Adjusted markdown ladder for 42 aged styles",
        outcome: "Projected \u20B912 L recovery",
      },
      {
        agentName: "Liquidation Trigger",
        action: "Initiated B2B routing for 180+ day stock batch",
        outcome: "Awaiting approval (Gate LQ-0089)",
      },
    ],
  },
  ceo: {
    morningQuestion:
      "Where across the value chain do I need to intervene today?",
    summary:
      "SELL domain has the most critical exceptions. 3 category teams at strike risk. 42 stores in red — concentrated in East Tier-2.",
    insights: [
      {
        id: "ceo-1",
        headline: "SELL domain needs attention",
        detail:
          "12 critical exceptions in SELL — highest across all domains. Conversion drop in 5 stores, CSA redeployment underway. MOVE and MAKE domains stable.",
        status: "critical",
        metric: "12 critical exceptions",
        action: "Conversion Sentinel assigned, 3 auto-resolved",
      },
      {
        id: "ceo-2",
        headline: "3 category teams at strike risk",
        detail:
          "Menswear Formal, Women Indian Ethnic, and External Brands each have 2+ strikes. 15-day sell-through below 60% for all three.",
        status: "critical",
        metric: "3 teams at risk",
        action: "Performance reviews scheduled this week",
      },
      {
        id: "ceo-3",
        headline: "42 stores in red zone",
        detail:
          "Store health distribution: 124 green, 43 amber, 42 red. Red stores concentrated in East Tier-2 and North Tier-3.",
        status: "warning",
        metric: "20% stores underperforming",
        action: "Regional directors notified, action plans due by Friday",
      },
    ],
    agentActions: [
      {
        agentName: "Conversion Sentinel",
        action: "Flagged 5 stores with conversion drop >15%",
        outcome: "3 resolved via CSA redeployment",
      },
      {
        agentName: "Category Health Monitor",
        action: "Identified 3 teams approaching strike threshold",
        outcome: "Automated performance alerts sent",
      },
      {
        agentName: "Store Grading Agent",
        action: "Recalculated store grades for 209 stores",
        outcome: "12 stores regraded (A3\u2192A2)",
      },
    ],
  },
  category: {
    morningQuestion: "How is my category performing and what\u2019s ageing?",
    summary:
      "GM% slightly below target but within tolerance. 42 options crossed 180-day mark — markdown ladder activated. Fashion mix over-indexed at 38%.",
    insights: [
      {
        id: "cat-1",
        headline: "GM% at 41.2% — near target",
        detail:
          "Gross margin at 41.2% vs 42% target. Markdown at 8.5%, well within 10% budget. GMROI at 2.4x, above 2.2x threshold.",
        status: "warning",
        metric: "0.8 pts below target",
        action: "Pricing agent monitoring, no intervention needed",
      },
      {
        id: "cat-2",
        headline: "42 options crossed 180-day mark",
        detail:
          "Age band >180d grew by 8 options this week. Heaviest in Women Indian sarees (14 options) and Menswear formals (11 options).",
        status: "critical",
        metric: "42 aged options",
        action: "Markdown ladder adjusted, B2B routing for 12 oldest",
      },
      {
        id: "cat-3",
        headline: "Fashion mix over-indexed",
        detail:
          "Fashion grade at 38% of assortment vs 30% target. Core+Essential at 62% vs 70% target. Higher risk on unsold fashion inventory.",
        status: "warning",
        metric: "8 pts over target",
        action: "Next season range plan adjusted to correct mix",
      },
    ],
    agentActions: [
      {
        agentName: "Price Sentinel",
        action: "Adjusted markdown ladder for 42 aged styles",
        outcome: "Projected \u20B912 L recovery",
      },
      {
        agentName: "Range Optimizer",
        action: "Flagged fashion-grade over-indexing in 3 categories",
        outcome: "Core mix recommendations generated",
      },
      {
        agentName: "Drop Tracker",
        action: "SS26 Drop 3 cleared QC — ready for dispatch",
        outcome: "2,400 units in transit to 45 stores",
      },
    ],
  },
  sourcing: {
    morningQuestion:
      "What\u2019s late, what\u2019s stuck, which vendor needs intervention?",
    summary:
      "3 POs beyond SLA, concentrated with 2 vendors. Fill rate for Aditya Birla Fashion dropped to 74%. 186 GRN pending.",
    insights: [
      {
        id: "src-1",
        headline: "3 POs delayed beyond SLA",
        detail:
          "PO-2847 (Arvind Ltd, 28d late), PO-3102 (Aditya Birla, 14d late), PO-2956 (Raymond, 8d late). Combined value \u20B918 Cr.",
        status: "critical",
        metric: "\u20B918 Cr at risk",
        action: "Vendor escalation calls scheduled today",
      },
      {
        id: "src-2",
        headline: "Vendor fill rate dropped",
        detail:
          "Aditya Birla Fashion fill rate at 74% (was 88% last month). Raymond at 78%. Both below 85% threshold — S2 exception triggered.",
        status: "critical",
        metric: "2 vendors below SLA",
        action: "Alternate vendor sourcing initiated for critical SKUs",
      },
      {
        id: "src-3",
        headline: "186 GRN pending at warehouse",
        detail:
          "186 goods receipt notes pending processing. 42 in QC stage, 38 awaiting dock allocation. Avg processing time 2.1 days vs 1.5 day target.",
        status: "warning",
        metric: "186 pending GRN",
        action: "Warehouse ops alerted, overtime approved for backlog",
      },
    ],
    agentActions: [
      {
        agentName: "PO Tracking Agent",
        action: "Flagged 3 POs with SLA breach and auto-escalated to vendors",
        outcome: "Acknowledgement received from 2 of 3 vendors",
      },
      {
        agentName: "Vendor Risk Monitor",
        action: "Downgraded risk rating for Aditya Birla Fashion and Raymond",
        outcome: "Alternate vendor recommendations generated",
      },
      {
        agentName: "GRN Accelerator",
        action: "Prioritized 42 QC-pending shipments by revenue impact",
        outcome: "Top 15 fast-tracked for same-day processing",
      },
    ],
  },
  marketing: {
    morningQuestion: "Which campaigns are working and where\u2019s my ROAS?",
    summary:
      "Blended ROAS at 3.8x. Summer Edit campaign outperforming at 4.2x. Social channel underperforming — needs budget reallocation.",
    insights: [
      {
        id: "mkt-1",
        headline: "Summer Edit campaign leading at 4.2x ROAS",
        detail:
          "Spend \u20B928 L, revenue \u20B91.18 Cr. Performance ads driving 60% of conversions. Weekend Flash underperforming at 1.8x — below 2.5x threshold.",
        status: "on-track",
        metric: "4.2x ROAS",
        action: "Budget shift recommended from Weekend Flash to Summer Edit",
      },
      {
        id: "mkt-2",
        headline: "Social channel underperforming",
        detail:
          "Social contributing 8% of revenue vs 12% target. Instagram engagement down 15% WoW. Influencer content performing 40% below benchmark.",
        status: "warning",
        metric: "-4 pts vs target",
        action:
          "Creative refresh in progress, new influencer cohort being onboarded",
      },
      {
        id: "mkt-3",
        headline: "Repeat purchase below target",
        detail:
          "Repeat purchase rate at 34% vs 40% target. Loyalty program enrollment at 2.1M but active rate only 42%. CLV at \u20B94,200 — flat MoM.",
        status: "warning",
        metric: "34% repeat rate",
        action: "Loyalty re-engagement campaign launching this week",
      },
    ],
    agentActions: [
      {
        agentName: "Campaign Optimizer",
        action: "Reallocated \u20B95 L budget from Weekend Flash to Summer Edit",
        outcome: "Projected ROAS improvement to 4.5x",
      },
      {
        agentName: "Audience Sentinel",
        action: "Identified 3 high-intent segments for retargeting",
        outcome: "12 K users added to remarketing pool",
      },
      {
        agentName: "CRM Agent",
        action: "Triggered win-back emails to 8,400 lapsed loyalty members",
        outcome: "6.2% open rate in first 4 hours",
      },
    ],
  },
  regional: {
    morningQuestion:
      "Which stores need my attention and what\u2019s the competition doing?",
    summary:
      "Bottom 3 stores all in Tier-2 cities. Zara opened near Ambience Mall. VM compliance lagging in East and South clusters.",
    insights: [
      {
        id: "reg-1",
        headline: "Bottom 3 stores in Tier-2 cities",
        detail:
          "Star Mall (Lucknow), Metro Mall (Patna), Town Plaza (Varanasi) — all below \u20B9600/sqft revenue. Footfall down 12% avg, conversion at 8% vs 15% benchmark.",
        status: "critical",
        metric: "<\u20B9600/sqft rev",
        action: "Store visits scheduled, CSA training initiated",
      },
      {
        id: "reg-2",
        headline: "Zara opened near Ambience Mall",
        detail:
          "New Zara store 200m from our Ambience Mall location. H&M running 40% off on summer collection — overlaps our pricing on 23 SKUs.",
        status: "warning",
        metric: "2 competitor moves",
        action: "Competitive pricing review triggered, display refresh planned",
      },
      {
        id: "reg-3",
        headline: "East cluster VM compliance at 68%",
        detail:
          "Planogram adherence at 68% in East Metro (28 stores) and 64% in Tier-2 South (34 stores). Both below 75% minimum standard.",
        status: "warning",
        metric: "68% planogram score",
        action: "VM audit team deployed to bottom 10 stores",
      },
    ],
    agentActions: [
      {
        agentName: "Store Health Agent",
        action:
          "Identified 6 stores with 3+ consecutive weeks of declining footfall",
        outcome: "Local marketing campaigns recommended",
      },
      {
        agentName: "Competition Monitor",
        action: "Detected 2 new competitor openings and 1 pricing action",
        outcome: "Competitive intelligence report generated",
      },
      {
        agentName: "VM Compliance Agent",
        action: "Scored 209 stores on planogram and SOP adherence",
        outcome: "34 stores flagged for corrective action",
      },
    ],
  },
  ops: {
    morningQuestion:
      "What\u2019s the exception backlog and are we meeting SLAs?",
    summary:
      "Exception backlog at 47 items. Avg resolution time within SLA at 6.2 hrs. Split shipments at 12% — above 8% target.",
    insights: [
      {
        id: "ops-1",
        headline: "Exception backlog at 47",
        detail:
          "Detected: 248, Triaged: 210, Assigned: 186, Resolved: 118, Escalated: 44. Resolution rate at 48% — below 60% weekly target. 8 items at SLA breach risk.",
        status: "warning",
        metric: "47 open exceptions",
        action: "Triage standup at 10 AM, top 10 exceptions prioritized",
      },
      {
        id: "ops-2",
        headline: "On-time delivery at 91%",
        detail:
          "Below 95% target for 2nd consecutive week. Root cause: warehouse capacity in West hub, GRN processing delays. Split shipments at 12% (target: \u22648%).",
        status: "critical",
        metric: "91% OTD",
        action: "Overtime approved for West hub, GRN backlog prioritized",
      },
      {
        id: "ops-3",
        headline: "Agent autonomy improving",
        detail:
          "14 autonomous actions overnight, 3 escalations. Agent-resolved rate at 24% (target: 20%). Replenishment and pricing agents most active.",
        status: "on-track",
        metric: "24% auto-resolved",
        action: "Expanding agent authority for markdown decisions",
      },
    ],
    agentActions: [
      {
        agentName: "Replenishment Engine",
        action: "Auto-generated 23 replenishment POs for fast-moving styles",
        outcome: "Fill rate maintained at 94%",
      },
      {
        agentName: "Conversion Sentinel",
        action: "Flagged 5 stores with conversion drop >15%",
        outcome: "3 resolved via CSA redeployment",
      },
      {
        agentName: "SLA Monitor",
        action: "Identified 8 exceptions approaching SLA breach",
        outcome: "Auto-escalated to POD heads",
      },
    ],
  },
  admin: {
    morningQuestion: "Is the platform healthy and what changed?",
    summary:
      "All 12 systems operational. 2 config changes deployed overnight. 1 agent policy pending review.",
    insights: [
      {
        id: "adm-1",
        headline: "All systems operational",
        detail:
          "All 12 integrated systems running at normal capacity. ERP uptime 99.97%, WMS at 99.94%. No degradation alerts in last 24 hours.",
        status: "on-track",
        metric: "12/12 healthy",
        action: "No action needed",
      },
      {
        id: "adm-2",
        headline: "2 config changes deployed",
        detail:
          "Aged Inventory threshold changed to <10% (was <15%). New exception rule: vendor fill rate <85% triggers S2. Both deployed at 02:00 AM.",
        status: "on-track",
        metric: "2 changes live",
        action: "Monitoring for false-positive exceptions",
      },
    ],
    agentActions: [
      {
        agentName: "Config Validator",
        action: "Validated 2 overnight config changes against rule engine",
        outcome: "No conflicts detected, changes active",
      },
      {
        agentName: "System Health Agent",
        action: "Completed daily health check across 12 systems",
        outcome: "All systems passed, uptime >99.9%",
      },
    ],
  },
};
