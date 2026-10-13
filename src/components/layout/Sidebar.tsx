import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  Bot,
  Calendar,
  BarChart3,
  Package,
  Activity,
  Users,
  Shield,
  Settings,
  Building2,
  UserCog,
  Smartphone,
  Bell,
  FileText,
  GitMerge,
  RefreshCw,
  Store,
  Palette,
  ShoppingBag,
  LayoutGrid,
  Calculator,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Maximize2,
  Brain,
  Radar,
  BookOpen,
  TruckIcon,
  Ruler,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui";
import { usePersonaStore } from "@/hooks/usePersonaStore";
import { useSidebarStore } from "@/hooks/useSidebarStore";
import { useScreenConfig } from "@/hooks/useScreenConfig";
import { useAuthStore } from "@/hooks/useAuthStore";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
  disabled?: boolean;
  children?: { to: string; label: string }[];
  orgOnly?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Command",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/control-tower", icon: Activity, label: "Control Tower" },
      { to: "/agents", icon: Bot, label: "Agents" },
      {
        to: "/store-view",
        icon: Store,
        label: "Store View",
        end: true,
        children: [
          { to: "/store-view/category", label: "Category View" },
          { to: "/store-view/space", label: "Space Planning" },
        ],
      },
    ],
  },
  {
    label: "Intelligence",
    items: [{ to: "/store-view/intelligence", icon: Brain, label: "Overview" }],
  },
  {
    label: "Plan",
    items: [
      {
        to: "/sales-plan",
        icon: Calculator,
        label: "Sales Plan",
        orgOnly: "Superdry",
      },
      {
        to: "/otb",
        icon: ShoppingBag,
        label: "Open-to-Buy",
        children: [
          { to: '/otb/review', label: 'OTB Review' },
          // TODO: Re-enable when Core/NOOS, Fashion, Utilization views are built
          // { to: '/otb/core-noos', label: 'Core / NOOS' },
          // { to: '/otb/fashion', label: 'Fashion' },
          // { to: '/otb/utilization', label: 'Utilization' },
        ],
      },
      {
        to: "/range",
        icon: LayoutGrid,
        label: "Range Architecture",
        children: [
          { to: "/range/performance", label: "Performance" },
          { to: "/range/carryover", label: "Carryover" },
        ],
      },
      {
        to: "/showroom/brands",
        icon: Palette,
        label: "Design Showroom",
        end: true,
        children: [
          { to: "/showroom/brands", label: "Brands" },
          { to: "/showroom/discover", label: "Discover" },
          { to: "/showroom/curate", label: "Curate" },
          { to: "/showroom/progress", label: "Progress" },
        ],
      },
      { to: "/space-planning", icon: Ruler, label: "Space Planning" },
      {
        to: "/buy-plans",
        icon: Package,
        label: "Buy Plans",
        children: [
          { to: "/otb/exceptions", label: "Exception Queue" },
          { to: "/test-scale", label: "Test & Scale" },
        ],
      },
      { to: "/po-review", icon: FileCheck, label: "PO Review" }, // standalone CFO tab
      {
        to: "/distribution-plans",
        icon: TruckIcon,
        label: "Distribution Plan",
      },
    ],
  },
  {
    label: "Execute",
    items: [
      { to: "/calendar", icon: Calendar, label: "Calendar" },
      {
        to: "/inventory",
        icon: Package,
        label: "Inventory",
        end: true,
        children: [{ to: "/inventory/actions", label: "Allocation Actions" }],
      },
    ],
  },
  {
    label: "Docs",
    items: [{ to: "/docs/space-planning", icon: BookOpen, label: "Docs" }],
  },
];

const adminNavSections: NavSection[] = [
  {
    label: "User Management",
    items: [
      {
        to: "/admin",
        icon: LayoutDashboard,
        label: "Dashboard",
        disabled: true,
      },
      {
        to: "/admin/organization",
        icon: Building2,
        label: "Organization",
        disabled: true,
      },
      { to: "/admin/roles", icon: UserCog, label: "Roles", disabled: true },
      { to: "/admin/groups", icon: Users, label: "Groups", disabled: true },
      {
        to: "/admin/category-teams",
        icon: Users,
        label: "Category Teams",
        disabled: true,
      },
    ],
  },
  {
    label: "Modules",
    items: [
      {
        to: "/admin/store-intelligence",
        icon: Radar,
        label: "Store Intelligence",
        disabled: true,
      },
      {
        to: "/admin/space-planning",
        icon: Maximize2,
        label: "Space Planning",
        disabled: true,
      },
      {
        to: "/admin/store-grades",
        icon: Store,
        label: "Store Grades",
        disabled: true,
      },
      {
        to: "/admin/fixtures",
        icon: LayoutGrid,
        label: "Fixtures",
        disabled: true,
      },
      {
        to: "/admin/calendar",
        icon: Calendar,
        label: "Calendar",
        disabled: true,
      },
      { to: "/admin/inventory", icon: Package, label: "Inventory & A&R" },
      {
        to: "/admin/showroom",
        icon: Palette,
        label: "Showroom",
        disabled: true,
      },
      { to: "/admin/otb-config", icon: ShoppingBag, label: "OTB" },
      { to: "/admin/vmi-config", icon: TruckIcon, label: "VMI" },
      { to: "/admin/kpi-thresholds", icon: BarChart3, label: "KPI Thresholds" },
      {
        to: "/admin/range-config",
        icon: Settings2,
        label: "Range",
        disabled: true,
      },
      {
        to: "/admin/aop-config",
        icon: Calculator,
        label: "AOP",
        disabled: true,
      },
    ],
  },
  {
    label: "Platform",
    items: [
      { to: "/admin/kpis", icon: BarChart3, label: "KPIs", disabled: true },
      {
        to: "/admin/exceptions",
        icon: AlertTriangle,
        label: "Exceptions",
        disabled: true,
      },
      {
        to: "/admin/guardrails",
        icon: Shield,
        label: "Guardrails",
        disabled: true,
      },
      {
        to: "/admin/transitions",
        icon: GitMerge,
        label: "Transitions",
        disabled: true,
      },
      {
        to: "/admin/lifecycle",
        icon: RefreshCw,
        label: "Lifecycle",
        disabled: true,
      },
      {
        to: "/admin/notifications",
        icon: Bell,
        label: "Notifications",
        disabled: true,
      },
      {
        to: "/admin/mobile",
        icon: Smartphone,
        label: "Mobile",
        disabled: true,
      },
      {
        to: "/admin/audit-log",
        icon: FileText,
        label: "Audit Log",
        disabled: true,
      },
    ],
  },
];

const PATH_TO_MODULE: Record<string, string> = {
  "/": "dashboard",
  "/store-view": "store_view",
  "/store-view/intelligence": "store_view",
  "/otb": "otb",
  "/range": "range",
  "/buy-plans": "buy_plan",
  "/distribution-plans": "dp",
  "/showroom/brands": "design_studio",
  "/calendar": "calendar",
  "/inventory": "inventory",
  "/agents": "agents",
  "/control-tower": "exceptions",
  "/space-planning": "space_planning",
  "/docs/space-planning": "docs",
};

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { personaId, setPersona } = usePersonaStore();
  const organizations = useAuthStore((s) => s.organizations);
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const activeOrg = organizations.find((o) => o.orgId === activeOrgId);
  const activeOrgName = activeOrg?.orgName ?? '';
  const isAdmin =
    personaId === "admin" || location.pathname.startsWith("/admin");

  const { isCollapsed, setCollapsed } = useSidebarStore();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(() => {
    // All sections expanded by default
    const sections = isAdmin ? adminNavSections : navSections;
    return sections.reduce(
      (acc, section) => ({ ...acc, [section.label]: true }),
      {},
    );
  });
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  const screenConfig = useScreenConfig();

  const sections = isAdmin ? adminNavSections : navSections;

  const filteredSections = (screenConfig
    ? sections.map(section => ({
        ...section,
        items: section.items.filter(item => {
          const moduleKey = PATH_TO_MODULE[item.to];
          if (!moduleKey) return true;
          const mod = screenConfig.modules[moduleKey];
          return !mod || mod.enabled !== false;
        }),
      })).filter(s => s.items.length > 0)
    : sections
  ).map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.orgOnly && item.orgOnly.toLowerCase() !== activeOrgName.toLowerCase()) return false;
      return true;
    }),
  })).filter(s => s.items.length > 0);

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-300",
        isCollapsed ? "w-16" : "w-56",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b border-gray-100 p-3",
          isCollapsed ? "justify-center" : "justify-between",
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden",
              isAdmin ? "bg-gray-800" : "",
            )}
          >
            {isAdmin ? (
              <span className="text-white font-bold text-xs">AD</span>
            ) : (
              <img
                src="/favicon.png"
                alt="Impetus"
                className="w-8 h-8 object-contain"
              />
            )}
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-gray-900 text-sm">
              {isAdmin ? "Admin" : "Impetus"}
            </span>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="flex-1 overflow-y-auto py-3 px-2"
      >
        {filteredSections.map((section) => (
          <div key={section.label} className="mb-2">
            {/* Section header */}
            {!isCollapsed ? (
              <button
                onClick={() => toggleSection(section.label)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                aria-expanded={expandedSections[section.label]}
              >
                <span>{section.label}</span>
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200",
                    expandedSections[section.label] ? "" : "-rotate-90",
                  )}
                />
              </button>
            ) : (
              <div className="h-px bg-gray-100 mx-2 my-2" />
            )}

            {/* Section items */}
            <div
              className={cn(
                "space-y-0.5 overflow-hidden transition-all duration-200",
                !isCollapsed && !expandedSections[section.label]
                  ? "max-h-0"
                  : "max-h-[500px]",
              )}
            >
              {section.items.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isOnRoute =
                  location.pathname === item.to ||
                  location.pathname.startsWith(item.to + "/");
                const defaultOpen = item.to !== "/otb";
                const isExpanded =
                  hasChildren &&
                  (expandedItems[item.to] ?? (isOnRoute && defaultOpen));

                if (item.disabled) {
                  return (
                    <div key={item.to}>
                      {isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-3 rounded-lg w-10 h-10 justify-center mx-auto text-gray-400/60 cursor-not-allowed">
                              <item.icon className="w-5 h-5 flex-shrink-0" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {item.label} — Coming Soon
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-400/60 cursor-not-allowed select-none">
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm font-medium truncate flex-1 min-w-0">
                            {item.label}
                          </span>
                        </span>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={item.to}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink
                            to={item.to}
                            end={
                              item.end ||
                              item.to === "/" ||
                              item.to === "/admin"
                            }
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 rounded-lg transition-all duration-200",
                                "w-10 h-10 justify-center mx-auto",
                                isActive || (hasChildren && isOnRoute)
                                  ? "bg-primary/10 text-primary"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                              )
                            }
                          >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <NavLink
                        to={item.to}
                        end={
                          item.end || item.to === "/" || item.to === "/admin"
                        }
                        onClick={() => {
                          if (hasChildren) {
                            setExpandedItems((prev) => ({
                              ...prev,
                              [item.to]: !prev[item.to],
                            }));
                          }
                        }}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 rounded-lg transition-all duration-200",
                            "px-3 py-2",
                            isActive || (hasChildren && isOnRoute)
                              ? "bg-primary/10 text-primary"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                          )
                        }
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium truncate flex-1 min-w-0">
                          {item.label}
                        </span>
                        {hasChildren && (
                          <ChevronRight
                            className={cn(
                              "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
                              isExpanded
                                ? "rotate-90 text-primary/60"
                                : "text-gray-400",
                            )}
                          />
                        )}
                      </NavLink>
                    )}

                    {hasChildren && !isCollapsed && (
                      <div
                        className={cn(
                          "ml-[22px] border-l border-gray-200 overflow-hidden transition-all duration-200",
                          isExpanded
                            ? "max-h-48 py-0.5 opacity-100"
                            : "max-h-0 py-0 opacity-0",
                        )}
                      >
                        {item.children!.map((child) => (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            className={({ isActive }) =>
                              cn(
                                "block pl-4 py-1.5 text-xs font-medium transition-colors",
                                isActive
                                  ? "text-primary border-l-2 border-primary -ml-px"
                                  : "text-gray-500 hover:text-gray-700",
                              )
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 p-2">
        {isAdmin ? (
          isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    setPersona("ceo");
                    navigate("/");
                  }}
                  className="flex items-center gap-3 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 w-10 h-10 justify-center mx-auto"
                  aria-label="Back to App"
                >
                  <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Back to App</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => {
                setPersona("ceo");
                navigate("/");
              }}
              className="flex items-center gap-3 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 w-full px-3 py-2"
              aria-label="Back to App"
            >
              <ChevronLeft className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">Back to App</span>
            </button>
          )
        ) : isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  setPersona("admin");
                  navigate("/admin");
                }}
                className="flex items-center gap-3 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 w-10 h-10 justify-center mx-auto"
                aria-label="Admin Console"
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Admin</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={() => {
              setPersona("admin");
              navigate("/admin");
            }}
            className="flex items-center gap-3 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 w-full px-3 py-2"
            aria-label="Admin Console"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Admin</span>
          </button>
        )}

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="w-10 h-10 mx-auto mt-1 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
