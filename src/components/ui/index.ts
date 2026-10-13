// UI Components barrel export

export { Button } from "./Button";
export { Input } from "./Input";
export { DatePicker } from "./DatePicker";
export { Textarea } from "./Textarea";
export { Toast, ToastProvider, ToastViewport, type ToastVariant, type ToastData } from "./Toast";
export { ToastContainer } from "./ToastContainer";
export { Progress, CircularProgress, Spinner, PageSkeleton } from "./Progress";
export { Modal, ModalFooter } from "./Modal";
export { Tabs, TabsList, TabsTrigger, TabsContent, SwipableTabs } from "./Tabs";
export { Badge } from "./Badge";
export { Avatar, type AvatarProps, type AvatarSize } from "./Avatar";
export { Switch } from "./Switch";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from "./Select";
export { ToggleGroup, ToggleGroupItem, type ToggleGroupProps, type ToggleGroupItemProps } from "./ToggleGroup";

export { default as OptimizedImage } from "./OptimizedImage";
export type { OptimizedImageProps } from "./OptimizedImage";

// Inline UI Components (modal replacements)
export { InlineExpandableForm, InlineFormFooter } from "./InlineExpandableForm";
export { DetailPanel, DetailPanelSection, DetailPanelRow } from "./DetailPanel";
export { InlinePicker } from "./InlinePicker";

// Card components
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "./Card";

// Slider
export { Slider } from "./Slider";

// Checkbox
export { Checkbox } from "./Checkbox";

// RadioGroup
export { RadioGroup, RadioGroupItem } from "./RadioGroup";

// Dialog
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./Dialog";

// Page Header
export { PageHeader } from "./PageHeader";

// Pagination
export { Pagination, usePagination } from "./Pagination";

// Tooltip
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./Tooltip";

// Dropdown Menu
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./DropdownMenu";

// Cross-page drill menu (deep-link affordance)
export { DrillMenu } from "./DrillMenu";
export type { DrillMenuProps } from "./DrillMenu";

// KPI Label
export { KpiLabel } from "./KpiLabel";

// Label
export { Label } from "./Label";

// Metric Tooltip (rich contextual tooltips for Store Intelligence metrics)
export { MetricTooltip } from "./MetricTooltip";

// Metric Card
export { MetricCard } from "./MetricCard";

// Data Table
export { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell } from "./DataTable";

// Compound components
export { SectionHeader } from "./SectionHeader";
export { EmptyState } from "./EmptyState";
export {
  FilterBar,
  FilterPills,
  FilterSelect,
  FilterMultiSelect,
  FilterSearch,
  FilterDateRange,
  FilterClear,
  MobileFilterTrigger,
} from "./FilterBar";
export { MobileFilterSheet } from "./MobileFilterSheet";
export type { FilterDef } from "./MobileFilterSheet";
export { MetricGrid } from "./MetricGrid";
export { ListItemCard } from "./ListItemCard";
export { StoreFilterSelect } from "./StoreFilterSelect";
export { ConfirmDialog } from "./ConfirmDialog";

export { Skeleton } from "./Skeleton";

// Charts (Recharts wrappers)
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "./Chart";
export type { ChartConfig, ChartSeriesConfig } from "./Chart";

// Table Toolbar (search + sort)
export { TableToolbar } from "./TableToolbar";
export type { TableToolbarProps } from "./TableToolbar";

// Info Header Icon (metric tooltip / mobile BottomSheet)
export { InfoHeaderIcon } from "./InfoHeaderIcon";

// Table Metrics Info (single icon → BottomSheet with all metric descriptions)
export { TableMetricsInfo } from "./TableMetricsInfo";

// Severity Glyph
export { SeverityGlyph } from "./SeverityGlyph";

// Exception Banner
export { ExceptionBanner } from "./ExceptionBanner";

// Alert (info banner with action slot)
export { Alert, AlertIcon, AlertContent, AlertTitle, AlertDescription, AlertAction } from "./Alert";

// Beta Badge (amber pill marking experimental features)
export { BetaBadge } from "./BetaBadge";

// Notional Badge
export { NotionalBadge } from "./NotionalBadge";

// Hover Card
export { HoverCard } from "./HoverCard";

// Bottom Sheet
export { BottomSheet } from "./BottomSheet";
export { ShimmerCard, ShimmerTable, ShimmerKpiGrid } from "./Shimmer";
export { Sheet } from "./Sheet";

// API connection state
export { AwaitingConnection } from "./AwaitingConnection";

// Permissions
export { PermissionGate } from "@/permissions";

export { DevRoleSwitcher } from "./DevRoleSwitcher";
