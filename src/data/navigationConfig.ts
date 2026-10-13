import type { LucideIcon } from "lucide-react";
import environment from "@/environment";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  LayoutDashboard,
  // AlertTriangle,
  // CheckSquare,
  Bot,
  Calendar,
  BarChart3,
  Package,
  Activity,
  Users,
  Shield,
  Store,
  Palette,
  ShoppingBag,
  LayoutGrid,
  Calculator,
  Settings2,
  TrendingDown,
  TrendingUp,
  // Lightbulb,
  // MapPin,
  Swords,
  Cpu,
  ShoppingCart,
  Handshake,
  Factory,
  Box,
  Scissors,
  Layers,
  Receipt,
  Building2,
  Maximize2,
  FileText,
  GitMerge,
  RefreshCw,
  ClipboardList,
  Truck,
  TruckIcon,
  ScanLine,
  FileBox,
  Printer,
  CircleDollarSign,
  Warehouse,
  ListChecks,
  CalendarClock,
  FileCheck,
  Ticket,
  HeadphonesIcon,
  MessageSquare,
  BookOpen,
  Gem,
  Eye,
  Star,
  Megaphone,
  // Target, — commented out with Director Effectiveness
  Zap,
  PieChart,
  Grid3x3,
  ClipboardCheck,
  Shirt,
  FlaskConical,
  SwatchBook,
  TowerControl,
  Wand2,
  GitBranch,
} from "lucide-react";

// ─── External URL Config (per environment) ──────────────────────────────────

type EnvKey = "SIT" | "PROD";

const ENV_MAP: Record<string, EnvKey> = {
  ".impetusz0.de": "SIT",
  ".jioimpetus.com": "PROD",
};

const CURRENT_ENV: EnvKey = ENV_MAP[environment.SESSION_COOKIE_DOMAIN] ?? "SIT";

/**
 * Central registry of external URLs for all navigation items that open in a new tab.
 * Key = product or module ID, Value = full URL.
 * To update a URL, change it here — it will apply everywhere.
 */
const EXTERNAL_URLS: Record<EnvKey, Record<string, string>> = {
  SIT: {
    // L0 Products
    command: "",
    cortex: "",
    execute: "",
    nextwave: "",
    brain: "",
    "costing-engine": "https://platform.impetusz0.de/manager/brands",
    procuro: "https://platform.impetusz0.de/procuro/pr",
    uvp: "https://uvp.frontend.impetusz0.de/dashboard",
    intellimake: "https://scan-make.impetusz0.de/",
    intellipack: "https://scan-pack.impetusz0.de/",
    intellistore: "https://scan-recv.impetusz0.de/",
    pulsepoint: "https://storeops-app.impetusz0.de/",
    "digital-twin": "",
    intellitrim: "",
    intelliloom: "",
    intellimasters: "https://platform.impetusz0.de/masters",
    recon: "",
    analytics: "https://analytics.impetusz0.de/superset/welcome/",
    admin: "",
    plm: "https://xplm.jioimpetus.com/",

    // L1 Modules — PLM
    "plm-styles": "https://xplm.jioimpetus.com/",
    "plm-samples": "https://xplm.jioimpetus.com/samples",
    "plm-materials": "https://xplm.jioimpetus.com/materials",
    "plm-themes": "https://xplm.jioimpetus.com/",
    "plm-libraries": "https://xplm.jioimpetus.com/",
    "plm-create-ticket": "https://xplm.jioimpetus.com/",

    // L1 Modules — Command
    "command-dashboard": "",
    "command-control-tower": "",
    "command-exceptions": "",
    "command-approvals": "",
    "command-agents": "",

    // L1 Modules — Cortex
    "cortex-store-view": "",
    // 'cortex-store-360': '',
    "cortex-aop": "",
    "cortex-aop-planning": "",
    "cortex-otb": "",
    "cortex-range": "",
    "cortex-showroom": "",

    // L1 Modules — Execute
    "execute-retail-calendar": "",
    "execute-marketing-calendar": "",
    "execute-store-calendar": "",
    "execute-calendar": "",
    "execute-inventory": "",
    "execute-director-effectiveness": "",

    // L1 Modules — Nextwave
    "nextwave-social": "",
    "nextwave-expert": "",
    "nextwave-competitive": "",
    "nextwave-fashion-eye": "",
    "nextwave-ril": "",

    // L1 Modules — Costing Engine
    "ce-bulk-rfq": "https://platform.impetusz0.de/manager/brands",
    "ce-sample-rfq":
      "https://platform.impetusz0.de/manager/brands?type=sample_rfq",

    // L1 Modules — Procuro
    "procuro-purchasing": "",
    "procuro-requisition": "https://platform.impetusz0.de/procuro/pr",
    "procuro-orders": "https://platform.impetusz0.de/procuro/po",
    "procuro-otb": "https://platform.impetusz0.de/procuro/otb",

    // L1 Modules — UVP
    "uvp-range": "https://uvp.frontend.impetusz0.de/uvp/range-architecture",
    "uvp-odm": "https://uvp.frontend.impetusz0.de/uvp/odm",
    "uvp-size-set": "https://uvp.frontend.impetusz0.de/uvp/sizeRatioFile",

    // L1 Modules — Digital Twin
    "dt-planogram": "https://ai.dg2n.com/trends",
    "dt-space": "https://dg2n-layout3d-frontend.vercel.app/",

    // L1 Modules — IntelliTrim
    "it-declaration": "",
    "it-capacity": "",
    "it-orders": "",

    // L1 Modules — IntelliLoom
    "il-declaration": "",
    "il-capacity": "",
    "il-requisition": "",
    "il-orders": "",

    // L1 Modules — IntelliMasters
    "ims-operations": "",
    "ims-process-type": "",
    "ims-process-matrix": "",

    // L1 Modules — Recon
    "recon-vendors": "",
    "recon-confirmations": "",
    "recon-bcl": "",
    "recon-manage": "",
    "recon-dashboard": "",
    "recon-reconciliation": "",
    "recon-account": "",
    "recon-status": "",

    // L1 Modules — Analytics
    "analytics-dashboard": "https://analytics.impetusz0.de/superset/welcome/",
    "analytics-greige":
      "https://platform.impetusz0.de/analytics/fabric-reports/report-greige",
    "analytics-finish":
      "https://platform.impetusz0.de/analytics/fabric-reports/report-finish",

    // L1 Modules — Admin
    "admin-user-management": "",
    "admin-modules": "",
    "admin-platform": "",

    // L1 Modules — Pulsepoint
    "pp-tasks": "https://storeops-app.impetusz0.de/tasks?tab=4",
    "pp-schedule": "https://storeops-app.impetusz0.de/roster",
    "pp-store-doc": "https://storeops-app.impetusz0.de/dashboard",

    // L1 Modules — IntelliMake
    "im-home":
      "https://scan-make.impetusz0.de/scan-and-pack/home?page=1&activeTab=production_summary&page_size=25",
    "im-pre-production":
      "https://scan-make.impetusz0.de/scan-and-pack/pre-production-order-summary?page=1&activeTab=&page_size=25",
    "im-dpr":
      "https://scan-make.impetusz0.de/scan-and-pack/dpr?page=1&activeTab=option-level&page_size=25",

    // L1 Modules — IntelliPack
    "ip-order-summary":
      "https://scan-pack.impetusz0.de/scan-and-pack/order-summary?activeTab=pending&page=1&page_size=25",
    "ip-purchase-orders":
      "https://scan-pack.impetusz0.de/scan-and-pack/po-list?activeTab=in_process&page=1&page_size=25",
    "ip-lot":
      "https://scan-pack.impetusz0.de/scan-and-pack/asn?activeTab=draft&page=1&page_size=25",

    // L1 Modules — IntelliStore
    "is-inward":
      "https://scan-recv.impetusz0.de/scan-and-receive/grn?activeTab=overdue&page=1&page_size=50",
    "is-utility": "https://scan-recv.impetusz0.de/scan-and-receive/invoice",
    "is-reports":
      "https://scan-recv.impetusz0.de/scan-and-receive/reports/invoice-ledger?page=1&page_size=50",

    // Standalone / cross-cutting
    planning: "https://planning.impetusz0.de/",
    "store-utility": "https://scan-pack.impetusz0.de/invoice",
    "design-studio": "https://design-studio.impetusz0.de/",
    "shein-tutorial": "https://www.youtube.com/@SheinVendorUniversity",

    // External redirects
    gmetri: "",
    instadesk: "https://instadesk.impetusz0.de/tickets",
  },
  PROD: {
    // L0 Products
    command: "",
    cortex: "",
    execute: "",
    nextwave: "",
    brain: "",
    "costing-engine": "https://platform.jioimpetus.com/manager/brands",
    procuro: "https://platform.jioimpetus.com/procuro/pr",
    uvp: "https://uvp.frontend.jioimpetus.com/dashboard",
    intellimake: "https://scan-make.jioimpetus.com/",
    intellipack: "https://scan-pack.jioimpetus.com/",
    intellistore: "https://scan-recv.jioimpetus.com/",
    pulsepoint: "https://storeops-app.jioimpetus.com/",
    "digital-twin": "https://ai.dg2n.com/trends",
    intellitrim: "https://platform.jioimpetus.com/",
    intelliloom: "https://platform.jioimpetus.com/",
    intellimasters: "https://platform.jioimpetus.com/masters",
    recon: "https://platform.jioimpetus.com/",
    analytics: "https://analytics.jioimpetus.com/superset/welcome/",
    admin: "",
    plm: "https://xplm.jioimpetus.com/",

    // L1 Modules — PLM
    "plm-styles": "https://xplm.jioimpetus.com/",
    "plm-samples": "https://xplm.jioimpetus.com/samples",
    "plm-materials": "https://xplm.jioimpetus.com/materials",
    "plm-themes": "https://xplm.jioimpetus.com/",
    "plm-libraries": "https://xplm.jioimpetus.com/",
    "plm-create-ticket": "https://xplm.jioimpetus.com/",

    // L1 Modules — Command
    "command-dashboard": "",
    "command-control-tower": "",
    "command-exceptions": "",
    "command-approvals": "",
    "command-agents": "",

    // L1 Modules — Cortex
    "cortex-store-view": "",
    // 'cortex-store-360': '',
    "cortex-aop": "",
    "cortex-aop-planning": "",
    "cortex-otb": "",
    "cortex-range": "",
    "cortex-showroom": "",

    // L1 Modules — Execute
    "execute-retail-calendar": "",
    "execute-marketing-calendar": "",
    "execute-store-calendar": "",
    "execute-calendar": "",
    "execute-inventory": "",
    "execute-director-effectiveness": "",

    // L1 Modules — Nextwave
    "nextwave-social": "",
    "nextwave-expert": "",
    "nextwave-competitive": "",
    "nextwave-fashion-eye": "",
    "nextwave-ril": "",

    // L1 Modules — Costing Engine
    "ce-bulk-rfq": "https://platform.jioimpetus.com/manager/brands",
    "ce-sample-rfq":
      "https://platform.jioimpetus.com/manager/brands?type=sample_rfq",

    // L1 Modules — Procuro
    "procuro-purchasing": "",
    "procuro-requisition": "https://platform.jioimpetus.com/procuro/pr",
    "procuro-orders": "https://platform.jioimpetus.com/procuro/po",
    "procuro-otb": "https://platform.jioimpetus.com/procuro/otb",

    // L1 Modules — UVP
    "uvp-range": "https://uvp.frontend.jioimpetus.com/uvp/range-architecture",
    "uvp-odm": "https://uvp.frontend.jioimpetus.com/uvp/odm",
    "uvp-size-set": "https://uvp.frontend.jioimpetus.com/uvp/sizeRatioFile",

    // L1 Modules — Digital Twin
    "dt-planogram": "https://ai.dg2n.com/trends",
    "dt-space": "https://dg2n-layout3d-frontend.vercel.app/",

    // L1 Modules — IntelliTrim
    "it-declaration": "",
    "it-capacity": "",
    "it-orders": "",

    // L1 Modules — IntelliLoom
    "il-declaration": "",
    "il-capacity": "",
    "il-requisition": "",
    "il-orders": "",

    // L1 Modules — IntelliMasters
    "ims-operations": "",
    "ims-process-type": "",
    "ims-process-matrix": "",

    // L1 Modules — Recon
    "recon-vendors": "",
    "recon-confirmations": "",
    "recon-bcl": "",
    "recon-manage": "",
    "recon-dashboard": "",
    "recon-reconciliation": "",
    "recon-account": "",
    "recon-status": "",

    // L1 Modules — Analytics
    "analytics-dashboard": "https://analytics.jioimpetus.com/superset/welcome/",
    "analytics-greige":
      "https://platform.jioimpetus.com/analytics/fabric-reports/report-greige",
    "analytics-finish":
      "https://platform.jioimpetus.com/analytics/fabric-reports/report-finish",

    // L1 Modules — Admin
    "admin-user-management": "",
    "admin-modules": "",
    "admin-platform": "",

    // L1 Modules — Pulsepoint
    "pp-tasks": "https://storeops-app.jioimpetus.com/tasks?tab=4",
    "pp-schedule": "https://storeops-app.jioimpetus.com/roster",
    "pp-store-doc": "https://storeops-app.jioimpetus.com/dashboard",

    // L1 Modules — IntelliMake
    "im-home":
      "https://scan-make.jioimpetus.com/scan-and-pack/home?page=1&activeTab=production_summary&page_size=25",
    "im-pre-production":
      "https://scan-make.jioimpetus.com/scan-and-pack/pre-production-order-summary?page=1&activeTab=&page_size=25",
    "im-dpr":
      "https://scan-make.jioimpetus.com/scan-and-pack/dpr?page=1&activeTab=option-level&page_size=25",

    // L1 Modules — IntelliPack
    "ip-order-summary":
      "https://scan-pack.jioimpetus.com/scan-and-pack/order-summary?activeTab=pending&page=1&page_size=25",
    "ip-purchase-orders":
      "https://scan-pack.jioimpetus.com/scan-and-pack/po-list?activeTab=in_process&page=1&page_size=25",
    "ip-lot":
      "https://scan-pack.jioimpetus.com/scan-and-pack/asn?activeTab=draft&page=1&page_size=25",

    // L1 Modules — IntelliStore
    "is-inward":
      "https://scan-recv.jioimpetus.com/scan-and-receive/grn?activeTab=overdue&page=1&page_size=50",
    "is-utility": "https://scan-recv.jioimpetus.com/scan-and-receive/invoice",
    "is-reports":
      "https://scan-recv.jioimpetus.com/scan-and-receive/reports/invoice-ledger?page=1&page_size=50",

    // Standalone / cross-cutting
    planning: "https://planning.jioimpetus.com/",
    "store-utility": "https://scan-pack.jioimpetus.com/invoice",
    "design-studio": "https://design-studio.jioimpetus.com/",
    "shein-tutorial": "https://www.youtube.com/@SheinVendorUniversity",

    // External redirects
    gmetri: "https://ai.dg2n.com/trends",
    instadesk: "https://instadesk.jioimpetus.com/tickets",
  },
};

/** Resolve the external URL for a navigation item by its ID. */
export function getExternalUrl(id: string): string | undefined {
  return EXTERNAL_URLS[CURRENT_ENV]?.[id];
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface L2Feature {
  id: string;
  label: string;
  route: string;
  icon?: LucideIcon;
}

export interface L1Module {
  id: string;
  label: string;
  tooltip?: string;
  icon: LucideIcon;
  route: string;
  aliasRoutes?: string[];
  end?: boolean;
  disabled?: boolean;
  opensInNewTab?: boolean;
  externalUrl?: string;
  /** When true, surfaces a small amber BETA pill in nav UIs (sidebar, breadcrumb, drawer). */
  beta?: boolean;
  /** Restrict this module to specific org names (lowercase). When set, only visible for listed orgs. */
  visibleForOrgs?: string[];
  /** Optional section group label shown above this module in the L1 sidebar (e.g. "KNOWLEDGE"). First module with a group starts the section. */
  group?: string;
  l2Features?: L2Feature[];
}

export interface L0Product {
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
  opensInNewTab?: boolean;
  externalUrl?: string;
  defaultRoute: string;
  l1Modules: L1Module[];
  /** When true, the dark rail stays in L0 mode and L1 modules render in a white secondary sidebar (Granary Brain pattern). */
  useSubPanel?: boolean;
}

// ─── Products ───────────────────────────────────────────────────────────────

export const products: L0Product[] = [
  // ── L0-1: Command ─────────────────────────────────────────────────────────
  {
    id: "command",
    label: "Command",
    shortLabel: "CMD",
    icon: LayoutDashboard,
    description:
      "Agentic cockpit — dashboards, exceptions, approvals, control tower, AI workforce",
    defaultRoute: "/dashboard",
    l1Modules: [
      {
        id: "command-dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        route: "/dashboard",
        end: true,
      },
      {
        id: "command-control-tower",
        label: "Action Register",
        icon: TowerControl,
        route: "/review",
        beta: true,
      },
      {
        id: "command-aop",
        label: "AOP",
        icon: Calculator,
        route: "/command/aop",
        // Target + Variance are now one converged page (variance toggle) — no L2 sub-panel.
      },
      {
        id: "command-store-view",
        label: "Jarvis",
        icon: Store,
        route: "/command/store-view",
        end: true,
      },
      {
        id: "command-categories",
        label: "Categories",
        icon: Layers,
        route: "/categories",
        end: true,
      },
      // {
      //   id: 'command-agents',
      //   label: 'Agents',
      //   icon: Bot,
      //   route: '/agents',
      //   l2Features: [
      //     { id: 'command-agents-overview', label: 'Agent Overview', route: '/agents' },
      //     { id: 'command-agents-tier1', label: 'Tier 1 Orchestrators', route: '/agents?tier=1' },
      //     { id: 'command-agents-tier2', label: 'Tier 2 Process', route: '/agents?tier=2' },
      //     { id: 'command-agents-tier3', label: 'Tier 3 Exception', route: '/agents?tier=3' },
      //     { id: 'command-agents-performance', label: 'Performance & ROI', route: '/agents?view=performance' },
      //   ],
      // },
    ],
  },

  // ── L0-3: Cortex ──────────────────────────────────────────────────────────
  {
    id: "cortex",
    label: "Plan",
    shortLabel: "CTX",
    icon: Cpu,
    description:
      "Plan - AOP, OTB, Range Architecture, Buy Plan, Design Showroom",
    defaultRoute: "/otb",
    l1Modules: [
      {
        id: "cortex-store-view",
        label: "Store View",
        icon: Store,
        route: "/store-view",
        end: true,
      },
      // {
      //   id: 'cortex-store-360',
      //   label: 'Store 360',
      //   icon: Eye,
      //   route: '/store-360',
      //   end: true,
      // },
      {
        id: "cortex-aop-planning",
        label: "Sales Plan",
        icon: Calculator,
        route: "/sales-plan",
        end: false,
        visibleForOrgs: ["superdry"],
      },
      {
        id: "cortex-otb",
        label: "OTB",
        icon: ShoppingBag,
        route: "/otb",
        end: true,
        l2Features: [
          { id: "cortex-otb-review", label: "OTB Review", route: "/otb/review" },
          { id: "cortex-otb-exceptions", label: "Exception Queue", route: "/otb/exceptions" },
          // TODO: Re-enable when Core/NOOS, Fashion, Utilization views are built
          // { id: 'cortex-otb-core-noos', label: 'Core / NOOS', route: '/otb/core-noos' },
          // { id: 'cortex-otb-fashion', label: 'Fashion', route: '/otb/fashion' },
          // { id: 'cortex-otb-utilization', label: 'Utilization', route: '/otb/utilization' },
        ],
      },
      {
        id: "cortex-range",
        label: "Range Arch",
        icon: LayoutGrid,
        route: "/range",
        end: false,
      },
      {
        id: "cortex-buy-plan",
        label: "Buy Plan",
        icon: ShoppingCart,
        route: "/buy-plans?tab=category",
        end: true,
        l2Features: [
          { id: "cortex-buy-plan-test-scale", label: "Test & Scale", route: "/test-scale" },
        ],
      },
      {
        id: "cortex-po-review",
        label: "PO Review",
        icon: FileCheck,
        route: "/po-review",
        end: true,
      },
      {
        id: "cortex-distribution-plan",
        label: "DP",
        icon: TruckIcon,
        route: "/distribution-plans?tab=brand",
        end: true,
      },
      {
        id: "cortex-space-planning",
        label: "Space Planning",
        icon: Maximize2,
        route: "/space-planning",
        end: true,
      },
      {
        id: "cortex-planogram",
        label: "Planogram",
        icon: LayoutGrid,
        route: "/planogram",
        end: true,
      },
      {
        id: "cortex-showroom",
        label: "Design Showroom",
        icon: Palette,
        route: "/showroom/brands",
      },
      {
        id: "cortex-external-brands",
        label: "Catalog Buying",
        icon: Building2,
        route: "/external-brands",
        end: true,
        visibleForOrgs: ["superdry"],
      },
    ],
  },

  // ── L0-4: Execute ─────────────────────────────────────────────────────────
  {
    id: "execute",
    label: "Execute",
    shortLabel: "EXE",
    icon: Calendar,
    description:
      "Execute - Retail Calendar, Marketing Calendar, Store Calendar, Inventory",
    defaultRoute: "/inventory/actions",
    l1Modules: [
      {
        id: "execute-retail-calendar",
        label: "Retail Cal",
        icon: Calendar,
        route: "/execute/retail-calendar",
        l2Features: [
          {
            id: "execute-rc-aop",
            label: "AOP & OTB",
            route: "/execute/retail-calendar/aop-otb",
          },
          {
            id: "execute-rc-design",
            label: "Design & Range Planning",
            route: "/execute/retail-calendar/design",
          },
          {
            id: "execute-rc-buying",
            label: "Buying & Sourcing",
            route: "/execute/retail-calendar/buying",
          },
          {
            id: "execute-rc-allocation",
            label: "Allocation & Distribution",
            route: "/execute/retail-calendar/allocation",
          },
          {
            id: "execute-rc-sellthrough",
            label: "Sell-Through & Liquidation",
            route: "/execute/retail-calendar/sell-through",
          },
        ],
      },
      {
        id: "execute-marketing-calendar",
        label: "Mktg Cal",
        icon: Megaphone,
        route: "/execute/marketing-calendar",
        l2Features: [
          {
            id: "execute-mc-planning",
            label: "Campaign Planning",
            route: "/execute/marketing-calendar/planning",
          },
          {
            id: "execute-mc-active",
            label: "Active Campaigns",
            route: "/execute/marketing-calendar/active",
          },
          {
            id: "execute-mc-creative",
            label: "Creative Management",
            route: "/execute/marketing-calendar/creative",
          },
          {
            id: "execute-mc-performance",
            label: "Performance & Attribution",
            route: "/execute/marketing-calendar/performance",
          },
          {
            id: "execute-mc-audience",
            label: "Audience & Segments",
            route: "/execute/marketing-calendar/audience",
          },
        ],
      },
      {
        id: "execute-store-calendar",
        label: "Store Cal",
        icon: Store,
        route: "/execute/store-calendar",
        l2Features: [
          {
            id: "execute-sc-map",
            label: "Store Map",
            route: "/execute/store-calendar/map",
          },
          {
            id: "execute-sc-renovations",
            label: "Renovations",
            route: "/execute/store-calendar/renovations",
          },
          {
            id: "execute-sc-sops",
            label: "SOPs & Daily Operations",
            route: "/execute/store-calendar/sops",
          },
          {
            id: "execute-sc-compliance",
            label: "Compliance & Planogram",
            route: "/execute/store-calendar/compliance",
          },
          {
            id: "execute-sc-nps",
            label: "NPS & Feedback",
            route: "/execute/store-calendar/nps",
          },
          {
            id: "execute-sc-twin",
            label: "Digital Twin",
            route: "/execute/store-calendar/digital-twin",
          },
        ],
      },
      {
        id: "execute-calendar",
        label: "Calendar",
        icon: CalendarClock,
        route: "/calendar",
      },
      {
        id: "execute-inventory",
        label: "Inventory",
        icon: Package,
        route: "/inventory",
        end: true,
        l2Features: [
          {
            id: "execute-inventory-health",
            label: "Command Center",
            route: "/inventory",
          },
          {
            id: "execute-inventory-actions",
            label: "Allocation Actions",
            route: "/inventory/actions",
          },
          {
            id: "execute-inventory-replenishment",
            label: "Replenishment",
            route: "/inventory/replenishment",
          },
          {
            id: "execute-inventory-style-actions",
            label: "Style Actions",
            route: "/style-actions-product",
          },
          {
            id: "execute-inventory-vmi",
            label: "VMI",
            route: "/inventory/vmi",
          },
        ],
      },
      // {
      //   id: 'execute-director-effectiveness',
      //   label: 'Director Effectiveness',
      //   icon: Target,
      //   route: '/execute/director-effectiveness',
      //   l2Features: [
      //     { id: 'execute-de-leaderboard', label: 'Leaderboard', route: '/execute/director-effectiveness/leaderboard' },
      //     { id: 'execute-de-intent', label: 'Intent Clarity', route: '/execute/director-effectiveness/intent' },
      //     { id: 'execute-de-speed', label: 'Decision Speed', route: '/execute/director-effectiveness/speed' },
      //     { id: 'execute-de-override', label: 'Override Effectiveness', route: '/execute/director-effectiveness/override' },
      //     { id: 'execute-de-utilization', label: 'Agent Utilization', route: '/execute/director-effectiveness/utilization' },
      //   ],
      // },
    ],
  },

  // ── Style Action ────────────────────────────────────────────────────────
  {
    id: "style-actions",
    label: "Style Action",
    shortLabel: "SA",
    icon: Shirt,
    description: "Store style performance, lifecycle, space, and DC availability",
    defaultRoute: "/style-actions-product",
    l1Modules: [],
  },

  // ── L0-5: Impetus PLM (external) ──────────────────────────────────────────
  {
    id: "plm",
    label: "PLM",
    shortLabel: "PLM",
    icon: ClipboardCheck,
    description:
      "Product lifecycle management — styles, samples, materials, themes",
    opensInNewTab: true,
    externalUrl: getExternalUrl("plm"),
    defaultRoute: "/plm",
    l1Modules: [
      {
        id: "plm-styles",
        label: "Styles",
        icon: Shirt,
        route: "/plm/styles",
        opensInNewTab: true,
        externalUrl: getExternalUrl("plm-styles"),
      },
      {
        id: "plm-samples",
        label: "Samples",
        icon: FlaskConical,
        route: "/plm/samples",
        opensInNewTab: true,
        externalUrl: getExternalUrl("plm-samples"),
      },
      {
        id: "plm-materials",
        label: "Materials",
        icon: Layers,
        route: "/plm/materials",
        opensInNewTab: true,
        externalUrl: getExternalUrl("plm-materials"),
      },
      {
        id: "plm-themes",
        label: "Themes",
        icon: SwatchBook,
        route: "/plm/themes",
        opensInNewTab: true,
        externalUrl: getExternalUrl("plm-themes"),
      },
      {
        id: "plm-libraries",
        label: "Libraries",
        icon: BookOpen,
        route: "/plm/libraries",
        opensInNewTab: true,
        externalUrl: getExternalUrl("plm-libraries"),
      },
      {
        id: "plm-create-ticket",
        label: "Create Ticket",
        icon: Ticket,
        route: "/plm/create-ticket",
        opensInNewTab: true,
        externalUrl: getExternalUrl("plm-create-ticket"),
      },
    ],
  },

  // ── L0-6: Nextwave ────────────────────────────────────────────────────────
  {
    id: "nextwave",
    label: "Nextwave",
    shortLabel: "NW",
    icon: TrendingUp,
    description: "Fashion research & insights (social, competitive, expert)",
    defaultRoute: "/nextwave",
    l1Modules: [
      {
        id: "nextwave-social",
        label: "Social",
        icon: Zap,
        route: "/nextwave/social",
        l2Features: [
          {
            id: "nextwave-social-dashboard",
            label: "Dashboard",
            route: "/nextwave/social/dashboard",
          },
          {
            id: "nextwave-social-trends",
            label: "Trends Corner",
            route: "/nextwave/social/trends",
          },
          {
            id: "nextwave-social-celebrity",
            label: "Celebrity Corner",
            route: "/nextwave/social/celebrity",
          },
          {
            id: "nextwave-social-feedback",
            label: "Feedback",
            route: "/nextwave/social/feedback",
          },
        ],
      },
      {
        id: "nextwave-expert",
        label: "Expert",
        icon: Gem,
        route: "/nextwave/expert",
        l2Features: [
          {
            id: "nextwave-expert-ethnic",
            label: "Ethnic Wear (ICH)",
            route: "/nextwave/expert/ethnic",
          },
        ],
      },
      {
        id: "nextwave-competitive",
        label: "Competitive",
        icon: Swords,
        route: "/nextwave/competitive",
        l2Features: [
          {
            id: "nextwave-competitive-edited",
            label: "Edited",
            route: "/nextwave/competitive/edited",
          },
        ],
      },
      {
        id: "nextwave-fashion-eye",
        label: "Fashion Eye",
        icon: Eye,
        route: "/nextwave/fashion-eye",
        l2Features: [
          {
            id: "nextwave-fe-dashboard",
            label: "Dashboard",
            route: "/nextwave/fashion-eye/dashboard",
          },
          {
            id: "nextwave-fe-shared",
            label: "Shared With Me",
            route: "/nextwave/fashion-eye/shared",
          },
          {
            id: "nextwave-fe-uploads",
            label: "My Uploads",
            route: "/nextwave/fashion-eye/uploads",
          },
          {
            id: "nextwave-fe-regional",
            label: "Regional Trends",
            route: "/nextwave/fashion-eye/regional",
          },
        ],
      },
      {
        id: "nextwave-ril",
        label: "RIL F&L Trends",
        icon: Star,
        route: "/nextwave/ril",
        l2Features: [
          {
            id: "nextwave-ril-bestsellers",
            label: "Bestseller Products",
            route: "/nextwave/ril/bestsellers",
          },
          {
            id: "nextwave-ril-search-queries",
            label: "AJIO Search Queries",
            route: "/nextwave/ril/search-queries",
          },
          {
            id: "nextwave-ril-search-attributes",
            label: "AJIO Search Attributes",
            route: "/nextwave/ril/search-attributes",
          },
        ],
      },
    ],
  },

  // ── L0-6: Costing Engine ──────────────────────────────────────────────────
  {
    id: "costing-engine",
    label: "Costing Engine",
    shortLabel: "CE",
    icon: Calculator,
    description: "Garment costing, BOM, cost breakdowns",
    opensInNewTab: true,
    externalUrl: getExternalUrl("costing-engine"),
    defaultRoute: "/costing-engine",
    l1Modules: [
      {
        id: "ce-bulk-rfq",
        label: "Bulk RFQs",
        icon: ClipboardList,
        route: "/costing-engine/bulk-rfq",
        opensInNewTab: true,
        externalUrl: getExternalUrl("ce-bulk-rfq"),
        l2Features: [
          {
            id: "ce-bulk-manager",
            label: "Manager Bulk RFQ",
            route: "/costing-engine/bulk-rfq/manager",
          },
          {
            id: "ce-bulk-buyer",
            label: "Buyer Bulk RFQs",
            route: "/costing-engine/bulk-rfq/buyer",
          },
        ],
      },
      {
        id: "ce-sample-rfq",
        label: "Sample RFQs",
        icon: FileText,
        route: "/costing-engine/sample-rfq",
        opensInNewTab: true,
        externalUrl: getExternalUrl("ce-sample-rfq"),
        l2Features: [
          {
            id: "ce-sample-manager",
            label: "Manager Sample RFQ Forms",
            route: "/costing-engine/sample-rfq/manager",
          },
          {
            id: "ce-sample-buyer",
            label: "Buyer Sample RFQ Forms",
            route: "/costing-engine/sample-rfq/buyer",
          },
        ],
      },
    ],
  },

  // ── L0-7: Procuro ─────────────────────────────────────────────────────────
  {
    id: "procuro",
    label: "Procuro",
    shortLabel: "PR",
    icon: ShoppingCart,
    description:
      "Purchase Requisition, Purchase Orders, Open to Buy, Distribution Plans, Commercial Reports",
    opensInNewTab: true,
    externalUrl: getExternalUrl("procuro"),
    defaultRoute: "/procuro",
    l1Modules: [
      {
        id: "procuro-requisition",
        label: "PR",
        icon: ShoppingCart,
        route: "/procuro/purchasing/requisition",
        opensInNewTab: true,
        externalUrl: getExternalUrl("procuro-requisition"),
      },
      {
        id: "procuro-orders",
        label: "PO",
        icon: ShoppingCart,
        route: "/procuro/purchasing/orders",
        opensInNewTab: true,
        externalUrl: getExternalUrl("procuro-orders"),
      },
      {
        id: "procuro-otb",
        label: "OTB",
        icon: ShoppingCart,
        route: "/procuro/purchasing/otb",
        opensInNewTab: true,
        externalUrl: getExternalUrl("procuro-otb"),
      },
      {
        id: "procuro-distribution",
        label: "DP",
        icon: ShoppingCart,
        route: "/procuro/purchasing/distribution",
      },
      {
        id: "procuro-reports",
        label: "CR",
        icon: ShoppingCart,
        route: "/procuro/purchasing/reports",
      },
    ],
  },

  // ── L0-8: UVP ─────────────────────────────────────────────────────────────
  {
    id: "uvp",
    label: "UVP",
    shortLabel: "UVP",
    icon: Handshake,
    description: "Unified Vendor Portal — Range Architecture, ODM, Size Sets",
    opensInNewTab: true,
    externalUrl: getExternalUrl("uvp"),
    defaultRoute: "/uvp",
    l1Modules: [
      {
        id: "uvp-range",
        label: "Range Architecture",
        icon: LayoutGrid,
        route: "/uvp/range-architecture",
        opensInNewTab: true,
        externalUrl: getExternalUrl("uvp-range"),
      },
      {
        id: "uvp-odm",
        label: "ODM",
        icon: FileBox,
        route: "/uvp/odm",
        opensInNewTab: true,
        externalUrl: getExternalUrl("uvp-odm"),
      },
      {
        id: "uvp-size-set",
        label: "Size Set",
        icon: Grid3x3,
        route: "/uvp/size-set",
        opensInNewTab: true,
        externalUrl: getExternalUrl("uvp-size-set"),
      },
    ],
  },

  // ── L0-9: IntelliMake (new tab) ───────────────────────────────────────────
  {
    id: "intellimake",
    label: "IntelliMake",
    shortLabel: "IM",
    icon: Factory,
    description: "Manufacturing & production",
    opensInNewTab: true,
    externalUrl: getExternalUrl("intellimake"),
    defaultRoute: "/intellimake",
    l1Modules: [
      {
        id: "im-home",
        label: "Home",
        icon: Factory,
        route: "/intellimake",
        opensInNewTab: true,
        externalUrl: getExternalUrl("im-home"),
      },
      {
        id: "im-pre-production",
        label: "Pre-Prod",
        icon: ClipboardList,
        route: "/intellimake/pre-production",
        opensInNewTab: true,
        externalUrl: getExternalUrl("im-pre-production"),
      },
      {
        id: "im-dpr",
        label: "DPR",
        icon: FileText,
        route: "/intellimake/dpr",
        opensInNewTab: true,
        externalUrl: getExternalUrl("im-dpr"),
      },
      {
        id: "im-manufacturing",
        label: "Manufacturing Summary",
        icon: BarChart3,
        route: "/intellimake/manufacturing",
      },
      {
        id: "im-purchase-orders",
        label: "Purchase Orders",
        icon: ShoppingBag,
        route: "/intellimake/purchase-orders",
      },
      {
        id: "im-quality",
        label: "Quality Audits",
        icon: FileCheck,
        route: "/intellimake/quality",
      },
      {
        id: "im-capacity",
        label: "Capacity Planning",
        icon: CalendarClock,
        route: "/intellimake/capacity",
      },
      {
        id: "im-masters",
        label: "Masters",
        icon: Settings2,
        route: "/intellimake/masters",
      },
      {
        id: "im-reports",
        label: "Reports",
        icon: BarChart3,
        route: "/intellimake/reports",
      },
    ],
  },

  // ── L0-10: IntelliPack (new tab) ──────────────────────────────────────────
  {
    id: "intellipack",
    label: "IntelliPack",
    shortLabel: "IP",
    icon: Package,
    description: "Packing, QC & dispatch",
    opensInNewTab: true,
    externalUrl: getExternalUrl("intellipack"),
    defaultRoute: "/intellipack",
    l1Modules: [
      {
        id: "ip-order-summary",
        label: "Order Summary",
        icon: ClipboardList,
        route: "/intellipack/order-summary",
        opensInNewTab: true,
        externalUrl: getExternalUrl("ip-order-summary"),
      },
      {
        id: "ip-purchase-orders",
        label: "Purchase Orders",
        icon: ShoppingBag,
        route: "/intellipack/purchase-orders",
        opensInNewTab: true,
        externalUrl: getExternalUrl("ip-purchase-orders"),
      },
      {
        id: "ip-lot",
        label: "Lot",
        icon: Layers,
        route: "/intellipack/lot",
        opensInNewTab: true,
        externalUrl: getExternalUrl("ip-lot"),
      },
      {
        id: "ip-scan-pack",
        label: "Scan and Pack",
        icon: ScanLine,
        route: "/intellipack/scan-pack",
      },
      { id: "ip-asn", label: "ASN", icon: Truck, route: "/intellipack/asn" },
      { id: "ip-awb", label: "AWB", icon: FileText, route: "/intellipack/awb" },
      {
        id: "ip-manifest",
        label: "Manifest",
        icon: FileBox,
        route: "/intellipack/manifest",
      },
      {
        id: "ip-masters",
        label: "Masters",
        icon: Settings2,
        route: "/intellipack/masters",
      },
      {
        id: "ip-reports",
        label: "Reports",
        icon: BarChart3,
        route: "/intellipack/reports",
      },
      {
        id: "ip-penalty",
        label: "Penalty & Waiver",
        icon: CircleDollarSign,
        route: "/intellipack/penalty",
      },
      {
        id: "ip-print",
        label: "Print Utility",
        icon: Printer,
        route: "/intellipack/print",
      },
    ],
  },

  // ── L0-11: IntelliStore (new tab) ─────────────────────────────────────────
  {
    id: "intellistore",
    label: "IntelliStore",
    shortLabel: "IS",
    icon: Store,
    description: "Store inward & operations",
    opensInNewTab: true,
    externalUrl: getExternalUrl("intellistore"),
    defaultRoute: "/intellistore",
    l1Modules: [
      {
        id: "is-inward",
        label: "Inward Summary",
        icon: Warehouse,
        route: "/intellistore/inward",
        opensInNewTab: true,
        externalUrl: getExternalUrl("is-inward"),
      },
      {
        id: "is-utility",
        label: "Store Utility",
        icon: Settings2,
        route: "/intellistore/utility",
        opensInNewTab: true,
        externalUrl: getExternalUrl("is-utility"),
      },
      {
        id: "is-reports",
        label: "Reports",
        icon: BarChart3,
        route: "/intellistore/reports",
        opensInNewTab: true,
        externalUrl: getExternalUrl("is-reports"),
      },
    ],
  },

  // ── L0-12: Pulsepoint (new tab) ───────────────────────────────────────────
  {
    id: "pulsepoint",
    label: "Pulsepoint",
    shortLabel: "PP",
    icon: Activity,
    description: "Store management, tasks, scheduling",
    opensInNewTab: true,
    externalUrl: getExternalUrl("pulsepoint"),
    defaultRoute: "/pulsepoint",
    l1Modules: [
      {
        id: "pp-tasks",
        label: "Tasks",
        icon: ListChecks,
        route: "/pulsepoint/tasks",
        opensInNewTab: true,
        externalUrl: getExternalUrl("pp-tasks"),
        l2Features: [
          {
            id: "pp-tasks-dashboard",
            label: "Dashboard",
            route: "/pulsepoint/tasks/dashboard",
          },
          {
            id: "pp-tasks-reports",
            label: "Reports",
            route: "/pulsepoint/tasks/reports",
          },
          {
            id: "pp-tasks-surveys",
            label: "Surveys Templates",
            route: "/pulsepoint/tasks/surveys",
          },
          {
            id: "pp-tasks-list",
            label: "Tasks",
            route: "/pulsepoint/tasks/list",
          },
        ],
      },
      {
        id: "pp-schedule",
        label: "Schedule",
        icon: CalendarClock,
        route: "/pulsepoint/schedule",
        opensInNewTab: true,
        externalUrl: getExternalUrl("pp-schedule"),
        l2Features: [
          {
            id: "pp-schedule-dashboard",
            label: "Dashboard",
            route: "/pulsepoint/schedule/dashboard",
          },
        ],
      },
      {
        id: "pp-store-doc",
        label: "Store Doc",
        icon: FileText,
        route: "/pulsepoint/store-document",
        opensInNewTab: true,
        externalUrl: getExternalUrl("pp-store-doc"),
      },
      {
        id: "pp-tickets",
        label: "Tickets",
        icon: Ticket,
        route: "/pulsepoint/tickets",
      },
      {
        id: "pp-customer",
        label: "Customer Assistance",
        icon: HeadphonesIcon,
        route: "/pulsepoint/customer",
      },
      {
        id: "pp-so-message",
        label: "SO Message",
        icon: MessageSquare,
        route: "/pulsepoint/so-message",
      },
      {
        id: "pp-registers",
        label: "Digital Registers",
        icon: BookOpen,
        route: "/pulsepoint/registers",
      },
    ],
  },

  // ── L0-13: Digital Twin ───────────────────────────────────────────────────
  {
    id: "digital-twin",
    label: "Digital Twin",
    shortLabel: "DT",
    icon: Box,
    description: "Planogram, Space Planning",
    defaultRoute: "/digital-twin",
    l1Modules: [
      {
        id: "dt-planogram",
        label: "Planogram",
        icon: LayoutGrid,
        route: "/digital-twin/planogram",
        opensInNewTab: true,
        externalUrl: getExternalUrl("dt-planogram"),
      },
      {
        id: "dt-space",
        label: "Space Planning",
        icon: Maximize2,
        route: "/digital-twin/space",
        opensInNewTab: true,
        externalUrl: getExternalUrl("dt-space"),
      },
    ],
  },

  // ── L0-13b: Designs ────────────────────────────────────────────────────
  // DaaS is deployed independently and opens in its own tab.
  // The workflow and its UI stay in that repository.
  {
    id: "designs",
    label: "Design",
    shortLabel: "DSN",
    icon: Palette,
    description: "Design collections, moodboards & style reviews",
    defaultRoute: "/designs",
    opensInNewTab: true,
    externalUrl: environment.DESIGN_APP_URL,
    l1Modules: [{ id: "designs-collections", label: "Collections", icon: Palette, route: "/designs" }],
  },

  // ── L0-14: IntelliTrim ────────────────────────────────────────────────────
  {
    id: "intellitrim",
    label: "IntelliTrim",
    shortLabel: "IT",
    icon: Scissors,
    description: "Trim capacity & orders",
    defaultRoute: "/intellitrim",
    l1Modules: [
      {
        id: "it-declaration",
        label: "Cap Decl",
        icon: FileCheck,
        route: "/intellitrim/declaration",
      },
      {
        id: "it-capacity",
        label: "Capacity",
        icon: BarChart3,
        route: "/intellitrim/capacity",
      },
      {
        id: "it-orders",
        label: "Orders",
        icon: ShoppingBag,
        route: "/intellitrim/orders",
      },
    ],
  },

  // ── L0-15: IntelliLoom ────────────────────────────────────────────────────
  {
    id: "intelliloom",
    label: "IntelliLoom",
    shortLabel: "IL",
    icon: Layers,
    description: "Loom capacity & fabric orders",
    defaultRoute: "/intelliloom",
    l1Modules: [
      {
        id: "il-declaration",
        label: "Cap Decl",
        icon: FileCheck,
        route: "/intelliloom/declaration",
      },
      {
        id: "il-capacity",
        label: "Capacity",
        icon: BarChart3,
        route: "/intelliloom/capacity",
      },
      {
        id: "il-requisition",
        label: "Requisition",
        icon: FileText,
        route: "/intelliloom/requisition",
      },
      {
        id: "il-orders",
        label: "Greige & Finished Orders",
        icon: ShoppingBag,
        route: "/intelliloom/orders",
      },
    ],
  },

  // ── L0-16: Central Masters ────────────────────────────────────────────────
  {
    id: "intellimasters",
    label: "Central Masters",
    shortLabel: "CM",
    icon: Settings2,
    description: "Operations & process masters",
    opensInNewTab: true,
    externalUrl: getExternalUrl("intellimasters"),
    defaultRoute: "/intellimasters",
    l1Modules: [
      {
        id: "ims-operations",
        label: "Operations",
        icon: Settings2,
        route: "/intellimasters/operations",
        opensInNewTab: true,
        externalUrl: getExternalUrl("intellimasters"),
      },
      {
        id: "ims-process-type",
        label: "Process Type",
        icon: GitMerge,
        route: "/intellimasters/process-type",
        opensInNewTab: true,
        externalUrl: getExternalUrl("intellimasters"),
      },
      {
        id: "ims-process-matrix",
        label: "Process Matrix",
        icon: Grid3x3,
        route: "/intellimasters/process-matrix",
        opensInNewTab: true,
        externalUrl: getExternalUrl("intellimasters"),
      },
    ],
  },

  // ── L0-17: Recon ──────────────────────────────────────────────────────────
  {
    id: "recon",
    label: "Recon",
    shortLabel: "RCN",
    icon: Receipt,
    description: "Vendor payments & reconciliation",
    defaultRoute: "/recon",
    l1Modules: [
      {
        id: "recon-vendors",
        label: "Vendors",
        icon: Users,
        route: "/recon/vendors",
      },
      {
        id: "recon-confirmations",
        label: "Confirmations",
        icon: FileCheck,
        route: "/recon/confirmations",
      },
      {
        id: "recon-bcl",
        label: "BCL Status",
        icon: FileText,
        route: "/recon/bcl",
      },
      {
        id: "recon-manage",
        label: "Manage Reconciliation",
        icon: RefreshCw,
        route: "/recon/manage",
      },
      {
        id: "recon-dashboard",
        label: "Dashboard",
        icon: BarChart3,
        route: "/recon/dashboard",
      },
      {
        id: "recon-reconciliation",
        label: "Reconciliation",
        icon: CircleDollarSign,
        route: "/recon/reconciliation",
      },
      {
        id: "recon-account",
        label: "Manage Account",
        icon: Building2,
        route: "/recon/account",
      },
      {
        id: "recon-status",
        label: "Reconciliation Status",
        icon: Activity,
        route: "/recon/status",
      },
    ],
  },

  // ── L0-18: Analytics ──────────────────────────────────────────────────────
  {
    id: "analytics",
    label: "Analytics",
    shortLabel: "ANL",
    icon: BarChart3,
    description: "Costing & fabric reporting dashboards",
    opensInNewTab: true,
    externalUrl: getExternalUrl("analytics"),
    defaultRoute: "/analytics",
    l1Modules: [
      {
        id: "analytics-dashboard",
        label: "Dashboard",
        icon: PieChart,
        route: "/analytics/dashboard",
        opensInNewTab: true,
        externalUrl: getExternalUrl("analytics-dashboard"),
      },
      {
        id: "analytics-greige",
        label: "Greige",
        icon: BarChart3,
        route: "/analytics/greige",
        opensInNewTab: true,
        externalUrl: getExternalUrl("analytics-greige"),
      },
      {
        id: "analytics-finish",
        label: "Finish",
        icon: BarChart3,
        route: "/analytics/finish",
        opensInNewTab: true,
        externalUrl: getExternalUrl("analytics-finish"),
      },
    ],
  },

  // ── L0-19: Admin ──────────────────────────────────────────────────────────
  {
    id: "admin",
    label: "Admin",
    shortLabel: "ADM",
    icon: Shield,
    description: "User management, modules, platform settings",
    defaultRoute: "/admin",
    l1Modules: [
      {
        id: "admin-user-management",
        label: "User Management",
        icon: Users,
        route: "/admin",
        end: true,
        disabled: true,
        l2Features: [
          { id: "admin-um-dashboard", label: "Admin Panel", route: "/admin" },
          {
            id: "admin-um-org",
            label: "Organization",
            route: "/admin/organization",
          },
          { id: "admin-um-roles", label: "Roles", route: "/admin/roles" },
          { id: "admin-um-groups", label: "Groups", route: "/admin/groups" },
          {
            id: "admin-um-category-teams",
            label: "Category Teams",
            route: "/admin/category-teams",
          },
          {
            id: "admin-um-buying-access",
            label: "Buying Access",
            route: "/admin/buying-access",
          },
        ],
      },
      {
        id: "admin-modules",
        label: "Modules",
        icon: Settings2,
        route: "/admin/space-planning",
        l2Features: [
          {
            id: "admin-mod-space",
            label: "Space Planning",
            route: "/admin/space-planning",
          },
          {
            id: "admin-mod-anr",
            label: "AnR Config",
            route: "/admin/anr-config",
          },
          {
            id: "admin-mod-grades",
            label: "Store Grades",
            route: "/admin/store-grades",
          },
          {
            id: "admin-mod-fixtures",
            label: "Fixtures",
            route: "/admin/fixtures",
          },
          {
            id: "admin-mod-calendar",
            label: "Calendar",
            route: "/admin/calendar",
          },
          {
            id: "admin-mod-inventory",
            label: "Inventory",
            route: "/admin/inventory",
          },
          {
            id: "admin-mod-showroom",
            label: "Showroom",
            route: "/admin/showroom",
          },
          { id: "admin-mod-otb", label: "OTB", route: "/admin/otb-config" },
          { id: "admin-mod-vmi", label: "VMI", route: "/admin/vmi-config" },
          {
            id: "admin-mod-range",
            label: "Range",
            route: "/admin/range-config",
          },
          { id: "admin-mod-aop", label: "AOP", route: "/admin/aop-config" },
        ],
      },
      {
        id: "admin-platform",
        label: "Platform",
        tooltip: "Platform Configuration",
        icon: Settings2,
        route: "/admin/kpis",
        l2Features: [
          { id: "admin-pl-kpis", label: "KPIs", route: "/admin/kpis" },
          {
            id: "admin-pl-exceptions",
            label: "Exceptions",
            route: "/admin/exceptions",
          },
          {
            id: "admin-pl-guardrails",
            label: "Guardrails",
            route: "/admin/guardrails",
          },
          {
            id: "admin-pl-transitions",
            label: "Transitions",
            route: "/admin/transitions",
          },
          {
            id: "admin-pl-lifecycle",
            label: "Lifecycle",
            route: "/admin/lifecycle",
          },
          {
            id: "admin-pl-notifications",
            label: "Notifications",
            route: "/admin/notifications",
          },
          { id: "admin-pl-mobile", label: "Mobile", route: "/admin/mobile" },
          {
            id: "admin-pl-audit-log",
            label: "Audit Log",
            route: "/admin/audit-log",
          },
          {
            id: "admin-pl-extensions",
            label: "Extensions",
            route: "/admin/extensions",
          },
        ],
      },
    ],
  },

  // ── L0-20: GMetri (external) ────────────────────────────────────────────
  {
    id: "gmetri",
    label: "GMetri",
    shortLabel: "GM",
    icon: Box,
    description: "3D/VR platform — external integration",
    opensInNewTab: true,
    externalUrl: "#",
    defaultRoute: "#",
    l1Modules: [],
  },

  // ── L0-21: InstaDesk (external) ─────────────────────────────────────────
  {
    id: "instadesk",
    label: "InstaDesk",
    shortLabel: "ID",
    icon: HeadphonesIcon,
    description: "Support/helpdesk platform — external integration",
    opensInNewTab: true,
    externalUrl: getExternalUrl("instadesk") ?? "#",
    defaultRoute: getExternalUrl("instadesk") ?? "#",
    l1Modules: [],
  },
  // ── Jarvis ─────────────────────────────────────────────────────────────────
  {
    id: 'jarvis',
    label: 'Jarvis',
    shortLabel: 'JRV',
    icon: Eye,
    description: 'The Agentic Sense, Analyze, Act, Verify, Learn Loop for Retail',
    defaultRoute: '/command/store-view',
    l1Modules: [
      {
        id: 'jarvis-cx',
        label: 'CX',
        icon: Users,
        route: '/jarvis/customer-experience',
      },
      {
        id: 'jarvis-store-readiness',
        label: 'Store Readiness',
        icon: Store,
        route: '/jarvis/store-readiness',
        disabled: true,
      },
      {
        id: 'jarvis-churn',
        label: 'Churn Analysis',
        icon: TrendingDown,
        route: '/jarvis/churn-prediction',
        disabled: true,
      },
    ],
  },

  // ── L0: Agents (Agentic Brain) ──────────────────────────────────────────
  // ── L0: Brain (Agents + Knowledge merged) ───────────────────────────────────
  {
    id: "brain",
    label: "Brain",
    shortLabel: "BR",
    icon: Bot,
    description: "AI agents, knowledge base, workflows and automation",
    defaultRoute: "/agents-brain/chat",
    useSubPanel: true,
    l1Modules: [
      // Ungrouped top items
      {
        id: "ab-chat",
        label: "Ask AI",
        icon: MessageSquare,
        route: "/agents-brain/chat",
        end: true,
      },
      // KNOWLEDGE group
      {
        id: "kb-wiki",
        label: "Knowledge Base",
        icon: BookOpen,
        route: "/knowledge-base/wiki",
        end: true,
        group: "KNOWLEDGE",
      },
      {
        id: "ab-specs",
        label: "Specs",
        icon: FileText,
        route: "/agents-brain/specs",
        end: true,
      },
      {
        id: "kb-skills",
        label: "Capabilities",
        icon: Wand2,
        route: "/knowledge-base/skills",
        end: true,
      },
      // OPERATIONS group
      {
        id: "ab-virtual-team",
        label: "Operations",
        icon: Users,
        route: "/agents-brain/virtual-team",
        end: true,
        group: "OPERATIONS",
      },
      {
        id: "ab-workflows",
        label: "Workflows",
        icon: GitBranch,
        route: "/agents-brain/workflows",
        end: true,
      },
      {
        id: "ab-action-register",
        label: "Actions",
        icon: ClipboardCheck,
        route: "/agents-brain/action-register",
        end: true,
      },
    ],
  },
];

// ─── External Redirects (not in sidebar, open in new tab) ───────────────────

export interface ExternalRedirect {
  id: string;
  label: string;
  description: string;
  url: string;
}

export const externalRedirects: ExternalRedirect[] = [
  {
    id: "gmetri",
    label: "GMetri",
    description: "3D/VR platform — external integration",
    url: "#",
  },
  {
    id: "instadesk",
    label: "InstaDesk",
    description: "Support/helpdesk platform — external integration",
    url: getExternalUrl("instadesk") ?? "#",
  },
];

// ─── Sidebar visibility cutoff ──────────────────────────────────────────────
// Products shown directly in the L0 sidebar (the rest go under "More")

export const SIDEBAR_VISIBLE_COUNT = 6;

// ─── Active product filter ──────────────────────────────────────────────────
// Only these products are shown in the sidebar and console home.
// Other products are kept in the `products` array for routing but hidden from navigation.
// To show a product again, add its id to this set.

export const ACTIVE_PRODUCT_IDS = new Set([
  "command",
  "cortex",
  "execute",
  "style-actions",
  "plm",
  "jarvis",
  "agents-brain",
  "knowledge-base",
  "brain",
  "admin",
]);

// ─── Active module filter ───────────────────────────────────────────────────
// Per-product filter for which L1 modules are shown in the sidebar and console home.
// Products not listed here show ALL their modules (no filtering).
// To show a module again, add its id to the product's set.

export const ACTIVE_MODULE_IDS: Partial<Record<string, Set<string>>> = {
  execute: new Set(["execute-inventory"]),
};

/** Filter L1 modules to only active ones. Returns all modules if no filter is configured. */
export function getActiveModules(product: L0Product): L1Module[] {
  const filter = ACTIVE_MODULE_IDS[product.id];
  let modules = filter
    ? product.l1Modules.filter((m) => filter.has(m.id))
    : product.l1Modules;

  const { organizations, activeOrgId, user } = useAuthStore.getState();
  const org =
    organizations.find((o) => o.orgId === activeOrgId) ??
    user?.workspace.find((ws) => ws.orgId === activeOrgId);
  const orgName = org?.orgName?.trim().toLowerCase() ?? "";

  modules = modules.filter(
    (m) => !m.visibleForOrgs || m.visibleForOrgs.includes(orgName),
  );
  return modules;
}

// ─── Lookup helpers ─────────────────────────────────────────────────────────

/** Strip query string from a route definition for pathname comparison. */
function routePath(route: string): string {
  const idx = route.indexOf("?");
  return idx === -1 ? route : route.slice(0, idx);
}

export function getProductById(id: string): L0Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductByRoute(pathname: string): L0Product | undefined {
  // Direct-entry products own their routes even when another product links to them.
  const directProduct = products.find((product) =>
    product.l1Modules.length === 0 &&
    (pathname === product.defaultRoute || pathname.startsWith(product.defaultRoute + "/")),
  );
  if (directProduct) return directProduct;

  for (const product of products) {
    if (product.defaultRoute === pathname) return product;
    for (const l1 of product.l1Modules) {
      const l1Path = routePath(l1.route);
      if (l1Path === pathname) return product;
      if (pathname.startsWith(l1Path + "/")) return product;
      if (l1.aliasRoutes) {
        for (const alias of l1.aliasRoutes) {
          if (pathname === alias || pathname.startsWith(alias + "/"))
            return product;
        }
      }
      if (l1.l2Features) {
        for (const l2 of l1.l2Features) {
          const l2Path = routePath(l2.route);
          if (l2Path === pathname || pathname.startsWith(l2Path + "/"))
            return product;
        }
      }
    }
  }
  return undefined;
}

export function getProductDefaultRoute(product: L0Product): string {
  return product.defaultRoute;
}

export function getL1ModuleByRoute(
  product: L0Product,
  pathname: string,
): L1Module | undefined {
  // Pass 1: exact matches on l1 route, l2 route, or alias (highest priority)
  for (const l1 of product.l1Modules) {
    if (routePath(l1.route) === pathname) return l1;
    if (l1.aliasRoutes?.some((a) => pathname === a)) return l1;
    if (l1.l2Features) {
      for (const l2 of l1.l2Features) {
        if (routePath(l2.route) === pathname) return l1;
      }
    }
  }
  // Pass 2: prefix matches (only when no exact match found)
  for (const l1 of product.l1Modules) {
    const l1Path = routePath(l1.route);
    if (!l1.end && pathname.startsWith(l1Path + "/")) return l1;
    if (l1.aliasRoutes?.some((a) => pathname.startsWith(a + "/"))) return l1;
    if (l1.l2Features) {
      for (const l2 of l1.l2Features) {
        if (pathname.startsWith(routePath(l2.route) + "/")) return l1;
      }
    }
  }
  return undefined;
}
