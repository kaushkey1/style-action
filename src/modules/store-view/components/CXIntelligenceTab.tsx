import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, BarChart2, Eye, ClipboardCheck, Star, Sparkles, CalendarDays, Lock } from 'lucide-react';
import {
  Skeleton, Badge, SectionHeader, Card, CardContent,
  Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { npsKeys, fetchNPSStoreDetails, fetchNPSDPI, fetchNPSAISummary } from '../api/npsApi';
import { googleReviewKeys, fetchGoogleReviews } from '../api/googleReviewsApi';
import { useStoreAuditData } from '@/hooks/data/useStoreAuditData';
import { useSmartiFootfall, useSmartiAreaCount, useSmartiEmotions } from '@/modules/jarvis/api/smartiQueries';
import { SMARTI_STORE_CODE } from '@/modules/jarvis/api/smartiTypes';
import { computeCXScore } from '../data/cxScoreEngine';
import { CXScoreHeader } from './CXScoreHeader';
import { CXJourneyBreakdown } from './CXJourneyBreakdown';
import { CXSourceNPS } from './CXSourceNPS';
import { CXSourceAudit } from './CXSourceAudit';
import { CXSourceGoogleReviews } from './CXSourceGoogleReviews';
import { CXSourceSilentNPS } from './CXSourceSilentNPS';
import { CXNPSOverview } from './CXNPSOverview';
import { JourneyFunnel } from '@/modules/jarvis/components/JourneyFunnel';

import type { FootfallEntry, AreaCountEntry } from '@/modules/jarvis/api/smartiTypes';
import type { NPSInput, SilentNPSInput, CXSourceKey } from '../data/cxScoreEngine';
import type { FunnelStage } from '@/modules/jarvis/data/mockJarvis';

// ─── CX Date Picker ──────────────────────────────────────────────────

type CXDatePreset = 'today' | 'last-week' | 'last-month' | 'last-year' | 'custom';

interface CXDateRange {
  preset: CXDatePreset;
  startDate: string;
  endDate: string;
}

const CX_PRESET_LABELS: Record<CXDatePreset, string> = {
  'today': 'Today',
  'last-week': 'Last Week',
  'last-month': 'Last Month',
  'last-year': 'Last Year',
  'custom': 'Custom',
};

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeCXDateRange(preset: CXDatePreset, customStart?: string, customEnd?: string): CXDateRange {
  const now = new Date();

  switch (preset) {
    case 'today':
      return { preset, startDate: fmtDate(now), endDate: fmtDate(now) };
    case 'last-week': {
      const dayOfWeek = now.getDay();
      const thisMonday = new Date(now);
      thisMonday.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(thisMonday);
      lastSunday.setDate(thisMonday.getDate() - 1);
      return { preset, startDate: fmtDate(lastMonday), endDate: fmtDate(lastSunday) };
    }
    case 'last-month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { preset, startDate: fmtDate(start), endDate: fmtDate(end) };
    }
    case 'last-year': {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31);
      return { preset, startDate: fmtDate(start), endDate: fmtDate(end) };
    }
    case 'custom':
      return { preset, startDate: customStart ?? fmtDate(now), endDate: customEnd ?? fmtDate(now) };
    default: {
      const _exhaustive: never = preset;
      return { preset: 'last-month', startDate: fmtDate(now), endDate: fmtDate(now) + _exhaustive };
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────

interface CXIntelligenceTabProps {
  storeCode: string;
  storeName?: string;
}

function SectionAccordion({ sectionKey, label, icon: Icon, isExpanded, onToggle, available, isLocked = false, isLoading = false, children }: {
  sectionKey: CXSourceKey;
  label: string;
  icon: typeof BarChart2;
  isExpanded: boolean;
  onToggle: () => void;
  available: boolean;
  /** Source still being built — shown as "In Progress" and not openable. */
  isLocked?: boolean;
  /** Suppresses the "No data available" badge while the source is resolving. */
  isLoading?: boolean;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <div className={cn(
      'rounded-lg border overflow-hidden',
      isExpanded ? 'border-primary-200' : 'border-gray-200',
      isLocked ? 'bg-gray-50' : 'bg-white',
    )}>
      <button
        type="button"
        onClick={onToggle}
        disabled={isLocked}
        aria-expanded={isLocked ? undefined : isExpanded}
        aria-controls={isLocked ? undefined : `cx-section-${sectionKey}`}
        className={cn(
          'w-full px-4 py-3 flex items-center justify-between transition-colors min-h-[44px]',
          isLocked ? 'cursor-not-allowed' : 'hover:bg-gray-50',
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md shrink-0',
            isLocked ? 'bg-gray-100' : 'bg-primary-50',
          )}>
            <Icon className={cn('h-3.5 w-3.5', isLocked ? 'text-gray-400' : 'text-primary-500')} aria-hidden />
          </div>
          <span className={cn('text-sm font-medium', isLocked ? 'text-gray-500' : 'text-gray-900')}>{label}</span>
          {isLocked ? (
            <Badge variant="warning" size="sm">In Progress</Badge>
          ) : isLoading ? null : !available ? (
            <Badge variant="default" size="sm" className="text-[10px]">No data available</Badge>
          ) : null}
        </div>
        {isLocked ? (
          <Lock className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden />
        ) : (
          <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', isExpanded && 'rotate-180')} aria-hidden />
        )}
      </button>
      {!isLocked && isExpanded ? (
        <div id={`cx-section-${sectionKey}`} className="border-t border-gray-100 p-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}


function extractSummaryParagraph(markdown: string): string {
  const match = markdown.match(/##\s*Summary\s*\n?([\s\S]*?)(?=\n##|\n#|$)/i);
  if (match?.[1]) return match[1].trim();
  const stripped = markdown.replace(/^#+\s+.*$/gm, '').trim();
  return stripped.split(/\n\n/)[0]?.trim() || markdown;
}

function CXNutshell({ storeCode, storeName }: { storeCode: string; storeName?: string }): React.ReactNode {
  const { data, isLoading, error } = useQuery({
    queryKey: npsKeys.aiSummary(storeCode, 'last_month'),
    queryFn: () => fetchNPSAISummary(storeCode, 'last_month'),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <Skeleton className="h-4 w-48 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error || !data) return null;

  const text = extractSummaryParagraph(data.summary);
  const displayText = storeName
    ? text.replace(new RegExp(`store ${storeCode}`, 'gi'), storeName)
    : text;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      { }
      <div className="flex items-center gap-2 mb-2.5">
        <h3 className="text-sm font-semibold text-gray-900">Customer Experience in a Nutshell</h3>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 text-primary text-[10px] font-medium border border-indigo-100">
          <Sparkles className="w-3 h-3" aria-hidden />
          AI Generated
        </span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{displayText}</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function CXIntelligenceTab({ storeCode, storeName }: CXIntelligenceTabProps): React.ReactNode {
  const [expandedSections, setExpandedSections] = useState<Set<CXSourceKey>>(new Set());
  const [dateRange, setDateRange] = useState<CXDateRange>(() => computeCXDateRange('last-month'));

  const startDate = dateRange.startDate;
  const endDate = dateRange.endDate;

  const handlePresetChange = useCallback((preset: string) => {
    setDateRange(computeCXDateRange(preset as CXDatePreset));
  }, []);

  const handleCustomStart = useCallback((value: string) => {
    setDateRange((prev) => computeCXDateRange('custom', value, prev.endDate));
  }, []);

  const handleCustomEnd = useCallback((value: string) => {
    setDateRange((prev) => computeCXDateRange('custom', prev.startDate, value));
  }, []);

  // ─── Data fetching — all use the global date range ──────────────────
  const { data: npsData, isLoading: npsLoading } = useQuery({
    queryKey: npsKeys.storeDetails(storeCode, startDate, endDate),
    queryFn: () => fetchNPSStoreDetails(storeCode, startDate, endDate),
    staleTime: 5 * 60 * 1000,
  });

  const { data: dpiData } = useQuery({
    queryKey: npsKeys.dpi(storeCode),
    queryFn: () => fetchNPSDPI(storeCode),
    staleTime: 5 * 60 * 1000,
  });

  // Loading is handled inside CXSourceAudit; only the resolved data feeds the score.
  const { data: auditData, loading: auditLoading } = useStoreAuditData(storeCode);

  // googleLoading feeds the accordion badge only — never the tab-level gate.
  const { data: googleData, isLoading: googleLoading } = useQuery({
    queryKey: googleReviewKeys.store(storeCode),
    queryFn: () => fetchGoogleReviews(storeCode),
    staleTime: 30 * 60 * 1000,
    // Must match CXSourceGoogleReviews, which shares this cache entry.
    retry: false,
  });

  const footfall = useSmartiFootfall(startDate, endDate);
  const areaCount = useSmartiAreaCount(startDate, endDate);
  const emotions = useSmartiEmotions(startDate, endDate);

  // ─── Compute CX Score ────────────────────────────────────────────────
  const cxResult = useMemo(() => {
    let npsInput: NPSInput | null = null;
    if (npsData?.performance) {
      npsInput = {
        npsScore: npsData.performance.nps_score,
        totalResponses: npsData.performance.totalResponses,
        dpiDrivers: dpiData?.drivers?.map((d) => ({
          category: d.category,
          dpi: d.dpi,
          selectedPercent: d.selectedPercent,
        })),
      };
    }

    let silentNpsInput: SilentNPSInput | null = null;
    if (footfall.data && areaCount.data) {
      const footfallData: FootfallEntry[] = footfall.data.data ?? [];
      const totalEntries = footfallData.reduce((s: number, f: FootfallEntry) => s + f.customerEntries, 0);
      const allZones: AreaCountEntry[] = areaCount.data.data ?? [];
      const cashZones = allZones.filter((z: AreaCountEntry) => z.queueType === 'cash_counters_queue');
      const trialZones = allZones.filter((z: AreaCountEntry) => z.queueType === 'trial_room_queue');
      const totalServed = cashZones.reduce((s: number, z: AreaCountEntry) => s + z.totalServed, 0);
      const avgCashWait = cashZones.length > 0
        ? cashZones.reduce((s: number, z: AreaCountEntry) => s + z.avgWaitTime, 0) / cashZones.length
        : 0;
      const avgTrialDwell = trialZones.length > 0
        ? trialZones.reduce((s: number, z: AreaCountEntry) => s + z.avgWaitTime, 0) / trialZones.length
        : 0;
      const attendedTotal = allZones.reduce((s: number, z: AreaCountEntry) => s + z.totalServed, 0);
      const visitTotal = allZones.reduce((s: number, z: AreaCountEntry) => s + z.totalVisits, 0);
      const attendedPct = visitTotal > 0 ? (attendedTotal / visitTotal) * 100 : 0;

      const emotionData = emotions.data?.data;
      const positive = emotionData?.overall.positive ?? 0;
      const negative = emotionData?.overall.negative ?? 0;

      const activeCashCounters = cashZones.filter((z: AreaCountEntry) => z.totalServed > 0).length;

      silentNpsInput = {
        totalFootfall: totalEntries,
        conversionRate: totalEntries > 0 ? (totalServed / totalEntries) * 100 : 0,
        avgTrialDwell,
        avgCashWait,
        attendedPercent: attendedPct,
        sentimentPositive: positive,
        sentimentNegative: negative,
        audioSentimentScore: null,
        avgBillingTime: avgCashWait,
        peakQueueLength: activeCashCounters > 0 ? Math.round(totalServed / activeCashCounters) : 0,
      };
    }

    return computeCXScore(npsInput, silentNpsInput, auditData, googleData ?? null);
  }, [npsData, dpiData, auditData, googleData, footfall.data, areaCount.data, emotions.data]);

  // ─── Funnel + KPI metrics ───────────────────────────────────────────
  const funnelData = useMemo(() => {
    if (!footfall.data || !areaCount.data) return null;

    const footfallData: FootfallEntry[] = footfall.data.data ?? [];
    const totalEntries = footfallData.reduce((s: number, f: FootfallEntry) => s + f.customerEntries, 0);
    const allZones: AreaCountEntry[] = areaCount.data.data ?? [];
    const cashZones = allZones.filter((z: AreaCountEntry) => z.queueType === 'cash_counters_queue');
    const trialZones = allZones.filter((z: AreaCountEntry) => z.queueType === 'trial_room_queue');
    const totalServed = cashZones.reduce((s: number, z: AreaCountEntry) => s + z.totalServed, 0);
    const totalTrialVisits = trialZones.reduce((s: number, z: AreaCountEntry) => s + z.totalVisits, 0);
    const conversionRate = totalEntries > 0 ? ((totalServed / totalEntries) * 100).toFixed(1) : '--';

    const browsingDropOff = totalEntries > 0 && totalEntries >= totalTrialVisits
      ? -Math.round(((totalEntries - totalTrialVisits) / totalEntries) * 100) : null;
    const billingDropOff = totalTrialVisits > 0 && totalTrialVisits >= totalServed
      ? -Math.round(((totalTrialVisits - totalServed) / totalTrialVisits) * 100) : null;

    const funnelStages: FunnelStage[] = [
      { stage: 'walk-in' as const, label: 'Footfall', value: totalEntries, source: 'cctv' as const, dropOff: null, dropOffReasons: [] },
      { stage: 'trial' as const, label: 'Browsing / Trial', value: totalTrialVisits, source: 'cctv' as const, dropOff: browsingDropOff, dropOffReasons: [] },
      { stage: 'billing' as const, label: 'Billing', value: totalServed, source: 'cctv' as const, dropOff: billingDropOff, dropOffReasons: [] },
    ];

    return { funnelStages, totalEntries, totalServed, conversionRate };
  }, [footfall.data, areaCount.data]);

  // ─── Loading state ───────────────────────────────────────────────────
  // Only NPS and footfall gate the tab. The warehouse/Places-backed sources
  // (audit, Google reviews) are deliberately excluded: they are slow and can be
  // empty for a given store, and blocking on them hid every other section
  // behind a skeleton — a store missing from the warehouse left the whole tab
  // stuck loading. Each of those sections renders its own loading state.
  const isScoreLoading = npsLoading || footfall.isLoading;

  if (isScoreLoading) {
    return (
      <div className="space-y-4 p-4 animate-fadeInUp">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-44 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const handleToggle = (key: CXSourceKey): void => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 p-4 animate-fadeInUp">
      {/* 0. Global Date Picker */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-semibold text-gray-900">CX Intelligence</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
          <Select value={dateRange.preset} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(CX_PRESET_LABELS) as [CXDatePreset, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {dateRange.preset === 'custom' ? (
            <div className="flex items-center gap-1.5 text-xs">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleCustomStart(e.target.value)}
                className="h-8 w-auto text-xs"
                aria-label="Start date"
              />
              <span className="text-gray-400">to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleCustomEnd(e.target.value)}
                className="h-8 w-auto text-xs"
                aria-label="End date"
              />
            </div>
          ) : (
            <span className="text-xs text-gray-400 tabular-nums">
              {startDate} &mdash; {endDate}
            </span>
          )}
        </div>
      </div>

      {/* 1. CX Score Header */}
      <CXScoreHeader result={cxResult} />

      {/* 2. CX Nutshell — AI-generated summary */}
      <CXNutshell storeCode={storeCode} storeName={storeName} />

      {/* 3. Journey Funnel */}
      {funnelData ? (
        <div>
          <SectionHeader
            title="Customer Journey Funnel"
            subtitle="Walk-in to billing conversion pipeline"
            actions={<Badge variant="primary" size="sm">Live CCTV</Badge>}
          />
          <Card>
            <CardContent className="p-4">
              <JourneyFunnel stages={funnelData.funnelStages} />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* 4. Journey Stage Breakdown — always expandable with drill-downs */}
      <CXJourneyBreakdown
        stages={cxResult.journeyStages}
        expandable
        storeCode={storeCode}
        startDate={startDate}
        endDate={endDate}
      />

      {/* 6. NPS Intelligence */}
      <CXNPSOverview startDate={startDate} endDate={endDate} storeCode={storeCode} />

      {/* 7. Source Accordions */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Data Sources</p>

        <SectionAccordion
          sectionKey="nps"
          label="NPS Intelligence"
          icon={BarChart2}
          isExpanded={expandedSections.has('nps')}
          onToggle={() => handleToggle('nps')}
          available={cxResult.sources.find((s) => s.key === 'nps')?.available ?? false}
        >
          <CXSourceNPS storeCode={storeCode} storeName={storeName} />
        </SectionAccordion>

        {/* Always mounted, like every other source. CXSourceAudit renders its
            own skeleton while loading and an empty state for stores that have
            never been audited — hiding the row entirely made an unaudited store
            indistinguishable from a broken one. */}
        <SectionAccordion
          sectionKey="audit"
          label="Store Audit"
          icon={ClipboardCheck}
          isExpanded={expandedSections.has('audit')}
          onToggle={() => handleToggle('audit')}
          available={cxResult.sources.find((s) => s.key === 'audit')?.available ?? false}
          isLoading={auditLoading}
        >
          <CXSourceAudit storeCode={storeCode} storeName={storeName} />
        </SectionAccordion>

        <SectionAccordion
          sectionKey="google"
          label="Google Reviews"
          icon={Star}
          isExpanded={expandedSections.has('google')}
          onToggle={() => handleToggle('google')}
          available={cxResult.sources.find((s) => s.key === 'google')?.available ?? false}
          isLoading={googleLoading}
        >
          <CXSourceGoogleReviews storeCode={storeCode} />
        </SectionAccordion>

        <SectionAccordion
          sectionKey="silentNps"
          label="Silent NPS"
          icon={Eye}
          isExpanded={expandedSections.has('silentNps')}
          onToggle={() => handleToggle('silentNps')}
          available={cxResult.sources.find((s) => s.key === 'silentNps')?.available ?? false}
          isLocked
        >
          <CXSourceSilentNPS storeCode={SMARTI_STORE_CODE} startDate={startDate} endDate={endDate} />
        </SectionAccordion>
      </div>
    </div>
  );
}
