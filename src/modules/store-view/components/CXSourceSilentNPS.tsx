import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Users, Timer, SmilePlus, ArrowRight, Radio, Zap } from 'lucide-react';
import { Badge, Button, EmptyState, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useSmartiFootfall, useSmartiAreaCount, useSmartiEmotions } from '@/modules/jarvis/api/smartiQueries';
import { SMARTI_STORE_CODE } from '@/modules/jarvis/api/smartiTypes';

import type { FootfallEntry, AreaCountEntry } from '@/modules/jarvis/api/smartiTypes';

interface CXSourceSilentNPSProps {
  storeCode: string;
  startDate: string;
  endDate: string;
}

function MetricTile({ icon: Icon, label, value, sub, status }: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
  status?: 'green' | 'amber' | 'red';
}): React.ReactNode {
  const color = status === 'green' ? 'text-green-600' : status === 'red' ? 'text-red-600' : status === 'amber' ? 'text-amber-600' : 'text-gray-900';
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-gray-400" aria-hidden />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={cn('text-xl font-semibold tabular-nums', color)}>{value}</p>
      {sub ? <p className="text-xs text-gray-400 mt-0.5">{sub}</p> : null}
    </div>
  );
}

export function CXSourceSilentNPS({ storeCode, startDate, endDate }: CXSourceSilentNPSProps): React.ReactNode {
  const navigate = useNavigate();
  const isSilentNPSStore = storeCode === SMARTI_STORE_CODE;

  const footfall = useSmartiFootfall(isSilentNPSStore ? startDate : '', isSilentNPSStore ? endDate : '');
  const areaCount = useSmartiAreaCount(isSilentNPSStore ? startDate : '', isSilentNPSStore ? endDate : '');
  const emotions = useSmartiEmotions(isSilentNPSStore ? startDate : '', isSilentNPSStore ? endDate : '');

  const metrics = useMemo(() => {
    if (!isSilentNPSStore) return null;

    const footfallData: FootfallEntry[] = footfall.data?.data ?? [];
    const totalEntries = footfallData.reduce((sum: number, f: FootfallEntry) => sum + f.customerEntries, 0);

    const allZones: AreaCountEntry[] = areaCount.data?.data ?? [];
    const cashCounterZones = allZones.filter((z: AreaCountEntry) => z.queueType === 'cash_counters_queue');
    const trialRoomZones = allZones.filter((z: AreaCountEntry) => z.queueType === 'trial_room_queue');

    const totalServed = cashCounterZones.reduce((sum: number, z: AreaCountEntry) => sum + z.totalServed, 0);
    const conversionRate = totalEntries > 0 ? (totalServed / totalEntries) * 100 : 0;

    const avgCashWait = cashCounterZones.length > 0
      ? cashCounterZones.reduce((sum: number, z: AreaCountEntry) => sum + z.avgWaitTime, 0) / cashCounterZones.length
      : 0;
    const avgTrialWait = trialRoomZones.length > 0
      ? trialRoomZones.reduce((sum: number, z: AreaCountEntry) => sum + z.avgWaitTime, 0) / trialRoomZones.length
      : 0;

    const emotionData = emotions.data?.data;
    const positive = emotionData?.overall.positive ?? 0;
    const negative = emotionData?.overall.negative ?? 0;
    const neutral = emotionData?.overall.neutral ?? 0;
    const totalEmotions = positive + negative + neutral;
    const positivePercent = totalEmotions > 0 ? Math.round((positive / totalEmotions) * 100) : 0;

    return {
      totalEntries,
      totalServed,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgCashWait: Math.round(avgCashWait),
      avgTrialWait: Math.round(avgTrialWait),
      positivePercent,
    };
  }, [isSilentNPSStore, footfall.data, areaCount.data, emotions.data]);

  if (!isSilentNPSStore) {
    return (
      <EmptyState
        title="Powering Soon for This Store"
        description="Silent NPS uses in-store CCTV analytics, Fynd Sense audio, and billing data to compute a real-time customer experience score without surveys. This capability is being rolled out across the network."
      />
    );
  }

  const isLoading = footfall.isLoading || areaCount.isLoading || emotions.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- skeleton placeholders, not MetricCards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const convStatus = metrics.conversionRate >= 30 ? 'green' as const : metrics.conversionRate >= 15 ? 'amber' as const : 'red' as const;
  const sentimentStatus = metrics.positivePercent >= 60 ? 'green' as const : metrics.positivePercent >= 40 ? 'amber' as const : 'red' as const;

  return (
    <div className="space-y-4">
      {/* eslint-disable-next-line design-system/prefer-section-header -- Silent NPS source badges, not a page section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="primary" size="sm">
            <Video className="h-3 w-3" aria-hidden />
            CCTV
          </Badge>
          <Badge variant="default" size="sm">
            <Radio className="h-3 w-3" aria-hidden />
            Fynd Sense
          </Badge>
          <Badge variant="default" size="sm">
            <Zap className="h-3 w-3" aria-hidden />
            Billing
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/jarvis/customer-experience')}
          className="text-xs"
        >
          Full Dashboard
          <ArrowRight className="h-3 w-3 ml-1" aria-hidden />
        </Button>
      </div>

      {/* eslint-disable-next-line design-system/prefer-metric-grid -- Silent NPS metric tiles with status colors, not standard MetricCards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricTile
          icon={Users}
          label="Walk-ins"
          value={metrics.totalEntries.toLocaleString()}
          sub="total footfall"
        />
        <MetricTile
          icon={Users}
          label="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          sub={`${metrics.totalServed} billed`}
          status={convStatus}
        />
        <MetricTile
          icon={Timer}
          label="Avg Cash Wait"
          value={`${metrics.avgCashWait}s`}
          sub="at billing counters"
          status={metrics.avgCashWait > 120 ? 'red' : metrics.avgCashWait > 60 ? 'amber' : 'green'}
        />
        <MetricTile
          icon={Timer}
          label="Avg Trial Wait"
          value={`${metrics.avgTrialWait}s`}
          sub="trial room queue"
          status={metrics.avgTrialWait > 180 ? 'red' : metrics.avgTrialWait > 90 ? 'amber' : 'green'}
        />
        <MetricTile
          icon={SmilePlus}
          label="Positive Sentiment"
          value={`${metrics.positivePercent}%`}
          sub="customer emotions"
          status={sentimentStatus}
        />
      </div>
    </div>
  );
}
