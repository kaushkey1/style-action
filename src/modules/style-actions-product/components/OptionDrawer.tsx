import { CompactButton as Button } from './CompactButton';
import { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { brickName, brickOf, POSITION_LABEL, type InventoryPosition, type SalesWindow } from './journey/inventoryJourney';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import {
  Badge,
  ChartLegendContent,
  ChartTooltipContent,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  MetricGrid,
  Sheet,
} from '@/components/ui';
import { CHART_ACTUAL, CHART_AXIS_TICK, CHART_BASELINE, CHART_GRID } from '@/data/chartColors';
import { useIsMobile } from '@/hooks/useMediaQuery';

import { BreakdownBars } from './journey/BreakdownBars';
import { breakdownUnits, optionBreakdown } from './journey/inventoryBreakdown';
import { OptionEngineResults } from './engine/OptionEngineResults';
import { useOptionStore } from '../api/queries';
import { EMPTY, formatDay, formatPercent, formatUnits } from './display';
import { AvailabilityGrid, HealthFacts, ShelfContext } from './OptionHealthSection';
import { MissingEvidence } from './Panel';
import { ErrorBlock, LoadingBlock } from './QueryStates';

import type { ChartConfig } from '@/components/ui';

import type { OptionStoreDetail } from '../api/types';

const CHART_HEIGHT = 180;
const CURVE_CONFIG: ChartConfig = {
  Expected: { label: 'Expected', color: CHART_BASELINE },
  Actual: { label: 'Actual', color: CHART_ACTUAL },
};
const PERCENT = 100;

function Section({ title, subtitle, children }: { readonly title: string; readonly subtitle?: string; readonly children: React.ReactNode }): React.ReactNode {
  return (
    <section className="space-y-2 border-t border-gray-100 pt-3">
      <div>
        <h3 className="text-xs font-semibold text-gray-900">{title}</h3>
        {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function CurveChart({ detail }: { readonly detail: OptionStoreDetail }): React.ReactNode {
  const isMobile = useIsMobile();
  if (!detail.curve.length) return <MissingEvidence>No GRN date at this store, so there is no curve to draw.</MissingEvidence>;
  const data = detail.curve.map((point) => ({
    day: `Day ${point.day}`,
    Expected: point.expected_pct === null ? null : point.expected_pct * PERCENT,
    Actual: point.actual_pct === null ? null : point.actual_pct * PERCENT,
  }));
  return (
    <figure aria-label="Expected versus actual sell-through by day in store">
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke={CHART_GRID} vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: CHART_AXIS_TICK }} tickFormatter={(value: string) => value.replace('Day ', '')} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 11, fill: CHART_AXIS_TICK }} unit="%" hide={isMobile} />
          <Tooltip
            cursor={{ stroke: CHART_GRID, strokeWidth: 1 }}
            content={<ChartTooltipContent config={CURVE_CONFIG} valueFormatter={(value) => (typeof value === 'number' ? `${value.toFixed(1)}%` : EMPTY)} className="px-2 py-1.5 shadow-sm" />}
          />
          <Legend content={<ChartLegendContent config={CURVE_CONFIG} />} />
          <Line type="linear" dataKey="Expected" stroke={CHART_BASELINE} strokeDasharray="4 3" dot={false} activeDot={{ r: 3 }} connectNulls isAnimationActive={false} />
          <Line type="linear" dataKey="Actual" stroke={CHART_ACTUAL} dot={{ r: 2 }} activeDot={{ r: 3 }} connectNulls isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <figcaption className="text-xs text-gray-500">
        75% @ day 60{detail.row.curve_provisional ? ' · after day 60: provisional' : ''}
      </figcaption>
    </figure>
  );
}

function WeeklySales({ weeks }: { readonly weeks: OptionStoreDetail['weekly_sales'] }): React.ReactNode {
  if (!weeks.length) return <MissingEvidence>No sales in the sales window.</MissingEvidence>;
  const max = Math.max(1, ...weeks.map((week) => Math.abs(week.units)));
  return (
    <ul className="space-y-1 text-xs" aria-label="Net units sold per week">
      {weeks.map((week) => (
        <li key={week.week_start} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-2">
          <span className="text-gray-600">{formatDay(week.week_start)}</span>
          <span className="h-1.5 rounded-full bg-gray-100" aria-hidden>
            {/* eslint-disable-next-line no-restricted-syntax -- bar length is this week's share of the busiest week */}
            <span className="block h-full rounded-full bg-gray-600" style={{ width: `${(Math.abs(week.units) / max) * PERCENT}%` }} />
          </span>
          <span className="text-right font-medium tabular-nums text-gray-900">{formatUnits(week.units)}</span>
        </li>
      ))}
    </ul>
  );
}

function SizeTable({ detail }: { readonly detail: OptionStoreDetail }): React.ReactNode {
  if (!detail.sizes.length) return <MissingEvidence>No size rows on the snapshot date.</MissingEvidence>;
  return (
    <DataTable className="relative" minWidth="280px">
      <caption className="sr-only">Sizes of {detail.row.option_code} at {detail.store_name}</caption>
      <DataTableHeader>
        <DataTableHead>Size</DataTableHead>
        <DataTableHead align="right">On hand</DataTableHead>
        <DataTableHead align="right">Incoming</DataTableHead>
        <DataTableHead align="right">Sold</DataTableHead>
      </DataTableHeader>
      <DataTableBody>
        {detail.sizes.map((size) => (
          <DataTableRow key={size.article}>
            <DataTableCell className="py-1.5 font-medium">{size.size ?? EMPTY}</DataTableCell>
            <DataTableCell align="right" className="py-1.5 tabular-nums">{formatUnits(size.on_hand)}</DataTableCell>
            <DataTableCell align="right" className="py-1.5 tabular-nums">{formatUnits(size.transit)}</DataTableCell>
            <DataTableCell align="right" className="py-1.5 tabular-nums">{formatUnits(size.sold)}</DataTableCell>
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  );
}

function JourneyDetail({ detail, snapshotId, position, salesWindow, onPosition, onBrick, engineResults }: {
  detail: OptionStoreDetail; snapshotId: string; position: InventoryPosition; salesWindow: SalesWindow;
  onPosition?: (position: InventoryPosition) => void; onBrick?: (brick: string) => void;
  engineResults?: React.ReactNode;
}): React.ReactNode {
  const [tab, setTab] = useState<'results' | 'inventory' | 'history'>('results');
  const { row } = detail;
  const breakdown = useMemo(() => optionBreakdown(row), [row]);
  const breakdownIndex = useMemo(() => new Map([[row.option_code, breakdown]]), [row.option_code, breakdown]);
  const values = { stock: row.on_hand, transit: breakdownUnits(breakdown, 'transit', salesWindow), sold: salesWindow === 'life' ? row.sold : row.sales_14d };
  const facts = [
    ['Receipt age', row.days_in_store === null ? EMPTY : `${row.days_in_store} d`],
    ['Lifecycle age', row.lifecycle_age === null ? EMPTY : `${row.lifecycle_age} d`],
    ['Sell-through', formatPercent(row.sell_through)],
    ['Target' + (row.curve_provisional ? ' · provisional' : ''), row.expected !== null && row.inward && row.inward > 0 ? formatPercent(row.expected / row.inward) : EMPTY],
    ['True ROS / day', row.health?.true_ros_daily == null ? EMPTY : row.health.true_ros_daily.toFixed(2)],
    ['Availability · 14d', formatPercent(row.health?.availability_14d ?? null)],
    ['Cover', row.health?.weeks_of_cover == null ? EMPTY : `${row.health.weeks_of_cover.toFixed(1)} wk`],
    ['Sold · 14d', formatUnits(row.sales_14d)],
  ];
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">{onBrick && <button type="button" className="mr-auto flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900" onClick={() => onBrick(brickOf(row))}><ChevronLeft className="size-3.5" aria-hidden />Back to {brickName(brickOf(row))}</button>}<Badge variant="outline" size="sm">{brickName(brickOf(row))}</Badge><Badge variant="outline" size="sm">{row.grade_class}</Badge><span className="text-xs text-gray-500">{formatDay(detail.as_of)}</span></div>
    <MetricGrid columns={3} className="mb-0 grid-cols-3 gap-2 xs:grid-cols-3">
      {(['stock', 'transit', 'sold'] as const).map((item) => <Button key={item} variant="ghost" aria-pressed={position === item} aria-label={`View ${POSITION_LABEL[item].toLowerCase()} for this option`} onClick={() => onPosition?.(item)} disabled={!onPosition} className={cn('h-auto flex-col items-start gap-1 border p-2 text-left disabled:opacity-100', position === item ? 'border-teal-200 bg-teal-50 hover:bg-teal-50' : 'border-gray-200 bg-white hover:bg-gray-50')}>
        <span className="text-xs text-gray-600">{POSITION_LABEL[item]}</span><span className="text-xl font-semibold tabular-nums text-gray-900">{formatUnits(values[item])}</span><span className="text-[10px] font-normal text-gray-500">{item === 'sold' ? salesWindow === 'life' ? 'Units · since receipt' : 'Units · 14 days' : item === 'transit' ? breakdown.outgoing === null ? 'Incoming · outgoing unavailable' : `${formatUnits(breakdown.incoming)} in · ${formatUnits(breakdown.outgoing)} out` : 'Units · snapshot'}</span>
      </Button>)}
    </MetricGrid>
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-y border-gray-100 py-2 sm:grid-cols-4">{facts.map(([name,value]) => <div key={name}><dt className="text-[11px] text-gray-500">{name}</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums text-gray-900">{value}</dd></div>)}</dl>
    <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-2" aria-label="Option detail sections">{([['results','Engine results'], ['inventory','Inventory & sizes'], ['history','History']] as const).map(([value,name]) => <Button key={value} variant={tab === value ? 'secondary' : 'ghost'} size="sm" aria-pressed={tab === value} onClick={() => setTab(value)}>{name}</Button>)}</div>
    {tab === 'results' && (engineResults ?? <OptionEngineResults key={row.option_code} detail={detail} />)}
    {tab === 'inventory' && <div className="space-y-3">
      <Section title={`${POSITION_LABEL[position]} · ${formatUnits(breakdownUnits(breakdown, position, salesWindow))} units`} subtitle={breakdown.source === 'demo' ? 'Demo breakdown' : position === 'transit' ? 'Incoming recorded · outgoing unavailable' : 'Stage data unavailable'}><BreakdownBars rows={[row]} index={breakdownIndex} position={position} period={salesWindow} label="Option" /></Section>
      <Section title="Size quantities" subtitle="Stock & incoming · snapshot / Sold · since receipt"><SizeTable detail={detail} /></Section>
      {row.health && <Section title="Availability · 14 days"><AvailabilityGrid snapshotId={snapshotId} storeCode={row.store_code} optionCode={row.option_code} compact /></Section>}
    </div>}
    {tab === 'history' && <div className="space-y-3"><dl className="grid grid-cols-2 gap-3 text-xs"><div><dt className="text-gray-500">First receipt</dt><dd className="font-medium">{formatDay(row.first_grn)}</dd></div><div><dt className="text-gray-500">Latest receipt</dt><dd className="font-medium">{formatDay(detail.last_grn)}</dd></div></dl><Section title="Actual vs target · sell-through"><CurveChart detail={detail} /></Section><Section title="Weekly net sales"><WeeklySales weeks={detail.weekly_sales} /></Section>{row.health && <Section title="Sales & availability"><HealthFacts health={row.health} compact /></Section>}{detail.shelf && <Section title="Space plan"><ShelfContext shelf={detail.shelf} compact /></Section>}<Section title="Source cross-check"><dl className="grid grid-cols-2 gap-3 text-xs">{[['Inward',formatUnits(row.inward)],['STO issued',formatUnits(detail.sto_issued)],['Δ', row.inward === null || detail.sto_issued === null ? EMPTY : formatUnits(row.inward-detail.sto_issued)],['Findings',String(detail.findings.length)]].map(([name,value])=><div key={name}><dt className="text-gray-500">{name}</dt><dd className="text-base font-semibold tabular-nums">{value}</dd></div>)}</dl></Section></div>}
  </div>;
}

interface OptionDrawerProps {
  readonly journey?: InventoryPosition;
  readonly salesWindow?: SalesWindow;
  readonly onPosition?: (position: InventoryPosition) => void;
  readonly onBrick?: (brick: string) => void;
  readonly snapshotId: string;
  readonly storeCode: string;
  readonly optionCode: string | null;
  readonly onClose: () => void;
  /** Engine actions supplies evidence from its selected run to keep the drawer aligned with the worklist. */
  readonly engineResults?: React.ReactNode;
}

/** Option x store detail in a right drawer, so the worklist keeps its place. */
export function OptionDrawer({ snapshotId, storeCode, optionCode, onClose, journey, salesWindow = 'life', onPosition, onBrick, engineResults }: OptionDrawerProps): React.ReactNode {
  const detail = useOptionStore(snapshotId, storeCode, optionCode ?? '');
  let body: React.ReactNode;
  if (detail.isLoading) body = <div className="space-y-3"><LoadingBlock label="Loading option" />{engineResults}</div>;
  else if (detail.error || !detail.data) body = <div className="space-y-3"><ErrorBlock error={detail.error} onRetry={() => void detail.refetch()} />{engineResults}</div>;
  else body = <JourneyDetail key={optionCode} detail={detail.data} snapshotId={snapshotId} position={journey ?? 'stock'} salesWindow={salesWindow} onPosition={onPosition} onBrick={onBrick} engineResults={engineResults} />;
  const name = detail.data ? [detail.data.row.option_name, detail.data.row.brand].filter(Boolean).join(' · ') : '';
  return (
    <Sheet
      isOpen={Boolean(optionCode)}
      onClose={onClose}
      title={optionCode ? journey ? detail.data?.row.option_name ?? optionCode : `${optionCode} at ${detail.data?.store_name ?? storeCode}` : undefined}
      description={journey ? `${optionCode} · ${detail.data?.store_name ?? storeCode}` : name || undefined}
      width="xl"
      className="sm:max-w-4xl"
    >
      <div className="p-3">{body}</div>
    </Sheet>
  );
}
