import { Fragment, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui';

import type { FlowCluster, TransitionEdge } from '../api/smartiTypes';

interface TransitionHeatmapProps {
  clusters: Record<string, FlowCluster>;
  edges: TransitionEdge[];
}

function heatColor(pct: number): string {
  if (pct === 0) return 'transparent';
  if (pct < 10) return 'rgba(254, 240, 138, 0.6)';
  if (pct < 25) return 'rgba(253, 224, 71, 0.7)';
  if (pct < 50) return 'rgba(250, 204, 21, 0.8)';
  if (pct < 75) return 'rgba(245, 158, 11, 0.8)';
  return 'rgba(234, 88, 12, 0.85)';
}

export function TransitionHeatmap({ clusters, edges }: TransitionHeatmapProps): React.ReactNode {
  const { zoneIds, zoneNames, matrix } = useMemo(() => {
    const ids = Object.keys(clusters);
    const names = ids.map((id) => clusters[id]?.clusterName ?? id);

    const edgeMap = new Map<string, number>();
    for (const edge of edges) {
      edgeMap.set(`${edge.fromCluster}→${edge.toCluster}`, edge.transitionCount);
    }

    const rowTotals = new Map<string, number>();
    for (const fromId of ids) {
      let total = 0;
      for (const toId of ids) {
        if (fromId === toId) continue;
        total += edgeMap.get(`${fromId}→${toId}`) ?? 0;
      }
      rowTotals.set(fromId, total);
    }

    const mat = ids.map((fromId) => {
      const rowTotal = rowTotals.get(fromId) ?? 0;
      return ids.map((toId) => {
        if (fromId === toId) return null;
        const count = edgeMap.get(`${fromId}→${toId}`) ?? 0;
        const pct = rowTotal === 0 ? 0 : Math.round((count / rowTotal) * 1000) / 10;
        return { pct, count };
      });
    });

    return { zoneIds: ids, zoneNames: names, matrix: mat };
  }, [clusters, edges]);

  if (zoneIds.length === 0) {
    return <EmptyState title="No transition data" description="No zone transition data for this period" />;
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div
        className="grid gap-px bg-gray-200 rounded-lg overflow-hidden"
        // eslint-disable-next-line no-restricted-syntax -- dynamic grid template from zone count
        style={{
          gridTemplateColumns: `minmax(100px, 140px) repeat(${zoneNames.length}, minmax(64px, 1fr))`,
        }}
      >
        {/* Header row: empty corner + column labels */}
        <div className="bg-white p-2 flex items-end">
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">From \ To</span>
        </div>
        {zoneNames.map((name) => (
          <div key={`col-${name}`} className="bg-white p-1.5 flex items-end justify-center">
            <span className="text-[10px] font-medium text-gray-600 text-center leading-tight truncate max-w-full">{name}</span>
          </div>
        ))}

        {/* Data rows */}
        {matrix.map((row, rowIdx) => (
          <Fragment key={zoneIds[rowIdx]}>
            {/* Row label */}
            <div className="bg-white p-2 flex items-center">
              <span className="text-xs font-medium text-gray-700 truncate">{zoneNames[rowIdx]}</span>
            </div>
            {/* Cells */}
            {row.map((cell, colIdx) => (
              <div
                key={zoneIds[colIdx]}
                className={cn(
                  'flex items-center justify-center p-1.5 min-h-[36px]',
                  cell === null ? 'bg-gray-50' : 'bg-white',
                )}
                // eslint-disable-next-line no-restricted-syntax -- dynamic heatmap cell background color
                style={cell !== null && cell.pct > 0 ? { backgroundColor: heatColor(cell.pct) } : undefined}
                title={cell !== null && cell.pct > 0 ? `${zoneNames[rowIdx]} → ${zoneNames[colIdx]}: ${cell.count} transitions (${cell.pct.toFixed(1)}%)` : undefined}
              >
                {cell === null ? (
                  <span className="text-gray-400 text-xs">&mdash;</span>
                ) : cell.pct === 0 ? (
                  <span className="text-gray-400 text-xs">&mdash;</span>
                ) : (
                  <span className="text-xs font-semibold text-gray-800 tabular-nums">{cell.pct.toFixed(1)}%</span>
                )}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
