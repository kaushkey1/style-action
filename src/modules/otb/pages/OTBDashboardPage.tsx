import { useState, useCallback, useMemo, useRef } from 'react';
import { Badge, Progress, SectionHeader, MetricGrid, PageHeader as PageHeaderCompound, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell, EmptyState, FilterSelect, FilterSearch, FilterClear, Button, InfoHeaderIcon } from '@/components/ui';
// useOTBStore used for mock data features (chase, micro-drop); not needed for dashboard
import { OTBTabNavigation } from '../components/OTBTabNavigation';
import {cn, formatCurrency, getFormattingConfig} from '@/lib/utils';
// import { useToast } from '@/hooks/useToast'; // TODO: Re-enable for Upload AOP feature
import {
  ChevronLeft,
  ChevronRight,
  X,
  Store,
  Loader2,
  Download,
  Calculator,
  // Upload, // TODO: Re-enable for Upload AOP feature
  // FileSpreadsheet, // TODO: Re-enable for Upload AOP feature
} from 'lucide-react';
import { useDownload } from '@/hooks/useDownload';
import { IMPETUS_APP_BASE } from '@/lib/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBudgetHome, useOtbFilters, useSegFamStatus, useStoreBreakdown, useChannelBreakdown, useCategorySummary } from '../api/otbDashboardApi';
import { useModuleConfig } from '@/hooks/useScreenConfig';
import { parseOtbConfig, getOtbSectionTitle, getOtbSearchPlaceholder } from '../data/otbTenantConfig';
import { channelLabel } from '../data/channelDisplayNames';
import { OTBMorningBriefing } from '../components/OTBMorningBriefing';
import { OTBDerivationSummaryModal } from '../components/OTBDerivationSummaryModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import type { ApiBudgetHome, ApiSegFamRow, ApiStoreRow, ApiFilterItem, ChannelBreakdownResponse } from '../api/otbDashboardApi';
import type { OtbModuleConfig } from '../data/otbTenantConfig';

// ─── Helpers ────────────────────────────────────────────────────────

function toSelectOptions(items: ApiFilterItem[]): { value: string; label: string }[] {
  return items.map((i) => ({ value: i.code, label: i.display_name }));
}

interface PaginationInfo {
  page: number;
  totalPages: number;
  total: number;
  hasNext: boolean;
}

// ─── Pagination Bar ─────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function PaginationBar({ pagination, pageSize, onPageChange, onPageSizeChange }: {
  pagination: PaginationInfo;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}): React.ReactNode {
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const pageInputValue = editingPage ?? String(pagination.page);
  const start = (pagination.page - 1) * pageSize + 1;
  const end = Math.min(pagination.page * pageSize, pagination.total);

  function handlePageInputCommit(): void {
    if (editingPage === null) return;
    const num = parseInt(editingPage, 10);
    if (!isNaN(num) && num >= 1 && num <= pagination.totalPages) {
      onPageChange(num);
    }
    setEditingPage(null);
  }

  return (
    // eslint-disable-next-line design-system/prefer-section-header -- pagination bar, not a section
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200">
      {/* Left: Rows per page (hidden on mobile) + range */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-gray-500">Rows per page</span>
          {/* eslint-disable-next-line no-restricted-syntax -- compact pagination page-size select */}
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-7 px-1.5 text-base sm:text-xs border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus-kb:ring-1 focus-kb:ring-primary/30"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-gray-500">
          {start}–{end} of {pagination.total.toLocaleString(getFormattingConfig().locale)}
        </span>
      </div>

      {/* Right: Page nav */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Page</span>
          {/* eslint-disable-next-line no-restricted-syntax -- compact pagination page input */}
          <input
            type="text"
            value={pageInputValue}
            onChange={(e) => setEditingPage(e.target.value)}
            onBlur={handlePageInputCommit}
            onKeyDown={(e) => { if (e.key === 'Enter') handlePageInputCommit(); }}
            className="w-10 h-7 text-center text-base sm:text-xs border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus-kb:ring-1 focus-kb:ring-primary/30"
          />
          <span className="text-xs text-gray-500">of {pagination.totalPages}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="flex items-center justify-center min-w-10 min-h-10 sm:w-7 sm:h-7 sm:min-w-0 sm:min-h-0 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
            className="flex items-center justify-center min-w-10 min-h-10 sm:w-7 sm:h-7 sm:min-w-0 sm:min-h-0 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────

function LoadingBlock({ className }: { className?: string }): React.ReactNode {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  );
}

// ─── Formatting Helpers ─────────────────────────────────────────────

function getUtilColor(util: number): string {
  if (util >= 85 && util <= 105) return 'bg-green-500';
  if ((util >= 70 && util < 85) || (util > 105 && util <= 110)) return 'bg-amber-500';
  return 'bg-red-500';
}

function getUtilTextColor(util: number): string {
  if (util >= 85 && util <= 105) return 'text-green-700';
  if ((util >= 70 && util < 85) || (util > 105 && util <= 110)) return 'text-amber-700';
  return 'text-red-700';
}

function getPodStatus(util: number): { label: string; variant: 'success' | 'warning' | 'error' | 'default' } {
  if (util > 110) return { label: 'Over', variant: 'error' };
  if (util > 105) return { label: 'Watch', variant: 'warning' };
  if (util >= 85) return { label: 'Normal', variant: 'success' };
  if (util >= 70) return { label: 'Watch', variant: 'warning' };
  return { label: 'Under', variant: 'error' };
}

// ─── Channel-led (Superdry) OTB Utilisation bands ───────────────────
// Under <=50 (red) · Optimum 51-100 (green) · Over >100 (red).
// Deliberately scoped to channel-led orgs — store-led orgs keep the
// five-band getPodStatus/getUtilColor scheme until that is revisited.

function isOptimumUtil(util: number): boolean {
  return util > 50 && util <= 100;
}

function getUtilisationStatus(util: number): { label: string; variant: 'success' | 'error' } {
  if (util > 100) return { label: 'Over', variant: 'error' };
  if (util > 50) return { label: 'Optimum', variant: 'success' };
  return { label: 'Under', variant: 'error' };
}

function getUtilisationDotColor(util: number): string {
  return isOptimumUtil(util) ? 'bg-green-500' : 'bg-red-500';
}

function getUtilisationTextColor(util: number): string {
  return isOptimumUtil(util) ? 'text-green-700' : 'text-red-700';
}

function getTierBarColor(tier: string): string {
  switch (tier) {
    case 'pre-book': case 'pre_book': return 'bg-primary';
    case 'chase': return 'bg-amber-500';
    case 'micro-drop': case 'micro_drop': return 'bg-violet-500';
    default: return 'bg-primary';
  }
}

function getTierLabel(tier: string): string {
  switch (tier) {
    case 'pre-book': case 'pre_book': return 'Pre-book';
    case 'chase': return 'Chase';
    case 'micro-drop': case 'micro_drop': return 'Fashion';
    default: return tier.charAt(0).toUpperCase() + tier.slice(1);
  }
}

// ─── Page Header ────────────────────────────────────────────────────

function OTBPageHeader({ extraActions, seasons, season, onSeasonChange }: {
  extraActions?: React.ReactNode;
  seasons: { code: string; label: string }[];
  season: string;
  onSeasonChange: (v: string) => void;
}): React.ReactNode {
  return (
    <PageHeaderCompound
      title="Open-to-Buy"
      backTo={{ label: 'Command Center', path: '/' }}
      actions={
        <>
          {extraActions}
          {seasons.length > 0 ? (
            <FilterSelect
              value={season}
              onChange={onSeasonChange}
              options={[
                { value: 'all', label: 'All Seasons' },
                ...seasons.map((s) => ({ value: s.code, label: s.label })),
              ]}
              className="w-[160px]"
            />
          ) : (
            <Badge variant="outline" size="sm">All Seasons</Badge>
          )}
        </>
      }
    />
  );
}

// ─── Budget Gauge (Hero Element) ─────────────────────────────────────

function BudgetGauge({ data, loading }: { data: ApiBudgetHome | undefined; loading: boolean }): React.ReactNode {
  if (loading) return <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3"><LoadingBlock className="h-32" /></div>;
  if (!data) return null;

  const consumedPct = data.total_budget > 0 ? (data.total_consumed / data.total_budget) * 100 : 0;
  const remainingPct = data.total_budget > 0 ? (data.remaining / data.total_budget) * 100 : 0;
  const utilStatus = data.utilization_pct >= 85 && data.utilization_pct <= 105 ? 'success' : data.utilization_pct >= 70 ? 'warning' : 'error';
  const utilLabel = data.utilization_pct >= 85 && data.utilization_pct <= 105 ? 'On Track' : data.utilization_pct >= 70 ? 'Watch' : 'Under';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
      <SectionHeader
        title="OTB Budget"
        subtitle={`${formatCurrency(data.total_budget, { decimals: 2 })} at landed cost`}
        actions={
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{data.utilization_pct.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">utilization</p>
            </div>
            <Badge variant={utilStatus} size="sm">{utilLabel}</Badge>
          </div>
        }
      />

      {/* Main consumption bar */}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-primary rounded-full transition-all"
          // eslint-disable-next-line no-restricted-syntax -- dynamic width
          style={{ width: `${Math.min(consumedPct, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs mb-4">
        <span className="text-gray-700">
           <span className="font-medium">{formatCurrency(data.total_consumed, { decimals: 2 })}</span> consumed ({consumedPct.toFixed(1)}%)
        </span>
        <span className="text-gray-500">
          {formatCurrency(data.remaining, { decimals: 2 })} remaining ({remainingPct.toFixed(1)}%)
        </span>
      </div>

      {/* Tier breakdown */}
      {data.tiers.length > 1 && (
        <MetricGrid columns={data.tiers.length as 2 | 3 | 4} className="gap-6 pt-4 border-t border-gray-100 mb-0">
          {data.tiers.map((tier) => {
            const pct = tier.total_budget > 0 ? Math.round((tier.total_consumed / tier.total_budget) * 100) : 0;
            return (
              <div key={tier.tier}>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-medium text-gray-700">{getTierLabel(tier.tier)}</span>
                  <span className="text-xs font-semibold text-gray-900">{pct}%</span>
                </div>
                <Progress value={pct} size="sm" indicatorClassName={getTierBarColor(tier.tier)} />
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(tier.total_consumed)} of {formatCurrency(tier.total_budget)}</p>
              </div>
            );
          })}
        </MetricGrid>
      )}
    </div>
  );
}

// ─── Category Summary Cards ─────────────────────────────────────────

const CHANNEL_CARD_COLORS: Record<string, string> = {
  EBO_Channel: 'bg-indigo-500',
  Distribution: 'bg-amber-500',
  Ecom_own_site: 'bg-cyan-500',
  Omni: 'bg-emerald-500',
  Others: 'bg-red-500',
  SIS_Channel: 'bg-pink-500',
  RBL_MBO: 'bg-orange-500',
};

function CategorySummaryCards({ data, loading }: {
  data: import('../api/otbDashboardApi').CategorySummaryResponse | undefined;
  loading: boolean;
}): React.ReactNode {
  const items = data?.items ?? [];

  if (loading) {
    return (
      /* eslint-disable-next-line design-system/prefer-metric-grid -- custom shimmer for category cards, not standard metric cards */
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4">
      <div className="flex items-center px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Summary (by Category)</h3>
      </div>
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- category summary cards have channel split + subcategory bars, not standard metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {items.map((cat) => (
          <div key={cat.category} className="rounded-lg border border-gray-200 p-4">
            {/* eslint-disable-next-line design-system/prefer-section-header -- card header with badge, not a section header */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">{cat.category}</h4>
            <Badge variant="outline" size="sm">{cat.plan_count} plans</Badge>
          </div>

          {/* KPIs */}
          <div className="flex items-baseline gap-6 mb-4">
            <div>
              <p className="text-xs text-gray-500">OTB BUDGET</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(cat.otb_budget, { decimals: 2 })}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">SHARE</p>
              <p className="text-lg font-medium text-gray-700">{cat.pct_of_total}%</p>
            </div>
          </div>

          {/* Channel Split Bar */}
          {cat.channels.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Channel Split</p>
              <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                {cat.channels.map((ch) => (
                  <div
                    key={ch.channel}
                    className={cn('h-full', CHANNEL_CARD_COLORS[ch.channel] ?? 'bg-gray-400')}
                    // eslint-disable-next-line no-restricted-syntax -- dynamic width for stacked bar
                    style={{ width: `${ch.pct}%` }}
                    title={`${ch.channel}: ${ch.pct}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {cat.channels.map((ch) => (
                  <div key={ch.channel} className="flex items-center gap-1.5 text-xs">
                    <span className={cn('w-2 h-2 rounded-full', CHANNEL_CARD_COLORS[ch.channel] ?? 'bg-gray-400')} />
                    <span className="text-gray-600">{channelLabel(ch.channel)}</span>
                    <span className="font-medium text-gray-900">{ch.pct}%</span>
                    <span className="text-gray-400">{formatCurrency(ch.budget, { decimals: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Subcategories */}
          {cat.top_subcategories.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                Top Subcategories
              </p>
              <div className="space-y-1.5">
                {cat.top_subcategories.map((sub) => {
                  const maxBudget = cat.top_subcategories[0]?.budget ?? 1;
                  const barPct = Math.round((sub.budget / maxBudget) * 100);
                  return (
                    <div key={sub.subcategory} className="flex items-center gap-2">
                      <span className="text-xs text-gray-700 w-[100px] truncate" title={sub.subcategory}>
                        {sub.subcategory}
                      </span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          // eslint-disable-next-line no-restricted-syntax -- dynamic width for horizontal bar
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-900 w-[60px] text-right">{formatCurrency(sub.budget, { decimals: 2 })}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}

// ─── Table Filter Bar ───────────────────────────────────────────────

interface OTBTableFilters {
  format: string;
  segment: string;
  family: string;
  setFormat: (v: string) => void;
  setSegment: (v: string) => void;
  setFamily: (v: string) => void;
  anyActive: boolean;
  clearAll: () => void;
  formatOptions: { value: string; label: string }[];
  segmentOptions: { value: string; label: string }[];
  familyOptions: { value: string; label: string }[];
  segmentDisabled?: boolean;
  familyDisabled?: boolean;
  otbConfig: OtbModuleConfig;
}

function OTBTableFilterBar(f: OTBTableFilters): React.ReactNode {
  const cfg = f.otbConfig;
  const showFormat = cfg.filters.includes('format');
  return (
    <div className="flex flex-wrap items-center gap-2">
      {showFormat && <FilterSelect value={f.format} onChange={f.setFormat} options={f.formatOptions} placeholder="Format" searchable />}
      <FilterSelect value={f.segment} onChange={f.setSegment} options={f.segmentOptions} placeholder={cfg.hierarchy.level1.label} disabled={f.segmentDisabled} searchable />
      <FilterSelect value={f.family} onChange={f.setFamily} options={f.familyOptions} placeholder={cfg.hierarchy.level2.label} disabled={f.familyDisabled} searchable />
      {f.anyActive && <FilterClear onClear={f.clearAll} />}
    </div>
  );
}

// ─── Segment / Family OTB Status Table ──────────────────────────────

function SegmentFamilyTable({ filters, rows, summary, loading, pagination, pageSize, onPageChange, onPageSizeChange, searchValue, onSearchChange, otbConfig }: {
  filters: OTBTableFilters;
  rows: ApiSegFamRow[];
  summary: { budget: number; consumed: number; util_pct: number; sales_mix_pct?: number; sell_through_achieved_pct?: number } | undefined;
  loading: boolean;
  pagination: PaginationInfo | null;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  otbConfig: OtbModuleConfig;
}): React.ReactNode {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isChannelLed = otbConfig.breakdown_type === 'channel';

  const totalBudget = summary?.budget ?? rows.reduce((s, r) => s + r.budget, 0);
  const totalConsumed = summary?.consumed ?? rows.reduce((s, r) => s + r.consumed, 0);
  const totalUtil = summary?.util_pct ?? (totalBudget > 0 ? Math.round((totalConsumed / totalBudget) * 100) : 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">{getOtbSectionTitle(otbConfig)}</h3>
        <FilterSearch value={searchValue} onChange={onSearchChange} placeholder={getOtbSearchPlaceholder(otbConfig)} />
      </div>
      <div className="px-4 py-2.5 border-b border-gray-200">
        <OTBTableFilterBar {...filters} />
      </div>
      {loading ? (
        <LoadingBlock className="h-40" />
      ) : (
        <DataTable>
          <DataTableHeader>
            <DataTableHead className="w-[15%]">{otbConfig.hierarchy.level1.label}</DataTableHead>
            <DataTableHead className="w-[20%]">{otbConfig.hierarchy.level2.label}</DataTableHead>
            <DataTableHead align="right" className="w-[13%]">Budget</DataTableHead>
            {isChannelLed && (
              <>
                <DataTableHead align="right" className="w-[10%]">Allocation %</DataTableHead>
                <DataTableHead align="right" className="w-[11%]">
                  <span className="inline-flex items-center justify-end gap-1">
                    Sales Mix %
                    <InfoHeaderIcon metricKey="Sales Mix %" description="Compared to last season, in this case AW25" />
                  </span>
                </DataTableHead>
                <DataTableHead align="right" className="w-[11%]">
                  <span className="inline-flex items-center justify-end gap-1">
                    Sell-Through
                    <InfoHeaderIcon metricKey="Sell-Through" description="Compared to last season, in this case AW25" />
                  </span>
                </DataTableHead>
              </>
            )}
            <DataTableHead align="right" className="w-[13%]">Consumed</DataTableHead>
            <DataTableHead align="center" className="w-[11%]">Util%</DataTableHead>
            <DataTableHead align="center" className="w-[11%]">
              {isChannelLed ? 'OTB Utilisation' : 'Status'}
            </DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {rows.length === 0 ? (
              <tr><td colSpan={isChannelLed ? 9 : 6}><EmptyState description="No matching rows" /></td></tr>
            ) : rows.map((row, i) => {
              const util = row.util_pct;
              const status = isChannelLed ? getUtilisationStatus(util) : getPodStatus(util);
              return (
                <DataTableRow key={`${row.segment}-${row.family}-${i}`} onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete('store');
                  const qs = params.toString();
                  const path = otbConfig.breakdown_type === 'channel'
                    ? `/otb/category-detail/${row.segment}-${row.family}`
                    : `/otb/pod/${row.segment}-${row.family}`;
                  navigate(`${path}${qs ? `?${qs}` : ''}`);
                }} className="cursor-pointer">
                  <DataTableCell><span className="font-medium text-gray-900">{row.segment_name ?? row.segment ?? '—'}</span></DataTableCell>
                  <DataTableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">{row.family_name ?? row.family ?? '—'}</span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                  </DataTableCell>
                  <DataTableCell align="right" className="font-mono">{formatCurrency(row.budget, { decimals: 2 })}</DataTableCell>
                  {isChannelLed && (
                    <>
                      <DataTableCell align="right" className="font-mono">
                        {totalBudget > 0 ? `${((row.budget / totalBudget) * 100).toFixed(1)}%` : '—'}
                      </DataTableCell>
                      <DataTableCell align="right" className="font-mono">
                        {row.sales_mix_pct != null ? `${row.sales_mix_pct.toFixed(1)}%` : '—'}
                      </DataTableCell>
                      <DataTableCell align="right" className="font-mono">
                        {row.sell_through_achieved_pct != null ? `${row.sell_through_achieved_pct.toFixed(1)}%` : '—'}
                      </DataTableCell>
                    </>
                  )}
                  <DataTableCell align="right" className="font-mono">{formatCurrency(row.consumed, { decimals: 2 })}</DataTableCell>
                  <DataTableCell align="center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={cn('w-2 h-2 rounded-full', isChannelLed ? getUtilisationDotColor(util) : getUtilColor(util))} />
                      <span className={cn('font-medium', isChannelLed ? getUtilisationTextColor(util) : getUtilTextColor(util))}>{util}%</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell align="center"><Badge variant={status.variant} size="sm">{status.label}</Badge></DataTableCell>
                </DataTableRow>
              );
            })}
          </DataTableBody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200 font-medium">
                <td className="p-3 text-gray-900 font-semibold" colSpan={2}>Total</td>
                <td className="p-3 text-right text-gray-900 font-mono">{formatCurrency(totalBudget, { decimals: 2 })}</td>
                {isChannelLed && (
                  <>
                    <td className="p-3 text-right text-gray-900 font-mono">{totalBudget > 0 ? '100.0%' : '—'}</td>
                    <td className="p-3 text-right text-gray-900 font-mono">{summary?.sales_mix_pct != null ? `${summary.sales_mix_pct.toFixed(1)}%` : '—'}</td>
                    <td className="p-3 text-right text-gray-900 font-mono">{summary?.sell_through_achieved_pct != null ? `${summary.sell_through_achieved_pct.toFixed(1)}%` : '—'}</td>
                  </>
                )}
                <td className="p-3 text-right text-gray-900 font-mono">{formatCurrency(totalConsumed, { decimals: 2 })}</td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={cn('w-2 h-2 rounded-full', isChannelLed ? getUtilisationDotColor(totalUtil) : getUtilColor(totalUtil))} />
                    <span className={cn('font-semibold', isChannelLed ? getUtilisationTextColor(totalUtil) : getUtilTextColor(totalUtil))}>{totalUtil}%</span>
                  </div>
                </td>
                <td className="p-3" />
              </tr>
            </tfoot>
          )}
        </DataTable>
      )}
      {pagination && !loading && (
        <PaginationBar pagination={pagination} pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
      )}
    </div>
  );
}

// ─── Store Breakdown Table ──────────────────────────────────────────

function StoreBreakdownTable({ filters, rows, loading, pagination, pageSize, onPageChange, onPageSizeChange, searchValue, onSearchChange }: {
  filters: OTBTableFilters;
  rows: ApiStoreRow[];
  loading: boolean;
  pagination: PaginationInfo | null;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}): React.ReactNode {
  const totalBudget = rows.reduce((s, r) => s + r.budget, 0);
  const totalConsumed = rows.reduce((s, r) => s + r.consumed, 0);
  const totalUtil = totalBudget > 0 ? Math.round((totalConsumed / totalBudget) * 100) : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Store Breakdown</h3>
        <FilterSearch value={searchValue} onChange={onSearchChange} placeholder="Search store or city..." />
      </div>
      <div className="px-4 py-2.5 border-b border-gray-200">
        <OTBTableFilterBar {...filters} />
      </div>
      {loading ? (
        <LoadingBlock className="h-40" />
      ) : (
        <DataTable>
          <DataTableHeader>
            <DataTableHead>Store</DataTableHead>
            <DataTableHead align="center">Grade</DataTableHead>
            <DataTableHead>City</DataTableHead>
            <DataTableHead align="right">Budget</DataTableHead>
            <DataTableHead align="right">Consumed</DataTableHead>
            <DataTableHead align="center">Util%</DataTableHead>
            <DataTableHead align="center">Status</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {rows.length === 0 ? (
              <tr><td colSpan={7}><EmptyState description="No stores to display" /></td></tr>
            ) : rows.map((store, i) => {
              const status = getPodStatus(store.util_pct);
              return (
                <DataTableRow key={store.site || i}>
                  <DataTableCell><span className="font-medium text-gray-900">{store.store_name ?? '—'}</span></DataTableCell>
                  <DataTableCell align="center"><Badge variant="default" size="sm">{store.grade ?? '—'}</Badge></DataTableCell>
                  <DataTableCell><span className="text-gray-600">{store.city ?? '—'}</span></DataTableCell>
                  <DataTableCell align="right" className="font-mono">{formatCurrency(store.budget)}</DataTableCell>
                  <DataTableCell align="right" className="font-mono">{formatCurrency(store.consumed)}</DataTableCell>
                  <DataTableCell>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={cn('w-2 h-2 rounded-full', getUtilColor(store.util_pct))} />
                      <span className={cn('font-medium', getUtilTextColor(store.util_pct))}>{store.util_pct}%</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell align="center"><Badge variant={status.variant} size="sm">{status.label}</Badge></DataTableCell>
                </DataTableRow>
              );
            })}
          </DataTableBody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200 font-medium">
                <td className="p-3 text-gray-900 font-semibold" colSpan={3}>Total ({rows.length} stores)</td>
                <td className="p-3 text-right text-gray-900 font-mono">{formatCurrency(totalBudget)}</td>
                <td className="p-3 text-right text-gray-900 font-mono">{formatCurrency(totalConsumed)}</td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={cn('w-2 h-2 rounded-full', getUtilColor(totalUtil))} />
                    <span className={cn('font-semibold', getUtilTextColor(totalUtil))}>{totalUtil}%</span>
                  </div>
                </td>
                <td className="p-3" />
              </tr>
            </tfoot>
          )}
        </DataTable>
      )}
      {pagination && !loading && (
        <PaginationBar pagination={pagination} pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
      )}
    </div>
  );
}

// ─── Channel Breakdown Section ──────────────────────────────────────

const CHANNEL_COLOR_MAP: Record<string, string> = {
  EBO_Channel: '#6366f1',    // indigo
  Distribution: '#f59e0b',   // amber
  Ecom_own_site: '#06b6d4',  // cyan
  Omni: '#10b981',           // emerald
  Others: '#ef4444',         // red
  SIS_Channel: '#ec4899',    // pink
  RBL_MBO: '#f97316',        // orange
};
const CHANNEL_COLOR_FALLBACK = '#9ca3af'; // gray

function channelColor(name: string): string {
  return CHANNEL_COLOR_MAP[name] ?? CHANNEL_COLOR_FALLBACK;
}

function ChannelBreakdownSection({ data, loading }: {
  data: ChannelBreakdownResponse | undefined;
  loading: boolean;
}): React.ReactNode {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const items = data?.items ?? [];
  const summary = data?.summary;
  const pieData = items.map((ch) => ({ name: channelLabel(ch.channel), value: ch.budget }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4">
      <div className="flex items-center px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Channel Breakdown</h3>
      </div>
      {loading ? (
        <LoadingBlock className="h-40" />
      ) : items.length === 0 ? (
        <div className="p-4"><EmptyState description="No channel data available" /></div>
      ) : (
        <div className="flex flex-col lg:flex-row">
          {/* Table */}
          <div className="flex-1 min-w-0">
            <DataTable>
              <DataTableHeader>
                <DataTableHead>Channel</DataTableHead>
                <DataTableHead align="right">Budget</DataTableHead>
                <DataTableHead align="right">Consumed</DataTableHead>
                <DataTableHead align="center">Util%</DataTableHead>
                <DataTableHead align="center">Share</DataTableHead>
                <DataTableHead align="center">OTB Utilisation</DataTableHead>
              </DataTableHeader>
              <DataTableBody>
                {items.map((ch) => {
                  const status = getUtilisationStatus(ch.util_pct);
                  return (
                    <DataTableRow key={ch.channel} onClick={() => {
                      if (!ch.channel) return;
                      const params = new URLSearchParams(searchParams);
                      navigate(`/otb/channel/${encodeURIComponent(ch.channel)}${params.toString() ? `?${params.toString()}` : ''}`);
                    }} className="cursor-pointer">
                      <DataTableCell>
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line no-restricted-syntax -- dynamic color for chart legend dot */}
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: channelColor(ch.channel) }} />
                          <span className="font-medium text-gray-900">{channelLabel(ch.channel)}</span>
                        </div>
                      </DataTableCell>
                      <DataTableCell align="right" className="font-mono">{formatCurrency(ch.budget, { decimals: 2 })}</DataTableCell>
                      <DataTableCell align="right" className="font-mono">{formatCurrency(ch.consumed)}</DataTableCell>
                      <DataTableCell>
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={cn('w-2 h-2 rounded-full', getUtilisationDotColor(ch.util_pct))} />
                          <span className={cn('font-medium', getUtilisationTextColor(ch.util_pct))}>{ch.util_pct}%</span>
                        </div>
                      </DataTableCell>
                      <DataTableCell align="center"><span className="text-gray-600">{ch.pct_of_total}%</span></DataTableCell>
                      <DataTableCell align="center"><Badge variant={status.variant} size="sm">{status.label}</Badge></DataTableCell>
                    </DataTableRow>
                  );
                })}
              </DataTableBody>
              {summary && (
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200 font-medium">
                    <td className="p-3 text-gray-900 font-semibold">Total ({items.length} channels)</td>
                    <td className="p-3 text-right text-gray-900 font-mono">{formatCurrency(summary.budget, { decimals: 2 })}</td>
                    <td className="p-3 text-right text-gray-900 font-mono">{formatCurrency(summary.consumed)}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={cn('w-2 h-2 rounded-full', getUtilisationDotColor(summary.util_pct))} />
                        <span className={cn('font-semibold', getUtilisationTextColor(summary.util_pct))}>{summary.util_pct}%</span>
                      </div>
                    </td>
                    <td className="p-3" />
                    <td className="p-3" />
                  </tr>
                </tfoot>
              )}
            </DataTable>
          </div>
          {/* Pie Chart */}
          <div className="w-full lg:w-[280px] flex flex-col items-center justify-center p-4 border-t lg:border-t-0 lg:border-l border-gray-200">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={channelColor(items[i]?.channel ?? '')} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">Budget by Channel</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Store Context Banner ────────────────────────────────────────────

function StoreContextBanner({ storeId, onClear }: { storeId: string; onClear: () => void }): React.ReactNode {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-3">
      {/* eslint-disable-next-line design-system/prefer-section-header -- inline banner, not a section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-gray-900">Store OTB View</span>
          <span className="text-sm text-gray-600">{storeId}</span>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-2">Filtering OTB data for this store. Clear to return to network view.</p>
    </div>
  );
}

// ─── Upload AOP Modal ────────────────────────────────────────────────
// TODO: Re-enable Upload AOP feature - see backlog item #65
// The full UploadAOPModal component has been removed to clean up the code.
// When re-enabling, restore from git history or rebuild based on backlog documentation.

// ─── Main Page Component ────────────────────────────────────────────

export function OTBDashboardPage(): React.ReactNode {
  const [searchParams, setSearchParams] = useSearchParams();
  const storeParam = searchParams.get('store');
  const { download, isDownloading } = useDownload(IMPETUS_APP_BASE);
  const rawOtbConfig = useModuleConfig<Record<string, unknown>>('otb');
  const otbConfig = useMemo(() => parseOtbConfig(rawOtbConfig), [rawOtbConfig]);
  // TODO: Re-enable Upload AOP feature
  // const [showUploadAOP, setShowUploadAOP] = useState(false);

  // ── OTB derivation summary modal ──
  const [showDerivation, setShowDerivation] = useState(false);

  // ── Search state ──
  const [segFamSearch, setSegFamSearch] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  const [segFamSearchDebounced, setSegFamSearchDebounced] = useState('');
  const [storeSearchDebounced, setStoreSearchDebounced] = useState('');

  const segFamSearchTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const storeSearchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // ── Pagination state ──
  const [segFamPage, setSegFamPage] = useState(1);
  const [segFamPageSize, setSegFamPageSize] = useState(25);
  const [storePage, setStorePage] = useState(1);
  const [storePageSize, setStorePageSize] = useState(50);

  const handleSegFamSearch = useCallback((value: string) => {
    setSegFamSearch(value);
    if (segFamSearchTimer.current) clearTimeout(segFamSearchTimer.current);
    segFamSearchTimer.current = setTimeout(() => {
      setSegFamSearchDebounced(value);
      setSegFamPage(1);
    }, 400);
  }, []);

  const handleStoreSearch = useCallback((value: string) => {
    setStoreSearch(value);
    if (storeSearchTimer.current) clearTimeout(storeSearchTimer.current);
    storeSearchTimer.current = setTimeout(() => {
      setStoreSearchDebounced(value);
      setStorePage(1);
    }, 400);
  }, []);

  // ── Shared filter state — persisted in URL search params ──
  const fFormat = searchParams.get('format') || 'all';
  const fSegment = searchParams.get('segment') || 'all';
  const fFamily = searchParams.get('family') || 'all';
  const fSeason = searchParams.get('season') || 'all';
  const seasonParam = fSeason === 'all' ? undefined : fSeason;

  const setFilterParam = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === 'all') { next.delete(key); } else { next.set(key, value); }
      return next;
    });
  }, [setSearchParams]);

  const setSeason = useCallback((v: string) => {
    setFilterParam('season', v);
    setSegFamPage(1); setStorePage(1);
  }, [setFilterParam]);

  const anyActive = fFormat !== 'all' || fSegment !== 'all' || fFamily !== 'all';
  const clearAll = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('format'); next.delete('segment'); next.delete('family');
      return next;
    });
    setSegFamPage(1); setStorePage(1);
  }, [setSearchParams]);

  // ── React Query: Budget Home ──
  const budgetHomeQuery = useBudgetHome(storeParam, seasonParam);
  const budgetHome = budgetHomeQuery.data;
  const budgetLoading = budgetHomeQuery.isLoading;

  // ── Hierarchy config ──
  const showFormat = otbConfig.filters.includes('format');
  const l1Param = otbConfig.hierarchy.level1.column === 'class' ? 'classes' : 'segments';
  const l2Param = otbConfig.hierarchy.level2.column === 'brick' ? 'bricks' : 'families';

  // ── React Query: Base Filters ──
  const baseFiltersQuery = useOtbFilters();
  const apiFilterOptions = baseFiltersQuery.data;

  // ── React Query: Cascaded Level1 (when format is selected — FNL only) ──
  const cascadedL1Params = useMemo(
    () => (showFormat && fFormat !== 'all' ? { formats: fFormat } : undefined),
    [fFormat, showFormat],
  );
  const cascadedL1Query = useOtbFilters(cascadedL1Params);
  const cascadedSegments = (showFormat && fFormat !== 'all') ? cascadedL1Query.data?.segments : undefined;
  const isFetchingSegments = (showFormat && fFormat !== 'all') && cascadedL1Query.isFetching;

  // ── React Query: Cascaded Level2 (when level1 is selected) ──
  const cascadedL2Params = useMemo(() => {
    if (fSegment === 'all') return undefined;
    const p: Record<string, string> = { [l1Param]: fSegment };
    if (showFormat && fFormat !== 'all') p.formats = fFormat;
    return p;
  }, [fFormat, fSegment, l1Param, showFormat]);
  const cascadedL2Query = useOtbFilters(cascadedL2Params);
  const cascadedFamilies = fSegment !== 'all' ? cascadedL2Query.data?.families : undefined;
  const isFetchingFamilies = fSegment !== 'all' && cascadedL2Query.isFetching;

  const l1Label = otbConfig.hierarchy.level1.label;
  const l2Label = otbConfig.hierarchy.level2.label;
  const defaultFormatOpts = [{ value: 'all', label: 'All Formats' }];

  const filterFormatOptions = apiFilterOptions ? [{ value: 'all', label: 'All Formats' }, ...toSelectOptions(apiFilterOptions.formats)] : defaultFormatOpts;
  const pluralize = (s: string) => s.endsWith('y') ? `${s.slice(0, -1)}ies` : `${s}s`;
  const filterSegmentOptions = [{ value: 'all', label: `All ${pluralize(l1Label)}` }, ...toSelectOptions(cascadedSegments ?? apiFilterOptions?.segments ?? [])];
  const filterFamilyOptions = [{ value: 'all', label: `All ${pluralize(l2Label)}` }, ...toSelectOptions(cascadedFamilies ?? apiFilterOptions?.families ?? [])];

  const handleSegFamPageSize = useCallback((size: number) => { setSegFamPageSize(size); setSegFamPage(1); }, []);
  const handleStorePageSize = useCallback((size: number) => { setStorePageSize(size); setStorePage(1); }, []);

  const setFormatAndReset = useCallback((v: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (v === 'all') { next.delete('format'); } else { next.set('format', v); }
      next.delete('segment');
      next.delete('family');
      return next;
    });
    setSegFamPage(1);
    setStorePage(1);
  }, [setSearchParams]);

  const setSegmentAndReset = useCallback((v: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (v === 'all') { next.delete('segment'); } else { next.set('segment', v); }
      next.delete('family');
      return next;
    });
    setSegFamPage(1);
    setStorePage(1);
  }, [setSearchParams]);

  const setFamilyAndReset = useCallback((v: string) => { setFilterParam('family', v); setSegFamPage(1); setStorePage(1); }, [setFilterParam]);

  const tableFilters: OTBTableFilters = {
    format: fFormat, segment: fSegment, family: fFamily,
    setFormat: setFormatAndReset, setSegment: setSegmentAndReset, setFamily: setFamilyAndReset,
    anyActive, clearAll,
    formatOptions: filterFormatOptions,
    segmentOptions: filterSegmentOptions,
    familyOptions: filterFamilyOptions,
    segmentDisabled: showFormat ? (fFormat === 'all' || isFetchingSegments) : false,
    familyDisabled: fSegment === 'all' || isFetchingFamilies,
    otbConfig,
  };

  // ── React Query: Segment/Family Status ──
  const segFamParams = useMemo(() => ({
    page: segFamPage,
    page_size: segFamPageSize,
    ...(fFormat !== 'all' && showFormat && { formats: fFormat }),
    ...(fSegment !== 'all' && { [l1Param]: fSegment }),
    ...(fFamily !== 'all' && { [l2Param]: fFamily }),
    ...(storeParam && { store_id: storeParam }),
    ...(segFamSearchDebounced && { search: segFamSearchDebounced }),
    ...(seasonParam && { season: seasonParam }),
  }), [segFamPage, segFamPageSize, fFormat, fSegment, fFamily, storeParam, segFamSearchDebounced, l1Param, l2Param, showFormat, seasonParam]);

  const segFamQuery = useSegFamStatus(segFamParams);
  const segFamRows = segFamQuery.data?.items ?? [];
  const segFamSummary = segFamQuery.data?.summary;
  const segFamLoading = segFamQuery.isFetching;
  const segFamPagination: PaginationInfo | null = segFamQuery.data
    ? { page: segFamQuery.data.page, totalPages: segFamQuery.data.total_pages, total: segFamQuery.data.total, hasNext: segFamQuery.data.has_next }
    : null;

  // ── React Query: Store Breakdown ──
  const storeParams = useMemo(() => ({
    page: storePage,
    page_size: storePageSize,
    ...(fFormat !== 'all' && showFormat && { formats: fFormat }),
    ...(fSegment !== 'all' && { [l1Param]: fSegment }),
    ...(fFamily !== 'all' && { [l2Param]: fFamily }),
    ...(storeParam && { store_id: storeParam }),
    ...(storeSearchDebounced && { search: storeSearchDebounced }),
  }), [storePage, storePageSize, fFormat, fSegment, fFamily, storeParam, storeSearchDebounced, l1Param, l2Param, showFormat]);

  const storeQuery = useStoreBreakdown(storeParams);
  const storeRows = storeQuery.data?.items ?? [];
  const storeLoading = storeQuery.isFetching;
  const storePagination: PaginationInfo | null = storeQuery.data
    ? { page: storeQuery.data.page, totalPages: storeQuery.data.total_pages, total: storeQuery.data.total, hasNext: storeQuery.data.has_next }
    : null;

  // ── React Query: Category Summary (for channel-led orgs) ──
  const catSummaryParams = useMemo(() => ({
    ...(seasonParam && { season: seasonParam }),
  }), [seasonParam]);
  const catSummaryQuery = useCategorySummary(catSummaryParams);

  // ── React Query: Channel Breakdown (for channel-led orgs) ──
  const channelParams = useMemo(() => ({
    ...(seasonParam && { season: seasonParam }),
  }), [seasonParam]);
  const channelQuery = useChannelBreakdown(channelParams);
  const isChannelBreakdown = otbConfig.breakdown_type === 'channel';

  // ── Season options from filters API ──
  const seasonOptions = apiFilterOptions?.seasons ?? [];

  return (
    <div className="animate-fadeInUp">
      <OTBPageHeader
        seasons={seasonOptions}
        season={fSeason}
        onSeasonChange={setSeason}
        extraActions={
          <>
            {isChannelBreakdown && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDerivation(true)}
                className="shrink-0"
              >
                <Calculator className="w-4 h-4 mr-1.5" />
                Calculation
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => download('/otb/budget', 'otb_budget.xlsx')}
              disabled={isDownloading}
              className="shrink-0"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
          </>
        }
      />
      <div className="relative">
        <OTBTabNavigation />
      </div>
      {storeParam && (
        <StoreContextBanner
          storeId={storeParam}
          onClear={() => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.delete('store');
              return next;
            });
          }}
        />
      )}
      <div className="mb-4">
        <OTBMorningBriefing formula={otbConfig.otb_formula} season={seasonParam} />
      </div>
      <BudgetGauge data={budgetHome} loading={budgetLoading} />
      {isChannelBreakdown && (
        <CategorySummaryCards data={catSummaryQuery.data} loading={catSummaryQuery.isLoading} />
      )}
      {isChannelBreakdown ? (
        <ChannelBreakdownSection data={channelQuery.data} loading={channelQuery.isFetching} />
      ) : (
        <StoreBreakdownTable filters={tableFilters} rows={storeRows} loading={storeLoading} pagination={storePagination} pageSize={storePageSize} onPageChange={setStorePage} onPageSizeChange={handleStorePageSize} searchValue={storeSearch} onSearchChange={handleStoreSearch} />
      )}
      <SegmentFamilyTable filters={tableFilters} rows={segFamRows} summary={segFamSummary} loading={segFamLoading} pagination={segFamPagination} pageSize={segFamPageSize} onPageChange={setSegFamPage} onPageSizeChange={handleSegFamPageSize} searchValue={segFamSearch} onSearchChange={handleSegFamSearch} otbConfig={otbConfig} />
      {isChannelBreakdown && (
        <OTBDerivationSummaryModal
          isOpen={showDerivation}
          onClose={() => setShowDerivation(false)}
          season={fSeason}
        />
      )}
    </div>
  );
}
