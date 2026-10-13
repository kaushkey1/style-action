import { useMemo } from "react";
import { EmptyState, InfoHeaderIcon, SectionHeader, TableMetricsInfo, TableToolbar } from "@/components/ui";
import { useTableSearchSort } from "@/hooks/useTableSearchSort";
import { cn } from "@/lib/utils";
import { STORE_RANKINGS } from "../data/mockRegional";
import type { StoreRankingRow } from "../data/mockRegional";

// ---------------------------------------------------------------------------
// Store Rankings — Top & Bottom 5
// ---------------------------------------------------------------------------

const HEADERS = ["Rank", "Store", "City", "Score", "Rev/Sqft", "Sell Through"];

const STORE_SORT_FIELDS: Record<string, (r: StoreRankingRow) => number> = {
  "Score": (r) => parseFloat(r.score),
  "Rev/Sqft": (r) => parseFloat(r.revSqft.replace(/[^\d.-]/g, "")),
  "Sell Through": (r) => parseFloat(r.st),
};

const STORE_SORT_COLUMNS = Object.keys(STORE_SORT_FIELDS).map((k) => ({ key: k, label: k }));

/** Separator row from STORE_RANKINGS (visual divider between top & bottom 5) */
const SEPARATOR_ROW = STORE_RANKINGS.find((r) => r.isSeparator);

/** Data rows only (no separator) — stable reference for the hook */
const DATA_ROWS = STORE_RANKINGS.filter((r) => !r.isSeparator);

function StoreRow({ row }: { row: StoreRankingRow }): React.ReactNode {
  return (
    <tr className="border-b border-gray-50 last:border-0">
      <td className="py-2.5 pl-3 pr-3 text-sm font-medium text-gray-900">{row.rank}</td>
      <td className="py-2.5 pr-3 text-sm text-gray-900 font-medium">{row.store}</td>
      <td className="py-2.5 pr-3 text-sm text-gray-700">{row.city}</td>
      <td className="py-2.5 px-3 text-sm text-right tabular-nums whitespace-nowrap text-gray-700">{row.score}</td>
      <td className="py-2.5 px-3 text-sm text-right tabular-nums whitespace-nowrap text-gray-700">{row.revSqft}</td>
      <td className={cn("py-2.5 px-3 text-sm text-right tabular-nums whitespace-nowrap font-medium", row.stColor)}>
        {row.st}
      </td>
    </tr>
  );
}

export function RegionalStoreRankingsSection(): React.ReactNode {
  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(DATA_ROWS, {
      searchField: (r) => r.store,
      sortFields: STORE_SORT_FIELDS,
    });

  /** Show separator only when default order is preserved (no search or sort active) */
  const isDefaultOrder = !search && !sortKey;

  /** Split into top/bottom groups for separator insertion when in default order */
  const { topRows, bottomRows } = useMemo(() => {
    if (!isDefaultOrder) return { topRows: filteredRows, bottomRows: [] as StoreRankingRow[] };
    const sepIdx = STORE_RANKINGS.findIndex((r) => r.isSeparator);
    const topCount = sepIdx >= 0 ? sepIdx : filteredRows.length;
    return {
      topRows: filteredRows.slice(0, topCount),
      bottomRows: filteredRows.slice(topCount),
    };
  }, [filteredRows, isDefaultOrder]);

  const toolbarActions = (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search stores..."
      sortColumns={STORE_SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => { setSortKey(k); setSortDir(d); }}
    />
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title={<>Store Rankings — Top & Bottom 5 <TableMetricsInfo metrics={["Score", "Rev/Sqft", "Sell Through"]} /></>} actions={toolbarActions} />
      <div className="overflow-x-auto mt-3 -mx-4 px-4">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {HEADERS.map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "py-2.5 font-medium text-gray-500 text-xs whitespace-nowrap",
                    i <= 2 ? "text-left pl-3 pr-3" : "text-right px-3",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-1",
                      i >= 3 && "w-full justify-end",
                    )}
                  >
                    {h}
                    {i >= 3 && <InfoHeaderIcon metricKey={h} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && search ? (
              <tr>
                <td colSpan={HEADERS.length} className="py-6">
                  <EmptyState title="No results" description={`No stores matching "${search}"`} variant="neutral" className="py-6" />
                </td>
              </tr>
            ) : isDefaultOrder && SEPARATOR_ROW ? (
              <>
                {topRows.map((row) => <StoreRow key={row.rank} row={row} />)}
                <tr className="bg-gray-50/50 border-b border-gray-50">
                  <td className="py-2.5 pl-3 pr-3 text-sm font-medium text-gray-400">{SEPARATOR_ROW.rank}</td>
                  <td className="py-2.5 pr-3 text-sm text-gray-400">{SEPARATOR_ROW.store}</td>
                  <td className="py-2.5 pr-3 text-sm text-gray-400">{SEPARATOR_ROW.city}</td>
                  <td className="py-2.5 px-3 text-sm text-right tabular-nums whitespace-nowrap text-gray-400">
                    {SEPARATOR_ROW.score}
                  </td>
                  <td className="py-2.5 px-3 text-sm text-right tabular-nums whitespace-nowrap text-gray-400">
                    {SEPARATOR_ROW.revSqft}
                  </td>
                  <td className="py-2.5 px-3 text-sm text-right tabular-nums whitespace-nowrap font-medium text-gray-400">
                    {SEPARATOR_ROW.st}
                  </td>
                </tr>
                {bottomRows.map((row) => <StoreRow key={row.rank} row={row} />)}
              </>
            ) : (
              filteredRows.map((row) => <StoreRow key={row.rank} row={row} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
