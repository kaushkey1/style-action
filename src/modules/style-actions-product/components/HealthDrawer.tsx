import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Button,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  EmptyState,
  MetricGrid,
  Sheet,
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui';
import { formatDateTime } from '@/lib/utils';

import { styleActionsKeys, useBuildSnapshot, useFindings, useHealth, useSnapshot } from '../api/queries';
import {
  DC_LABEL,
  DC_LABEL_PLURAL,
  EMPTY,
  FINDING_EFFECT_LABEL,
  FINDING_EFFECTS,
  FINDING_LABEL,
  FINDING_META,
  buildErrorText,
  failureText,
  findingCountRows,
  findingEffect,
  formatBytes,
  formatDay,
  formatUnits,
} from './display';
import { ContentStatus } from './ContentStatus';
import { MissingEvidence } from './Panel';
import { ErrorBlock, LoadingBlock } from './QueryStates';

import type { Snapshot, SnapshotDetail, StoreSummary } from '../api/types';
import type { FindingCountRow } from './display';
import type { FindingScope } from './useWorkspaceParams';

const STATUS_LABEL: Readonly<Record<Snapshot['status'], string>> = { building: 'Building', ready: 'Ready', failed: 'Failed' };
const STATUS_VARIANT = { building: 'warning', ready: 'success', failed: 'error' } as const;
const MS_PER_SECOND = 1000;

function Fact({ label, children }: { readonly label: string; readonly children: React.ReactNode }): React.ReactNode {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="text-sm font-medium text-gray-900">{children}</div>
    </div>
  );
}

function Section({ title, actions, children }: { readonly title: string; readonly actions?: React.ReactNode; readonly children: React.ReactNode }): React.ReactNode {
  return (
    <section className="space-y-2 border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {actions}
      </div>
      {children}
    </section>
  );
}

function handleRowKey(event: KeyboardEvent<HTMLElement>, onActivate: () => void): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onActivate();
  }
}

/**
 * Snapshot detail, polling while a build runs; refreshes the snapshot list once a build it watched settles. A snapshot
 * already ready on load triggers nothing, so a page load reads the snapshot list once.
 */
function useSnapshotDetail(snapshotId: string | null): ReturnType<typeof useSnapshot> {
  const detail = useSnapshot(snapshotId);
  const client = useQueryClient();
  const status = detail.data?.status;
  const previous = useRef(status);
  useEffect(() => {
    const wasBuilding = previous.current === 'building';
    previous.current = status;
    if (wasBuilding && (status === 'ready' || status === 'failed')) void client.invalidateQueries({ queryKey: styleActionsKeys.snapshots() });
  }, [status, client]);
  return detail;
}

function SnapshotFacts({ snap }: { readonly snap: SnapshotDetail }): React.ReactNode {
  return (
    <>
      <MetricGrid columns={4} className="mb-0 grid-cols-2 xs:grid-cols-2">
        <Fact label="Status">
          <Badge variant={STATUS_VARIANT[snap.status]} size="sm">{STATUS_LABEL[snap.status]}</Badge>
        </Fact>
        <Fact label="As of">{formatDay(snap.as_of)}</Fact>
        <Fact label="Scope">{snap.dcs.length === 1 ? DC_LABEL : DC_LABEL_PLURAL} {snap.dcs.join(', ')}</Fact>
        <Fact label="Built">{snap.built_at ? formatDateTime(snap.built_at) : EMPTY}</Fact>
      </MetricGrid>
      {snap.error ? <p className="text-sm text-red-700" role="alert">The build failed. {failureText(snap.error)}</p> : null}
    </>
  );
}

function SourceQueries({ snap }: { readonly snap: SnapshotDetail }): React.ReactNode {
  if (!snap.queries.length) return <MissingEvidence>No source queries recorded for this snapshot.</MissingEvidence>;
  // Fixture and cached BigQuery reads record no scanned bytes; show the column only when some query has them.
  const hasBytes = snap.queries.some((query) => query.bytes_processed > 0);
  return (
    <DataTable className="relative" minWidth="360px">
      <caption className="sr-only">Source queries for this snapshot</caption>
      <DataTableHeader>
        <DataTableHead>Input</DataTableHead>
        <DataTableHead align="right">Rows</DataTableHead>
        {hasBytes ? <DataTableHead align="right">Scanned</DataTableHead> : null}
        <DataTableHead align="right">Time</DataTableHead>
      </DataTableHeader>
      <DataTableBody>
        {snap.queries.map((query) => (
          <DataTableRow key={query.name}>
            <DataTableCell className="py-1.5 font-medium text-gray-900">{query.name}</DataTableCell>
            <DataTableCell align="right" className="py-1.5 tabular-nums">{formatUnits(query.rows)}</DataTableCell>
            {hasBytes ? <DataTableCell align="right" className="py-1.5 tabular-nums">{formatBytes(query.bytes_processed)}</DataTableCell> : null}
            <DataTableCell align="right" className="py-1.5 tabular-nums">
              {query.duration_ms ? `${(query.duration_ms / MS_PER_SECOND).toFixed(1)} s` : EMPTY}
            </DataTableCell>
          </DataTableRow>
        ))}
      </DataTableBody>
    </DataTable>
  );
}

/** Findings grouped by what they do to the numbers; a row opens its records. */
function FindingsTable({ rows, onOpen }: { readonly rows: readonly FindingCountRow[]; readonly onOpen: (code: string) => void }): React.ReactNode {
  return (
    <DataTable className="relative" minWidth="360px">
      <caption className="sr-only">Data-quality findings by effect on the measures; select a finding to see its records</caption>
      <DataTableHeader>
        <DataTableHead>Finding and what it does</DataTableHead>
        <DataTableHead align="right">Count</DataTableHead>
        <DataTableHead className="w-8"><span className="sr-only">Open</span></DataTableHead>
      </DataTableHeader>
      <DataTableBody>
        {FINDING_EFFECTS.map((effect) => {
          const group = rows.filter((row) => findingEffect(row.code) === effect);
          if (!group.length) return null;
          const total = group.reduce((sum, row) => sum + row.count, 0);
          return [
            <DataTableRow key={`group-${effect}`} data-testid={`finding-group-${effect}`} className="bg-gray-50 hover:bg-gray-50">
              <DataTableCell colSpan={3} className="py-1.5 text-xs font-medium text-gray-600">
                {FINDING_EFFECT_LABEL[effect]} · <span className="tabular-nums">{formatUnits(total)}</span>
              </DataTableCell>
            </DataTableRow>,
            ...group.map((row) => {
              const label = FINDING_LABEL[row.code] ?? row.code;
              const open = (): void => onOpen(row.code);
              return (
                <DataTableRow
                  key={row.code}
                  data-testid={`finding-code-${row.code}`}
                  onClick={open}
                  onKeyDown={(event) => handleRowKey(event, open)}
                  tabIndex={0}
                  aria-label={`${label}, ${formatUnits(row.count)}, open records`}
                  className="focus-kb:outline-none focus-kb:ring-2 focus-kb:ring-inset focus-kb:ring-primary"
                >
                  <DataTableCell className="py-2">
                    <span className="block text-sm font-medium text-gray-900">{label}</span>
                    <span className="block text-xs text-gray-500">{FINDING_META[row.code]?.meaning ?? EMPTY}</span>
                  </DataTableCell>
                  <DataTableCell align="right" className="py-2 tabular-nums font-medium text-gray-900">{formatUnits(row.count)}</DataTableCell>
                  <DataTableCell className="w-8 py-2 text-gray-400"><ChevronRight className="size-4" aria-hidden /></DataTableCell>
                </DataTableRow>
              );
            }),
          ];
        })}
      </DataTableBody>
    </DataTable>
  );
}

interface FindingRecordsProps {
  readonly snapshotId: string;
  readonly code: string;
  readonly storeCode: string | null;
  readonly dcCode: string | null;
  readonly onBack: () => void;
}

function scopePhrase(storeCode: string | null, dcCode: string | null): string {
  if (storeCode) return ` at store ${storeCode}`;
  if (dcCode) return ` in ${DC_LABEL} ${dcCode}`;
  return ' across all stores';
}

function FindingRecords({ snapshotId, code, storeCode, dcCode, onBack }: FindingRecordsProps): React.ReactNode {
  const findings = useFindings(snapshotId, code, storeCode, 1, dcCode);
  const label = FINDING_LABEL[code] ?? code;
  let body: React.ReactNode;
  if (findings.isLoading) body = <LoadingBlock label="Loading findings" />;
  else if (findings.error || !findings.data) body = <ErrorBlock error={findings.error} onRetry={() => void findings.refetch()} />;
  else {
    body = (
      <>
        <p className="text-xs text-gray-500" data-testid="findings-total">
          {formatUnits(findings.data.total)} {label} findings{scopePhrase(storeCode, dcCode)}
          {findings.data.total > findings.data.items.length ? ` · showing first ${findings.data.items.length}` : ''}
        </p>
        <DataTable className="relative" minWidth="420px">
          <caption className="sr-only">{label} findings</caption>
          <DataTableHeader>
            <DataTableHead>Store</DataTableHead>
            <DataTableHead>Option · article</DataTableHead>
            <DataTableHead align="right">Units</DataTableHead>
          </DataTableHeader>
          <DataTableBody>
            {findings.data.items.map((item, index) => (
              <DataTableRow key={`${item.store_code}-${item.option_code}-${item.article}-${index}`}>
                <DataTableCell className="py-1.5 tabular-nums">{item.store_code ?? EMPTY}</DataTableCell>
                <DataTableCell className="py-1.5">
                  <span className="block">{item.option_code || EMPTY}</span>
                  {item.article ? <span className="block text-xs text-gray-500">{item.article}</span> : null}
                </DataTableCell>
                <DataTableCell align="right" className="py-1.5 tabular-nums">{formatUnits(item.units)}</DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </>
    );
  }
  return (
    <div className="space-y-2">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 min-h-11 gap-1 text-xs md:min-h-0" data-testid="findings-back">
        <ChevronLeft className="size-4" aria-hidden />
        All findings
      </Button>
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">
          {FINDING_EFFECT_LABEL[findingEffect(code)]}: {FINDING_META[code]?.meaning ?? EMPTY}
        </p>
      </div>
      {body}
    </div>
  );
}

interface FindingsSectionProps {
  readonly snapshot: Snapshot | null;
  /** The store the workspace is on, when it is in the snapshot. */
  readonly store: StoreSummary | null;
  /** The store the workspace asked for, which may be outside the snapshot. */
  readonly storeCode: string | null;
  readonly dc: DrawerDc | null;
  readonly code: string | null;
  readonly scope: FindingScope;
  readonly onCode: (code: string | null) => void;
}

/** The DC a drawer opened from the DC overview is scoped to, with its counts from DcTotals.finding_counts (S2-R2). */
export interface DrawerDc {
  readonly code: string;
  readonly findingCounts: Readonly<Record<string, number>> | null;
}

function emptyDescription(storeCode: string | null, dcCode: string | null): string {
  if (storeCode) return `Every input at store ${storeCode} passed the checks.`;
  if (dcCode) return `Every input at the stores of ${DC_LABEL} ${dcCode} passed the checks.`;
  return 'Every input passed the checks.';
}

/** Counts come from the snapshot (all stores), the DC totals (this DC) or the loaded store summary (this store); only drill-down rows are fetched. */
function FindingsSection({ snapshot, store, storeCode, dc, code, scope, onCode }: FindingsSectionProps): React.ReactNode {
  if (!snapshot) return <MissingEvidence>Findings appear once a snapshot is ready.</MissingEvidence>;
  if (scope === 'store' && storeCode && !store) return <MissingEvidence>Store {storeCode} is not in this snapshot.</MissingEvidence>;
  const scopedStore = scope === 'store' ? store : null;
  const scopedDc = scope === 'dc' && dc ? dc : null;
  if (scopedDc && !scopedDc.findingCounts) return <MissingEvidence>{DC_LABEL} {scopedDc.code} counts appear once its summary loads.</MissingEvidence>;
  const storeScope = scopedStore?.store_code ?? null;
  const dcScope = scopedDc?.code ?? null;
  if (code) return <FindingRecords snapshotId={snapshot.snapshot_id} code={code} storeCode={storeScope} dcCode={dcScope} onBack={() => onCode(null)} />;
  const counts = scopedStore?.finding_counts ?? scopedDc?.findingCounts ?? snapshot.finding_counts;
  const rows = findingCountRows(counts);
  if (!rows.length) return <EmptyState variant="positive" title="No data-quality findings" description={emptyDescription(storeScope, dcScope)} />;
  return <FindingsTable rows={rows} onOpen={onCode} />;
}

/** The Build snapshot refusal in the backend's words; a scope over the store limit says so plainly (Scope 1a R7). */
function BuildError({ error }: { readonly error: unknown }): React.ReactNode {
  const text = buildErrorText(error);
  return (
    <div data-testid="build-error">
      <Alert variant="error">
        <AlertIcon />
        <AlertContent>
          <AlertTitle>{text.title}</AlertTitle>
          <AlertDescription>{text.message}</AlertDescription>
        </AlertContent>
      </Alert>
    </div>
  );
}

/** "A newer snapshot (as of …) is being built": its own line with its own status, polled until it settles (S2-C69). */
function NewerBuild({ snapshotId }: { readonly snapshotId: string }): React.ReactNode {
  const detail = useSnapshotDetail(snapshotId);
  const data = detail.data;
  if (!data) return null;
  let text = `A newer snapshot (as of ${formatDay(data.as_of)}) is being built.`;
  if (data.status === 'ready') text = `A newer snapshot (as of ${formatDay(data.as_of)}) is ready; choose it from the snapshot picker.`;
  if (data.status === 'failed') text = `The newer build (as of ${formatDay(data.as_of)}) failed. ${failureText(data.error) ?? ''}`.trim();
  return (
    <p className="flex flex-wrap items-center gap-1.5 rounded-lg border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-600" data-testid="newer-build" role="status">
      <Badge variant={STATUS_VARIANT[data.status]} size="sm">
        <span data-testid="newer-build-status">{STATUS_LABEL[data.status]}</span>
      </Badge>
      {text}
    </p>
  );
}

interface HealthDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly snapshot: Snapshot | null;
  readonly latest: Snapshot | null;
  /** The workspace's store when it is in the snapshot; its summary carries the per-store finding counts. */
  readonly store: StoreSummary | null;
  /** The store the workspace asked for (URL, saved or default), which may be outside the snapshot. */
  readonly storeCode: string | null;
  /** On the DC overview: the DC and its finding counts, for the "This DC" scope. */
  readonly dc?: DrawerDc | null;
  readonly code: string | null;
  readonly scope: FindingScope;
  readonly onCode: (code: string | null) => void;
  readonly onScope: (scope: FindingScope) => void;
  readonly onBuilt: (snapshotId: string) => void;
}

/** Data health: is the snapshot sound, what is wrong in the data and what it does to the numbers, and where it came from. */
export function HealthDrawer({ isOpen, onClose, snapshot, latest, store, storeCode, dc = null, code, scope, onCode, onScope, onBuilt }: HealthDrawerProps): React.ReactNode {
  const health = useHealth();
  const build = useBuildSnapshot();
  // The Snapshot section always describes the viewed snapshot (S2-C69); only when nothing is ready yet does it describe
  // the first build. Its detail is read while the drawer is open, one request shared with the content notice (S2-C68).
  const viewedId = snapshot?.snapshot_id ?? latest?.snapshot_id ?? null;
  const detail = useSnapshotDetail(isOpen ? viewedId : null);
  // A newer build in progress is followed separately, open or closed, so the views move to it once it is ready; it is
  // shown as its own labelled line and never merged into the viewed snapshot's facts.
  const newer = latest && latest.snapshot_id !== viewedId && latest.status === 'building' ? latest : null;
  // Polled here too (same cache entry as the line below), so a build started and left with the drawer closed still
  // refreshes the snapshot list when it settles.
  useSnapshotDetail(newer?.snapshot_id ?? null);
  const defaultScope = health.data?.default_scope;
  const canBuild = Boolean(health.data?.can_build_snapshot && defaultScope?.as_of);
  const handleBuild = (): void => {
    if (!defaultScope?.as_of) return;
    build.mutate({ as_of: defaultScope.as_of, dcs: defaultScope.dcs, focus_stores: defaultScope.focus_stores }, { onSuccess: (created) => onBuilt(created.snapshot_id) });
  };
  let snapshotBody: React.ReactNode;
  if (!latest) snapshotBody = <MissingEvidence>No snapshot has been built for this organisation yet.</MissingEvidence>;
  else if (detail.isLoading) snapshotBody = <LoadingBlock label="Loading snapshot" />;
  else if (detail.error || !detail.data) snapshotBody = <ErrorBlock error={detail.error} onRetry={() => void detail.refetch()} />;
  else snapshotBody = <SnapshotFacts snap={detail.data} />;
  const newerLine = newer ? <NewerBuild snapshotId={newer.snapshot_id} /> : null;
  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Data health" description="Snapshot, data-quality findings and source queries" width="xl">
      <div className="space-y-4 p-4">
        <Section
          title="Snapshot"
          actions={
            canBuild ? (
              <Button size="sm" data-testid="build-snapshot" onClick={handleBuild} disabled={build.isPending} className="min-h-11 md:min-h-0">
                {build.isPending ? 'Starting…' : 'Build snapshot'}
              </Button>
            ) : undefined
          }
        >
          {snapshotBody}
          {newerLine}
          {snapshot ? (
            <ContentStatus snapshot={snapshot} serverVersion={health.data?.content_version ?? null} canExtend={Boolean(health.data?.can_build_snapshot)} isDetail />
          ) : null}
          {build.error ? <BuildError error={build.error} /> : null}
          {defaultScope?.as_of ? (
            <p className="text-xs text-gray-500">
              A new build uses the configured scope: {defaultScope.dcs.length === 1 ? DC_LABEL : DC_LABEL_PLURAL} {defaultScope.dcs.join(', ')} · focus stores {defaultScope.focus_stores.join(', ')} · as of {formatDay(defaultScope.as_of)}
            </p>
          ) : null}
        </Section>
        <Section
          title="Data-quality findings"
          actions={
            (storeCode || dc) && !code ? (
              <ToggleGroup value={scope} onValueChange={(value) => onScope(value === 'store' || value === 'dc' ? value : 'all')} aria-label="Findings scope">
                {storeCode ? <ToggleGroupItem value="store" className="h-7 min-h-11 px-2 text-xs md:min-h-0">Store {storeCode}</ToggleGroupItem> : null}
                {dc ? <ToggleGroupItem value="dc" data-testid="findings-scope-dc" className="h-7 min-h-11 px-2 text-xs md:min-h-0">{DC_LABEL} {dc.code}</ToggleGroupItem> : null}
                <ToggleGroupItem value="all" className="h-7 min-h-11 px-2 text-xs md:min-h-0">All stores</ToggleGroupItem>
              </ToggleGroup>
            ) : undefined
          }
        >
          <FindingsSection snapshot={snapshot} store={store} storeCode={storeCode} dc={dc} code={code} scope={scope} onCode={onCode} />
        </Section>
        <Section title="Source queries">
          {detail.data ? <SourceQueries snap={detail.data} /> : <MissingEvidence>Shown once the snapshot loads.</MissingEvidence>}
        </Section>
      </div>
    </Sheet>
  );
}
