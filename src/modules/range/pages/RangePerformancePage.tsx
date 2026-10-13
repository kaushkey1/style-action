import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Badge, Button, PageHeader, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell, SectionHeader, FilterBar, FilterPills, FilterSelect, MetricGrid, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';
import { mockOptionPerformance, performanceSummary } from '../data/mockOptionPerformance';
import { mockFixturePerformance } from '../data/mockFixturePerformance';
import type { OptionPerformance } from '../data/mockRangePlans';
import { POD_MW_P1, POD_MW_P2, POD_WIW_P1, POD_WWW_P3 } from '@/modules/otb/data/mockOTB';
import { useFilters } from '@/hooks/useFilters';

// ─── Color / badge maps ────────────────────────────────────────────────────

const classificationBadge: Record<OptionPerformance, { variant: 'success' | 'info' | 'error' | 'warning'; label: string }> = {
  winner: { variant: 'success', label: 'Winner' },
  strong: { variant: 'success', label: 'Strong' },
  stable: { variant: 'info', label: 'Stable' },
  weak: { variant: 'error', label: 'Weak' },
};

const actionBadge: Record<string, { variant: 'success' | 'info' | 'warning' | 'error'; label: string }> = {
  chase: { variant: 'success', label: 'Chase' },
  monitor: { variant: 'info', label: 'Monitor' },
  markdown: { variant: 'warning', label: 'Markdown' },
  remove: { variant: 'error', label: 'Remove' },
};

const fixtureActionBadge: Record<string, { variant: 'success' | 'warning' | 'info'; label: string }> = {
  keep: { variant: 'success', label: 'Keep' },
  reassign: { variant: 'warning', label: 'Reassign' },
  review: { variant: 'info', label: 'Review' },
};

// ─── Distribution KPI cards ────────────────────────────────────────────────

function DistributionCards() {
  const cards = [
    {
      label: 'Winners',
      sublabel: 'ROS > 2x',
      count: performanceSummary.winners.count,
      pct: performanceSummary.winners.pct,
      action: 'Chase',
      bg: 'bg-green-50',
      border: 'border-green-200',
      textColor: 'text-green-700',
      icon: <Star className="w-4 h-4 text-green-600 fill-green-600" />,
      badgeVariant: null as 'success' | 'warning' | 'error' | 'info' | null,
    },
    {
      label: 'Strong',
      sublabel: 'ROS 1.2-2x',
      count: performanceSummary.strong.count,
      pct: performanceSummary.strong.pct,
      action: 'Chase',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      textColor: 'text-emerald-700',
      icon: null as React.ReactNode,
      badgeVariant: 'success' as 'success' | 'warning' | 'error' | 'info' | null,
    },
    {
      label: 'Stable',
      sublabel: 'ROS 0.8-1.2x',
      count: performanceSummary.stable.count,
      pct: performanceSummary.stable.pct,
      action: 'Monitor',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      textColor: 'text-blue-700',
      icon: null as React.ReactNode,
      badgeVariant: 'info' as 'success' | 'warning' | 'error' | 'info' | null,
    },
    {
      label: 'Weak',
      sublabel: 'ROS < 0.8x',
      count: performanceSummary.weak.count,
      pct: performanceSummary.weak.pct,
      action: 'Markdown',
      bg: 'bg-red-50',
      border: 'border-red-200',
      textColor: 'text-red-700',
      icon: null as React.ReactNode,
      badgeVariant: 'error' as 'success' | 'warning' | 'error' | 'info' | null,
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <SectionHeader title="Option Performance Distribution" />
      <MetricGrid columns={4} className="mb-0">
        {cards.map((card) => (
          <div
            key={card.label}
            className={cn('rounded-lg border p-3', card.bg, card.border)}
          >
            <div className="flex items-center gap-2 mb-1">
              {card.badgeVariant ? (
                <Badge variant={card.badgeVariant} dot size="sm">{card.label}</Badge>
              ) : (
                <>{card.icon}<span className={cn('text-sm font-semibold', card.textColor)}>{card.label}</span></>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-2">{card.sublabel}</p>
            <p className={cn('text-xl font-bold', card.textColor)}>
              {card.count} <span className="text-sm font-medium">options ({card.pct}%)</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">&rarr; {card.action}</p>
          </div>
        ))}
      </MetricGrid>
    </div>
  );
}

// ─── Inline sell-through bar ──────────────────────────────────────────────

function SellThroughBar({ pct }: { pct: number }) {
  const color = pct >= 70 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-error';
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

// ─── Row border color by classification ───────────────────────────────────

const classificationRowBorder: Record<OptionPerformance, string> = {
  winner: 'border-l-success',
  strong: 'border-l-success/60',
  stable: 'border-l-primary/40',
  weak: 'border-l-error',
};

const classificationRowBg: Record<OptionPerformance, string> = {
  winner: '',
  strong: '',
  stable: '',
  weak: 'bg-red-50/40',
};

// ─── Option Performance Table ──────────────────────────────────────────────

function OptionPerformanceTable() {
  const filters = useFilters(mockOptionPerformance, { classification: 'all' });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <SectionHeader
          title="Option Performance"
          actions={
            <FilterPills
              value={filters.filters.classification}
              onChange={(v) => filters.setFilter('classification', v)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'winner', label: 'Winner' },
                { value: 'strong', label: 'Strong' },
                { value: 'stable', label: 'Stable' },
                { value: 'weak', label: 'Weak' },
              ]}
            />
          }
          className="mb-0"
        />
      </div>
      <DataTable>
          <DataTableHeader>
              <DataTableHead className="w-1 !px-0" />
              <DataTableHead>Style</DataTableHead>
              <DataTableHead>Segment</DataTableHead>
              <DataTableHead align="center">ROS Multiple</DataTableHead>
              <DataTableHead align="center">Sell-thru</DataTableHead>
              <DataTableHead align="center">Rev Share</DataTableHead>
              <DataTableHead align="center">Rev/LFT</DataTableHead>
              <DataTableHead align="center" className="pl-4 border-l border-gray-200">Classification</DataTableHead>
              <DataTableHead align="center" className="bg-gray-100/60">Action</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {filters.results.length === 0 ? (
              <tr><td colSpan={9}><EmptyState description="No options to display" /></td></tr>
            ) : filters.results.map((row) => {
              const classBadge = classificationBadge[row.classification];
              const actBadge = actionBadge[row.action] ?? { variant: 'info' as const, label: row.action };
              return (
                <DataTableRow key={row.styleId} className={classificationRowBg[row.classification]}>
                  <td className={cn('w-1 border-l-3', classificationRowBorder[row.classification])} />
                  <DataTableCell>
                    <div>
                      <span className="font-medium text-gray-900">{row.styleName}</span>
                      <span className="text-gray-400 ml-1 text-[10px]">{row.styleId}</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="text-gray-600">{row.segmentId}</DataTableCell>
                  <DataTableCell align="center">
                    <span className={cn(
                      'font-bold tabular-nums',
                      row.rosMultiple >= 2 ? 'text-green-700' :
                      row.rosMultiple >= 1.2 ? 'text-green-600' :
                      row.rosMultiple >= 0.8 ? 'text-gray-600' :
                      'text-red-600'
                    )}>
                      {row.rosMultiple.toFixed(2)}x
                    </span>
                  </DataTableCell>
                  <DataTableCell>
                    <SellThroughBar pct={row.sellThroughPct} />
                  </DataTableCell>
                  <DataTableCell align="center" className="text-gray-600 tabular-nums">{row.revenueShare.toFixed(1)}%</DataTableCell>
                  <DataTableCell align="center" className="text-gray-600 tabular-nums">
                    {'\u20B9'}{row.revenuePerLFT.toLocaleString()}
                  </DataTableCell>
                  <DataTableCell align="center" className="pl-4 border-l border-gray-100">
                    <Badge variant={classBadge.variant} className="text-[10px]">
                      {classBadge.label}
                    </Badge>
                  </DataTableCell>
                  <DataTableCell align="center" className="bg-gray-50/40">
                    <Badge variant={actBadge.variant} className="text-[10px] font-semibold">
                      {actBadge.label}
                    </Badge>
                  </DataTableCell>
                </DataTableRow>
              );
            })}
          </DataTableBody>
      </DataTable>
      <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
        Showing {filters.results.length} of {mockOptionPerformance.length} options
      </div>
    </div>
  );
}

// ─── Fixture Utilization Table ─────────────────────────────────────────────

function FixtureUtilizationTable() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <SectionHeader title="Fixture Utilization Heatmap" className="mb-0" />
      </div>
      <DataTable>
          <DataTableHeader>
              <DataTableHead>Fixture Type</DataTableHead>
              <DataTableHead className="w-36">Avg Sell-thru</DataTableHead>
              <DataTableHead align="center">Rev/LFT</DataTableHead>
              <DataTableHead align="center">Best Segment</DataTableHead>
              <DataTableHead align="center" className="bg-gray-100/60">Action</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {mockFixturePerformance.length === 0 ? (
              <tr><td colSpan={5}><EmptyState description="No fixture performance data to display" /></td></tr>
            ) : mockFixturePerformance.map((row) => {
              const faBadge = fixtureActionBadge[row.action] ?? { variant: 'info' as const, label: row.action };
              const needsAttention = row.avgSellThrough < 40;
              return (
                <DataTableRow key={row.fixtureType} className={cn(needsAttention && 'bg-red-50/30')}>
                  <DataTableCell className="font-medium text-gray-900">{row.fixtureType}</DataTableCell>
                  <DataTableCell>
                    <SellThroughBar pct={row.avgSellThrough} />
                  </DataTableCell>
                  <DataTableCell align="center" className="tabular-nums">
                    {'\u20B9'}{row.revenuePerLFT.toLocaleString()}
                  </DataTableCell>
                  <DataTableCell align="center" className="text-gray-600">{row.bestSegment}</DataTableCell>
                  <DataTableCell align="center" className="bg-gray-50/40">
                    <Badge variant={faBadge.variant} className="text-[10px] font-semibold">
                      {faBadge.label}
                    </Badge>
                  </DataTableCell>
                </DataTableRow>
              );
            })}
          </DataTableBody>
      </DataTable>
    </div>
  );
}

// ─── Rationalization Candidates ────────────────────────────────────────────

function RationalizationCandidates() {
  const candidates = mockOptionPerformance.filter(
    (o) => o.classification === 'weak' && o.action === 'remove'
  );
  const freedPositions = candidates.length * 8;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <SectionHeader
          title="Rationalization Candidates (Bottom 10%)"
          actions={<Badge variant="error" className="text-[10px]">{candidates.length} options</Badge>}
          className="mb-0"
        />
      </div>
      <DataTable>
          <DataTableHeader>
              <DataTableHead>Style</DataTableHead>
              <DataTableHead>Segment</DataTableHead>
              <DataTableHead align="center">Sell-thru%</DataTableHead>
              <DataTableHead align="center">Rev Share%</DataTableHead>
              <DataTableHead>Fixture</DataTableHead>
              <DataTableHead align="center">Action</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {candidates.length === 0 ? (
              <tr><td colSpan={6}><EmptyState description="No rationalization candidates to display" /></td></tr>
            ) : candidates.map((row) => (
              <DataTableRow key={row.styleId} className="bg-red-50/30 hover:bg-red-50/60">
                <DataTableCell className="border-l-3 border-l-error">
                  <div>
                    <span className="font-medium text-gray-900">{row.styleName}</span>
                    <span className="text-gray-400 ml-1 text-[10px]">{row.styleId}</span>
                  </div>
                </DataTableCell>
                <DataTableCell className="text-gray-600">{row.segmentId}</DataTableCell>
                <DataTableCell>
                  <SellThroughBar pct={row.sellThroughPct} />
                </DataTableCell>
                <DataTableCell align="center" className="text-gray-600 tabular-nums">{row.revenueShare.toFixed(1)}%</DataTableCell>
                <DataTableCell className="text-gray-600">{row.fixtureType}</DataTableCell>
                <DataTableCell align="center">
                  <Button variant="destructive" size="sm" disabled className="text-[10px] h-6 px-2">
                    Remove
                  </Button>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
      </DataTable>
      <div className="px-4 py-3 border-t border-gray-100 bg-red-50/50">
        <p className="text-xs text-gray-600">
          Removing <span className="font-semibold text-red-700">{candidates.length} options</span> would
          free <span className="font-semibold text-red-700">{freedPositions} fixture positions</span> for
          next season
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export function RangePerformancePage() {
  const navigate = useNavigate();

  return (
    <div className="animate-fadeInUp">
      <PageHeader
        title="Range Performance"
        backTo={{ label: 'Range', path: '/range' }}
      />

      {/* Filter Row */}
      <FilterBar>
        <FilterSelect
          value="last-30"
          onChange={() => {}}
          placeholder="Period"
          options={[
            { value: 'last-30', label: 'Last 30 days' },
            { value: 'last-60', label: 'Last 60 days' },
            { value: 'season', label: 'Season to date' },
          ]}
          searchable
        />
        <FilterSelect
          value={POD_MW_P1}
          onChange={() => {}}
          placeholder="POD"
          options={[
            { value: POD_MW_P1, label: 'MW Pod 1' },
            { value: POD_MW_P2, label: 'MW Pod 2' },
            { value: POD_WIW_P1, label: 'WIW Pod 1' },
            { value: POD_WWW_P3, label: 'WWW Pod 3' },
          ]}
          searchable
        />
        <FilterSelect
          value="all"
          onChange={() => {}}
          placeholder="Grade"
          options={[
            { value: 'all', label: 'All' },
            { value: 'a', label: 'Grade A' },
            { value: 'b', label: 'Grade B' },
            { value: 'c', label: 'Grade C' },
          ]}
          searchable
        />
      </FilterBar>

      {/* Section 1: Distribution KPI Cards */}
      <div className="mb-4">
        <DistributionCards />
      </div>

      {/* Section 2: Option Performance Table */}
      <div className="mb-4">
        <OptionPerformanceTable />
      </div>

      {/* Section 3: Fixture Utilization */}
      <div className="mb-4">
        <FixtureUtilizationTable />
      </div>

      {/* Section 4: Rationalization Candidates */}
      <div className="mb-4">
        <RationalizationCandidates />
      </div>

      {/* Cross-module navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/otb/core-noos')}
          className="text-blue-600 hover:text-blue-700 text-xs font-medium"
        >
          View Core / NOOS →
        </button>
      </div>
    </div>
  );
}
