import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  PageHeader,
} from '@/components/ui';
import { useMediaQuery } from '@/hooks/useMediaQuery';

import { BASE_PATH, DC_LABEL, formatDay, formatUnits } from './display';
import { matchesQuery, needsExtension, snapshotMeta } from './scope';
import { noDataHint, noDataToggleLabel, storeCountText, storePickerOptions } from './storeCoverage';

import type { DcItem, Snapshot, StoreSummary } from '../api/types';

/** Breadcrumbs render from 1024 px (ux-patterns §3); below it a compact back line keeps the way up. */
const DESKTOP_QUERY = '(min-width: 1024px)';
const TRIGGER_CLASS = 'h-8 min-h-11 max-w-full gap-1.5 px-2.5 text-xs font-normal md:min-h-0';
const CRUMB_LINK_CLASS = 'rounded-lg underline-offset-4 hover:text-gray-900 hover:underline focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary/40';

interface ScopeBreadcrumbProps {
  /** The Distribution Centre crumb's link; null on the Distribution Centre overview, where it is the current page. */
  readonly dcHref: string | null;
  readonly dcCode: string | null;
  /** The store crumb on the store workspace; null on the Distribution Centre overview. */
  readonly storeCode: string | null;
}

/**
 * Style Actions › Distribution Centre S3KG › Store 8080 from 1024 px; the product name is the root crumb, never an eyebrow
 * (S2-C50, S2-C52). Below 1024 px: "Style Actions · ‹ Distribution Centre S3KG". The Distribution Centre link keeps the
 * snapshot, the ranking and the row (S2-R1); its test id holds only the code.
 */
export function ScopeBreadcrumb({ dcHref, dcCode, storeCode }: ScopeBreadcrumbProps): React.ReactNode {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const root = (
    <Link to={BASE_PATH} data-testid="breadcrumb-root" className={CRUMB_LINK_CLASS}>
      Style Actions
    </Link>
  );
  const dcLink =
    dcHref && dcCode ? (
      <Link to={dcHref} className={CRUMB_LINK_CLASS} aria-label={isDesktop ? undefined : `Back to ${DC_LABEL} ${dcCode}`}>
        {isDesktop ? null : <ChevronLeft className="mr-0.5 inline size-3.5 align-[-2px]" aria-hidden />}
        {DC_LABEL} <span data-testid="breadcrumb-dc">{dcCode}</span>
      </Link>
    ) : null;
  if (!isDesktop) {
    return (
      <nav aria-label="Breadcrumb" className="flex min-h-11 min-w-0 flex-wrap items-center gap-x-1.5 text-xs font-medium text-gray-600">
        {root}
        {dcLink ? <span aria-hidden className="text-gray-400">·</span> : null}
        {dcLink}
      </nav>
    );
  }
  return (
    <nav aria-label="Breadcrumb" className="min-w-0 text-xs font-medium text-gray-600">
      <ol className="flex min-w-0 flex-wrap items-center gap-1">
        <li>{root}</li>
        {dcCode ? (
          <>
            <li aria-hidden className="text-gray-400"><ChevronRight className="size-3.5" /></li>
            <li aria-current={dcLink ? undefined : 'page'}>{dcLink ?? `${DC_LABEL} ${dcCode}`}</li>
          </>
        ) : null}
        {storeCode ? (
          <>
            <li aria-hidden className="text-gray-400"><ChevronRight className="size-3.5" /></li>
            <li aria-current="page" className="text-gray-900">Store {storeCode}</li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}

interface SnapshotPickerProps {
  /** Kept ready snapshots, newest build first. */
  readonly snapshots: readonly Snapshot[];
  /** The snapshot every request reads; null when the chosen one is unavailable. */
  readonly current: Snapshot | null;
  /** What the server computes (Health.content_version); older snapshots are marked. */
  readonly serverVersion: number | null;
  readonly onPick: (snapshotId: string) => void;
}

/**
 * The kept snapshots with as-of date, Distribution Centres, store count and build time (S2-R3). Its trigger names the
 * snapshot in use (testid snapshot-current, the as-of date) so journeys wait on this snapshot.
 */
export function SnapshotPicker({ snapshots, current, serverVersion, onPick }: SnapshotPickerProps): React.ReactNode {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-xs text-gray-500">Snapshot</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" data-testid="snapshot-picker" disabled={!snapshots.length} className={TRIGGER_CLASS} aria-label="Choose a snapshot">
            {current ? (
              <span>
                As of <span data-testid="snapshot-current" className="font-medium tabular-nums text-gray-900">{formatDay(current.as_of)}</span>
              </span>
            ) : (
              <span className="text-gray-500">No snapshot in use</span>
            )}
            <ChevronDown className="size-3.5 text-gray-500" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80 max-w-[calc(100vw-1rem)]">
          <DropdownMenuLabel className="text-xs font-medium text-gray-500">Kept snapshots, newest build first</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={current?.snapshot_id ?? ''} onValueChange={onPick}>
            {snapshots.map((item, index) => (
              <DropdownMenuRadioItem key={item.snapshot_id} value={item.snapshot_id} data-testid={`snapshot-option-${item.snapshot_id}`} className="items-start">
                <span className="min-w-0 space-y-0.5">
                  <span className="flex items-center gap-1.5 font-medium text-gray-900">
                    As of {formatDay(item.as_of)}
                    {index === 0 ? <Badge variant="outline" size="sm">Latest</Badge> : null}
                  </span>
                  <span className="block text-xs text-gray-500">{snapshotMeta(item)}</span>
                  {needsExtension(item, serverVersion) ? <span className="block text-xs text-gray-500">Health and space not yet computed</span> : null}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface DcPickerProps {
  readonly dcs: readonly DcItem[];
  readonly dcCode: string | null;
  readonly onPick: (dcCode: string) => void;
}

/** The snapshot's Distribution Centres with their store counts (S2-R1). */
export function DcPicker({ dcs, dcCode, onPick }: DcPickerProps): React.ReactNode {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-xs text-gray-500">{DC_LABEL}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" data-testid="dc-picker" disabled={!dcs.length} className={TRIGGER_CLASS} aria-label={`Choose a ${DC_LABEL}`}>
            <span className="font-medium text-gray-900">{dcCode ?? `Choose a ${DC_LABEL}`}</span>
            <ChevronDown className="size-3.5 text-gray-500" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 max-w-[calc(100vw-1rem)]">
          <DropdownMenuRadioGroup value={dcCode ?? ''} onValueChange={onPick}>
            {dcs.map((item) => (
              <DropdownMenuRadioItem key={item.dc_code} value={item.dc_code} data-testid={`dc-option-${item.dc_code}`} className="items-start">
                <span className="min-w-0">
                  <span className="block font-medium text-gray-900">
                    {item.dc_code}
                    {item.name && item.name !== `DC ${item.dc_code}` ? ` · ${item.name}` : ''}
                  </span>
                  <span className="block text-xs tabular-nums text-gray-500">
                    {formatUnits(item.stores)} {item.stores === 1 ? 'store' : 'stores'} · {formatUnits(item.stores_with_data)} with data
                  </span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface StorePickerProps {
  /** The chosen Distribution Centre's stores only (S2-R1). */
  readonly stores: readonly StoreSummary[];
  readonly storeCode: string | null;
  readonly onPick: (storeCode: string) => void;
}

/** Keeps typing in the search box out of the menu's own typeahead and arrow-key handling. */
function keepKeysInSearch(event: KeyboardEvent<HTMLInputElement>): void {
  if (event.key !== 'Escape') event.stopPropagation();
}

/**
 * The store selector on the header line (S2-C45, S2-C46): a non-modal menu, so a second click on its trigger closes it
 * and the page stays usable (S2-C56). Search at the top, the Distribution Centre's stores with equal weight, and as the
 * last item the show/hide switch for stores without data, which keeps the menu open. The count and the hint sentence
 * live inside the menu.
 */
export function StorePicker({ stores, storeCode, onPick }: StorePickerProps): React.ReactNode {
  const [isShowingWithoutData, setShowingWithoutData] = useState(false);
  const [query, setQuery] = useState('');
  const withData = stores.filter((store) => store.has_data).length;
  const without = stores.length - withData;
  const options = storePickerOptions(stores, isShowingWithoutData, storeCode).filter((option) => matchesQuery([option.label], query));
  const current = storePickerOptions(stores, true, storeCode).find((option) => option.value === storeCode);
  return (
    <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
      <span className="shrink-0 text-xs text-gray-500">Store</span>
      <DropdownMenu modal={false} onOpenChange={(isOpen) => (isOpen ? undefined : setQuery(''))}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" data-testid="store-picker" className={`${TRIGGER_CLASS} w-full min-w-0 justify-between sm:w-80 lg:w-96`} aria-label="Choose a store">
            <span className="min-w-0 truncate font-medium text-gray-900">{current?.label ?? storeCode ?? 'Choose a store'}</span>
            <ChevronDown className="size-3.5 shrink-0 text-gray-500" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[28rem] max-w-[calc(100vw-1rem)]">
          <div className="space-y-1 px-2.5 py-1.5">
            <p data-testid="store-count" className="text-xs tabular-nums text-gray-600">{storeCountText(withData, without)}</p>
            {without > 0 ? <p data-testid="store-no-data-hint" className="text-xs text-gray-500">{noDataHint(isShowingWithoutData)}</p> : null}
            <Input
              aria-label="Search stores"
              placeholder="Search stores"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={keepKeysInSearch}
              className="h-8"
            />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {options.length ? (
              <DropdownMenuRadioGroup value={storeCode ?? ''} onValueChange={onPick}>
                {options.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value} data-testid={`store-option-${option.value}`} className="items-start">
                    <span className="min-w-0 break-words text-left">{option.label}</span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            ) : (
              <p className="px-2.5 py-2 text-xs text-gray-500">No store matches "{query}".</p>
            )}
          </div>
          {without > 0 ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-testid="store-no-data-toggle"
                onSelect={(event) => {
                  event.preventDefault();
                  setShowingWithoutData((isShown) => !isShown);
                }}
                className="text-xs font-medium text-gray-700"
              >
                {noDataToggleLabel(without, isShowingWithoutData)}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface ScopeHeaderProps {
  readonly compact?: boolean;
  readonly breadcrumb: React.ReactNode;
  /** "Store · {name}" or "Distribution Centre · {name or code}" (S2-C50). */
  readonly title: string;
  /** Neutral facts beside the title: code · city, or the store count. */
  readonly meta?: string | null;
  readonly pickers: React.ReactNode;
}

/**
 * The module's header under the app shell's top bar (R21): the breadcrumb with the product as its root, the page title
 * (PageHeader), then one line of snapshot, Distribution Centre and store pickers. Both pages use the same rows, so their
 * main sections start at the same height.
 */
export function ScopeHeader({ breadcrumb, title, meta, pickers, compact = false }: ScopeHeaderProps): React.ReactNode {
  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <div className="space-y-0.5">
        {breadcrumb}
        <PageHeader
          className={compact ? '[&_h1]:text-xl [&_h1]:leading-6 [&_h1]:font-semibold' : undefined}
          title={<span data-testid="page-title">{title}</span>}
          badges={meta ? <Badge variant="outline" size="sm" className="whitespace-nowrap">{meta}</Badge> : undefined}
        />
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">{pickers}</div>
    </div>
  );
}
