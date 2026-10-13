import { useCallback, useLayoutEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import { DEFAULT_SORT, GRADE_CLASSES, OPTION_SORTS, parseBands, parseSegment } from './display';
import { AGE_STAGES, PRICE_STAGES, DIRECTIONS, type StageFilters } from './journey/inventoryBreakdown';
import type { EngineActionGroup } from './engine/storeEngineData';
import { parseRanking } from './scope';
import { parsePosition, type InventoryPosition } from './journey/inventoryJourney';

import type { BandFilter, DcRanking, GradeClass, OptionSort } from '../api/types';
import type { Segment, WorkspaceParam } from './display';

/** The worklist filter set by a brick matrix cell (URL `segment`, `brick`, `grade`). */
export interface CellFilter {
  segment: string | null;
  brick: string;
  grade: GradeClass | null;
}

export type FindingScope = 'store' | 'dc' | 'all';

/** Brick matrix lens (URL `lens`): Scope 1 on every snapshot; bands and space when the snapshot holds them. */
export type MatrixLens = 'scope1' | 'bands' | 'space';

function parseLens(value: string | null): MatrixLens {
  return value === 'bands' || value === 'space' ? value : 'scope1';
}

/** Page numbers read from the URL stay within 1..10000, the contract's Page maximum (0.3.4, S2-C66 L1). */
export const MAX_PAGE = 10000;

/** An explicit page from the URL, clamped to 1..MAX_PAGE; null when absent or not a whole number. */
export function parsePage(value: string | null): number | null {
  if (value === null || value.trim() === '') return null;
  const page = Number(value);
  if (!Number.isInteger(page)) return null;
  return Math.min(MAX_PAGE, Math.max(1, page));
}

export interface WorkspaceParams {
  view: 'journey' | 'analysis' | 'engines';
  engineAction: EngineActionGroup;
  engineType: string | null;
  engineBrick: string | null;
  engineQuery: string;
  engineStatus: string | null;
  engineOutcome: string | null;
  enginePage: number;
  engineView: 'bricks' | 'options';
  position: InventoryPosition;
  journeyBrick: string | null;
  journeyView: 'bricks' | 'options';
  journeyQuery: string;
  journeyFocus: 'all' | 'attention' | 'aged';
  journeyPage: number;
  journeySalesWindow: 'life' | 'recent';
  journeyStages: StageFilters;
  snap: string | null;
  dcParam: string | null;
  storeParam: string | null;
  /** The DC overview ranking the store was opened from; the breadcrumb returns to it. */
  ranking: DcRanking;
  cell: CellFilter | null;
  /** Worklist band filter (URL `band`, comma list). */
  bands: BandFilter[];
  lens: MatrixLens;
  /** Brick matrix search and explicit page (URL `bq`, `bpage`); DC ranked stores (URL `sq`, `spage`). */
  matrixQuery: string;
  matrixPage: number | null;
  storesQuery: string;
  storesPage: number | null;
  segment: Segment;
  q: string;
  sort: OptionSort;
  page: number;
  option: string | null;
  isHealthOpen: boolean;
  findingCode: string | null;
  findingScope: FindingScope;
  /** Set or clear parameters; any change other than `page` or a drawer resets paging. */
  update: (changes: Partial<Record<WorkspaceParam, string | null>>) => void;
  /** Write resolved scope parameters (snap, dc, store) that the URL lacks, without resetting paging. */
  fill: (changes: Partial<Record<WorkspaceParam, string | null>>) => void;
}

const KEEPS_PAGE: readonly WorkspaceParam[] = ['page', 'option', 'panel', 'code', 'scope', 'lens', 'bq', 'bpage', 'sq', 'spage'];

function parseScope(value: string | null): FindingScope {
  if (value === 'store' || value === 'dc') return value;
  return 'all';
}

function parseCell(params: URLSearchParams): CellFilter | null {
  const brick = params.get('brick');
  if (!brick) return null;
  const grade = params.get('grade');
  return { segment: params.get('segment'), brick, grade: GRADE_CLASSES.find((item) => item === grade) ?? null };
}

/** The workspace's view state lives in the URL so every store, segment, option and drawer can be linked. */
export function useWorkspaceParams(): WorkspaceParams {
  const [params, setParams] = useSearchParams();
  const sortParam = params.get('sort');
  // The router hands functional updates the search params of the last render, so two changes in one tick (a ranking
  // click, then a row click before the re-render) would drop the first. Each change builds on the latest one instead
  // (S2-C43). `pending` lists URLs written but not yet rendered, in order: a render of an older one (a navigation that
  // commits after a newer change was issued) never moves `latest` back, so the newer change is kept (S2-C53).
  const latest = useRef(params);
  const pending = useRef<string[]>([]);
  useLayoutEffect(() => {
    const rendered = params.toString();
    const index = pending.current.indexOf(rendered);
    if (index === -1) {
      // Initial render or a navigation from elsewhere (a link, the back button): it is the newest state.
      pending.current = [];
      latest.current = params;
      return;
    }
    pending.current = pending.current.slice(index + 1);
    if (!pending.current.length) latest.current = params;
  }, [params]);
  const write = useCallback(
    (build: (current: URLSearchParams) => URLSearchParams) => {
      const current = latest.current;
      const next = build(new URLSearchParams(current));
      // Nothing changed: no navigation, so an unchanged write can never replay an older URL.
      if (next.toString() === current.toString()) return;
      latest.current = next;
      pending.current = [...pending.current, next.toString()];
      setParams(next, { replace: true });
    },
    [setParams],
  );
  const update = useCallback(
    (changes: Partial<Record<WorkspaceParam, string | null>>) => {
      write((next) => {
        const keys = Object.keys(changes) as WorkspaceParam[];
        keys.forEach((key) => {
          const value = changes[key];
          if (value) next.set(key, value);
          else next.delete(key);
        });
        if (keys.some((key) => !KEEPS_PAGE.includes(key))) next.delete('page');
        return next;
      });
    },
    [write],
  );
  const fill = useCallback(
    (changes: Partial<Record<WorkspaceParam, string | null>>) => {
      const isMissing = Object.entries(changes).some(([key, value]) => Boolean(value) && !latest.current.has(key));
      if (!isMissing) return;
      write((next) => {
        Object.entries(changes).forEach(([key, value]) => {
          if (value && !next.has(key)) next.set(key, value);
        });
        return next;
      });
    },
    [write],
  );
  return {
    view: params.get('view') === 'engines' ? 'engines' : params.get('view') === 'analysis' ? 'analysis' : 'journey',
    engineAction: (['movement', 'price', 'decisions', 'other'] as const).find(value => value === params.get('eaction')) ?? 'all',
    engineType: params.get('eengine'),
    engineBrick: params.get('ebrick'),
    engineQuery: params.get('eq') ?? '',
    engineStatus: params.get('estatus'),
    engineOutcome: params.get('eoutcome'),
    enginePage: parsePage(params.get('epage')) ?? 1,
    engineView: params.get('eview') === 'options' ? 'options' : 'bricks',
    position: parsePosition(params.get('position')),
    journeyBrick: params.get('jbrick'),
    journeyView: params.get('jview') === 'options' ? 'options' : 'bricks',
    journeyQuery: params.get('jq') ?? '',
    journeyFocus: params.get('jfocus') === 'attention' ? 'attention' : params.get('jfocus') === 'aged' ? 'aged' : 'all',
    journeyPage: parsePage(params.get('jpage')) ?? 1,
    journeySalesWindow: params.get('jperiod') === 'recent' ? 'recent' : 'life',
    journeyStages: parsePosition(params.get('position')) === 'transit' ? { direction: DIRECTIONS.find((stage) => stage.key === params.get('jdirection'))?.key } : { age: AGE_STAGES.find((stage) => stage.key === params.get('jage'))?.key, price: PRICE_STAGES.find((stage) => stage.key === params.get('jprice'))?.key },
    snap: params.get('snap'),
    dcParam: params.get('dc'),
    storeParam: params.get('store'),
    ranking: parseRanking(params.get('ranking')),
    cell: parseCell(params),
    bands: parseBands(params.get('band')),
    lens: parseLens(params.get('lens')),
    matrixQuery: params.get('bq') ?? '',
    matrixPage: parsePage(params.get('bpage')),
    storesQuery: params.get('sq') ?? '',
    storesPage: parsePage(params.get('spage')),
    segment: parseSegment(params.get('seg')),
    q: params.get('q') ?? '',
    sort: OPTION_SORTS.find((item) => item === sortParam) ?? DEFAULT_SORT,
    page: parsePage(params.get('page')) ?? 1,
    option: params.get('option'),
    isHealthOpen: params.get('panel') === 'health',
    findingCode: params.get('code'),
    findingScope: parseScope(params.get('scope')),
    update,
    fill,
  };
}
