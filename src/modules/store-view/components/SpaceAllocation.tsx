import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, X, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import {
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
  EmptyState,
  MetricGrid,
} from '@/components/ui';
import {cn, formatNumber, getCurrencySymbol, getLastYearMonth} from '@/lib/utils';
import { useFixtureView } from '../api/storePerformanceHooks';
import { CHART_STATUS, CHART_PRIMARY } from '@/data/chartColors';
import { useUnifiedPlanningStore } from '../stores/unified-planning.store';
import {
  storeSpaceProfiles,
  storeSegmentAllocations,
  getSpsfTargetForGrade,
  getSpsfRagStatus,
  storeFashionSplits,
  fashionGradeRules,
  getStoreAreaBreakdown,
  getStoreCapacitySummary,
  getOTBCapacityValidation,
  getStoreMDQCompliance,
  getStockingDensity,
} from '@/modules/range/data/mockSpacePlanning';
import type { StoreFashionSplit, SPSFTarget } from '@/modules/range/data/mockSpacePlanning';
import { NetworkSpaceDashboard } from './NetworkSpaceDashboard';
import { BrandAllocationPanel } from './BrandAllocationPanel';
import { AllocationProcessFlow } from './AllocationProcessFlow';

// ── RAG helpers (same pattern as AdminStoreGradesPage) ──

const ragDotClasses: Record<string, string> = {
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  green: 'bg-emerald-500',
  blue: 'bg-blue-500',
};

const ragColorClasses: Record<string, string> = {
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
};

const segmentColorMap: Record<string, string> = {
  MC: 'bg-blue-600',
  MF: 'bg-blue-400',
  WIW: 'bg-pink-500',
  WWW: 'bg-purple-500',
  KW: 'bg-green-500',
};

function efficiencyColor(eff: number): string {
  if (eff >= 1.0) return 'text-emerald-600';
  if (eff >= 0.8) return 'text-amber-600';
  return 'text-red-600';
}

function utilizationColor(util: number): string {
  if (util > 80) return 'text-emerald-600';
  if (util >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function utilizationBg(util: number): string {
  if (util > 80) return 'bg-emerald-500';
  if (util >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

// ── Overview Tab ──

function OverviewTab({
  profile,
  segments,
  spsfTarget,
  storeId,
}: {
  profile: (typeof storeSpaceProfiles)[0];
  segments: (typeof storeSegmentAllocations)[0]['segments'];
  spsfTarget: SPSFTarget | undefined;
  storeId: string;
}) {
  const ragStatus = spsfTarget ? getSpsfRagStatus(profile.spsf, spsfTarget) : 'green';
  const maxGmrof = Math.max(...segments.map((s) => s.gmrof));
  const avgGmrof = Math.round(segments.reduce((sum, s) => sum + s.gmrof, 0) / segments.length);
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const areaBreakdown = getStoreAreaBreakdown(storeId);
  const capacitySummary = getStoreCapacitySummary(storeId);
  const mdqRows = getStoreMDQCompliance(storeId);
  const stockingDensity = getStockingDensity(storeId);

  return (
    <div className="space-y-5">
      {/* Metric cards row */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- custom 7-col space metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Carpet Area', value: `${formatNumber(profile.carpetArea)} SFT` },
          { label: 'Saleable Area', value: `${formatNumber(profile.saleableArea)} SFT`, sub: `${profile.saleableRatio}%` },
          { label: 'Fixtures', value: formatNumber(profile.totalFixtures) },
          { label: 'Options', value: formatNumber(profile.optionCapacity) },
          { label: 'Garments', value: formatNumber(profile.garmentCapacity) },
          {
            label: 'SPSF',
            value: `${getCurrencySymbol()}${profile.spsf}`,
            rag: ragStatus,
          },
          { label: 'GMROF', value: `${getCurrencySymbol()}${profile.gmrof}/SFT` },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-lg border border-gray-200 p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{m.label}</p>
            <div className="flex items-center gap-1.5">
              {m.rag && <span className={cn('w-2 h-2 rounded-full', ragDotClasses[m.rag])} />}
              <p className="text-sm font-bold text-gray-900 tabular-nums">{m.value}</p>
            </div>
            {m.sub && <p className="text-xs text-gray-500 mt-0.5">{m.sub}</p>}
          </div>
        ))}
      </div>

      {/* Saleable Area Breakdown + Capacity Summary */}
      {areaBreakdown && capacitySummary && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Saleable Area Breakdown</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between font-medium text-gray-900">
                <span>Total Carpet Area</span>
                <span className="tabular-nums">{formatNumber(areaBreakdown.totalCarpetArea)} SFT</span>
              </div>
              {areaBreakdown.deductions.map((d) => (
                <div key={d.label} className="flex justify-between text-gray-500 pl-4">
                  <span>- {d.label}</span>
                  <span className="tabular-nums">-{formatNumber(d.sqft)} SFT</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-1.5 flex justify-between font-semibold text-gray-900">
                <span>Net Saleable Area</span>
                <span className="tabular-nums">{formatNumber(areaBreakdown.netSaleableArea)} SFT ({areaBreakdown.saleablePct}%)</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Capacity Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Fixtures', value: formatNumber(capacitySummary.fixtures) },
                { label: 'Options', value: formatNumber(capacitySummary.options) },
                { label: 'Garments', value: formatNumber(capacitySummary.garments) },
                { label: 'Density', value: `${capacitySummary.density} pcs/SFT` },
              ].map((m) => (
                <div key={m.label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs font-medium text-gray-500 uppercase">{m.label}</p>
                  <p className="text-lg font-bold text-gray-900 tabular-nums mt-1">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Treemap */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Segment Space Map</h3>
        <div className="flex gap-1 h-32 rounded-lg overflow-hidden">
          { }
          {segments.map((seg) => (
             
            <div
              key={seg.segmentCode}
              className={cn(
                'relative flex flex-col justify-between p-2 text-white min-w-0',
                segmentColorMap[seg.segmentCode] || 'bg-gray-500'
              )}
              // eslint-disable-next-line no-restricted-syntax -- dynamic width
              style={{ width: `${seg.spacePercent}%` }}
            >
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{seg.segmentCode}</p>
                <p className="text-xs opacity-80 truncate">{seg.sft} SFT</p>
              </div>
              <div>
                <p className="text-xs font-semibold">{getCurrencySymbol()}{seg.gmrof}</p>
                <p className="text-xs opacity-70">GMROF</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {segments.map((seg) => (
            <div key={seg.segmentCode} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className={cn('w-2.5 h-2.5 rounded', segmentColorMap[seg.segmentCode])} />
              <span>{seg.segment}</span>
              <span className="text-gray-500">({seg.spacePercent}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Segment detail table */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Segment Details</h3>
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Segment', 'SFT', 'Space%', 'NSV%', 'Efficiency', 'GMROF', 'Fixtures', 'Options', 'Garments'].map(
                (h) => (
                  <th
                    key={h}
                    className={cn(
                      'text-xs font-medium text-gray-500 pb-3',
                      h === 'Segment' ? 'text-left' : 'text-right'
                    )}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {segments.length === 0 ? (
              <tr><td colSpan={9}><EmptyState description="No segments to display" /></td></tr>
            ) : segments.map((seg) => {
              const isExpanded = expandedSegment === seg.segmentCode;
              return (
                <React.Fragment key={seg.segmentCode}>
                  <tr
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedSegment(isExpanded ? null : seg.segmentCode)}
                  >
                    <td className="py-2.5 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        }
                        <span className={cn('w-2 h-2 rounded-full', segmentColorMap[seg.segmentCode])} />
                        {seg.segment}
                      </div>
                    </td>
                    <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">
                      {formatNumber(seg.sft)}
                    </td>
                    <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">{seg.spacePercent}%</td>
                    <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">{seg.nsvPercent}%</td>
                    <td className={cn('py-2.5 text-sm font-semibold text-right tabular-nums', efficiencyColor(seg.efficiency))}>
                      {seg.efficiency.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-sm font-medium text-gray-900 text-right tabular-nums">{getCurrencySymbol()}{seg.gmrof}</td>
                    <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">{seg.fixtures}</td>
                    <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">{seg.options}</td>
                    <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">
                      {formatNumber(seg.garments)}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} className="p-0">
                        <BrandAllocationPanel storeId={storeId} segmentCode={seg.segmentCode} segmentName={seg.segment} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* GMROF bar chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">GMROF by Segment</h3>
        <div className="space-y-2.5">
          {[...segments]
            .sort((a, b) => b.gmrof - a.gmrof)
            .map((seg) => {
              const pct = maxGmrof > 0 ? (seg.gmrof / maxGmrof) * 100 : 0;
              const avgPct = maxGmrof > 0 ? (avgGmrof / maxGmrof) * 100 : 0;
              return (
                <div key={seg.segmentCode} className="flex items-center gap-3">
                  <span className="text-xs text-gray-700 w-36 truncate font-medium">{seg.segment}</span>
                  <div className="flex-1 relative h-5 bg-gray-100 rounded overflow-hidden">
                    { }
                    <div
                      className={cn('absolute inset-y-0 left-0 rounded', segmentColorMap[seg.segmentCode] || 'bg-gray-400')}
                      // eslint-disable-next-line no-restricted-syntax -- dynamic width
                      style={{ width: `${pct}%`, opacity: 0.85 }}
                    />
                    {/* Average reference line */}
                    { }
                    <div
                      className="absolute inset-y-0 w-px bg-gray-900/40"
                      // eslint-disable-next-line no-restricted-syntax -- dynamic positioning
                      style={{ left: `${avgPct}%` }}
                      title={`Store Avg: ${getCurrencySymbol()}${avgGmrof}`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-900 w-16 text-right tabular-nums">{getCurrencySymbol()}{seg.gmrof}</span>
                </div>
              );
            })}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <span className="w-4 h-px bg-gray-900/40 inline-block" />
          <span>Store average: {getCurrencySymbol()}{avgGmrof}</span>
        </div>
      </div>

      {/* Stocking Density + MDQ Compliance */}
      <div className="grid grid-cols-[1fr_2fr] gap-4">
        {/* Stocking Density */}
        {stockingDensity && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Stocking Density</h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{stockingDensity.current}</span>
              <span className="text-xs text-gray-500">pcs/SFT</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Target: {stockingDensity.target}</span>
              <Badge
                variant={stockingDensity.ragStatus === 'green' ? 'success' : stockingDensity.ragStatus === 'amber' ? 'warning' : 'destructive'}
                size="sm"
              >
                {stockingDensity.deviation > 0 ? '+' : ''}{stockingDensity.deviation}%
              </Badge>
            </div>
          </div>
        )}

        {/* MDQ Compliance */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">MDQ Compliance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-600">Fixture</th>
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-600">Type</th>
                  <th className="text-left py-1.5 px-2 font-semibold text-gray-600">Category</th>
                  <th className="text-right py-1.5 px-2 font-semibold text-gray-600">MDQ</th>
                  <th className="text-right py-1.5 px-2 font-semibold text-gray-600">Stock</th>
                  <th className="text-right py-1.5 px-2 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {mdqRows.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState description="No MDQ data to display" /></td></tr>
                ) : mdqRows.slice(0, 8).map(row => (
                  <tr key={row.fixtureCode} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-1.5 px-2 font-mono">{row.fixtureCode}</td>
                    <td className="py-1.5 px-2 text-gray-600">{row.type}</td>
                    <td className="py-1.5 px-2 text-gray-600">{row.category}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{row.mdq}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{row.stock}</td>
                    <td className="py-1.5 px-2 text-right">
                      <Badge
                        variant={row.status === 'full' ? 'success' : row.status === 'below-mdq' ? 'warning' : 'destructive'}
                        size="sm"
                      >
                        {row.status === 'full' ? 'Full' : row.status === 'below-mdq' ? 'Below MDQ' : 'Critical'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mdqRows.length > 8 && (
            <p className="text-xs text-gray-500 mt-2">Showing 8 of {mdqRows.length} fixtures</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Fixtures Tab (API-driven) ──

function FixturesTab({ storeId }: { storeId: string }) {
  const yearMonth = useMemo(() => getLastYearMonth(), []);
  const { data, isLoading, isError } = useFixtureView(storeId, yearMonth);

  const overlay = useMemo(() => data?.overlay ?? [], [data?.overlay]);
  const grouped = useMemo(() => {
    const map = new Map<string, typeof overlay>();
    for (const row of overlay) {
      const seg = row.category_desc ?? 'Unknown';
      const existing = map.get(seg) ?? [];
      existing.push(row);
      map.set(seg, existing);
    }
    return Array.from(map.entries());
  }, [overlay]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <MetricGrid>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
              <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
              <div className="h-6 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </MetricGrid>
        <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse h-48" />
      </div>
    );
  }

  if (isError || !data) {
    return <EmptyState description="Failed to load fixture data. Please try again." />;
  }

  const totalSlots = overlay.reduce((s, r) => s + (r.slots ?? 0), 0);
  const totalFilled = overlay.reduce((s, r) => s + (r.filledslots ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <MetricGrid>
        <KpiCard label="Total Fixtures" value={data.total_fixtures != null ? formatNumber(data.total_fixtures) : '—'} />
        <KpiCard label="Current Stock" value={data.current_stock != null ? formatNumber(data.current_stock) : '—'} sub="On Floor" />
        <KpiCard label="Max Capacity" value={data.max_capacity != null ? formatNumber(data.max_capacity) : '—'} sub="Fixture limit" />
        <KpiCard
          label="Avg Utilization"
          value={data.avg_utilization != null ? `${data.avg_utilization}%` : '—'}
          sub={data.avg_utilization != null && data.avg_utilization >= 85 ? 'vs 85% target' : undefined}
          color={data.avg_utilization != null ? utilizationColor(data.avg_utilization) : undefined}
        />
      </MetricGrid>

      {/* Fixture Overlay Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Fixture Overlay</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Type', 'No of Fixtures', 'Segment', 'Capacity Options', 'Actual Options', 'Utilization'].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      'text-xs font-medium text-gray-500 pb-3',
                      h === 'Type' || h === 'Segment' ? 'text-left' : 'text-right',
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grouped.length === 0 ? (
                <tr><td colSpan={6}><EmptyState description="No fixture data available for this store." /></td></tr>
              ) : grouped.map(([segName, rows]) => (
                <React.Fragment key={segName}>
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="py-2 px-1 text-xs font-semibold text-gray-700">
                      {segName}
                    </td>
                  </tr>
                  {rows.map((r, idx) => {
                    const util = r.slots && r.slots > 0 ? Math.round((r.filledslots ?? 0) / r.slots * 100) : 0;
                    return (
                      <tr key={`${segName}-${r.fixture_type}-${idx}`} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-2 text-xs text-gray-800">{r.fixture_type ?? '—'}</td>
                        <td className="py-2 text-xs text-gray-700 text-right tabular-nums">{r.fixture_count ?? 0}</td>
                        <td className="py-2 text-xs text-gray-700">{r.category_desc ?? '—'}</td>
                        <td className="py-2 text-xs text-gray-700 text-right tabular-nums">{r.slots ?? 0}</td>
                        <td className="py-2 text-xs text-gray-700 text-right tabular-nums">{r.filledslots ?? 0}</td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', utilizationBg(util))}
                                // eslint-disable-next-line no-restricted-syntax -- dynamic width from API data
                                style={{ width: `${Math.min(util, 100)}%` }}
                              />
                            </div>
                            <span className={cn('text-xs font-semibold tabular-nums', utilizationColor(util))}>
                              {util}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td className="py-3 text-xs font-bold text-gray-900" colSpan={3}>
                  Total: {overlay.length} fixture rows
                </td>
                <td className="py-3 text-xs font-bold text-gray-900 text-right tabular-nums">{formatNumber(totalSlots)}</td>
                <td className="py-3 text-xs font-bold text-gray-900 text-right tabular-nums">{formatNumber(totalFilled)}</td>
                <td className={cn('py-3 text-xs font-bold text-right tabular-nums',
                  totalSlots > 0 ? utilizationColor(Math.round(totalFilled / totalSlots * 100)) : '')}>
                  {totalSlots > 0 ? `${Math.round(totalFilled / totalSlots * 100)}%` : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={cn('text-xl font-bold tabular-nums', color ?? 'text-gray-900')}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── SPSF Tab ──

function SpsfTab({
  profile,
  spsfTarget,
}: {
  profile: (typeof storeSpaceProfiles)[0];
  spsfTarget: SPSFTarget | undefined;
}) {
  if (!spsfTarget) {
    return <p className="text-sm text-gray-500 py-8 text-center">No SPSF target configured for this store grade.</p>;
  }

  const ragStatus = getSpsfRagStatus(profile.spsf, spsfTarget);

  // Semicircle gauge: map SPSF range to 0-180 degrees
  const gaugeMin = Math.max(0, spsfTarget.floor - 100);
  const gaugeMax = spsfTarget.stretch + 100;
  const range = gaugeMax - gaugeMin;

  const toAngle = (val: number) => Math.max(0, Math.min(180, ((val - gaugeMin) / range) * 180));

  const currentAngle = toAngle(profile.spsf);
  const floorAngle = toAngle(spsfTarget.floor);
  const targetAngle = toAngle(spsfTarget.target);
  const stretchAngle = toAngle(spsfTarget.stretch);

  const optimizationLevers = [
    {
      title: 'GMROF Rebalancing',
      current: 'Segment GMROF variance: ±28%',
      action: 'Rebalance space from low-GMROF to high-GMROF segments',
      impact: '+₹12-18/SFT',
    },
    {
      title: 'Segment Reallocation',
      current: 'Kidswear at 0.69 efficiency, below 0.8 threshold',
      action: 'Reduce Kidswear by 2-3% and allocate to WIW/MC',
      impact: '+₹8-14/SFT',
    },
    {
      title: 'Fixture Density',
      current: 'Avg fixture utilization at ~78%',
      action: 'Optimize fixture types to increase options per LFT',
      impact: '+₹5-10/SFT',
    },
    {
      title: 'ASP Mix Optimization',
      current: 'Mid-ASP overweight at 42% of range',
      action: 'Shift 5% options from mid-ASP to premium bands',
      impact: '+₹6-9/SFT',
    },
    {
      title: 'Option Rationalization',
      current: 'Bottom 15% options contribute <3% revenue',
      action: 'Exit underperforming options, free fixture capacity',
      impact: '+₹4-8/SFT',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Gauge + status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">SPSF Performance</h3>
          <Badge className={ragColorClasses[ragStatus]}>
            {ragStatus === 'blue' ? 'Above Stretch' : ragStatus === 'green' ? 'On Target' : ragStatus === 'amber' ? 'Below Target' : 'Below Floor'}
          </Badge>
        </div>

        {/* CSS semicircle gauge */}
        <div className="flex justify-center">
          <div className="relative w-64 h-32 overflow-hidden">
            {/* Background arc */}
            <div className="absolute inset-0 rounded-t-full border-[12px] border-gray-200 border-b-0" />

            {/* Colored arc segments */}
            <div className="absolute inset-0">
              <svg viewBox="0 0 200 100" className="w-full h-full">
                {/* Red zone: 0 to floor */}
                <path
                  d={describeArc(100, 100, 88, 180, 180 - floorAngle)}
                  fill="none"
                  stroke={CHART_STATUS.critical}
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                {/* Amber zone: floor to target */}
                <path
                  d={describeArc(100, 100, 88, 180 - floorAngle, 180 - targetAngle)}
                  fill="none"
                  stroke={CHART_STATUS.warning}
                  strokeWidth="12"
                />
                {/* Green zone: target to stretch */}
                <path
                  d={describeArc(100, 100, 88, 180 - targetAngle, 180 - stretchAngle)}
                  fill="none"
                  stroke={CHART_STATUS.success}
                  strokeWidth="12"
                />
                {/* Blue zone: stretch to end */}
                <path
                  d={describeArc(100, 100, 88, 180 - stretchAngle, 0)}
                  fill="none"
                  stroke={CHART_PRIMARY}
                  strokeWidth="12"
                />

                {/* Needle */}
                <line
                  x1="100"
                  y1="100"
                  x2={100 + 70 * Math.cos((Math.PI * (180 - currentAngle)) / 180)}
                  y2={100 - 70 * Math.sin((Math.PI * (180 - currentAngle)) / 180)}
                  stroke="#1f2937"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="100" cy="100" r="4" fill="#1f2937" />
              </svg>
            </div>

            {/* Value label */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{getCurrencySymbol()}{profile.spsf}</p>
            </div>
          </div>
        </div>

        {/* Marker labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2 max-w-64 mx-auto">
          <span>Floor {getCurrencySymbol()}{spsfTarget.floor}</span>
          <span>Target {getCurrencySymbol()}{spsfTarget.target}</span>
          <span>Stretch {getCurrencySymbol()}{spsfTarget.stretch}</span>
        </div>

        {/* Deviation */}
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">Gap to target:</span>
            <span className={cn('font-bold tabular-nums', profile.spsf >= spsfTarget.target ? 'text-emerald-600' : 'text-red-600')}>
              {profile.spsf >= spsfTarget.target ? '+' : ''}
              {profile.spsf - spsfTarget.target}
            </span>
          </div>
        </div>
      </div>

      {/* Optimization levers */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Optimization Levers</h3>
        <div className="grid grid-cols-1 gap-3">
          {optimizationLevers.map((lever) => (
            <div key={lever.title} className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">{lever.title}</h4>
                <Badge variant="success" size="sm">{lever.impact}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-500 uppercase text-xs font-medium mb-0.5">Current</p>
                  <p className="text-gray-600">{lever.current}</p>
                </div>
                <div>
                  <p className="text-gray-500 uppercase text-xs font-medium mb-0.5">Recommended</p>
                  <p className="text-gray-800 font-medium">{lever.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** SVG arc path helper */
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = Math.abs(startAngle - endAngle) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ── Fashion Split Tab ──

function FashionSplitTab({ splits }: { splits: StoreFashionSplit[] }) {
  // Store-level aggregate
  const storeTotals = useMemo(() => {
    const total = splits.length;
    if (total === 0) return { core: 0, ultimate: 0, fashion: 0, fastFashion: 0 };
    return {
      core: Math.round(splits.reduce((s, sp) => s + sp.core, 0) / total),
      ultimate: Math.round(splits.reduce((s, sp) => s + sp.ultimate, 0) / total),
      fashion: Math.round(splits.reduce((s, sp) => s + sp.fashion, 0) / total),
      fastFashion: Math.round(splits.reduce((s, sp) => s + sp.fastFashion, 0) / total),
    };
  }, [splits]);

  const coreUlt = storeTotals.core + storeTotals.ultimate;
  const fashFF = storeTotals.fashion + storeTotals.fastFashion;
  const targetPct = 70;

  return (
    <div className="space-y-5">
      {/* Store-level stacked bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Store Fashion Grade Split</h3>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="relative h-8 rounded-lg overflow-hidden flex">
              {/* eslint-disable-next-line no-restricted-syntax -- dynamic width based on percentage */}
              <div className="bg-emerald-500 h-full" style={{ width: `${coreUlt}%` }}>
                <span className="text-xs text-white font-bold flex items-center justify-center h-full">
                  Core+Ult {coreUlt}%
                </span>
              </div>
              {/* eslint-disable-next-line no-restricted-syntax -- dynamic width based on percentage */}
              <div className="bg-amber-400 h-full" style={{ width: `${fashFF}%` }}>
                <span className="text-xs text-gray-900 font-bold flex items-center justify-center h-full">
                  Fash+FF {fashFF}%
                </span>
              </div>
              {/* 70% target line */}
              { }
              <div
                className="absolute inset-y-0 w-0.5 bg-red-600 z-10"
                // eslint-disable-next-line no-restricted-syntax -- dynamic positioning
                style={{ left: `${targetPct}%` }}
                title="70% Target"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span className="text-red-500 font-medium">70% target</span>
              <span>100%</span>
            </div>
          </div>

          <div className="text-right">
            {coreUlt >= targetPct ? (
              <Badge variant="success" size="sm">Compliant</Badge>
            ) : (
              <Badge variant="destructive" size="sm">Non-Compliant</Badge>
            )}
          </div>
        </div>

        {/* Fashion grade rules reference — not metric cards, just a text legend */}
        {/* eslint-disable-next-line design-system/prefer-metric-grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-gray-500">
          {fashionGradeRules.map((r) => (
            <div key={r.grade} className="bg-gray-50 rounded p-2">
              <p className="font-semibold text-gray-700">{r.grade.replace('APL-', '')}</p>
              <p>Target: {r.targetRange}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-segment validation table */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Segment Validation</h3>
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Segment', 'Core%', 'Ultimate%', 'Fashion%', 'Fast Fashion%', 'Core+Ult', 'Fash+FF', 'Status'].map(
                (h) => (
                  <th
                    key={h}
                    className={cn(
                      'text-xs font-medium text-gray-500 pb-3',
                      h === 'Segment' || h === 'Status' ? 'text-left' : 'text-right'
                    )}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {splits.length === 0 ? (
              <tr><td colSpan={8}><EmptyState description="No fashion split data to display" /></td></tr>
            ) : splits.map((sp) => {
              const cu = sp.core + sp.ultimate;
              const ff = sp.fashion + sp.fastFashion;
              const compliant = cu >= 65;

              return (
                <tr
                  key={sp.segment}
                  className={cn(
                    'border-b border-gray-50 transition-colors',
                    !compliant ? 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-gray-50'
                  )}
                >
                  <td className="py-2.5 text-sm font-medium text-gray-900">{sp.segment}</td>
                  <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">{sp.core}%</td>
                  <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">{sp.ultimate}%</td>
                  <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">{sp.fashion}%</td>
                  <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">{sp.fastFashion}%</td>
                  <td className="py-2.5 text-sm font-semibold text-right tabular-nums">{cu}%</td>
                  <td className="py-2.5 text-sm text-gray-700 text-right tabular-nums">{ff}%</td>
                  <td className="py-2.5">
                    {compliant ? (
                      <Badge variant="success" size="sm">Compliant</Badge>
                    ) : (
                      <Badge variant="destructive" size="sm">Non-Compliant</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──

export function SpaceAllocation() {
  const stores = useUnifiedPlanningStore((s) => s.stores);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id || '');
  const [storeSearch, setStoreSearch] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const selectedStore = stores.find((s) => s.id === selectedStoreId);
  const profile = storeSpaceProfiles.find((p) => p.storeId === selectedStoreId);
  const segmentData = storeSegmentAllocations.find((s) => s.storeId === selectedStoreId);
  const spsfTarget = selectedStore ? getSpsfTargetForGrade(selectedStore.grade) : undefined;

  const fashionSplits = storeFashionSplits[selectedStoreId] || [];
  const otbAlerts = useMemo(() => getOTBCapacityValidation(selectedStoreId), [selectedStoreId]);

  const filteredStores = useMemo(() => {
    const q = storeSearch.toLowerCase().trim();
    if (!q) return stores.slice(0, 50);
    return stores.filter(s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)).slice(0, 50);
  }, [stores, storeSearch]);

  const totalMatches = useMemo(() => {
    const q = storeSearch.toLowerCase().trim();
    if (!q) return stores.length;
    return stores.filter(s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)).length;
  }, [stores, storeSearch]);

  const handleSelectStore = useCallback((id: string) => {
    setSelectedStoreId(id);
    setStoreSearch('');
    setIsPickerOpen(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
     
  }, []);

  if (!profile || !segmentData) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">No space data available. Select a store to view space planning.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Store selector */}
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label className="text-xs font-medium text-gray-500">Store</label>
        <div ref={pickerRef} className="relative w-72">
          <Input
            type="text"
            value={isPickerOpen ? storeSearch : ''}
            placeholder={selectedStore?.name ?? 'Search stores...'}
            className={cn(!isPickerOpen && selectedStore && 'text-gray-900')}
            onFocus={() => setIsPickerOpen(true)}
            onChange={(e) => {
              setStoreSearch(e.target.value);
              if (!isPickerOpen) setIsPickerOpen(true);
            }}
            leftIcon={<Search className="w-3.5 h-3.5" />}
            rightIcon={(storeSearch || isPickerOpen) ? (
              <button
                onClick={() => { setStoreSearch(''); setIsPickerOpen(false); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : undefined}
          />
          {isPickerOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredStores.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-gray-500">No stores match your search</div>
              ) : (
                <>
                  {totalMatches > 50 && (
                    <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-100">
                      Showing 50 of {totalMatches} matches
                    </div>
                  )}
                  {filteredStores.map(s => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectStore(s.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between',
                        s.id === selectedStoreId && 'bg-primary/5 text-primary font-medium'
                      )}
                    >
                      <span>{s.name}</span>
                      <span className="text-xs text-gray-400">{s.city}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        {selectedStore && (
          <Badge variant={selectedStore.grade.startsWith('A') ? 'success' : 'default'} size="sm">
            {selectedStore.grade}
          </Badge>
        )}
      </div>

      {/* OTB Capacity Validation Banner */}
      {otbAlerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-900">OTB Planned Units Exceed Fixture Capacity</p>
            <div className="mt-1.5 space-y-1">
              {otbAlerts.map(a => (
                <p key={a.categoryCode} className="text-xs text-amber-700">
                  <span className="font-medium">{a.category}</span>: {formatNumber(a.plannedUnits)} planned vs {formatNumber(a.fixtureCapacity)} capacity (+{formatNumber(a.excess)} excess)
                </p>
              ))}
            </div>
            <p className="text-xs text-amber-600 mt-1.5">Reduce order quantity or add fixtures to avoid stockroom overflow.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
          <TabsTrigger value="spsf">SPSF</TabsTrigger>
          <TabsTrigger value="fashion-split">Fashion Split</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="process">Process</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab profile={profile} segments={segmentData.segments} spsfTarget={spsfTarget} storeId={selectedStoreId} />
        </TabsContent>

        <TabsContent value="fixtures">
          <FixturesTab storeId={selectedStoreId} />
        </TabsContent>

        <TabsContent value="spsf">
          <SpsfTab profile={profile} spsfTarget={spsfTarget} />
        </TabsContent>

        <TabsContent value="fashion-split">
          <FashionSplitTab splits={fashionSplits} />
        </TabsContent>

        <TabsContent value="network">
          <NetworkSpaceDashboard />
        </TabsContent>

        <TabsContent value="process">
          <AllocationProcessFlow
            storeId={selectedStoreId}
            storeName={selectedStore?.name || ''}
            storeGrade={selectedStore?.grade || ''}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
