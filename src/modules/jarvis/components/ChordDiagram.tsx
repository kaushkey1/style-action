import { useCallback, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui';

import type { FlowCluster, TransitionEdge } from '../api/smartiTypes';

interface ChordDiagramProps {
  clusters: Record<string, FlowCluster>;
  edges: TransitionEdge[];
}

const ZONE_COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
] as const;

const ARC_PAD = 0.03;
const TWO_PI = Math.PI * 2;

interface ArcData {
  id: string;
  name: string;
  count: number;
  color: string;
  startAngle: number;
  endAngle: number;
}

interface ChordData {
  fromId: string;
  toId: string;
  count: number;
  fromStart: number;
  fromEnd: number;
  toStart: number;
  toEnd: number;
  color: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.cos(angle - Math.PI / 2), cy + r * Math.sin(angle - Math.PI / 2)];
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const [x1, y1] = polarToCartesian(cx, cy, r, startAngle);
  const [x2, y2] = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function chordPath(
  cx: number,
  cy: number,
  r: number,
  srcStart: number,
  srcEnd: number,
  tgtStart: number,
  tgtEnd: number,
): string {
  const [sx1, sy1] = polarToCartesian(cx, cy, r, srcStart);
  const [sx2, sy2] = polarToCartesian(cx, cy, r, srcEnd);
  const [tx1, ty1] = polarToCartesian(cx, cy, r, tgtStart);
  const [tx2, ty2] = polarToCartesian(cx, cy, r, tgtEnd);

  return [
    `M ${sx1} ${sy1}`,
    `A ${r} ${r} 0 0 1 ${sx2} ${sy2}`,
    `Q ${cx} ${cy} ${tx1} ${ty1}`,
    `A ${r} ${r} 0 0 1 ${tx2} ${ty2}`,
    `Q ${cx} ${cy} ${sx1} ${sy1}`,
    'Z',
  ].join(' ');
}

export function ChordDiagram({ clusters, edges }: ChordDiagramProps): React.ReactNode {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [hoveredChordIdx, setHoveredChordIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const { arcs, chords } = useMemo(() => {
    const ids = Object.keys(clusters);
    if (ids.length === 0) return { arcs: [] as ArcData[], chords: [] as ChordData[] };

    const totalVisitors = ids.reduce((sum, id) => sum + Number(clusters[id]?.visitorCount ?? 0), 0);
    if (totalVisitors === 0) return { arcs: [] as ArcData[], chords: [] as ChordData[] };

    const totalPad = ARC_PAD * ids.length;
    const availableAngle = TWO_PI - totalPad;

    const arcList: ArcData[] = [];
    let angle = 0;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]!;
      const cluster = clusters[id]!;
      const count = Number(cluster.visitorCount);
      const sweep = (count / totalVisitors) * availableAngle;
      arcList.push({
        id,
        name: cluster.clusterName,
        count,
        color: ZONE_COLORS[i % ZONE_COLORS.length]!,
        startAngle: angle,
        endAngle: angle + sweep,
      });
      angle += sweep + ARC_PAD;
    }

    const arcMap = new Map(arcList.map((a) => [a.id, a]));

    const arcCursors = new Map(arcList.map((a) => [a.id, a.startAngle + 0.005]));
    const arcUsable = new Map(arcList.map((a) => [a.id, a.endAngle - a.startAngle - 0.01]));
    const arcEdgeTotals = new Map<string, number>();

    for (const edge of edges) {
      arcEdgeTotals.set(edge.fromCluster, (arcEdgeTotals.get(edge.fromCluster) ?? 0) + edge.transitionCount);
      arcEdgeTotals.set(edge.toCluster, (arcEdgeTotals.get(edge.toCluster) ?? 0) + edge.transitionCount);
    }

    const chordList: ChordData[] = [];

    for (const edge of edges) {
      if (edge.transitionCount === 0) continue;
      const fromArc = arcMap.get(edge.fromCluster);
      const toArc = arcMap.get(edge.toCluster);
      if (!fromArc || !toArc) continue;

      const fromTotal = arcEdgeTotals.get(edge.fromCluster) ?? 1;
      const toTotal = arcEdgeTotals.get(edge.toCluster) ?? 1;
      const fromUsable = arcUsable.get(edge.fromCluster) ?? 0;
      const toUsable = arcUsable.get(edge.toCluster) ?? 0;
      const fromSweep = (edge.transitionCount / fromTotal) * fromUsable;
      const toSweep = (edge.transitionCount / toTotal) * toUsable;

      const fromCursor = arcCursors.get(edge.fromCluster) ?? 0;
      const toCursor = arcCursors.get(edge.toCluster) ?? 0;

      chordList.push({
        fromId: edge.fromCluster,
        toId: edge.toCluster,
        count: edge.transitionCount,
        fromStart: fromCursor,
        fromEnd: fromCursor + fromSweep,
        toStart: toCursor,
        toEnd: toCursor + toSweep,
        color: fromArc.color,
      });

      arcCursors.set(edge.fromCluster, fromCursor + fromSweep);
      arcCursors.set(edge.toCluster, toCursor + toSweep);
    }

    return { arcs: arcList, chords: chordList };
  }, [clusters, edges]);

  const arcMap = useMemo(() => new Map(arcs.map((a) => [a.id, a])), [arcs]);

  const totalTransitions = useMemo(() => chords.reduce((sum, c) => sum + c.count, 0), [chords]);

  const hoverDetail = useMemo(() => {
    if (hoveredChordIdx !== null) {
      const chord = chords[hoveredChordIdx];
      if (!chord) return null;
      const from = arcMap.get(chord.fromId);
      const to = arcMap.get(chord.toId);
      if (!from || !to) return null;
      const pct = totalTransitions > 0 ? Math.round((chord.count / totalTransitions) * 1000) / 10 : 0;
      return { type: 'chord' as const, from: from.name, to: to.name, count: chord.count, color: chord.color, percentage: pct };
    }
    if (hoveredZone !== null) {
      const arc = arcMap.get(hoveredZone);
      if (!arc) return null;
      const related = chords
        .filter((c) => (c.fromId === hoveredZone || c.toId === hoveredZone) && c.count > 0)
        .map((c) => {
          const other = c.fromId === hoveredZone ? arcMap.get(c.toId) : arcMap.get(c.fromId);
          const direction = c.fromId === hoveredZone ? 'to' : 'from';
          return { name: other?.name ?? '?', count: c.count, direction, color: c.color };
        })
        .sort((a, b) => b.count - a.count);
      return { type: 'zone' as const, name: arc.name, count: arc.count, color: arc.color, transitions: related };
    }
    return null;
  }, [hoveredZone, hoveredChordIdx, chords, arcMap, totalTransitions]);

  if (arcs.length === 0) {
    return <EmptyState title="No journey data" description="No customer journey data for this period" />;
  }

  const size = 500;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 155;
  const innerR = outerR - 14;
  const labelR = outerR + 24;

  return (
    <div
      ref={containerRef}
      className="relative flex items-start gap-3"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setHoveredZone(null); setHoveredChordIdx(null); setMousePos(null); }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="flex-1 min-w-0 h-auto"
        role="img"
        aria-label="Customer journey chord diagram"
      >
        {chords.map((chord, i) => {
          const isHighlighted =
            hoveredChordIdx === i ||
            (hoveredChordIdx === null && (
              hoveredZone === null ||
              hoveredZone === chord.fromId ||
              hoveredZone === chord.toId
            ));

          return (
            <path
              key={i}
              d={chordPath(cx, cy, innerR, chord.fromStart, chord.fromEnd, chord.toStart, chord.toEnd)}
              fill={chord.color}
              fillOpacity={isHighlighted ? 0.35 : 0.06}
              stroke={chord.color}
              strokeOpacity={isHighlighted ? 0.5 : 0.05}
              strokeWidth={0.5}
              className="transition-opacity duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredChordIdx(i)}
              onMouseLeave={() => setHoveredChordIdx(null)}
            />
          );
        })}

        {arcs.map((arc) => {
          const isHighlighted = hoveredChordIdx === null && (hoveredZone === null || hoveredZone === arc.id);
          const midAngle = (arc.startAngle + arc.endAngle) / 2;
          const [lx, ly] = polarToCartesian(cx, cy, labelR, midAngle);
          const textAnchor = lx > cx ? 'start' : 'end';

          return (
            <g
              key={arc.id}
              onMouseEnter={() => { setHoveredZone(arc.id); setHoveredChordIdx(null); }}
              onMouseLeave={() => setHoveredZone(null)}
              className="cursor-pointer"
            >
              <path
                d={arcPath(cx, cy, outerR, arc.startAngle, arc.endAngle)}
                fill="none"
                stroke={arc.color}
                strokeWidth={14}
                strokeLinecap="butt"
                opacity={isHighlighted ? 1 : 0.3}
                className="transition-opacity duration-200"
              />
              <text
                x={lx}
                y={ly}
                textAnchor={textAnchor}
                dominantBaseline="central"
                className="fill-gray-600"
                fontSize={9}
                fontWeight={500}
              >
                {arc.name}
              </text>
              <text
                x={lx}
                y={ly + 12}
                textAnchor={textAnchor}
                dominantBaseline="central"
                className="fill-gray-400"
                fontSize={8}
              >
                ({arc.count})
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend — vertical list on the right, vertically centered */}
      <div className="flex flex-col justify-center gap-1.5 shrink-0">
        {arcs.map((arc) => (
          <button
            key={arc.id}
            type="button"
            className={cn(
              'flex items-center gap-2 text-xs transition-opacity duration-200 py-0.5 rounded whitespace-nowrap',
              hoveredZone !== null && hoveredZone !== arc.id ? 'opacity-40' : 'opacity-100',
            )}
            onMouseEnter={() => { setHoveredZone(arc.id); setHoveredChordIdx(null); }}
            onMouseLeave={() => setHoveredZone(null)}
            aria-label={`Highlight ${arc.name}`}
          >
            {/* eslint-disable-next-line no-restricted-syntax -- dynamic legend swatch color from zone palette */}
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: arc.color }} />
            <span className="text-gray-700">{arc.name}</span>
          </button>
        ))}
      </div>

      {/* Floating tooltip */}
      {hoverDetail && mousePos && (
        <div
          className="pointer-events-none absolute z-50 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
          // eslint-disable-next-line no-restricted-syntax -- tooltip positioned dynamically at cursor
          style={{ left: mousePos.x + 12, top: mousePos.y - 10, maxWidth: 260 }}
        >
          {hoverDetail.type === 'chord' ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                {/* eslint-disable-next-line no-restricted-syntax -- dynamic swatch color from zone palette */}
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: hoverDetail.color }} />
                <span className="font-medium">{hoverDetail.from}</span>
                <span className="text-gray-400">&rarr;</span>
                <span className="font-medium">{hoverDetail.to}</span>
              </div>
              <div className="text-gray-400">Transitions: <span className="font-semibold text-white tabular-nums">{hoverDetail.count}</span></div>
              <div className="text-gray-400">Percentage: <span className="font-semibold text-white tabular-nums">{hoverDetail.percentage}%</span></div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                {/* eslint-disable-next-line no-restricted-syntax -- dynamic swatch color from zone palette */}
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: hoverDetail.color }} />
                <span className="font-medium">{hoverDetail.name}</span>
                <span className="text-gray-400">&middot;</span>
                <span className="tabular-nums">{hoverDetail.count} visitors</span>
              </div>
              {hoverDetail.transitions.length > 0 && (
                <div className="space-y-0.5 pt-1 border-t border-gray-700">
                  {hoverDetail.transitions.map((t) => (
                    <div key={`${t.direction}-${t.name}`} className="flex items-center gap-1.5">
                      <span className="text-gray-400">{t.direction === 'to' ? '→' : '←'}</span>
                      <span className="truncate">{t.name}</span>
                      <span className="ml-auto font-semibold tabular-nums">{t.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
