import { useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { GitBranch, Maximize2, Minus, Plus, X } from 'lucide-react';
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import { EngineEvaluationDetail } from './EngineEvaluationDetail';
import { LOGIC_VIEWS, type LogicNode, type LogicTone } from './engineLogicModel';
import { buildWholeEngineTree, treeEdgeState, type TreeEdgeState } from './wholeEngineTree';
import type { OptionEngineBundle } from './optionEngineData';

const TONES: Record<LogicTone, string> = {
  reference: 'border-gray-200 bg-white text-gray-700',
  passed: 'border-teal-300 bg-teal-50 text-teal-800',
  blocked: 'border-rose-300 bg-rose-50 text-rose-800',
  skipped: 'border-dashed border-gray-300 bg-gray-100 text-gray-500',
  unknown: 'border-amber-300 bg-amber-50 text-amber-900',
  deciding: 'border-cyan-500 bg-cyan-50 text-cyan-900',
};
const EDGE_COLOURS: Record<TreeEdgeState, string> = { active: '#0d9488', inactive: '#d1d5db', unknown: '#d97706', reference: '#94a3b8' };
const ENGINE_NAMES: Record<string, string> = {
  replenishment: 'Replenishment', broken: 'Broken sizes', consolidation: 'Consolidation',
  overfill: 'Overfill', lifecycle_end: 'Lifecycle exit', replacement: 'Replacement', markdown: 'Markdown',
};

function NodeContent({ node }: { node: LogicNode }) {
  return <>
    <span className="block text-xs font-semibold leading-4">{node.title}</span>
    {node.lines.length > 0 && <span className="mt-1 block space-y-0.5 text-[11px] leading-4">{node.lines.map((line, i) => <span className="block" key={i}>{line}</span>)}</span>}
    {node.status && <span className="mt-1.5 block text-[10px] font-semibold leading-4">{node.status}</span>}
  </>;
}

function TreeCanvas({ bundle, expanded, onExpand }: { bundle: OptionEngineBundle; expanded?: boolean; onExpand?: () => void }) {
  const graph = buildWholeEngineTree(bundle);
  const [zoom, setZoom] = useState(() => expanded ? Math.min(1, (window.innerWidth * 0.96 - 48) / graph.width) : 0.5);
  const [selectedEngine, setSelectedEngine] = useState<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const inspector = useRef<HTMLDivElement>(null);
  const marker = `logic-arrow-${useId().replaceAll(':', '')}`;
  const moveTo = (scale: number, x: number, y: number) => {
    // Commit the SVG dimensions before panning; otherwise the browser clamps to the old canvas.
    flushSync(() => setZoom(scale));
    viewport.current?.scrollTo({ left: Math.max(0, x * scale), top: Math.max(0, y * scale), behavior: 'instant' });
  };
  const zoomTo = (value: number) => {
    const scale = Math.max(0.25, Math.min(1.5, value));
    moveTo(scale, (viewport.current?.scrollLeft ?? 0) / zoom, (viewport.current?.scrollTop ?? 0) / zoom);
  };
  const fitWidth = () => moveTo(Math.min(1, ((viewport.current?.clientWidth ?? 800) - 16) / graph.width), 0, 0);
  const jumpTo = (id: string) => {
    if (id === 'workflow') { fitWidth(); return; }
    const section = graph.sections.find(item => item.id === id)!;
    const scale = Math.min(1, ((viewport.current?.clientWidth ?? 800) - 16) / section.width);
    moveTo(scale, section.x - Math.max(8, ((viewport.current?.clientWidth ?? 800) / scale - section.width) / 2), section.y - 8);
  };
  const edgeOrder: Record<TreeEdgeState, number> = { reference: 0, inactive: 1, unknown: 2, active: 3 };
  const edges = [...graph.edges].sort((a, b) => edgeOrder[treeEdgeState(a, graph.nodes)] - edgeOrder[treeEdgeState(b, graph.nodes)]);
  return <div className="min-w-0 space-y-3">
    <nav className="flex flex-wrap items-center gap-1" aria-label="Jump within whole engine tree"><span className="mr-1 text-xs text-gray-500">Jump to</span>{LOGIC_VIEWS.map(item => <Button key={item.id} size="sm" variant="ghost" onClick={() => jumpTo(item.id)}>{item.id === 'workflow' ? 'Start' : item.label}</Button>)}</nav>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-gray-600" aria-label="Diagram legend">{([
        ['deciding', 'Taken / output'], ['passed', 'Passed'], ['blocked', 'Failed check'], ['skipped', 'Not taken'], ['unknown', 'Not recorded'],
      ] as const).map(([tone, label]) => <span className="flex items-center gap-1" key={tone}><span className={cn('h-2.5 w-2.5 rounded-sm border', TONES[tone])} aria-hidden />{label}</span>)}</div>
      <div className="flex items-center gap-1" aria-label="Tree controls">
        <Button size="sm" variant="ghost" aria-label="Zoom out" disabled={zoom <= 0.25} onClick={() => zoomTo(zoom - 0.15)}><Minus className="size-3.5" aria-hidden /></Button>
        <span className="w-9 text-center text-xs tabular-nums" aria-live="polite">{Math.round(zoom * 100)}%</span>
        <Button size="sm" variant="ghost" aria-label="Zoom in" disabled={zoom >= 1.5} onClick={() => zoomTo(zoom + 0.15)}><Plus className="size-3.5" aria-hidden /></Button>
        <Button size="sm" variant="ghost" onClick={fitWidth}>Fit width</Button>
        <Button size="sm" variant="ghost" onClick={() => zoomTo(1)}>100%</Button>
        {onExpand && <Button size="sm" variant="secondary" onClick={onExpand}><Maximize2 className="mr-1 size-3.5" aria-hidden />Expand</Button>}
      </div>
    </div>
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard users can pan the scrollable canvas with arrow keys */}
    <div ref={viewport} className={cn('overflow-auto overscroll-contain [overflow-anchor:none] rounded-lg border border-gray-200 bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600', expanded ? 'h-[calc(100dvh-210px)]' : 'h-[560px]')} tabIndex={0} role="region" aria-label="Whole engine tree; scroll horizontally and vertically to explore">
      <svg viewBox={`0 0 ${graph.width} ${graph.height}`} width={graph.width * zoom} height={graph.height * zoom} className="block max-w-none" role="group" aria-label="Whole engine workflow flowchart">
        <title>Whole engine workflow</title>
        <defs>{Object.entries(EDGE_COLOURS).map(([state, colour]) => <marker key={state} id={`${marker}-${state}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={colour} /></marker>)}</defs>
        {graph.sections.map(section => <g key={section.id} data-stage={section.id}>
          <rect x={section.x} y={section.y} width={section.width} height={section.height} rx="12" fill="#fff" stroke="#e5e7eb" />
          <text x={section.x + 28} y={section.y + 28} fontSize="15" fontWeight="600" fill="#111827">{section.title}</text>
          <text x={section.x + 28} y={section.y + 47} fontSize="11" fill="#6b7280">{section.note}</text>
        </g>)}
        {edges.map((edge, i) => {
          const from = graph.nodes.find(node => node.id === edge.from)!;
          const to = graph.nodes.find(node => node.id === edge.to)!;
          const x1 = edge.side ? from.x + from.w : from.x + from.w / 2;
          const y1 = edge.side ? from.y + from.h / 2 : from.y + from.h;
          const x2 = edge.side ? to.x : to.x + to.w / 2;
          const y2 = edge.side ? to.y + to.h / 2 : to.y;
          const midY = y1 + (y2 - y1) / 2;
          const path = edge.points ? edge.points.map(([x, y], index) => `${index ? 'L' : 'M'}${x},${y}`).join(' ')
            : edge.side ? `M${x1},${y1} H${x2 - 10} V${y2} H${x2}` : `M${x1},${y1} V${midY} H${x2} V${y2}`;
          const state = treeEdgeState(edge, graph.nodes);
          return <g key={`${edge.from}-${edge.to}-${i}`} aria-hidden="true" data-edge-state={state}>
            <path d={path} fill="none" stroke={EDGE_COLOURS[state]} strokeWidth={state === 'active' ? 2.5 : 1.5} strokeDasharray={state === 'inactive' || state === 'unknown' ? '5 4' : undefined} markerEnd={`url(#${marker}-${state})`} />
            {edge.label && !edge.points && <text x={(x1 + x2) / 2} y={edge.side ? Math.min(y1, y2) - 7 : midY - 7} textAnchor="middle" fontSize="9" fill={state === 'inactive' ? '#9ca3af' : '#475569'} stroke="#f9fafb" strokeWidth="4" paintOrder="stroke">{edge.label}</text>}
          </g>;
        })}
        {graph.nodes.map(node => <foreignObject key={node.id} x={node.x} y={node.y} width={node.w} height={node.h} data-node-id={node.id} data-tone={node.tone ?? 'reference'}>
          {node.engine ? <button type="button" aria-label={`Inspect ${node.title} recorded checks`} onClick={() => { setSelectedEngine(node.engine!); requestAnimationFrame(() => inspector.current?.scrollIntoView({ block: 'nearest' })); }} className={cn('h-full w-full rounded-lg border p-3 text-left hover:border-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-600', TONES[node.tone ?? 'reference'])}><NodeContent node={node} /></button>
            : <div className={cn('h-full rounded-lg border p-3 text-left', TONES[node.tone ?? 'reference'])}><NodeContent node={node} /></div>}
        </foreignObject>)}
      </svg>
    </div>
    <p className="text-[11px] text-gray-500">One connected tree · scroll to explore · click an engine for recorded checks. Grey = not taken; amber = missing evidence. † Unconfirmed workflow default.</p>
    {selectedEngine && <div ref={inspector} className="max-h-72 overflow-auto rounded-lg border border-gray-200 p-3" aria-label={`${ENGINE_NAMES[selectedEngine]} recorded evidence`}>
      <div className="mb-3 flex items-center justify-between gap-2"><h4 className="text-sm font-semibold">{ENGINE_NAMES[selectedEngine]} · recorded checks & output numbers</h4><Button size="sm" variant="ghost" aria-label="Close recorded checks" onClick={() => setSelectedEngine(null)}><X className="size-4" aria-hidden /></Button></div>
      <EngineEvaluationDetail name={ENGINE_NAMES[selectedEngine] ?? selectedEngine} evaluation={bundle.gate?.engine_evaluations?.find(item => item.engine === selectedEngine)} demo={bundle.demo} />
    </div>}
  </div>;
}

export function EngineLogicDiagram({ bundle }: { bundle: OptionEngineBundle }) {
  const [expanded, setExpanded] = useState(false);
  return <section className="space-y-3" aria-label="Engine logic explorer">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900"><GitBranch className="size-4" aria-hidden />Whole engine tree</h3><Badge size="sm" variant="outline">{bundle.demo ? 'Demo results' : 'Recorded results'}</Badge></div>
    {!expanded && <TreeCanvas bundle={bundle} onExpand={() => setExpanded(true)} />}
    <Dialog open={expanded} onOpenChange={setExpanded}><DialogContent className="h-[96dvh] w-[96vw] max-w-none overflow-auto p-4 sm:max-w-none">
      <DialogTitle>Whole engine tree</DialogTitle><DialogDescription>All stages connected · this option’s recorded path and untaken branches.</DialogDescription>
      {expanded && <TreeCanvas bundle={bundle} expanded />}
    </DialogContent></Dialog>
  </section>;
}
