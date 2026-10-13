import { describe, expect, it } from 'vitest';

import { StyleActionsApiError } from '@/modules/style-actions-product/api/client';
import {
  buildErrorText,
  EMPTY,
  FINDING_LABEL,
  FINDING_META,
  findingCountRows,
  findingEffect,
  formatBytes,
  formatPercent,
  formatUnits,
  formatWholeUnits,
  legacyHref,
  parseSegment,
  segmentCohorts,
  workspaceHref,
} from '@/modules/style-actions-product/components/display';

describe('style-actions-product display helpers', () => {
  it('shows missing values as an em dash, never zero', () => {
    expect(formatUnits(null)).toBe(EMPTY);
    expect(formatUnits(undefined)).toBe(EMPTY);
    expect(formatPercent(null)).toBe(EMPTY);
    expect(formatBytes(0)).toBe(EMPTY);
  });

  it('formats units with a Unicode minus for negatives', () => {
    expect(formatUnits(78)).toBe('78');
    expect(formatUnits(-4)).toBe('−4');
    expect(formatUnits(1646038)).toBe('16,46,038');
  });

  it('shows every unit figure as a whole number, rounding half up, never −0 (S2-C42)', () => {
    expect(formatUnits(0.48)).toBe('0');
    expect(formatUnits(0.5)).toBe('1');
    expect(formatUnits(17.7)).toBe('18');
    expect(formatUnits(22.75)).toBe('23');
    expect(formatUnits(3.75)).toBe('4');
    expect(formatUnits(93.04)).toBe('93');
    expect(formatUnits(-0)).toBe('0');
    expect(formatUnits(-0.4)).toBe('0');
    expect(formatUnits(-2.5)).toBe('−3');
    expect(formatUnits(1234.5)).toBe('1,235');
  });

  it('shows expected units whole too (S2-C42)', () => {
    expect(formatWholeUnits(4.48)).toBe('4');
    expect(formatWholeUnits(42.0375)).toBe('42');
    expect(formatWholeUnits(null)).toBe(EMPTY);
  });

  it('formats ratios as whole percentages', () => {
    expect(formatPercent(0.2)).toBe('20%');
    expect(formatPercent(0.3333)).toBe('33%');
    expect(formatPercent(-0.05)).toBe('−5%');
  });

  it('formats bytes in binary units', () => {
    expect(formatBytes(5.23e9)).toBe('4.9 GB');
  });

  it('builds workspace links with only the set parameters', () => {
    expect(workspaceHref({})).toBe('/style-actions-product');
    expect(workspaceHref({ store: '8080', option: '700000001_BLU', seg: null })).toBe('/style-actions-product?store=8080&option=700000001_BLU');
  });

  it('defaults the worklist segment to selling life and rejects unknown values', () => {
    expect(parseSegment(null)).toBe('selling');
    expect(parseSegment('nope')).toBe('selling');
    expect(parseSegment('exit')).toBe('exit');
    expect(parseSegment('checkpoint')).toBe('checkpoint');
    expect(parseSegment('all')).toBe('all');
  });

  it('maps segments to the cohort list sent to the backend', () => {
    expect(segmentCohorts('selling')).toEqual(['under_min', 'building', 'checkpoint', 'review', 'exit_window']);
    expect(segmentCohorts('exit')).toEqual(['exit']);
    expect(segmentCohorts('all')).toBeUndefined();
  });

  it('redirects the retired tab routes into the workspace', () => {
    expect(legacyHref('health', {})).toBe('/style-actions-product?panel=health');
    expect(legacyHref('options', { store: '8080', cohort: 'building' })).toBe('/style-actions-product?store=8080&seg=building');
    expect(legacyHref('option', { store: '8080', option: '700000001_BLU' })).toBe('/style-actions-product?store=8080&option=700000001_BLU');
    expect(legacyHref('lifecycle', { store: '5943' })).toBe('/style-actions-product?store=5943');
  });

  it('explains the effect of every finding code the backend emits', () => {
    Object.keys(FINDING_LABEL).forEach((code) => expect(FINDING_META[code]).toBeDefined());
    expect(findingEffect('BLANK_OPTION')).toBe('excluded');
    expect(findingEffect('NEGATIVE_STOCK')).toBe('adjusted');
    expect(findingEffect('NO_FIRST_GRN')).toBe('no_gap');
    expect(findingEffect('SOMETHING_NEW')).toBe('context');
  });

  it('explains a store without data as context only', () => {
    expect(FINDING_LABEL.STORE_WITHOUT_DATA).toBe('Store without data');
    expect(findingEffect('STORE_WITHOUT_DATA')).toBe('context');
    expect(FINDING_META.STORE_WITHOUT_DATA?.meaning).toMatch(/^No stock on the as-of date and no sales in the sales window/);
  });
});

describe('findingCountRows', () => {
  it('ranks by count, then by effect on the numbers, then by code', () => {
    const rows = findingCountRows({
      SALES_WITHOUT_STOCK_ROW: 1,
      INWARD_MISMATCH: 1,
      UNMAPPED_GRADE: 1,
      NO_FIRST_GRN: 1,
      SALES_WINDOW_SHORT: 1,
      NEGATIVE_STOCK: 1,
      BLANK_OPTION: 1,
      NO_PLANOGRAM: 3,
    });
    expect(rows.map((row) => row.code)).toEqual([
      'NO_PLANOGRAM',
      'BLANK_OPTION',
      'NEGATIVE_STOCK',
      'SALES_WINDOW_SHORT',
      'NO_FIRST_GRN',
      'UNMAPPED_GRADE',
      'INWARD_MISMATCH',
      'SALES_WITHOUT_STOCK_ROW',
    ]);
  });

  it('leaves out codes without findings and returns nothing for an empty object', () => {
    expect(findingCountRows({ NEGATIVE_STOCK: 0, BLANK_OPTION: 2 })).toEqual([{ code: 'BLANK_OPTION', count: 2 }]);
    expect(findingCountRows({})).toEqual([]);
  });
});

describe('buildErrorText', () => {
  const tooLarge = (message: string, detail: unknown): StyleActionsApiError =>
    new StyleActionsApiError(422, { code: 'scope_too_large', message, detail });

  it('shows the server message when a scope is too large', () => {
    const text = buildErrorText(tooLarge('Scope resolves to 465 stores; the limit is 300 (SA_MAX_STORES_PER_SNAPSHOT)', { limit: 300, store_count: 465 }));
    expect(text.title).toBe('Snapshot not started: the scope is too large');
    expect(text.message).toBe('Scope resolves to 465 stores; the limit is 300 (SA_MAX_STORES_PER_SNAPSHOT)');
  });

  it('states the count and limit from the detail when the server sends no message', () => {
    expect(buildErrorText(tooLarge('', { limit: 300, store_count: 465 })).message).toBe('Scope has 465 stores; the limit is 300');
  });

  it('falls back to a generic sentence when the detail is malformed', () => {
    expect(buildErrorText(tooLarge('', { limit: 'x' })).message).toBe('The scope has more stores than one snapshot may hold.');
    expect(buildErrorText(tooLarge('', null)).message).toBe('The scope has more stores than one snapshot may hold.');
  });

  it('names any other backend refusal with its code', () => {
    const text = buildErrorText(new StyleActionsApiError(409, { code: 'build_running', message: 'A snapshot is already building' }));
    expect(text.title).toBe('Snapshot not started');
    expect(text.message).toBe('A snapshot is already building (build_running)');
  });

  it('reports an unreachable backend', () => {
    expect(buildErrorText(new TypeError('Failed to fetch')).message).toBe('The Style Actions backend could not be reached.');
  });
});
