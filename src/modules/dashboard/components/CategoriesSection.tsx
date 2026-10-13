import { useState, useMemo } from "react";
import {
  EmptyState,
  BottomSheet,
  SectionHeader,
  TableMetricsInfo,
  TableToolbar,
  InfoHeaderIcon,
} from "@/components/ui";
import { useTableSearchSort } from "@/hooks/useTableSearchSort";
import { cn, formatCurrency, classifyRag, ragToTextClass } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useThresholds } from "@/hooks/useThresholds";
import type { CategoriesResponse, CategoryPodRow } from "../api/dashboardApi";

const ALL_SEGMENTS = "__all__";

/** Sort segment keys: Women → Men → Kids → others alphabetically → None last. */
function sortSegmentKeys(keys: string[]): string[] {
  function priority(k: string): number {
    const lower = k.toLowerCase();
    if (lower.includes("women")) return 0;
    if (lower.includes("men")) return 1;
    if (lower.includes("kid")) return 2;
    if (lower === "none") return 99;
    return 50;
  }
  return [...keys].sort((a, b) => {
    const pa = priority(a);
    const pb = priority(b);
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b);
  });
}

function brandsCellValue(r: CategoryPodRow): string {
  const raw = r.brands;
  if (raw == null) return "";
  const s = typeof raw === "string" ? raw.trim() : String(raw).trim();
  return s;
}

function parseBrands(r: CategoryPodRow): string[] {
  const raw = brandsCellValue(r);
  if (!raw) return [];
  return raw
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);
}

function formatPctCell(n: number | null | undefined, decimals = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(decimals)}%`;
}

function formatIntPctCell(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n)}%`;
}

// ---------------------------------------------------------------------------
// Mobile card — matches AOPMobileCard layout with tappable brands row
// ---------------------------------------------------------------------------

function CategoryMobileCard({
  row,
  onBrandsClick,
}: {
  row: CategoryPodRow;
  onBrandsClick: (row: CategoryPodRow) => void;
}): React.ReactNode {
  const brands = parseBrands(row);
  const metrics: { label: string; value: string }[] = [
    { label: "Net Revenue", value: formatCurrency(row.revenue) },
    { label: "Gross Margin", value: formatPctCell(row.gm_pct) },
    { label: "Sell Through", value: formatIntPctCell(row.sell_through_pct) },
    { label: "Aged Inv", value: formatIntPctCell(row.aged_inv_pct) },
    { label: "Fresh", value: formatIntPctCell(row.fresh_pct) },
  ];

  return (
    <div className="w-full text-left bg-white rounded-lg border border-gray-200 p-3">
      <h3 className="text-sm font-semibold text-gray-900 truncate mb-2">{row.sub_category}</h3>
      <div className="space-y-1.5">
        {metrics.map((m, idx) => (
          <div key={idx} className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500 flex items-center gap-1">{m.label}</span>
            <span className="text-sm font-medium text-gray-900 tabular-nums">{m.value}</span>
          </div>
        ))}
        {brands.length > 0 && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500">Brands</span>
            <button
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
              onClick={() => onBrandsClick(row)}
              aria-label={`View ${brands.length} brands for ${row.sub_category}`}
            >
              {brands.length} {brands.length === 1 ? "brand" : "brands"} ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop table + mobile cards for a segment
// ---------------------------------------------------------------------------

function CategorySegmentTableApi({
  segment,
  rows,
  onBrandsClick,
}: {
  segment: string;
  rows: CategoryPodRow[];
  onBrandsClick: (row: CategoryPodRow) => void;
}): React.ReactNode {
  const thresholds = useThresholds();
  const headers = ["Sub-Category", "Brands", "Net Revenue", "Gross Margin", "Sell Through", "Aged Inv", "Fresh"] as const;

  const sortColumns = [
    { key: "Net Revenue", label: "Net Revenue" },
    { key: "Gross Margin", label: "Gross Margin" },
    { key: "Sell Through", label: "Sell Through" },
    { key: "Aged Inv", label: "Aged Inv" },
    { key: "Fresh", label: "Fresh" },
  ];

  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } = useTableSearchSort(rows, {
    searchField: (r) => r.sub_category,
    sortFields: {
      Revenue: (r) => r.revenue,
      "Gross Margin": (r) => r.gm_pct ?? 0,
      "Sell Through": (r) => r.sell_through_pct ?? 0,
      "Aged Inv": (r) => r.aged_inv_pct ?? 0,
      Fresh: (r) => r.fresh_pct ?? 0,
    },
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader
        title={
          <>
            {segment} <TableMetricsInfo metrics={["Net Revenue", "Gross Margin", "Sell Through", "Aged Inv", "Fresh"]} />
          </>
        }
        actions={
          <TableToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search sub-categories..."
            sortColumns={sortColumns}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={(k, d) => {
              setSortKey(k);
              setSortDir(d);
            }}
          />
        }
      />

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full table-fixed text-sm min-w-[640px]">
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {headers.map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "py-2 font-medium text-gray-500 text-xs whitespace-nowrap align-bottom px-3",
                    i < 2 ? "text-left" : "text-right",
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
            {filteredRows.map((r, rowIdx) => {
              const brandLabel = brandsCellValue(r);
              return (
                <tr key={`${r.sub_category}-${rowIdx}`} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 px-3 font-medium text-gray-900 align-top">{r.sub_category}</td>
                  <td
                    className="py-2.5 px-3 text-sm text-gray-700 max-w-[240px] truncate align-top"
                    title={brandLabel || undefined}
                  >
                    {brandLabel ? brandLabel : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-700 align-top tabular-nums whitespace-nowrap">
                    {formatCurrency(r.revenue)}
                  </td>
                  <td className={cn("py-2.5 px-3 text-right align-top tabular-nums whitespace-nowrap", ragToTextClass(classifyRag(r.gm_pct ?? NaN, thresholds.get("grossMargin") ?? null)))}>
                    {formatPctCell(r.gm_pct)}
                  </td>
                  <td className={cn("py-2.5 px-3 text-right align-top tabular-nums whitespace-nowrap", ragToTextClass(classifyRag(r.sell_through_pct ?? NaN, thresholds.get("avgSellThrough") ?? null)))}>
                    {formatIntPctCell(r.sell_through_pct)}
                  </td>
                  <td className={cn("py-2.5 px-3 text-right align-top tabular-nums whitespace-nowrap", ragToTextClass(classifyRag(r.aged_inv_pct ?? NaN, thresholds.get("agedInventory") ?? null)))}>
                    {formatIntPctCell(r.aged_inv_pct)}
                  </td>
                  <td className={cn("py-2.5 px-3 text-right align-top tabular-nums whitespace-nowrap", ragToTextClass(classifyRag(r.fresh_pct ?? NaN, thresholds.get("freshPercent") ?? null)))}>
                    {formatIntPctCell(r.fresh_pct)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list with tappable brands row */}
      <div className="md:hidden space-y-2">
        {filteredRows.map((r, rowIdx) => (
          <CategoryMobileCard key={`${r.sub_category}-${rowIdx}`} row={r} onBrandsClick={onBrandsClick} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composed Categories Section
// ---------------------------------------------------------------------------

export function CategoriesSection({ data }: { data?: CategoriesResponse | null }): React.ReactNode {
  const [brandSheet, setBrandSheet] = useState<{ subCategory: string; brands: string[] } | null>(null);
  const [activeSegment, setActiveSegment] = useState(ALL_SEGMENTS);
  const isMobile = useIsMobile();

  function handleBrandsClick(row: CategoryPodRow): void {
    const brands = parseBrands(row);
    if (brands.length > 0) {
      setBrandSheet({ subCategory: row.sub_category, brands });
    }
  }

  // Build segment keys + pill options from API data
  const { segmentKeys, pillOptions, hasAny } = useMemo(() => {
    if (!data) return { segmentKeys: [] as string[], pillOptions: [] as { value: string; label: string }[], hasAny: 0 };
    const pods = data.category_pods && typeof data.category_pods === "object" ? data.category_pods : {};
    const keys = sortSegmentKeys(Object.keys(pods).filter((k) => (pods[k]?.length ?? 0) > 0));
    const total = keys.reduce((acc, k) => acc + (pods[k]?.length ?? 0), 0);
    const options = [...keys.map((k) => ({ value: k, label: k })), { value: ALL_SEGMENTS, label: "All" }];
    return { segmentKeys: keys, pillOptions: options, hasAny: total };
  }, [data]);

  if (!data) {
    return (
      <EmptyState
        title="No categories data"
        description="Connect the Categories API to view category pods."
        variant="neutral"
      />
    );
  }

  if (hasAny === 0) {
    return (
      <EmptyState
        title="No category detail"
        description="No category pod data was returned for this period."
        variant="neutral"
      />
    );
  }

  const pods = data.category_pods as Record<string, CategoryPodRow[]>;
  const isAllView = activeSegment === ALL_SEGMENTS;

  return (
    <>
      {/* Mobile segment pills */}
      {isMobile && segmentKeys.length > 1 && (
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 mb-3">
          <div className="flex items-center gap-2 w-max">
            {pillOptions.map((opt) => {
              const isActive = activeSegment === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setActiveSegment(opt.value)}
                  className={cn(
                    "h-9 px-4 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                    isActive ? "bg-primary/10 text-primary" : "bg-white text-gray-600 border border-gray-200",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {isAllView ? (
          /* "All" — grouped by segment with containers (desktop always, mobile when "All" selected) */
          segmentKeys.map((seg) => (
            <CategorySegmentTableApi key={seg} segment={seg} rows={pods[seg]!} onBrandsClick={handleBrandsClick} />
          ))
        ) : (
          /* Specific segment — desktop: table, mobile: flat cards without container */
          <>
            {/* Desktop: still show the table */}
            <div className="hidden md:block">
              <CategorySegmentTableApi
                segment={activeSegment}
                rows={pods[activeSegment] ?? []}
                onBrandsClick={handleBrandsClick}
              />
            </div>
            {/* Mobile: flat cards, no segment wrapper */}
            <div className="md:hidden space-y-2">
              {(pods[activeSegment] ?? []).map((r, rowIdx) => (
                <CategoryMobileCard key={`${r.sub_category}-${rowIdx}`} row={r} onBrandsClick={handleBrandsClick} />
              ))}
            </div>
          </>
        )}
      </div>

      <BottomSheet
        isOpen={brandSheet !== null}
        onClose={() => setBrandSheet(null)}
        title={`Brands — ${brandSheet?.subCategory ?? ""}`}
        maxHeight="60vh"
      >
        <p className="text-xs text-gray-500 mb-3">
          {brandSheet?.brands.length} {brandSheet?.brands.length === 1 ? "brand" : "brands"} in this sub-category
        </p>
        <div className="space-y-0">
          {brandSheet?.brands.map((brand) => (
            <div key={brand} className="flex items-center gap-2.5 py-2.5 border-b border-gray-100 last:border-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-sm text-gray-900">{brand}</span>
            </div>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
