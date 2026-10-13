import { AlertTriangle, CheckCircle2, Clock, Activity, Users, TrendingDown } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Badge, SectionHeader, MetricGrid, DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell, EmptyState } from '@/components/ui';
import { mockCalendarHealth } from '../data/mockCalendarHealth';
import type { JourneyPhase } from '../data/mockCalendarJourney';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { CHART_PRIMARY, CHART_STATUS, CHART_GRID, CHART_AXIS_TICK, CHART_BORDER } from '@/data/chartColors';

// ─── Visual configs ────────────────────────────────────────────────

const phaseColors: Record<JourneyPhase, string> = {
  PLAN: 'bg-primary',
  BUY: 'bg-secondary',
  MAKE: 'bg-violet-500',
  MOVE: 'bg-teal-500',
  SELL: 'bg-success',
};

function healthColor(score: number) {
  if (score >= 90) return 'text-success';
  if (score >= 75) return 'text-warning';
  return 'text-error';
}

function healthBadge(score: number): { label: string; variant: 'success' | 'warning' | 'error' } {
  if (score >= 90) return { label: 'On Track', variant: 'success' };
  if (score >= 75) return { label: 'Below Target', variant: 'warning' };
  return { label: 'Critical', variant: 'error' };
}

// ─── KPI Tiles ─────────────────────────────────────────────────────

function HealthKPITiles() {
  const h = mockCalendarHealth;
  const totalMilestones = Object.values(h.byPhase).reduce((s, p) => s + p.activeMilestones, 0);
  const onTimeMilestones = Object.values(h.byPhase).reduce((s, p) => s + p.onTime, 0);
  const onTimePct = Math.round((onTimeMilestones / totalMilestones) * 100);

  const tiles = [
    {
      label: 'Calendar Health',
      value: `${h.overall}%`,
      sub: h.overall < 90 ? 'Below target' : 'On target',
      icon: Activity,
      color: healthColor(h.overall),
      subColor: h.overall < 90 ? 'text-warning' : 'text-success',
    },
    {
      label: 'Active Drops',
      value: h.byPod.reduce((s, p) => s + p.activeDrops, 0).toString(),
      sub: `${h.byPod.length} PODs`,
      icon: Clock,
      color: 'text-gray-900',
      subColor: 'text-gray-500',
    },
    {
      label: 'Milestones On Time',
      value: `${onTimeMilestones}/${totalMilestones}`,
      sub: `${onTimePct}%`,
      icon: CheckCircle2,
      color: healthColor(onTimePct),
      subColor: 'text-gray-500',
    },
    {
      label: 'Human Gates Pending',
      value: h.pendingGates.toString(),
      sub: `${h.overdueGates} overdue`,
      icon: Users,
      color: 'text-gray-900',
      subColor: h.overdueGates > 0 ? 'text-error' : 'text-gray-500',
    },
  ];

  return (
    <MetricGrid>
      {tiles.map((t) => (
        <div key={t.label} className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between gap-1 mb-1">
            <p className="text-xs text-gray-500">{t.label}</p>
            <t.icon className="w-4 h-4 text-gray-400" />
          </div>
          <p className={cn('text-xl font-bold', t.color)}>{t.value}</p>
          <p className={cn('text-[10px]', t.subColor)}>{t.sub}</p>
        </div>
      ))}
    </MetricGrid>
  );
}

// ─── Health by Phase Table ─────────────────────────────────────────

function HealthByPhase() {
  const phases: JourneyPhase[] = ['PLAN', 'BUY', 'MAKE', 'MOVE', 'SELL'];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <SectionHeader title="Health by Phase" />
      <DataTable>
          <DataTableHeader>
              <DataTableHead>Phase</DataTableHead>
              <DataTableHead align="right">Active Milestones</DataTableHead>
              <DataTableHead align="right">On Time</DataTableHead>
              <DataTableHead align="right">At Risk</DataTableHead>
              <DataTableHead align="right">Missed</DataTableHead>
              <DataTableHead align="right">Health</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {phases.map((phase) => {
              const p = mockCalendarHealth.byPhase[phase];
              const badge = healthBadge(p.health);
              return (
                <DataTableRow key={phase} className="border-b border-gray-50 last:border-0">
                  <DataTableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', phaseColors[phase])} />
                      <span className="font-medium text-gray-900">{phase}</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell align="right">{p.activeMilestones}</DataTableCell>
                  <DataTableCell align="right" className="text-success font-medium">{p.onTime}</DataTableCell>
                  <DataTableCell align="right" className="text-warning font-medium">{p.atRisk}</DataTableCell>
                  <DataTableCell align="right" className="text-error font-medium">{p.missed}</DataTableCell>
                  <DataTableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={cn('font-bold', healthColor(p.health))}>{p.health}%</span>
                      <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              );
            })}
          </DataTableBody>
      </DataTable>
    </div>
  );
}

// ─── Health by POD Table ───────────────────────────────────────────

function HealthByPod() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <SectionHeader title="Health by POD" />
      <DataTable>
          <DataTableHeader>
              <DataTableHead>POD</DataTableHead>
              <DataTableHead align="right">Active Drops</DataTableHead>
              <DataTableHead align="right">Health</DataTableHead>
              <DataTableHead align="right">Cascade Risks</DataTableHead>
              <DataTableHead align="right">Gates Pending</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {mockCalendarHealth.byPod.length === 0 ? (
              <tr><td colSpan={5}><EmptyState description="No pod health data to display" /></td></tr>
            ) : mockCalendarHealth.byPod.map((pod) => {
              const badge = healthBadge(pod.health);
              return (
                <DataTableRow key={pod.podId} className="border-b border-gray-50 last:border-0">
                  <DataTableCell>
                    <div>
                      <span className="font-medium text-gray-900">{pod.podName}</span>
                      <span className="text-[10px] text-gray-500 ml-1">({pod.podId})</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell align="right">{pod.activeDrops}</DataTableCell>
                  <DataTableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={cn('font-bold', healthColor(pod.health))}>{pod.health}%</span>
                      <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
                    </div>
                  </DataTableCell>
                  <DataTableCell align="right">
                    {pod.cascadeRisks > 0 ? (
                      <div className="flex items-center justify-end gap-1">
                        <AlertTriangle className="w-3 h-3 text-error" />
                        <span className="text-error font-medium">{pod.cascadeRisks}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </DataTableCell>
                  <DataTableCell align="right">
                    {pod.pendingGates > 0 ? (
                      <span className="text-warning font-medium">{pod.pendingGates}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </DataTableCell>
                </DataTableRow>
              );
            })}
          </DataTableBody>
      </DataTable>
    </div>
  );
}

// ─── Weekly Trend Chart ────────────────────────────────────────────

function HealthTrendChart() {
  const isMobile = useIsMobile();
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <SectionHeader
        title="Calendar Health Trend (Last 12 Weeks)"
        actions={
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <TrendingDown className="w-3 h-3 text-warning" />
            <span>Declining trend</span>
          </div>
        }
      />
      <ResponsiveContainer width="100%" minWidth={0} height={240}>
        <LineChart data={mockCalendarHealth.weeklyTrend}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: isMobile ? 10 : 11, fill: CHART_AXIS_TICK }}
            axisLine={{ stroke: CHART_BORDER }}
            interval={isMobile ? "preserveStartEnd" : 0}
          />
          <YAxis
            domain={[70, 100]}
            tick={{ fontSize: 11, fill: CHART_AXIS_TICK }}
            axisLine={{ stroke: CHART_BORDER }}
            tickFormatter={(v: number) => `${v}%`}
            hide={isMobile}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: `1px solid ${CHART_BORDER}`,
              fontSize: '12px',
            }}
            formatter={(value) => [`${value}%`, 'Health']}
          />
          <ReferenceLine
            y={90}
            stroke={CHART_STATUS.warning}
            strokeDasharray="6 3"
            label={{
              value: 'Target (90%)',
              position: 'right',
              fontSize: 10,
              fill: CHART_STATUS.warning,
            }}
          />
          <Line
            type="monotone"
            dataKey="health"
            stroke={CHART_PRIMARY}
            strokeWidth={2}
            dot={{ r: 3, fill: CHART_PRIMARY, stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: CHART_PRIMARY }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────

export function CalendarHealthPage() {
  return (
    <div className="space-y-4 animate-fadeInUp">
      <HealthKPITiles />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <HealthByPhase />
        <HealthByPod />
      </div>
      <HealthTrendChart />
    </div>
  );
}
