import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Minus, TrendingDown, ChevronsDown, Download, CheckCircle2, RefreshCw } from 'lucide-react';
import { Badge, Button, PageHeader, Pagination, usePagination, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell, SectionHeader, FilterBar, FilterSelect, EmptyState } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import { mockCarryoverStyles, carryoverSummary } from '../data/mockCarryoverStyles';
import type { CarryoverDecision } from '../data/mockRangePlans';
import { useFilters } from '@/hooks/useFilters';

const decisionBadge: Record<CarryoverDecision, { variant: 'success' | 'warning' | 'error' | 'default'; label: string }> = {
  continue: { variant: 'success', label: 'Continue' },
  refresh: { variant: 'warning', label: 'Refresh' },
  exit: { variant: 'error', label: 'Exit' },
  undecided: { variant: 'default', label: 'Undecided' },
};

const rosTrendConfig: Record<'growing' | 'stable' | 'declining' | 'sharp-decline', { icon: React.ReactNode; color: string; label: string }> = {
  growing: {
    icon: <TrendingUp className="w-3 h-3" />,
    color: 'text-green-600',
    label: 'Growing',
  },
  stable: {
    icon: <Minus className="w-3 h-3" />,
    color: 'text-gray-500',
    label: 'Stable',
  },
  declining: {
    icon: <TrendingDown className="w-3 h-3" />,
    color: 'text-yellow-600',
    label: 'Declining',
  },
  'sharp-decline': {
    icon: <ChevronsDown className="w-3 h-3" />,
    color: 'text-red-600',
    label: 'Sharp Decline',
  },
};

const decisionRowBorder: Record<CarryoverDecision, string> = {
  continue: 'border-l-success',
  refresh: 'border-l-warning',
  exit: 'border-l-error',
  undecided: 'border-l-gray-300 border-dashed',
};

const decisionRowBg: Record<CarryoverDecision, string> = {
  continue: '',
  refresh: '',
  exit: '',
  undecided: '',
};

function SellThroughBar({ pct }: { pct: number }) {
  const color = pct >= 60 ? 'bg-success' : pct >= 40 ? 'bg-warning' : 'bg-error';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        {/* eslint-disable-next-line no-restricted-syntax -- dynamic width */}
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-900 tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

// ─── Filters ──────────────────────────────────────────────────────────────────

type SellThroughFilter = 'all' | '>60' | '40-60' | '<40';
type SegmentFilter = 'all' | 'MC' | 'MF' | 'WIW' | 'WWW' | 'KW' | 'FW' | 'NA';

// ─── Component ────────────────────────────────────────────────────────────────

export function CarryoverDecisionPage() {
  const [sellThroughFilter, setSellThroughFilter] = useState<SellThroughFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Apply custom sellThrough filter first
  const sellThroughFiltered = mockCarryoverStyles.filter((s) => {
    if (sellThroughFilter === '>60' && s.sellThrough90d <= 60) return false;
    if (sellThroughFilter === '40-60' && (s.sellThrough90d < 40 || s.sellThrough90d > 60)) return false;
    if (sellThroughFilter === '<40' && s.sellThrough90d >= 40) return false;
    return true;
  });

  // Then apply standard filters
  const filters = useFilters(sellThroughFiltered, { decision: 'all', segmentId: 'all' });
  const filteredStyles = filters.results;

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sortedStyles = useMemo(() => {
    if (!sortKey) return filteredStyles;
    return [...filteredStyles].sort((a, b) => {
      const aVal = a[sortKey as keyof typeof a];
      const bVal = b[sortKey as keyof typeof b];
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredStyles, sortKey, sortDir]);

  const { totalPages, totalItems, pageSize, getPageItems } = usePagination(sortedStyles, 15);
  const pageItems = getPageItems(currentPage);

  // Reset page when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset pagination when filters change
    setCurrentPage(1);
  }, [filters.filters.decision, sellThroughFilter, filters.filters.segmentId, sortKey, sortDir]);

  const { freedCapacity, freedAllocation } = carryoverSummary;

  return (
    <div className="animate-fadeInUp">
      <PageHeader
        title="Carryover Decisions"
        backTo={{ label: 'Range', path: '/range' }}
        badges={<span className="text-xs text-gray-500">POD: MW Pod 1 (Shirts)</span>}
      />

      {/* Filters */}
      <FilterBar>
        <FilterSelect
          value={filters.filters.decision}
          onChange={(v) => filters.setFilter('decision', v as CarryoverDecision | 'all')}
          placeholder="Decision"
          options={[
            { value: 'all', label: 'All Decisions' },
            { value: 'continue', label: 'Continue' },
            { value: 'refresh', label: 'Refresh' },
            { value: 'exit', label: 'Exit' },
            { value: 'undecided', label: 'Undecided' },
          ]}
          searchable
        />
        <FilterSelect
          value={sellThroughFilter}
          onChange={(v) => setSellThroughFilter(v as SellThroughFilter)}
          placeholder="Sell-through"
          options={[
            { value: 'all', label: 'All Sell-through' },
            { value: '>60', label: '>60%' },
            { value: '40-60', label: '40-60%' },
            { value: '<40', label: '<40%' },
          ]}
          searchable
        />
        <FilterSelect
          value={filters.filters.segmentId}
          onChange={(v) => filters.setFilter('segmentId', v as SegmentFilter)}
          placeholder="Segment"
          options={[
            { value: 'all', label: 'All Segments' },
            { value: 'MC', label: 'MC' },
            { value: 'MF', label: 'MF' },
            { value: 'WIW', label: 'WIW' },
            { value: 'WWW', label: 'WWW' },
            { value: 'KW', label: 'KW' },
            { value: 'FW', label: 'FW' },
            { value: 'NA', label: 'NA' },
          ]}
          searchable
        />
        <span className="ml-auto text-xs text-gray-500">
          {filteredStyles.length} of {mockCarryoverStyles.length} styles
        </span>
      </FilterBar>

      <p className="text-xs text-gray-500 px-1 mb-3">
        {filteredStyles.length} styles &middot; {filteredStyles.filter(s => s.decision === 'continue').length} continue &middot; {filteredStyles.filter(s => s.decision === 'refresh').length} refresh &middot; {filteredStyles.filter(s => s.decision === 'exit').length} exit &middot; {filteredStyles.filter(s => s.decision === 'undecided').length} undecided
      </p>

      {/* Style Decisions Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
        <DataTable className="[&_table]:text-sm">
          <DataTableHeader className="bg-gray-50">
            <DataTableHead className="w-1 !px-0" />
            <DataTableHead className="px-4 py-2.5">Style</DataTableHead>
            <DataTableHead className="px-4 py-2.5">Sub-cat</DataTableHead>
            <DataTableHead className="px-4 py-2.5 w-36 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('sellThrough90d')}>
              Sell-thru (90d) {sortKey === 'sellThrough90d' && (sortDir === 'asc' ? '↑' : '↓')}
            </DataTableHead>
            <DataTableHead className="px-4 py-2.5">ROS Trend</DataTableHead>
            <DataTableHead className="px-4 py-2.5 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('intakeMargin')}>
              Margin {sortKey === 'intakeMargin' && (sortDir === 'asc' ? '↑' : '↓')}
            </DataTableHead>
            <DataTableHead align="center" className="px-4 py-2.5 border-l border-gray-200 bg-gray-100/60">Decision</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {pageItems.map((style) => {
              const trend = rosTrendConfig[style.rosTrend];
              const badge = decisionBadge[style.decision];
              return (
                <DataTableRow key={style.styleId} className={cn(
                  decisionRowBg[style.decision]
                )}>
                  <DataTableCell className={cn('w-1 !px-0 border-l-3', decisionRowBorder[style.decision])} />
                  <DataTableCell className="px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{style.styleName}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{style.styleId}</p>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="px-4 py-2.5 text-xs text-gray-600">{style.subCategory}</DataTableCell>
                  <DataTableCell className="px-4 py-2.5">
                    <SellThroughBar pct={style.sellThrough90d} />
                  </DataTableCell>
                  <DataTableCell className="px-4 py-2.5">
                    <div className={cn('flex items-center gap-1 font-medium', trend.color)}>
                      {trend.icon}
                      <span className="text-xs">{trend.label}</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="px-4 py-2.5 text-sm tabular-nums">{style.intakeMargin}%</DataTableCell>
                  <DataTableCell align="center" className="px-4 py-2.5 border-l border-gray-100 bg-gray-50/40">
                    <Badge variant={badge.variant} className="font-semibold">{badge.label}</Badge>
                  </DataTableCell>
                </DataTableRow>
              );
            })}
            {filteredStyles.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyState description="No styles match the selected filters" />
                </td>
              </tr>
            )}
          </DataTableBody>
        </DataTable>

        {/* Pagination */}
        {filteredStyles.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              pageSize={pageSize}
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50">
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Override Selected
          </Button>
          <Button variant="outline" size="sm" disabled>
            <CheckCircle2 className="w-3 h-3 mr-1.5" />
            Confirm All Auto-decisions
          </Button>
          <Button variant="outline" size="sm" disabled className="ml-auto">
            <Download className="w-3 h-3 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Freed Capacity */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Freed Capacity from Exits" />
        <div className="grid grid-cols-2 gap-3">
          {/* Left: Freed capacity metrics */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium mb-2">
              {freedCapacity.optionSlots} exited options free:
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {freedCapacity.optionSlots.toLocaleString()} option slots across {freedCapacity.storesAffected.toLocaleString()} stores
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {freedCapacity.fixturePositions.toLocaleString()} fixture positions ({freedCapacity.optionSlots} x 8 depth)
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {formatCurrency(freedCapacity.otbFreed)} OTB freed for new fashion options
            </div>
          </div>

          {/* Right: Allocation breakdown */}
          <div>
            <p className="text-xs text-gray-500 font-medium mb-2">Allocation Breakdown</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="font-medium">{freedAllocation.newFashion}</span> slots for new fashion
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                <span className="font-medium">{freedAllocation.competitiveGapFilling}</span> slots for competitive gap-filling
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="font-medium">{freedAllocation.deeperStock}</span> slots for deeper stock on top performers
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
