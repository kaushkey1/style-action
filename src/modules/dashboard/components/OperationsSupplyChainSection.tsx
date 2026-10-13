import { useState } from "react";
import {
  EmptyState,
  InfoHeaderIcon,
  SectionHeader,
  TableMetricsInfo,
  TableToolbar,
} from "@/components/ui";
import { useTableSearchSort } from "@/hooks/useTableSearchSort";
import { cn, formatCompactNumber, classifyRag, ragToTextClass } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useThresholds } from "@/hooks/useThresholds";
import { AOPMobileCard } from "@/modules/aop/components/AOPMobileCard";
import type {
  OperationsResponse,
  OperationsVendorTableRow,
} from "../api/dashboardApi";

// ---------------------------------------------------------------------------
// Nullable API numbers (operations command-center)
// ---------------------------------------------------------------------------

function finiteOr(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function fmtLocaleIntOps(value: unknown): string {
  if (value == null || value === "") return "\u2014";
  const n = Number(value);
  if (!Number.isFinite(n)) return "\u2014";
  if (Math.abs(n) >= 1_000) return formatCompactNumber(n);
  return n.toLocaleString("en-IN");
}

function fmtFixed1PctOps(value: unknown): string {
  if (value == null || value === "") return "\u2014";
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(1)}%` : "\u2014";
}

function fmtIntOrDashOps(value: unknown): string {
  if (value == null || value === "") return "\u2014";
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "\u2014";
}

// ---------------------------------------------------------------------------
// Vendor Performance Table
// ---------------------------------------------------------------------------

const VENDOR_HEADERS = [
  "Code",
  "Vendor",
  "PO Qty",
  "Fill Rate",
  "Lead Time",
  "On Time",
  "OTIF",
  "Throughput",
];

/** API key `units_ready_to_ship_per_day`; legacy `throughput_units_per_day` supported. */
function getVendorThroughputUnitsPerDay(
  r: OperationsVendorTableRow,
): number | null {
  const raw = r.units_ready_to_ship_per_day ?? r.throughput_units_per_day;
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

const VENDOR_SORT_FIELDS: Record<
  string,
  (r: OperationsVendorTableRow) => number
> = {
  "PO Qty": (r) => finiteOr(r.total_po_qty),
  "Fill Rate": (r) => finiteOr(r.fill_rate_pct),
  "Lead Time": (r) => finiteOr(r.avg_lead_time_days),
  "On Time": (r) => finiteOr(r.ot_pct),
  OTIF: (r) => finiteOr(r.otif_pct),
  Throughput: (r) => finiteOr(getVendorThroughputUnitsPerDay(r) ?? 0),
};

const VENDOR_SORT_COLUMNS = Object.keys(VENDOR_SORT_FIELDS).map((k) => ({
  key: k,
  label: k,
}));
const VENDOR_METRICS = [
  "PO Qty",
  "Fill Rate",
  "Lead Time",
  "On Time",
  "OTIF",
  "Throughput",
];

function VendorPerformanceTable({
  title,
  searchPlaceholder = "Search vendors...",
  rows,
  renderCard = true,
  tabHeader,
}: {
  title: string;
  searchPlaceholder?: string;
  rows: OperationsVendorTableRow[];
  renderCard?: boolean;
  /** When provided, replaces SectionHeader with a combined tabs + toolbar row */
  tabHeader?: React.ReactNode;
}): React.ReactNode {
  const isMobile = useIsMobile();
  const thresholds = useThresholds();

  const {
    search,
    setSearch,
    sortKey,
    sortDir,
    setSortKey,
    setSortDir,
    filteredRows,
  } = useTableSearchSort(rows, {
    searchField: (r) => r.vendor_name ?? r.vendor_code ?? "",
    sortFields: VENDOR_SORT_FIELDS,
    sortUrlParamPrefix: "oscVendor",
  });

  const toolbarActions = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={searchPlaceholder}
      sortColumns={VENDOR_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => {
        setSortKey(k);
        setSortDir(d);
      }}
    />
  );

  const headerRow = tabHeader ? (
    /* eslint-disable-next-line design-system/prefer-section-header -- custom tab + toolbar header row */
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-1">{tabHeader}</div>
      <div className="flex items-center gap-2">
        {toolbarActions}
        <TableMetricsInfo metrics={VENDOR_METRICS} />
      </div>
    </div>
  ) : (
    <SectionHeader
      title={
        <>
          {title} <TableMetricsInfo metrics={VENDOR_METRICS} />
        </>
      }
      actions={toolbarActions}
    />
  );

  if (isMobile) {
    return (
      <div className="space-y-3">
        {headerRow}
        {filteredRows.length === 0 && search ? (
          <EmptyState
            title="No results"
            description={`No vendors matching "${search}"`}
            variant="neutral"
          />
        ) : (
          filteredRows.map((r, i) => {
            const throughput = getVendorThroughputUnitsPerDay(r);
            return (
              <AOPMobileCard
                key={r.vendor_code ?? `vendor-${i}`}
                title={r.vendor_name ?? r.vendor_code ?? "\u2014"}
                metrics={[
                  { label: "PO Qty", value: fmtLocaleIntOps(r.total_po_qty) },
                  {
                    label: "Fill Rate",
                    value: fmtFixed1PctOps(r.fill_rate_pct),
                  },
                  {
                    label: "Lead Time",
                    value:
                      r.avg_lead_time_days != null
                        ? `${fmtIntOrDashOps(r.avg_lead_time_days)} days`
                        : "\u2014",
                  },
                  { label: "On Time", value: fmtFixed1PctOps(r.ot_pct) },
                  { label: "OTIF", value: fmtFixed1PctOps(r.otif_pct) },
                  {
                    label: "Throughput",
                    value:
                      throughput != null
                        ? `${fmtLocaleIntOps(throughput)} units/day`
                        : "\u2014",
                  },
                ]}
                onClick={() => {}}
                className="cursor-default"
                showChevron={false}
              />
            );
          })
        )}
      </div>
    );
  }

  const tableContent = (
    <>
      {headerRow}
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {VENDOR_HEADERS.map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "py-2 font-medium text-gray-500 text-xs whitespace-nowrap",
                    i <= 1 ? "text-left pl-3 pr-3" : "text-right px-3",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      i >= 2 && "w-full justify-end",
                    )}
                  >
                    {h}
                    {i >= 2 && <InfoHeaderIcon metricKey={h} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && search ? (
              <tr>
                <td colSpan={VENDOR_HEADERS.length} className="py-6">
                  <EmptyState
                    title="No results"
                    description={`No vendors matching "${search}"`}
                    variant="neutral"
                    className="py-6"
                  />
                </td>
              </tr>
            ) : (
              filteredRows.map((r, i) => {
                const throughput = getVendorThroughputUnitsPerDay(r);
                return (
                  <tr
                    key={r.vendor_code ?? `vendor-${i}`}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="py-2.5 pl-3 pr-3 text-left text-gray-600 tabular-nums">
                      {r.vendor_code ?? "\u2014"}
                    </td>
                    <td
                      className="py-2.5 pl-3 pr-3 font-medium text-gray-900 truncate"
                      title={r.vendor_name ?? "\u2014"}
                    >
                      {r.vendor_name ?? "\u2014"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                      {fmtLocaleIntOps(r.total_po_qty)}
                    </td>
                    <td className={cn("py-2.5 px-3 text-right tabular-nums whitespace-nowrap", ragToTextClass(classifyRag(finiteOr(r.fill_rate_pct), thresholds.get("fillRate") ?? null)))}>
                      {fmtFixed1PctOps(r.fill_rate_pct)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                      {r.avg_lead_time_days != null
                        ? `${fmtIntOrDashOps(r.avg_lead_time_days)} days`
                        : "\u2014"}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                      {fmtFixed1PctOps(r.ot_pct)}
                    </td>
                    <td className={cn("py-2.5 px-3 text-right tabular-nums whitespace-nowrap", ragToTextClass(classifyRag(finiteOr(r.otif_pct), thresholds.get("vendorOtif") ?? null)))}>
                      {fmtFixed1PctOps(r.otif_pct)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums whitespace-nowrap">
                      {throughput != null
                        ? `${fmtLocaleIntOps(throughput)} units/day`
                        : "\u2014"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  if (!renderCard) return tableContent;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {tableContent}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composed Operations & Supply Chain Section
// ---------------------------------------------------------------------------

export function OperationsSupplyChainSection({
  data,
}: {
  data?: OperationsResponse | null;
}): React.ReactNode {
  const [vendorTab, setVendorTab] = useState<"top" | "bottom">("top");

  if (data) {
    const topRows = data.vendor_table ?? [];
    const bottomRows = data.bottom_vendor_table ?? [];
    const hasTopVendors = topRows.length > 0;
    const hasBottomVendors = bottomRows.length > 0;
    const hasVendors = hasTopVendors || hasBottomVendors;
    const hasBothTabs = hasTopVendors && hasBottomVendors;
    const hasAny = (data.vendor_table?.length ?? 0) + bottomRows.length;
    if (hasAny === 0) {
      return (
        <EmptyState
          title="No operations detail"
          description="No vendor or lead-time data was returned for this period."
          variant="neutral"
        />
      );
    }

    const activeVendorRows = vendorTab === "top" ? topRows : bottomRows;
    const activeTitle = vendorTab === "top" ? "Top Vendors" : "Bottom Vendors";

    const vendorTabButtons = hasBothTabs ? (
      <>
        <button
          onClick={() => setVendorTab("top")}
          className={cn(
            "py-2 px-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
            vendorTab === "top"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700",
          )}
        >
          Top Vendors
        </button>
        <button
          onClick={() => setVendorTab("bottom")}
          className={cn(
            "py-2 px-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
            vendorTab === "bottom"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700",
          )}
        >
          Bottom Vendors
        </button>
      </>
    ) : undefined;

    return (
      <div className="space-y-4">
        {hasVendors ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <VendorPerformanceTable
              key={vendorTab}
              title={
                hasBothTabs
                  ? activeTitle
                  : hasTopVendors
                    ? "Top Vendors"
                    : "Bottom Vendors"
              }
              rows={
                hasBothTabs
                  ? activeVendorRows
                  : hasTopVendors
                    ? topRows
                    : bottomRows
              }
              renderCard={false}
              tabHeader={vendorTabButtons}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <EmptyState
      title="No operations data"
      description="Connect the Operations API to view vendor metrics and lead-time distribution."
      variant="neutral"
    />
  );
}
