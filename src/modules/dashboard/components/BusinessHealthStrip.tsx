import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge, Skeleton } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { healthKpis, type HealthKpi } from '../data/mockHealthKpis';
import { KpiDetailDrawer } from './KpiDetailDrawer';

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { badge: 'success' | 'warning' | 'error'; pulse: boolean }> = {
  on_track: { badge: 'success', pulse: false },
  warning: { badge: 'warning', pulse: false },
  critical: { badge: 'error', pulse: true },
};

const STATUS_LABEL: Record<string, string> = {
  on_track: 'On Track',
  warning: 'Warning',
  critical: 'Critical',
};

const TREND_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
};

const TREND_COLOR = {
  up: 'text-green-600',
  down: 'text-red-600',
  flat: 'text-gray-500',
};

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function HealthKpiCard({
  kpi,
  onClick,
  className,
}: {
  kpi: HealthKpi;
  onClick: () => void;
  className?: string;
}) {
  const config = (STATUS_CONFIG[kpi.status] ?? STATUS_CONFIG['on_track'])!;
  const TrendIcon = TREND_ICON[kpi.trendDirection];

  // Animated fill
  const [fillPct, setFillPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      setFillPct(Math.min((kpi.value / kpi.targetValue) * 100, 100));
    }, 200);
    return () => clearTimeout(t);
  }, [kpi.value, kpi.targetValue]);

  return (
    <button
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-3 text-left w-full min-w-[200px] shrink-0',
        'hover:border-primary/30 hover:shadow-md transition-all duration-200',
        'focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary focus-kb:ring-offset-2',
        className,
      )}
    >
      {/* Label + status */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">
          {kpi.label}
        </span>
        <Badge
          variant={config.badge}
          size="sm"
          className={cn('text-xs shrink-0', config.pulse && 'animate-pulse')}
        >
          {STATUS_LABEL[kpi.status]}
        </Badge>
      </div>

      {/* Value */}
      <p className="text-xl font-bold text-gray-900 mb-0.5">{kpi.valueFormatted}</p>
      <p className="text-xs text-gray-500 mb-2">Target: {kpi.target}</p>

      {/* Progress bar */}
      {/* eslint-disable no-restricted-syntax -- dynamic width for animated progress */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500 ease-out',
            kpi.status === 'critical' ? 'bg-red-500' : kpi.status === 'warning' ? 'bg-amber-500' : 'bg-green-500',
          )}
          style={{ width: `${fillPct}%` }}
        />
      </div>
      {/* eslint-enable no-restricted-syntax */}

      {/* Trend */}
      <div className={cn('flex items-center gap-1 text-xs', TREND_COLOR[kpi.trendDirection])}>
        <TrendIcon className="w-3 h-3" />
        <span className="font-medium">{Math.abs(kpi.trendDelta)}%</span>
        <span className="text-gray-400">{kpi.trendLabel}</span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function HealthStripSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-[140px] min-w-[200px] flex-1 rounded-lg" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface BusinessHealthStripProps {
  isLoading?: boolean;
  className?: string;
}

export function BusinessHealthStrip({ isLoading, className }: BusinessHealthStripProps) {
  const isMobile = useIsMobile();
  const [isSticky, setIsSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [selectedKpi, setSelectedKpi] = useState<HealthKpi | null>(null);

  // IntersectionObserver for sticky behavior (desktop only)
  useEffect(() => {
    if (isMobile || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is not visible → make strip sticky
        setIsSticky(!entry!.isIntersecting);
      },
      { threshold: 0, rootMargin: '-56px 0px 0px 0px' }, // account for top bar height
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isMobile]);

  if (isLoading) return <HealthStripSkeleton />;

  return (
    <>
      {/* Sentinel div — sticky triggers when this scrolls past */}
      <div ref={sentinelRef} className="h-0" aria-hidden="true" />

      <div
        className={cn(
          'transition-all duration-200',
          // Desktop sticky
          !isMobile && isSticky && 'sticky top-[calc(3.5rem+3.5rem)] z-30 bg-gray-50 py-2 -mx-4 px-4 shadow-sm',
          className,
        )}
      >
        <div
          className={cn(
            'flex gap-3',
            // Mobile: horizontal scroll with peek
            isMobile ? 'overflow-x-auto scrollbar-hide pr-8' : 'overflow-hidden',
          )}
        >
          {healthKpis.map((kpi) => (
            <HealthKpiCard
              key={kpi.id}
              kpi={kpi}
              onClick={() => setSelectedKpi(kpi)}
              className={isMobile ? 'min-w-[180px]' : 'flex-1'}
            />
          ))}
        </div>
      </div>

      {/* KPI Detail Drawer */}
      <KpiDetailDrawer
        kpi={selectedKpi}
        onClose={() => setSelectedKpi(null)}
      />
    </>
  );
}
