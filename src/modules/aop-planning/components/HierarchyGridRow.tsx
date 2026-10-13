import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Pin, PieChart, CalendarClock, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GuardrailChip } from './GuardrailChip';
import { PLAN_MONTHS } from '../data/mockChannels';

import type { PlanningGridRow, GridRowLevel } from '../types/aopPlanning.types';

interface HierarchyGridRowProps {
  row: PlanningGridRow;
  isExpanded: boolean;
  hasChildren: boolean;
  depth: number;
  isReadOnly: boolean;
  isGolyExpanded?: boolean;
  onToggleExpand: () => void;
  onToggleGoly?: () => void;
  onCellEdit: (monthId: string, value: number) => void;
  onPinCell: (monthId: string) => void;
  onSelectNewStore?: () => void;
  onEditCategory?: () => void;
  onViewPriorYear?: () => void;
}

const LEVEL_STYLES: Record<GridRowLevel, string> = {
  total: 'bg-gray-100 font-bold text-gray-900 border-b-2 border-gray-300',
  channel: 'bg-gray-50 font-semibold text-gray-900 border-b border-gray-200',
  category: 'bg-white font-medium text-gray-800 border-b border-gray-100',
  store: 'bg-white text-gray-700 border-b border-gray-100 hover:bg-gray-50/50',
};

const DEPTH_INDENT = 20;
const BASE_PADDING = 12;

function formatCrValue(value: number): string {
  return `${value.toFixed(2)} Cr`;
}

function formatGrowthPct(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function HierarchyGridRow({
  row,
  isExpanded,
  hasChildren,
  depth,
  isReadOnly,
  isGolyExpanded = false,
  onToggleExpand,
  onToggleGoly,
  onCellEdit,
  onPinCell,
  onSelectNewStore,
  onEditCategory,
  onViewPriorYear,
}: HierarchyGridRowProps): React.ReactNode {
  const [editingMonthId, setEditingMonthId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingMonthId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingMonthId]);

  const isEditable = !isReadOnly && (row.level === 'store' || row.level === 'channel');
  const paddingLeft = depth * DEPTH_INDENT + BASE_PADDING;
  // Store rows carry the code in their id: "st:{channel}:{code}". Only show it
  // when it adds information (i.e. the code differs from the displayed name).
  const rawStoreCode = row.level === 'store' ? row.id.split(':').slice(2).join(':') : '';
  const storeCode =
    rawStoreCode && rawStoreCode.trim().toLowerCase() !== row.label.trim().toLowerCase()
      ? rawStoreCode
      : '';

  const handleStartEdit = useCallback((monthId: string, currentValue: number) => {
    if (!isEditable) return;
    setEditingMonthId(monthId);
    setEditValue(currentValue.toFixed(2));
  }, [isEditable]);

  const handleCommitEdit = useCallback((monthId: string) => {
    const numValue = parseFloat(editValue);
    const current = row.months.find((m) => m.monthId === monthId)?.value;
    // Only treat it as an edit when the value actually changed. Clicking into a cell and
    // committing the same value must not fire a save/redistribution or mark the plan dirty.
    const changed = current === undefined || Math.abs(numValue - current) >= 0.005;
    if (!Number.isNaN(numValue) && changed) {
      onCellEdit(monthId, numValue);
    }
    setEditingMonthId(null);
    setEditValue('');
  }, [editValue, onCellEdit, row.months]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, monthId: string) => {
    if (e.key === 'Enter') {
      handleCommitEdit(monthId);
    } else if (e.key === 'Escape') {
      setEditingMonthId(null);
      setEditValue('');
    }
  }, [handleCommitEdit]);

  const h1Months = PLAN_MONTHS.filter((m) => m.season === 'H1');
  const h2Months = PLAN_MONTHS.filter((m) => m.season === 'H2');

  const renderMonthCell = (monthId: string, index: number): React.ReactNode => {
    const cell = row.months[index];
    if (!cell) return null;

    const isEditing = editingMonthId === monthId;
    const isActual = cell.isActual ?? false;
    const generated = cell.generated ?? cell.value;
    // Actual months display real sales and are read-only; planned months show working.
    const headline = isActual ? (cell.actual ?? cell.value) : cell.value;
    const cellEditable = isEditable && !isActual;
    const showGen = !isActual && Math.abs(generated - cell.value) > 0.01;

    return (
      <td
        key={monthId}
        className={cn(
          'px-2 py-1.5 text-right text-sm tabular-nums whitespace-nowrap align-top',
          cell.isEdited && 'border-l-2 border-l-blue-400',
          isActual && 'bg-green-50/60',
          cellEditable && !isEditing && 'cursor-pointer hover:bg-blue-50/50 group/cell',
        )}
        onClick={isEditing || !cellEditable ? undefined : () => handleStartEdit(monthId, cell.value)}
        onKeyDown={(e) => {
          if (!isEditing && cellEditable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleStartEdit(monthId, cell.value);
          }
        }}
        tabIndex={cellEditable ? 0 : undefined}
        role={cellEditable ? 'gridcell' : undefined}
        aria-label={cellEditable ? `Edit ${monthId} value: ${formatCrValue(cell.value)}` : undefined}
      >
        {isEditing ? (
          /* eslint-disable-next-line no-restricted-syntax -- inline cell editor requires minimal input; UI Input adds labels/margins unsuitable for table cells */
          <input
            ref={editInputRef}
            type="number"
            step="0.01"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleCommitEdit(monthId)}
            onKeyDown={(e) => handleKeyDown(e, monthId)}
            className="w-full text-right text-sm border-0 bg-blue-50 focus:ring-1 focus:ring-primary rounded px-1 py-0.5 tabular-nums"
            aria-label={`Value for ${monthId}`}
          />
        ) : (
          <div className="flex flex-col items-end leading-tight">
            <span className="relative inline-flex items-center gap-1">
              {cell.isPinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
              <span className={cn(isActual && 'text-green-700 font-medium')}>
                {headline.toFixed(2)}
              </span>
              {isActual && <span className="text-[10px] text-green-600 font-semibold">A</span>}
              {cellEditable && (
                <Pin
                  className="w-3 h-3 text-gray-400 opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPinCell(monthId);
                  }}
                  aria-hidden="true"
                />
              )}
            </span>
            {showGen && (
              <span className="text-[10px] text-gray-400">G {generated.toFixed(2)}</span>
            )}
            {cell.priorYear > 0 && (
              <span className="text-[10px] text-gray-400">LY {cell.priorYear.toFixed(2)}</span>
            )}
          </div>
        )}
      </td>
    );
  };

  const goly = row.golyDetail;
  const canGoly = !!goly && !!onToggleGoly;
  const golySign = (row.golyPct ?? 0) >= 0 ? '+' : '';

  return (
    <>
    <tr className={cn(LEVEL_STYLES[row.level])}>
      {/* Sticky left cell */}
      <td
        className={cn(
          'sticky left-0 z-10 min-w-[240px] py-2 pr-3',
          row.level === 'total' && 'bg-gray-100',
          row.level === 'channel' && 'bg-gray-50',
          (row.level === 'category' || row.level === 'store') && 'bg-white',
        )}
        // eslint-disable-next-line no-restricted-syntax -- dynamic indentation based on hierarchy depth; no Tailwind utility for computed px values
        style={{ paddingLeft }}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button
              type="button"
              onClick={onToggleExpand}
              className="p-0.5 rounded hover:bg-gray-200 transition-colors shrink-0"
              aria-label={isExpanded ? `Collapse ${row.label}` : `Expand ${row.label}`}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <span className="w-5 shrink-0" aria-hidden="true" />
          )}

          <span className="truncate">
            {row.label}
            {storeCode && <span className="text-gray-400"> ({storeCode})</span>}
          </span>

          {row.isNewStore && onSelectNewStore && (
            <button
              type="button"
              onClick={onSelectNewStore}
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium',
                'text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors',
              )}
              aria-label={`View new store projection variance for ${row.label}`}
            >
              {row.growthPct !== 0 && (
                <>
                  {'Δ'}
                  {Math.abs(row.growthPct).toFixed(0)}%
                  {row.growthPct < 0 ? ' ▾' : ' ▴'}
                </>
              )}
            </button>
          )}

          {row.level === 'store' && row.categoryAllocations.length > 0 && onEditCategory && (
            <button
              type="button"
              onClick={onEditCategory}
              className="p-0.5 rounded hover:bg-gray-200 transition-colors shrink-0"
              aria-label={`Edit category allocation for ${row.label}`}
            >
              <PieChart className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}

          {row.level === 'store' && onViewPriorYear && (
            <button
              type="button"
              onClick={onViewPriorYear}
              className="p-0.5 rounded hover:bg-gray-200 transition-colors shrink-0"
              aria-label={`View last year's sales for ${row.label}`}
            >
              <CalendarClock className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}

          {canGoly && (
            <button
              type="button"
              onClick={onToggleGoly}
              className={cn(
                'p-0.5 rounded hover:bg-gray-200 transition-colors shrink-0',
                isGolyExpanded && 'bg-indigo-50',
              )}
              aria-label={isGolyExpanded ? `Hide GOLY for ${row.label}` : `Show GOLY for ${row.label}`}
              aria-expanded={isGolyExpanded}
            >
              <Percent className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}

        </div>
      </td>

      {/* H1 months */}
      {h1Months.map((month) => renderMonthCell(month.id, month.index))}

      {/* Season divider */}
      <td className="w-0.5 bg-gray-300 p-0" aria-hidden="true" />

      {/* H2 months */}
      {h2Months.map((month) => renderMonthCell(month.id, month.index))}

      {/* Generated AOP */}
      <td className="px-2 py-2 text-right text-sm tabular-nums whitespace-nowrap min-w-[80px] text-gray-500">
        {formatCrValue(row.generatedTotal ?? row.fyTotal)}
      </td>

      {/* Working AOP (FY Total) */}
      <td className="px-2 py-2 text-right text-sm font-bold tabular-nums whitespace-nowrap min-w-[80px]">
        {formatCrValue(row.fyTotal)}
      </td>

      {/* Latest Estimate (YTD actual + planned remainder) */}
      <td className="px-2 py-2 text-right text-sm tabular-nums whitespace-nowrap min-w-[90px] text-gray-700">
        {formatCrValue(row.latestEstimate ?? row.fyTotal)}
      </td>

      {/* LY (PY Total) */}
      <td className="px-2 py-2 text-right text-sm tabular-nums whitespace-nowrap min-w-[80px] text-gray-500">
        {row.priorYearTotal > 0 ? formatCrValue(row.priorYearTotal) : '—'}
      </td>

      {/* GOLY */}
      <td
        className={cn(
          'px-2 py-2 text-right text-sm font-medium tabular-nums whitespace-nowrap min-w-[70px]',
          (row.golyPct ?? 0) > 0 && 'text-green-700',
          (row.golyPct ?? 0) < 0 && 'text-red-700',
          (row.golyPct ?? 0) === 0 && 'text-gray-500',
        )}
      >
        {row.priorYearTotal > 0 ? formatGrowthPct(row.golyPct ?? 0) : '—'}
      </td>

      {/* Growth */}
      <td
        className={cn(
          'px-2 py-2 text-right text-sm font-medium tabular-nums whitespace-nowrap min-w-[60px]',
          row.growthPct > 0 && 'text-green-700',
          row.growthPct < 0 && 'text-red-700',
          row.growthPct === 0 && 'text-gray-700',
        )}
      >
        {row.isNewStore ? 'NEW' : formatGrowthPct(row.growthPct)}
      </td>

      {/* Guardrail chip */}
      <td className="px-2 py-2 text-center whitespace-nowrap min-w-[90px]">
        <GuardrailChip
          status={row.guardrailStatus}
          growthPct={row.growthPct}
          compact
        />
      </td>
    </tr>

    {canGoly && isGolyExpanded && goly && (
      <tr className="bg-indigo-50/40 border-b border-indigo-100 text-xs text-gray-600">
        <td
          className="sticky left-0 z-10 bg-indigo-50/40 py-1.5 pr-3 italic"
          // eslint-disable-next-line no-restricted-syntax -- dynamic indentation matches the parent row depth
          style={{ paddingLeft: paddingLeft + DEPTH_INDENT }}
        >
          Growth over last year (GOLY)
        </td>
        {h1Months.map((m) => {
          const g = goly.months.find((x) => x.monthId === m.id);
          return (
            <td key={m.id} className="px-2 py-1.5 text-right tabular-nums">
              {g && g.golyPct !== 0 ? formatGrowthPct(g.golyPct) : '—'}
            </td>
          );
        })}
        <td className="w-0.5 bg-gray-300 p-0" aria-hidden="true" />
        {h2Months.map((m) => {
          const g = goly.months.find((x) => x.monthId === m.id);
          return (
            <td key={m.id} className="px-2 py-1.5 text-right tabular-nums">
              {g && g.golyPct !== 0 ? formatGrowthPct(g.golyPct) : '—'}
            </td>
          );
        })}
        {/* Generated col (n/a) */}
        <td className="px-2 py-1.5 text-right text-gray-400">—</td>
        {/* Working col → YTD actual */}
        <td className="px-2 py-1.5 text-right tabular-nums" title="YTD actual">
          YTD {formatCrValue(goly.ytdActual)}
        </td>
        {/* Latest Est col → planned remainder */}
        <td className="px-2 py-1.5 text-right tabular-nums" title="Planned remainder">
          Plan {formatCrValue(goly.plannedRemainder)}
        </td>
        {/* LY col */}
        <td className="px-2 py-1.5 text-right tabular-nums text-gray-500">
          {formatCrValue(goly.priorYearTotal)}
        </td>
        {/* GOLY col */}
        <td className="px-2 py-1.5 text-right font-medium tabular-nums">
          {golySign}
          {(row.golyPct ?? 0).toFixed(1)}%
        </td>
        <td />
        <td />
      </tr>
    )}
    </>
  );
}
