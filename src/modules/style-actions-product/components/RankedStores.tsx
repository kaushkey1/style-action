import { useEffect, useRef } from 'react';

import { Badge, Button, EmptyState, ToggleGroup, ToggleGroupItem } from '@/components/ui';
import { cn } from '@/lib/utils';

import { formatUnits } from './display';
import { Pager } from './ListControls';
import { RANKING_LABEL, RANKING_UNIT, matchesQuery, pageSlice, rankingFigure } from './scope';

import type { DcRanking, StoreSummary } from '../api/types';

/** Stores per page: a Distribution Centre holds up to about 224 stores on real data (S2-C44). */
const STORES_PAGE_SIZE = 25;
const PERCENT = 100;

interface RankingSwitchProps {
  readonly ranking: DcRanking;
  /** Rankings the snapshot can answer; Most Under and Worst fill join with health and space. */
  readonly rankings: readonly DcRanking[];
  readonly onRanking: (ranking: DcRanking) => void;
}

export function RankingSwitch({ ranking, rankings, onRanking }: RankingSwitchProps): React.ReactNode {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <ToggleGroup value={ranking} onValueChange={(value) => onRanking(rankings.find((item) => item === value) ?? ranking)} aria-label="Rank stores by" className="max-w-full flex-wrap">
        {rankings.map((item) => (
          <ToggleGroupItem key={item} value={item} data-testid={`dc-ranking-${item}`} className="h-7 min-h-11 whitespace-nowrap px-2 text-xs md:min-h-0">
            {RANKING_LABEL[item]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-xs text-gray-500" aria-live="polite">
        Ranked by <span data-testid="dc-ranking-current" className="font-medium text-gray-900">{RANKING_LABEL[ranking]}</span>
      </p>
    </div>
  );
}

interface RankedStoresProps {
  readonly stores: readonly StoreSummary[];
  readonly ranking: DcRanking;
  readonly selected: string | null;
  /** True while the next ranking loads; the previous order stays on screen. */
  readonly isUpdating: boolean;
  /** On desktop a row selects the store for the preview; below 1024 px it opens the store. */
  readonly isPreviewing: boolean;
  readonly onSelect: (storeCode: string) => void;
  readonly onOpen: (storeCode: string) => void;
  /** Search over code, name and city, and the explicit page (URL `sq`, `spage`; S2-C44, S2-C46). */
  readonly query: string;
  readonly page: number | null;
  /** Clears the search from the empty state; the search box itself sits in the section's control row. */
  readonly onQuery: (query: string) => void;
  readonly onPage: (page: number) => void;
  /** True when the URL named the store (a return by the breadcrumb): scroll its row into view once. */
  readonly shouldScrollToSelected: boolean;
}

/** The Distribution Centre's stores in the backend's ranked order, one figure and a bar scaled to the highest per row (S2-R2). */
export function RankedStores(props: RankedStoresProps): React.ReactNode {
  const { stores, ranking, selected, isUpdating, isPreviewing, onSelect, onOpen, query, page, onQuery, onPage, shouldScrollToSelected } = props;
  const matching = stores.filter((item) => matchesQuery([item.store_code, item.name, item.city], query));
  const selectedIndex = matching.findIndex((item) => item.store_code === selected);
  const slice = pageSlice(matching, STORES_PAGE_SIZE, page, selectedIndex);
  const selectedRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    // Mount only: returning from a store by the breadcrumb lands on the row it came from (S2-R1). A default
    // selection (the first store) never scrolls the page.
    if (shouldScrollToSelected) selectedRef.current?.scrollIntoView?.({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: scroll once to the row named in the URL
  }, []);
  const max = Math.max(0, ...stores.map((item) => rankingFigure(item, ranking) ?? 0));
  return (
    <div aria-busy={isUpdating} className={cn('min-w-0 space-y-2 transition-opacity', isUpdating && 'opacity-60')}>
      {query ? (
        <p className="text-xs tabular-nums text-gray-500">
          Showing {formatUnits(matching.length)} of {formatUnits(stores.length)} stores
        </p>
      ) : null}
      {matching.length ? (
        <>
        <p className="flex justify-end px-2 text-xs text-gray-500" aria-hidden>
          {RANKING_UNIT[ranking].charAt(0).toUpperCase() + RANKING_UNIT[ranking].slice(1)}
        </p>
        <ol className="divide-y divide-gray-100" aria-label={`Stores ranked by ${RANKING_LABEL[ranking]}`}>
          {slice.items.map((item) => {
            const figure = rankingFigure(item, ranking);
            const share = max > 0 && figure !== null ? (figure / max) * PERCENT : 0;
            const isSelected = isPreviewing && item.store_code === selected;
            const rank = stores.indexOf(item) + 1;
            return (
              <li key={item.store_code} ref={item.store_code === selected ? selectedRef : undefined}>
                <Button
                  variant="ghost"
                  data-testid={`dc-store-row-${item.store_code}`}
                  aria-pressed={isPreviewing ? isSelected : undefined}
                  aria-label={`${rank}. ${item.store_code} ${item.name}: ${formatUnits(figure)} ${RANKING_UNIT[ranking]}${item.has_data ? '' : ', no data'}${isPreviewing ? '' : ', open the store'}`}
                  onClick={() => (isPreviewing ? onSelect(item.store_code) : onOpen(item.store_code))}
                  className={cn('h-auto min-h-11 w-full justify-start gap-3 rounded-none px-2 py-2 text-left font-normal', isSelected && 'bg-primary/10 hover:bg-primary/10')}
                >
                  <span className="w-6 shrink-0 text-right text-xs tabular-nums text-gray-500">{rank}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-gray-900">{item.store_code} · {item.name}</span>
                      {item.has_data ? null : <Badge variant="outline" size="sm" className="whitespace-nowrap">no data</Badge>}
                    </span>
                    <span className="block truncate text-xs tabular-nums text-gray-500">
                      {[item.city, `${formatUnits(item.saleable_units)} on shelf`, `${formatUnits(item.sales_14d_units)} sold in 14 days`].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="hidden w-24 shrink-0 sm:block" aria-hidden>
                    <span className="relative block h-1.5 rounded-full bg-gray-100">
                      {/* eslint-disable-next-line no-restricted-syntax -- bar length is this store's figure against the highest */}
                      <span className="absolute inset-y-0 left-0 rounded-full bg-gray-500" style={{ width: `${share}%` }} />
                    </span>
                  </span>
                  <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums text-gray-900">{formatUnits(figure)}</span>
                </Button>
              </li>
            );
          })}
        </ol>
        </>
      ) : (
        <EmptyState
          title={`No store matches "${query}"`}
          description="Search looks at store code, name and city."
          action={
            <Button variant="outline" size="sm" data-testid="dc-stores-clear-search" onClick={() => onQuery('')} className="min-h-11 md:min-h-0">
              Clear search
            </Button>
          }
        />
      )}
      <Pager page={slice.page} pages={slice.pages} onPage={onPage} testid="dc-stores-pager" />
    </div>
  );
}
