import { CompactButton as Button } from '../CompactButton';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, ChevronRight, CirclePause, Layers3, Search, Tag, X } from 'lucide-react';
import { Badge, Card, DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow, EmptyState, Input, MetricGrid } from '@/components/ui';
import { cn } from '@/lib/utils';
import { styleActionsKeys } from '../../api/queries';
import type { Snapshot, StoreSummary } from '../../api/types';
import { formatDay, formatPercent, formatUnits } from '../display';
import { ErrorBlock, LoadingBlock } from '../QueryStates';
import { OptionDrawer } from '../OptionDrawer';
import { brickName } from '../journey/inventoryJourney';
import { useJourneyInventory } from '../journey/useJourneyInventory';
import type { WorkspaceParams } from '../useWorkspaceParams';
import { EngineBundleResults } from './OptionEngineResults';
import type { EngineActionLine, OptionGateResult } from './optionEngineData';
import { actionGroup, loadEngineDecision, engineOptions, engineType, ENGINE_TYPES, filterEngineOptions, movementQuantity, resultLabel, useStoreEngine, type EngineActionGroup, type EngineOption, type StoreEngineBundle } from './storeEngineData';

const PAGE_SIZE = 12;
const GROUP_LABEL: Record<EngineActionGroup, string> = { all: 'All actions', movement: 'Move stock', price: 'Markdown', decisions: 'No action lines', other: 'Other outputs' };
type MixItem = { key: string; label: string; count: number; colour: string; text: string };
function resultMix(options: readonly EngineOption[], decisions: boolean, action: EngineActionGroup = 'all'): MixItem[] {
  const counts = new Map<string, number>();
  if (decisions) options.forEach(option => { if (option.decision) counts.set(option.decision.outcome, (counts.get(option.decision.outcome) ?? 0) + 1); });
  else options.forEach(option => option.lines.forEach(line => counts.set(line.line_type, (counts.get(line.line_type) ?? 0) + 1)));
  const relevantTypes = ENGINE_TYPES.filter(type => action === 'all' || type.group === action);
  const keys = decisions ? [...counts.keys()].sort() : [...relevantTypes.map(type => type.key), ...[...counts.keys()].filter(key => !ENGINE_TYPES.some(type => type.key === key))];
  return keys.map(key => ({ ...(decisions ? { key, label: resultLabel(key), colour: key === 'leave_alone' ? 'bg-teal-600' : /supply|hold/.test(key) ? 'bg-amber-400' : key === 'liquidation' ? 'bg-rose-600' : 'bg-gray-500', text: /supply|hold/.test(key) ? 'text-gray-900' : 'text-white' } : engineType(key)), count: counts.get(key) ?? 0 }));
}
function OutputMix({ items, selected, label, compact = false, onSelect }: { items: MixItem[]; selected?: string | null; label: string; compact?: boolean; onSelect: (key: string) => void }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const legendItems = items.filter(item => item.count > 0 || selected === item.key);
  return <div role="group" aria-label={label} className="space-y-1.5">
    <div className={cn('flex overflow-hidden rounded-lg bg-gray-100', compact ? 'h-6' : 'h-8 [@media(pointer:coarse)]:h-11')}>
      {total ? items.filter(item => item.count > 0).map(item => <button key={item.key} type="button" aria-label={`${label} · ${item.label}: ${item.count}`} title={`${item.label} · ${item.count} · ${Math.round(item.count / total * 100)}%`} aria-pressed={selected === item.key} onClick={() => onSelect(item.key)}
        className={cn('min-w-0 overflow-hidden border-r border-white/30 text-xs font-semibold tabular-nums last:border-0 hover:brightness-110 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gray-900', item.colour, item.text, selected && selected !== item.key && 'opacity-30')}
        // eslint-disable-next-line no-restricted-syntax -- exact width represents the share of action lines or recorded decisions
        style={{ width: `${item.count / total * 100}%` }}>{item.count / total >= 0.12 ? formatUnits(item.count) : null}</button>) : <span className="m-auto text-xs text-gray-500">0 outputs</span>}
    </div>
    {!compact && legendItems.length > 0 && <div className="flex flex-wrap gap-x-3 gap-y-0.5">{legendItems.map(item => <button key={item.key} type="button" aria-label={`Filter ${label} by ${item.label}`} aria-pressed={selected === item.key} onClick={() => onSelect(item.key)} className={cn('flex items-center gap-1.5 rounded px-1 py-0.5 text-[11px] [@media(pointer:coarse)]:min-h-9', selected === item.key && 'bg-gray-100 font-semibold')}><span className={cn('size-2 rounded-sm', item.colour)} /><span className="text-gray-600">{item.label}</span><span className="font-semibold tabular-nums">{formatUnits(item.count)}</span></button>)}</div>}
  </div>;
}
function priceRange(lines: readonly EngineActionLine[]): string {
  const prices = lines.flatMap(line => line.marked_price != null && Number.isFinite(line.marked_price) ? [line.marked_price] : []);
  if (!prices.length) return '—';
  const min = Math.min(...prices), max = Math.max(...prices);
  return min === max ? `₹${formatUnits(min)}` : `₹${formatUnits(min)}–${formatUnits(max)}`;
}
function quantityText(lines: readonly EngineActionLine[]): string {
  const quantity = movementQuantity(lines);
  return !quantity.lines || quantity.lines === quantity.missing ? '—' : `${formatUnits(quantity.known)}${quantity.missing ? '+' : ''}`;
}
function RunInfo({ bundle }: { bundle: StoreEngineBundle }) {
  return <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500"><Badge size="sm" variant={bundle.demo ? 'warning' : 'outline'}>{bundle.demo ? 'Demo run' : 'Engine run'}</Badge><Badge size="sm" variant="outline">{resultLabel(bundle.run.phase)}</Badge><span>Latest completed · {formatDay(bundle.run.run_date)} · {bundle.run.finished_at?.slice(11,16) ?? '—'} UTC</span><details className="ml-auto max-w-full"><summary className="cursor-pointer text-xs">Run details</summary><dl className="mt-2 space-y-1 break-all rounded-lg border border-gray-200 bg-gray-50 p-3">{[['Run', bundle.run.run_id], ['Snapshot', bundle.run.snapshot_id], ['Settings', bundle.run.settings_version ?? '—']].map(([name,value]) => <div key={name}><dt className="inline text-gray-500">{name} · </dt><dd className="inline font-mono text-gray-700">{value}</dd></div>)}</dl></details></div>;
}
function ActionOverview({ bundle, options, selected, onSelect }: { bundle: StoreEngineBundle; options: EngineOption[]; selected: EngineActionGroup; onSelect: (value: EngineActionGroup) => void }) {
  const movements = bundle.lines.filter(line => actionGroup(line) === 'movement');
  const prices = bundle.lines.filter(line => actionGroup(line) === 'price');
  const decisions = options.filter(option => !option.lines.length && option.decision);
  const other = bundle.lines.filter(line => actionGroup(line) === 'other');
  const cards = [
    { key: 'movement' as const, label: 'Move stock', icon: ArrowLeftRight, colour: 'bg-teal-600', value: formatUnits(new Set(movements.map(line => line.option_code)).size), unit: 'options', units: movements.length ? quantityText(movements) : '0', note: `${formatUnits(movements.length)} action lines` },
    { key: 'price' as const, label: 'Markdown', icon: Tag, colour: 'bg-violet-600', value: formatUnits(new Set(prices.map(line => line.option_code)).size), unit: 'options', units: null, note: `${formatUnits(prices.length)} lines · ${priceRange(prices)} proposed` },
    { key: 'decisions' as const, label: 'No action lines', icon: CirclePause, colour: 'bg-gray-400', value: bundle.decisions === null ? '—' : formatUnits(decisions.length), unit: 'options', units: null, note: bundle.decisions === null ? 'Decision results unavailable' : 'Leave alone · hold · wait · other decisions' },
    ...(other.length ? [{ key: 'other' as const, label: 'Other outputs', icon: Layers3, colour: 'bg-gray-600', value: formatUnits(new Set(other.map(line => line.option_code)).size), unit: 'options', units: null, note: `${formatUnits(other.length)} action lines` }] : []),
  ];
  return <Card className="space-y-2 border-gray-200 p-2.5 shadow-sm"><RunInfo bundle={bundle} />
    <MetricGrid columns={3} className="mb-0 gap-2 sm:grid-cols-3">{cards.map(card => <button
      key={card.key} type="button" aria-label={`Explore ${card.label}`} aria-pressed={selected === card.key}
      disabled={card.key === 'decisions' && bundle.decisions === null} onClick={() => onSelect(card.key)}
      className={cn('flex min-w-0 flex-col gap-1 rounded-lg border px-2.5 py-2 text-left transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 disabled:opacity-50', selected === card.key ? 'border-gray-300 bg-gray-50' : 'border-transparent')}
    >
      <span className="flex items-center gap-2 text-xs font-medium text-gray-700"><span className={cn('size-2 rounded-sm', card.colour)} /><card.icon className="size-4" aria-hidden />{card.label}</span>
      <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="inline-flex items-baseline gap-1.5"><span className="text-xl font-semibold tabular-nums text-gray-900">{card.value}</span><span className="text-[11px] text-gray-500">{card.unit}</span></span>
        {card.units !== null && <span className="inline-flex items-baseline gap-1.5"><span className="text-xl font-semibold tabular-nums text-gray-900">{card.units}</span><span className="text-[11px] text-gray-500">requested units</span></span>}
      </span>
      <span className="text-[11px] leading-4 text-gray-500">{card.note}</span>
    </button>)}</MetricGrid>
  </Card>;
}

function EngineOptionDrawer({ snapshotId, storeCode, bundle, params }: { snapshotId: string; storeCode: string; bundle: StoreEngineBundle; params: WorkspaceParams }) {
  const { option, update } = params;
  const gateQuery = useQuery({ queryKey: [...styleActionsKeys.all, 'engine-decision', bundle.run.run_id, storeCode, option], enabled: Boolean(option) && !bundle.demo, queryFn: () => loadEngineDecision(bundle.run.run_id, storeCode, option!), staleTime: 5 * 60 * 1000, retry: 1 });
  const demoGate = bundle.decisions?.find(decision => decision.option_code === option);
  const gate = bundle.demo ? demoGate && Array.isArray(demoGate.gates) ? demoGate as OptionGateResult : null : gateQuery.data ?? null;
  const evidence = { run: bundle.run, lines: bundle.lines.filter(line => line.option_code === option), gate, demo: bundle.demo };
  return <OptionDrawer snapshotId={snapshotId} storeCode={storeCode} optionCode={option}
    journey={params.position} salesWindow={params.journeySalesWindow}
    onClose={() => update({ option: null })}
    onPosition={position => update({ position, jage: null, jprice: null, jdirection: null, jpage: null })}
    onBrick={brick => update({ option: null, ebrick: brick, epage: null })}
    engineResults={<>
      {!bundle.demo && gateQuery.isLoading && <LoadingBlock label="Loading decision gates" />}
      {gateQuery.error && <ErrorBlock error={gateQuery.error} onRetry={() => void gateQuery.refetch()} />}
      <EngineBundleResults bundle={evidence} />
    </>}
  />;
}

function EngineOptionRows({ options, decisions, action, onOpen }: { options: EngineOption[]; decisions: boolean; action: EngineActionGroup; onOpen: (code: string) => void }) {
  const moves = !decisions && action !== 'price';
  const prices = !decisions && action !== 'movement';
  return <DataTable minWidth={decisions ? '560px' : moves && prices ? '900px' : '720px'}><caption className="sr-only">{decisions ? 'Recorded engine decisions without action lines' : 'Produced engine actions by option'}</caption>
    <DataTableHeader><DataTableHead>Option</DataTableHead><DataTableHead>{decisions ? 'Decision' : 'Engine · lines'}</DataTableHead>{decisions ? <DataTableHead>Deciding gate</DataTableHead> : <>{moves && <><DataTableHead align="right">Move units</DataTableHead><DataTableHead>Destination</DataTableHead></>}{prices && <DataTableHead align="right">Proposed price</DataTableHead>}<DataTableHead>State</DataTableHead></>}<DataTableHead><span className="sr-only">Evidence</span></DataTableHead></DataTableHeader>
    <DataTableBody>{options.map(option => {
      const lines = option.lines;
      const statuses = [...new Set(lines.map(line => line.status))];
      const depths = lines.flatMap(line => line.depth == null ? [] : [line.depth]);
      return <DataTableRow key={option.code}>
        <DataTableCell className="max-w-64 py-2"><button type="button" className="text-left" onClick={() => onOpen(option.code)} aria-label={`Open engine evidence for ${option.code}`}><span className="block font-medium text-gray-900">{option.name}</span><span className="mt-0.5 block text-[11px] text-gray-500">{option.code} · {brickName(option.brick)}</span></button></DataTableCell>
        <DataTableCell>{decisions ? <Badge size="sm" variant="outline">{resultLabel(option.decision?.outcome ?? 'unavailable')}</Badge> : <div className="space-y-1">{resultMix([option], false).filter(item => item.count > 0).map(item => <span key={item.key} className="flex items-center gap-1.5 text-xs"><span className={cn('size-2 rounded-sm', item.colour)} />{item.label}<span className="ml-auto pl-2 font-semibold tabular-nums">{item.count}</span></span>)}</div>}</DataTableCell>
        {decisions ? <DataTableCell className="text-xs font-medium">{option.decision?.deciding_gate?.replace('gate_', 'G') ?? '—'}</DataTableCell> : <>{moves && <><DataTableCell align="right" className="font-semibold tabular-nums">{quantityText(lines)}</DataTableCell><DataTableCell className="text-xs">{[...new Set(lines.flatMap(line => line.dest_store ?? line.dest_dc ?? []))].join(', ') || '—'}</DataTableCell></>}{prices && <DataTableCell align="right" className="tabular-nums"><span className="block font-medium">{priceRange(lines)}</span>{depths.length > 0 && <span className="block text-[11px] text-gray-500">{formatPercent(Math.min(...depths))}{Math.max(...depths) !== Math.min(...depths) ? `–${formatPercent(Math.max(...depths))}` : ''} depth</span>}</DataTableCell>}<DataTableCell><div className="flex flex-wrap gap-1">{statuses.map(status => <Badge key={status} size="sm" variant={status === 'in_review' ? 'warning' : 'outline'}>{resultLabel(status)}</Badge>)}</div></DataTableCell></>}
        <DataTableCell><Button size="icon" variant="ghost" aria-label={`Inspect ${option.code}`} onClick={() => onOpen(option.code)}><ChevronRight className="size-4" aria-hidden /></Button></DataTableCell>
      </DataTableRow>;
    })}</DataTableBody>
  </DataTable>;
}

function EngineExplorer({ bundle, options, snapshot, store, params }: { bundle: StoreEngineBundle; options: EngineOption[]; snapshot: Snapshot; store: StoreSummary; params: WorkspaceParams }) {
  const { update, engineAction: action, engineType: type, engineBrick: brick, engineQuery: query, engineStatus: status, engineOutcome: outcome } = params;
  const decisions = action === 'decisions';
  const reset = { eengine: null, ebrick: null, eq: null, estatus: null, eoutcome: null, epage: null, option: null };
  const pickAction = (next: EngineActionGroup) => update({ ...reset, eaction: next === 'all' ? null : next, eview: null });
  const pickMix = (key: string, nextBrick?: string) => update({ [decisions ? 'eoutcome' : 'eengine']: !nextBrick && (decisions ? outcome : type) === key ? null : key, ...(nextBrick ? { ebrick: nextBrick } : {}), epage: null, option: null });
  const filters = { action, engine: type, status, outcome, brick, query };
  const filtered = filterEngineOptions(options, filters);
  const mixScope = filterEngineOptions(options, { ...filters, engine: null, outcome: null });
  const lines = filtered.flatMap(option => option.lines);
  const grouped = new Map<string, EngineOption[]>();
  filtered.forEach(option => { const group = grouped.get(option.brick); if (group) group.push(option); else grouped.set(option.brick, [option]); });
  const groups = [...grouped].map(([key, entries]) => ({ key, entries, lines: entries.flatMap(option => option.lines) })).sort((a,b) => (decisions ? b.entries.length - a.entries.length : b.lines.length - a.lines.length) || a.key.localeCompare(b.key));
  const showOptions = Boolean(brick) || params.engineView === 'options';
  const count = showOptions ? filtered.length : groups.length;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE)), page = Math.min(params.enginePage, pages), offset = (page - 1) * PAGE_SIZE;
  const sorted = [...filtered].sort((a,b) => b.lines.length - a.lines.length || a.code.localeCompare(b.code));
  const stateLines = filterEngineOptions(options, { ...filters, status: null }).flatMap(option => option.lines);
  const states = [...new Set([...stateLines.map(line => line.status), ...(status ? [status] : [])])].sort();
  const hasFilter = Boolean(type || outcome || status || query);
  const missing = movementQuantity(lines).missing;
  return <div className="space-y-3">
    <ActionOverview bundle={bundle} options={options} selected={action} onSelect={pickAction} />
    <Card className="overflow-hidden border-gray-200 shadow-sm">
      <div className="space-y-2 p-3">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500" aria-label="Engine drill-down"><button type="button" className="rounded px-1 py-1 hover:bg-gray-100" onClick={() => pickAction('all')}>All outputs</button><ChevronRight className="size-3" aria-hidden /><button type="button" className="rounded px-1 py-1 hover:bg-gray-100" onClick={() => update({ ebrick: null, epage: null })}>{GROUP_LABEL[action]}</button>{brick && <><ChevronRight className="size-3" aria-hidden /><span className="font-medium text-gray-900">{brickName(brick)}</span></>}</nav>
        <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h3 className="text-base font-semibold tracking-tight">{brick ? brickName(brick) : decisions ? 'What did the engine decide?' : 'What did the engines produce?'}</h3><p className="text-xs text-gray-500">{decisions ? bundle.decisions === null ? 'Decision results unavailable' : `${formatUnits(filtered.length)} recorded decisions · no emitted action line` : `${formatUnits(lines.length)} action line${lines.length === 1 ? '' : 's'} · ${formatUnits(filtered.length)} unique option${filtered.length === 1 ? '' : 's'}${movementQuantity(lines).lines ? ` · ${quantityText(lines)} requested move units` : ''}`}</p></div>{!brick && <div className="flex rounded-lg bg-gray-100 p-1" aria-label="Group engine outputs"><Button size="sm" variant="ghost" className={cn('h-8 min-h-8 text-xs', !showOptions && 'bg-white shadow-sm')} aria-pressed={!showOptions} onClick={() => update({ eview: null, epage: null })}><Layers3 className="size-3.5" aria-hidden />By brick</Button><Button size="sm" variant="ghost" className={cn('h-8 min-h-8 text-xs', showOptions && 'bg-white shadow-sm')} aria-pressed={showOptions} onClick={() => update({ eview: 'options', epage: null })}>All options</Button></div>}</div>
        <div className="space-y-2 rounded-lg border border-gray-100 p-3"><div className="flex justify-between gap-2 text-xs text-gray-500"><span>{decisions ? 'Decision mix · options' : action === 'price' ? 'Markdown · action lines' : action === 'movement' ? 'Stock movements · action lines' : 'Output mix · action lines'}</span><span>Select a segment to explore</span></div><OutputMix items={resultMix(mixScope, decisions, action)} selected={decisions ? outcome : type} label="Engine output mix" onSelect={pickMix} /></div>
        <div className="flex flex-wrap items-center gap-2"><div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" aria-hidden /><Input className="h-8 py-1.5 pl-8 text-sm lg:text-xs [@media(pointer:coarse)]:h-11" aria-label="Search engine outputs" placeholder="Search bricks or options" value={query} onChange={event => update({ eq: event.target.value || null, epage: null })} /></div>{!decisions && <div className="flex flex-wrap gap-1" aria-label="Action line state"><Button size="sm" variant={!status ? 'secondary' : 'ghost'} aria-pressed={!status} onClick={() => update({ estatus: null, epage: null })}>All states</Button>{states.map(value => <Button size="sm" key={value} variant={status === value ? 'secondary' : 'ghost'} aria-pressed={status === value} onClick={() => update({ estatus: status === value ? null : value, epage: null })}>{resultLabel(value)} · {stateLines.filter(line => line.status === value).length}</Button>)}</div>}{hasFilter && <Button size="sm" variant="ghost" onClick={() => update({ eengine: null, eoutcome: null, estatus: null, eq: null, epage: null })}><X className="size-3" aria-hidden />Clear output filters</Button>}</div>
        {(type || outcome) && <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">{decisions ? resultLabel(outcome!) : engineType(type!).label}</span>}
        {missing > 0 && <p className="text-xs text-amber-800">{missing} movement lines have no quantity. “+” marks partial totals.</p>}
      </div>
      {!count ? <EmptyState title={decisions && bundle.decisions === null ? 'Decision results unavailable' : hasFilter ? 'No outputs match these filters' : decisions ? 'No decisions without action lines' : 'No action lines produced'} description="Choose another output group or clear the filters." /> : showOptions ? <EngineOptionRows options={sorted.slice(offset,offset + PAGE_SIZE)} decisions={decisions} action={action} onOpen={option => update({ option })} /> : <div>
        <div className="grid grid-cols-[minmax(0,1fr)_70px_20px] gap-3 border-y border-gray-100 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_70px_110px_20px]" aria-hidden><span>Brick · options</span><span className="hidden md:block">{decisions ? 'Decisions' : 'Engine outputs'}</span><span className="text-right">{decisions ? 'Options' : 'Lines'}</span><span className="hidden text-right md:block">{decisions ? '' : action === 'price' ? 'Proposed price' : 'Move units'}</span><span /></div>
        {groups.slice(offset,offset + PAGE_SIZE).map(group => <div key={group.key} className="grid grid-cols-[minmax(0,1fr)_70px_20px] items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_70px_110px_20px]">
          <button type="button" aria-label={`Explore engine outputs for ${brickName(group.key)}`} onClick={() => update({ ebrick: group.key, epage: null })} className="flex items-center gap-3 text-left"><span className="hidden rounded-lg border border-gray-100 bg-gray-50 p-2 text-gray-500 sm:block"><Layers3 className="size-4" aria-hidden /></span><span><span className="block text-xs font-semibold">{brickName(group.key)}</span><span className="text-xs text-gray-500">{group.entries.length} {group.entries.length === 1 ? 'option' : 'options'}</span></span></button>
          <div className="col-span-3 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1"><OutputMix compact items={resultMix(group.entries, decisions)} selected={decisions ? outcome : type} label={`${brickName(group.key)} outputs`} onSelect={key => pickMix(key, group.key)} /></div>
          <span className="text-right font-semibold tabular-nums">{decisions ? group.entries.length : group.lines.length}</span><span className="hidden text-right text-xs tabular-nums md:block">{decisions ? '' : action === 'price' ? priceRange(group.lines) : quantityText(group.lines)}</span><Button size="icon" variant="ghost" aria-label={`Open ${brickName(group.key)} engine options`} onClick={() => update({ ebrick: group.key, epage: null })}><ChevronRight className="size-4" aria-hidden /></Button>
        </div>)}
      </div>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-3 py-2 text-xs text-gray-500"><span>{decisions && bundle.decisions === null ? '—' : count} {showOptions ? count === 1 ? 'option' : 'options' : count === 1 ? 'brick' : 'bricks'} · {decisions ? 'Recorded decisions only' : 'Sorted by action lines'}</span><div className="flex items-center gap-2"><span>{page} of {pages}</span><Button size="sm" variant="ghost" disabled={page === 1} onClick={() => update({ epage: String(page-1) })}>Previous</Button><Button size="sm" variant="ghost" disabled={page === pages} onClick={() => update({ epage: String(page+1) })}>Next</Button></div></div>
    </Card>
    <p className="px-1 text-[11px] text-gray-500">{decisions ? 'Only options with a recorded engine decision and no action line are included.' : 'Bars count action lines. Options may appear in multiple engines; requested quantities are not distinct stock units.'}</p>
    <EngineOptionDrawer key={params.option} snapshotId={snapshot.snapshot_id} storeCode={store.store_code} bundle={bundle} params={params} />
  </div>;
}

export function EngineActions({ snapshot, store, params }: { snapshot: Snapshot; store: StoreSummary; params: WorkspaceParams }) {
  const query = useStoreEngine(snapshot.snapshot_id, store.store_code);
  const inventory = useJourneyInventory(snapshot.snapshot_id, store.store_code);
  const options = useMemo(() => query.data ? engineOptions(query.data, inventory.data ?? []) : [], [query.data, inventory.data]);
  return <div className="space-y-3 pb-3">
    {query.isLoading || (query.data && inventory.isLoading) ? <LoadingBlock label="Loading engine outputs" /> : query.error ? <ErrorBlock error={query.error} onRetry={() => void query.refetch()} /> : !query.data ? <EmptyState title="No completed engine run for this snapshot" description="Choose a snapshot with a completed run to explore its outputs." /> : <>
      {inventory.error && <div className="flex items-center gap-2 text-xs text-amber-800">Product labels unavailable. Outputs are shown by option code.<Button size="sm" variant="ghost" onClick={() => void inventory.refetch()}>Retry labels</Button></div>}
      <EngineExplorer bundle={query.data} options={options} snapshot={snapshot} store={store} params={params} />
    </>}
  </div>;
}
