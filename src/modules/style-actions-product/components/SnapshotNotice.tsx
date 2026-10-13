import { Button, EmptyState } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';

import { StyleActionsApiError } from '../api/client';
import { useSnapshot } from '../api/queries';
import { errorSentence, failureText, formatDay } from './display';
import { Term } from './Term';
import { LoadingBlock } from './QueryStates';

import type { Snapshot } from '../api/types';
import type { SnapshotResolution } from './scope';

const NOTICE_CLASS = 'mx-auto max-w-lg';

/** `detail` of a 404 snapshot_not_kept: the deleted snapshot's as-of date and deletion time (D-snapshot-not-kept). */
function notKeptFacts(detail: unknown): string {
  if (typeof detail !== 'object' || detail === null) return '';
  const asOf = 'as_of' in detail && typeof detail.as_of === 'string' ? detail.as_of : null;
  const deletedAt = 'deleted_at' in detail && typeof detail.deleted_at === 'string' ? detail.deleted_at : null;
  const parts = [asOf ? `It was as of ${formatDay(asOf)}` : null, deletedAt ? `deleted ${formatDateTime(deletedAt)}` : null].filter(Boolean);
  return parts.length ? `${parts.join(' and ')}. ` : '';
}

function LatestAction({ latest, onOpenLatest }: { readonly latest: Snapshot | null; readonly onOpenLatest: (snapshotId: string) => void }): React.ReactNode {
  if (!latest) return undefined;
  return (
    <Button size="sm" data-testid="open-latest-snapshot" onClick={() => onOpenLatest(latest.snapshot_id)} className="min-h-11 md:min-h-0">
      Open the latest snapshot (as of {formatDay(latest.as_of)})
    </Button>
  );
}

interface UnlistedProps {
  readonly requestedId: string;
  readonly latest: Snapshot | null;
  readonly onOpenLatest: (snapshotId: string) => void;
}

/** A chosen or linked snapshot the list no longer holds: the server says whether retention deleted it (S2-C7). */
function UnlistedSnapshot({ requestedId, latest, onOpenLatest }: UnlistedProps): React.ReactNode {
  const detail = useSnapshot(requestedId);
  if (detail.isLoading || detail.data) return <LoadingBlock label="Loading snapshot" />;
  const error = detail.error;
  const isNotKept = error instanceof StyleActionsApiError && error.code === 'snapshot_not_kept';
  const title = isNotKept ? 'This snapshot is no longer kept' : `Snapshot ${requestedId} could not be opened`;
  const { sentence, code } = errorSentence(error);
  const description = isNotKept
    ? `${notKeptFacts(error.detail)}Each new build keeps only the most recent snapshots. Nothing switches until you choose another.`
    : `${sentence} Nothing switches until you choose another.`;
  const action = (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {code && !isNotKept ? (
        <Term help={`Error code: ${code}`}>
          <span className="text-xs text-gray-500">Details</span>
        </Term>
      ) : null}
      <LatestAction latest={latest} onOpenLatest={onOpenLatest} />
    </div>
  );
  return (
    <div data-testid="snapshot-not-kept" role="alert">
      <EmptyState className={NOTICE_CLASS} title={title} description={description} action={action} />
    </div>
  );
}

interface SnapshotNoticeProps {
  readonly resolution: Extract<SnapshotResolution, { kind: 'unlisted' } | { kind: 'failed' }>;
  readonly onOpenLatest: (snapshotId: string) => void;
}

/** What a view shows instead of figures when its chosen snapshot cannot be read. */
export function SnapshotNotice({ resolution, onOpenLatest }: SnapshotNoticeProps): React.ReactNode {
  if (resolution.kind === 'unlisted') return <UnlistedSnapshot requestedId={resolution.requestedId} latest={resolution.latest} onOpenLatest={onOpenLatest} />;
  return (
    <div data-testid="snapshot-failed" role="alert">
      <EmptyState
        className={NOTICE_CLASS}
        title={`The snapshot as of ${formatDay(resolution.snapshot.as_of)} failed to build`}
        description={`${failureText(resolution.snapshot.error) ?? 'The build stopped without a message.'} Nothing switches until you choose another.`}
        action={<LatestAction latest={resolution.latest} onOpenLatest={onOpenLatest} />}
      />
    </div>
  );
}
