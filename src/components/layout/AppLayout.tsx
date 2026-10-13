import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastContainer } from "@/components/ui";
import { useAnalyticsIdentify } from "@/hooks/useAnalyticsIdentify";
import { usePersonaStore } from "@/hooks/usePersonaStore";
import { useSidebarStore } from "@/hooks/useSidebarStore";
import { useScreenConfig } from "@/hooks/useScreenConfig";
import { cn } from "@/lib/utils";

const routeTitles: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Dashboard", subtitle: "Agentic Command Center" },
  "/dashboard": { title: "Dashboard", subtitle: "Agentic Command Center" },
  "/exceptions": {
    title: "Exception Feed",
    subtitle: "Real-time cross-system exceptions",
  },
  "/approvals": {
    title: "Approval Queue",
    subtitle: "Pending approvals ranked by urgency",
  },
  "/agents": {
    title: "Agent Workforce",
    subtitle: "22 AI agents managing operations",
  },
  "/calendar": {
    title: "Calendar",
    subtitle: "Visual pipeline from range to selling",
  },
  "/trading": {
    title: "Trading Wall",
    subtitle: "Category performance and sell-through",
  },
  "/inventory": {
    title: "Inventory Command Center",
    subtitle: "Health, lifecycle, NOOS, markdown, supply pipeline",
  },
  "/inventory/actions": {
    title: "Allocation Actions",
    subtitle: "Transfer orders, allocation pipeline, rebalancing",
  },
  "/control-tower": {
    title: "Control Tower",
    subtitle: "Real-time KPI dashboard for 209 pilot stores",
  },
  "/working-capital": {
    title: "Working Capital",
    subtitle: "Inventory days, value-at-risk, interest cost",
  },
  "/category-teams": {
    title: "Category Teams",
    subtitle: "12 teams with three-strike tracking",
  },
  "/guardrails": {
    title: "Guardrails",
    subtitle: "16 hard + 6 soft guardrails & system health",
  },
  "/otb": { title: "OTB", subtitle: "Open-to-Buy management across pods" },
  "/otb/core-noos": { title: "OTB" },
  "/otb/fashion": { title: "OTB" },
  "/otb/utilization": { title: "OTB" },
  "/range": {
    title: "Range Architecture",
    subtitle: "Option plans, fixture mapping & price ladders",
  },
  "/range/performance": { title: "Range Architecture" },
  "/range/carryover": { title: "Range Architecture" },
  "/aop": {
    title: "AOP & Scenario Planning",
    subtitle: "Annual Operating Plan with bottom-up revenue targets",
  },
  "/aop/scenarios": { title: "AOP & Scenario Planning" },
  "/aop/compare": { title: "AOP & Scenario Planning" },
  "/aop/variance": { title: "AOP & Scenario Planning" },
  "/admin": {
    title: "Setup Progress",
    subtitle: "Organization onboarding & configuration",
  },
  "/admin/organization": {
    title: "Organization",
    subtitle: "Org hierarchy, business units & stores",
  },
  "/admin/roles": {
    title: "Role Configuration",
    subtitle: "Role permissions, scope & escalation",
  },
  "/admin/groups": {
    title: "Groups & Pods",
    subtitle: "Functional groups, product & operations pods",
  },
  "/admin/kpis": {
    title: "KPI Configuration",
    subtitle: "KPI groups, thresholds & calibration",
  },
  "/admin/exceptions": {
    title: "Exception Engine",
    subtitle: "Exception rules & routing configuration",
  },
  "/admin/mobile": {
    title: "Mobile Configuration",
    subtitle: "Mobile card builder & feature toggles",
  },
  "/admin/notifications": {
    title: "Notifications",
    subtitle: "Channels, schedule & templates",
  },
  "/admin/audit-log": {
    title: "Audit Log",
    subtitle: "Configuration change history",
  },
  "/admin/transitions": {
    title: "Role Transitions",
    subtitle: "Legacy-to-agentic role mapping & agent coverage",
  },
  "/admin/lifecycle": {
    title: "Lifecycle Management",
    subtitle:
      "Store closures, pod restructuring, user offboarding & KPI deprecation",
  },
  "/admin/store-grades": {
    title: "Store Grades",
    subtitle: "Store grade assignment & management",
  },
  "/admin/calendar": {
    title: "Calendar Configuration",
    subtitle:
      "N-Day milestones, exception thresholds, gates & sourcing engines",
  },
  "/admin/inventory": {
    title: "Inventory & A&R Configuration",
    subtitle:
      "Cover days, replenishment, pullback, redistribution, lifecycle & pipeline settings",
  },
  "/admin/range-config": {
    title: "Range Configuration",
    subtitle:
      "Range parameters, fashion splits, price ladders & carryover rules",
  },
  "/admin/aop-config": {
    title: "AOP Configuration",
    subtitle: "Planning parameters, margin targets & variance thresholds",
  },
};

export function AppLayout() {
  const location = useLocation();
  useAnalyticsIdentify();
  usePersonaStore(); // keep store initialized for role switcher
  useScreenConfig(); // fetch org config on every authenticated page
  const { isCollapsed } = useSidebarStore();
  const route = routeTitles[location.pathname] ||
    (location.pathname.startsWith("/otb/pod/") ? { title: "OTB" } : null) ||
    (location.pathname.startsWith("/range/store/")
      ? { title: "Range Architecture" }
      : null) ||
    (location.pathname.startsWith("/aop/store/")
      ? { title: "AOP & Scenario Planning" }
      : null) ||
    (location.pathname.startsWith("/aop/scenarios/")
      ? { title: "AOP & Scenario Planning" }
      : null) || { title: "Impetus" };

  const subtitle = route.subtitle;

  return (
    <div className="min-h-screen bg-gray-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-16 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "ml-16" : "ml-56",
        )}
      >
        <TopBar title={route.title} subtitle={subtitle} />
        <main id="main-content" className="px-6 py-5">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
        <ToastContainer />
      </div>
    </div>
  );
}
