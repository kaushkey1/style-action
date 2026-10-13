import { CompactButton as Button } from '../CompactButton';
import { useMemo } from 'react';
import { ChevronRight, Layers3, Package, Search, ShoppingBag, SlidersHorizontal, Truck, X } from 'lucide-react';
import { Card, DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow, EmptyState, Input, MetricGrid } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Snapshot, StoreSummary, OptionStoreRow } from '../../api/types';
import { formatDay, formatPercent, formatUnits } from '../display';
import { ErrorBlock, LoadingBlock } from '../QueryStates';
import { OptionDrawer } from '../OptionDrawer';
import type { WorkspaceParams } from '../useWorkspaceParams';
import { useJourneyInventory } from './useJourneyInventory';
import { POSITION_COLOUR } from './InventoryStack';
import { BreakdownBars } from './BreakdownBars';
import { optionBreakdown, breakdownUnits, STAGES, type BreakdownIndex, type BreakdownDimension, type StageFilters } from './inventoryBreakdown';
import { inventoryBalance, brickName, brickOf, groupInventory, matchesJourneySearch, needsReview, performanceLabel, POSITION_LABEL, type InventoryPosition, type SalesWindow, type JourneyBrick } from './inventoryJourney';

const PAGE_SIZE = 12;
const POSITIONS: InventoryPosition[] = ['stock', 'transit', 'sold'];
const ICON = { stock: Package, transit: Truck, sold: ShoppingBag };
const COPY = {
  stock: { title: 'What’s in your store?', description: 'Start with a brick. Open an option to understand its age, sales pace and sizes.', units: 'units on hand', metric: 'In store', secondary: 'Sold / 14 days' },
  transit: { title: 'What’s on the way?', description: 'Follow goods coming to this store and goods going from it.', units: 'units in transit', metric: 'In transit', secondary: 'Already in store' },
  sold: { title: 'What’s moving out of your store?', description: 'See which bricks sold, then trace each option back to its stock and sales performance.', units: 'net units sold', metric: 'Sold / 14 days', secondary: 'Still in store' },
};

function PositionCards({ store, snapshot, rows, index, position, onSelect }: { store: StoreSummary; snapshot: Snapshot; rows?: OptionStoreRow[]; index: BreakdownIndex; position: InventoryPosition; onSelect: (position: InventoryPosition) => void }) {
  const balance = rows ? inventoryBalance(rows) : null;
  const outbound = rows && rows.every((row) => index.get(row.option_code)?.outgoing != null) ? rows.reduce((sum, row) => sum + (index.get(row.option_code)?.outgoing ?? 0), 0) : null;
  const values = { stock: store.saleable_units, transit: store.transit_units + (outbound ?? 0), sold: balance?.sold ?? null };
  return <Card className="space-y-2 border-gray-200 p-2.5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium uppercase tracking-wider text-gray-500">The full inventory picture</span><span className="text-xs text-gray-500">As of {formatDay(snapshot.as_of)}</span></div>
    <MetricGrid columns={3} className="mb-0 grid-cols-3 gap-2 xs:grid-cols-3">
      {POSITIONS.map((item) => { const Icon = ICON[item]; return <button key={item} type="button" aria-pressed={position === item} aria-label={`${POSITION_LABEL[item]}: ${formatUnits(values[item])} units${item === 'sold' ? ' since first receipt' : ''}`} onClick={() => onSelect(item)} className={cn('grid min-w-0 grid-cols-1 content-start items-center gap-x-2 gap-y-0.5 rounded-lg border px-2.5 py-1.5 text-left transition-colors sm:grid-cols-[minmax(0,1fr)_auto] focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600', position === item ? 'border-gray-300 bg-gray-50' : 'border-transparent hover:bg-gray-50')}>
        <span className="flex items-center gap-2 text-xs font-medium text-gray-700"><span className={cn('size-2.5 shrink-0 rounded-sm', POSITION_COLOUR[item])} /><Icon className="hidden size-4 text-gray-500 sm:block" aria-hidden />{POSITION_LABEL[item]}</span>
        <span className="block text-2xl font-semibold tracking-tight sm:text-right tabular-nums text-gray-900">{formatUnits(values[item])}<span className="ml-1 hidden text-xs font-normal text-gray-500 sm:inline">units</span></span>
        <span className="block text-[11px] font-normal leading-4 sm:col-span-2 text-gray-500">{item === 'sold' ? `Since first receipt · ${formatUnits(store.sales_14d_units)} in last 14 days` : item === 'stock' ? 'On hand at this store' : outbound === null ? 'Incoming only · outgoing unavailable' : `${formatUnits(store.transit_units)} incoming · ${formatUnits(outbound)} outgoing`}</span>
      </button>; })}
    </MetricGrid>
  </Card>;
}

function BrickRows({ groups, allRows, index, position, salesWindow, filters, onOpen, onStage }: { groups: JourneyBrick[]; allRows: OptionStoreRow[]; index: BreakdownIndex; position: InventoryPosition; salesWindow: SalesWindow; filters: StageFilters; onOpen: (brick: string) => void; onStage: (dimension: BreakdownDimension, key: string, brick: string) => void }) {
  return <div>
    <div className="grid grid-cols-[minmax(0,1fr)_100px_20px] gap-3 border-y border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-500 md:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_100px_20px]" aria-hidden>
      <span>Brick · options in this view</span><span className="hidden md:block">{position === 'transit' ? 'Coming to / Going from store' : 'Age / Price stage'}</span><span className="text-right">{Object.values(filters).some(Boolean) ? 'Matching units' : position === 'sold' && salesWindow === 'life' ? 'Sold / since receipt' : COPY[position].metric}</span><span />
    </div>
    {groups.map((group) => <div key={group.key} className="grid grid-cols-[minmax(0,1fr)_100px_20px] items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)_100px_20px]">
      <button type="button" onClick={() => onOpen(group.key)} aria-label={`Explore ${brickName(group.key)}, ${group.units} ${COPY[position].units}, ${group.rows.length} options`} className="flex min-w-0 items-center gap-3 rounded-lg text-left hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"><span className="hidden size-8 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-500 sm:flex"><Layers3 className="size-4" aria-hidden /></span><span><span className="block text-xs font-semibold">{brickName(group.key)}</span><span className="text-xs text-gray-500">{group.rows.length} options{group.reviewCount ? ` · ${group.reviewCount} to review` : ''}</span></span></button>
      <div className="col-span-3 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1"><BreakdownBars rows={allRows.filter((row) => brickOf(row) === group.key)} index={index} position={position} period={salesWindow} filters={filters} label={brickName(group.key)} compact onSelect={(dimension, key) => onStage(dimension, key, group.key)} /></div>
      <span className="text-right text-base font-semibold tabular-nums text-gray-900">{formatUnits(group.units)}</span>
      <button type="button" onClick={() => onOpen(group.key)} aria-label={`Open ${brickName(group.key)} options`} className="flex h-8 w-6 items-center justify-center [@media(pointer:coarse)]:h-11"><ChevronRight className="size-4 text-gray-400" aria-hidden /></button>
    </div>)}
    <p className="border-t border-gray-100 px-3 py-1.5 text-[11px] text-gray-500">{position === 'transit' ? 'Each bar splits a brick’s transit into incoming and outgoing units.' : 'Age and price describe the same units. Each bar shows its full stage mix within the other selected filters.'} Click a segment to explore its options.</p>
  </div>;
}

function OptionRows({ rows, index, filters, quantity, position, salesWindow, onOpen, onStage }: { rows: OptionStoreRow[]; index: BreakdownIndex; filters: StageFilters; quantity: (row: OptionStoreRow) => number; position: InventoryPosition; salesWindow: SalesWindow; onOpen: (option: string) => void; onStage: (dimension: BreakdownDimension, key: string) => void }) {
  return <DataTable minWidth="660px">
    <caption className="sr-only">Style-colour options; open an option to explore sizes and its journey</caption>
    <DataTableHeader><DataTableHead>Option</DataTableHead><DataTableHead align="right">{Object.values(filters).some(Boolean) ? 'Matching units' : position === 'sold' && salesWindow === 'life' ? 'Sold / since receipt' : COPY[position].metric}</DataTableHead><DataTableHead>{position === 'transit' ? 'Direction' : 'Age / Price stage'}</DataTableHead><DataTableHead>{position === 'stock' ? 'Sales pace' : position === 'transit' ? 'Expected arrival' : 'Sales performance'}</DataTableHead><DataTableHead><span className="sr-only">Open</span></DataTableHead></DataTableHeader>
    <DataTableBody>{rows.map((row) => <DataTableRow key={row.option_code}>
      <DataTableCell className="max-w-72 py-2"><button className="block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600" onClick={() => onOpen(row.option_code)} aria-label={`Open ${row.option_name ?? row.option_code}`}>
        <span className="block font-medium text-gray-900">{row.option_name ?? row.option_code}</span><span className="mt-0.5 block text-[11px] text-gray-500">{row.option_code} · {row.grade_class}</span>
      </button></DataTableCell>
      <DataTableCell align="right" className="text-base font-semibold tabular-nums">{formatUnits(quantity(row))}</DataTableCell>
      <DataTableCell className="min-w-56"><BreakdownBars rows={[row]} index={index} position={position} period={salesWindow} filters={filters} label={row.option_code} compact onSelect={onStage} /></DataTableCell>
      <DataTableCell>{position === 'stock' ? <><span className="text-xs text-gray-700">{(row.sales_14d / 14).toFixed(1)} / day</span><span className="mt-0.5 block text-[11px] text-gray-500">Net sales over 14 days</span></> : position === 'transit' ? <span className="text-xs text-gray-500">Not recorded</span> : <><span className={cn('text-xs', needsReview(row) ? 'text-amber-800' : 'text-gray-700')}>{performanceLabel(row)}</span><span className="mt-0.5 block text-[11px] text-gray-500">{formatPercent(row.sell_through)} lifetime sell-through{row.curve_provisional ? ' · provisional target' : ''}</span></>}</DataTableCell>
      <DataTableCell><Button variant="ghost" size="icon" aria-label={`Explore ${row.option_code}`} onClick={() => onOpen(row.option_code)}><ChevronRight className="size-4" aria-hidden /></Button></DataTableCell>
    </DataTableRow>)}</DataTableBody>
  </DataTable>;
}

export function StoreJourney({ snapshot, store, params }: { snapshot: Snapshot; store: StoreSummary; params: WorkspaceParams }) {
  const inventory = useJourneyInventory(snapshot.snapshot_id, store.store_code);
  const { position, journeyBrick: selectedBrick, journeyQuery: query, journeyFocus: focus, journeySalesWindow: salesWindow, update } = params;
  const rows = inventory.data;
  const index = useMemo(() => new Map((rows ?? []).map((row) => [row.option_code, optionBreakdown(row)])), [rows]);
  const filters = params.journeyStages;
  const quantity = (row: OptionStoreRow) => breakdownUnits(index.get(row.option_code)!, position, salesWindow, filters);
  const positionRows = (rows ?? []).filter((row) => breakdownUnits(index.get(row.option_code)!, position, salesWindow) !== 0);
  const scopedRows = (rows ?? []).filter((row) => (!selectedBrick || brickOf(row) === selectedBrick) && matchesJourneySearch(row, query) &&
    (focus === 'all' || (focus === 'attention' ? needsReview(row) : (row.days_in_store ?? 0) >= 90)));
  const visibleRows = scopedRows.filter((row) => quantity(row) !== 0);
  const filteredGroups = groupInventory(visibleRows, position, salesWindow, quantity);
  const showOptions = Boolean(selectedBrick) || params.journeyView === 'options';
  const count = showOptions ? visibleRows.length : filteredGroups.length;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const page = Math.min(params.journeyPage, pages);
  const offset = (page - 1) * PAGE_SIZE;
  const sortedRows = [...visibleRows].sort((a, b) => quantity(b) - quantity(a) || a.option_code.localeCompare(b.option_code));
  const reviewCount = positionRows.filter((row) => (!selectedBrick || brickOf(row) === selectedBrick) && matchesJourneySearch(row, query) && needsReview(row)).length;
  const clearStages = { jage: null, jprice: null, jdirection: null };
  const pickPosition = (next: InventoryPosition) => update({ position: next, ...clearStages, jperiod: null, jbrick: null, jview: null, jq: null, jfocus: null, jpage: null, option: null });
  const pickBrick = (brick: string) => update({ jbrick: brick, jpage: null, option: null });
  const pickStage = (dimension: BreakdownDimension, key: string, brick?: string) => update({
    [dimension === 'age' ? 'jage' : dimension === 'price' ? 'jprice' : 'jdirection']: !brick && filters[dimension] === key ? null : key,
    ...(brick ? { jbrick: brick } : {}), jpage: null, option: null,
  });
  const reset = () => update({ ...clearStages, jbrick: null, jview: null, jq: null, jfocus: null, jpage: null });
  const hasStage = Object.values(filters).some(Boolean);
  const hasFilter = Boolean(query || focus !== 'all' || hasStage);
  const isDemo = rows?.some((row) => index.get(row.option_code)?.source === 'demo');
  const outgoingUnavailable = position === 'transit' && scopedRows.some((row) => index.get(row.option_code)?.outgoing === null);
  const missingSales = position === 'sold' && salesWindow === 'life' ? (rows ?? []).filter((row) => row.sold === null && (!selectedBrick || brickOf(row) === selectedBrick)).length : 0;
  return <div className="space-y-3 pb-3">
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-base font-semibold tracking-tight text-gray-900">Every piece has a journey.</h2><p className="text-xs text-gray-500">Choose where your goods are. Explore the detail as you need it.</p></div>
    <PositionCards store={store} snapshot={snapshot} rows={rows} index={index} position={position} onSelect={pickPosition} />
    <Card className="overflow-hidden border-gray-200 shadow-sm">
      <div className="space-y-2 p-3">
        <nav aria-label="Inventory drill-down" className="flex flex-wrap items-center gap-1 text-xs text-gray-500"><button type="button" onClick={reset} className="rounded px-1 py-1 hover:bg-gray-100">{POSITION_LABEL[position]}</button><ChevronRight className="size-3" aria-hidden /><button type="button" onClick={reset} className={cn('rounded px-1 py-1 hover:bg-gray-100', !selectedBrick && 'font-medium text-gray-900')}>All bricks</button>{selectedBrick && <><ChevronRight className="size-3" aria-hidden /><span aria-current="page" className="font-medium text-gray-900">{brickName(selectedBrick)}</span></>}</nav>
        <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-base font-semibold tracking-tight text-gray-900">{selectedBrick ? brickName(selectedBrick) : COPY[position].title}</h2><p className="max-w-2xl text-xs text-gray-500">{selectedBrick ? `${visibleRows.length} style-colour options · ${formatUnits(visibleRows.reduce((sum, row) => sum + quantity(row), 0))} ${COPY[position].units}${hasFilter ? ' matching your filters' : ''}. Open an option to follow its journey.` : COPY[position].description}</p></div>
          {!selectedBrick && <div className="flex rounded-lg bg-gray-100 p-1" aria-label="Group inventory"><Button variant="ghost" size="sm" className={cn('h-8 min-h-8 px-3 text-xs', !showOptions && 'bg-white shadow-sm')} aria-pressed={!showOptions} onClick={() => update({ jview: null, jpage: null })}><Layers3 className="size-3.5" aria-hidden />By brick</Button><Button variant="ghost" size="sm" className={cn('h-8 min-h-8 px-3 text-xs', showOptions && 'bg-white shadow-sm')} aria-pressed={showOptions} onClick={() => update({ jview: 'options', jpage: null })}>All options</Button></div>}
        </div>
        {missingSales > 0 && <p className="text-xs text-amber-800">Sales history is unavailable for {missingSales} options. Only recorded sales are included below.</p>}
        {position === 'sold' && <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500"><span>Sales period</span><Button size="sm" variant={salesWindow === 'life' ? 'secondary' : 'ghost'} aria-pressed={salesWindow === 'life'} onClick={() => update({ jperiod: null, jpage: null })}>Since first receipt</Button><Button size="sm" variant={salesWindow === 'recent' ? 'secondary' : 'ghost'} aria-pressed={salesWindow === 'recent'} onClick={() => update({ jperiod: 'recent', jpage: null })}>Last 14 days</Button></div>}
        {rows && <section aria-label="Inventory stage breakdown" className="space-y-2 rounded-lg border border-gray-200 bg-white p-2">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-semibold text-gray-900">{formatUnits(filters.direction === 'outgoing' && outgoingUnavailable ? null : visibleRows.reduce((sum, row) => sum + quantity(row), 0))} {hasStage ? 'matching units' : position === 'sold' ? 'net units sold' : 'units'}<span className="ml-2 text-xs font-normal text-gray-500">{visibleRows.length} options{position === 'sold' ? salesWindow === 'life' ? ' · since receipt' : ' · last 14 days' : ''}</span></h3><span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">{isDemo ? 'Demo breakdown' : position === 'transit' ? 'Incoming recorded · outgoing unavailable' : 'Stage data unavailable'}</span></div>
          <BreakdownBars rows={scopedRows} index={index} position={position} period={salesWindow} filters={filters} label={selectedBrick ? `${brickName(selectedBrick)} overview` : 'Store'} onSelect={pickStage} />
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2 text-[11px] text-gray-500"><span>{position === 'transit' ? outgoingUnavailable ? 'Outgoing quantities are not available in this snapshot.' : 'Dispatched units · incoming and outgoing shown separately.' : 'Two views of the same units · select age and price to narrow the mix.'}</span>{hasStage && <button type="button" onClick={() => update({ ...clearStages, jpage: null })} className="ml-auto font-medium text-teal-700">Reset stages</button>}</div>
          {hasStage && <div className="flex flex-wrap gap-2">{(['age','price','direction'] as const).map((dimension) => { const selected = STAGES[dimension].find((stage) => stage.key === filters[dimension]); return selected ? <button key={dimension} type="button" onClick={() => pickStage(dimension, selected.key)} className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"><span className={cn('size-2 rounded-sm', selected.colour)} />{selected.label}<X className="size-3" aria-hidden /><span className="sr-only">Remove {dimension} filter</span></button> : null; })}</div>}
        </section>}
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2"><div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" aria-hidden /><Input value={query} onChange={(event) => update({ jq: event.target.value || null, jpage: null })} aria-label="Search bricks or options" placeholder="Search bricks or options" className="h-8 py-1.5 pl-8 text-sm lg:text-xs [@media(pointer:coarse)]:h-11" /></div><div className="flex flex-wrap items-center gap-1.5"><Button variant={focus === 'all' ? 'secondary' : 'ghost'} size="sm" className="h-8 min-h-8 text-xs" onClick={() => update({ jfocus: null, jpage: null })} aria-pressed={focus === 'all'}>All</Button><Button variant={focus === 'attention' ? 'secondary' : 'ghost'} size="sm" className="h-8 min-h-8 text-xs" onClick={() => update({ jfocus: 'attention', jpage: null })} aria-pressed={focus === 'attention'}><SlidersHorizontal className="size-3.5" aria-hidden />Needs review{rows ? ` · ${reviewCount}` : ''}</Button>{position !== 'transit' && <Button variant={focus === 'aged' ? 'secondary' : 'ghost'} size="sm" className="h-8 min-h-8 text-xs" aria-pressed={focus === 'aged'} onClick={() => update({ jfocus: 'aged', jpage: null })}>First received 90+ days ago</Button>}</div>{hasFilter && <Button variant="ghost" size="sm" className="h-8 min-h-8 text-xs" onClick={() => update({ ...clearStages, jq: null, jfocus: null, jpage: null })}><X className="size-3" aria-hidden />Clear filters</Button>}</div>
      </div>
      {inventory.isLoading ? <div className="p-3"><LoadingBlock label="Loading inventory journey" /></div> : inventory.error || !rows ? <ErrorBlock error={inventory.error} onRetry={() => void inventory.refetch()} /> : !count ? <EmptyState title={filters.direction === 'outgoing' && outgoingUnavailable ? 'Outgoing quantities unavailable' : hasFilter ? 'No goods match these filters' : missingSales ? 'Sales history is unavailable for these goods' : `No goods ${position === 'stock' ? 'in store' : position === 'transit' ? 'in transit' : 'sold in this period'}`} description={hasFilter ? 'Clear the filters or explore another inventory position.' : 'Choose another position to continue exploring this store.'} action={hasFilter ? <Button variant="outline" onClick={() => update({ ...clearStages, jq: null, jfocus: null, jpage: null })}>Clear filters</Button> : undefined} /> : <>
        {showOptions ? <OptionRows rows={sortedRows.slice(offset, offset + PAGE_SIZE)} index={index} filters={filters} quantity={quantity} position={position} salesWindow={salesWindow} onStage={pickStage} onOpen={(option) => update({ option })} /> : <BrickRows groups={filteredGroups.slice(offset, offset + PAGE_SIZE)} allRows={scopedRows} index={index} filters={filters} position={position} salesWindow={salesWindow} onOpen={pickBrick} onStage={pickStage} />}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-3 py-2 text-xs text-gray-500"><span>{formatUnits(count)} {showOptions ? 'options' : 'bricks'}{hasFilter ? ' matching filters' : ''} · Sorted by {position === 'sold' && salesWindow === 'life' ? 'sold since first receipt' : COPY[position].metric.toLowerCase()}</span><div className="flex items-center gap-2"><span>{page} of {pages}</span><Button variant="ghost" size="sm" className="h-8 min-h-8 text-xs" disabled={page === 1} onClick={() => update({ jpage: String(page - 1) })}>Previous</Button><Button variant="ghost" size="sm" className="h-8 min-h-8 text-xs" disabled={page >= pages} onClick={() => update({ jpage: String(page + 1) })}>Next</Button></div></div>
      </>}
    </Card>
    <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-gray-500"><span className="flex items-center gap-1.5"><Layers3 className="size-3.5" aria-hidden />Store → brick → option → sizes & evidence</span><span>Stage colours stay consistent from store to brick to option.</span></div>
    <OptionDrawer snapshotId={snapshot.snapshot_id} storeCode={store.store_code} optionCode={params.option} onClose={() => update({ option: null })} journey={position} salesWindow={salesWindow}
      onPosition={(next) => update({ position: next, ...clearStages, jperiod: null, jfocus: null, jpage: null })} onBrick={(brick) => update({ jbrick: brick, jq: null, jfocus: null, jpage: null, option: null })} />
  </div>;
}
