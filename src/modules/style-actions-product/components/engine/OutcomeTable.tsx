import { useState, useMemo, useCallback } from 'react';

import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell,
  FilterBar, FilterSelect, EmptyState, ListItemCard,
} from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';

import { OutcomeBadge } from './OutcomeBadge';
import { GateStepper } from './GateStepper';
import { EngineOutputDetail } from './EngineOutputDetail';
import { OUTCOME_PRIORITY } from '../../types/engine.types';

import type { EngineOutcome, EngineOutcomeRow, GradeType, LifecycleStage } from '../../types/engine.types';

// ─── Filter + sort types ──────────────────────────────────────────────

type SortKey = 'priority' | 'lifecycleAge' | 'gap';

const ALL_SENTINEL = '__all__';

const SORT_OPTIONS: readonly { value: SortKey; label: string }[] = [
  { value: 'priority', label: 'Outcome priority' },
  { value: 'lifecycleAge', label: 'Lifecycle age' },
  { value: 'gap', label: 'Gap (most behind)' },
];

const OUTCOME_OPTIONS: readonly EngineOutcome[] = [
  'LIQUIDATION', 'DISCOUNT', 'MOVE', 'HOLD TO EXIT', 'TEST CLEARANCE',
  'SUPPLY HOLD', 'HOLD', 'WAIT', 'LEAVE ALONE',
];

const GRADE_OPTIONS: readonly GradeType[] = ['Fashion', 'Ultimate', 'Core'];

const STAGE_OPTIONS: readonly LifecycleStage[] = [
  'Under min', 'Building', 'Checkpoint', 'Review', 'Exit review', 'Exit', 'Core active',
];

// ─── Helpers ──────────────────────────────────────────────────────────

function getUniqueStores(outcomes: readonly EngineOutcomeRow[]): readonly string[] {
  const stores = new Set<string>();
  for (const o of outcomes) {
    stores.add(o.storeName);
  }
  return Array.from(stores).sort();
}

function sortOutcomes(items: readonly EngineOutcomeRow[], sortKey: SortKey): readonly EngineOutcomeRow[] {
  return [...items].sort((a, b) => {
    switch (sortKey) {
      case 'priority':
        return OUTCOME_PRIORITY[a.outcome] - OUTCOME_PRIORITY[b.outcome];
      case 'lifecycleAge':
        return b.lifecycleAge - a.lifecycleAge;
      case 'gap':
        return a.gap - b.gap;
    }
  });
}

function optionHref(storeCode: string, optionCode: string): string {
  return `/style-actions-product?store=${encodeURIComponent(storeCode)}&option=${encodeURIComponent(optionCode)}`;
}

// ─── Desktop row ──────────────────────────────────────────────────────

interface OutcomeRowProps {
  readonly row: EngineOutcomeRow;
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
}

function OutcomeDesktopRow({ row, isExpanded, onToggle }: OutcomeRowProps): React.ReactNode {
  return (
    <>
      <DataTableRow
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="cursor-pointer"
      >
        <DataTableCell>
          <div className="flex items-center gap-1">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
            )}
            <Link
              to={optionHref(row.storeCode, row.optionCode)}
              className="text-xs font-medium text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {row.optionCode}
            </Link>
            <span className="text-xs text-gray-500 truncate max-w-[160px]">{row.optionName}</span>
          </div>
        </DataTableCell>
        <DataTableCell>
          <span className="text-xs text-gray-700">{row.storeName} #{row.storeCode}</span>
        </DataTableCell>
        <DataTableCell>
          <OutcomeBadge outcome={row.outcome} />
        </DataTableCell>
        <DataTableCell>
          <span className="text-xs text-gray-700 line-clamp-1">{row.actionSummary || '—'}</span>
        </DataTableCell>
        <DataTableCell className="hidden lg:table-cell">
          <span className="text-xs text-gray-700">{row.grade}</span>
        </DataTableCell>
        <DataTableCell className="hidden lg:table-cell">
          <span className="text-xs text-gray-700 tabular-nums">Day {row.lifecycleAge}</span>
          <span className="text-xs text-gray-500 ml-1">&middot; {row.lifecycleStage}</span>
        </DataTableCell>
      </DataTableRow>
      {isExpanded ? (
        <tr>
          <td colSpan={6} className="p-0">
            <div className="bg-gray-50 p-4 space-y-4 border-b border-gray-200">
              <GateStepper gates={row.gates} decidingGate={row.decidingGate} />
              <EngineOutputDetail detail={row.outputDetail} lineMetadata={row.lineMetadata} />
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────

function OutcomeMobileCard({ row, isExpanded, onToggle }: OutcomeRowProps): React.ReactNode {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <ListItemCard
        title={`${row.optionCode} · ${row.optionName}`}
        onClick={onToggle}
        selected={isExpanded}
        header={<OutcomeBadge outcome={row.outcome} />}
        headerRight={
          <span className="text-xs text-gray-500 tabular-nums">Day {row.lifecycleAge}</span>
        }
        metadata={
          <div className="space-y-0.5">
            <div className="text-xs text-gray-500">{row.storeName} #{row.storeCode}</div>
            {row.actionSummary ? (
              <div className="text-xs text-gray-700">{row.actionSummary}</div>
            ) : null}
          </div>
        }
      />
      {isExpanded ? (
        <div className="border-t border-gray-100 p-3 space-y-3">
          <div className="text-xs text-gray-500 mb-1">
            <Link
              to={optionHref(row.storeCode, row.optionCode)}
              className="text-primary hover:underline"
            >
              View observation data &rarr;
            </Link>
          </div>
          <GateStepper gates={row.gates} decidingGate={row.decidingGate} />
          <EngineOutputDetail detail={row.outputDetail} lineMetadata={row.lineMetadata} />
        </div>
      ) : null}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────

interface OutcomeTableProps {
  readonly outcomes: readonly EngineOutcomeRow[];
}

/** Outcomes table with filtering, sorting, and expandable gate stepper. */
export function OutcomeTable({ outcomes }: OutcomeTableProps): React.ReactNode {
  const isMobile = useIsMobile();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [outcomeFilter, setOutcomeFilter] = useState(ALL_SENTINEL);
  const [gradeFilter, setGradeFilter] = useState(ALL_SENTINEL);
  const [stageFilter, setStageFilter] = useState(ALL_SENTINEL);
  const [storeFilter, setStoreFilter] = useState(ALL_SENTINEL);
  const [sortKey, setSortKey] = useState<SortKey>('priority');

  const stores = useMemo(() => getUniqueStores(outcomes), [outcomes]);

  const filtered = useMemo(() => {
    let items = outcomes;
    if (outcomeFilter !== ALL_SENTINEL) {
      items = items.filter((o) => o.outcome === outcomeFilter);
    }
    if (gradeFilter !== ALL_SENTINEL) {
      items = items.filter((o) => o.grade === gradeFilter);
    }
    if (stageFilter !== ALL_SENTINEL) {
      items = items.filter((o) => o.lifecycleStage === stageFilter);
    }
    if (storeFilter !== ALL_SENTINEL) {
      items = items.filter((o) => o.storeName === storeFilter);
    }
    return sortOutcomes(items, sortKey);
  }, [outcomes, outcomeFilter, gradeFilter, stageFilter, storeFilter, sortKey]);

  const toggleRow = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const summaryText = `${filtered.length} outcome${filtered.length === 1 ? '' : 's'}`;

  return (
    <div className="space-y-3">
      {/* Filters */}
      <FilterBar>
        <FilterSelect
          placeholder="All outcomes"
          value={outcomeFilter}
          onChange={setOutcomeFilter}
          options={[
            { value: ALL_SENTINEL, label: 'All outcomes' },
            ...OUTCOME_OPTIONS.map((o) => ({ value: o, label: o })),
          ]}
        />
        <FilterSelect
          placeholder="All grades"
          value={gradeFilter}
          onChange={setGradeFilter}
          options={[
            { value: ALL_SENTINEL, label: 'All grades' },
            ...GRADE_OPTIONS.map((g) => ({ value: g, label: g })),
          ]}
        />
        <FilterSelect
          placeholder="All stages"
          value={stageFilter}
          onChange={setStageFilter}
          options={[
            { value: ALL_SENTINEL, label: 'All stages' },
            ...STAGE_OPTIONS.map((s) => ({ value: s, label: s })),
          ]}
        />
        <FilterSelect
          placeholder="All stores"
          value={storeFilter}
          onChange={setStoreFilter}
          options={[
            { value: ALL_SENTINEL, label: 'All stores' },
            ...stores.map((s) => ({ value: s, label: s })),
          ]}
        />
        <FilterSelect
          placeholder="Sort by"
          value={sortKey}
          onChange={(v) => setSortKey(v as SortKey)}
          options={SORT_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
        />
      </FilterBar>

      {/* Summary strip */}
      <p className="text-xs text-gray-500 px-1">{summaryText}</p>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <EmptyState description="No outcomes match your current filters" />
      ) : isMobile ? (
        /* Mobile: card layout */
        <div className="space-y-2">
          {filtered.map((row) => (
            <OutcomeMobileCard
              key={row.id}
              row={row}
              isExpanded={expandedId === row.id}
              onToggle={() => toggleRow(row.id)}
            />
          ))}
        </div>
      ) : (
        /* Desktop: data table */
        <DataTable minWidth="800px">
          <DataTableHeader>
            <DataTableHead>Option</DataTableHead>
            <DataTableHead>Store</DataTableHead>
            <DataTableHead>Outcome</DataTableHead>
            <DataTableHead>Action Summary</DataTableHead>
            <DataTableHead className="hidden lg:table-cell">Grade</DataTableHead>
            <DataTableHead className="hidden lg:table-cell">Lifecycle</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {filtered.map((row) => (
              <OutcomeDesktopRow
                key={row.id}
                row={row}
                isExpanded={expandedId === row.id}
                onToggle={() => toggleRow(row.id)}
              />
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
