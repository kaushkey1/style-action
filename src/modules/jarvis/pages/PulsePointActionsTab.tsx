import { useMemo, useState } from 'react';
import { ShieldAlert, AlertTriangle, Eye, Zap } from 'lucide-react';
import {
  SectionHeader,
  MetricGrid,
  MetricCard,
  EmptyState,
  FilterBar,
  FilterSelect,
  FilterClear,
  Badge,
} from '@/components/ui';
import { useJarvisDateStore } from '../stores/useJarvisDateStore';
import {
  useSmartiFootfall,
  useSmartiActiveCount,
  useSmartiAttendedUnattended,
  useSmartiAreaCount,
  useSmartiDeptAttendedUnattended,
  useSmartiDeptDwellTime,
  useSmartiEmotions,
  useNPSResponses,
} from '../api/smartiQueries';
import { SMARTI_STORE_CODE } from '../api/smartiTypes';
import { getNPSMetrics, getVerbatims } from '../data/npsUtils';
import { generateTasks } from '../data/pulsePointEngine';
import { PulsePointTaskRow } from '../components/PulsePointActionCard';

import type { FootfallEntry, AreaCountEntry, AttendedUnattendedEntry } from '../api/smartiTypes';
import type { ActionSeverity, ActionJourneyStage, ActionCategory, ActionSourceType, PulsePointTask } from '../data/pulsePointEngine';

const SEVERITY_ORDER: Record<ActionSeverity, number> = { S0: 0, S1: 1, S2: 2 };

const JOURNEY_STAGES: ActionJourneyStage[] = ['Walk-in', 'Trial', 'Billing', 'Others'];

const STAGE_COLORS: Record<ActionJourneyStage, { border: string; bg: string; text: string; badge: 'info' | 'primary' | 'success' | 'default' }> = {
  'Walk-in': { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700', badge: 'info' },
  Trial: { border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700', badge: 'primary' },
  Billing: { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-700', badge: 'success' },
  Others: { border: 'border-gray-200', bg: 'bg-gray-50', text: 'text-gray-700', badge: 'default' },
};

const SEVERITY_OPTIONS = [
  { value: '__all__', label: 'All Severities' },
  { value: 'S0', label: 'S0 Critical' },
  { value: 'S1', label: 'S1 High' },
  { value: 'S2', label: 'S2 Watch' },
];

const CATEGORY_OPTIONS = [
  { value: '__all__', label: 'All Categories' },
  { value: 'Staff Coverage', label: 'Staff Coverage' },
  { value: 'Staff Behaviour', label: 'Staff Behaviour' },
  { value: 'Queue Management', label: 'Queue Management' },
  { value: 'Stock Availability', label: 'Stock Availability' },
  { value: 'Store Environment', label: 'Store Environment' },
  { value: 'Conversion Drop', label: 'Conversion Drop' },
  { value: 'NPS Recovery', label: 'NPS Recovery' },
  { value: 'Operational', label: 'Operational' },
];

const SOURCE_OPTIONS = [
  { value: '__all__', label: 'All Sources' },
  { value: 'CCTV', label: 'CCTV' },
  { value: 'NPS Survey', label: 'NPS Survey' },
  { value: 'Audio', label: 'Audio' },
  { value: 'Multi-Source', label: 'Multi-Source' },
];

export function PulsePointActionsTab(): React.ReactNode {
  const { startDate, endDate } = useJarvisDateStore((s) => s.dateRange);

  const [severityFilter, setSeverityFilter] = useState('__all__');
  const [categoryFilter, setCategoryFilter] = useState('__all__');
  const [sourceFilter, setSourceFilter] = useState('__all__');

  const footfall = useSmartiFootfall(startDate, endDate);
  const activeCount = useSmartiActiveCount();
  const attendedUnattended = useSmartiAttendedUnattended(startDate, endDate);
  const areaCount = useSmartiAreaCount(startDate, endDate);
  const deptAttended = useSmartiDeptAttendedUnattended(startDate, endDate);
  const deptDwellTime = useSmartiDeptDwellTime(startDate, endDate);
  const emotions = useSmartiEmotions(startDate, endDate);

  // NPS from BigQuery — narrow range (selected dates) + wide range (30-day lookback fallback)
  const narrowNps = useNPSResponses(SMARTI_STORE_CODE, startDate, endDate);
  const wideStart = useMemo(() => {
    const d = new Date(endDate);
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  }, [endDate]);
  const wideNps = useNPSResponses(SMARTI_STORE_CODE, wideStart, endDate);

  const isLoading = footfall.isLoading || areaCount.isLoading || attendedUnattended.isLoading;

  const npsRange = useMemo(() => {
    const narrowData = narrowNps.data ?? [];
    const narrowV = getVerbatims(narrowData, 'newest');
    if (narrowV.length >= 5) return { nps: getNPSMetrics(narrowData), verbatims: narrowV };
    const wideData = wideNps.data ?? [];
    return { nps: getNPSMetrics(wideData), verbatims: getVerbatims(wideData, 'newest') };
  }, [narrowNps.data, wideNps.data]);
  const nps = npsRange.nps;
  const npsVerbatims = npsRange.verbatims;

  const allTasks = useMemo(() => {
    const footfallData: FootfallEntry[] = footfall.data?.data ?? [];
    const totalFootfall = footfallData.reduce((sum: number, f: FootfallEntry) => sum + f.customerEntries, 0);
    const auData: AttendedUnattendedEntry[] = attendedUnattended.data?.data ?? [];
    const zones: AreaCountEntry[] = areaCount.data?.data ?? [];
    const cashZones = zones.filter((z: AreaCountEntry) => z.queueType === 'cash_counters_queue');
    const trialZones = zones.filter((z: AreaCountEntry) => z.queueType === 'trial_room_queue');

    return generateTasks({
      nps,
      verbatims: npsVerbatims,
      totalFootfall,
      activeCustomers: activeCount.data?.data?.activeCustomers ?? 0,
      activeStaff: activeCount.data?.data?.activeStaff ?? 0,
      attendedUnattended: auData,
      allZones: zones,
      deptAttended: deptAttended.data?.departments ?? [],
      deptDwellTime: deptDwellTime.data?.departments ?? [],
      totalBillingServed: cashZones.reduce((sum: number, z: AreaCountEntry) => sum + z.totalServed, 0),
      totalTrialVisits: trialZones.reduce((sum: number, z: AreaCountEntry) => sum + z.totalVisits, 0),
      emotions: emotions.data?.data?.overall ?? null,
    });
  }, [nps, npsVerbatims, footfall.data, activeCount.data, attendedUnattended.data, areaCount.data, deptAttended.data, deptDwellTime.data, emotions.data]);

  const s0 = allTasks.filter((t) => t.severity === 'S0').length;
  const s1 = allTasks.filter((t) => t.severity === 'S1').length;
  const s2 = allTasks.filter((t) => t.severity === 'S2').length;

  const filtered = useMemo(() => {
    let result = allTasks;
    if (severityFilter !== '__all__') result = result.filter((t) => t.severity === severityFilter as ActionSeverity);
    if (categoryFilter !== '__all__') result = result.filter((t) => t.category === categoryFilter as ActionCategory);
    if (sourceFilter !== '__all__') result = result.filter((t) => t.sourceType === sourceFilter as ActionSourceType);
    return result;
  }, [allTasks, severityFilter, categoryFilter, sourceFilter]);

  const activeFilterCount = [severityFilter, categoryFilter, sourceFilter].filter((f) => f !== '__all__').length;

  function handleClearFilters(): void {
    setSeverityFilter('__all__');
    setCategoryFilter('__all__');
    setSourceFilter('__all__');
  }

  const grouped = useMemo(() => {
    const map = new Map<ActionJourneyStage, PulsePointTask[]>();
    for (const stage of JOURNEY_STAGES) map.set(stage, []);
    for (const t of filtered) {
      const list = map.get(t.journeyStage);
      if (list) list.push(t);
    }
    for (const list of map.values()) list.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
    return map;
  }, [filtered]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="PulsePoint Tasks"
        subtitle={isLoading ? 'Analyzing data...' : `${allTasks.length} task${allTasks.length !== 1 ? 's' : ''} generated from CCTV, NPS & Audio analysis`}
        actions={
          !isLoading && allTasks.length > 0 && (
            <Badge variant="outline" size="sm">{allTasks.length} total</Badge>
          )
        }
      />

      <MetricGrid columns={4}>
        <MetricCard label="S0 Critical" value={isLoading ? '...' : String(s0)} icon={ShieldAlert} iconColor="error" status={s0 > 0 ? 'critical' : 'on-track'} />
        <MetricCard label="S1 High" value={isLoading ? '...' : String(s1)} icon={AlertTriangle} iconColor="warning" status={s1 > 0 ? 'warning' : 'on-track'} />
        <MetricCard label="S2 Watch" value={isLoading ? '...' : String(s2)} icon={Eye} />
        <MetricCard label="Total Tasks" value={isLoading ? '...' : String(allTasks.length)} icon={Zap} />
      </MetricGrid>

      <FilterBar>
        <FilterSelect value={severityFilter} onChange={setSeverityFilter} placeholder="Severity" options={SEVERITY_OPTIONS} />
        <FilterSelect value={categoryFilter} onChange={setCategoryFilter} placeholder="Category" options={CATEGORY_OPTIONS} />
        <FilterSelect value={sourceFilter} onChange={setSourceFilter} placeholder="Source" options={SOURCE_OPTIONS} />
        {activeFilterCount > 0 && <FilterClear onClear={handleClearFilters} />}
      </FilterBar>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-gray-500">Analyzing data for tasks...</div>
      ) : allTasks.length === 0 ? (
        <EmptyState title="All clear" description="No issues detected for this period. All metrics are within acceptable thresholds." />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matching tasks" description="No tasks match the selected filters. Try adjusting your criteria." />
      ) : (
        <div className="space-y-6">
          {JOURNEY_STAGES.map((stage) => {
            const stageTasks = grouped.get(stage) ?? [];
            if (stageTasks.length === 0) return null;
            const stageColor = STAGE_COLORS[stage];
            const stageS0 = stageTasks.filter((t) => t.severity === 'S0').length;
            const stageS1 = stageTasks.filter((t) => t.severity === 'S1').length;
            const stageS2 = stageTasks.filter((t) => t.severity === 'S2').length;

            return (
              <div key={stage}>
                {/* Stage header */}
                <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${stageColor.border} ${stageColor.bg} mb-2`}>
                  <Badge variant={stageColor.badge} size="sm">{stage}</Badge>
                  <span className={`text-xs font-medium ${stageColor.text}`}>{stageTasks.length} task{stageTasks.length !== 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {stageS0 > 0 && <Badge variant="error" size="sm">{stageS0} S0</Badge>}
                    {stageS1 > 0 && <Badge variant="warning" size="sm">{stageS1} S1</Badge>}
                    {stageS2 > 0 && <Badge variant="default" size="sm">{stageS2} S2</Badge>}
                  </div>
                </div>

                {/* Task rows */}
                <div className="space-y-1.5">
                  {stageTasks.map((t) => (
                    <PulsePointTaskRow key={t.id} task={t} />
                  ))}
                </div>
              </div>
            );
          })}

          <p className="text-center text-[10px] text-gray-400 pt-2">Powered by PulsePoint</p>
        </div>
      )}
    </div>
  );
}
