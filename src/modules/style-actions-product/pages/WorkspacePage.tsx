import { useEffect } from 'react';

import { EmptyState } from '@/components/ui';
import { CompactButton as Button } from '../components/CompactButton';

import { useDcs, useHealth, useStores } from '../api/queries';
import { AttentionPanels } from '../components/AttentionPanels';
import { BrickMatrix } from '../components/BrickMatrix';
import { ContentStatus } from '../components/ContentStatus';
import { DcUnavailable } from '../components/DcUnavailable';
import { HealthDrawer } from '../components/HealthDrawer';
import { HealthStrip } from '../components/HealthStrip';
import { OptionDrawer } from '../components/OptionDrawer';
import { ErrorBlock, LoadingBlock } from '../components/QueryStates';
import { DcPicker, ScopeBreadcrumb, ScopeHeader, SnapshotPicker, StorePicker } from '../components/ScopeHeader';
import { SnapshotNotice } from '../components/SnapshotNotice';
import { StoreStrip } from '../components/StoreStrip';
import { useActiveSnapshot } from '../components/useActiveSnapshot';
import { useWorkspaceParams } from '../components/useWorkspaceParams';
import { EngineActions } from '../components/engine/EngineActions';
import { StoreJourney } from '../components/journey/StoreJourney';
import { Worklist } from '../components/Worklist';
import { DEFAULT_SORT, formatDay } from '../components/display';
import { dcOverviewHref, resolveDc, storesOfDc } from '../components/scope';
import { chooseStoreCode } from '../components/storeCoverage';
import { useScopeStore } from '../stores/useScopeStore';

import type { BandFilter, Comparison, OptionSort, Snapshot, StoreSummary } from '../api/types';
import type { Segment } from '../components/display';
import type { CellFilter, WorkspaceParams } from '../components/useWorkspaceParams';

/** Store-level empty states keep their sentence to a readable measure. */
const STORE_EMPTY_CLASS = 'mx-auto max-w-lg';

interface StoreBodyProps {
  readonly snapshot: Snapshot;
  readonly store: StoreSummary;
  readonly comparison: Comparison | null;
  readonly params: WorkspaceParams;
}

function StoreBody({ snapshot, store, comparison, params }: StoreBodyProps): React.ReactNode {
  const { update } = params;
  const handleSegment = (segment: Segment): void => update({ seg: segment === 'selling' ? null : segment });
  const handleCell = (cell: CellFilter, band?: BandFilter): void =>
    update({ segment: cell.segment, brick: cell.brick, grade: cell.grade, seg: 'all', band: band ?? null });
  const handleBand = (band: BandFilter): void => update({ band: params.bands.length === 1 && params.bands[0] === band ? null : band });
  const contentParts = snapshot.content_parts;
  const handleSeeAll = (segment: Segment, sort: OptionSort): void =>
    update({ seg: segment === 'selling' ? null : segment, sort: sort === DEFAULT_SORT ? null : sort, segment: null, brick: null, grade: null });
  return (
    <>
      <StoreStrip
        snapshotId={snapshot.snapshot_id}
        store={store}
        comparison={comparison}
        segment={params.segment}
        onSegment={handleSegment}
        onOpenGaps={() => update({ panel: 'health', scope: 'store', code: null })}
        bands={contentParts.health ? params.bands : []}
        onBand={handleBand}
      />
      {/* The matrix leads (S2-C27); the Scope 1a band sits beside it from 1024 px and below it on smaller screens (S2-C39, S2-C40). */}
      <div className="grid min-w-0 grid-cols-1 items-start gap-3 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <BrickMatrix
            snapshotId={snapshot.snapshot_id}
            storeCode={store.store_code}
            cell={params.cell}
            onCell={handleCell}
            lens={params.lens}
            onLens={(lens) => update({ lens: lens === 'scope1' ? null : lens })}
            contentParts={contentParts}
            query={params.matrixQuery}
            page={params.matrixPage}
            onQuery={(bq) => update({ bq: bq || null, bpage: null })}
            onPage={(page) => update({ bpage: page > 1 ? String(page) : '1' })}
          />
        </div>
        <div className="min-w-0 lg:col-span-4">
          <AttentionPanels
            snapshot={snapshot}
            store={store}
            onOpenOption={(option) => update({ option })}
            onOpenFinding={(code) => update({ panel: 'health', code, scope: 'store' })}
            onOpenHealth={() => update({ panel: 'health', scope: 'store', code: null })}
            onSeeAll={handleSeeAll}
          />
        </div>
      </div>
      <Worklist
        snapshotId={snapshot.snapshot_id}
        storeCode={store.store_code}
        segment={params.segment}
        q={params.q}
        sort={params.sort}
        page={params.page}
        selected={params.option}
        cell={params.cell}
        onClearCell={() => update({ segment: null, brick: null, grade: null })}
        hasHealth={contentParts.health}
        bands={params.bands}
        onClearBands={() => update({ band: null })}
        onSegment={handleSegment}
        onSearch={(q) => update({ q })}
        onSort={(sort: OptionSort) => update({ sort: sort === DEFAULT_SORT ? null : sort })}
        onPage={(page) => update({ page: page > 1 ? String(page) : null })}
        onOpen={(option) => update({ option })}
      />
      <OptionDrawer snapshotId={snapshot.snapshot_id} storeCode={store.store_code} optionCode={params.option} onClose={() => update({ option: null })} />
    </>
  );
}

interface StoreUnavailableProps {
  readonly snapshot: Snapshot;
  readonly dcCode: string;
  readonly storeCode: string | null;
  readonly store: StoreSummary | null;
  readonly onOpenStoreHealth: () => void;
}

/** A store outside the snapshot, a DC without stores, or a store with no stock or sales (Scope 1a R3). */
function StoreUnavailable({ snapshot, dcCode, storeCode, store, onOpenStoreHealth }: StoreUnavailableProps): React.ReactNode {
  if (store) {
    return (
      <div data-testid="store-without-data">
        <EmptyState
          className={STORE_EMPTY_CLASS}
          title={`Store ${store.store_code} has no stock or sales in this snapshot`}
          description={`The snapshot has no stock rows for ${store.name} on ${formatDay(snapshot.as_of)} and no sales rows in the sales window, though the store master lists it as active. Data health records it as a finding, and the store selector hides stores like it by default.`}
          action={
            <Button size="sm" data-testid="store-without-data-health" onClick={onOpenStoreHealth} className="min-h-11 md:min-h-0">
              Open Data health
            </Button>
          }
        />
      </div>
    );
  }
  if (storeCode) {
    return <EmptyState className={STORE_EMPTY_CLASS} title={`Store ${storeCode} is not in this snapshot`} description={`Choose a store served by Distribution Centre ${dcCode} from the store selector.`} />;
  }
  return <EmptyState className={STORE_EMPTY_CLASS} title={`Distribution Centre ${dcCode} lists no stores in this snapshot`} description="No active store is served by this Distribution Centre. Data health shows the snapshot's scope." />;
}

/** Style Actions store workspace: positions lead to bricks, options and evidence; detailed analysis stays available. */
export default function WorkspacePage(): React.ReactNode {
  const params = useWorkspaceParams();
  const active = useActiveSnapshot(params.snap);
  const health = useHealth();
  const savedStore = useScopeStore((s) => s.storeCode);
  const setStore = useScopeStore((s) => s.setStore);
  const setSnapshot = useScopeStore((s) => s.setSnapshot);
  const snapshotId = active.snapshot?.snapshot_id ?? null;
  const dcs = useDcs(snapshotId);
  const stores = useStores(snapshotId);
  const allStores = stores.data?.items ?? [];
  const dcChoice =
    dcs.data && stores.data ? resolveDc({ dcs: dcs.data.items, stores: allStores, urlDc: params.dcParam, urlStore: params.storeParam, savedStore }) : null;
  const dcCode = dcChoice?.dcCode ?? null;
  const isDcInSnapshot = Boolean(dcChoice?.isInSnapshot);
  const dcStores = storesOfDc(allStores, dcCode);
  const storeCode = isDcInSnapshot
    ? chooseStoreCode({ stores: dcStores, urlStore: params.storeParam, savedStore, focusStores: active.snapshot?.focus_stores ?? [] })
    : params.storeParam;
  const store = allStores.find((item) => item.store_code === storeCode) ?? null;
  const rememberStore = store?.has_data ? store.store_code : null;

  useEffect(() => {
    // Remember the last store with data so the next visit opens on it (ruling C1).
    if (rememberStore) setStore(rememberStore);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setStore is a stable Zustand action
  }, [rememberStore]);

  const { fill } = params;
  useEffect(() => {
    // The URL carries snap, dc and store so the view can be linked and reloaded (S2-R1); only missing ones are written.
    if (snapshotId) fill({ snap: snapshotId, dc: dcCode, store: storeCode });
  }, [snapshotId, dcCode, storeCode, fill]);

  const handlePickSnapshot = (id: string): void => {
    // Choosing the latest snapshot means "latest": later builds open on their own (S2-R3 default).
    setSnapshot(id === active.ready[0]?.snapshot_id ? null : id);
    params.update({ snap: id, option: null, ebrick: null, eq: null, estatus: null, epage: null, jage: null, jprice: null, jdirection: null, jpage: null });
  };
  const handleOpenLatest = (id: string): void => {
    setSnapshot(null);
    params.update({ snap: id, option: null, ebrick: null, eq: null, estatus: null, epage: null, jage: null, jprice: null, jdirection: null, jpage: null });
  };
  const handlePickDc = (code: string): void =>
    params.update({ dc: code, store: null, ebrick: null, eq: null, estatus: null, epage: null, jbrick: null, jage: null, jprice: null, jdirection: null, jq: null, jfocus: null, jpage: null, seg: null, q: null, option: null, segment: null, brick: null, grade: null, ranking: null });
  const handlePickStore = (code: string): void => params.update({ store: code, ebrick: null, eq: null, estatus: null, epage: null, jbrick: null, jage: null, jprice: null, jdirection: null, jq: null, jfocus: null, jpage: null, seg: null, q: null, option: null, segment: null, brick: null, grade: null });
  const openHealth = (): void => params.update({ panel: 'health' });
  const openStoreHealth = (): void => params.update({ panel: 'health', scope: 'store', code: null });

  const { resolution } = active;
  const canExtend = Boolean(health.data?.can_build_snapshot);
  let body: React.ReactNode;
  if (active.isLoading) body = <LoadingBlock label="Loading workspace" />;
  else if (active.error || !resolution) body = <ErrorBlock error={active.error} onRetry={active.refetch} />;
  else if (resolution.kind === 'unlisted' || resolution.kind === 'failed') body = <SnapshotNotice resolution={resolution} onOpenLatest={handleOpenLatest} />;
  else if (resolution.kind === 'none') {
    body = (
      <div data-testid="no-snapshot">
        <EmptyState
          title={resolution.pendingId ? 'The first snapshot is building' : 'No snapshot yet'}
          description={resolution.pendingId ? 'Real store data appears here once it is ready.' : 'Build a snapshot from Data health to see real store data here.'}
          action={<Button size="sm" onClick={openHealth}>Open data health</Button>}
        />
      </div>
    );
  } else if (dcs.isLoading || stores.isLoading) body = <LoadingBlock label="Loading workspace" />;
  else if (dcs.error || !dcs.data) body = <ErrorBlock error={dcs.error} onRetry={() => void dcs.refetch()} />;
  else if (stores.error || !stores.data) body = <ErrorBlock error={stores.error} onRetry={() => void stores.refetch()} />;
  else if (!dcCode || !isDcInSnapshot) body = <DcUnavailable dcCode={dcCode} dcs={dcs.data.items} onPick={handlePickDc} />;
  else if (!store?.has_data) {
    body = <StoreUnavailable snapshot={resolution.snapshot} dcCode={dcCode} storeCode={storeCode} store={store} onOpenStoreHealth={openStoreHealth} />;
  } else body = params.view === 'analysis'
    ? <StoreBody snapshot={resolution.snapshot} store={store} comparison={stores.data.comparison} params={params} />
    : params.view === 'engines' ? <EngineActions snapshot={resolution.snapshot} store={store} params={params} />
    : <StoreJourney snapshot={resolution.snapshot} store={store} params={params} />;

  const dcHref = dcCode && isDcInSnapshot ? dcOverviewHref(dcCode, { snap: snapshotId, ranking: params.ranking, store: storeCode }) : null;
  const title = storeCode ? `Store · ${store?.name ?? storeCode}` : 'Store';
  const meta = store ? [store.store_code, store.city].filter(Boolean).join(' · ') : null;
  return (
    <div className="space-y-2">
      <ScopeHeader
        compact
        breadcrumb={<ScopeBreadcrumb dcHref={dcHref} dcCode={isDcInSnapshot ? dcCode : null} storeCode={storeCode} />}
        title={title}
        meta={meta}
        pickers={
          <>
            <SnapshotPicker snapshots={active.ready} current={active.snapshot} serverVersion={active.serverVersion} onPick={handlePickSnapshot} />
            {dcs.data ? <DcPicker dcs={dcs.data.items} dcCode={dcCode} onPick={handlePickDc} /> : null}
            {stores.data && isDcInSnapshot ? <StorePicker stores={dcStores} storeCode={storeCode} onPick={handlePickStore} /> : null}
          </>
        }
      />
      <HealthStrip compact snapshot={active.snapshot} onOpen={openHealth} />
      {/* One notice at a time: the drawer carries it (with Extend) while it is open (S2-R20). */}
      {active.snapshot && !params.isHealthOpen ? (
        <ContentStatus snapshot={active.snapshot} serverVersion={active.serverVersion} canExtend={canExtend} />
      ) : null}
      {store?.has_data && <nav className="flex flex-wrap items-center gap-1 border-b border-gray-200 pb-1" aria-label="Workspace view">
        <Button variant={params.view === 'journey' ? 'secondary' : 'ghost'} size="sm" aria-pressed={params.view === 'journey'} onClick={() => params.update({ view: null, option: null })}>Inventory journey</Button>
        <Button variant={params.view === 'engines' ? 'secondary' : 'ghost'} size="sm" aria-pressed={params.view === 'engines'} onClick={() => params.update({ view: 'engines', option: null })}>Engine actions</Button>
        <Button variant={params.view === 'analysis' ? 'secondary' : 'ghost'} size="sm" className="ml-auto text-xs text-gray-600" aria-pressed={params.view === 'analysis'} onClick={() => params.update({ view: 'analysis', option: null })}>Detailed analysis</Button>
      </nav>}
      {body}
      <HealthDrawer
        isOpen={params.isHealthOpen}
        onClose={() => params.update({ panel: null, code: null, scope: null })}
        snapshot={active.snapshot}
        latest={active.snapshots[0] ?? null}
        store={store}
        storeCode={storeCode}
        code={params.findingCode}
        scope={params.findingScope === 'store' ? 'store' : 'all'}
        onCode={(code) => params.update({ code })}
        onScope={(scope) => params.update({ scope: scope === 'store' ? 'store' : null, code: null })}
        onBuilt={handlePickSnapshot}
      />
    </div>
  );
}
