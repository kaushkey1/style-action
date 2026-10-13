import { useEffect, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle, Button } from '@/components/ui';

import { StyleActionsApiError } from '../api/client';
import { styleActionsKeys, useExtendSnapshot, useSnapshot } from '../api/queries';
import { failureText } from './display';
import { needsExtension } from './scope';

import type { Snapshot } from '../api/types';

const NOT_COMPUTED = 'Health and space not yet computed for this snapshot';
const STATUS_TEXT = { running: 'Extending…', succeeded: 'Extended', failed: 'Extension failed' } as const;

interface ContentStatusProps {
  /** The snapshot in use (from the list). */
  readonly snapshot: Snapshot;
  /** What the server computes (Health.content_version). */
  readonly serverVersion: number | null;
  /** Health.can_build_snapshot: extending needs the same permission as building (S2-C9). */
  readonly canExtend: boolean;
  /** In the Data health drawer the last extension is always shown; on the page only while it matters. */
  readonly isDetail?: boolean;
}

/**
 * "Health and space not yet computed for this snapshot" with Extend snapshot, and the extension's progress (S2-R20).
 * A snapshot without the new content says so instead of showing blank columns. Polls while the extension runs, then
 * refreshes every view so the health and space measures appear.
 */
export function ContentStatus({ snapshot, serverVersion, canExtend, isDetail = false }: ContentStatusProps): React.ReactNode {
  const client = useQueryClient();
  const extend = useExtendSnapshot();
  const needs = needsExtension(snapshot, serverVersion);
  const detail = useSnapshot(needs || isDetail || extend.isSuccess ? snapshot.snapshot_id : null);
  const live = detail.data ?? snapshot;
  const extension = live.extension;
  const status = extension?.status ?? null;
  const previous = useRef(status);
  useEffect(() => {
    const wasRunning = previous.current === 'running';
    previous.current = status;
    // Once an extension this view watched settles, every snapshot-scoped read is stale.
    if (wasRunning && (status === 'succeeded' || status === 'failed')) void client.invalidateQueries({ queryKey: styleActionsKeys.all });
  }, [status, client]);

  const isStillNeeded = needsExtension(live, serverVersion);
  const showsStatus = Boolean(extension) && (isDetail || status === 'running' || extend.isSuccess);
  if (!isStillNeeded && !showsStatus) return null;
  const refusal = extend.error instanceof StyleActionsApiError ? `${extend.error.message} (${extend.error.code})` : extend.error ? 'The Style Actions backend could not be reached.' : null;
  return (
    <div className="space-y-2" data-testid="content-status">
      {isStillNeeded ? (
        <Alert variant="info">
          <AlertIcon />
          <AlertContent>
            <AlertTitle>
              <span data-testid="content-not-computed">{NOT_COMPUTED}</span>
            </AlertTitle>
            <AlertDescription>
              This snapshot was built before health bands and space fill existed. Extending it computes them from its own as-of date and adds them without
              changing any existing figure.
              {canExtend ? null : ' Extending needs the same permission as building a snapshot.'}
            </AlertDescription>
          </AlertContent>
          {canExtend && status !== 'running' ? (
            <Button
              size="sm"
              data-testid="extend-snapshot"
              disabled={extend.isPending}
              onClick={() => extend.mutate(snapshot.snapshot_id)}
              className="min-h-11 shrink-0 md:min-h-0"
            >
              {extend.isPending ? 'Starting…' : 'Extend snapshot'}
            </Button>
          ) : null}
        </Alert>
      ) : null}
      {extension && showsStatus ? (
        <p className="text-xs text-gray-600" role="status">
          <span data-testid="extension-status" className="font-medium text-gray-900">{STATUS_TEXT[extension.status]}</span>
          {extension.status === 'failed' ? ` · ${failureText(extension.error) ?? 'It stopped without a message.'}` : ''}
          {extension.status === 'succeeded' ? ` · content version ${extension.to_version}` : ''}
        </p>
      ) : null}
      {refusal ? (
        <p className="text-xs text-red-700" role="alert" data-testid="extend-error">
          Extension not started: {refusal}
        </p>
      ) : null}
    </div>
  );
}
