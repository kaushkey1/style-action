import { Badge, DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow, MetricGrid, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';

import { StyleActionsApiError } from '../api/client';
import { useOptionStoreAvailability } from '../api/queries';
import { BAND_BADGE, BAND_MEANING, EMPTY, GLOSSARY, UNMEASURABLE_LABEL, fallbackDepthText, formatDay, formatPercent, formatUnits } from './display';
import { Term } from './Term';
import { MissingEvidence } from './Panel';
import { bandOf, bandText, coverText, trueRosWorking } from './scope';

import type { OptionHealth, OptionStoreAvailability, StoreBrickRow } from '../api/types';

const LIFE_UNAVAILABLE: Readonly<Record<string, string>> = {
  life_missing_size: 'Whole-life availability is unavailable: an article of this option has history rows without a size, so its days cannot be qualified.',
};

function Fact({ label, children, testid }: { readonly label: React.ReactNode; readonly children: React.ReactNode; readonly testid?: string }): React.ReactNode {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium tabular-nums text-gray-900" data-testid={testid}>{children}</p>
    </div>
  );
}

function reasonOf(health: OptionHealth): string {
  if (health.unmeasurable_reason && !health.band) return UNMEASURABLE_LABEL[health.unmeasurable_reason] ?? BAND_MEANING.unmeasurable;
  const band = bandOf(health);
  return band ? BAND_MEANING[band] : 'No band for this option.';
}

/** Band with its one-line reason, pivotal sizes, qualifying days, True ROS with the working, availability and cover (S2-R11). */
export function HealthFacts({ health, compact = false }: { readonly health: OptionHealth; readonly compact?: boolean }): React.ReactNode {
  const band = bandOf(health);
  const working = trueRosWorking(health);
  return (
    <div className="space-y-2">
      <p className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
        <Badge variant={band ? BAND_BADGE[band] : 'outline'} size="sm">
          <span data-testid="drawer-band">{bandText(health)}</span>
        </Badge>
        {!compact && <span>{reasonOf(health)}</span>}
      </p>
      <MetricGrid columns={3} className="mb-0 gap-3">
        <Fact label={<Term help={GLOSSARY.pivotalSizes}>Pivotal sizes</Term>}>{health.pivotal_sizes.length ? health.pivotal_sizes.map((size) => size ?? 'No size').join(', ') : EMPTY}</Fact>
        <Fact label={<Term help={GLOSSARY.qualifyingDays}>Qualifying days</Term>} testid="drawer-qualifying-days">{health.qualifying_days}</Fact>
        <Fact label={<Term help={GLOSSARY.vetoValidDays}>Veto-valid days</Term>}>{health.veto_valid_days}</Fact>
        <Fact label={<Term help={GLOSSARY.trueRos}>True ROS per 30 days</Term>}>{health.true_ros_30d === null ? EMPTY : formatUnits(health.true_ros_30d)}</Fact>
        {compact && <Fact label="Qualified units">{formatUnits(health.qualified_units)}</Fact>}
        <Fact label="Availability, 14 days">{formatPercent(health.availability_14d)}</Fact>
        <Fact label="Weeks of cover">{coverText(health)}</Fact>
      </MetricGrid>
      {!compact && <p className="text-xs text-gray-600">
        {working ? `True ROS: ${working}.` : `True ROS is unmeasurable: ${health.unmeasurable_reason ? UNMEASURABLE_LABEL[health.unmeasurable_reason] : 'no pivotal set'}.`}
        {health.duplicate_rows ? ` ${formatUnits(health.duplicate_rows)} duplicate sales ${health.duplicate_rows === 1 ? 'row' : 'rows'} counted once.` : ''}
      </p>}
      {!compact && <p className="text-xs text-gray-600">
        {health.availability_life !== null && health.first_seen
          ? `Whole-life availability ${formatPercent(health.availability_life)} since first seen in stock ${formatDay(health.first_seen)}, history covering ${formatPercent(health.life_coverage)} of those days.`
          : (health.life_unavailable_reason && LIFE_UNAVAILABLE[health.life_unavailable_reason]) ?? 'Whole-life availability is not available for this option.'}
        {health.availability_basis ? ` The band used ${health.availability_basis === 'life' ? 'whole-life' : '14-day'} availability.` : ''}
      </p>}
    </div>
  );
}

function dayLabel(date: string): string {
  return date.slice(8, 10);
}

/** The 14-day size × day grid: in stock at the previous close per size, qualifying and vetoed days marked (S2-R11). */
function SizeDayGrid({ data, compact }: { readonly data: OptionStoreAvailability; readonly compact?: boolean }): React.ReactNode {
  return (
    <div className="space-y-1">
      <DataTable className="relative" minWidth="560px">
        <caption className="sr-only">
          Sizes by day from {formatDay(data.observation_start)} to {formatDay(data.observation_end)}: in stock at the previous close, qualifying and vetoed days
        </caption>
        <DataTableHeader>
          <DataTableHead>Size</DataTableHead>
          {data.days.map((day) => (
            <DataTableHead key={day.date} align="center" className={cn('px-1', day.qualifying && 'text-gray-900')}>
              <span title={`${formatDay(day.date)}${day.qualifying ? ', qualifying' : ''}${day.vetoed ? ', vetoed' : ''}`}>{dayLabel(day.date)}</span>
              <span className="block text-xs font-normal">{day.qualifying ? 'Q' : day.vetoed ? 'V' : ' '}</span>
            </DataTableHead>
          ))}
        </DataTableHeader>
        <DataTableBody>
          {data.sizes.map((size) => (
            <DataTableRow key={size.size ?? 'none'} className="hover:bg-transparent">
              <DataTableCell className={cn('py-1', size.pivotal ? 'font-semibold text-gray-900' : 'text-gray-600')}>
                {size.size ?? 'No size'}
                {size.pivotal ? <span className="sr-only"> (pivotal)</span> : null}
              </DataTableCell>
              {size.prev_close_in_stock.map((inStock, index) => (
                <DataTableCell key={data.days[index]?.date ?? index} align="center" className="px-1 py-1">
                  <span
                    aria-label={inStock ? 'in stock' : 'out of stock'}
                    role="img"
                    className={cn('mx-auto block size-3 rounded-sm', inStock ? 'bg-gray-600' : 'border border-gray-300 bg-white')}
                  />
                </DataTableCell>
              ))}
            </DataTableRow>
          ))}
          <DataTableRow className="hover:bg-transparent">
            <DataTableCell className="py-1 text-xs text-gray-500">Units sold</DataTableCell>
            {data.days.map((day) => (
              <DataTableCell key={day.date} align="center" className="px-1 py-1 text-xs tabular-nums">{formatUnits(day.units)}</DataTableCell>
            ))}
          </DataTableRow>
        </DataTableBody>
      </DataTable>
      <p className="text-xs text-gray-500">
        {compact ? '■ In stock · Q Qualifying · V Vetoed · Bold: pivotal sizes' : 'Filled square: in stock at previous close. Q: qualifying day. V: pricing veto. Pivotal sizes in bold.'}
      </p>
    </div>
  );
}

interface AvailabilityGridProps {
  readonly compact?: boolean;
  readonly snapshotId: string;
  readonly storeCode: string;
  readonly optionCode: string;
}

export function AvailabilityGrid({ snapshotId, storeCode, optionCode, compact }: AvailabilityGridProps): React.ReactNode {
  const availability = useOptionStoreAvailability(snapshotId, storeCode, optionCode, true);
  if (availability.isLoading) return <Skeleton className="h-32 w-full" />;
  if (availability.error || !availability.data) {
    const isNotComputed = availability.error instanceof StyleActionsApiError && availability.error.code === 'content_not_computed';
    return (
      <MissingEvidence>
        {isNotComputed ? 'Health not yet computed for this snapshot.' : 'The size × day grid could not be loaded.'}
      </MissingEvidence>
    );
  }
  return <SizeDayGrid data={availability.data} compact={compact} />;
}

/** The option's brick × grade shelf against the space plan (S2-R15). */
export function ShelfContext({ shelf, compact = false }: { readonly shelf: StoreBrickRow; readonly compact?: boolean }): React.ReactNode {
  const space = shelf.space;
  if (!space) return <MissingEvidence>No space plan applies to this group.</MissingEvidence>;
  let flag = 'Within plan';
  if (space.no_plan) flag = 'No plan';
  else if (space.below_floor && space.overfilled) flag = 'Below floor and overfilled';
  else if (space.below_floor) flag = 'Below floor';
  else if (space.overfilled) flag = 'Overfilled';
  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-700">
        {[shelf.segment, shelf.brick ?? shelf.brick_key, shelf.grade_class].filter(Boolean).join(' · ')} · <span className="font-medium">{flag}</span>
      </p>
      <MetricGrid columns={4} className="mb-0 gap-3">
        <Fact label="Plan options">{formatUnits(space.plan_options)}</Fact>
        <Fact label="Plan quantity">{formatUnits(space.plan_qty)}</Fact>
        <Fact label="Options fill">{formatPercent(space.options_fill)}</Fact>
        <Fact label="Units fill">{formatPercent(space.units_fill)}</Fact>
      </MetricGrid>
      {!compact && <p className="text-xs text-gray-500">
        {formatUnits(shelf.live_options)} live options and {formatUnits(shelf.units)} units on hand or in transit in this group.
        {space.plan_qty_source === 'fallback_depth' ? ` ${fallbackDepthText(space.depth)}.` : ''}
      </p>}
    </div>
  );
}
