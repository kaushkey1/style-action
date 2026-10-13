import React, { useMemo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { PlanningGridRow, GridRowLevel } from '../types/aopPlanning.types';

interface QuarterlyHierarchyGridProps {
  rows: PlanningGridRow[];
  expandedRowIds: string[];
  onToggleExpand: (rowId: string) => void;
}

// Fiscal quarters (Apr-start FY) → month ids.
const QUARTERS: { key: string; label: string; months: string[] }[] = [
  { key: 'Q1', label: 'Q1 (Apr–Jun)', months: ['apr', 'may', 'jun'] },
  { key: 'Q2', label: 'Q2 (Jul–Sep)', months: ['jul', 'aug', 'sep'] },
  { key: 'Q3', label: 'Q3 (Oct–Dec)', months: ['oct', 'nov', 'dec'] },
  { key: 'Q4', label: 'Q4 (Jan–Mar)', months: ['jan', 'feb', 'mar'] },
];

const LEVEL_DEPTH: Record<GridRowLevel, number> = { total: 0, channel: 1, category: 2, store: 3 };

const LEVEL_STYLES: Record<GridRowLevel, string> = {
  total: 'bg-gray-100 font-bold text-gray-900 border-b-2 border-gray-300',
  channel: 'bg-gray-50 font-semibold text-gray-900 border-b border-gray-200',
  category: 'bg-white font-medium text-gray-800 border-b border-gray-100',
  store: 'bg-white text-gray-700 border-b border-gray-100 hover:bg-gray-50/50',
};

const DEPTH_INDENT = 20;
const BASE_PADDING = 12;

function formatCr(value: number): string {
  return `${value.toFixed(2)} Cr`;
}

function formatGrowth(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function isRowVisible(row: PlanningGridRow, expandedRowIds: string[], rows: PlanningGridRow[]): boolean {
  if (row.parentId === null) return true;
  let currentParentId: string | null = row.parentId;
  while (currentParentId !== null) {
    if (!expandedRowIds.includes(currentParentId)) return false;
    const parent = rows.find((r) => r.id === currentParentId);
    currentParentId = parent?.parentId ?? null;
  }
  return true;
}

export function QuarterlyHierarchyGrid({
  rows,
  expandedRowIds,
  onToggleExpand,
}: QuarterlyHierarchyGridProps): React.ReactNode {
  const childParentIds = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.parentId !== null) set.add(r.parentId);
    return set;
  }, [rows]);

  const visibleRows = useMemo(
    () => rows.filter((r) => isRowVisible(r, expandedRowIds, rows)),
    [rows, expandedRowIds],
  );

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full border-collapse min-w-[720px]" role="grid" aria-label="Quarterly sales plan">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="sticky left-0 z-10 bg-gray-50 min-w-[240px] px-3 py-2 text-left text-xs font-medium text-gray-500">
              Entity
            </th>
            {QUARTERS.map((q) => (
              <th
                key={q.key}
                className="px-2 py-2 text-right text-xs font-medium text-gray-500 whitespace-nowrap min-w-[100px]"
              >
                {q.label}
              </th>
            ))}
            <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 whitespace-nowrap min-w-[90px]">
              FY Total
            </th>
            <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 whitespace-nowrap min-w-[90px]">
              PY Total
            </th>
            <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 whitespace-nowrap min-w-[70px]">
              Growth
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => {
            const hasChildren = childParentIds.has(row.id);
            const isExpanded = expandedRowIds.includes(row.id);
            const depth = LEVEL_DEPTH[row.level];
            const byId = new Map(row.months.map((m) => [m.monthId, m]));
            return (
              <tr key={row.id} className={cn('text-sm', LEVEL_STYLES[row.level])}>
                <td
                  className={cn('sticky left-0 z-10 px-3 py-2', LEVEL_STYLES[row.level])}
                  // eslint-disable-next-line no-restricted-syntax -- dynamic indentation based on hierarchy depth; no Tailwind utility for computed px values
                  style={{ paddingLeft: depth * DEPTH_INDENT + BASE_PADDING }}
                >
                  <div className="flex items-center gap-1.5">
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() => onToggleExpand(row.id)}
                        className="p-0.5 rounded hover:bg-gray-200 transition-colors shrink-0"
                        aria-label={isExpanded ? `Collapse ${row.label}` : `Expand ${row.label}`}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </button>
                    ) : (
                      <span className="w-4 shrink-0" />
                    )}
                    <span className="truncate">{row.label}</span>
                  </div>
                </td>
                {QUARTERS.map((q) => {
                  const val = q.months.reduce((sum, mid) => sum + (byId.get(mid)?.value ?? 0), 0);
                  return (
                    <td key={q.key} className="px-2 py-2 text-right text-sm tabular-nums whitespace-nowrap">
                      {formatCr(val)}
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-right text-sm font-bold tabular-nums whitespace-nowrap">
                  {formatCr(row.fyTotal)}
                </td>
                <td className="px-2 py-2 text-right text-sm tabular-nums whitespace-nowrap text-gray-500">
                  {row.priorYearTotal > 0 ? formatCr(row.priorYearTotal) : '—'}
                </td>
                <td
                  className={cn(
                    'px-2 py-2 text-right text-sm tabular-nums whitespace-nowrap',
                    row.growthPct >= 0 ? 'text-green-700' : 'text-red-700',
                  )}
                >
                  {formatGrowth(row.growthPct)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
