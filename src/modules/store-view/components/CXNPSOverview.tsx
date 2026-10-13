import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Cell } from 'recharts';
import { BarChart2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, SectionHeader } from '@/components/ui';
import { cn } from '@/lib/utils';
import { SourceBadge } from '@/modules/jarvis/components/SourceBadge';
import { useNPSResponses } from '@/modules/jarvis/api/smartiQueries';
import { SMARTI_STORE_CODE } from '@/modules/jarvis/api/smartiTypes';
import {
  getNPSMetrics,
  getMonthlyTrend,
  getWeeklyTrend,
  getDailyTrend,
  getVerbatims,
  getScoreDistribution,
} from '@/modules/jarvis/data/npsUtils';
import { googleReviewKeys, fetchGoogleReviews } from '../api/googleReviewsApi';

import type { VerbatimSort } from '@/modules/jarvis/data/npsUtils';

type TrendView = 'monthly' | 'weekly' | 'daily';
type FeedbackSource = 'nps' | 'google';
type SourceFilter = 'all' | FeedbackSource;

interface UnifiedVerbatim {
  date: string;
  score: number;
  maxScore: number;
  feedback: string;
  category: 'promoter' | 'passive' | 'detractor';
  source: FeedbackSource;
  author?: string;
}

const NPS_TARGET = 75;
const VERBATIM_PAGE_SIZE = 10;

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: '1px solid #e5e7eb',
};

const COLOR_PROMOTER = '#22c55e';
const COLOR_PASSIVE = '#f59e0b';
const COLOR_DETRACTOR = '#ef4444';

function scoreColor(score: number): string {
  if (score >= 9) return COLOR_PROMOTER;
  if (score >= 7) return COLOR_PASSIVE;
  return COLOR_DETRACTOR;
}

function googleRatingCategory(rating: number): 'promoter' | 'passive' | 'detractor' {
  if (rating >= 4) return 'promoter';
  if (rating >= 3) return 'passive';
  return 'detractor';
}

interface CXNPSOverviewProps {
  startDate: string;
  endDate: string;
  storeCode: string;
}

export function CXNPSOverview({ startDate, endDate, storeCode }: CXNPSOverviewProps): React.ReactNode {
  const [trendView, setTrendView] = useState<TrendView>('daily');
  const [verbatimSort, setVerbatimSort] = useState<VerbatimSort>('newest');
  const [verbatimPage, setVerbatimPage] = useState(0);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

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
  const npsVerbatims = useMemo(() => getVerbatims(npsData, verbatimSort), [npsData, verbatimSort]);

  const { data: googleData } = useQuery({
    queryKey: googleReviewKeys.store(storeCode),
    queryFn: () => fetchGoogleReviews(storeCode),
    staleTime: 30 * 60 * 1000,
  });

  const unifiedVerbatims = useMemo(() => {
    const items: UnifiedVerbatim[] = [];

    for (const v of npsVerbatims) {
      items.push({
        date: v.date,
        score: v.npsScore,
        maxScore: 10,
        feedback: v.feedback,
        category: v.category,
        source: 'nps',
      });
    }

    if (googleData?.reviews) {
      for (const r of googleData.reviews) {
        if (!r.text) continue;
        items.push({
          date: r.date,
          score: r.rating,
          maxScore: 5,
          feedback: r.text,
          category: googleRatingCategory(r.rating),
          source: 'google',
          author: r.reviewerName,
        });
      }
    }

    items.sort((a, b) => {
      switch (verbatimSort) {
        case 'newest': return b.date.localeCompare(a.date);
        case 'highest': return b.score - a.score;
        case 'lowest': return a.score - b.score;
      }
    });

    return items;
  }, [npsVerbatims, googleData, verbatimSort]);

  const filteredVerbatims = sourceFilter === 'all'
    ? unifiedVerbatims
    : unifiedVerbatims.filter((v) => v.source === sourceFilter);

  const verbatimPageData = filteredVerbatims.slice(verbatimPage * VERBATIM_PAGE_SIZE, (verbatimPage + 1) * VERBATIM_PAGE_SIZE);
  const verbatimTotalPages = Math.ceil(filteredVerbatims.length / VERBATIM_PAGE_SIZE);

  const npsCount = unifiedVerbatims.filter((v) => v.source === 'nps').length;
  const googleCount = unifiedVerbatims.filter((v) => v.source === 'google').length;

  if (nps.totalResponses === 0) return null;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="NPS Intelligence"
        subtitle={`${nps.totalResponses} survey responses`}
        actions={<SourceBadge source="input" />}
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
            <div className="flex items-baseline gap-3 mb-1">
              <span className={cn(
                'text-3xl font-bold tabular-nums',
                nps.overallScore >= 50 ? 'text-green-600' : nps.overallScore >= 0 ? 'text-amber-600' : 'text-red-600',
              )}>{nps.overallScore}</span>
              <span className="text-xs text-gray-500">{nps.totalResponses} responses</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">Target: &ge;{NPS_TARGET}</p>

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
          </CardContent>
        </Card>

        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
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
            <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />9-10 Promoter</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />7-8 Passive</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />0-6 Detractor</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NPS Trend */}
      <Card>
        <CardHeader>
          {/* eslint-disable-next-line design-system/prefer-section-header -- card header with toggle buttons */}
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">NPS Trend</CardTitle>
            <div className="flex gap-1">
              {(['daily', 'weekly', 'monthly'] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-lg transition-colors min-h-[44px] lg:min-h-0',
                    trendView === view
                      ? 'bg-primary-50 text-gray-900 font-medium'
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
                  <Line yAxisId="nps" type="monotone" dataKey="nps" name="nps" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                  <Line yAxisId="responses" type="monotone" dataKey="responses" name="responses" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-indigo-500 rounded" /><span>NPS Score</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-500 rounded" /><span>Responses</span></div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Customer Feedback — unified NPS + Google Reviews */}
      <Card>
        <CardHeader>
          {/* eslint-disable-next-line design-system/prefer-section-header -- card header with sort + source filter controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Recent Customer Feedback</CardTitle>
              <Badge variant="outline" size="sm">{filteredVerbatims.length} feedback</Badge>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Source filter */}
              <div className="flex gap-1 rounded-lg border border-gray-200 p-0.5">
                {([
                  { key: 'all' as const, label: 'All', count: unifiedVerbatims.length },
                  { key: 'nps' as const, label: 'NPS', count: npsCount },
                  { key: 'google' as const, label: 'Google', count: googleCount },
                ]).map(({ key, label, count }) => (
                  <button
                    key={key}
                    type="button"
                    className={cn(
                      'px-2 py-1 text-xs rounded-md transition-colors min-h-[44px] lg:min-h-0',
                      sourceFilter === key
                        ? 'bg-primary-50 text-gray-900 font-medium'
                        : 'text-gray-500 hover:text-gray-700',
                    )}
                    onClick={() => { setSourceFilter(key); setVerbatimPage(0); }}
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>
              {/* Sort */}
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
                      'px-2 py-1 text-xs rounded-lg transition-colors min-h-[44px] lg:min-h-0',
                      verbatimSort === key
                        ? 'bg-primary-50 text-gray-900 font-medium'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                    )}
                    onClick={() => { setVerbatimSort(key); setVerbatimPage(0); }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {filteredVerbatims.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No feedback in selected range</p>
          ) : (
            <>
              <div className="space-y-2">
                {verbatimPageData.map((v, i) => (
                  <div
                    key={`${v.source}-${v.date}-${i}`}
                    className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <span
                        className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white tabular-nums',
                          v.category === 'promoter' ? 'bg-green-500' : v.category === 'passive' ? 'bg-amber-400' : 'bg-red-500',
                        )}
                      >
                        {v.score}
                      </span>
                      <span className="text-[9px] text-gray-400">/{v.maxScore}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-relaxed">{v.feedback}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 flex-wrap">
                        {v.author ? (
                          <>
                            <span className="text-gray-600 font-medium">{v.author}</span>
                            <span>&middot;</span>
                          </>
                        ) : null}
                        <span className="tabular-nums">{new Date(v.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>&middot;</span>
                        <Badge
                          variant={v.category === 'promoter' ? 'success' : v.category === 'passive' ? 'warning' : 'error'}
                          size="sm"
                        >
                          {v.category}
                        </Badge>
                        <span>&middot;</span>
                        {v.source === 'nps' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500">
                            <BarChart2 className="w-3 h-3" aria-hidden />
                            NPS Survey
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500">
                            <Star className="w-3 h-3" aria-hidden />
                            Google Review
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {verbatimTotalPages > 1 && (
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span>Page {verbatimPage + 1} of {verbatimTotalPages}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="px-2 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] lg:min-h-0"
                      disabled={verbatimPage === 0}
                      onClick={() => setVerbatimPage((p) => p - 1)}
                      aria-label="Previous page"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] lg:min-h-0"
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
  );
}
