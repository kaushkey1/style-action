import { useMemo, useState } from 'react';
import { MapPin, Store, Calendar, Monitor, Users } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, MetricGrid, MetricCard, SectionHeader, Badge, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui';
import { cn } from '@/lib/utils';
import { SourceBadge } from '../components/SourceBadge';
import { JourneyFunnel } from '../components/JourneyFunnel';
import { useJarvisDateStore } from '../stores/useJarvisDateStore';
import { useSmartiFootfall, useSmartiAreaCount, useSmartiFlowFunnel, useNPSResponses } from '../api/smartiQueries';
import { SMARTI_STORE_CODE, SMARTI_STORE_NAME } from '../api/smartiTypes';
import {
  commandCenterMetrics,
} from '@/modules/jarvis/data/mockJarvis';
import {
  getNPSMetrics,
  getMonthlyTrend,
  getWeeklyTrend,
  getDailyTrend,
  getVerbatims,
  getScoreDistribution,
} from '@/modules/jarvis/data/npsUtils';

import type { AreaCountEntry, FootfallEntry } from '../api/smartiTypes';
import type { RagStatus } from '@/lib/utils';
import type { FunnelStage, JarvisMetric } from '@/modules/jarvis/data/mockJarvis';
import type { VerbatimSort } from '@/modules/jarvis/data/npsUtils';

type TrendView = 'monthly' | 'weekly' | 'daily';
type FootfallGranularity = 'hourly' | 'daily';
type FootfallSeries = 'entries' | 'exits' | 'both';

const NPS_TARGET = 75;
const VERBATIM_PAGE_SIZE = 10;
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
};

function mapStatus(status: 'green' | 'amber' | 'red' | undefined): RagStatus | undefined {
  if (!status) return undefined;
  const map: Record<'green' | 'amber' | 'red', RagStatus> = {
    green: 'on-track',
    amber: 'warning',
    red: 'critical',
  };
  return map[status];
}

const COLOR_PROMOTER = '#22c55e';
const COLOR_PASSIVE = '#f59e0b';
const COLOR_DETRACTOR = '#ef4444';

function scoreColor(score: number): string {
  if (score >= 9) return COLOR_PROMOTER;
  if (score >= 7) return COLOR_PASSIVE;
  return COLOR_DETRACTOR;
}

export function CommandCenterTab(): React.ReactNode {
  const [trendView, setTrendView] = useState<TrendView>('daily');
  const [verbatimSort, setVerbatimSort] = useState<VerbatimSort>('newest');
  const [verbatimPage, setVerbatimPage] = useState(0);
  const [footfallGranularity, setFootfallGranularity] = useState<FootfallGranularity>('hourly');
  const [footfallSeries, setFootfallSeries] = useState<FootfallSeries>('entries');
  const { startDate, endDate } = useJarvisDateStore((s) => s.dateRange);

  const footfall = useSmartiFootfall(startDate, endDate);
  const areaCount = useSmartiAreaCount(startDate, endDate);
  const flowFunnel = useSmartiFlowFunnel(startDate, endDate);

  // ─── NPS from BigQuery API ──────────────────────────────────────────────
  const npsResponses = useNPSResponses(SMARTI_STORE_CODE, startDate, endDate);
  const npsData = useMemo(() => npsResponses.data ?? [], [npsResponses.data]);
  const nps = useMemo(() => getNPSMetrics(npsData), [npsData]);
  const trendData = useMemo(() => {
    switch (trendView) {
      case 'daily': return getDailyTrend(npsData);
      case 'weekly': return getWeeklyTrend(npsData);
      default: return getMonthlyTrend(npsData);
    }
  }, [npsData, trendView]);
  const distribution = useMemo(() => getScoreDistribution(npsData), [npsData]);
  const verbatims = useMemo(() => getVerbatims(npsData, verbatimSort), [npsData, verbatimSort]);
  const verbatimPageData = verbatims.slice(verbatimPage * VERBATIM_PAGE_SIZE, (verbatimPage + 1) * VERBATIM_PAGE_SIZE);
  const verbatimTotalPages = Math.ceil(verbatims.length / VERBATIM_PAGE_SIZE);

  // ─── Smarti CCTV metrics ───────────────────────────────────────────────
  const footfallRaw = footfall.data?.data;
  const footfallData: FootfallEntry[] = useMemo(() => footfallRaw ?? [], [footfallRaw]);
  const totalEntries = footfallData.reduce((sum: number, f: FootfallEntry) => sum + f.customerEntries, 0);

  const footfallChartData = useMemo(() => {
    if (footfallData.length === 0) return [];
    if (footfallGranularity === 'hourly') {
      return footfallData.map((f) => {
        const d = new Date(f.time);
        return {
          label: d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
          entries: f.customerEntries,
          exits: f.customerExits,
        };
      });
    }
    const byDate = new Map<string, { entries: number; exits: number }>();
    for (const f of footfallData) {
      const dateKey = f.time.slice(0, 10);
      const existing = byDate.get(dateKey);
      if (existing) {
        existing.entries += f.customerEntries;
        existing.exits += f.customerExits;
      } else {
        byDate.set(dateKey, { entries: f.customerEntries, exits: f.customerExits });
      }
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, vals]) => {
        const d = new Date(dateKey);
        const monthName = MONTH_SHORT[d.getMonth()];
        return { label: `${d.getDate()} ${monthName ?? ''}`, entries: vals.entries, exits: vals.exits };
      });
  }, [footfallData, footfallGranularity]);

  const allZones: AreaCountEntry[] = areaCount.data?.data ?? [];
  const cashCounterZones = allZones.filter(
    (z: AreaCountEntry) => z.queueType === 'cash_counters_queue',
  );
  const totalServed = cashCounterZones.reduce((sum: number, z: AreaCountEntry) => sum + z.totalServed, 0);
  const conversionRate = totalEntries > 0 ? ((totalServed / totalEntries) * 100).toFixed(1) : '--';

  // Build enhanced KPI metrics — NPS from CSV, rest from Smarti/mock
  const enhancedMetrics: JarvisMetric[] = commandCenterMetrics.map((metric) => {
    if (metric.id === 'cc-1') {
      // NPS — from CSV data, filtered by date range
      return {
        ...metric,
        value: nps.totalResponses > 0 ? `${nps.overallScore}` : '--',
        numericValue: nps.overallScore,
        status: nps.overallScore >= 50 ? 'green' as const : nps.overallScore >= 0 ? 'amber' as const : 'red' as const,
      };
    }
    if (metric.id === 'cc-2' && !footfall.isLoading) {
      return {
        ...metric,
        value: `${conversionRate}%`,
        numericValue: parseFloat(conversionRate) || 0,
        source: 'cctv' as const,
        sourceDetail: 'Entries vs Cash Counter Served',
        status: parseFloat(conversionRate) >= 15 ? 'green' as const : parseFloat(conversionRate) >= 10 ? 'amber' as const : 'red' as const,
      };
    }
    if (metric.id === 'cc-5' && !footfall.isLoading) {
      return {
        ...metric,
        value: totalServed > 0 ? totalServed.toLocaleString() : '--',
        numericValue: totalServed,
        source: 'cctv' as const,
        sourceDetail: 'Cash Counter Served Count',
      };
    }
    return metric;
  });

  // Browsing from flow/funnel API (all transitions from Entry into the store)
  const funnelData = flowFunnel.data?.data ?? [];
  const funnelBrowsing = funnelData.find((s) => s.stageName === 'Browsing / Trial')?.count ?? 0;

  // Trial and Billing from queue-based area count zones
  const trialRoomZones = allZones.filter((z: AreaCountEntry) => z.queueType === 'trial_room_queue');
  const totalTrialVisits = trialRoomZones.reduce((sum: number, z: AreaCountEntry) => sum + z.totalServed, 0);

  // Build 4-stage funnel: Walk-in → Browsing → Trial → Billing
  const browsingDropOff = totalEntries > 0 && totalEntries >= funnelBrowsing ? -Math.round(((totalEntries - funnelBrowsing) / totalEntries) * 100) : null;
  const trialDropOff = funnelBrowsing > 0 && funnelBrowsing >= totalTrialVisits ? -Math.round(((funnelBrowsing - totalTrialVisits) / funnelBrowsing) * 100) : null;
  const billingDropOff = totalTrialVisits > 0 && totalTrialVisits >= totalServed ? -Math.round(((totalTrialVisits - totalServed) / totalTrialVisits) * 100) : null;
  const funnelStages: FunnelStage[] = [
    { stage: 'walk-in', label: 'Footfall', value: totalEntries, source: 'cctv', dropOff: null, dropOffReasons: [] },
    { stage: 'browsing', label: 'Browsing', value: funnelBrowsing, source: 'cctv', dropOff: browsingDropOff, dropOffReasons: [] },
    { stage: 'trial', label: 'Trial', value: totalTrialVisits, source: 'cctv', dropOff: trialDropOff, dropOffReasons: [] },
    { stage: 'billing', label: 'Billing', value: totalServed, source: 'cctv', dropOff: billingDropOff, dropOffReasons: [] },
  ];

  return (
    <div className="space-y-4">
      {/* Store Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-50">
                { }
                <Store className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Store {SMARTI_STORE_CODE} &mdash; {SMARTI_STORE_NAME}</p>
                <p className="text-xs text-gray-500">Trends &middot; Andheri</p>
              </div>
            </div>
            {/* eslint-disable-next-line design-system/prefer-metric-grid -- store info metadata layout, not metric cards */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="truncate">Andheri, Mumbai</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-gray-400 shrink-0" />
                <span>{totalEntries > 0 ? `${totalEntries.toLocaleString()} entries` : '--'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Monitor className="w-3 h-3 text-gray-400 shrink-0" />
                <span>{areaCount.isLoading ? '...' : `${cashCounterZones.length} POS Counters`}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                <span>{startDate === endDate ? startDate : `${startDate} to ${endDate}`}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div>
        <SectionHeader title="Key Performance Indicators" />
        <MetricGrid columns={5}>
          {enhancedMetrics.map((metric) => (
            <MetricCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              status={mapStatus(metric.status)}
              subtitle={metric.target ? `Target: ${metric.target}` : undefined}
              badge={<SourceBadge source={metric.source} />}
            />
          ))}
        </MetricGrid>
      </div>

      {/* Journey Funnel */}
      <div>
        <SectionHeader
          title="Customer Journey Funnel"
          subtitle="Walk-in to billing conversion pipeline"
          actions={
            footfall.isLoading || areaCount.isLoading || flowFunnel.isLoading ? (
              <Badge variant="outline" size="sm">Loading...</Badge>
            ) : (
              <Badge variant="primary" size="sm">Live CCTV Data</Badge>
            )
          }
        />
        <Card>
          <CardContent className="p-4">
            <JourneyFunnel stages={funnelStages} />
          </CardContent>
        </Card>
      </div>

      {/* ─── Footfall Traffic ──────────────────────────────────────────── */}
      <div>
        <SectionHeader
          title="Footfall Traffic"
          subtitle="Customer entries and exits from CCTV"
          actions={<Badge variant="primary" size="sm">Live CCTV</Badge>}
        />
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-sm">Footfall</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {(['hourly', 'daily'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-lg transition-colors',
                        footfallGranularity === g
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                      )}
                      onClick={() => setFootfallGranularity(g)}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
                <Select value={footfallSeries} onValueChange={(v) => setFootfallSeries(v as FootfallSeries)}>
                  <SelectTrigger className="h-7 w-28 text-xs" aria-label="Select data series">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entries">Entries</SelectItem>
                    <SelectItem value="exits">Exits</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {footfall.isLoading ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-gray-500">Loading...</div>
            ) : footfallChartData.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">No footfall data for the selected period</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={footfallChartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, name) => [
                        Number(value).toLocaleString(),
                        name === 'entries' ? 'Entries' : 'Exits',
                      ]}
                    />
                    {(footfallSeries === 'entries' || footfallSeries === 'both') && (
                      <Bar dataKey="entries" name="entries" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    )}
                    {(footfallSeries === 'exits' || footfallSeries === 'both') && (
                      <Bar dataKey="exits" name="exits" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500">
                  {(footfallSeries === 'entries' || footfallSeries === 'both') && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-2 rounded-sm bg-indigo-400" />
                      <span>Entries</span>
                    </div>
                  )}
                  {(footfallSeries === 'exits' || footfallSeries === 'both') && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-2 rounded-sm bg-amber-400" />
                      <span>Exits</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── NPS Section (from CSV) ──────────────────────────────────────── */}
      <div>
        <SectionHeader
          title="NPS Intelligence"
          subtitle={npsResponses.isLoading ? 'Loading NPS data...' : `${nps.totalResponses} survey responses from Store ${SMARTI_STORE_CODE}`}
          actions={
            npsResponses.isLoading
              ? <Badge variant="outline" size="sm">Loading...</Badge>
              : <Badge variant="primary" size="sm">Live Data</Badge>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* NPS Breakdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">NPS Breakdown</CardTitle>
                <SourceBadge source="input" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {nps.totalResponses === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No NPS responses in selected date range</p>
              ) : (
                <>
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className={cn(
                      'text-3xl font-bold tabular-nums',
                      nps.overallScore >= 50 ? 'text-green-600' : nps.overallScore >= 0 ? 'text-amber-600' : 'text-red-600',
                    )}>{nps.overallScore}</span>
                    <span className="text-xs text-gray-500">{nps.totalResponses} responses</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Target: &ge;{NPS_TARGET}</p>

                  {/* Promoter/Passive/Detractor bar */}
                  <div className="flex h-3 rounded-full overflow-hidden mb-3">
                    <div
                      className="bg-green-500"
                      // eslint-disable-next-line no-restricted-syntax -- dynamic NPS segment width
                      style={{ width: `${(nps.promoters / nps.totalResponses) * 100}%` }}
                    />
                    <div
                      className="bg-amber-400"
                      // eslint-disable-next-line no-restricted-syntax -- dynamic NPS segment width
                      style={{ width: `${(nps.passives / nps.totalResponses) * 100}%` }}
                    />
                    <div
                      className="bg-red-500"
                      // eslint-disable-next-line no-restricted-syntax -- dynamic NPS segment width
                      style={{ width: `${(nps.detractors / nps.totalResponses) * 100}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-gray-600">Promoters: <span className="font-medium text-gray-900 tabular-nums">{nps.promoters} ({Math.round((nps.promoters / nps.totalResponses) * 100)}%)</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-gray-600">Passives: <span className="font-medium text-gray-900 tabular-nums">{nps.passives} ({Math.round((nps.passives / nps.totalResponses) * 100)}%)</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-gray-600">Detractors: <span className="font-medium text-gray-900 tabular-nums">{nps.detractors} ({Math.round((nps.detractors / nps.totalResponses) * 100)}%)</span></span>
                    </div>
                  </div>

                  {/* Sub-Ratings (old questionnaire format) */}
                  {nps.subRatings.length > 0 && (
                    <div className="space-y-2 border-t border-gray-100 pt-3">
                      <span className="text-xs font-medium text-gray-500">Sub-Ratings (out of 5)</span>
                      {nps.subRatings.map((sr) => (
                        <div key={sr.dimension} className="flex items-center gap-3 text-xs">
                          <span className="w-28 text-gray-600 shrink-0 truncate">{sr.label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-indigo-500 transition-all"
                              // eslint-disable-next-line no-restricted-syntax -- dynamic bar width from sub-rating score
                              style={{ width: `${(sr.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className="font-semibold text-gray-900 w-8 text-right tabular-nums">{sr.score}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* NPS Drivers (new questionnaire format) */}
                  {nps.reasonBreakdown.length > 0 && (
                    <div className="space-y-2 border-t border-gray-100 pt-3">
                      <span className="text-xs font-medium text-gray-500">NPS Drivers</span>
                      <div className="grid grid-cols-2 gap-2">
                        {nps.reasonBreakdown.map((d) => (
                          <div key={d.reason} className="rounded-lg border border-gray-200 p-3">
                            <p className="text-xs text-gray-600 leading-tight mb-2">{d.reason}</p>
                            <div className="flex items-baseline gap-3">
                              <div>
                                <span className={`text-base font-bold tabular-nums ${d.driverScore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {d.driverScore >= 0 ? '+' : ''}{d.driverScore}
                                </span>
                                <p className="text-[10px] text-gray-400 mt-0.5">Driver Score</p>
                              </div>
                              <div>
                                <span className="text-base font-bold text-gray-900 tabular-nums">{d.selectedPercent}%</span>
                                <p className="text-[10px] text-gray-400 mt-0.5">Selected</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Score Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {nps.totalResponses === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={distribution} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="score" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [value, 'Responses']} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {distribution.map((entry) => (
                        <Cell key={entry.score} fill={scoreColor(entry.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />9-10 Promoter</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />7-8 Passive</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />0-6 Detractor</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* NPS Trend */}
        <Card className="mt-4">
          <CardHeader>
            {/* eslint-disable-next-line design-system/prefer-section-header -- inside CardHeader with toggle buttons, not a standalone section */}
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">NPS Trend</CardTitle>
              <div className="flex gap-1">
                {(['daily', 'weekly', 'monthly'] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    className={cn(
                      'px-2.5 py-1 text-xs rounded-lg transition-colors',
                      trendView === view
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                    )}
                    onClick={() => setTrendView(view)}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {trendData.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">No trend data in selected date range</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis yAxisId="nps" tick={{ fontSize: 11 }} domain={['auto', 'auto']} label={{ value: 'NPS', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#6366f1' }} />
                    <YAxis yAxisId="responses" orientation="right" tick={{ fontSize: 11 }} allowDecimals={false} label={{ value: 'Responses', angle: 90, position: 'insideRight', fontSize: 10, fill: '#f59e0b' }} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, name) => [`${value}`, name === 'nps' ? 'NPS Score' : 'Responses']}
                    />
                    <Line
                      yAxisId="nps"
                      type="monotone"
                      dataKey="nps"
                      name="nps"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#6366f1' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="responses"
                      type="monotone"
                      dataKey="responses"
                      name="responses"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#f59e0b' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-indigo-500 rounded" />
                    <span>NPS Score</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-amber-500 rounded" />
                    <span>Responses</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Customer Verbatims */}
        <Card className="mt-4">
            <CardHeader>
              {/* eslint-disable-next-line design-system/prefer-section-header -- inside CardHeader with sort buttons, not a standalone section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">Customer Verbatims</CardTitle>
                  <Badge variant="outline" size="sm">{verbatims.length} with feedback</Badge>
                </div>
                <div className="flex gap-1">
                  {([
                    { key: 'newest' as const, label: 'Newest' },
                    { key: 'highest' as const, label: 'Highest' },
                    { key: 'lowest' as const, label: 'Lowest' },
                  ]).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      className={cn(
                        'px-2 py-1 text-xs rounded-lg transition-colors',
                        verbatimSort === key
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                      )}
                      onClick={() => { setVerbatimSort(key); setVerbatimPage(0); }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {verbatims.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">No verbatims in selected range</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {verbatimPageData.map((v, i) => (
                      <div
                        key={`${v.date}-${i}`}
                        className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        <div className="shrink-0 flex flex-col items-center gap-1">
                          <span
                            className={cn(
                              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white tabular-nums',
                              v.category === 'promoter' ? 'bg-green-500' : v.category === 'passive' ? 'bg-amber-400' : 'bg-red-500',
                            )}
                          >
                            {v.npsScore}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 leading-relaxed">{v.feedback}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                            <span className="tabular-nums">{new Date(v.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span>&middot;</span>
                            <Badge
                              variant={v.category === 'promoter' ? 'success' : v.category === 'passive' ? 'warning' : 'error'}
                              size="sm"
                            >
                              {v.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {verbatimTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>Page {verbatimPage + 1} of {verbatimTotalPages}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="px-2 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={verbatimPage === 0}
                          onClick={() => setVerbatimPage((p) => p - 1)}
                          aria-label="Previous page"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={verbatimPage >= verbatimTotalPages - 1}
                          onClick={() => setVerbatimPage((p) => p + 1)}
                          aria-label="Next page"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
