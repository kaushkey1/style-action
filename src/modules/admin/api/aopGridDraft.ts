import { numberDraft, operationKey, ruleOperation, siteOperation, type ParameterResolver } from './aopAdminDraft';
import { FISCAL_MONTHS, monthLabel } from './aopAdminCalendar';
import type { DraftChange, ParameterKey, Season, SiteParameters } from '../types/aopAdmin';

export const GRID_PARAMETERS = [
  { key: 'nsm_ratio', label: 'NSM', heading: 'NSM', max: 100 },
  { key: 'sell_through_ratio', label: 'Sell-through', heading: 'Sell-through', max: 100 },
  { key: 'discount_ratio', label: 'Discount', heading: 'Discount', max: 99.9999 },
  { key: 'aop_achievement_ratio', label: 'AOP Achievement', heading: 'Achievement', max: 99_999_999.9999 },
] as const;
export const MAX_DRAFT_CELLS = 10_000; // SaveRequest.operations limit.
const MAX_CLIPBOARD_LENGTH = 1_000_000;
export interface GridColumn { month: number; parameter: ParameterKey }
export interface GridContext { seasons: Season[]; changes: Record<string, DraftChange>; resolve: ParameterResolver }
export interface GridPreviewCell extends GridColumn { site: SiteParameters; before: string; after: string; change: DraftChange }
export interface GridPreview { label: string; cells: GridPreviewCell[]; errors: string[]; skipped: number; unchanged: number; filteredOut: number }
export type GridFillAction = { kind: 'value'; value: string } | { kind: 'reset' };

export function gridColumns(months: number[], parameters: ParameterKey[]): GridColumn[] {
  return FISCAL_MONTHS.filter((month) => months.includes(month)).flatMap((month) =>
    GRID_PARAMETERS.filter((metric) => parameters.includes(metric.key)).map(({ key }) => ({ month, parameter: key })));
}

export function availableMonth(site: SiteParameters, month: number): boolean {
  return !site.mapping_error && site.months.some((item) => item.month_number === month && item.applicable);
}

function readCell(context: GridContext, site: SiteParameters, column: GridColumn): { text: string; value: number | null; error?: string } {
  const season = context.seasons.find((item) => item.months.includes(column.month));
  if (!season || !availableMonth(site, column.month)) return { text: 'Not available', value: null, error: 'Month is not available' };
  const pending = context.changes[operationKey(siteOperation(site, season, column.parameter, column.month))];
  if (pending?.error) return { text: pending.input ?? '', value: null, error: pending.error };
  const value = pending?.operation.op === 'set_parameter' ? pending.operation.value
    : context.resolve(site, season, column.month, column.parameter)?.value;
  return value === undefined || value === null ? { text: 'Not set', value: null }
    : { text: String(Number((value * 100).toFixed(4))), value: Number((value * 100).toFixed(4)) };
}

function location(site: SiteParameters, column: GridColumn): string {
  return `${site.code} · ${monthLabel(column.month)} · ${GRID_PARAMETERS.find((item) => item.key === column.parameter)?.label}`;
}

function addCell(preview: GridPreview, context: GridContext, site: SiteParameters, column: GridColumn, input: string): void {
  const season = context.seasons.find((item) => item.months.includes(column.month));
  if (!season || !availableMonth(site, column.month)) { preview.errors.push(`${location(site, column)}: Month is not available`); return; }
  const metric = GRID_PARAMETERS.find((item) => item.key === column.parameter)!;
  const change = numberDraft(siteOperation(site, season, column.parameter, column.month), input, true, 0, metric.max);
  if (change.error) { preview.errors.push(`${location(site, column)}: ${change.error}`); return; }
  const current = readCell(context, site, column);
  if (!current.error && current.value !== null && current.value === Number(input)) { preview.unchanged++; return; }
  preview.cells.push({ ...column, site, before: current.text, after: input, change });
}

function validateSize(preview: GridPreview, context: GridContext): GridPreview {
  const keys = new Set([...Object.keys(context.changes), ...preview.cells.map(({ change }) => operationKey(change.operation))]);
  if (keys.size > MAX_DRAFT_CELLS) preview.errors.push(`This would exceed ${MAX_DRAFT_CELLS.toLocaleString()} pending edits. Save your current changes or select fewer cells.`);
  return preview;
}

export function buildContextFillPreview(context: GridContext, sites: SiteParameters[], columns: GridColumn[], action: GridFillAction): GridPreview {
  const preview: GridPreview = { label: action.kind === 'reset' ? 'Reset to default' : 'Fill values', cells: [], errors: [], skipped: 0, unchanged: 0, filteredOut: 0 };
  for (const site of sites) for (const column of columns) {
    if (action.kind === 'reset') { resetCell(preview, context, site, column); continue; }
    const input = action.value.trim().replace(/%$/, '').trim();
    addCell(preview, context, site, column, input);
  }
  return validateSize(preview, context);
}

export function buildChannelResetPreview(context: GridContext, channel: string, sites: SiteParameters[]): GridPreview {
  const preview: GridPreview = { label: `Reset ${channel} to default`, cells: [], errors: [], skipped: 0, unchanged: 0, filteredOut: 0 };
  const columns = gridColumns(FISCAL_MONTHS, GRID_PARAMETERS.map((metric) => metric.key));
  for (const site of sites) {
    if (site.channel_code?.trim().toUpperCase() !== channel.trim().toUpperCase()) continue;
    for (const column of columns) {
      if (!availableMonth(site, column.month)) { preview.skipped++; continue; }
      resetCell(preview, context, site, column);
    }
  }
  return validateSize(preview, context);
}

function resetCell(preview: GridPreview, context: GridContext, site: SiteParameters, column: GridColumn): void {
  const season = context.seasons.find((item) => item.months.includes(column.month));
  if (!season || !availableMonth(site, column.month)) { preview.errors.push(`${location(site, column)}: Month is not available`); return; }
  const operation = siteOperation(site, season, column.parameter, column.month);
  const key = operationKey(operation);
  const pending = context.changes[key];
  const current = context.resolve(site, season, column.month, column.parameter);
  const hasOverride = pending ? pending.operation.op === 'set_parameter' : current && operationKey(ruleOperation(current.source)) === key;
  if (!hasOverride) { preview.unchanged++; return; }
  const inherited = context.resolve(site, season, column.month, column.parameter, true);
  preview.cells.push({ ...column, site, before: readCell(context, site, column).text,
    after: inherited ? String(Number((inherited.value * 100).toFixed(4))) : 'Not set',
    change: { operation: { ...operation, op: 'remove_parameter' } },
  });
}

function clipboardRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  const input = text.replace(/\r\n?/g, '\n');
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') { field += '"'; index++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && !field) quoted = true;
    else if (char === '\t' || char === '\n') {
      row.push(field); field = '';
      if (char === '\n') { rows.push(row); row = []; }
    } else field += char;
  }
  if (quoted) throw new Error('A quoted cell is incomplete. Copy the cells from Excel again.');
  row.push(field); rows.push(row);
  while (rows.length && rows.at(-1)?.every((cell) => !cell.trim())) rows.pop();
  return rows;
}

function headerKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function pasteTableWithHeaders(context: GridContext, sites: SiteParameters[], selectedColumns: GridColumn[], rows: string[][], preview: GridPreview): GridPreview {
  const headers = rows[0]?.slice(2) ?? [];
  const data = rows.slice(1).filter((row) => row.some((cell) => cell.trim()));
  if (!headers.length || !data.length) return { ...preview, errors: ['The sheet has no monthly values to paste.'] };
  if (data.length * headers.length > MAX_DRAFT_CELLS) return { ...preview, errors: ['Paste at most 10,000 values at a time.'] };
  const knownHeaders = new Map<string, GridColumn>();
  for (const month of FISCAL_MONTHS) for (const metric of GRID_PARAMETERS) {
    for (const name of [monthLabel(month), monthLabel(month).slice(0, 3)]) {
      for (const label of [metric.label, metric.heading]) knownHeaders.set(headerKey(`${name} ${label}`), { month, parameter: metric.key });
    }
  }
  const columns = headers.map((header) => knownHeaders.get(headerKey(header)));
  const selectedKeys = new Set(selectedColumns.map((column) => `${column.month}:${column.parameter}`));
  const columnKeys = new Set<string>();
  columns.forEach((column, index) => {
    if (!column) { preview.errors.push(`Unknown column: ${headers[index]}. Use month and parameter headers, such as Apr · NSM %.`); return; }
    const key = `${column.month}:${column.parameter}`;
    if (columnKeys.has(key)) preview.errors.push(`Duplicate column: ${headers[index]}.`);
    columnKeys.add(key);
  });
  const byCode = new Map<string, SiteParameters[]>();
  for (const site of sites) byCode.set(site.code, [...byCode.get(site.code) ?? [], site]);
  const seen = new Set<string>();
  for (const row of data) {
    if (row.length > headers.length + 2 && row.slice(headers.length + 2).some((cell) => cell.trim())) {
      preview.errors.push('Some values have no column header. Copy the complete table, including its headers.'); continue;
    }
    const code = row[1]?.trim() ?? '';
    if (!code || seen.has(code)) { preview.errors.push(code ? `Duplicate site code: ${code}.` : 'A row is missing its Site code.'); continue; }
    seen.add(code);
    const matches = byCode.get(code);
    if (!matches?.length) { preview.errors.push(`Site code ${code} does not belong to this channel. Use the site codes shown in the grid.`); continue; }
    if (matches.length !== 1) { preview.errors.push(`Site code ${code} matches more than one site. Paste values into its row instead.`); continue; }
    const site = matches[0];
    if (!site) continue;
    columns.forEach((column, index) => {
      if (!column) return;
      const raw = row[index + 2]?.trim() ?? '';
      if (!raw) { preview.skipped++; return; }
      if (!selectedKeys.has(`${column.month}:${column.parameter}`)) { preview.filteredOut++; return; }
      addCell(preview, context, site, column, raw.replace(/%$/, '').trim());
    });
  }
  return validateSize(preview, context);
}

export function buildPastePreview(context: GridContext, sites: SiteParameters[], columns: GridColumn[], startRow: number, startColumn: number, text: string, channelSites = sites): GridPreview {
  const preview: GridPreview = { label: 'Paste from Excel', cells: [], errors: [], skipped: 0, unchanged: 0, filteredOut: 0 };
  if (text.length > MAX_CLIPBOARD_LENGTH) return { ...preview, errors: ['The pasted block is too large. Paste at most 10,000 cells.'] };
  let rows: string[][];
  try { rows = clipboardRows(text); }
  catch (error) { return { ...preview, errors: [error instanceof Error ? error.message : 'Unable to read the pasted cells.'] }; }
  if (headerKey(rows[0]?.[0] ?? '') === 'site' && headerKey(rows[0]?.[1] ?? '') === 'sitecode') {
    return pasteTableWithHeaders(context, channelSites, columns, rows, preview);
  }
  const width = rows[0]?.length ?? 0;
  if (!width || rows.some((row) => row.length !== width)) return { ...preview, errors: ['Paste a rectangular block of values, or a table including its Site and Site code headers.'] };
  if (rows.length * width > MAX_DRAFT_CELLS) return { ...preview, errors: ['Paste at most 10,000 cells at a time.'] };
  if (startRow < 0 || startColumn < 0 || startRow + rows.length > sites.length || startColumn + width > columns.length) {
    return { ...preview, errors: ['The pasted block extends beyond the visible grid. Choose a different starting cell or show more parameters and sites.'] };
  }
  rows.forEach((row, rowIndex) => row.forEach((raw, columnIndex) => {
    const input = raw.trim().replace(/%$/, '').trim();
    if (!raw.trim()) { preview.skipped++; return; }
    const site = sites[startRow + rowIndex];
    const column = columns[startColumn + columnIndex];
    if (site && column) addCell(preview, context, site, column, input);
  }));
  return validateSize(preview, context);
}
