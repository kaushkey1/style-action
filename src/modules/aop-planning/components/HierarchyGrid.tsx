import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MonthColumnHeaders } from './MonthColumnHeaders';
import { HierarchyGridRow } from './HierarchyGridRow';

import type { PlanningGridRow, GridRowLevel } from '../types/aopPlanning.types';

interface HierarchyGridProps {
  rows: PlanningGridRow[];
  expandedRowIds: string[];
  expandedGolyRowIds?: string[];
  isReadOnly: boolean;
  onToggleExpand: (rowId: string) => void;
  onToggleGoly?: (rowId: string) => void;
  onCellEdit: (rowId: string, monthId: string, value: number) => void;
  onPinCell: (rowId: string, monthId: string) => void;
  onSelectNewStore: (storeId: string) => void;
  onEditCategory: (storeId: string) => void;
  onViewPriorYear: (rowId: string) => void;
}

const LEVEL_DEPTH: Record<GridRowLevel, number> = {
  total: 0,
  channel: 1,
  category: 2,
  store: 3,
};

function isRowVisible(row: PlanningGridRow, expandedRowIds: string[], rows: PlanningGridRow[]): boolean {
  // Root-level rows (no parent) are always visible
  if (row.parentId === null) return true;

  // Walk up the ancestor chain: every ancestor must be expanded
  let currentParentId: string | null = row.parentId;
  while (currentParentId !== null) {
    if (!expandedRowIds.includes(currentParentId)) return false;
    const parentRow = rows.find((r) => r.id === currentParentId);
    currentParentId = parentRow?.parentId ?? null;
  }
  return true;
}

export function HierarchyGrid({
  rows,
  expandedRowIds,
  expandedGolyRowIds = [],
  isReadOnly,
  onToggleExpand,
  onToggleGoly,
  onCellEdit,
  onPinCell,
  onSelectNewStore,
  onEditCategory,
  onViewPriorYear,
}: HierarchyGridProps): React.ReactNode {
  const childRowIds = useMemo(() => {
    const idSet = new Set<string>();
    for (const row of rows) {
      if (row.parentId !== null) {
        idSet.add(row.parentId);
      }
    }
    return idSet;
  }, [rows]);

  const visibleRows = useMemo(
    () => rows.filter((row) => isRowVisible(row, expandedRowIds, rows)),
    [rows, expandedRowIds],
  );

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table
        className={cn('w-full border-collapse', 'min-w-[1400px]')}
        role="grid"
        aria-label="Sales Plan hierarchy grid"
      >
        <MonthColumnHeaders />
        <tbody>
          {visibleRows.map((row) => (
            <HierarchyGridRow
              key={row.id}
              row={row}
              isExpanded={expandedRowIds.includes(row.id)}
              isGolyExpanded={expandedGolyRowIds.includes(row.id)}
              hasChildren={childRowIds.has(row.id)}
              depth={LEVEL_DEPTH[row.level]}
              isReadOnly={isReadOnly}
              onToggleExpand={() => onToggleExpand(row.id)}
              onToggleGoly={onToggleGoly ? () => onToggleGoly(row.id) : undefined}
              onCellEdit={(monthId, value) => onCellEdit(row.id, monthId, value)}
              onPinCell={(monthId) => onPinCell(row.id, monthId)}
              onSelectNewStore={row.isNewStore ? () => onSelectNewStore(row.id) : undefined}
              onEditCategory={row.level === 'store' && row.categoryAllocations.length > 0 ? () => onEditCategory(row.id) : undefined}
              onViewPriorYear={row.level === 'store' ? () => onViewPriorYear(row.id) : undefined}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
