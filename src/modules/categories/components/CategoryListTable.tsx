import { ChevronRight } from "lucide-react";
import {
  Badge,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  SectionHeader,
  TableToolbar,
} from "@/components/ui";
import { cn, ragBadgeVariant, ragLabel } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useTableSearchSort } from "@/hooks/useTableSearchSort";
import { AOPMobileCard } from "@/modules/aop/components/AOPMobileCard";
import type { CategoryListRow } from "../api/categoriesAdapters";

interface CategoryListTableProps {
  rows: CategoryListRow[];
  onSelect: (row: CategoryListRow) => void;
  /** Desktop only — rendered on the same row as the sort control. */
  title?: string;
}

const ZERO_SALE_ALERT_PCT = 80;

// Desktop table sort — canonical TableToolbar pattern. Net Revenue uses the
// revenue-share % (monotonic with net revenue); nulls sink to the bottom via -Infinity.
const SORT_COLUMNS = [
  { key: "Net Revenue", label: "Net Revenue" },
  { key: "GM%", label: "GM%" },
  { key: "Var to plan", label: "Var to plan" },
  { key: "Zero Sale", label: "Zero Sale" },
  { key: "Actions", label: "Actions" },
];
const SORT_FIELDS: Record<string, (r: CategoryListRow) => number> = {
  "Net Revenue": (r) => r.revenueSharePct,
  "GM%": (r) => r.gmPct ?? -Infinity,
  "Var to plan": (r) => r.variancePct ?? -Infinity,
  "Zero Sale": (r) => r.zeroSalePct ?? -Infinity,
  "Actions": (r) => r.actionCount ?? -Infinity,
};

export function CategoryListTable({
  rows,
  onSelect,
  title,
}: CategoryListTableProps): React.ReactNode {
  const isMobile = useIsMobile();
  // Desktop table self-sorts via the column picker (mobile sorts via the filter
  // sheet, so the mobile branch renders the rows in the order passed in).
  const { sortKey, sortDir, setSortKey, setSortDir, filteredRows } =
    useTableSearchSort(rows, {
      searchField: (r) => r.name,
      sortFields: SORT_FIELDS,
      defaultSortKey: "Net Revenue",
      defaultSortDir: "desc",
    });

  if (isMobile) {
    // One card per category, matching the dashboard's category cards (AOPMobileCard):
    // title + RAG badge + chevron header, then a 2-column grid of label-above-value
    // metric pairs. Semantic colour is retained on the values that drive intervention.
    return (
      <div className="space-y-3">
        {rows.map((row) => (
          <AOPMobileCard
            key={row.rawName}
            title={row.name}
            badge={
              <Badge variant={ragBadgeVariant(row.status)} size="sm">
                {ragLabel(row.status)}
              </Badge>
            }
            metrics={[
              { label: "Net Revenue", value: row.revenueFormatted },
              { label: "GM%", value: row.gmPctFormatted },
              {
                label: "Var to plan",
                value: (
                  <span
                    className={cn(
                      row.variancePct === null
                        ? "text-gray-400"
                        : row.variancePct >= 0
                          ? "text-green-600"
                          : "text-red-600",
                    )}
                  >
                    {row.varianceFormatted}
                  </span>
                ),
              },
              {
                label: "Zero Sale",
                value:
                  row.zeroSalePct !== null &&
                  row.zeroSalePct >= ZERO_SALE_ALERT_PCT ? (
                    <span className="text-red-600">{row.zeroSaleFormatted}</span>
                  ) : (
                    row.zeroSaleFormatted
                  ),
              },
              {
                label: "Actions",
                value: row.actionCount != null ? String(row.actionCount) : "—",
              },
            ]}
            onClick={() => onSelect(row)}
          />
        ))}
      </div>
    );
  }

  const sortControl = (
    <TableToolbar
      sortColumns={SORT_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(k, d) => {
        setSortKey(k);
        setSortDir(d);
      }}
      className="w-auto"
    />
  );

  return (
    <div className="space-y-3">
      {title ? (
        <SectionHeader title={title} actions={sortControl} />
      ) : (
        <div className="flex justify-end">{sortControl}</div>
      )}
      <DataTable minWidth="800px" className="[&_table]:text-sm">
        <DataTableHeader>
          <DataTableHead>Category</DataTableHead>
          <DataTableHead>Status</DataTableHead>
          <DataTableHead>Net Revenue</DataTableHead>
          <DataTableHead>GM%</DataTableHead>
          <DataTableHead>Var to plan</DataTableHead>
          <DataTableHead>Zero Sale</DataTableHead>
          <DataTableHead>Actions</DataTableHead>
          <DataTableHead aria-label="Open category" />
        </DataTableHeader>
        <DataTableBody>
          {filteredRows.map((row) => (
            <DataTableRow
              key={row.rawName}
              className="cursor-pointer hover:bg-gray-50"
              role="button"
              tabIndex={0}
              aria-label={`Open ${row.name}`}
              onClick={() => onSelect(row)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(row);
                }
              }}
            >
              <DataTableCell>
                <span className="font-medium text-gray-900">{row.name}</span>
              </DataTableCell>
              <DataTableCell>
                <Badge variant={ragBadgeVariant(row.status)}>{ragLabel(row.status)}</Badge>
              </DataTableCell>
              <DataTableCell>{row.revenueFormatted}</DataTableCell>
              <DataTableCell>{row.gmPctFormatted}</DataTableCell>
              <DataTableCell>
                <span
                  className={cn(
                    "font-medium",
                    row.variancePct === null
                      ? "text-gray-400"
                      : row.variancePct >= 0
                        ? "text-green-600"
                        : "text-red-600",
                  )}
                >
                  {row.varianceFormatted}
                </span>
              </DataTableCell>
              <DataTableCell className="text-gray-500">
                {row.zeroSaleFormatted}
              </DataTableCell>
              <DataTableCell className="text-gray-500">
                {row.actionCount != null ? row.actionCount : "—"}
              </DataTableCell>
              <DataTableCell className="!text-right">
                <ChevronRight className="inline-block w-4 h-4 text-gray-400" />
              </DataTableCell>
            </DataTableRow>
          ))}
        </DataTableBody>
      </DataTable>
    </div>
  );
}
