/**
 * Extra primitives for the Product Health dashboard — funnel, gauge, progress
 * rows, grouped bars. Everything else comes from ../business-health/bhKit.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import { CHART_AXIS_LABEL, CHART_BORDER, CHART_GRID, CHART_SEQUENTIAL, CHART_STATUS } from '@/data/chartColors';
import { useDateRange, windowSeries } from '../shared/dateRange';

const TOOLTIP_STYLE = { fontSize: 12, borderRadius: 8, border: `1px solid ${CHART_BORDER}` } as const;

/* ── Funnel ──────────────────────────────────────────────────────────── */

export interface FunnelStage {
  label: string;
  value: number;
}

export function Funnel({ stages }: { stages: FunnelStage[] }): React.ReactNode {
  const start = stages[0]?.value ?? 1;
  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const prev = i === 0 ? s.value : stages[i - 1]!.value;
        const fromStart = start > 0 ? Math.round((s.value / start) * 100) : 0;
        const fromPrev = prev > 0 ? Math.round((s.value / prev) * 100) : 0;
        const dropCount = Math.max(0, prev - s.value);
        const dropPct = prev ? Math.round((dropCount / prev) * 100) : 0;
        return (
          <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-3">
            {/* eslint-disable-next-line design-system/prefer-section-header -- funnel row label, not a section header */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-gray-700">
                {i + 1}. {s.label}
              </span>
              <span className="text-sm font-semibold tabular-nums text-gray-900">{s.value.toLocaleString('en-IN')}</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
              {/* eslint-disable-next-line no-restricted-syntax -- dynamic funnel bar width */}
              <div className="h-full rounded-full bg-primary-400" style={{ width: `${Math.min(100, fromStart)}%` }} />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-gray-400">
              <span>{fromStart}% of start</span>
              <span>{fromPrev}% of previous</span>
              {i > 0 && (
                <span className="text-amber-600">
                  −{dropCount.toLocaleString('en-IN')} drop-off ({dropPct}%)
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Gauge / completion card ─────────────────────────────────────────── */

export function Gauge({
  value,
  label,
  sublabel,
  status,
}: {
  value: number;
  label: string;
  sublabel?: string;
  status?: 'success' | 'warning' | 'critical';
}): React.ReactNode {
  const size = 132;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = r * 2 * Math.PI;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-2">
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          role="img"
          aria-label={`${label}: ${value}%${status ? ` (${status})` : ''}`}
        >
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={CHART_GRID} strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={status ? CHART_STATUS[status] : CHART_SEQUENTIAL[0]}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute text-xl font-semibold tabular-nums text-gray-900">{value}%</span>
      </div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
    </div>
  );
}

/* ── Progress rows (attribute fill, etc.) ────────────────────────────── */

export function ProgressRows({ data }: { data: { label: string; pct: number }[] }): React.ReactNode {
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">{d.label}</span>
            <span className="font-medium tabular-nums text-gray-900">{d.pct}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn('h-full rounded-full', d.pct >= 80 ? 'bg-primary-500' : d.pct >= 50 ? 'bg-primary-400' : 'bg-amber-400')}
              // eslint-disable-next-line no-restricted-syntax -- dynamic progress width
              style={{ width: `${d.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Stacked bar chart (generic) ─────────────────────────────────────── */

export function StackedBar({
  data,
  xKey,
  series,
  height = 240,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; label: string }[];
  height?: number;
}): React.ReactNode {
  const range = useDateRange();
  const rows =
    xKey === 'date'
      ? (windowSeries(data as { date: string }[], range) as Record<string, string | number>[])
      : data;
  return (
    <ResponsiveContainer width="100%" minWidth={0} height={height}>
      <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: CHART_AXIS_LABEL }}
          axisLine={{ stroke: CHART_BORDER }}
          tickLine={false}
          minTickGap={16}
          tickFormatter={(v: string) => (xKey === 'date' ? v.slice(5) : v)}
        />
        <YAxis tick={{ fontSize: 11, fill: CHART_AXIS_LABEL }} axisLine={false} tickLine={false} width={44} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
        <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={CHART_SEQUENTIAL[i]} maxBarSize={40} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Grouped bar chart ───────────────────────────────────────────────── */

export function GroupedBar({
  data,
  xKey,
  series,
  height = 240,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; label: string }[];
  height?: number;
}): React.ReactNode {
  return (
    <ResponsiveContainer width="100%" minWidth={0} height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: CHART_AXIS_LABEL }} axisLine={{ stroke: CHART_BORDER }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: CHART_AXIS_LABEL }} axisLine={false} tickLine={false} width={40} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
        <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={CHART_SEQUENTIAL[i]} radius={[3, 3, 0, 0]} maxBarSize={28} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
