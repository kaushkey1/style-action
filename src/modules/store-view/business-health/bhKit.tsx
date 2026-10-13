/**
 * Presentational kit for the Business Health dashboard. Pure UI — feed it the
 * mock data from mockBusinessHealth.ts. Recharts + design-system tokens only.
 */
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { ChevronDown, ChevronLeft, ChevronRight, MapPin, RefreshCw, Sparkles } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SectionHeader } from '@/components/ui';
import { cn, formatRelativeTime } from '@/lib/utils';
import {
  CHART_AXIS_LABEL,
  CHART_BORDER,
  CHART_CATEGORICAL,
  CHART_GRID,
  CHART_PRIMARY,
  CHART_SEQUENTIAL,
  CHART_STATUS,
} from '@/data/chartColors';
import { useDateRange, windowSeries } from '../shared/dateRange';

type Tone = 'success' | 'info' | 'warning' | 'critical' | 'neutral';

const TONE_HEX: Record<Tone, string> = {
  success: CHART_STATUS.success,
  info: CHART_PRIMARY,
  warning: CHART_STATUS.warning,
  critical: CHART_STATUS.critical,
  neutral: CHART_STATUS.neutral,
};

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 8,
  border: `1px solid ${CHART_BORDER}`,
} as const;

/** Render **bold** spans inside otherwise-plain briefing text. */
function renderRich(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
    chunk.startsWith('**') && chunk.endsWith('**') ? (
      <strong key={i} className="font-semibold text-gray-900">
        {chunk.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{chunk}</span>
    ),
  );
}

/* ── AI briefing (Morning-Briefing-style banner) ─────────────────────── */

export function AiBriefing({
  label,
  question,
  summary,
  updatedAt,
  loading = false,
  refreshing = false,
  onRefresh,
}: {
  label: string;
  question: string;
  summary: string;
  /** ISO timestamp of the last generation (shown as relative time). */
  updatedAt?: string | null;
  /** First-load state — shows skeleton lines. */
  loading?: boolean;
  /** Refresh in progress — spins the icon and disables the button. */
  refreshing?: boolean;
  /** When provided, renders a Refresh button that force-regenerates. */
  onRefresh?: () => void;
}): React.ReactNode {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-lg border border-gray-200 bg-gradient-to-br from-primary-50/50 to-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" aria-hidden /> AI Generated
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
          {updatedAt && (
            <span className="text-xs text-gray-400">· updated {formatRelativeTime(updatedAt)}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing || loading}
              aria-label="Regenerate briefing"
              title="Regenerate briefing"
              className="rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} aria-hidden />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Collapse briefing' : 'Expand briefing'}
            className="rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
          </button>
        </div>
      </div>
      {loading ? (
        <div className="mt-3 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
        </div>
      ) : (
        <>
          <h2 className="mt-2 text-base font-semibold text-gray-900">{question}</h2>
          {open && <p className="mt-1 text-sm leading-relaxed text-gray-600">{renderRich(summary)}</p>}
        </>
      )}
    </section>
  );
}

/* ── AI insights (dedicated pill) ────────────────────────────────────── */

type InsightTone = 'positive' | 'watch' | 'critical';
const INSIGHT_TONE: Record<InsightTone, { border: string; chip: string; label: string }> = {
  positive: { border: 'border-green-200', chip: 'bg-green-50 text-green-700', label: 'Opportunity' },
  watch: { border: 'border-amber-200', chip: 'bg-amber-50 text-amber-700', label: 'Watch' },
  critical: { border: 'border-red-200', chip: 'bg-red-50 text-red-700', label: 'Risk' },
};

export function AiInsights({
  items,
}: {
  items: {
    id: string;
    tone: InsightTone;
    title: string;
    body: string;
    metric?: string;
    recommendation?: string;
    confidence?: string;
  }[];
}): React.ReactNode {
  return (
    <div className="space-y-3">
      {items.map((it) => {
        const t = INSIGHT_TONE[it.tone];
        return (
          <div key={it.id} className={cn('rounded-lg border bg-white p-4', t.border)}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', t.chip)}>{t.label}</span>
              {it.confidence && <span className="text-xs text-gray-400">{it.confidence} confidence</span>}
            </div>
            <p className="mt-2 text-sm font-semibold text-gray-900">{it.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{renderRich(it.body)}</p>
            {it.metric && <p className="mt-2 text-sm font-semibold tabular-nums text-gray-900">{it.metric}</p>}
            {it.recommendation && (
              <p className="mt-2 text-xs text-gray-500">
                <span className="font-medium text-gray-700">Recommended:</span> {it.recommendation}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Panel ───────────────────────────────────────────────────────────── */

export function Panel({
  title,
  subtitle,
  actions,
  className,
  children,
}: {
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
      <SectionHeader title={title} subtitle={subtitle} actions={actions} />
      {children}
    </div>
  );
}

/* ── ChartPanel — Panel with a chart ⇄ table toggle ──────────────────── */

export function ChartPanel({
  title,
  subtitle,
  table,
  children,
}: {
  title: React.ReactNode;
  subtitle?: string;
  /** Table view of the same data. Omit to render a plain Panel. */
  table?: React.ReactNode;
  children: React.ReactNode;
}): React.ReactNode {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return (
    <Panel
      title={title}
      subtitle={subtitle}
      actions={
        table ? (
          <div className="inline-flex rounded-md border border-gray-300 p-0.5 text-xs">
            {(['chart', 'table'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn('rounded px-2 py-0.5 font-medium capitalize', view === v ? 'bg-primary-50 text-primary' : 'text-gray-500')}
              >
                {v}
              </button>
            ))}
          </div>
        ) : undefined
      }
    >
      {!table || view === 'chart' ? children : table}
    </Panel>
  );
}

/* ── KPI grid ────────────────────────────────────────────────────────── */

interface Kpi {
  key: string;
  label: string;
  value: string;
  trend?: string;
  status?: 'success' | 'warning' | 'critical';
}

const KPI_STATUS_TEXT = {
  success: 'text-green-600',
  warning: 'text-amber-600',
  critical: 'text-red-600',
} as const;

export function KpiGrid({ items, statusKeys = [] }: { items: Kpi[]; statusKeys?: readonly string[] }): React.ReactNode {
  return (
    // eslint-disable-next-line design-system/prefer-metric-grid -- compact KPI tiles, mock prototype
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((k) => (
        <div key={k.key} className="rounded-lg border border-gray-200 bg-white p-3.5">
          <p className="text-xs font-medium text-gray-500">{k.label}</p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <p className={cn(
              'text-lg font-semibold tabular-nums',
              statusKeys.includes(k.key) && k.status ? KPI_STATUS_TEXT[k.status] : 'text-gray-900',
            )}>{k.value}</p>
            {k.trend && (
              <span
                className={cn(
                  'text-xs font-medium',
                  k.trend.startsWith('+')
                    ? 'text-green-600'
                    : k.trend.startsWith('-')
                      ? 'text-red-600'
                      : 'text-gray-400',
                )}
              >
                {k.trend}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Trend chart (line / area, one or more series) ────────────────────── */

interface Series {
  key: string;
  label: string;
  color?: string;
}

export function TrendChart({
  data,
  xKey = 'date',
  series,
  height = 220,
  area = false,
  valueFormatter,
}: {
  data: Record<string, string | number>[];
  xKey?: string;
  series: Series[];
  height?: number;
  area?: boolean;
  valueFormatter?: (v: number) => string;
}): React.ReactNode {
  const fmt = valueFormatter ?? ((v: number) => v.toLocaleString('en-IN'));
  const Chart = area ? AreaChart : LineChart;
  const range = useDateRange();
  const rows =
    xKey === 'date'
      ? (windowSeries(data as { date: string }[], range) as Record<string, string | number>[])
      : data;
  return (
    <ResponsiveContainer width="100%" minWidth={0} height={height}>
      <Chart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: CHART_AXIS_LABEL }}
          axisLine={{ stroke: CHART_BORDER }}
          tickLine={false}
          minTickGap={24}
          tickFormatter={(v: string) => (xKey === 'date' ? v.slice(5) : v)}
        />
        <YAxis
          tick={{ fontSize: 11, fill: CHART_AXIS_LABEL }}
          axisLine={false}
          tickLine={false}
          width={44}
          tickFormatter={(v: number) => fmt(v)}
        />
        <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={TOOLTIP_STYLE} />
        {series.length > 1 && <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => {
          const color = s.color ?? CHART_CATEGORICAL[i % CHART_CATEGORICAL.length];
          return area ? (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={color}
              fill={color}
              fillOpacity={0.12}
              strokeWidth={2}
            />
          ) : (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          );
        })}
      </Chart>
    </ResponsiveContainer>
  );
}

/* ── Vertical bar chart (monthly totals, histograms) ──────────────────── */

export function VBarChart({
  data,
  xKey,
  yKey = 'value',
  height = 220,
  valueFormatter,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey?: string;
  height?: number;
  valueFormatter?: (v: number) => string;
}): React.ReactNode {
  const fmt = valueFormatter ?? ((v: number) => v.toLocaleString('en-IN'));
  return (
    <ResponsiveContainer width="100%" minWidth={0} height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: CHART_AXIS_LABEL }} axisLine={{ stroke: CHART_BORDER }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: CHART_AXIS_LABEL }} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => fmt(v)} />
        <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
        <Bar dataKey={yKey} fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Horizontal bar list (top N), optional pagination ─────────────────── */

export function BarList({
  data,
  valueFormatter,
  pageSize,
  unit,
}: {
  data: { label: string; value: number }[];
  valueFormatter?: (v: number) => string;
  pageSize?: number;
  unit?: string;
}): React.ReactNode {
  const fmt = valueFormatter ?? ((v: number) => v.toLocaleString('en-IN'));
  const [page, setPage] = useState(0);
  const paged = pageSize ? data.slice(page * pageSize, page * pageSize + pageSize) : data;
  const max = Math.max(...data.map((d) => d.value), 1);
  const pageCount = pageSize ? Math.ceil(data.length / pageSize) : 1;

  return (
    <div className="space-y-2.5">
      {paged.map((d) => (
        <div key={d.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-gray-600">{d.label}</span>
              <span className="shrink-0 text-xs font-medium tabular-nums text-gray-900">
                {fmt(d.value)}
                {unit ? ` ${unit}` : ''}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
              {/* eslint-disable-next-line no-restricted-syntax -- dynamic bar width */}
              <div className="h-full rounded-full bg-primary-400" style={{ width: `${(d.value / max) * 100}%` }} />
            </div>
          </div>
        </div>
      ))}
      {pageSize && pageCount > 1 && (
        <div className="flex items-center justify-end gap-2 pt-1 text-xs text-gray-500">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded p-1 hover:bg-gray-100 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="tabular-nums">
            {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page === pageCount - 1}
            className="rounded p-1 hover:bg-gray-100 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Donut ───────────────────────────────────────────────────────────── */

export function Donut({
  data,
  height = 220,
  valueFormatter,
}: {
  data: { label: string; value: number }[];
  height?: number;
  valueFormatter?: (v: number) => string;
}): React.ReactNode {
  const fmt = valueFormatter ?? ((v: number) => v.toLocaleString('en-IN'));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <ResponsiveContainer width="100%" minWidth={0} height={height} className="max-w-[220px]">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="90%" paddingAngle={2} strokeWidth={0}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_CATEGORICAL[i % CHART_CATEGORICAL.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={TOOLTIP_STYLE} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="w-full space-y-1.5">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-gray-600">
              {/* eslint-disable-next-line no-restricted-syntax -- legend swatch takes a data colour */}
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_CATEGORICAL[i % CHART_CATEGORICAL.length] }} />
              {d.label}
            </span>
            <span className="tabular-nums text-gray-900">
              {fmt(d.value)} · {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Status ribbon (order lifecycle) ─────────────────────────────────── */

export function StatusRibbon({
  segments,
}: {
  segments: { label: string; value: number; tone: Tone }[];
}): React.ReactNode {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full">
        {segments.map((s) => (
          <div
            key={s.label}
            // eslint-disable-next-line no-restricted-syntax -- dynamic segment width + data colour
            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: TONE_HEX[s.tone] }}
          />
        ))}
      </div>
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- ribbon legend, not a KPI strip */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        {segments.map((s) => (
          <div key={s.label}>
            <div className="flex items-center gap-1.5">
              {/* eslint-disable-next-line no-restricted-syntax -- legend swatch takes a data colour */}
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TONE_HEX[s.tone] }} />
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-gray-900">
              {s.value.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-normal text-gray-400">{Math.round((s.value / total) * 100)}%</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Simple table ────────────────────────────────────────────────────── */

export function MiniTable<T extends Record<string, React.ReactNode>>({
  columns,
  rows,
  onRowClick,
  isRowActive,
}: {
  columns: { key: keyof T & string; label: string; align?: 'left' | 'right' }[];
  rows: T[];
  /** Makes rows clickable. */
  onRowClick?: (row: T, index: number) => void;
  /** Highlights the row the caller considers selected. */
  isRowActive?: (row: T, index: number) => boolean;
}): React.ReactNode {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100 text-gray-500">
            {columns.map((c) => (
              <th key={c.key} className={cn('py-2 pr-4 font-medium', c.align === 'right' ? 'text-right' : 'text-left')}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              onClick={onRowClick ? () => onRowClick(r, i) : undefined}
              className={cn(
                'border-b border-gray-50 last:border-0',
                onRowClick && 'cursor-pointer hover:bg-primary-50/60',
                !onRowClick && 'hover:bg-gray-50',
                isRowActive?.(r, i) && 'bg-primary-50',
              )}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn('py-2 pr-4 tabular-nums text-gray-700', c.align === 'right' && 'text-right')}>
                  {r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Stacked state activity ──────────────────────────────────────────── */

export function StackedStateChart({
  data,
}: {
  data: { state: string; ordering: number; scanOnly: number; inactive: number }[];
}): React.ReactNode {
  const keys: { key: 'ordering' | 'scanOnly' | 'inactive'; label: string }[] = [
    { key: 'ordering', label: 'Ordering' },
    { key: 'scanOnly', label: 'Scan only' },
    { key: 'inactive', label: 'Inactive' },
  ];
  return (
    <ResponsiveContainer width="100%" minWidth={0} height={240}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
        <XAxis dataKey="state" tick={{ fontSize: 11, fill: CHART_AXIS_LABEL }} axisLine={{ stroke: CHART_BORDER }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: CHART_AXIS_LABEL }} axisLine={false} tickLine={false} width={36} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
        <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
        {keys.map((k, i) => (
          <Bar key={k.key} dataKey={k.key} name={k.label} stackId="a" fill={CHART_SEQUENTIAL[i]} maxBarSize={36} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Scatter (scans vs orders) ───────────────────────────────────────── */

export function ScatterCompare({
  data,
}: {
  data: { store: string; scans: number; orders: number }[];
}): React.ReactNode {
  return (
    <ResponsiveContainer width="100%" minWidth={0} height={260}>
      <ScatterChart margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
        <XAxis
          type="number"
          dataKey="scans"
          name="Scans"
          tick={{ fontSize: 11, fill: CHART_AXIS_LABEL }}
          axisLine={{ stroke: CHART_BORDER }}
          tickLine={false}
          label={{ value: 'Scan lookups', position: 'insideBottom', offset: -4, fontSize: 11, fill: CHART_AXIS_LABEL }}
        />
        <YAxis
          type="number"
          dataKey="orders"
          name="Orders"
          tick={{ fontSize: 11, fill: CHART_AXIS_LABEL }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <ZAxis range={[60, 60]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(v, n) => [Number(v).toLocaleString('en-IN'), n]}
          labelFormatter={() => ''}
        />
        <Scatter data={data} fill={CHART_PRIMARY} fillOpacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ── Geo store map (react-leaflet + OpenStreetMap) ───────────────────── */

export interface StoreMapPin {
  name: string;
  city: string;
  activity: string;
  lat: number;
  lng: number;
}

// Pin colour for stores without a recognised activity (or the single-store view).
const PIN_FALLBACK = CHART_STATUS.neutral;

// Activity → pin colour, matching the "Store activity mix" Donut encoding
// (CHART_CATEGORICAL in backend order). Unknown activities fall back to neutral.
const ACTIVITY_PIN_COLOR: Record<string, string> = {
  'Ordering + scanning': CHART_CATEGORICAL[0] ?? PIN_FALLBACK, // indigo
  'Ordering only': CHART_CATEGORICAL[1] ?? PIN_FALLBACK, // teal
  'Scan only': CHART_CATEGORICAL[2] ?? PIN_FALLBACK, // amber
  'Registered, inactive': CHART_CATEGORICAL[3] ?? PIN_FALLBACK, // pink
};

// India's geographic centre + a whole-country zoom for the network view.
const INDIA_CENTER: [number, number] = [22.9734, 78.6569];
const INDIA_ZOOM = 4;
const SINGLE_STORE_ZOOM = 13;

// Fixed 240px map viewport — matches the panel height the placeholder used.
const MAP_FRAME_CLASS = 'h-[240px]';

function MapFrame({ children }: { children: React.ReactNode }): React.ReactNode {
  // `isolate` gives Leaflet its own stacking context so its high pane/control
  // z-indexes can't paint over surrounding sticky UI (mirrors the Competition map).
  return (
    <div className={cn(MAP_FRAME_CLASS, 'isolate overflow-hidden rounded-lg border border-gray-200 bg-white')}>
      {children}
    </div>
  );
}

function MapMessage({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <div
      className={cn(
        MAP_FRAME_CLASS,
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center',
      )}
    >
      <MapPin className="h-6 w-6 text-gray-400" aria-hidden />
      <p className="text-sm text-gray-500">{children}</p>
    </div>
  );
}

/**
 * Geographic store map. Renders one or many store pins on an OpenStreetMap
 * base layer. Pass a single store for the detail view (centres + zooms in) or
 * the full network for the "Store locations" panel (fits India). Handles
 * loading / error / empty states so callers can pass the query flags directly.
 */
export function StoreMap({
  stores,
  loading = false,
  error = false,
  label = 'Store locations',
}: {
  stores: StoreMapPin[];
  loading?: boolean;
  error?: boolean;
  label?: string;
}): React.ReactNode {
  if (loading) return <MapMessage>Loading {label.toLowerCase()}…</MapMessage>;
  if (error) return <MapMessage>Map unavailable — could not load store locations</MapMessage>;
  const [first] = stores;
  if (!first) return <MapMessage>No mapped store locations</MapMessage>;

  const single = stores.length === 1;
  const center: [number, number] = single ? [first.lat, first.lng] : INDIA_CENTER;
  const zoom = single ? SINGLE_STORE_ZOOM : INDIA_ZOOM;

  return (
    <MapFrame>
      <MapContainer center={center} zoom={zoom} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stores.map((store, i) => {
          const color = ACTIVITY_PIN_COLOR[store.activity] ?? PIN_FALLBACK;
          return (
            <CircleMarker
              key={`${store.lat},${store.lng},${i}`}
              center={[store.lat, store.lng]}
              radius={single ? 8 : 4}
              pathOptions={{ fillColor: color, fillOpacity: 0.8, color, weight: 1 }}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold text-gray-900">{store.name}</p>
                  {store.city && <p className="text-gray-500">{store.city}</p>}
                  <p className="text-gray-500">{store.activity}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </MapFrame>
  );
}

/* ── Attention card ──────────────────────────────────────────────────── */

export function AttentionCard({
  title,
  value,
  note,
  status,
}: {
  title: string;
  value: string;
  note: string;
  status: 'critical' | 'warning';
}): React.ReactNode {
  return (
    <div
      className={cn(
        'rounded-lg border bg-white p-3.5',
        status === 'critical' ? 'border-red-200' : 'border-amber-200',
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn('h-2 w-2 rounded-full', status === 'critical' ? 'bg-red-500' : 'bg-amber-500')}
        />
        <p className="text-xs font-medium text-gray-500">{title}</p>
      </div>
      <p className="mt-1.5 text-lg font-semibold tabular-nums text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-400">{note}</p>
    </div>
  );
}
