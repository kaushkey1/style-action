/* Desktop drill-down breakdown table for the converged AOP page. Mirrors the
   dashboard DrilldownTable chrome (expand/collapse, search, sort, per-row drill
   kebab, per-column info icons) but renders rich variance cells (actual + plan +
   Δ% in variance mode) and supports nested sub-rows. */
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, ChevronsUpDown, ChevronsDownUp } from "lucide-react";
import { Button, EmptyState, InfoHeaderIcon, SectionHeader, TableToolbar, DrillMenu } from "@/components/ui";
import { useTableSearchSort } from "@/hooks/useTableSearchSort";
import { getRowDrillTargets } from "@/lib/routing";
import { cn } from "@/lib/utils";
import {
  METRIC_COLS,
  toneBg,
  toneClass,
  fmtVarPa,
  resolveGlossaryKey,
  type DrillRow,
  type GroupKey,
  type PlanActual,
} from "../data/varianceView";

interface AopDrillTableProps {
  rows: DrillRow[];
  groupKey: GroupKey;
  groupLabel: string;
  variance: boolean;
  title: string;
}

/** Cell — the actual value in target mode; in variance mode a colored variance pill
 *  (the V1 pattern) as the hero, with the underlying actual · plan figures shown
 *  directly beneath (always visible — no hover needed to discover them). */
function Cell({ pa, plan, actual, variance }: { pa: PlanActual; plan: string; actual: string; variance: boolean }) {
  if (!variance) {
    return (
      <div className="text-right">
        <span className="block tabular-nums text-gray-900">{actual}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={cn(
          "inline-block rounded-lg px-2 py-1 text-xs font-medium tabular-nums",
          toneBg[pa.tone],
          toneClass[pa.tone],
        )}
      >
        {fmtVarPa(pa)}
      </span>
      <span className="whitespace-nowrap text-xs tabular-nums text-gray-500">
        {actual} · plan {plan}
      </span>
    </div>
  );
}

const collectParentNames = (rows: DrillRow[]): string[] => rows.filter((r) => r.children?.length).map((r) => r.name);

export function AopDrillTable({ rows, groupKey, groupLabel, variance, title }: AopDrillTableProps): ReactNode {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const sortFields = useMemo(() => {
    const f: Record<string, (row: DrillRow) => number> = {};
    for (const c of METRIC_COLS) f[c.label] = (row) => row[c.key].actual;
    return f;
  }, []);

  const { search, setSearch, sortKey, sortDir, setSortKey, setSortDir, filteredRows } = useTableSearchSort(rows, {
    searchField: (r) => r.name,
    sortFields,
    defaultSortKey: "Gross Revenue",
  });

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const expandAll = useCallback(() => setExpanded(new Set(collectParentNames(rows))), [rows]);
  const collapseAll = useCallback(() => setExpanded(new Set()), []);

  const sortColumns = useMemo(() => METRIC_COLS.map((c) => ({ key: c.label, label: c.label })), []);
  const hasAnyChildren = rows.some((r) => r.children?.length);
  // Drill navigation is only meaningful for the category dimension (into sub-category detail).
  const canDrill = groupKey === "category";

  const renderRow = (r: DrillRow, depth: number): ReactNode[] => {
    const hasChildren = Boolean(r.children?.length);
    const isOpen = expanded.has(r.name);
    const out: ReactNode[] = [
      <tr
        key={`${depth}-${r.name}`}
        className={cn("group border-b border-gray-100 transition-colors", hasChildren && "cursor-pointer hover:bg-gray-50/60")}
        onClick={hasChildren ? () => toggle(r.name) : undefined}
      >
        <td className="whitespace-nowrap px-4 py-2.5 align-top text-sm">
          {/* eslint-disable-next-line no-restricted-syntax -- nested-row indentation depth is data-driven */}
          <span className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
            {hasChildren ? (
              isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <span className={cn(depth === 0 ? "font-medium text-gray-900" : "text-gray-600")}>{r.name}</span>
          </span>
        </td>
        {METRIC_COLS.map((c) => {
          const pa = r[c.key];
          const f = c.format(pa);
          return (
            <td key={c.key} className="whitespace-nowrap px-4 py-2.5 align-top">
              <Cell pa={pa} plan={f.plan} actual={f.actual} variance={variance} />
            </td>
          );
        })}
        <td className="px-2 py-2.5 text-right align-top" onClick={(e) => e.stopPropagation()}>
          {canDrill && depth === 0 && (
            <DrillMenu rowLabel={r.name} targets={getRowDrillTargets({ category: r.name, from: "aop" })} />
          )}
        </td>
      </tr>,
    ];
    if (hasChildren && isOpen) {
      for (const child of r.children ?? []) out.push(...renderRow(child, depth + 1));
    }
    return out;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <SectionHeader
        title={title}
        actions={
          <div className="flex items-center gap-2">
            {hasAnyChildren && (
              <>
                <Button variant="outline" size="sm" onClick={expandAll} aria-label="Expand all rows">
                  <ChevronsUpDown className="mr-1.5 h-4 w-4" /> Expand
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll} aria-label="Collapse all rows">
                  <ChevronsDownUp className="mr-1.5 h-4 w-4" /> Collapse
                </Button>
              </>
            )}
            <TableToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder={`Search ${groupLabel.toLowerCase()}…`}
              sortColumns={sortColumns}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortChange={(k, d) => {
                setSortKey(k);
                setSortDir(d);
              }}
            />
          </div>
        }
      />
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-y border-gray-200 text-left text-xs text-gray-500">
              <th className="px-4 py-2 font-medium">{groupLabel}</th>
              {METRIC_COLS.map((c) => (
                <th key={c.key} className="px-4 py-2 text-right font-medium">
                  <span className="inline-flex items-center justify-end gap-1">{c.label} <InfoHeaderIcon metricKey={resolveGlossaryKey(c.label)} /></span>
                </th>
              ))}
              <th className="px-2 py-2"><span className="sr-only">Drill</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={METRIC_COLS.length + 2} className="py-6">
                  <EmptyState title="No results" description={`No ${groupLabel.toLowerCase()} matching “${search}”`} className="py-6" />
                </td>
              </tr>
            ) : (
              filteredRows.flatMap((r) => renderRow(r, 0))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
