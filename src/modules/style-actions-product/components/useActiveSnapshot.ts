import { useHealth, useSnapshots } from '../api/queries';
import { useScopeStore } from '../stores/useScopeStore';
import { readySnapshots, resolveSnapshot } from './scope';

import type { Snapshot } from '../api/types';
import type { SnapshotResolution } from './scope';

export interface ActiveSnapshot {
  /** Null while the snapshot list loads or failed to load. */
  resolution: SnapshotResolution | null;
  /** The ready snapshot every request reads; null when there is none or the chosen one is unavailable. */
  snapshot: Snapshot | null;
  /** Kept ready snapshots, newest build first (the picker's list). */
  ready: Snapshot[];
  /** Every listed snapshot in the backend's order (newest created first), including building and failed ones. */
  snapshots: Snapshot[];
  /** What the server computes (Health.content_version); null until health loads. */
  serverVersion: number | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * The snapshot a view reads (S2-R3): the URL's `snap`, else the user's saved choice, else the latest ready one.
 * A chosen snapshot that is no longer listed is reported, never replaced silently (S2-C7).
 */
export function useActiveSnapshot(urlSnap: string | null): ActiveSnapshot {
  const saved = useScopeStore((s) => s.snapshotId);
  const query = useSnapshots();
  const health = useHealth();
  const snapshots = query.data?.items ?? [];
  const resolution = query.data ? resolveSnapshot({ snapshots, urlSnap, savedSnap: saved }) : null;
  return {
    resolution,
    snapshot: resolution?.kind === 'ready' ? resolution.snapshot : null,
    ready: readySnapshots(snapshots),
    snapshots,
    serverVersion: health.data?.content_version ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}
