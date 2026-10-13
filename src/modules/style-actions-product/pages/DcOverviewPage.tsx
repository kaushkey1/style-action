import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { useMediaQuery } from '@/hooks/useMediaQuery';

import { StyleActionsApiError } from '../api/client';
import { useDcSummary, useDcs, useHealth } from '../api/queries';
import { ContentStatus } from '../components/ContentStatus';
import { DcStockSection } from '../components/DcStockSection';
import { DcTotalsStrip } from '../components/DcTotalsStrip';
import { DcUnavailable } from '../components/DcUnavailable';
import { HealthDrawer } from '../components/HealthDrawer';
import { HealthStrip } from '../components/HealthStrip';
import { ListSearch } from '../components/ListControls';
import { ErrorBlock, LoadingBlock } from '../components/QueryStates';
import { RankedStores, RankingSwitch } from '../components/RankedStores';
import { StorePreview } from '../components/StorePreview';
import { DcPicker, ScopeBreadcrumb, ScopeHeader, SnapshotPicker } from '../components/ScopeHeader';
import { SnapshotNotice } from '../components/SnapshotNotice';
import { useActiveSnapshot } from '../components/useActiveSnapshot';
import { useWorkspaceParams } from '../components/useWorkspaceParams';
import { DC_LABEL, formatUnits, workspaceHref } from '../components/display';
import { availableRankings, dcOverviewHref, dcTitle, storeLinkParams } from '../components/scope';
import { useScopeStore } from '../stores/useScopeStore';

import type { DcRanking, DcSummary, Snapshot } from '../api/types';
import type { OpenStoreAt } from '../components/StorePreview';
import type { WorkspaceParams } from '../components/useWorkspaceParams';

/** The store preview sits beside the ranked list from 1024 px; below it a row opens the store. */
const PREVIEW_QUERY = '(min-width: 1024px)';

function SummarySkeleton(): React.ReactNode {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading Distribution Centre overview">
      <Skeleton className="h-36 w-full" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <Skeleton className="h-80 w-full lg:col-span-7" />
        <Skeleton className="hidden h-80 w-full lg:col-span-5 lg:block" />
      </div>
    </div>
  );
}

interface DcBodyProps {
  readonly snapshot: Snapshot;
  readonly summary: DcSummary;
  readonly isUpdating: boolean;
  readonly params: WorkspaceParams;
  /** The ranking the summary was read with (the URL's, unless the snapshot cannot answer it). */
  readonly ranking: DcRanking;
  readonly onOpenStore: OpenStoreAt;
}

/** Totals, then the ranked stores beside the selected store's preview, then the DC's own stock (S2-C27, dc-preview). */
function DcBody({ snapshot, summary, isUpdating, params, ranking, onOpenStore }: DcBodyProps): React.ReactNode {
  const isPreviewing = useMediaQuery(PREVIEW_QUERY);
  // The selection lives in local state as well as the URL, so the preview changes in the same render as the click (S2-C43).
  const [picked, setPicked] = useState<string | null>(null);
  const selectedCode = picked ?? params.storeParam;
  const selected = summary.stores.find((item) => item.store_code === selectedCode) ?? summary.stores[0] ?? null;
  const handleSelect = (code: string): void => {
    setPicked(code);
    params.update({ store: code });
  };
  const handleRanking = (next: DcRanking): void => params.update({ ranking: next === 'units_short' ? null : next, spage: null });
  return (
    <>
      <DcTotalsStrip summary={summary} onOpenHealth={() => params.update({ panel: 'health', scope: 'dc', code: null })} />
      {summary.totals.stores === 0 ? (
        <EmptyState title={`Distribution Centre ${summary.dc_code} has no stores in this snapshot`} description="No active store is served by this Distribution Centre. Data health shows the snapshot's scope." />
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-12">
          <Card className="min-w-0 space-y-2 p-3 lg:col-span-7">
            <div className="min-w-0 space-y-2">
              {/* Five ranking tabs leave no room beside them, so the store search takes the heading's right slot (S2-C64). */}
              <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Stores needing attention</h2>
                <ListSearch value={params.storesQuery} onSearch={(sq) => params.update({ sq: sq || null, spage: null })} placeholder="Search stores" testid="dc-stores-search" />
              </div>
              <RankingSwitch ranking={ranking} rankings={availableRankings(snapshot.content_parts)} onRanking={handleRanking} />
            </div>
            <RankedStores
              stores={summary.stores}
              ranking={ranking}
              selected={selected?.store_code ?? null}
              isUpdating={isUpdating}
              isPreviewing={isPreviewing}
              onSelect={handleSelect}
              onOpen={(code) => onOpenStore(code)}
              query={params.storesQuery}
              page={params.storesPage}
              onQuery={(sq) => params.update({ sq: sq || null, spage: null })}
              onPage={(page) => params.update({ spage: String(page) })}
              shouldScrollToSelected={Boolean(params.storeParam)}
            />
          </Card>
          {isPreviewing ? (
            <div className="lg:sticky lg:top-3 lg:col-span-5">
              <StorePreview snapshotId={snapshot.snapshot_id} store={selected} comparison={summary.comparison} onOpen={(code) => onOpenStore(code)} onOpenAt={onOpenStore} />
            </div>
          ) : null}
        </div>
      )}
      <DcStockSection snapshotId={snapshot.snapshot_id} dcCode={summary.dc_code} />
    </>
  );
}

function isDcNotFound(error: unknown): boolean {
  return error instanceof StyleActionsApiError && error.code === 'dc_not_found';
}

/** Style Actions DC overview (SAPR-11): which of the DC's stores need attention first, and what the DC holds. */
export default function DcOverviewPage(): React.ReactNode {
  const { dcCode = '' } = useParams();
  const navigate = useNavigate();
  const params = useWorkspaceParams();
  const active = useActiveSnapshot(params.snap);
  const setSnapshot = useScopeStore((s) => s.setSnapshot);
  const snapshotId = active.snapshot?.snapshot_id ?? null;
  const dcs = useDcs(snapshotId);
  const isListed = Boolean(dcs.data?.items.some((item) => item.dc_code === dcCode));
  const parts = active.snapshot?.content_parts ?? { health: false, space: false };
  // A linked ranking the snapshot cannot answer (409) falls back to the default.
  const ranking = availableRankings(parts).includes(params.ranking) ? params.ranking : 'units_short';
  const summary = useDcSummary(isListed ? snapshotId : null, dcCode, ranking);
  const health = useHealth();

  const { fill } = params;
  useEffect(() => {
    // The URL carries the snapshot so the view can be linked and reloaded (S2-R1).
    if (snapshotId) fill({ snap: snapshotId });
  }, [snapshotId, fill]);

  const handlePickSnapshot = (id: string): void => {
    // Choosing the latest snapshot means "latest": later builds open on their own (S2-R3 default).
    setSnapshot(id === active.ready[0]?.snapshot_id ? null : id);
    params.update({ snap: id });
  };
  const handleOpenLatest = (id: string): void => {
    setSnapshot(null);
    params.update({ snap: id });
  };
  const handlePickDc = (code: string): void => {
    void navigate(dcOverviewHref(code, { snap: snapshotId, ranking: params.ranking }));
  };
  const handleOpenStore: OpenStoreAt = (storeCode, extra) => {
    if (snapshotId) void navigate(workspaceHref({ ...storeLinkParams(snapshotId, dcCode, storeCode, ranking), ...(extra?.brick ? { view: 'analysis' as const } : {}), ...extra }));
  };

  const { resolution } = active;
  let body: React.ReactNode;
  if (active.isLoading) body = <LoadingBlock label="Loading Distribution Centre overview" />;
  else if (active.error || !resolution) body = <ErrorBlock error={active.error} onRetry={active.refetch} />;
  else if (resolution.kind === 'unlisted' || resolution.kind === 'failed') body = <SnapshotNotice resolution={resolution} onOpenLatest={handleOpenLatest} />;
  else if (resolution.kind === 'none') {
    body = (
      <div data-testid="no-snapshot">
        <EmptyState
          title={resolution.pendingId ? 'The first snapshot is building' : 'No snapshot yet'}
          description={resolution.pendingId ? 'Distribution Centre figures appear here once it is ready.' : 'Build a snapshot from Data health to see real Distribution Centre data here.'}
          action={<Button size="sm" onClick={() => params.update({ panel: 'health' })}>Open data health</Button>}
        />
      </div>
    );
  } else if (dcs.isLoading) body = <SummarySkeleton />;
  else if (dcs.error || !dcs.data) body = <ErrorBlock error={dcs.error} onRetry={() => void dcs.refetch()} />;
  else if (!isListed || isDcNotFound(summary.error)) body = <DcUnavailable dcCode={dcCode} dcs={dcs.data.items} onPick={handlePickDc} />;
  else if (summary.isLoading) body = <SummarySkeleton />;
  else if (summary.error || !summary.data) body = <ErrorBlock error={summary.error} onRetry={() => void summary.refetch()} />;
  else {
    body = (
      <DcBody snapshot={resolution.snapshot} summary={summary.data} isUpdating={summary.isPlaceholderData} params={params} ranking={ranking} onOpenStore={handleOpenStore} />
    );
  }

  const dcItem = dcs.data?.items.find((item) => item.dc_code === dcCode);
  const name = summary.data?.name ?? dcItem?.name ?? null;
  const meta = dcItem ? `${formatUnits(dcItem.stores)} ${dcItem.stores === 1 ? 'store' : 'stores'} · ${formatUnits(dcItem.stores_with_data)} with data` : null;
  return (
    <div className="space-y-3">
      <ScopeHeader
        breadcrumb={<ScopeBreadcrumb dcHref={null} dcCode={dcCode} storeCode={null} />}
        title={`${DC_LABEL} · ${dcTitle(dcCode, name)}`}
        meta={meta}
        pickers={
          <>
            <SnapshotPicker snapshots={active.ready} current={active.snapshot} serverVersion={active.serverVersion} onPick={handlePickSnapshot} />
            {dcs.data ? <DcPicker dcs={dcs.data.items} dcCode={dcCode} onPick={handlePickDc} /> : null}
          </>
        }
      />
      <HealthStrip snapshot={active.snapshot} onOpen={() => params.update({ panel: 'health', scope: 'dc' })} />
      {/* One notice at a time: the drawer carries it (with Extend) while it is open (S2-R20). */}
      {active.snapshot && !params.isHealthOpen ? (
        <ContentStatus snapshot={active.snapshot} serverVersion={active.serverVersion} canExtend={Boolean(health.data?.can_build_snapshot)} />
      ) : null}
      {body}
      <HealthDrawer
        isOpen={params.isHealthOpen}
        onClose={() => params.update({ panel: null, code: null, scope: null })}
        snapshot={active.snapshot}
        latest={active.snapshots[0] ?? null}
        store={null}
        storeCode={null}
        dc={isListed ? { code: dcCode, findingCounts: summary.data?.totals.finding_counts ?? null } : null}
        code={params.findingCode}
        scope={params.findingScope === 'dc' && isListed ? 'dc' : 'all'}
        onCode={(code) => params.update({ code })}
        onScope={(scope) => params.update({ scope: scope === 'dc' ? 'dc' : null, code: null })}
        onBuilt={handlePickSnapshot}
      />
    </div>
  );
}
