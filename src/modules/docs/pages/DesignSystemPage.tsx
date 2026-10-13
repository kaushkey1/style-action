/* eslint-disable design-system/prefer-metric-grid, design-system/prefer-section-header -- documentation showcase page */
import {
  createContext,
  Fragment,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
  SectionHeader,
  Button,
  Badge,
  Input,
  Switch,
  Slider,
  Progress,
  CircularProgress,
  Spinner,
  MetricCard,
  MetricGrid,
  ListItemCard,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  EmptyState,
  Skeleton,
  Modal,
  ModalFooter,
  ConfirmDialog,
  BottomSheet,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  KpiLabel,
  FilterBar,
  FilterPills,
  FilterSelect,
  FilterSearch,
  FilterClear,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { RagStatus } from "@/lib/utils";
import {
  Alert,
  AlertIcon,
  AlertContent,
  AlertDescription,
  AlertAction,
} from "@/components/ui";
import {
  Search,
  Mail,
  Eye,
  AlertTriangle,
  CheckCircle,
  Package,
  TrendingUp,
  BarChart3,
  Users,
  Activity,
  Calendar,
  Settings2,
  ChevronDown,
  Copy,
  Inbox,
  ShoppingBag,
  Store,
  Bot,
  LayoutDashboard,
  Shield,
  Zap,
  Star,
  Heart,
  Bell,
  FileText,
  Layers,
  Globe,
  Lock,
  Trash2,
  Edit3,
  Monitor,
  Smartphone,
} from "lucide-react";

/**
 * Local discoverability cards — see `DesignSystemPage.local.tsx` (gitignored)
 * for sandbox/personal cards a developer wants to surface without committing.
 *
 * `import.meta.glob` returns `{}` when no matching file exists, so this is a
 * zero-impact no-op for any developer who hasn't created a local file.
 * Required `LocalDiscoverabilityCards` export shape: a React component that
 * renders one or more `<Link>` / card elements.
 */
type LocalCardModule = { LocalDiscoverabilityCards?: React.ComponentType };
const localCardModules = import.meta.glob<LocalCardModule>(
  "./DesignSystemPage.local.tsx",
  { eager: true },
);
const LocalCardComponents = Object.values(localCardModules)
  .map((m) => m.LocalDiscoverabilityCards)
  .filter((c): c is React.ComponentType => c != null);
// ─── Global Inspector (page-wide overlay state) ───────────────────────────

type InspectorKey = "anatomy" | "spacing" | "dimension" | "touch";
type InspectorState = Record<InspectorKey, boolean>;

const INSPECTOR_KEYS: InspectorKey[] = ["anatomy", "spacing", "dimension", "touch"];

const INSPECTOR_DESCRIPTIONS: Record<InspectorKey, string> = {
  anatomy: "Label the parts (icon, content, action…)",
  spacing: "Show Tailwind padding/gap utility values",
  dimension: "Show pixel width × height of the component",
  touch: "Outline interactive hit areas (≥44px on mobile)",
};

interface InspectorContextValue {
  state: InspectorState;
  setKey: (key: InspectorKey, value: boolean) => void;
  reset: () => void;
}

const InspectorContext = createContext<InspectorContextValue | null>(null);

function useInspector(): InspectorContextValue {
  const ctx = useContext(InspectorContext);
  // Safe fallback when a demo is rendered outside the provider (e.g. unit tests)
  return (
    ctx ?? {
      state: { anatomy: false, spacing: false, dimension: false, touch: false },
      setKey: () => {},
      reset: () => {},
    }
  );
}

function InspectorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InspectorState>({
    anatomy: false,
    spacing: false,
    dimension: false,
    touch: false,
  });
  const setKey = useCallback((key: InspectorKey, value: boolean) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);
  const reset = useCallback(() => {
    setState({ anatomy: false, spacing: false, dimension: false, touch: false });
  }, []);
  return (
    <InspectorContext.Provider value={{ state, setKey, reset }}>{children}</InspectorContext.Provider>
  );
}

function InspectorDropdown() {
  const { state, setKey, reset } = useInspector();
  const activeCount = INSPECTOR_KEYS.reduce((n, k) => n + (state[k] ? 1 : 0), 0);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5",
            activeCount > 0 && "border-primary text-primary-700 bg-primary-50 hover:bg-primary-100",
          )}
        >
          <Eye className="w-3.5 h-3.5" />
          Inspectors
          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex items-center justify-center min-w-5 h-5 px-1 text-[10px] font-semibold rounded-full bg-primary text-white">
              {activeCount}
            </span>
          )}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Component Inspectors</span>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={reset}
              className="text-[11px] font-normal text-gray-500 hover:text-gray-700 underline-offset-2 hover:underline"
            >
              Reset
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {INSPECTOR_KEYS.map((key) => (
          <DropdownMenuItem
            key={key}
            onSelect={(e) => {
              e.preventDefault();
              setKey(key, !state[key]);
            }}
            className="flex items-start gap-3 py-2"
          >
            <Switch
              checked={state[key]}
              onCheckedChange={(v) => setKey(key, v)}
              className="mt-0.5 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 capitalize">{key}</div>
              <div className="text-[11px] text-gray-500 leading-snug">{INSPECTOR_DESCRIPTIONS[key]}</div>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[10px] text-gray-400">
          Toggles overlay debug info on supported components.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Internal Helpers ──────────────────────────────────────────────────────

function ComponentDemo({
  title,
  description,
  children,
  controls,
  headerActions,
  propsTable,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  controls?: React.ReactNode;
  headerActions?: React.ReactNode;
  propsTable?: { name: string; type: string; default: string }[];
}) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {headerActions && <div className="shrink-0">{headerActions}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 flex flex-wrap items-center gap-3">
          {children}
        </div>
        {controls && <div className="mt-4 flex flex-wrap items-center gap-3">{controls}</div>}
        {propsTable && propsTable.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Prop</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Type</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Default</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {propsTable.map((row) => (
                  <tr key={row.name}>
                    <td className="px-3 py-2 font-mono text-primary">{row.name}</td>
                    <td className="px-3 py-2 text-gray-600 font-mono">{row.type}</td>
                    <td className="px-3 py-2 text-gray-500 font-mono">{row.default}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ControlPills<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-gray-500 min-w-[60px]">{label}:</span>
      <div className="flex gap-1 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "px-2.5 py-1 text-xs rounded-full border transition-colors",
              value === opt
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleControl({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
      <Switch checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  );
}

function ColorSwatch({ name, hex, className }: { name: string; hex: string; className: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button type="button" onClick={handleCopy} className="text-left group" aria-label={`Copy ${name} color: ${hex}`}>
      <div
        className={cn(
          "w-full h-12 rounded-lg border border-gray-200 mb-1.5 transition-transform group-hover:scale-105",
          className,
        )}
      />
      <p className="text-xs font-medium text-gray-700 truncate">{name}</p>
      <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
        {copied ? "Copied!" : hex}
        {!copied && <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity" />}
      </p>
    </button>
  );
}

function ViewportToggle({
  value,
  onChange,
}: {
  value: "desktop" | "mobile";
  onChange: (v: "desktop" | "mobile") => void;
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
      {[
        { key: "desktop" as const, Icon: Monitor, label: "Desktop" },
        { key: "mobile" as const, Icon: Smartphone, label: "Mobile" },
      ].map(({ key, Icon, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors",
            value === key ? "bg-primary text-white" : "bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50",
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Foundation Tab ────────────────────────────────────────────────────────

function FoundationSection() {
  const [typoView, setTypoView] = useState<"desktop" | "mobile">("desktop");
  const [spacingView, setSpacingView] = useState<"desktop" | "mobile">("desktop");
  const [radiusView, setRadiusView] = useState<"desktop" | "mobile">("desktop");

  const colorGroups = [
    {
      label: "Primary (Indigo)",
      colors: [
        { name: "50", hex: "#eef2ff", bg: "bg-primary-50" },
        { name: "100", hex: "#e0e7ff", bg: "bg-primary-100" },
        { name: "200", hex: "#c7d2fe", bg: "bg-primary-200" },
        { name: "300", hex: "#a5b4fc", bg: "bg-primary-300" },
        { name: "400", hex: "#818cf8", bg: "bg-primary-400" },
        { name: "500", hex: "#6366f1", bg: "bg-primary-500" },
        { name: "600", hex: "#4f46e5", bg: "bg-primary-600" },
        { name: "700", hex: "#4338ca", bg: "bg-primary-700" },
        { name: "800", hex: "#3730a3", bg: "bg-primary-800" },
        { name: "900", hex: "#312e81", bg: "bg-primary-900" },
      ],
    },
    {
      label: "Secondary (Orange)",
      colors: [
        { name: "50", hex: "#fff7ed", bg: "bg-secondary-50" },
        { name: "100", hex: "#ffedd5", bg: "bg-secondary-100" },
        { name: "200", hex: "#fed7aa", bg: "bg-secondary-200" },
        { name: "300", hex: "#fdba74", bg: "bg-secondary-300" },
        { name: "400", hex: "#fb923c", bg: "bg-secondary-400" },
        { name: "500", hex: "#F97316", bg: "bg-secondary-500" },
        { name: "600", hex: "#ea580c", bg: "bg-secondary-600" },
        { name: "700", hex: "#c2410c", bg: "bg-secondary-700" },
        { name: "800", hex: "#9a3412", bg: "bg-secondary-800" },
        { name: "900", hex: "#7c2d12", bg: "bg-secondary-900" },
      ],
    },
    {
      label: "Status",
      colors: [
        { name: "Success 50", hex: "#ecfdf5", bg: "bg-success-50" },
        { name: "Success 500", hex: "#10B981", bg: "bg-success-500" },
        { name: "Success 600", hex: "#059669", bg: "bg-success-600" },
        { name: "Warning 50", hex: "#fffbeb", bg: "bg-warning-50" },
        { name: "Warning 500", hex: "#F59E0B", bg: "bg-warning-500" },
        { name: "Warning 600", hex: "#d97706", bg: "bg-warning-600" },
        { name: "Error 50", hex: "#fef2f2", bg: "bg-error-50" },
        { name: "Error 500", hex: "#EF4444", bg: "bg-error-500" },
        { name: "Error 600", hex: "#dc2626", bg: "bg-error-600" },
      ],
    },
    {
      label: "Neutral (Gray)",
      colors: [
        { name: "50", hex: "#f9fafb", bg: "bg-gray-50" },
        { name: "100", hex: "#f3f4f6", bg: "bg-gray-100" },
        { name: "200", hex: "#e5e7eb", bg: "bg-gray-200" },
        { name: "300", hex: "#d1d5db", bg: "bg-gray-300" },
        { name: "400", hex: "#9ca3af", bg: "bg-gray-400" },
        { name: "500", hex: "#6b7280", bg: "bg-gray-500" },
        { name: "600", hex: "#4b5563", bg: "bg-gray-600" },
        { name: "700", hex: "#374151", bg: "bg-gray-700" },
        { name: "800", hex: "#1f2937", bg: "bg-gray-800" },
        { name: "900", hex: "#111827", bg: "bg-gray-900" },
      ],
    },
    {
      label: "Backgrounds & Surfaces",
      colors: [
        { name: "Page bg", hex: "#f9fafb", bg: "bg-gray-50" },
        { name: "Card bg", hex: "#ffffff", bg: "bg-white" },
        { name: "Header row", hex: "#f9fafb", bg: "bg-gray-50" },
        { name: "Hover", hex: "#f3f4f6", bg: "bg-gray-100" },
        { name: "Dark chrome", hex: "#141414", bg: "bg-[#141414]" },
        { name: "AI gradient", hex: "#eef2ff", bg: "bg-gradient-to-br from-indigo-50/60 to-white" },
      ],
    },
  ];

  const typographyScale = [
    { label: "text-2xl", className: "text-2xl", desc: "24px" },
    { label: "text-xl", className: "text-xl", desc: "20px" },
    { label: "text-lg", className: "text-lg", desc: "18px" },
    { label: "text-base", className: "text-base", desc: "16px" },
    { label: "text-sm", className: "text-sm", desc: "14px" },
    { label: "text-xs", className: "text-xs", desc: "12px" },
  ];

  const radiusScale = [
    { label: "rounded-sm", className: "rounded-sm", value: "0.125rem" },
    { label: "rounded-md", className: "rounded-md", value: "0.375rem" },
    { label: "rounded-lg", className: "rounded-lg", value: "0.5rem" },
    { label: "rounded-xl", className: "rounded-xl", value: "0.75rem" },
    { label: "rounded-2xl", className: "rounded-2xl", value: "1rem" },
    { label: "rounded-full", className: "rounded-full", value: "9999px" },
  ];

  const spacingScale = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];

  const iconSet = [
    { name: "LayoutDashboard", Icon: LayoutDashboard },
    { name: "AlertTriangle", Icon: AlertTriangle },
    { name: "CheckCircle", Icon: CheckCircle },
    { name: "Bot", Icon: Bot },
    { name: "Calendar", Icon: Calendar },
    { name: "BarChart3", Icon: BarChart3 },
    { name: "Package", Icon: Package },
    { name: "Activity", Icon: Activity },
    { name: "Users", Icon: Users },
    { name: "Shield", Icon: Shield },
    { name: "Store", Icon: Store },
    { name: "ShoppingBag", Icon: ShoppingBag },
    { name: "Settings2", Icon: Settings2 },
    { name: "TrendingUp", Icon: TrendingUp },
    { name: "Search", Icon: Search },
    { name: "Mail", Icon: Mail },
    { name: "Star", Icon: Star },
    { name: "Heart", Icon: Heart },
    { name: "Bell", Icon: Bell },
    { name: "FileText", Icon: FileText },
    { name: "Layers", Icon: Layers },
    { name: "Globe", Icon: Globe },
    { name: "Lock", Icon: Lock },
    { name: "Zap", Icon: Zap },
  ];

  return (
    <div className="space-y-8">
      {/* Local-only discoverability cards (e.g. Motion Lab) — auto-discovered
          from DesignSystemPage.local.tsx if present; renders nothing otherwise. */}
      {LocalCardComponents.map((Card, i) => (
        <Card key={i} />
      ))}

      {/* Colors */}
      <div>
        <SectionHeader title="Color Palette" subtitle="All colors defined as @theme tokens in index.css" />
        {colorGroups.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="text-xs font-semibold text-gray-700 mb-2">{group.label}</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2">
              {group.colors.map((c) => (
                <ColorSwatch key={c.name} name={c.name} hex={c.hex} className={c.bg} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Typography */}
      <div>
        <SectionHeader
          title="Typography"
          subtitle={
            typoView === "desktop"
              ? "Inter font family, semantic size scale"
              : "Mobile-first text scale — text-base on mobile to prevent iOS auto-zoom, scaled down on desktop"
          }
          actions={<ViewportToggle value={typoView} onChange={setTypoView} />}
        />
        <Card>
          <CardContent className="pt-4">
            {typoView === "desktop" ? (
              <div className="space-y-4">
                {typographyScale.map((t) => (
                  <div key={t.label} className="flex items-baseline gap-4 border-b border-gray-50 pb-3">
                    <code className="text-[10px] font-mono text-gray-400 w-20 shrink-0">{t.label}</code>
                    <span className="text-[10px] text-gray-400 w-10 shrink-0">{t.desc}</span>
                    <div className="flex flex-col gap-1">
                      <span className={cn(t.className, "font-normal text-gray-900")}>Regular {t.desc}</span>
                      <span className={cn(t.className, "font-medium text-gray-900")}>Medium {t.desc}</span>
                      <span className={cn(t.className, "font-semibold text-gray-900")}>Semibold {t.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Element</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Mobile</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Desktop</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Component</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        ["Form inputs", "text-base (16px)", "lg:text-sm (14px)", "Input"],
                        ["Select trigger (sm)", "text-base (16px)", "lg:text-xs (12px)", "SelectTrigger"],
                        ["Select trigger (md)", "text-base (16px)", "lg:text-sm (14px)", "SelectTrigger"],
                        ["Filter pills", "text-sm (14px)", "lg:text-xs (12px)", "FilterPills"],
                        ["Filter pill height", "min-h-9 (36px)", "lg:h-8 (32px)", "FilterPills"],
                        ["Pagination inputs", "text-base (16px)", "sm:text-xs (12px)", "Pagination"],
                        ["Bottom sheet title", "text-base (16px)", "—", "BottomSheet"],
                        ["Modal title", "text-lg (18px)", "text-lg (18px)", "Modal"],
                        ["Breadcrumb segments", "text-sm (14px)", "—", "MobileBreadcrumb"],
                        ["L2 chips", "text-sm (14px)", "—", "MobileL2Chips"],
                        ["Bottom bar labels", "text-[10px]", "—", "MobileBottomBar"],
                        ["Search overlay input", "text-base (16px)", "—", "MobileSearchOverlay"],
                      ].map(([element, mobile, desktop, component]) => (
                        <tr key={element}>
                          <td className="px-3 py-2 text-gray-900">{element}</td>
                          <td className="px-3 py-2 font-mono text-primary">{mobile}</td>
                          <td className="px-3 py-2 font-mono text-gray-600">{desktop}</td>
                          <td className="px-3 py-2 font-mono text-gray-500">{component}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs font-medium text-amber-800 mb-1">Do Not Scale</p>
                  <p className="text-xs text-amber-700">
                    These elements stay the same across breakpoints: <span className="font-mono">page titles</span>,{" "}
                    <span className="font-mono">card titles</span>, <span className="font-mono">KPI values</span>,{" "}
                    <span className="font-mono">badge text</span>.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Spacing */}
      <div>
        <SectionHeader
          title="Spacing Scale"
          subtitle={
            spacingView === "desktop"
              ? "Tailwind spacing units (1 unit = 4px)"
              : "Mobile spacing adjustments for tighter layouts"
          }
          actions={<ViewportToggle value={spacingView} onChange={setSpacingView} />}
        />
        <Card>
          <CardContent className="pt-4">
            {spacingView === "desktop" ? (
              <div className="space-y-2">
                {spacingScale.map((s) => (
                  <div key={s} className="flex items-center gap-3">
                    <code className="text-[10px] font-mono text-gray-400 w-16 shrink-0">gap-{s}</code>
                    <span className="text-[10px] text-gray-400 w-10 shrink-0">{s * 4}px</span>
                    {/* eslint-disable-next-line no-restricted-syntax -- dynamic width for spacing demo visualization */}
                    <div className="h-3 bg-primary/20 rounded" style={{ width: s * 4 }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Element</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Desktop</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Mobile</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ["Content horizontal padding", "px-6", "px-4", "All content areas, modals, bottom sheets"],
                      ["Modal header/footer", "px-6 py-4", "px-4 py-3", "Tighter on mobile"],
                      ["Bottom sheet content", "—", "px-4 pb-6 pb-safe", "Includes safe area padding"],
                      ["Drawer width", "—", "min(320px, 85vw)", "CSS min()"],
                      ["Card grid gaps", "gap-3", "gap-3", "Same on both — don\u2019t reduce"],
                    ].map(([element, desktop, mobile, notes]) => (
                      <tr key={element}>
                        <td className="px-3 py-2 text-gray-900">{element}</td>
                        <td className="px-3 py-2 font-mono text-gray-600">{desktop}</td>
                        <td className="px-3 py-2 font-mono text-primary">{mobile}</td>
                        <td className="px-3 py-2 text-gray-500">{notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Border Radius */}
      <div>
        <SectionHeader
          title="Border Radius"
          subtitle={
            radiusView === "desktop"
              ? "Standard radius tokens"
              : "Mobile-specific radius tokens for bottom sheets and FAB"
          }
          actions={<ViewportToggle value={radiusView} onChange={setRadiusView} />}
        />
        <Card>
          <CardContent className="pt-4">
            {radiusView === "desktop" ? (
              <div className="flex flex-wrap gap-4">
                {radiusScale.map((r) => (
                  <div key={r.label} className="text-center">
                    <div className={cn("w-16 h-16 bg-primary/10 border-2 border-primary/30", r.className)} />
                    <code className="text-[10px] font-mono text-gray-500 mt-1 block">{r.label}</code>
                    <span className="text-[10px] text-gray-400">{r.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Pattern</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Usage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        ["rounded-lg", "Cards, buttons, inputs, modals (same as desktop)"],
                        ["rounded-2xl", "FAB only (mobile floating action button)"],
                        ["rounded-t-3xl", "Bottom sheets and mobile modal bottom-sheet variant"],
                        ["rounded-full", "Badges, pills, L2 chips (same as desktop)"],
                      ].map(([pattern, usage]) => (
                        <tr key={pattern}>
                          <td className="px-3 py-2 font-mono text-primary">{pattern}</td>
                          <td className="px-3 py-2 text-gray-600">{usage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-xs text-amber-700">
                    Do NOT use <span className="font-mono">rounded-xl</span> or larger for standard components. Only{" "}
                    <span className="font-mono">rounded-2xl</span> (FAB) and{" "}
                    <span className="font-mono">rounded-t-3xl</span> (bottom sheets) are justified exceptions.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Icons */}
      <div>
        <SectionHeader title="Icon Library" subtitle="Lucide React icons — standard sizes: w-3, w-4, w-5, w-8, w-12" />
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
              {iconSet.map(({ name, Icon }) => (
                <div
                  key={name}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Icon className="w-5 h-5 text-gray-700" />
                  <span className="text-[10px] text-gray-500 text-center leading-tight">{name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakpoints */}
      <div>
        <SectionHeader title="Breakpoints" subtitle="Responsive breakpoint tiers and detection hooks" />
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Tier</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Range</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Prefix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-3 py-2 text-gray-900">Mobile</td>
                    <td className="px-3 py-2 font-mono text-primary">0 – 767px</td>
                    <td className="px-3 py-2 font-mono text-gray-600">(default)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-gray-900">Tablet</td>
                    <td className="px-3 py-2 font-mono text-primary">768 – 1023px</td>
                    <td className="px-3 py-2 font-mono text-gray-600">md:</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-gray-900">Desktop</td>
                    <td className="px-3 py-2 font-mono text-primary">1024px+</td>
                    <td className="px-3 py-2 font-mono text-gray-600">lg:</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto">
              <p className="text-xs font-medium text-gray-700 mb-2">Detection Hooks</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Hook</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">File</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-3 py-2 font-mono text-primary">useIsMobile()</td>
                    <td className="px-3 py-2 font-mono text-gray-500">useMediaQuery.ts</td>
                    <td className="px-3 py-2 text-gray-600">True below 768px</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-primary">useIsTablet()</td>
                    <td className="px-3 py-2 font-mono text-gray-500">useMediaQuery.ts</td>
                    <td className="px-3 py-2 text-gray-600">True 768–1023px</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Common Patterns</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  ["hidden lg:flex", "Desktop-only element"],
                  ["lg:hidden", "Mobile-only element"],
                  ["text-base lg:text-sm", "iOS zoom-safe input text"],
                  ["lg:ml-[76px]", "Sidebar margin on desktop"],
                ].map(([code, desc]) => (
                  <div
                    key={code}
                    className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2"
                  >
                    <code className="text-xs font-mono text-primary">{code}</code>
                    <span className="text-xs text-gray-500">— {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Safe Area Insets */}
      <div>
        <SectionHeader
          title="Safe Area Insets"
          subtitle="CSS utilities for notched and rounded-corner devices (env(safe-area-inset-*))"
        />
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Utility</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">CSS Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-3 py-2 font-mono text-primary">pb-safe</td>
                    <td className="px-3 py-2 font-mono text-gray-600">padding-bottom: env(safe-area-inset-bottom)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-primary">pt-safe</td>
                    <td className="px-3 py-2 font-mono text-gray-600">padding-top: env(safe-area-inset-top)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-primary">mb-safe</td>
                    <td className="px-3 py-2 font-mono text-gray-600">margin-bottom: env(safe-area-inset-bottom)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto">
              <p className="text-xs font-medium text-gray-700 mb-2">Where Applied</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Component</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Utility</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Why</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-3 py-2 font-mono text-gray-900">MobileBottomBar</td>
                    <td className="px-3 py-2 font-mono text-primary">pb-safe</td>
                    <td className="px-3 py-2 text-gray-600">Clears home indicator on iPhone</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-gray-900">BottomSheet</td>
                    <td className="px-3 py-2 font-mono text-primary">pb-safe</td>
                    <td className="px-3 py-2 text-gray-600">Content above home indicator</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-gray-900">MobileAIChat</td>
                    <td className="px-3 py-2 font-mono text-primary">pb-safe</td>
                    <td className="px-3 py-2 text-gray-600">Input field above home indicator</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-gray-900">MobileNavDrawer</td>
                    <td className="px-3 py-2 font-mono text-primary">pb-safe</td>
                    <td className="px-3 py-2 text-gray-600">Drawer footer clearance</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Components Tab ────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "link" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon";
type BadgeVariant = "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info" | "outline";
type BadgeSize = "sm" | "md" | "lg";

function ComponentsSection() {
  const [btnVariant, setBtnVariant] = useState<ButtonVariant>("primary");
  const [btnSize, setBtnSize] = useState<ButtonSize>("md");
  const [btnLoading, setBtnLoading] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);

  const [badgeVariant, setBadgeVariant] = useState<BadgeVariant>("default");
  const [badgeSize, setBadgeSize] = useState<BadgeSize>("md");
  const [badgeDot, setBadgeDot] = useState(false);

  const [inputLabel, setInputLabel] = useState(true);
  const [inputError, setInputError] = useState(false);
  const [inputIcon, setInputIcon] = useState(false);
  const [inputView, setInputView] = useState<"desktop" | "mobile">("desktop");

  const [switchChecked, setSwitchChecked] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);

  const [progressValue, setProgressValue] = useState(65);
  const [progressSize, setProgressSize] = useState<"sm" | "md" | "lg">("md");
  const [progressLabel, setProgressLabel] = useState(false);

  const [spinnerSize, setSpinnerSize] = useState<"sm" | "md" | "lg" | "xl">("md");

  const [tabVariant, setTabVariant] = useState<"default" | "pills" | "underline">("default");
  const [tabView, setTabView] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="space-y-2">
      {/* Button */}
      <ComponentDemo
        title="Button"
        description="Primary interactive element with 6 variants and 4 sizes. Supports loading state and Radix Slot composition."
        controls={
          <>
            <ControlPills
              label="Variant"
              options={["primary", "secondary", "outline", "ghost", "link", "destructive"] as ButtonVariant[]}
              value={btnVariant}
              onChange={setBtnVariant}
            />
            <ControlPills
              label="Size"
              options={["sm", "md", "lg", "icon"] as ButtonSize[]}
              value={btnSize}
              onChange={setBtnSize}
            />
            <ToggleControl label="Loading" checked={btnLoading} onChange={setBtnLoading} />
            <ToggleControl label="Disabled" checked={btnDisabled} onChange={setBtnDisabled} />
          </>
        }
        propsTable={[
          {
            name: "variant",
            type: "'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'",
            default: "'primary'",
          },
          { name: "size", type: "'sm' | 'md' | 'lg' | 'icon'", default: "'md'" },
          { name: "isLoading", type: "boolean", default: "false" },
          { name: "asChild", type: "boolean", default: "false" },
        ]}
      >
        <Button variant={btnVariant} size={btnSize} isLoading={btnLoading} disabled={btnDisabled}>
          {btnSize === "icon" ? <Star className="w-4 h-4" /> : "Button"}
        </Button>
      </ComponentDemo>

      {/* Badge */}
      <ComponentDemo
        title="Badge"
        description="Inline status label with semantic color variants. Supports optional status dot."
        controls={
          <>
            <ControlPills
              label="Variant"
              options={
                ["default", "primary", "secondary", "success", "warning", "error", "info", "outline"] as BadgeVariant[]
              }
              value={badgeVariant}
              onChange={setBadgeVariant}
            />
            <ControlPills
              label="Size"
              options={["sm", "md", "lg"] as BadgeSize[]}
              value={badgeSize}
              onChange={setBadgeSize}
            />
            <ToggleControl label="Dot" checked={badgeDot} onChange={setBadgeDot} />
          </>
        }
        propsTable={[
          {
            name: "variant",
            type: "'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'outline'",
            default: "'default'",
          },
          { name: "size", type: "'sm' | 'md' | 'lg'", default: "'md'" },
          { name: "dot", type: "boolean", default: "false" },
          { name: "dotColor", type: "string", default: "'bg-current'" },
        ]}
      >
        <Badge variant={badgeVariant} size={badgeSize} dot={badgeDot}>
          Status Label
        </Badge>
        <Badge variant="success" size={badgeSize} dot={badgeDot}>
          On Track
        </Badge>
        <Badge variant="warning" size={badgeSize} dot={badgeDot}>
          At Risk
        </Badge>
        <Badge variant="error" size={badgeSize} dot={badgeDot}>
          Off Track
        </Badge>
      </ComponentDemo>

      {/* Input */}
      <ComponentDemo
        title="Input"
        description="Text input with label, error state, hint text, and icon slots. Uses text-base on mobile to prevent iOS zoom."
        headerActions={<ViewportToggle value={inputView} onChange={setInputView} />}
        controls={
          <>
            <ToggleControl label="Label" checked={inputLabel} onChange={setInputLabel} />
            <ToggleControl label="Error" checked={inputError} onChange={setInputError} />
            <ToggleControl label="Icon" checked={inputIcon} onChange={setInputIcon} />
          </>
        }
        propsTable={[
          { name: "label", type: "string", default: "undefined" },
          { name: "error", type: "string", default: "undefined" },
          { name: "hint", type: "string", default: "undefined" },
          { name: "leftIcon", type: "ReactNode", default: "undefined" },
          { name: "rightIcon", type: "ReactNode", default: "undefined" },
        ]}
      >
        <div className={cn("w-full", inputView === "mobile" ? "max-w-[320px]" : "max-w-sm")}>
          <Input
            label={inputLabel ? "Email address" : undefined}
            placeholder="you@example.com"
            error={inputError ? "Please enter a valid email" : undefined}
            hint={!inputError ? "We will never share your email" : undefined}
            leftIcon={inputIcon ? <Mail className="w-4 h-4" /> : undefined}
          />
          {inputView === "mobile" && (
            <p className="text-[10px] text-gray-400 mt-2">
              Uses text-base (16px) on mobile to prevent iOS auto-zoom on focus. Scales to lg:text-sm on desktop.
            </p>
          )}
        </div>
      </ComponentDemo>

      {/* Switch */}
      <ComponentDemo
        title="Switch"
        description="Toggle switch built on Radix Switch primitive."
        propsTable={[
          { name: "checked", type: "boolean", default: "false" },
          { name: "onCheckedChange", type: "(checked: boolean) => void", default: "-" },
          { name: "disabled", type: "boolean", default: "false" },
        ]}
      >
        <label className="flex items-center gap-3 text-sm text-gray-700">
          <Switch checked={switchChecked} onCheckedChange={setSwitchChecked} />
          {switchChecked ? "Enabled" : "Disabled"}
        </label>
      </ComponentDemo>

      {/* Slider */}
      <ComponentDemo
        title="Slider"
        description="Range input with custom styled thumb. Native input[type=range] wrapper."
        propsTable={[
          { name: "value", type: "number", default: "-" },
          { name: "onValueChange", type: "(value: number[]) => void", default: "-" },
          { name: "min", type: "number", default: "0" },
          { name: "max", type: "number", default: "100" },
        ]}
      >
        <div className="w-full max-w-sm space-y-2">
          <Slider value={sliderValue} min={0} max={100} onValueChange={(v) => setSliderValue(v[0] ?? 50)} />
          <p className="text-xs text-gray-500 text-center">Value: {sliderValue}</p>
        </div>
      </ComponentDemo>

      {/* Progress */}
      <ComponentDemo
        title="Progress"
        description="Linear and circular progress indicators with size variants."
        controls={
          <>
            <ControlPills
              label="Size"
              options={["sm", "md", "lg"] as const}
              value={progressSize}
              onChange={setProgressSize}
            />
            <ToggleControl label="Show Label" checked={progressLabel} onChange={setProgressLabel} />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Value:</span>
              <Slider
                min={0}
                max={100}
                value={progressValue}
                onValueChange={(v) => setProgressValue(v[0] ?? 65)}
                className="w-24"
              />
              <span className="text-xs text-gray-500 w-8">{progressValue}%</span>
            </div>
          </>
        }
      >
        <div className="w-full max-w-md">
          <Progress value={progressValue} size={progressSize} showLabel={progressLabel} />
        </div>
        <CircularProgress value={progressValue} showLabel={progressLabel} />
      </ComponentDemo>

      {/* Spinner */}
      <ComponentDemo
        title="Spinner"
        description="Indeterminate loading spinner with 4 sizes."
        controls={
          <ControlPills
            label="Size"
            options={["sm", "md", "lg", "xl"] as const}
            value={spinnerSize}
            onChange={setSpinnerSize}
          />
        }
      >
        <Spinner size={spinnerSize} />
      </ComponentDemo>

      {/* KPI Label */}
      <ComponentDemo
        title="KpiLabel"
        description="Abbreviation label with contextual tooltip showing KPI definition, formula, and unit."
        propsTable={[{ name: "abbr", type: "string", default: "-" }]}
      >
        <div className="flex items-center gap-4">
          <KpiLabel abbr="GMROI" />
          <KpiLabel abbr="ASP" />
          <KpiLabel abbr="STR" />
          <KpiLabel abbr="DOS" />
        </div>
      </ComponentDemo>

      {/* Tabs */}
      <ComponentDemo
        title="Tabs"
        description="Radix-based tab navigation with 3 variants. Mobile: horizontal scroll with fade indicators. Desktop: wraps normally."
        headerActions={<ViewportToggle value={tabView} onChange={setTabView} />}
        controls={
          <ControlPills
            label="Variant"
            options={["default", "pills", "underline"] as ("default" | "pills" | "underline")[]}
            value={tabVariant}
            onChange={setTabVariant}
          />
        }
        propsTable={[
          { name: "variant", type: "'default' | 'pills' | 'underline'", default: "'default'" },
          { name: "defaultValue", type: "string", default: "-" },
          { name: "value", type: "string", default: "-" },
          { name: "onValueChange", type: "(value: string) => void", default: "-" },
        ]}
      >
        <div className={cn("w-full", tabView === "mobile" && "max-w-[320px]")}>
          <Tabs defaultValue="tab1">
            <TabsList variant={tabVariant}>
              <TabsTrigger value="tab1" variant={tabVariant}>
                Overview
              </TabsTrigger>
              <TabsTrigger value="tab2" variant={tabVariant}>
                Analytics
              </TabsTrigger>
              <TabsTrigger value="tab3" variant={tabVariant}>
                Reports
              </TabsTrigger>
              {tabView === "mobile" && (
                <>
                  <TabsTrigger value="tab4" variant={tabVariant}>
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="tab5" variant={tabVariant}>
                    Notifications
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            <TabsContent value="tab1">
              <p className="text-sm text-gray-600 p-3">Overview content panel</p>
            </TabsContent>
            <TabsContent value="tab2">
              <p className="text-sm text-gray-600 p-3">Analytics content panel</p>
            </TabsContent>
            <TabsContent value="tab3">
              <p className="text-sm text-gray-600 p-3">Reports content panel</p>
            </TabsContent>
            {tabView === "mobile" && (
              <>
                <TabsContent value="tab4">
                  <p className="text-sm text-gray-600 p-3">Settings content panel</p>
                </TabsContent>
                <TabsContent value="tab5">
                  <p className="text-sm text-gray-600 p-3">Notifications content panel</p>
                </TabsContent>
              </>
            )}
          </Tabs>
          {tabView === "mobile" && (
            <p className="text-[10px] text-gray-400 mt-2">Scroll horizontally to see fade indicators on overflow</p>
          )}
        </div>
      </ComponentDemo>
    </div>
  );
}

// ─── Cards & Data Tab ──────────────────────────────────────────────────────

function CardsDataSection() {
  const [listVariant, setListVariant] = useState<"card" | "row">("card");
  const [listSelected, setListSelected] = useState(false);

  return (
    <div className="space-y-2">
      {/* Card */}
      <ComponentDemo
        title="Card"
        description="Container with header, title, description, content, and footer slots. Standard rounded-lg border bg-white."
      >
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>A brief description of the card content.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Card body content goes here. This is a standard content area.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="outline">
                Cancel
              </Button>
              <Button size="sm" className="ml-auto">
                Save
              </Button>
            </CardFooter>
          </Card>
        </div>
      </ComponentDemo>

      {/* MetricCard */}
      <ComponentDemo
        title="MetricCard"
        description="KPI display card with optional RAG status border, icon, trend, and badge."
        propsTable={[
          { name: "label", type: "ReactNode", default: "-" },
          { name: "value", type: "string | number", default: "-" },
          { name: "status", type: "'green' | 'amber' | 'red'", default: "undefined" },
          { name: "icon", type: "LucideIcon", default: "undefined" },
          { name: "iconColor", type: "'success' | 'warning' | 'error' | 'info'", default: "undefined" },
          { name: "trend", type: "string", default: "undefined" },
          { name: "subtitle", type: "string", default: "undefined" },
        ]}
      >
        <MetricGrid columns={3} className="w-full">
          <MetricCard
            label="Revenue"
            value="42.5 Cr"
            trend="+5.2%"
            icon={TrendingUp}
            iconColor="success"
            subtitle="vs last month"
          />
          <MetricCard label="Active Agents" value="127" status={"green" as RagStatus} icon={Bot} iconColor="info" />
          <MetricCard
            label="Exceptions"
            value="23"
            status={"amber" as RagStatus}
            trend="-3"
            icon={AlertTriangle}
            iconColor="warning"
          />
          <MetricCard
            label="SLA Breach"
            value="4"
            status={"red" as RagStatus}
            icon={Activity}
            iconColor="error"
            subtitle="Critical"
          />
        </MetricGrid>
      </ComponentDemo>

      {/* ListItemCard */}
      <ComponentDemo
        title="ListItemCard"
        description="Selectable list item with card (rounded ring) and row (flat border-left) variants."
        controls={
          <>
            <ControlPills
              label="Variant"
              options={["card", "row"] as const}
              value={listVariant}
              onChange={setListVariant}
            />
            <ToggleControl label="Selected" checked={listSelected} onChange={setListSelected} />
          </>
        }
        propsTable={[
          { name: "variant", type: "'card' | 'row'", default: "'card'" },
          { name: "selected", type: "boolean", default: "false" },
          { name: "title", type: "string", default: "-" },
          { name: "header", type: "ReactNode", default: "undefined" },
          { name: "metadata", type: "ReactNode", default: "undefined" },
          { name: "actions", type: "ReactNode", default: "undefined" },
        ]}
      >
        <div className="w-full max-w-md space-y-2">
          <ListItemCard
            variant={listVariant}
            selected={listSelected}
            title="Stock replenishment alert for Store #42"
            header={
              <Badge variant="warning" size="sm">
                Medium Priority
              </Badge>
            }
            metadata="3 hours ago — Inventory Module"
          />
          <ListItemCard
            variant={listVariant}
            selected={false}
            title="OTB variance exceeded threshold in Menswear"
            header={
              <Badge variant="error" size="sm">
                High Priority
              </Badge>
            }
            metadata="5 hours ago — OTB Module"
          />
        </div>
      </ComponentDemo>

      {/* DataTable */}
      <ComponentDemo
        title="DataTable"
        description="Lightweight table with overflow-x-auto wrapper. Compound components: Header, Body, Row, Head, Cell."
      >
        <div className="w-full">
          <DataTable>
            <DataTableHeader>
              <DataTableHead>Store</DataTableHead>
              <DataTableHead>Region</DataTableHead>
              <DataTableHead align="right">Revenue</DataTableHead>
              <DataTableHead align="center">Status</DataTableHead>
            </DataTableHeader>
            <DataTableBody>
              <DataTableRow>
                <DataTableCell>Infinity Mall</DataTableCell>
                <DataTableCell>West</DataTableCell>
                <DataTableCell align="right">12.4 Cr</DataTableCell>
                <DataTableCell align="center">
                  <Badge variant="success" size="sm">
                    On Track
                  </Badge>
                </DataTableCell>
              </DataTableRow>
              <DataTableRow>
                <DataTableCell>Phoenix Palladium</DataTableCell>
                <DataTableCell>West</DataTableCell>
                <DataTableCell align="right">8.7 Cr</DataTableCell>
                <DataTableCell align="center">
                  <Badge variant="warning" size="sm">
                    At Risk
                  </Badge>
                </DataTableCell>
              </DataTableRow>
              <DataTableRow>
                <DataTableCell>Select Citywalk</DataTableCell>
                <DataTableCell>North</DataTableCell>
                <DataTableCell align="right">6.2 Cr</DataTableCell>
                <DataTableCell align="center">
                  <Badge variant="error" size="sm">
                    Off Track
                  </Badge>
                </DataTableCell>
              </DataTableRow>
            </DataTableBody>
          </DataTable>
        </div>
      </ComponentDemo>

      {/* Skeleton */}
      <ComponentDemo
        title="Skeleton"
        description="Pulsing placeholder for loading content. Apply to any shape with standard Tailwind sizing."
      >
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      </ComponentDemo>
    </div>
  );
}

// ─── Compound Components Tab ───────────────────────────────────────────────

function CompoundSection() {
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [pageHeaderView, setPageHeaderView] = useState<"desktop" | "mobile">("desktop");
  const [filterBarView, setFilterBarView] = useState<"desktop" | "mobile">("desktop");
  const [metricGridView, setMetricGridView] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="space-y-2">
      {/* PageHeader */}
      <ComponentDemo
        title="PageHeader"
        description="Page-level header with title, subtitle, badges, actions, and breadcrumbs. Stacks vertically on mobile."
        headerActions={<ViewportToggle value={pageHeaderView} onChange={setPageHeaderView} />}
        propsTable={[
          { name: "title", type: "ReactNode", default: "-" },
          { name: "subtitle", type: "string", default: "undefined" },
          { name: "actions", type: "ReactNode", default: "undefined" },
          { name: "badges", type: "ReactNode", default: "undefined" },
          { name: "breadcrumbs", type: "Breadcrumb[]", default: "undefined" },
          { name: "backTo", type: "string | { label, path }", default: "undefined" },
        ]}
      >
        <div className={cn("w-full", pageHeaderView === "mobile" && "max-w-[320px]")}>
          <PageHeader
            title="Range Dashboard"
            badges={
              <Badge variant="success" size="sm">
                Live
              </Badge>
            }
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Export
                </Button>
                <Button size="sm">Create Range</Button>
              </div>
            }
            backTo={{ label: "Range", path: "/range" }}
          />
          {pageHeaderView === "mobile" && (
            <p className="text-[10px] text-gray-400 mt-2">
              Back button hidden on mobile (hidden lg:flex). Title and actions stack vertically.
            </p>
          )}
        </div>
      </ComponentDemo>

      {/* SectionHeader */}
      <ComponentDemo
        title="SectionHeader"
        description="Sub-section heading with optional subtitle and right-aligned actions."
      >
        <div className="w-full">
          <SectionHeader
            title="Recent Exceptions"
            subtitle="Last 7 days"
            actions={
              <Button variant="ghost" size="sm">
                View All
              </Button>
            }
          />
        </div>
      </ComponentDemo>

      {/* FilterBar */}
      <ComponentDemo
        title="FilterBar"
        description="Horizontal filter container with FilterPills, FilterSelect, FilterSearch, and FilterClear."
        headerActions={<ViewportToggle value={filterBarView} onChange={setFilterBarView} />}
      >
        <div className={cn("w-full", filterBarView === "mobile" && "max-w-[320px]")}>
          <FilterBar>
            <FilterPills
              options={[
                { label: "All", value: "all" },
                { label: "Active", value: "active" },
                { label: "Resolved", value: "resolved" },
              ]}
              value="all"
              onChange={() => {}}
            />
            <FilterSelect
              placeholder="Region"
              options={[
                { label: "All Regions", value: "all" },
                { label: "North", value: "north" },
                { label: "South", value: "south" },
                { label: "East", value: "east" },
                { label: "West", value: "west" },
              ]}
              value={filterRegion}
              onChange={setFilterRegion}
            />
            <FilterSearch value={filterSearch} onChange={setFilterSearch} placeholder="Search..." />
            <FilterClear
              onClear={() => {
                setFilterRegion("all");
                setFilterSearch("");
              }}
            />
          </FilterBar>
          {filterBarView === "mobile" && (
            <p className="text-[10px] text-gray-400 mt-2">
              Scrolls horizontally on mobile. FilterSelect and FilterMultiSelect open BottomSheets instead of dropdowns.
            </p>
          )}
        </div>
      </ComponentDemo>

      {/* EmptyState */}
      <ComponentDemo title="EmptyState" description="Placeholder for zero-data states. Neutral and positive variants.">
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <EmptyState
                icon={Inbox}
                title="No exceptions"
                description="No exceptions match your current filters"
                action={
                  <Button variant="outline" size="sm">
                    Clear Filters
                  </Button>
                }
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <EmptyState
                icon={CheckCircle}
                variant="positive"
                title="All clear"
                description="No pending approvals in the queue"
              />
            </CardContent>
          </Card>
        </div>
      </ComponentDemo>

      {/* MetricGrid */}
      <ComponentDemo
        title="MetricGrid"
        description="Responsive grid container for MetricCards. Supports 2-5 column layouts."
        headerActions={<ViewportToggle value={metricGridView} onChange={setMetricGridView} />}
        propsTable={[{ name: "columns", type: "2 | 3 | 4 | 5", default: "4" }]}
      >
        <div className={cn("w-full", metricGridView === "mobile" && "max-w-[320px]")}>
          <MetricGrid columns={4}>
            <MetricCard label="Total Revenue" value="156 Cr" trend="+12%" />
            <MetricCard label="Sell Through" value="68%" trend="+3%" />
            <MetricCard label="Stock Turns" value="4.2x" />
            <MetricCard label="GMROI" value="2.8" trend="-0.1" />
          </MetricGrid>
          {metricGridView === "mobile" && (
            <p className="text-[10px] text-gray-400 mt-2">Stacks to 1 column on mobile, 2 on sm, 3 on lg, 4 on xl.</p>
          )}
        </div>
      </ComponentDemo>
    </div>
  );
}

// ─── Alert (Feedback Tab — Inspector-driven showcase) ─────────────────────

const ALERT_DEMO_COPY =
  "Note: This view provides a consolidated snapshot for Inwarded articles, refreshed on a T-2 cycle (up to two days prior). By default, it reflects data from April 1 to the current date, with a flexible timeframe selection.";

type Rect = { top: number; left: number; width: number; height: number };
type AlertSlots = {
  alert: Rect | null;
  icon: Rect | null;
  description: Rect | null;
  action: Rect | null;
  button: Rect | null;
};

function emptySlots(): AlertSlots {
  return { alert: null, icon: null, description: null, action: null, button: null };
}

function relRect(child: HTMLElement, parent: HTMLElement): Rect {
  const c = child.getBoundingClientRect();
  const p = parent.getBoundingClientRect();
  return { top: c.top - p.top, left: c.left - p.left, width: c.width, height: c.height };
}

function AlertInspectorOverlays({
  slots,
  showAnatomy,
  showSpacing,
  showDimension,
  showTouch,
  isMobile,
}: {
  slots: AlertSlots;
  showAnatomy: boolean;
  showSpacing: boolean;
  showDimension: boolean;
  showTouch: boolean;
  isMobile: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Dimension: W×H px chip at top-right of the alert */}
      {showDimension && slots.alert && (
        <span
          className="absolute text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-900 text-white whitespace-nowrap"
          // eslint-disable-next-line no-restricted-syntax -- inspector overlay positioned from measured DOM rect
          style={{ top: slots.alert.top - 18, left: slots.alert.left }}
        >
          {`${Math.round(slots.alert.width)}×${Math.round(slots.alert.height)}px`}
        </span>
      )}

      {/* Anatomy: outline + label per slot */}
      {showAnatomy && (
        <>
          {slots.icon && (
            <SlotOutline rect={slots.icon} label="Icon" colorClass="border-blue-500 text-blue-700 bg-blue-50" />
          )}
          {slots.description && (
            <SlotOutline
              rect={slots.description}
              label="Description"
              colorClass="border-violet-500 text-violet-700 bg-violet-50"
            />
          )}
          {slots.action && (
            <SlotOutline
              rect={slots.action}
              label="Action slot"
              colorClass="border-pink-500 text-pink-700 bg-pink-50"
            />
          )}
        </>
      )}

      {/* Spacing: dimension chips at edges */}
      {showSpacing && slots.alert && (
        <>
          <SpacingChip
            label="px-3"
            // eslint-disable-next-line no-restricted-syntax -- inspector overlay positioned from measured DOM rect
            style={{ top: slots.alert.top + slots.alert.height / 2 - 9, left: slots.alert.left - 28 }}
          />
          <SpacingChip
            label="py-2"
            // eslint-disable-next-line no-restricted-syntax -- inspector overlay positioned from measured DOM rect
            style={{ top: slots.alert.top - 18, left: slots.alert.left + slots.alert.width / 2 - 14 }}
          />
          <SpacingChip
            label="rounded-lg"
            // eslint-disable-next-line no-restricted-syntax -- inspector overlay positioned from measured DOM rect
            style={{ top: slots.alert.top - 18, left: slots.alert.left + slots.alert.width - 50 }}
          />
          {slots.icon && slots.description && (
            <SpacingChip
              label="gap-2"
              // eslint-disable-next-line no-restricted-syntax -- inspector overlay positioned from measured DOM rect
              style={{
                top: slots.icon.top + slots.icon.height / 2 - 9,
                left: slots.icon.left + slots.icon.width + 1,
              }}
            />
          )}
        </>
      )}

      {/* Touch targets: dashed outline + dimension label */}
      {showTouch && slots.button && (
        <>
          <div
            className="absolute border-2 border-dashed border-emerald-500 rounded-lg"
            // eslint-disable-next-line no-restricted-syntax -- inspector overlay positioned from measured DOM rect
            style={{
              top: slots.button.top - 1,
              left: slots.button.left - 1,
              width: slots.button.width + 2,
              height: slots.button.height + 2,
            }}
          />
          <span
            className="absolute text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500 text-white whitespace-nowrap"
            // eslint-disable-next-line no-restricted-syntax -- inspector overlay positioned from measured DOM rect
            style={{ top: slots.button.top - 18, left: slots.button.left }}
          >
            {`${Math.round(slots.button.width)}×${Math.round(slots.button.height)}px`}
            {isMobile ? " · ≥44px ✓" : " · desktop"}
          </span>
        </>
      )}
    </div>
  );
}

function SlotOutline({ rect, label, colorClass }: { rect: Rect; label: string; colorClass: string }) {
  return (
    <>
      <div
        className={cn("absolute border-2 border-dashed rounded", colorClass.split(" ").filter((c) => c.startsWith("border-")).join(" "))}
        // eslint-disable-next-line no-restricted-syntax -- inspector overlay positioned from measured DOM rect
        style={{ top: rect.top - 2, left: rect.left - 2, width: rect.width + 4, height: rect.height + 4 }}
      />
      <span
        className={cn("absolute text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap", colorClass)}
        // eslint-disable-next-line no-restricted-syntax -- inspector overlay positioned from measured DOM rect
        style={{ top: rect.top - 16, left: rect.left - 2 }}
      >
        {label}
      </span>
    </>
  );
}

function SpacingChip({ label, style }: { label: string; style: React.CSSProperties }) {
  return (
    <span
      className="absolute text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary text-white whitespace-nowrap"
      // eslint-disable-next-line no-restricted-syntax -- caller-supplied style is a measured DOM rect (see SpacingChip callsites)
      style={style}
    >
      {label}
    </span>
  );
}

function AlertSection() {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [modalOpen, setModalOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState<AlertSlots>(emptySlots);
  const { state: inspector } = useInspector();
  const { anatomy: showAnatomy, spacing: showSpacing, dimension: showDimension, touch: showTouch } = inspector;
  const anyInspectorOn = showAnatomy || showSpacing || showDimension || showTouch;

  useLayoutEffect(() => {
    const container = previewRef.current;
    if (!container) return;
    const compute = () => {
      const root = container.querySelector<HTMLElement>('[data-slot="alert"]');
      if (!root) {
        setSlots(emptySlots());
        return;
      }
      const icon = container.querySelector<HTMLElement>('[data-slot="icon"]');
      const description = container.querySelector<HTMLElement>('[data-slot="description"]');
      const action = container.querySelector<HTMLElement>('[data-slot="action"]');
      const button = container.querySelector<HTMLElement>('[data-slot="action"] button');
      setSlots({
        alert: relRect(root, container),
        icon: icon ? relRect(icon, container) : null,
        description: description ? relRect(description, container) : null,
        action: action ? relRect(action, container) : null,
        button: button ? relRect(button, container) : null,
      });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(container);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [viewport]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-base">Alert</CardTitle>
            <CardDescription>
              Inline informational banner with optional action slot. Used for view-level notes, scope hints, and
              contextual callouts.
            </CardDescription>
          </div>
          <ViewportToggle value={viewport} onChange={setViewport} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Live preview frame */}
        <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
          <div
            ref={previewRef}
            className={cn(
              "relative mx-auto bg-white rounded-lg p-4 border border-gray-100",
              viewport === "mobile" ? "max-w-[375px]" : "max-w-2xl",
            )}
          >
            <Alert variant="info" truncateOnMobile>
              <AlertIcon />
              <AlertContent>
                <AlertDescription>{ALERT_DEMO_COPY}</AlertDescription>
              </AlertContent>
              <AlertAction>
                <Button
                  variant="ghost"
                  size="sm"
                  // min-h-8 forces 32px on mobile too — accepted divergence from WCAG 2.5.5
                  className="min-h-8 text-primary-700 hover:text-primary-800 hover:bg-primary-100"
                  onClick={() => setModalOpen(true)}
                >
                  View Data Scope
                </Button>
              </AlertAction>
            </Alert>
            {anyInspectorOn && (
              <AlertInspectorOverlays
                slots={slots}
                showAnatomy={showAnatomy}
                showSpacing={showSpacing}
                showDimension={showDimension}
                showTouch={showTouch}
                isMobile={viewport === "mobile"}
              />
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-3 text-center">
            {viewport === "mobile"
              ? "Mobile preview at 375px. Description truncates to 2 lines, action drops below."
              : "Desktop preview. Action sits inline-right of description."}
            {!anyInspectorOn && " · Use the Inspectors dropdown (top-right) to overlay anatomy / spacing / dimension / touch."}
          </p>
        </div>

        {/* Variant matrix */}
        <div className="mt-8">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Variants</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {(["info", "warning", "error", "success", "neutral"] as const).map((v) => (
              <Fragment key={v}>
                <Alert variant={v} size="sm">
                  <AlertIcon />
                  <AlertContent>
                    <AlertDescription>
                      <span className="font-medium capitalize">{v}</span> — small. Lorem ipsum dolor sit amet.
                    </AlertDescription>
                  </AlertContent>
                </Alert>
                <Alert variant={v} size="md">
                  <AlertIcon />
                  <AlertContent>
                    <AlertDescription>
                      <span className="font-medium capitalize">{v}</span> — medium. Consectetur adipiscing elit.
                    </AlertDescription>
                  </AlertContent>
                </Alert>
              </Fragment>
            ))}
          </div>
        </div>

        {/* Anatomy reference */}
        <div className="mt-8">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Anatomy</h4>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-medium border border-blue-300">
                Icon
              </span>
              <div className="flex-1 flex flex-col gap-1">
                <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] font-medium border border-violet-300 self-start">
                  Title (optional)
                </span>
                <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[10px] font-medium border border-violet-300 self-start">
                  Description
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 text-[10px] font-medium border border-pink-300">
                Action slot
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              Composition: <code className="font-mono text-primary">Alert</code> &gt;{" "}
              <code className="font-mono text-primary">AlertIcon</code> +{" "}
              <code className="font-mono text-primary">AlertContent</code> (
              <code className="font-mono text-primary">AlertTitle</code> +{" "}
              <code className="font-mono text-primary">AlertDescription</code>) +{" "}
              <code className="font-mono text-primary">AlertAction</code>
            </p>
          </div>
        </div>

        {/* Props table */}
        <div className="mt-8">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Props (Alert)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Prop</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Type</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Default</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-3 py-2 font-mono text-primary">variant</td>
                  <td className="px-3 py-2 font-mono text-gray-600">'info' | 'warning' | 'error' | 'success' | 'neutral'</td>
                  <td className="px-3 py-2 font-mono text-gray-500">'info'</td>
                  <td className="px-3 py-2 text-gray-600">Drives bg/border/text color and auto-icon.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono text-primary">size</td>
                  <td className="px-3 py-2 font-mono text-gray-600">'sm' | 'md'</td>
                  <td className="px-3 py-2 font-mono text-gray-500">'sm'</td>
                  <td className="px-3 py-2 text-gray-600">sm = text-xs px-3 py-2 · md = text-sm px-4 py-2.5</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono text-primary">truncateOnMobile</td>
                  <td className="px-3 py-2 font-mono text-gray-600">boolean</td>
                  <td className="px-3 py-2 font-mono text-gray-500">false</td>
                  <td className="px-3 py-2 text-gray-600">When true, AlertDescription is line-clamp-2 below lg.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono text-primary">className</td>
                  <td className="px-3 py-2 font-mono text-gray-600">string</td>
                  <td className="px-3 py-2 font-mono text-gray-500">—</td>
                  <td className="px-3 py-2 text-gray-600">Pass-through additional classes.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Composition slots */}
        <div className="mt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Composition slots</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Slot</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-3 py-2 font-mono text-primary">AlertIcon</td>
                  <td className="px-3 py-2 text-gray-600">Auto-picks icon by variant. Override with `icon` prop.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono text-primary">AlertContent</td>
                  <td className="px-3 py-2 text-gray-600">Wrapper for title + description; takes remaining width.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono text-primary">AlertTitle</td>
                  <td className="px-3 py-2 text-gray-600">Optional. h3, text-sm font-semibold.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono text-primary">AlertDescription</td>
                  <td className="px-3 py-2 text-gray-600">Inherits text size from Alert size. Truncates per parent flag.</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono text-primary">AlertAction</td>
                  <td className="px-3 py-2 text-gray-600">Right-aligned on lg+, drops below content on mobile.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* When to use / not to use */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-2">Use Alert for</h4>
            <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
              <li>View-level scope or freshness notes</li>
              <li>Contextual callouts within a page</li>
              <li>Inline guidance about filters or assumptions</li>
              <li>Master-data or coverage callouts (warning variant)</li>
            </ul>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-error mb-2">Don&apos;t use Alert for</h4>
            <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
              <li>Blocking errors → use <code className="font-mono">Modal</code></li>
              <li>Exception-feed navigation → use <code className="font-mono">ExceptionBanner</code></li>
              <li>Transient confirmations → use <code className="font-mono">Toast</code></li>
              <li>Form-field errors → use input <code className="font-mono">error</code> prop</li>
            </ul>
          </div>
        </div>

        {/* Code snippet */}
        <div className="mt-8">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Usage</h4>
          <pre className="bg-gray-900 text-gray-100 text-[11px] leading-relaxed p-4 rounded-lg overflow-x-auto">
            <code>{`const [open, setOpen] = useState(false);

<Alert variant="info" truncateOnMobile>
  <AlertIcon />
  <AlertContent>
    <AlertDescription>
      Note: This view provides a consolidated snapshot…
    </AlertDescription>
  </AlertContent>
  <AlertAction>
    {/* Ghost button tinted to alert tone, kept compact (min-h-8) on mobile too */}
    <Button
      variant="ghost"
      size="sm"
      className="min-h-8 text-primary-700 hover:text-primary-800 hover:bg-primary-100"
      onClick={() => setOpen(true)}
    >
      View Data Scope
    </Button>
  </AlertAction>
</Alert>

<Modal isOpen={open} onClose={() => setOpen(false)} title="Data Scope" size="lg">
  {/* Brands · Store Formats · Segments · SBUs · amber callout */}
</Modal>`}</code>
          </pre>
        </div>
      </CardContent>

      {/* Data Scope modal — placeholder content for showcase */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Data Scope" size="lg">
        <div className="space-y-5 py-2">
          <section>
            <div className="flex items-baseline justify-between mb-2">
              <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Brands</h5>
              <span className="text-xs text-gray-400">618 total</span>
            </div>
            <div className="space-y-1.5 text-sm">
              {[
                ["Private Label", "126 brands", "₹687 Cr", "56%"],
                ["Manufacturer Brand", "420 brands", "₹272 Cr", "22%"],
                ["Unclassified", "63 brands", "₹257 Cr", "21%"],
                ["Indie", "8 brands", "₹0.4 Cr", "<1%"],
                ["International", "1 brand", "—", "<1%"],
              ].map(([name, count, value, pct]) => (
                <div key={name} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 text-gray-700">
                  <span>{name}</span>
                  <span className="text-gray-500 text-xs">{count}</span>
                  <span className="text-gray-500 text-xs">{value}</span>
                  <span className="text-gray-900 font-medium text-xs w-10 text-right">{pct}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-baseline justify-between mb-2">
              <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Store Formats</h5>
              <span className="text-xs text-gray-400">15 total</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Trends", "Fashion Factory", "Yousta", "Azorte", "GAP", "Kalaniketan", "Avantra", "Centro", "John Player", "Lee Cooper", "Performax", "Grocery Centro", "Metro Junior", "Smart", "Fashion World"].map((f) => (
                <Badge key={f} className="bg-gray-100 text-gray-700 border-gray-200">{f}</Badge>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-baseline justify-between mb-2">
              <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Segments</h5>
              <span className="text-xs text-gray-400">14 total</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Mens Casual", "Mens Wear", "Womens Wear", "Kid Wear", "Kid Footwear", "Lady Footwear", "Mens Footwear", "Sport Footwear", "Beauty", "Lingerie", "Luggage", "Brands", "Toy", "Watch"].map((s) => (
                <Badge key={s} className="bg-gray-100 text-gray-700 border-gray-200">{s}</Badge>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-baseline justify-between mb-2">
              <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-500">SBUs</h5>
              <span className="text-xs text-gray-400">5 total</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Apparel & Luggage", "Beauty", "Brand", "Footwear", "Lifestyle"].map((s) => (
                <Badge key={s} className="bg-gray-100 text-gray-700 border-gray-200">{s}</Badge>
              ))}
            </div>
          </section>

          <Alert variant="warning" size="sm">
            <AlertIcon />
            <AlertContent>
              <AlertDescription>
                <strong>20 brands</strong> (DNMX, John Players, Lee Cooper, RIO, Fusion, etc.) have no{" "}
                <code className="font-mono">brand_type</code> in master data — likely private labels.
              </AlertDescription>
            </AlertContent>
          </Alert>
        </div>
      </Modal>
    </Card>
  );
}

// ─── Feedback & Overlays Tab ───────────────────────────────────────────────

function FeedbackSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDestructive, setConfirmDestructive] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalView, setModalView] = useState<"desktop" | "mobile">("desktop");
  const [confirmView, setConfirmView] = useState<"desktop" | "mobile">("desktop");
  const [sheetView, setSheetView] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="space-y-2">
      {/* Alert (new — interactive showcase with anatomy/spacing/touch inspectors) */}
      <AlertSection />

      {/* Modal */}
      <ComponentDemo
        title="Modal"
        description="Radix Dialog wrapper. Bottom sheet on mobile with swipe-to-dismiss handle."
        headerActions={<ViewportToggle value={modalView} onChange={setModalView} />}
      >
        <div>
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Example Modal"
            description="This is a demo modal with a title and description."
          >
            <p className="text-sm text-gray-600 py-4">
              Modal body content. On mobile, this renders as a bottom sheet that can be swiped down to dismiss.
            </p>
            <ModalFooter>
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => setModalOpen(false)}>
                Confirm
              </Button>
            </ModalFooter>
          </Modal>
          {modalView === "mobile" ? (
            <p className="text-[10px] text-gray-400 mt-2">
              Mobile: slides up as bottom sheet (rounded-t-3xl) with swipe-to-dismiss handle. Open on a mobile viewport
              to see.
            </p>
          ) : (
            <p className="text-[10px] text-gray-400 mt-2">Desktop: centered dialog with backdrop overlay.</p>
          )}
        </div>
      </ComponentDemo>

      {/* ConfirmDialog */}
      <ComponentDemo
        title="ConfirmDialog"
        description="Radix AlertDialog for confirmation actions. Default and destructive variants."
        headerActions={<ViewportToggle value={confirmView} onChange={setConfirmView} />}
      >
        <div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDestructive(false);
                setConfirmOpen(true);
              }}
            >
              Confirm (Default)
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDestructive(true);
                setConfirmOpen(true);
              }}
            >
              Confirm (Destructive)
            </Button>
          </div>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title={confirmDestructive ? "Delete Item" : "Approve Action"}
            description={
              confirmDestructive
                ? "This action cannot be undone. Are you sure you want to delete this item?"
                : "Are you sure you want to approve this action?"
            }
            confirmLabel={confirmDestructive ? "Delete" : "Approve"}
            variant={confirmDestructive ? "destructive" : "default"}
            onConfirm={() => setConfirmOpen(false)}
          />
          {confirmView === "mobile" && (
            <p className="text-[10px] text-gray-400 mt-2">
              Inherits Modal behavior on mobile — renders as bottom sheet with swipe-to-dismiss.
            </p>
          )}
        </div>
      </ComponentDemo>

      {/* BottomSheet */}
      <ComponentDemo
        title="BottomSheet"
        description="Slide-up panel with swipe-to-dismiss. Portaled to document.body. Accepts zIndex prop for stacking."
        headerActions={<ViewportToggle value={sheetView} onChange={setSheetView} />}
      >
        <div>
          <Button variant="outline" onClick={() => setSheetOpen(true)}>
            Open Bottom Sheet
          </Button>
          <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title="Bottom Sheet Demo">
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600">This is a bottom sheet. Drag the handle down to dismiss.</p>
              <div className="space-y-2">
                {["Option A", "Option B", "Option C"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                    onClick={() => setSheetOpen(false)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </BottomSheet>
          {sheetView === "mobile" ? (
            <p className="text-[10px] text-gray-400 mt-2">
              Mobile-only pattern. Portaled to document.body to escape ancestor transforms. Supports nested stacking via
              zIndex prop.
            </p>
          ) : (
            <p className="text-[10px] text-gray-400 mt-2">
              BottomSheet is a mobile-only pattern — use Modal on desktop (auto-converts to bottom sheet on mobile).
            </p>
          )}
        </div>
      </ComponentDemo>

      {/* Tooltip */}
      <ComponentDemo title="Tooltip" description="Radix Tooltip wrapper. Hover to reveal contextual information.">
        <div className="flex gap-4">
          {(["top", "bottom", "left", "right"] as const).map((side) => (
            <Tooltip key={side}>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  {side}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={side}>
                <p>Tooltip on {side}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </ComponentDemo>

      {/* DropdownMenu */}
      <ComponentDemo title="DropdownMenu" description="Radix DropdownMenu wrapper with items, separators, and labels.">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Actions <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="w-4 h-4 mr-2" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit3 className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-error">
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ComponentDemo>
    </div>
  );
}

// ─── Patterns Tab ──────────────────────────────────────────────────────────

function PatternsSection() {
  return (
    <div className="space-y-8">
      {/* Status Expression */}
      <div>
        <SectionHeader title="Status Expression" subtitle="Exactly 2 patterns are permitted for status display" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Pattern 1: Left-Border Card</CardTitle>
              <CardDescription>For status on cards or rows. The left border carries RAG color.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="rounded-lg border border-gray-200 border-l-3 border-l-green-500 p-3">
                  <p className="text-sm font-medium text-gray-900">Revenue target met</p>
                  <p className="text-xs text-gray-500">All KPIs within threshold</p>
                </div>
                <div className="rounded-lg border border-gray-200 border-l-3 border-l-amber-500 p-3">
                  <p className="text-sm font-medium text-gray-900">Inventory aging alert</p>
                  <p className="text-xs text-gray-500">23 SKUs above 90-day threshold</p>
                </div>
                <div className="rounded-lg border border-gray-200 border-l-3 border-l-red-500 p-3">
                  <p className="text-sm font-medium text-gray-900">SLA breach detected</p>
                  <p className="text-xs text-gray-500">4 agents exceeded response time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pattern 2: Badge</CardTitle>
              <CardDescription>Inline status label in text, tables, or lists.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Revenue</span>
                  <Badge variant="success">On Track</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Inventory</span>
                  <Badge variant="warning">At Risk</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">SLA</span>
                  <Badge variant="error">Off Track</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Do / Don't */}
      <div>
        <SectionHeader title="Color Usage" subtitle="Color is semantic only — never decorative" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700">Do</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Use indigo for interactive elements
                  (buttons, links)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Use green/amber/red only for status
                  (RAG)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Use gray scale for text hierarchy
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Keep colored text for numeric
                  values (+5.2%, -3%)
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">Don&apos;t</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> Use colored backgrounds for status
                  (bg-red-50)
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> Use standalone colored dots for
                  status
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> Use decorative color for visual
                  interest
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> Use bold colored text as status
                  labels
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Touch Targets */}
      <div>
        <SectionHeader title="Touch Targets" subtitle="WCAG 2.5.8 — minimum 44px on mobile" />
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-300 flex items-center justify-center text-[10px] text-red-600 font-mono">
                  32px
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-600">Too small</p>
                  <p className="text-xs text-gray-500">
                    Below WCAG minimum. Used by Button size=&quot;sm&quot; (32px) — increase on mobile.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-[10px] text-amber-600 font-mono">
                  40px
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-600">Acceptable</p>
                  <p className="text-xs text-gray-500">
                    Button size=&quot;md&quot; (40px). Close to minimum, acceptable for desktop.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-green-100 border border-green-300 flex items-center justify-center text-[10px] text-green-600 font-mono">
                  44px
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-600">WCAG Compliant</p>
                  <p className="text-xs text-gray-500">Minimum target size for mobile touch. Use min-h-11 (44px).</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 border border-green-300 flex items-center justify-center text-[10px] text-green-600 font-mono">
                  48px
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-600">Recommended</p>
                  <p className="text-xs text-gray-500">
                    Button size=&quot;lg&quot; (48px). Ideal for list items and primary actions on mobile.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Design Principles */}
      <div>
        <SectionHeader title="Design Principles" subtitle="The 4 rules that govern every decision" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              num: "01",
              title: "Content over chrome",
              desc: "UI elements support, not compete. Minimize decorative elements.",
            },
            {
              num: "02",
              title: "Confidence through clarity",
              desc: "Every screen should make the next action obvious.",
            },
            {
              num: "03",
              title: "Density without clutter",
              desc: "Progressive disclosure — summary first, details on demand.",
            },
            {
              num: "04",
              title: "Consistency is kindness",
              desc: "Same patterns everywhere: rounded-lg, Radix primitives, gap-3 for grids.",
            },
          ].map((p) => (
            <Card key={p.num}>
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <span className="text-2xl font-bold text-primary/20">{p.num}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{p.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export function DesignSystemPage() {
  return (
    <InspectorProvider>
      <div className="animate-fadeInUp">
        <div className="mb-4">
          <h1 className="text-lg font-bold text-gray-900">Design System</h1>
          <p className="text-sm text-gray-500 mt-0.5">Interactive component reference for Impetus Command Center</p>
        </div>

        <Tabs defaultValue="foundation">
          <div className="sticky -top-6 z-20 -mx-4 px-4 pt-10 pb-0 bg-gray-50">
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <TabsList variant="underline">
                <TabsTrigger value="foundation" variant="underline">Foundation</TabsTrigger>
                <TabsTrigger value="components" variant="underline">Components</TabsTrigger>
                <TabsTrigger value="cards" variant="underline">Cards & Data</TabsTrigger>
                <TabsTrigger value="compound" variant="underline">Compound</TabsTrigger>
                <TabsTrigger value="feedback" variant="underline">Feedback</TabsTrigger>
                <TabsTrigger value="patterns" variant="underline">Patterns</TabsTrigger>
              </TabsList>
              <div className="pb-2">
                <InspectorDropdown />
              </div>
            </div>
          </div>

          <TabsContent value="foundation">
            <FoundationSection />
          </TabsContent>
          <TabsContent value="components">
            <ComponentsSection />
          </TabsContent>
          <TabsContent value="cards">
            <CardsDataSection />
          </TabsContent>
          <TabsContent value="compound">
            <CompoundSection />
          </TabsContent>
          <TabsContent value="feedback">
            <FeedbackSection />
          </TabsContent>
          <TabsContent value="patterns">
            <PatternsSection />
          </TabsContent>
        </Tabs>
      </div>
    </InspectorProvider>
  );
}
