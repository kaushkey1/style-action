// Persona definitions used across layout, dashboard, exceptions, and agents modules.

export type PersonaId =
  | "apex"
  | "ceo"
  | "category"
  | "category-director"
  | "sourcing"
  | "marketing"
  | "regional"
  | "ops"
  | "admin";

export interface CTKpi {
  id: string;
  name: string;
  description: string;
  value: string;
  target: string;
  status: "on-track" | "warning" | "critical";
  icon: string;
}

export interface TableSection {
  type: "table";
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface BarsSection {
  type: "bars";
  title: string;
  items: { label: string; value: number; max: number; color: string }[];
}

export interface AlertsSection {
  type: "alerts";
  title: string;
  items: { text: string; severity: "high" | "medium" | "low"; time: string }[];
}

export interface FunnelSection {
  type: "funnel";
  title: string;
  steps: { label: string; value: number; color: string }[];
}

export interface TrackerSection {
  type: "tracker";
  title: string;
  phases: { label: string; count: number; color: string }[];
}

export interface SummaryCardsSection {
  type: "summary-cards";
  title: string;
  cards: {
    label: string;
    value: string;
    status: "on-track" | "warning" | "critical";
  }[];
}

export type TabSection =
  | TableSection
  | BarsSection
  | AlertsSection
  | FunnelSection
  | TrackerSection
  | SummaryCardsSection;

export interface PersonaTab {
  id: string;
  name: string;
  icon: string;
  kpis: CTKpi[];
  sections?: TabSection[];
}

export type DashboardCardId =
  | "exceptions"
  | "agents"
  | "approvals"
  | "drops"
  | "inventory"
  | "systems"
  | "calendar"
  | "revenue-scoreboard"
  | "worst-performer"
  | "value-chain-health"
  | "value-chain-exceptions"
  | "category-leaderboard"
  | "store-health-dist"
  | "category-pnl"
  | "fashion-pyramid"
  | "option-lifecycle"
  | "po-pipeline"
  | "vendor-risk"
  | "campaign-dashboard"
  | "channel-mix"
  | "customer-health"
  | "store-ranking"
  | "competition-alerts"
  | "vm-compliance"
  | "resolution-funnel"
  | "delivery-sla"
  | "config-health";

export interface PersonaConfig {
  pages: string[];
  defaultFilters: {
    exceptionDomain?: string;
    agentDomain?: string;
    calendarTab?: string;
  };
  dashboardKpiIds: string[];
  dashboardCards: DashboardCardId[];
}

export interface Persona {
  id: PersonaId;
  name: string;
  subtitle: string;
  icon: string;
  tabs: PersonaTab[];
  config: PersonaConfig;
}

export const personas: Persona[] = [
  // ─── Apex Leadership ────────────────────────────────────────────────
  {
    id: "apex",
    name: "Apex Leadership",
    subtitle: "Chairman — ₹13,150 Cr F&L business across 2,131 stores",
    icon: "crown",
    config: {
      pages: [
        "/",
        "/control-tower",
        "/calendar",
        "/inventory",
        "/execute/allocation",
        "/execute/allocation/actions",
        "/exceptions",
        "/approvals",
        "/agents",
        "/admin/category-teams",
        "/admin/guardrails",
        "/store-view",
        "/otb",
        "/showroom",
        "/buy-plans",
        "/range",
        "/range/performance",
        "/range/carryover",
        "/aop",
        "/docs",
      ],
      defaultFilters: {
        exceptionDomain: "all",
        agentDomain: "all",
        calendarTab: "retail",
      },
      dashboardKpiIds: [
        "apex-rev-rate",
        "apex-gm",
        "apex-aged-value",
        "apex-inv-turns",
        "apex-st-90d",
      ],
      dashboardCards: ["revenue-scoreboard", "worst-performer"],
    },
    tabs: [
      {
        id: "apex-pulse",
        name: "Business Pulse",
        icon: "activity",
        kpis: [
          {
            id: "apex-rev",
            name: "Revenue Run Rate",
            description: "Daily revenue across 2,131 stores",
            value: "₹74 Cr/day",
            target: "₹100 Cr/day",
            status: "critical",
            icon: "indian-rupee",
          },
          {
            id: "apex-gm",
            name: "Gross Margin",
            description: "Blended GM across all categories",
            value: "41.7%",
            target: "≥42%",
            status: "on-track",
            icon: "trending-up",
          },
          {
            id: "apex-st",
            name: "Sell-Through (90d)",
            description: "Full-price sell-through rate",
            value: "68%",
            target: "≥70%",
            status: "critical",
            icon: "shopping-bag",
          },
          {
            id: "apex-aged",
            name: "Aged Inventory",
            description: "Stock >180 days value",
            value: "₹325 Cr",
            target: "<₹100 Cr",
            status: "critical",
            icon: "alert-triangle",
          },
          {
            id: "apex-inv-turns",
            name: "Inventory Turns",
            description: "Annualised inventory turns",
            value: "5.8x",
            target: "≥8x",
            status: "critical",
            icon: "refresh-cw",
          },
        ],
        sections: [
          {
            type: "summary-cards",
            title: "Revenue Snapshot",
            cards: [
              { label: "Today", value: "₹74 Cr", status: "critical" },
              { label: "MTD (Feb)", value: "₹1,110 Cr", status: "warning" },
              { label: "YTD (FY26)", value: "₹9,862 Cr", status: "on-track" },
            ],
          },
          {
            type: "table",
            title: "Revenue & Margin by Category",
            headers: [
              "Category",
              "Revenue (Cr/mo)",
              "GM%",
              "Sell-Through%",
              "Aged Inv%",
              "Fresh%",
            ],
            rows: [
              ["Menswear", "₹188", "43.0%", "70%", "17%", "56%"],
              ["Women Indian", "₹116", "39.1%", "59%", "27%", "43%"],
              ["Women Western", "₹108", "42.8%", "68%", "17%", "55%"],
              ["Kids", "₹80", "41.8%", "75%", "12%", "63%"],
              ["Non-Apparel", "₹80", "44.6%", "68%", "17%", "57%"],
              ["External Brands", "₹66", "33.5%", "67%", "21%", "50%"],
            ],
          },
          {
            type: "alerts",
            title: "Data-Driven Alerts",
            items: [
              {
                text: "Women Indian aged inventory at 27% — highest across categories. Sarees & Dupattas at 30%, Lehengas at 34%.",
                severity: "high",
                time: "Today",
              },
              {
                text: "Ethnic Menswear sell-through at 58% — lowest in Menswear. Aged inventory at 28%.",
                severity: "high",
                time: "Today",
              },
              {
                text: "Home & Living aged inventory at 32%, sell-through 56%, GM 36.8% — weakest non-apparel category.",
                severity: "high",
                time: "Today",
              },
              {
                text: "East Metro POD: Revenue ₹5.8 Cr/day, sell-through 62%, aged inventory 26% — lowest metro.",
                severity: "medium",
                time: "1d ago",
              },
              {
                text: "East Tier-2 POD: Sell-through 58%, aged inventory 28% — lowest performing geography.",
                severity: "medium",
                time: "1d ago",
              },
              {
                text: "External Brands GM at 33.5% — 8+ pts below private-label average. 6 vendors with fill rate below 85%.",
                severity: "medium",
                time: "2d ago",
              },
            ],
          },
        ],
      },
      {
        id: "apex-inventory",
        name: "Inventory Health",
        icon: "package-check",
        kpis: [
          {
            id: "apex-inv-total",
            name: "Total Inventory",
            description: "Store + warehouse + transit",
            value: "₹2,480 Cr",
            target: "<₹2,200 Cr",
            status: "warning",
            icon: "wallet",
          },
          {
            id: "apex-inv-aged",
            name: "Aged Stock (>120d)",
            description: "Value at risk of markdown/write-off",
            value: "₹325 Cr (13.1%)",
            target: "<5%",
            status: "critical",
            icon: "alert-triangle",
          },
          {
            id: "apex-inv-fresh",
            name: "Fresh Inventory",
            description: "Stock less than 90 days old",
            value: "52%",
            target: "≥68%",
            status: "warning",
            icon: "zap",
          },
          {
            id: "apex-inv-doi",
            name: "Inventory Days",
            description: "Days of inventory on hand",
            value: "95 days",
            target: "≤90 days",
            status: "warning",
            icon: "clock",
          },
          {
            id: "apex-cat-options-aged",
            name: "Options Aged >45d",
            description: "Options in Stage 3 beyond 45 days",
            value: "42",
            target: "≤10",
            status: "critical",
            icon: "clock",
          },
        ],
        sections: [
          {
            type: "summary-cards",
            title: "Stock Distribution",
            cards: [
              { label: "Store Stock", value: "₹1,680 Cr", status: "on-track" },
              { label: "Warehouse", value: "₹520 Cr", status: "warning" },
              { label: "In Transit", value: "₹180 Cr", status: "on-track" },
            ],
          },
          {
            type: "bars",
            title: "Inventory Age Distribution (% of total value)",
            items: [
              {
                label: "0–30 days (Fresh)",
                value: 28,
                max: 100,
                color: "bg-green-500",
              },
              {
                label: "31–60 days",
                value: 24,
                max: 100,
                color: "bg-green-400",
              },
              {
                label: "61–90 days",
                value: 18,
                max: 100,
                color: "bg-yellow-400",
              },
              {
                label: "91–180 days",
                value: 17,
                max: 100,
                color: "bg-orange-400",
              },
              {
                label: ">180 days (Aged)",
                value: 13,
                max: 100,
                color: "bg-red-500",
              },
            ],
          },
          {
            type: "table",
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
              ["Menswear", "₹620 Cr", "17%", "56%", "1.2%", "88d", "4.1x"],
              ["Women Indian", "₹480 Cr", "27%", "43%", "0.9%", "112d", "3.3x"],
              ["Women Western", "₹380 Cr", "17%", "55%", "1.1%", "92d", "4.0x"],
              ["Kids", "₹260 Cr", "12%", "63%", "0.8%", "78d", "4.7x"],
              ["Non-Apparel", "₹340 Cr", "17%", "57%", "1.4%", "86d", "4.2x"],
              [
                "External Brands",
                "₹400 Cr",
                "21%",
                "50%",
                "0.6%",
                "98d",
                "3.7x",
              ],
            ],
          },
        ],
      },
      {
        id: "apex-geography",
        name: "Geography",
        icon: "map-pin",
        kpis: [
          {
            id: "apex-geo-stores",
            name: "Total Stores",
            description: "Across 10 Operations PODs",
            value: "2,131",
            target: "2,500",
            status: "on-track",
            icon: "shopping-bag",
          },
          {
            id: "apex-geo-rev",
            name: "Avg Revenue/Store",
            description: "Daily revenue per store",
            value: "₹3.5 L/day",
            target: "≥₹4.7 L/day",
            status: "critical",
            icon: "indian-rupee",
          },
          {
            id: "apex-geo-st",
            name: "Avg Sell-Through",
            description: "Weighted average across PODs",
            value: "68%",
            target: "≥70%",
            status: "on-track",
            icon: "trending-up",
          },
          {
            id: "apex-geo-aged",
            name: "Avg Aged Inventory",
            description: "Stock >180d across PODs",
            value: "18%",
            target: "<10%",
            status: "critical",
            icon: "alert-triangle",
          },
        ],
      },
      // {
      //   id: 'apex-categories',
      //   name: 'Categories',
      //   icon: 'layers',
      //   kpis: [
      //     { id: 'apex-cat-winners', name: 'Categories On-Track', description: 'Categories meeting sell-through & GM targets', value: '3 of 6', target: '≥5', status: 'critical', icon: 'target' },
      //     { id: 'apex-cat-md-pending', name: 'Markdown Triggers Pending', description: 'Unactioned markdown triggers across all categories', value: '14', target: '0', status: 'critical', icon: 'alert-triangle' },
      //     { id: 'apex-cat-topup', name: 'Top-Up POs Pending', description: 'In-season replenishment POs awaiting release', value: '8', target: '0', status: 'warning', icon: 'package-check' },
      //     { id: 'apex-cat-options-aged', name: 'Options Aged >45d', description: 'Options in Stage 3 beyond 45 days', value: '42', target: '≤10', status: 'critical', icon: 'clock' },
      //   ],
      // },
      {
        id: "apex-supply",
        name: "Supply Chain",
        icon: "truck",
        kpis: [
          {
            id: "apex-sc-otif",
            name: "Vendor OTIF",
            description: "On-Time In-Full delivery rate",
            value: "84%",
            target: "≥90%",
            status: "warning",
            icon: "truck",
          },
          {
            id: "apex-sc-fill",
            name: "Vendor Fill Rate",
            description: "Qty received vs qty ordered",
            value: "87%",
            target: "≥95%",
            status: "critical",
            icon: "target",
          },
          {
            id: "apex-sc-noos",
            name: "NOOS Stockout (Stores)",
            description: "Stores with NOOS options at zero stock",
            value: "38",
            target: "0",
            status: "critical",
            icon: "alert-triangle",
          },
        ],
        sections: [
          {
            type: "summary-cards",
            title: "Procurement Pipeline",
            cards: [
              { label: "Open PRs", value: "342", status: "on-track" },
              { label: "Open POs", value: "1,248", status: "warning" },
              { label: "GRN Pending", value: "186", status: "warning" },
            ],
          },
          {
            type: "table",
            title: "Top Vendors by Volume",
            headers: [
              "Vendor",
              "Open POs",
              "Fill Rate",
              "Avg Lead Time",
              "OTIF%",
            ],
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
          },
          {
            type: "bars",
            title: "PO Lead Time Distribution",
            items: [
              { label: "≤20 days", value: 18, max: 100, color: "bg-green-500" },
              {
                label: "21–30 days",
                value: 34,
                max: 100,
                color: "bg-green-400",
              },
              {
                label: "31–40 days",
                value: 28,
                max: 100,
                color: "bg-yellow-400",
              },
              {
                label: "41–60 days",
                value: 14,
                max: 100,
                color: "bg-orange-400",
              },
              { label: ">60 days", value: 6, max: 100, color: "bg-red-500" },
            ],
          },
        ],
      },
    ],
  },

  // ─── CEO / Business Head ───────────────────────────────────────────
  {
    id: "ceo",
    name: "CEO / Business Head",
    subtitle: "Real-time KPI dashboard for 209 pilot stores",
    icon: "building",
    config: {
      pages: [
        "/",
        "/exceptions",
        "/approvals",
        "/agents",
        "/calendar",
        "/inventory",
        "/execute/allocation",
        "/execute/allocation/actions",
        "/control-tower",
        "/admin/category-teams",
        "/admin/guardrails",
        "/store-view",
        "/otb",
        "/showroom",
        "/buy-plans",
        "/range",
        "/range/performance",
        "/range/carryover",
        "/aop",
        "/docs",
      ],
      defaultFilters: {
        exceptionDomain: "all",
        agentDomain: "all",
        calendarTab: "retail",
      },
      dashboardKpiIds: ["ceo-K001", "ceo-gm", "ceo-st", "ceo-inv-turns"],
      dashboardCards: [
        "value-chain-health",
        "category-leaderboard",
        "store-health-dist",
      ],
    },
    tabs: [
      {
        id: "overview",
        name: "Overview",
        icon: "activity",
        kpis: [
          {
            id: "ceo-cm",
            name: "Store CM",
            description: "Store Contribution Margin",
            value: "+1.2 pts",
            target: "+1 pt",
            status: "on-track",
            icon: "indian-rupee",
          },
          {
            id: "ceo-gm",
            name: "Gross Margin",
            description: "Profitability across all lanes",
            value: "41.7%",
            target: "≥42%",
            status: "warning",
            icon: "trending-up",
          },
          {
            id: "ceo-st",
            name: "Sell-Through",
            description: "Full-price sell-through rate",
            value: "68%",
            target: "≥70%",
            status: "warning",
            icon: "shopping-bag",
          },
          {
            id: "ceo-nsv",
            name: "Net Revenue vs Plan",
            description: "Season net revenue vs AOP target",
            value: "92%",
            target: "≥100%",
            status: "warning",
            icon: "target",
          },
        ],
        sections: [
          {
            type: "summary-cards",
            title: "Calendar Health",
            cards: [
              {
                label: "Retail Calendar",
                value: "On Track",
                status: "on-track",
              },
              {
                label: "Marketing Calendar",
                value: "2 Delays",
                status: "warning",
              },
              {
                label: "Store Calendar",
                value: "1 Conflict",
                status: "critical",
              },
            ],
          },
          {
            type: "bars",
            title: "Exception Severity",
            items: [
              { label: "Critical", value: 12, max: 50, color: "bg-red-500" },
              { label: "Warning", value: 34, max: 50, color: "bg-yellow-500" },
              { label: "Info", value: 48, max: 50, color: "bg-blue-500" },
            ],
          },
          {
            type: "summary-cards",
            title: "Agent Workforce",
            cards: [
              { label: "Active Agents", value: "18 / 22", status: "on-track" },
              { label: "Auto-Resolved Today", value: "47", status: "on-track" },
              { label: "Escalated to Human", value: "8", status: "warning" },
            ],
          },
          {
            type: "summary-cards",
            title: "Space Productivity",
            cards: [
              {
                label: "Network Avg SPSF",
                value: "₹742 vs ₹770 target",
                status: "warning",
              },
              {
                label: "Stores Below SPSF Floor",
                value: "23 of 209",
                status: "critical",
              },
              {
                label: "Pending Space Adjustments",
                value: "14 recommendations",
                status: "warning",
              },
            ],
          },
          {
            type: "bars",
            title: "15M Garment Capacity Status",
            items: [
              {
                label: "Grade A (651 stores)",
                value: 79.5,
                max: 100,
                color: "bg-green-500",
              },
              {
                label: "Grade A1 (410 stores)",
                value: 39.4,
                max: 50,
                color: "bg-blue-500",
              },
              {
                label: "Grade A2 (160 stores)",
                value: 6.2,
                max: 10,
                color: "bg-yellow-500",
              },
              {
                label: "Grade A3 (670 stores)",
                value: 28.2,
                max: 40,
                color: "bg-purple-500",
              },
            ],
          },
        ],
      },
      {
        id: "financial",
        name: "Financial",
        icon: "indian-rupee",
        kpis: [
          {
            id: "ceo-K001",
            name: "Gross Revenue (Retail)",
            description: "Total invoice value net of returns & discount",
            value: "₹698 Cr",
            target: "₹720 Cr",
            status: "warning",
            icon: "indian-rupee",
          },
          {
            id: "ceo-K086",
            name: "Format EBITDA %",
            description: "Format Revenue minus COGS minus Ops Costs",
            value: "10.2%",
            target: "≥11%",
            status: "warning",
            icon: "target",
          },
          {
            id: "ceo-md",
            name: "Markdown%",
            description: "Revenue at markdown",
            value: "33%",
            target: "≤30%",
            status: "warning",
            icon: "tag",
          },
          {
            id: "ceo-fashion",
            name: "Fashion Mix",
            description: "Fashion % of assortment (cap)",
            value: "38%",
            target: "≤30%",
            status: "critical",
            icon: "sparkles",
          },
          {
            id: "ceo-intake-margin",
            name: "Intake Margin %",
            description: "Margin at time of goods receipt",
            value: "49.2%",
            target: "≥50%",
            status: "warning",
            icon: "trending-up",
          },
          {
            id: "ceo-inv-turns",
            name: "Inventory Turns",
            description: "Annualised inventory turns",
            value: "5.8x",
            target: "≥8x",
            status: "critical",
            icon: "refresh-cw",
          },
        ],
      },
      {
        id: "operations",
        name: "Operations",
        icon: "truck",
        kpis: [
          {
            id: "ceo-noos",
            name: "NOOS Stockout (Stores)",
            description: "Stores with NOOS options at zero stock",
            value: "38",
            target: "0",
            status: "critical",
            icon: "alert-triangle",
          },
        ],
      },
      // {
      //   id: 'customer',
      //   name: 'Customer',
      //   icon: 'heart',
      //   kpis: [
      //     { id: 'ceo-K018', name: 'NPS (Net Promoter Score)', description: 'Promoters minus Detractors', value: '64', target: '≥75', status: 'critical', icon: 'heart' },
      //     { id: 'ceo-K019', name: 'Customer Complaints TAT', description: 'Avg days for resolution of customer complaints', value: '3.2 days', target: '≤3 days', status: 'warning', icon: 'clock' },
      //     { id: 'ceo-returns', name: 'Returns Rate', description: 'Product return %', value: '17.2%', target: '≤18%', status: 'on-track', icon: 'trending-up' },
      //     { id: 'ceo-conv', name: 'Conversion Rate', description: 'Footfall to purchase', value: '14.5%', target: '≥15%', status: 'warning', icon: 'users' },
      //   ],
      // },
      {
        id: "working-capital",
        name: "Working Capital",
        icon: "wallet",
        kpis: [
          {
            id: "ceo-inv-days",
            name: "Inventory Days",
            description: "Days of inventory on hand",
            value: "95 days",
            target: "≤90 days",
            status: "warning",
            icon: "clock",
          },
          {
            id: "ceo-vendor-cr",
            name: "Vendor Credit",
            description: "Avg credit period",
            value: "28 days",
            target: "≥30 days",
            status: "warning",
            icon: "wallet",
          },
          {
            id: "ceo-ft-vel",
            name: "First-Through Velocity",
            description: "% sold in first 45 days",
            value: "42%",
            target: "≥50%",
            status: "warning",
            icon: "zap",
          },
        ],
      },
    ],
  },

  // ─── Category Director ─────────────────────────────────────────────
  {
    id: "category",
    name: "Category Director",
    subtitle: "Design-to-sell-through lifecycle for 22 category teams",
    icon: "layers",
    config: {
      pages: [
        "/",
        "/calendar",
        "/inventory",
        "/execute/allocation",
        "/execute/allocation/actions",
        "/control-tower",
        "/admin/category-teams",
        "/store-view",
        "/otb",
        "/showroom",
        "/buy-plans",
        "/range",
        "/range/performance",
        "/range/carryover",
        "/aop",
        "/docs",
      ],
      defaultFilters: {
        exceptionDomain: "SELL",
        agentDomain: "Sell",
        calendarTab: "retail",
      },
      dashboardKpiIds: [
        "cat-gm",
        "cat-15d-st",
        "cat-markdown",
        "cat-gmroi",
        "cat-otb",
        "cat-unactioned-md",
      ],
      dashboardCards: [
        "category-pnl",
        "fashion-pyramid",
        "option-lifecycle",
        "drops",
      ],
    },
    tabs: [
      {
        id: "pnl",
        name: "Category P&L",
        icon: "indian-rupee",
        kpis: [
          {
            id: "cat-K001",
            name: "Gross Revenue (Retail)",
            description: "Total invoice value net of returns & discount",
            value: "₹58 Cr",
            target: "₹62 Cr",
            status: "warning",
            icon: "indian-rupee",
          },
          {
            id: "cat-K002",
            name: "Sales per Sq Ft",
            description: "Gross revenue per square foot of retail floor area",
            value: "₹1,280",
            target: "≥₹1,400",
            status: "warning",
            icon: "trending-up",
          },
          {
            id: "cat-K013",
            name: "ATS (Avg Ticket Size)",
            description: "Gross revenue per bill",
            value: "₹1,840",
            target: "≥₹2,000",
            status: "warning",
            icon: "shopping-bag",
          },
          {
            id: "cat-K004",
            name: "No. of Bills",
            description: "Total bills generated across category stores",
            value: "31.5 K",
            target: "≥34 K",
            status: "warning",
            icon: "layers",
          },
          {
            id: "cat-K005",
            name: "Gross Margin",
            description: "Product profitability on gross revenue",
            value: "44.2%",
            target: "≥45%",
            status: "warning",
            icon: "target",
          },
          {
            id: "cat-md",
            name: "Markdown%",
            description: "Revenue at markdown",
            value: "28%",
            target: "≤25%",
            status: "warning",
            icon: "tag",
          },
          {
            id: "cat-gmroi",
            name: "GMROI",
            description: "Gross margin ROI",
            value: "2.1x",
            target: "≥2.5x",
            status: "warning",
            icon: "target",
          },
        ],
        sections: [
          {
            type: "bars",
            title: "Fashion Pyramid Compliance",
            items: [
              {
                label: "Core (target ≥40%)",
                value: 35,
                max: 100,
                color: "bg-blue-500",
              },
              {
                label: "Essential (target ≥25%)",
                value: 27,
                max: 100,
                color: "bg-green-500",
              },
              {
                label: "Fashion (target ≤25%)",
                value: 28,
                max: 100,
                color: "bg-yellow-500",
              },
              {
                label: "Trend (target ≤10%)",
                value: 10,
                max: 100,
                color: "bg-red-500",
              },
            ],
          },
        ],
      },
      {
        id: "sell-through",
        name: "Sell-Through",
        icon: "shopping-bag",
        kpis: [
          {
            id: "cat-st15",
            name: "15-Day ST",
            description: "Sell-through within 15 days",
            value: "24%",
            target: "≥30%",
            status: "warning",
            icon: "zap",
          },
          {
            id: "cat-st45",
            name: "45-Day ST",
            description: "Sell-through within 45 days",
            value: "52%",
            target: "≥55%",
            status: "warning",
            icon: "trending-up",
          },
          {
            id: "cat-fp-st",
            name: "Full-Price ST",
            description: "Sold at full price",
            value: "61%",
            target: "≥65%",
            status: "warning",
            icon: "shopping-bag",
          },
          {
            id: "cat-ret",
            name: "Returns Rate",
            description: "Category return %",
            value: "14%",
            target: "≤15%",
            status: "on-track",
            icon: "trending-up",
          },
          {
            id: "cat-aged",
            name: "Aged Inv%",
            description: "Inventory >180 days",
            value: "18%",
            target: "≤15%",
            status: "critical",
            icon: "alert-triangle",
          },
          {
            id: "cat-avg-age",
            name: "Avg Age",
            description: "Average inventory age",
            value: "78 days",
            target: "≤75 days",
            status: "warning",
            icon: "clock",
          },
        ],
        sections: [
          {
            type: "tracker",
            title: "180-Day Lifecycle Tracker",
            phases: [
              {
                label: "0–30 days (Fresh)",
                count: 1240,
                color: "bg-green-500",
              },
              { label: "31–60 days", count: 890, color: "bg-green-400" },
              { label: "61–90 days", count: 720, color: "bg-yellow-400" },
              { label: "91–120 days", count: 540, color: "bg-yellow-500" },
              { label: "121–150 days", count: 380, color: "bg-orange-500" },
              { label: "151–180 days", count: 210, color: "bg-red-500" },
              { label: ">180 days (Aged)", count: 420, color: "bg-red-700" },
            ],
          },
        ],
      },
      {
        id: "range-otb",
        name: "Range & OTB",
        icon: "layers",
        kpis: [
          {
            id: "cat-otb",
            name: "OTB Utilization",
            description: "Budget consumed",
            value: "82%",
            target: "≤90%",
            status: "on-track",
            icon: "wallet",
          },
          {
            id: "cat-width",
            name: "Range Width",
            description: "Active options count",
            value: "1,840",
            target: "≤2,000",
            status: "on-track",
            icon: "layers",
          },
          {
            id: "cat-fresh",
            name: "Fresh %",
            description: "Inventory <90 days",
            value: "52%",
            target: "≥55%",
            status: "warning",
            icon: "zap",
          },
          {
            id: "cat-options",
            name: "New Options",
            description: "Options added this month",
            value: "124",
            target: "≥100",
            status: "on-track",
            icon: "sparkles",
          },
        ],
      },
      // {
      //   id: 'cat-store-health',
      //   name: 'Store Health',
      //   icon: 'heart',
      //   kpis: [
      //     { id: 'cat-K018', name: 'NPS', description: 'Promoters minus Detractors', value: '68', target: '≥75', status: 'critical', icon: 'heart' },
      //     { id: 'cat-K008', name: 'Conversion', description: 'Total bills out of total footfall', value: '14.5%', target: '≥15%', status: 'warning', icon: 'users' },
      //     { id: 'cat-K020', name: 'Ops Excellence Score', description: 'Weighted avg of BOC scores', value: '86%', target: '≥90%', status: 'warning', icon: 'target' },
      //     { id: 'cat-K029', name: 'Shrinkage', description: 'Physical inventory loss', value: '0.4%', target: '<0.3%', status: 'warning', icon: 'alert-triangle' },
      //   ],
      // },
      {
        id: "lifecycle",
        name: "Lifecycle",
        icon: "clock",
        kpis: [
          {
            id: "cat-md-trigger",
            name: "Markdown Triggers Pending",
            description: "Unactioned markdown triggers >24h",
            value: "7",
            target: "0",
            status: "critical",
            icon: "alert-triangle",
          },
          {
            id: "cat-topup",
            name: "In-Season Top-Up Release",
            description: "POs eligible for replenishment pending",
            value: "3",
            target: "0",
            status: "warning",
            icon: "package-check",
          },
          {
            id: "cat-options-aged45",
            name: "Options Cleared >45d",
            description: "Stage 3 options beyond 45 days",
            value: "18",
            target: "≤10",
            status: "critical",
            icon: "clock",
          },
          {
            id: "cat-liq",
            name: "Liquidation Rate",
            description: "Units moved to liquidation",
            value: "4.2%",
            target: "≤5%",
            status: "on-track",
            icon: "tag",
          },
          {
            id: "cat-cf",
            name: "Carry-Forward %",
            description: "Carried from last season",
            value: "22%",
            target: "≤20%",
            status: "warning",
            icon: "layers",
          },
        ],
        sections: [
          {
            type: "table",
            title: "Recent Agent Actions",
            headers: ["Agent", "Action", "SKUs", "Status", "Time"],
            rows: [
              [
                "Markdown Agent",
                "Auto-markdown on aged denim",
                45,
                "Completed",
                "2h ago",
              ],
              [
                "Replenishment Agent",
                "Reorder fast-selling kurtas",
                120,
                "Pending Approval",
                "4h ago",
              ],
              [
                "Allocation Agent",
                "Redistribute slow movers",
                88,
                "In Progress",
                "6h ago",
              ],
              [
                "Liquidation Agent",
                "Clear >180-day formal wear",
                32,
                "Completed",
                "1d ago",
              ],
            ],
          },
        ],
      },
    ],
  },

  // ─── Sourcing Director ──────────────────────────────────────────────
  {
    id: "sourcing",
    name: "Sourcing Director",
    subtitle: "PO-to-shelf, vendor management & fabric position",
    icon: "truck",
    config: {
      pages: [
        "/",
        "/sourcing",
        "/exceptions",
        "/agents",
        "/calendar",
        "/inventory",
        "/execute/allocation",
        "/execute/allocation/actions",
        "/control-tower",
        "/store-view",
        "/otb",
        "/showroom",
        "/buy-plans",
        "/range",
        "/range/performance",
        "/range/carryover",
        "/aop",
        "/docs",
      ],
      defaultFilters: {
        exceptionDomain: "MAKE",
        agentDomain: "Buy",
        calendarTab: "retail",
      },
      dashboardKpiIds: [
        "src-intake-margin",
        "src-ot",
        "src-fill-rate",
        "src-delayed",
        "src-sample",
        "src-rfid-comp",
      ],
      dashboardCards: ["po-pipeline", "vendor-risk", "inventory"],
    },
    tabs: [
      {
        id: "src-financial",
        name: "Margins & Compliance",
        icon: "indian-rupee",
        kpis: [
          {
            id: "src-intake-margin",
            name: "Intake Margin %",
            description: "Margin at time of goods receipt (MRP − Cost) / MRP",
            value: "49.2%",
            target: "≥50%",
            status: "warning",
            icon: "trending-up",
          },
          {
            id: "src-intake-compliance",
            name: "Intake Margin Compliance",
            description: "% of POs meeting target intake margin",
            value: "97%",
            target: "100%",
            status: "warning",
            icon: "target",
          },
          {
            id: "src-cost",
            name: "Cost Compliance",
            description: "Within negotiated cost",
            value: "97%",
            target: "≥95%",
            status: "on-track",
            icon: "indian-rupee",
          },
        ],
      },
      {
        id: "vendor-perf",
        name: "Vendor Performance",
        icon: "users",
        kpis: [
          {
            id: "src-ot",
            name: "On-Time %",
            description: "Vendor on-time delivery",
            value: "82%",
            target: "≥90%",
            status: "critical",
            icon: "clock",
          },
          {
            id: "src-fill-rate",
            name: "Fill Rate",
            description: "Orders fulfilled before cancellation as % of total",
            value: "87%",
            target: "≥95%",
            status: "critical",
            icon: "package-check",
          },
          {
            id: "src-otif",
            name: "Vendor OTIF",
            description: "On-Time In-Full delivery rate across vendors",
            value: "84%",
            target: "≥90%",
            status: "warning",
            icon: "truck",
          },
          {
            id: "src-rfid-comp",
            name: "RFID Compliance Rate",
            description: "POs with correct RFID tagging",
            value: "98.8%",
            target: "≥99.5%",
            status: "warning",
            icon: "package-check",
          },
          {
            id: "src-pbs",
            name: "Pack-by-Store Compliance",
            description: "POs with correct pack-by-store config",
            value: "98%",
            target: "100%",
            status: "warning",
            icon: "layers",
          },
          {
            id: "src-vendors",
            name: "Active Vendors",
            description: "Currently active vendors",
            value: "148",
            target: "≤160",
            status: "on-track",
            icon: "users",
          },
        ],
        sections: [
          {
            type: "table",
            title: "Top Vendor Scorecards",
            headers: ["Vendor", "On-Time", "Quality", "Cost", "Score"],
            rows: [
              ["Arvind Mills", "94%", "98%", "96%", "A+"],
              ["Raymond Group", "91%", "97%", "95%", "A"],
              ["Welspun India", "88%", "95%", "98%", "A"],
              ["Bombay Rayon", "78%", "92%", "94%", "B+"],
              ["Gokaldas Exports", "72%", "89%", "93%", "B"],
              ["Pearl Global", "68%", "86%", "91%", "B-"],
            ],
          },
        ],
      },
      {
        id: "po-pipeline",
        name: "PO Pipeline",
        icon: "package-check",
        kpis: [
          {
            id: "src-open",
            name: "Open POs",
            description: "Purchase orders in progress",
            value: "342",
            target: "≤400",
            status: "on-track",
            icon: "layers",
          },
          {
            id: "src-transit",
            name: "In-Transit",
            description: "POs in transit to warehouse",
            value: "89",
            target: "-",
            status: "on-track",
            icon: "truck",
          },
          {
            id: "src-delayed",
            name: "Delayed POs",
            description: "POs past expected date",
            value: "24",
            target: "≤15",
            status: "critical",
            icon: "alert-triangle",
          },
          {
            id: "src-shelf",
            name: "PO-to-Shelf",
            description: "Avg days PO to store",
            value: "32 days",
            target: "≤30 days",
            status: "warning",
            icon: "clock",
          },
          {
            id: "src-sample",
            name: "Sample Approval Rate",
            description: "Approved samples / total submitted",
            value: "64%",
            target: "≥70%",
            status: "warning",
            icon: "target",
          },
        ],
        sections: [
          {
            type: "bars",
            title: "PO Status Breakdown",
            items: [
              { label: "Placed", value: 120, max: 400, color: "bg-blue-500" },
              {
                label: "Confirmed",
                value: 98,
                max: 400,
                color: "bg-green-500",
              },
              {
                label: "In Production",
                value: 72,
                max: 400,
                color: "bg-yellow-500",
              },
              {
                label: "Quality Check",
                value: 28,
                max: 400,
                color: "bg-purple-500",
              },
              { label: "Shipped", value: 89, max: 400, color: "bg-primary" },
              { label: "Delayed", value: 24, max: 400, color: "bg-red-500" },
            ],
          },
        ],
      },
      {
        id: "fabric",
        name: "Fabric Position",
        icon: "layers",
        kpis: [
          {
            id: "src-fab-util",
            name: "Fabric Utilization",
            description: "Committed vs available",
            value: "78%",
            target: "≤85%",
            status: "on-track",
            icon: "layers",
          },
          {
            id: "src-fab-comm",
            name: "Committed Fabric",
            description: "Metres committed to POs",
            value: "2.4M m",
            target: "-",
            status: "on-track",
            icon: "target",
          },
          {
            id: "src-fab-avail",
            name: "Available Fabric",
            description: "Metres available to book",
            value: "680 K m",
            target: "≥500 K",
            status: "on-track",
            icon: "layers",
          },
          {
            id: "src-fab-risk",
            name: "At-Risk Fabric",
            description: "Ageing or expiring fabric",
            value: "120 K m",
            target: "≤100 K",
            status: "warning",
            icon: "alert-triangle",
          },
        ],
        sections: [
          {
            type: "bars",
            title: "Fabric Position by Type",
            items: [
              { label: "Cotton", value: 72, max: 100, color: "bg-blue-500" },
              {
                label: "Polyester Blend",
                value: 85,
                max: 100,
                color: "bg-yellow-500",
              },
              { label: "Denim", value: 64, max: 100, color: "bg-green-500" },
              { label: "Linen", value: 91, max: 100, color: "bg-red-500" },
              { label: "Viscose", value: 58, max: 100, color: "bg-purple-500" },
            ],
          },
        ],
      },
      {
        id: "quality",
        name: "Quality",
        icon: "target",
        kpis: [
          {
            id: "src-fpy",
            name: "First-Pass Yield",
            description: "Pass on first inspection",
            value: "91%",
            target: "≥95%",
            status: "warning",
            icon: "target",
          },
          {
            id: "src-defect",
            name: "Defect Rate",
            description: "Defective units %",
            value: "3.2%",
            target: "≤2%",
            status: "critical",
            icon: "alert-triangle",
          },
          {
            id: "src-audit",
            name: "Audit Compliance",
            description: "Factory audit pass rate",
            value: "96%",
            target: "≥95%",
            status: "on-track",
            icon: "target",
          },
          {
            id: "src-qual-pass",
            name: "Quality Pass Rate",
            description: "First-pass quality rate",
            value: "94%",
            target: "≥95%",
            status: "warning",
            icon: "target",
          },
        ],
      },
      {
        id: "src-logistics",
        name: "Logistics & RFID",
        icon: "truck",
        kpis: [
          {
            id: "src-dc-dwell",
            name: "DC Dwell Time",
            description: "Avg hours from DC receipt to dispatch",
            value: "28 hrs",
            target: "≤24 hrs",
            status: "warning",
            icon: "clock",
          },
          {
            id: "src-rfid-acc",
            name: "RFID Scan Accuracy",
            description: "RFID matched units / total scanned",
            value: "99.1%",
            target: "≥99.5%",
            status: "warning",
            icon: "package-check",
          },
          {
            id: "src-inv-latency",
            name: "Inventory Mirror Latency",
            description: "Gold table refresh latency",
            value: "180s",
            target: "≤120s",
            status: "warning",
            icon: "zap",
          },
          {
            id: "src-noos",
            name: "NOOS Stockout (All Stores)",
            description: "Total stores with NOOS at zero stock",
            value: "38",
            target: "0",
            status: "critical",
            icon: "alert-triangle",
          },
        ],
      },
    ],
  },

  // ─── Marketing Director ─────────────────────────────────────────────
  {
    id: "marketing",
    name: "Marketing Director",
    subtitle: "Campaign orchestration, ROAS & attribution",
    icon: "megaphone",
    config: {
      pages: [
        "/",
        "/exceptions",
        "/agents",
        "/control-tower",
        "/store-view",
        "/otb",
        "/showroom",
        "/buy-plans",
        "/range",
        "/range/performance",
        "/range/carryover",
        "/aop",
        "/docs",
      ],
      defaultFilters: {
        exceptionDomain: "MARKET",
        agentDomain: "Market",
        calendarTab: "marketing",
      },
      dashboardKpiIds: [
        "mkt-roas",
        "mkt-campaign-rev",
        "mkt-retention",
        "mkt-repeat",
      ],
      dashboardCards: ["campaign-dashboard", "channel-mix", "customer-health"],
    },
    tabs: [
      {
        id: "mkt-financial",
        name: "Financial",
        icon: "indian-rupee",
        kpis: [
          {
            id: "mkt-K001",
            name: "Gross Revenue (Retail)",
            description: "Total invoice value net of returns & discount",
            value: "₹698 Cr",
            target: "₹720 Cr",
            status: "warning",
            icon: "indian-rupee",
          },
          {
            id: "mkt-spend",
            name: "Marketing Spend",
            description: "Total marketing spend MTD",
            value: "₹9.7 Cr",
            target: "₹10 Cr",
            status: "on-track",
            icon: "wallet",
          },
          {
            id: "mkt-cost-pct",
            name: "Marketing Cost % Revenue",
            description: "Marketing spend as % of net revenue",
            value: "4.8%",
            target: "≤4%",
            status: "warning",
            icon: "trending-up",
          },
        ],
      },
      {
        id: "mkt-customer",
        name: "Customer",
        icon: "heart",
        kpis: [
          {
            id: "mkt-K018",
            name: "NPS (Net Promoter Score)",
            description: "Promoters minus Detractors",
            value: "66",
            target: "≥75",
            status: "critical",
            icon: "heart",
          },
          {
            id: "mkt-K019",
            name: "Customer Complaints TAT",
            description: "Avg days for resolution of customer complaints",
            value: "2.6 days",
            target: "≤3 days",
            status: "on-track",
            icon: "clock",
          },
          {
            id: "mkt-K154",
            name: "Customer Retention",
            description: "% of customers retained over measurement period",
            value: "72%",
            target: "≥78%",
            status: "warning",
            icon: "users",
          },
        ],
      },
      {
        id: "campaigns",
        name: "Campaigns",
        icon: "sparkles",
        kpis: [
          {
            id: "mkt-active",
            name: "Active Campaigns",
            description: "Currently running",
            value: "14",
            target: "-",
            status: "on-track",
            icon: "sparkles",
          },
          {
            id: "mkt-roas",
            name: "Blended ROAS",
            description: "Return on ad spend",
            value: "3.8x",
            target: "≥4.0x",
            status: "warning",
            icon: "trending-up",
          },
          {
            id: "mkt-rev",
            name: "Campaign Revenue",
            description: "Attributed revenue",
            value: "₹42 Cr",
            target: "₹48 Cr",
            status: "warning",
            icon: "indian-rupee",
          },
          {
            id: "mkt-conv",
            name: "Campaign Conversion",
            description: "Campaign impression to purchase",
            value: "3.2%",
            target: "≥3.5%",
            status: "warning",
            icon: "target",
          },
        ],
        sections: [
          {
            type: "table",
            title: "Channel ROAS Comparison",
            headers: ["Channel", "Spend", "Revenue", "ROAS", "Trend"],
            rows: [
              ["Meta Ads", "₹2.8 Cr", "₹12.6 Cr", "4.5x", "↑"],
              ["Google Ads", "₹3.2 Cr", "₹11.2 Cr", "3.5x", "→"],
              ["WhatsApp", "₹0.4 Cr", "₹2.8 Cr", "7.0x", "↑"],
              ["Influencer", "₹1.2 Cr", "₹4.2 Cr", "3.5x", "↓"],
              ["In-Store", "₹1.8 Cr", "₹8.1 Cr", "4.5x", "↑"],
              ["Email/SMS", "₹0.3 Cr", "₹3.1 Cr", "10.3x", "→"],
            ],
          },
        ],
      },
      {
        id: "channel-mix",
        name: "Channel Mix",
        icon: "layers",
        kpis: [
          {
            id: "mkt-store",
            name: "Store Revenue %",
            description: "In-store channel share",
            value: "68%",
            target: "-",
            status: "on-track",
            icon: "shopping-bag",
          },
          {
            id: "mkt-online",
            name: "Online %",
            description: "E-commerce channel share",
            value: "18%",
            target: "≥20%",
            status: "warning",
            icon: "trending-up",
          },
          {
            id: "mkt-mktplace",
            name: "Marketplace %",
            description: "Marketplace channel share",
            value: "11%",
            target: "-",
            status: "on-track",
            icon: "layers",
          },
          {
            id: "mkt-whatsapp",
            name: "WhatsApp %",
            description: "Social commerce share",
            value: "3%",
            target: "≥5%",
            status: "warning",
            icon: "zap",
          },
        ],
        sections: [
          {
            type: "table",
            title: "Campaign Status",
            headers: ["Campaign", "Channel", "Status", "Budget Used", "ROAS"],
            rows: [
              ["Summer Essentials", "Multi-channel", "Live", "62%", "4.2x"],
              ["Monsoon Preview", "Meta + Google", "Scheduled", "0%", "-"],
              ["Loyalty Week", "WhatsApp + Email", "Live", "78%", "6.8x"],
              ["New Store Launch", "In-Store + Local", "Live", "45%", "3.1x"],
              ["Flash Sale Fri", "Online", "Completed", "100%", "5.2x"],
            ],
          },
        ],
      },
      {
        id: "crm",
        name: "CRM",
        icon: "users",
        kpis: [
          {
            id: "mkt-crm-base",
            name: "CRM Base",
            description: "Active customer base",
            value: "4.2M",
            target: "≥4.5M",
            status: "warning",
            icon: "users",
          },
          {
            id: "mkt-loyalty",
            name: "Loyalty Members",
            description: "Enrolled in loyalty",
            value: "1.8M",
            target: "≥2M",
            status: "warning",
            icon: "heart",
          },
          {
            id: "mkt-repeat",
            name: "Repeat Purchase",
            description: "Repeat within 90 days",
            value: "28%",
            target: "≥30%",
            status: "warning",
            icon: "trending-up",
          },
          {
            id: "mkt-clv",
            name: "Avg CLV",
            description: "Customer lifetime value",
            value: "₹8,400",
            target: "≥₹9,000",
            status: "warning",
            icon: "indian-rupee",
          },
        ],
        sections: [
          {
            type: "table",
            title: "Audience Segments",
            headers: ["Segment", "Size", "Avg Spend", "Engagement", "Growth"],
            rows: [
              ["Premium Loyalists", "180 K", "₹14,200", "High", "+12%"],
              ["Regular Buyers", "920 K", "₹6,800", "Medium", "+5%"],
              ["Bargain Hunters", "1.4M", "₹3,200", "High", "+18%"],
              ["Lapsed (90d+)", "680 K", "₹4,100", "Low", "-8%"],
              ["New Customers", "420 K", "₹2,900", "Medium", "+22%"],
            ],
          },
        ],
      },
      {
        id: "content",
        name: "Content Pipeline",
        icon: "sparkles",
        kpis: [
          {
            id: "mkt-content",
            name: "Content Pieces",
            description: "Published this month",
            value: "142",
            target: "≥120",
            status: "on-track",
            icon: "sparkles",
          },
          {
            id: "mkt-engage",
            name: "Social Engagement",
            description: "Avg engagement rate",
            value: "4.8%",
            target: "≥4%",
            status: "on-track",
            icon: "heart",
          },
          {
            id: "mkt-influencer",
            name: "Influencer Collabs",
            description: "Active collaborations",
            value: "28",
            target: "≥25",
            status: "on-track",
            icon: "users",
          },
          {
            id: "mkt-content-roi",
            name: "Content ROI",
            description: "Revenue per content piece",
            value: "₹2.1 L",
            target: "≥₹2 L",
            status: "on-track",
            icon: "trending-up",
          },
        ],
      },
    ],
  },

  // ─── Regional Director ──────────────────────────────────────────────
  {
    id: "regional",
    name: "Regional Director",
    subtitle: "200+ stores, competition & VM compliance",
    icon: "map-pin",
    config: {
      pages: [
        "/",
        "/exceptions",
        "/inventory",
        "/execute/allocation",
        "/execute/allocation/actions",
        "/control-tower",
        "/store-view",
        "/otb",
        "/showroom",
        "/buy-plans",
        "/range",
        "/range/performance",
        "/range/carryover",
        "/aop",
        "/docs",
      ],
      defaultFilters: { exceptionDomain: "SELL", calendarTab: "store" },
      dashboardKpiIds: [
        "reg-K001",
        "reg-noos",
        "reg-fashion-ageing",
        "reg-size-comp",
        "reg-sell-through",
        "reg-ajio-sla",
      ],
      dashboardCards: ["store-ranking", "competition-alerts", "vm-compliance"],
    },
    tabs: [
      {
        id: "reg-financial",
        name: "Financial",
        icon: "indian-rupee",
        kpis: [
          {
            id: "reg-K001",
            name: "Gross Revenue (Retail)",
            description: "Total invoice value net of returns & discount",
            value: "₹148 Cr",
            target: "₹160 Cr",
            status: "warning",
            icon: "indian-rupee",
          },
          {
            id: "reg-K002",
            name: "Sales per Sq Ft",
            description: "Gross revenue per square foot",
            value: "₹1,240",
            target: "≥₹1,400",
            status: "warning",
            icon: "trending-up",
          },
          {
            id: "reg-K169",
            name: "EBITDA — F&L",
            description: "Revenue minus tax, COGS, operational costs",
            value: "7.8%",
            target: "≥9%",
            status: "critical",
            icon: "target",
          },
          {
            id: "reg-sell-through",
            name: "Sell-Through % Region",
            description: "Full-price sell-through across region stores",
            value: "62%",
            target: "≥65%",
            status: "warning",
            icon: "shopping-bag",
          },
          {
            id: "reg-noos",
            name: "Stores with NOOS Stockout",
            description: "Stores with NOOS options at zero stock",
            value: "12",
            target: "0",
            status: "critical",
            icon: "alert-triangle",
          },
          {
            id: "reg-fashion-ageing",
            name: "Stores with Fashion Ageing >35d",
            description: "Stores with fashion options aged beyond 35 days",
            value: "8",
            target: "0",
            status: "critical",
            icon: "clock",
          },
          {
            id: "reg-size-comp",
            name: "Avg Size Completeness",
            description: "Average size completeness across region",
            value: "89%",
            target: "≥95%",
            status: "warning",
            icon: "layers",
          },
          {
            id: "reg-ajio-sla",
            name: "Ajio SLA Compliance",
            description: "Ajio orders shipped within SLA across region",
            value: "88%",
            target: "≥95%",
            status: "warning",
            icon: "package-check",
          },
        ],
      },
      {
        id: "store-rankings",
        name: "Store Rankings",
        icon: "trending-up",
        kpis: [
          {
            id: "reg-top",
            name: "Top Performer",
            description: "Best store score",
            value: "94/100",
            target: "≥90",
            status: "on-track",
            icon: "trending-up",
          },
          {
            id: "reg-bottom",
            name: "Bottom Performer",
            description: "Worst store score",
            value: "42/100",
            target: "≥60",
            status: "critical",
            icon: "alert-triangle",
          },
          {
            id: "reg-rsf",
            name: "Avg Rev/Sqft",
            description: "Revenue per square foot",
            value: "₹1,240",
            target: "≥₹1,400",
            status: "warning",
            icon: "indian-rupee",
          },
          {
            id: "reg-stores",
            name: "Total Stores",
            description: "Stores under management",
            value: "209",
            target: "-",
            status: "on-track",
            icon: "shopping-bag",
          },
        ],
        sections: [
          {
            type: "table",
            title: "Store Rankings — Top & Bottom 5",
            headers: ["Rank", "Store", "City", "Score", "Rev/Sqft", "ST%"],
            rows: [
              ["#1", "Phoenix Palladium", "Mumbai", "94", "₹2,180", "82%"],
              ["#2", "Ambience Mall", "Gurgaon", "91", "₹1,960", "79%"],
              ["#3", "Inorbit Mall", "Hyderabad", "89", "₹1,840", "76%"],
              ["#4", "VR Mall", "Chennai", "88", "₹1,780", "74%"],
              ["#5", "Nexus Mall", "Bangalore", "87", "₹1,720", "73%"],
              ["—", "—", "—", "—", "—", "—"],
              ["#205", "City Center", "Ranchi", "48", "₹620", "38%"],
              ["#206", "Central Mall", "Bhopal", "46", "₹580", "35%"],
              ["#207", "Town Plaza", "Varanasi", "44", "₹540", "32%"],
              ["#208", "Metro Mall", "Patna", "43", "₹510", "31%"],
              ["#209", "Star Mall", "Lucknow", "42", "₹480", "28%"],
            ],
          },
        ],
      },
      {
        id: "competition",
        name: "Competition",
        icon: "target",
        kpis: [
          {
            id: "reg-price-gap",
            name: "Price Gap",
            description: "vs key competitors avg",
            value: "+4%",
            target: "≤±3%",
            status: "warning",
            icon: "indian-rupee",
          },
          {
            id: "reg-share",
            name: "Market Share",
            description: "Regional market share",
            value: "12.4%",
            target: "≥13%",
            status: "warning",
            icon: "target",
          },
          {
            id: "reg-comp-open",
            name: "New Openings",
            description: "Competitor stores nearby",
            value: "8",
            target: "-",
            status: "warning",
            icon: "alert-triangle",
          },
          {
            id: "reg-win",
            name: "Win Rate",
            description: "Price match wins",
            value: "72%",
            target: "≥75%",
            status: "warning",
            icon: "trending-up",
          },
        ],
        sections: [
          {
            type: "alerts",
            title: "Competitor Alert Feed",
            items: [
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
                text: "Max Fashion expanded kids section in 12 south stores",
                severity: "low",
                time: "2d ago",
              },
              {
                text: "FabIndia price reduction on linen range — 15% below our ASP",
                severity: "medium",
                time: "3d ago",
              },
            ],
          },
        ],
      },
      {
        id: "vm-compliance",
        name: "VM & Compliance",
        icon: "target",
        kpis: [
          {
            id: "reg-vm",
            name: "VM Score",
            description: "Visual merchandising avg",
            value: "78%",
            target: "≥85%",
            status: "warning",
            icon: "target",
          },
          {
            id: "reg-plano",
            name: "Planogram Compliance",
            description: "Stores following planogram",
            value: "72%",
            target: "≥80%",
            status: "critical",
            icon: "layers",
          },
          {
            id: "reg-sop",
            name: "SOP Adherence",
            description: "Standard operating procedures",
            value: "88%",
            target: "≥90%",
            status: "warning",
            icon: "target",
          },
          {
            id: "reg-audit",
            name: "Audit Score",
            description: "Last audit average",
            value: "82%",
            target: "≥85%",
            status: "warning",
            icon: "target",
          },
          {
            id: "reg-K020",
            name: "Ops Excellence Score",
            description: "Weighted avg of BOC scores",
            value: "82%",
            target: "≥90%",
            status: "warning",
            icon: "target",
          },
          {
            id: "reg-K029",
            name: "Shrinkage",
            description: "Physical inventory loss",
            value: "0.5%",
            target: "<0.3%",
            status: "critical",
            icon: "alert-triangle",
          },
        ],
        sections: [
          {
            type: "table",
            title: "VM Compliance by Cluster",
            headers: [
              "Cluster",
              "Stores",
              "VM Score",
              "Planogram",
              "SOP",
              "Status",
            ],
            rows: [
              ["West Metro", 42, "86%", "82%", "92%", "Good"],
              ["South Metro", 38, "82%", "78%", "90%", "Watch"],
              ["North Metro", 35, "78%", "74%", "88%", "Watch"],
              ["East Metro", 28, "74%", "68%", "85%", "At Risk"],
              ["Tier-2 West", 32, "72%", "66%", "82%", "At Risk"],
              ["Tier-2 South", 34, "70%", "64%", "80%", "Critical"],
            ],
          },
        ],
      },
    ],
  },

  // ─── Ops & Control Tower Lead ───────────────────────────────────────
  {
    id: "ops",
    name: "Ops & Control Tower Lead",
    subtitle: "Exception resolution, delivery SLA & infrastructure",
    icon: "settings",
    config: {
      pages: [
        "/",
        "/exceptions",
        "/agents",
        "/inventory",
        "/execute/allocation",
        "/execute/allocation/actions",
        "/control-tower",
        "/admin/guardrails",
        "/store-view",
        "/otb",
        "/showroom",
        "/buy-plans",
        "/range",
        "/range/performance",
        "/range/carryover",
        "/aop",
        "/docs",
      ],
      defaultFilters: {
        exceptionDomain: "all",
        agentDomain: "Move",
        calendarTab: "retail",
      },
      dashboardKpiIds: [
        "ops-noos",
        "ops-dc-dwell",
        "ops-otd",
        "ops-rfid-acc",
        "ops-inv-latency",
        "ops-stockout",
      ],
      dashboardCards: [
        "resolution-funnel",
        "delivery-sla",
        "agents",
        "systems",
      ],
    },
    tabs: [
      {
        id: "ops-overview",
        name: "Overview",
        icon: "activity",
        kpis: [
          {
            id: "ops-noos",
            name: "NOOS Stockout (All Stores)",
            description: "Stores with NOOS options at zero stock",
            value: "38",
            target: "0",
            status: "critical",
            icon: "alert-triangle",
          },
          {
            id: "ops-dc-dwell",
            name: "DC Dwell Time",
            description: "Avg cross-dock dwell hours",
            value: "28 hrs",
            target: "≤24 hrs",
            status: "warning",
            icon: "clock",
          },
          {
            id: "ops-rfid-acc",
            name: "RFID Scan Accuracy",
            description: "RFID matched vs total scanned",
            value: "99.1%",
            target: "≥99.5%",
            status: "warning",
            icon: "package-check",
          },
          {
            id: "ops-inv-latency",
            name: "Inventory Mirror Latency",
            description: "Gold table refresh latency",
            value: "180s",
            target: "≤120s",
            status: "warning",
            icon: "zap",
          },
        ],
      },
      {
        id: "ops-operations",
        name: "Operations",
        icon: "settings",
        kpis: [
          {
            id: "ops-K020",
            name: "Ops Excellence Score",
            description: "Weighted avg of BOC scores across stores",
            value: "84%",
            target: "≥90%",
            status: "warning",
            icon: "target",
          },
          {
            id: "ops-K029",
            name: "Shrinkage",
            description:
              "Net loss/gain in physical inventory from last stock take",
            value: "0.4%",
            target: "<0.3%",
            status: "warning",
            icon: "alert-triangle",
          },
          {
            id: "ops-fill-rate",
            name: "Fill Rate",
            description: "Orders fulfilled before cancellation as % of total",
            value: "94%",
            target: "≥95%",
            status: "warning",
            icon: "package-check",
          },
          {
            id: "ops-inv-acc",
            name: "Inventory Accuracy",
            description: "System vs physical",
            value: "95.7%",
            target: "≥95%",
            status: "on-track",
            icon: "package-check",
          },
        ],
      },
      {
        id: "delivery",
        name: "Delivery & Fulfillment",
        icon: "truck",
        kpis: [
          {
            id: "ops-otd",
            name: "On-Time Delivery",
            description: "Delivered within SLA",
            value: "91%",
            target: "≥95%",
            status: "warning",
            icon: "truck",
          },
          {
            id: "ops-fill",
            name: "Order Fill Rate",
            description: "Orders fully fulfilled",
            value: "94%",
            target: "≥97%",
            status: "warning",
            icon: "package-check",
          },
          {
            id: "ops-split",
            name: "Split Shipments",
            description: "% orders split across WH",
            value: "12%",
            target: "≤8%",
            status: "critical",
            icon: "layers",
          },
          {
            id: "ops-ret-proc",
            name: "Returns Processing",
            description: "Avg return processing days",
            value: "4.2 days",
            target: "≤3 days",
            status: "critical",
            icon: "clock",
          },
        ],
        sections: [
          {
            type: "bars",
            title: "Infrastructure Rollout",
            items: [
              {
                label: "WiFi (209 stores)",
                value: 187,
                max: 209,
                color: "bg-green-500",
              },
              {
                label: "CCTV Analytics",
                value: 142,
                max: 209,
                color: "bg-blue-500",
              },
              {
                label: "RFID Tags",
                value: 98,
                max: 209,
                color: "bg-yellow-500",
              },
              {
                label: "Scan & Go",
                value: 34,
                max: 209,
                color: "bg-purple-500",
              },
            ],
          },
        ],
      },
      {
        id: "inventory",
        name: "Inventory",
        icon: "package-check",
        kpis: [
          {
            id: "ops-stockout",
            name: "Stock-Out Rate",
            description: "SKUs out of stock",
            value: "3.4%",
            target: "≤3%",
            status: "warning",
            icon: "layers",
          },
          {
            id: "ops-excess",
            name: "Excess Stock %",
            description: "Inventory above max",
            value: "8.2%",
            target: "≤7%",
            status: "warning",
            icon: "package-check",
          },
          {
            id: "ops-in-transit",
            name: "Orders in Transit",
            description: "Shipments currently in movement",
            value: "342",
            target: "-",
            status: "on-track",
            icon: "truck",
          },
          {
            id: "ops-size-comp",
            name: "Size Completeness %",
            description: "Avg size completeness across stores",
            value: "91%",
            target: "≥95%",
            status: "warning",
            icon: "layers",
          },
        ],
      },
      {
        id: "customer-service",
        name: "Customer Service",
        icon: "heart",
        kpis: [
          {
            id: "ops-res-time",
            name: "Resolution Time",
            description: "Avg ticket resolution",
            value: "4.8 hrs",
            target: "≤4 hrs",
            status: "warning",
            icon: "clock",
          },
          {
            id: "ops-fcr",
            name: "First Contact Resolution",
            description: "Resolved on first contact",
            value: "72%",
            target: "≥80%",
            status: "warning",
            icon: "zap",
          },
          {
            id: "ops-esc",
            name: "Escalation Rate",
            description: "Tickets escalated",
            value: "18%",
            target: "≤12%",
            status: "critical",
            icon: "alert-triangle",
          },
          {
            id: "ops-csat",
            name: "CSAT",
            description: "Customer satisfaction",
            value: "4.1/5",
            target: "≥4.3",
            status: "warning",
            icon: "heart",
          },
        ],
        sections: [
          {
            type: "funnel",
            title: "Exception Resolution Funnel",
            steps: [
              { label: "Detected", value: 248, color: "bg-blue-500" },
              { label: "Triaged", value: 210, color: "bg-blue-400" },
              { label: "Agent Assigned", value: 186, color: "bg-yellow-500" },
              { label: "In Progress", value: 142, color: "bg-yellow-400" },
              { label: "Resolved", value: 118, color: "bg-green-500" },
              { label: "Escalated", value: 44, color: "bg-red-500" },
            ],
          },
        ],
      },
    ],
  },

  // ─── Category Director — Womens Wear ─────────────────────────────────
  {
    id: "category-director",
    name: "Category Director — Womens Wear",
    subtitle:
      "Design-to-sell-through lifecycle for Women Indian, Women Western & Lingerie",
    icon: "layers",
    config: {
      pages: [
        "/",
        "/category-director",
        "/calendar",
        "/inventory",
        "/exceptions",
        "/approvals",
        "/agents",
        "/store-view",
        "/otb",
        "/range",
        "/range/performance",
        "/range/carryover",
        "/aop",
        "/docs",
      ],
      defaultFilters: {
        exceptionDomain: "SELL",
        agentDomain: "Sell",
        calendarTab: "retail",
      },
      dashboardKpiIds: [
        "ww-K001",
        "ww-fp-st",
        "ww-K191",
        "ww-md-pending",
        "ww-otb",
        "ww-size-comp",
      ],
      dashboardCards: [
        "category-pnl",
        "fashion-pyramid",
        "option-lifecycle",
      ],
    },
    tabs: [
      {
        id: "ww-performance",
        name: "Category Performance",
        icon: "activity",
        kpis: [
          { id: "ww-K001", name: "Gross Revenue", description: "Womens Wear gross revenue", value: "₹116 Cr", target: "₹130 Cr", status: "warning", icon: "indian-rupee" },
          { id: "ww-K191", name: "Realised GM %", description: "Net of markdowns", value: "39.1%", target: "≥45%", status: "critical", icon: "trending-up" },
          { id: "ww-fp-st", name: "Full-Price ST %", description: "Units sold at full MRP", value: "58%", target: "≥65%", status: "warning", icon: "shopping-bag" },
          { id: "ww-gmroi", name: "GMROI", description: "Gross margin ROI", value: "1.8x", target: "≥2.5x", status: "critical", icon: "target" },
        ],
      },
      {
        id: "ww-sellthrough",
        name: "Sell-Through & Options",
        icon: "shopping-bag",
        kpis: [
          { id: "ww-st-season", name: "Season ST %", description: "Cumulative sell-through", value: "59%", target: "≥65%", status: "warning", icon: "shopping-bag" },
          { id: "ww-topup", name: "Top-Up Eligible", description: "Week 2 threshold met", value: "3", target: "0", status: "warning", icon: "alert-triangle" },
          { id: "ww-stage3", name: "MD Stage 3", description: "Options >45d in Stage 3", value: "8", target: "0", status: "warning", icon: "alert-triangle" },
        ],
      },
      {
        id: "ww-inventory",
        name: "Inventory & Lifecycle",
        icon: "package",
        kpis: [
          { id: "ww-doh", name: "Days on Hand", description: "Avg inventory age", value: "82 days", target: "≤75d", status: "warning", icon: "clock" },
          { id: "ww-aged", name: "Aged % >180d", description: "Beyond 180 days", value: "27%", target: "≤15%", status: "critical", icon: "alert-triangle" },
          { id: "ww-fresh", name: "Fresh % <30d", description: "Less than 30 days old", value: "43%", target: "≥55%", status: "critical", icon: "zap" },
        ],
      },
      {
        id: "ww-stores",
        name: "Store & Distribution",
        icon: "map-pin",
        kpis: [
          { id: "ww-stores-count", name: "Stores Carrying WW", description: "Stores stocking Womens Wear", value: "1,842 / 2,763", target: "-", status: "on-track", icon: "shopping-bag" },
          { id: "ww-right-stock", name: "Right-Stocked", description: "Meeting completeness", value: "1,240 / 1,842", target: "≥1,600", status: "warning", icon: "target" },
        ],
      },
      {
        id: "ww-supply",
        name: "Supply & OTB",
        icon: "truck",
        kpis: [
          { id: "ww-otb", name: "OTB Utilisation", description: "Committed vs budget", value: "78%", target: "85–100%", status: "warning", icon: "wallet" },
          { id: "ww-chase", name: "Chase Consumed", description: "Chase budget pace", value: "62%", target: "≤110%", status: "on-track", icon: "trending-up" },
        ],
      },
    ],
  },

  // ─── Admin — System Administrator ────────────────────────────────────
  {
    id: "admin",
    name: "System Administrator",
    subtitle:
      "Organization setup, roles, KPIs & exception engine configuration",
    icon: "shield-check",
    config: {
      pages: [
        "/admin",
        "/admin/organization",
        "/admin/roles",
        "/admin/groups",
        "/admin/kpis",
        "/admin/exceptions",
        "/admin/calendar",
        "/admin/inventory",
        "/admin/otb-config",
        "/admin/range-config",
        "/admin/aop-config",
        "/admin/mobile",
        "/admin/notifications",
        "/admin/audit-log",
        "/admin/transitions",
        "/admin/lifecycle",
        "/admin/fixtures",
        "/admin/store-grades",
        "/admin/space-planning",
        "/admin/store-intelligence",
        "/admin/showroom",
        "/admin/category-teams",
        "/admin/guardrails",
      ],
      defaultFilters: {},
      dashboardKpiIds: [],
      dashboardCards: ["config-health"],
    },
    tabs: [],
  },
];

export const personaMap: Record<PersonaId, Persona> = Object.fromEntries(
  personas.map((p) => [p.id, p]),
) as Record<PersonaId, Persona>;
