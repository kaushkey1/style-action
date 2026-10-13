import { useDeferredValue, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { RotateCcw, Search } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button, EmptyState, Input, Skeleton } from '@/components/ui';
import { FISCAL_MONTHS, monthLabel } from '../../api/aopAdminCalendar';
import { siteOperation, sourceLabel, type ParameterResolver } from '../../api/aopAdminDraft';
import { AopNumberField, type EditProps } from './AopFields';
import { availableMonth, buildChannelResetPreview, buildPastePreview, gridColumns, GRID_PARAMETERS } from '../../api/aopGridDraft';
import { AopGridTools, type PendingGridPreview } from './AopGridTools';
import { AopFillMenu } from './AopFillMenu';
import type { GridResponse, ParameterKey, Season } from '../../types/aopAdmin';

interface Props extends EditProps {
  grid: GridResponse;
  channel: string;
  seasons: Season[];
  resolve: ParameterResolver;
  parameters: ParameterKey[];
  onParameters: (parameters: ParameterKey[]) => void;
  search: string;
  onSearch: (search: string) => void;
}

const VIRTUALIZE_AFTER_SITES = 20;
const ESTIMATED_SITE_HEIGHT = 56;
const INITIAL_GRID_HEIGHT = 640;

export function AopMonthlySiteTable({ grid, channel, seasons, resolve, parameters, onParameters, search, onSearch, ...edit }: Props): ReactNode {
  'use no memo'; // TanStack Virtual exposes a mutable instance; defer plain row snapshots rather than compiler-memoizing its API.
  const reduceMotion = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const pendingFocus = useRef<{ row: number; column: number } | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [preview, setPreview] = useState<PendingGridPreview | null>(null);
  const [refreshRevision, setRefreshRevision] = useState(0);
  const refreshTable = (): void => setRefreshRevision((revision) => revision + 1);
  const channelReset = useMemo(() => buildChannelResetPreview({ seasons, changes: edit.changes, resolve }, channel, grid.items),
    [seasons, edit.changes, resolve, channel, grid.items]);
  const sites = useMemo(() => {
    const terms = search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return grid.items.filter((site) => terms.every((term) => `${site.name} ${site.code}`.toLocaleLowerCase().includes(term)));
  }, [grid.items, search]);
  const months = FISCAL_MONTHS;
  const selectedParameters = GRID_PARAMETERS.filter((item) => parameters.includes(item.key));
  const singleParameter = selectedParameters.length === 1 ? selectedParameters[0] : undefined;
  const columns = gridColumns(months, parameters);
  const context = { seasons, changes: edit.changes, resolve };
  const virtualized = sites.length > VIRTUALIZE_AFTER_SITES;
  // eslint-disable-next-line react-hooks/incompatible-library -- Compiler memoization is opted out above; only plain row snapshots, never the mutable virtualizer API, are deferred.
  const rows = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: sites.length,
    getScrollElement: () => gridRef.current,
    getItemKey: (index) => sites[index]?.site_reference ?? index,
    estimateSize: () => ESTIMATED_SITE_HEIGHT,
    initialRect: { height: INITIAL_GRID_HEIGHT, width: 0 },
    paddingStart: headerHeight,
    scrollPaddingStart: headerHeight,
    overscan: 4,
    enabled: virtualized && selectedParameters.length > 0,
  });
  const virtualRows = rows.getVirtualItems();
  const visibleRows = useMemo(() => virtualized
    ? virtualRows.map((item) => ({ row: item.index, site: sites[item.index]! }))
    : sites.map((site, row) => ({ row, site })), [virtualized, virtualRows, sites]);
  const renderRequest = useMemo(() => ({ visibleRows, parameters, sites, refreshRevision }), [visibleRows, parameters, sites, refreshRevision]);
  const rendered = useDeferredValue(renderRequest);
  const readySites = useMemo(() => new Set(rendered.visibleRows.map(({ site }) => site.site_reference)), [rendered.visibleRows]);
  const sameFilters = rendered.parameters === parameters && rendered.sites === sites && rendered.refreshRevision === refreshRevision;
  const rendering = !sameFilters || visibleRows.some(({ site }) => !readySites.has(site.site_reference));
  const topSpace = virtualized ? Math.max(0, (virtualRows[0]?.start ?? headerHeight) - headerHeight) : 0;
  const bottomSpace = virtualized ? Math.max(0, rows.getTotalSize() - (virtualRows.at(-1)?.end ?? headerHeight)) : 0;
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const measure = (): void => setHeaderHeight(header.getBoundingClientRect().height);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, [selectedParameters.length, sites.length]);
  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    const input = gridRef.current?.querySelector<HTMLInputElement>(`input[data-grid-row="${target.row}"][data-grid-column="${target.column}"]`);
    if (input) { pendingFocus.current = null; input.focus(); input.select(); }
  }, [virtualRows, rendered]);
  function paste(event: ClipboardEvent<HTMLElement>, row = 0, column = 0): void {
    if (event.defaultPrevented || edit.disabled || !edit.onBatchChange) return;
    event.preventDefault();
    setPreview({ result: buildPastePreview(context, sites, columns, row, column, event.clipboardData.getData('text/plain'), grid.items), changes: edit.changes, resolve });
  }
  function navigate(event: KeyboardEvent<HTMLInputElement>, row: number, column: number): void {
    if (event.key !== 'Tab' && event.key !== 'Enter') return;
    const direction = event.shiftKey ? -1 : 1;
    const step = event.key === 'Tab' ? direction : direction * columns.length;
    for (let index = row * columns.length + column + step; index >= 0 && index < sites.length * columns.length; index += step) {
      const nextRow = Math.floor(index / columns.length);
      const nextColumn = index % columns.length;
      const site = sites[nextRow];
      const metric = columns[nextColumn];
      if (!site || !metric || !availableMonth(site, metric.month) || !seasons.some((season) => season.months.includes(metric.month))) continue;
      event.preventDefault();
      const target = gridRef.current?.querySelector<HTMLInputElement>(`input[data-grid-row="${nextRow}"][data-grid-column="${nextColumn}"]:not(:disabled)`);
      if (target) { target.focus(); target.select(); }
      else if (virtualized) { pendingFocus.current = { row: nextRow, column: nextColumn }; rows.scrollToIndex(nextRow, { align: 'auto' }); }
      return;
    }
    if (event.key === 'Enter') event.preventDefault();
  }
  const filtered = search !== '' || parameters.length !== 1 || parameters[0] !== 'nsm_ratio';
  return <div className="@container">
    <div className="border-t border-gray-100 bg-white">
      <div className="space-y-3 py-4">
        <div className="grid grid-cols-1 items-center gap-1 @2xl:grid-cols-[minmax(0,1fr)_auto] @2xl:gap-3">
          <SelectionRow label="Parameters" name={`${channel} parameters`} selected={parameters} onChange={onParameters}
            options={GRID_PARAMETERS.map((item) => ({ value: item.key, label: `${item.heading}%`, accessibleLabel: `${item.label} %` }))} />
          <div className="flex flex-wrap items-center justify-end gap-2 justify-self-end">
            <Button variant="ghost" size="sm" aria-label={`Reset ${channel} to default`}
              disabled={edit.disabled || !edit.onBatchChange || !channelReset.cells.length || !!channelReset.errors.length}
              title={channelReset.errors[0] ?? (channelReset.cells.length
                ? `Reset all ${channel} sites, all 12 months and all 4 parameters to inherited defaults in the draft, regardless of filters.`
                : `No monthly overrides to reset in ${channel}.`)}
              className="min-h-11 gap-1 px-2 text-xs @2xl:min-h-8 motion-reduce:transform-none motion-reduce:transition-none"
              onClick={() => {
                if (edit.disabled || !edit.onBatchChange || !channelReset.cells.length || channelReset.errors.length) return;
                edit.onBatchChange(channelReset.cells.map((cell) => cell.change), channelReset.label);
                refreshTable();
              }}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Reset {channel} to default</Button>
            <Button variant="ghost" size="sm" aria-label={`Clear ${channel} filters`} disabled={!filtered}
              className="min-h-11 px-2 text-xs @2xl:min-h-8 motion-reduce:transform-none motion-reduce:transition-none"
              onClick={() => { onSearch(''); onParameters(['nsm_ratio']); }}>Clear filters</Button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 py-3">
        <AopGridTools {...edit} context={context} preview={preview} onPreview={setPreview}>
        <div className="flex w-full items-center gap-3">
        <span role="status" className="min-w-0 flex-1 truncate text-xs text-gray-500">{search.trim() ? `${sites.length} of ${grid.total} sites` : ''}</span>
        <div className="ml-auto flex w-full min-w-0 items-center gap-2 @lg:w-80 @lg:shrink-0">
          <Input type="search" aria-label={`Search ${channel} sites`} placeholder="Search site name or code"
            value={search} onChange={(event) => onSearch(event.target.value)}
            leftIcon={<Search className="h-4 w-4 text-gray-400" aria-hidden="true" />}
            containerClassName="min-w-0 flex-1 @lg:w-80 @lg:flex-none" className="min-h-11 py-2 text-sm @2xl:min-h-8 @2xl:py-1" />
        </div>
        </div>
        </AopGridTools>
      </div>
    </div>
    {!selectedParameters.length
      ? <EmptyState title="Choose parameters" description="Select at least one parameter to view site values." />
      : !sites.length ? <EmptyState title="No matching sites" description="Try another site name or code." />
        : <>
          <motion.div ref={gridRef} role="region" aria-label={`${channel} monthly values`} aria-busy={rendering} tabIndex={0}
            onPaste={paste}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
            className="relative h-[40rem] max-h-[75vh] overflow-auto overscroll-contain rounded-lg border border-gray-200 focus-visible:outline-2 focus-visible:outline-primary">
            {rendering && <span role="status" className="sr-only">Updating {channel} monthly values</span>}
            <table aria-label={`${channel} monthly values`} aria-rowcount={sites.length + (singleParameter ? 1 : 2)} className="w-full table-fixed text-sm motion-reduce:[&_[data-slot=skeleton]]:animate-none">
              <caption className="sr-only">{selectedParameters.map((metric) => `${metric.label}%`).join(', ')} by site, April to March</caption>
              <colgroup><col className="w-48 @2xl:w-56" />{months.flatMap((month) => selectedParameters.map(({ key }) => <col key={`${month}:${key}`} className="w-36 @2xl:w-32" />))}</colgroup>
              <thead ref={headerRef} className="sticky top-0 z-20 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th scope="col" rowSpan={singleParameter ? 1 : 2} className="sticky left-0 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Site
                  </th>
                  {months.map((month) => <th scope={singleParameter ? 'col' : 'colgroup'} colSpan={selectedParameters.length} key={month} className="group/fill border-l border-gray-200 px-2 py-1.5 text-center text-xs font-medium text-gray-600">
                    <div className="flex items-center justify-center gap-1">
                      <span>{monthLabel(month)}<span className="ml-1 text-gray-400">{seasons.find((season) => season.months.includes(month))?.season_code}</span></span>
                      {singleParameter && <AopFillMenu target={{ kind: 'column', column: { month, parameter: singleParameter.key } }} channel={channel} sites={sites} columns={columns} context={context}
                        disabled={edit.disabled || !edit.onBatchChange} onApply={(batch, label) => edit.onBatchChange?.(batch, label)} onReset={refreshTable} />}
                    </div>
                  </th>)}
                </tr>
                {!singleParameter && <tr className="border-b border-gray-200">{months.flatMap((month) => selectedParameters.map(({ key, heading }, index) =>
                  <th scope="col" key={`${month}:${key}`} className={`group/fill px-2 py-1.5 text-right text-xs font-medium text-gray-500 ${index === 0 ? 'border-l border-gray-200' : ''}`}>
                    <div className="flex min-h-6 items-center justify-end gap-1"><span className="min-w-0 break-words">{heading}%</span>
                      <AopFillMenu target={{ kind: 'column', column: { month, parameter: key } }} channel={channel} sites={sites} columns={columns} context={context}
                        disabled={edit.disabled || !edit.onBatchChange} onApply={(batch, label) => edit.onBatchChange?.(batch, label)} onReset={refreshTable} />
                    </div>
                  </th>))}</tr>}
              </thead>
              <tbody><RowSpacer height={topSpace} columns={columns.length + 1} />{visibleRows.map(({ site, row }) => {
                const loading = !sameFilters || !readySites.has(site.site_reference);
                return <tr key={site.site_reference}
                ref={virtualized ? rows.measureElement : undefined} data-index={row} aria-rowindex={row + (singleParameter ? 2 : 3)}
                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
                <th scope="row" className="group/fill sticky left-0 z-10 bg-white px-3 py-2 text-left align-top font-normal">
                  <div className="flex items-start justify-between gap-1"><div className="min-w-0">
                    <p className="break-words font-medium text-gray-900">{site.name}</p>
                    <p className="mt-0.5 break-words text-xs text-gray-500">{site.code}</p>
                  </div>
                    {!loading && <AopFillMenu target={{ kind: 'site', site }} channel={channel} sites={sites} columns={columns} context={context}
                      disabled={edit.disabled || !edit.onBatchChange} onApply={(batch, label) => edit.onBatchChange?.(batch, label)} onReset={refreshTable} />}
                  </div>
                </th>
                {months.flatMap((month, monthIndex) => {
                  const season = seasons.find((item) => item.months.includes(month));
                  const available = availableMonth(site, month);
                  if (!season || !available) return [<td key={month} colSpan={selectedParameters.length} className="p-2 text-xs text-gray-500">{monthLabel(month)}: {season ? 'Not available' : 'Season configuration required'}</td>];
                  return selectedParameters.map((metric, index) => {
                    const value = loading ? null : resolve(site, season, month, metric.key);
                    const column = monthIndex * selectedParameters.length + index;
                    return <td key={`${month}:${metric.key}`} className={`min-w-0 px-2 py-2 align-top ${index === 0 ? 'border-l border-gray-100' : ''}`}>
                      {loading ? <div aria-hidden="true" className="flex items-start justify-end gap-1">
                        <Skeleton className="h-11 w-20 shrink-0 @2xl:h-8" />
                        <div className="w-4 pt-3 @2xl:pt-1.5"><Skeleton className="h-3 w-3" /></div>
                      </div> : <div className="flex justify-end"><AopNumberField {...edit} compact operation={siteOperation(site, season, metric.key, month)}
                        gridCell={{ row, column,
                          onKeyDown: (event) => navigate(event, row, column),
                          onPaste: (event) => paste(event, row, column),
                        }}
                        value={value?.value ?? null} ratio max={metric.max} placeholder="Not set" description={value ? sourceLabel(value) : 'Not set'}
                        label={`${site.code} ${monthLabel(month)} ${metric.label}%`} /></div>}
                    </td>;
                  });
                })}
              </tr>; })}<RowSpacer height={bottomSpace} columns={columns.length + 1} /></tbody>
            </table>
          </motion.div>
          <p className="mt-2 text-xs text-gray-500">Season Defaults apply unless overridden.</p>
        </>}
  </div>;
}

function RowSpacer({ height, columns }: { height: number; columns: number }): ReactNode {
  if (height <= 0) return null;
  return <tr aria-hidden="true">
    {/* eslint-disable-next-line no-restricted-syntax -- Preserve the scroll height of offscreen site rows measured by the virtualizer. */}
    <td colSpan={columns} className="p-0" style={{ height }} />
  </tr>;
}

function SelectionRow<T extends number | string>({ label, name, options, selected, onChange }: {
  label: string;
  name: string;
  options: { value: T; label: string; accessibleLabel: string }[];
  selected: T[];
  onChange: (selected: T[]) => void;
}): ReactNode {
  const reduceMotion = useReducedMotion();
  return <div role="group" aria-label={name} className="flex flex-col gap-2 @lg:flex-row @lg:items-start @lg:gap-3">
    <span className="w-20 shrink-0 text-xs font-medium text-gray-500 @lg:pt-4 @2xl:pt-3">{label}</span>
    <div className="flex min-w-0 flex-wrap gap-1 rounded-lg bg-gray-50 p-1">{options.map((option) => <motion.button key={option.value} type="button" aria-label={option.accessibleLabel}
      whileTap={reduceMotion || (selected.length === 1 && selected.includes(option.value)) ? undefined : { scale: 0.94 }} transition={{ duration: 0.12 }}
      aria-pressed={selected.includes(option.value)} aria-disabled={selected.length === 1 && selected.includes(option.value)}
      onClick={() => {
        const next = selected.includes(option.value) ? selected.filter((item) => item !== option.value) : [...selected, option.value];
        if (next.length) onChange(next);
      }}
      className={`min-h-11 min-w-11 rounded-md px-2.5 text-xs font-medium transition-[background-color,color,box-shadow] duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary @2xl:min-h-8 @2xl:min-w-9 ${selected.includes(option.value) ? 'bg-white text-primary shadow-sm ring-1 ring-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}>
      {option.label}
    </motion.button>)}</div>
  </div>;
}
