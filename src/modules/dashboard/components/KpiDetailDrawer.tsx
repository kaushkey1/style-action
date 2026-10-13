import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Badge, Button } from '@/components/ui';
import { DetailPanel, DetailPanelSection } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { CHART_STATUS, CHART_GRID, CHART_AXIS_TICK, CHART_BORDER } from '@/data/chartColors';
import type { HealthKpi } from '../data/mockHealthKpis';
import { kpiTrendData } from '../data/mockHealthKpis';

const STATUS_COLOR = {
  on_track: CHART_STATUS.success,
  warning: CHART_STATUS.warning,
  critical: CHART_STATUS.critical,
};

const STATUS_LABEL: Record<string, string> = {
  on_track: 'On Track',
  warning: 'Warning',
  critical: 'Critical',
};

interface KpiDetailDrawerProps {
  kpi: HealthKpi | null;
  onClose: () => void;
}

export function KpiDetailDrawer({ kpi, onClose }: KpiDetailDrawerProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!kpi) return null;

  const trendData = kpiTrendData[kpi.id] ?? [];
  const fillColor = STATUS_COLOR[kpi.status] ?? STATUS_COLOR.on_track;

  return (
    <DetailPanel
      isOpen={!!kpi}
      onClose={onClose}
      title={kpi.label}
      subtitle={`${kpi.valueFormatted} · Target: ${kpi.target}`}
      width="lg"
    >
      <div className="space-y-4">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <Badge variant={kpi.status === 'critical' ? 'error' : kpi.status === 'warning' ? 'warning' : 'success'}>
            {STATUS_LABEL[kpi.status]}
          </Badge>
          <span className={cn(
            'text-xs font-medium',
            kpi.trendDirection === 'down' ? 'text-red-600' : kpi.trendDirection === 'up' ? 'text-green-600' : 'text-gray-500',
          )}>
            {kpi.trendDirection === 'down' ? '↘' : kpi.trendDirection === 'up' ? '↗' : '→'} {Math.abs(kpi.trendDelta)}% {kpi.trendLabel}
          </span>
        </div>

        {/* 30-day trend chart */}
        <DetailPanelSection title="30-Day Trend">
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" minWidth={0} height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: isMobile ? -10 : -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: isMobile ? 10 : 12, fill: CHART_AXIS_TICK }}
                  tickLine={false}
                  axisLine={{ stroke: CHART_BORDER }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: CHART_AXIS_TICK }}
                  tickLine={false}
                  axisLine={false}
                  hide={isMobile}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: `1px solid ${CHART_BORDER}`,
                  }}
                />
                <ReferenceLine
                  y={kpi.targetValue}
                  stroke={CHART_AXIS_TICK}
                  strokeDasharray="4 4"
                  label={{
                    value: 'Target',
                    position: 'right',
                    fontSize: 12,
                    fill: CHART_AXIS_TICK,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={fillColor}
                  fill={fillColor}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DetailPanelSection>

        {/* Agent commentary */}
        <DetailPanelSection title="Agent Commentary">
          <p className="text-xs text-gray-700 leading-relaxed">{kpi.agentCommentary}</p>
        </DetailPanelSection>

        {/* Deep link */}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs w-full justify-start gap-1"
          onClick={() => { navigate(kpi.tabDeepLink); onClose(); }}
        >
          Go to {kpi.label} tab
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </DetailPanel>
  );
}
