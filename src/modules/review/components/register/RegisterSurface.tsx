import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Columns2, Rows3, Clock, ArrowLeft, Coins, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterBar, FilterSearch, FilterClear, EmptyState, Badge, Button, DrillMenu, FilterMultiSelect, MobileFilterTrigger, MobileFilterSheet, type FilterDef } from '@/components/ui';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { SEVERITY_BADGE } from '../../lib/severityBadge';
import { useRegisterRows, type RegisterRow } from '../../hooks/useRegisterRows';
import { RegisterDetail } from './RegisterDetail';
import { ActionGroup } from './ActionGroup';
import { getRegisterDrillTargets } from './drillTargets';
import { inr } from './registerTokens';
import type { EndState } from './registerTokens';

const TYPE_OPTIONS = [
  { value: 'exception', label: 'Exceptions' },
  { value: 'insight', label: 'Insights' },
];

// Mobile detail swipe-to-navigate: min horizontal distance + how much more
// horizontal than vertical the gesture must be to count as a swipe (vs a scroll).
const SWIPE_MIN_PX = 60;
const SWIPE_HORIZONTAL_RATIO = 1.5;

const SEVERITY_OPTIONS = [
  { value: 'red', label: 'Critical' },
  { value: 'amber', label: 'High' },
  { value: 'green', label: 'On track' },
  { value: 'monitoring', label: 'Monitoring' },
];

const OWNER_OPTIONS = [
  { value: 'me', label: 'Assigned to me' },
  { value: 'unassigned', label: 'Unassigned' },
];

// Mobile filter sheet definition — all three use the multi-select pattern
// (checkbox list + Select All). Type has no explicit "All": deselecting both
// shows everything, mirroring how Severity/Owner (and the CSV filter logic) work.
const MOBILE_FILTERS: FilterDef[] = [
  {
    type: 'multiselect',
    key: 'type',
    label: 'Type',
    searchable: false,
    options: [
      { value: 'exception', label: 'Exceptions' },
      { value: 'insight', label: 'Insights' },
    ],
  },
  { type: 'multiselect', key: 'severity', label: 'Severity', searchable: false, options: SEVERITY_OPTIONS },
  { type: 'multiselect', key: 'owner', label: 'Owner', searchable: false, options: OWNER_OPTIONS },
];


const toneLabel = (t: 'critical' | 'warning' | 'on-track' | 'monitoring'): string => {
  if (t === 'on-track') return 'On track';
  if (t === 'monitoring') return 'Monitoring';
  if (t === 'warning') return 'Watch';
  return 'Critical';
};

// ─── Mobile card severity styling (dot + accent + chip tint), keyed off the
// same Badge variant the desktop uses so colors stay in sync. ───────────────
interface RowMeta { label: string; dot: string; accent: string; tintBg: string; tintText: string; }
function metaColors(variant: string): Omit<RowMeta, 'label'> {
  switch (variant) {
    case 'error': return { dot: 'bg-red-500', accent: 'text-red-600', tintBg: 'bg-red-50', tintText: 'text-red-700' };
    case 'warning': return { dot: 'bg-amber-500', accent: 'text-amber-600', tintBg: 'bg-amber-50', tintText: 'text-amber-700' };
    case 'info': return { dot: 'bg-blue-500', accent: 'text-blue-600', tintBg: 'bg-blue-50', tintText: 'text-blue-700' };
    case 'success': return { dot: 'bg-green-500', accent: 'text-green-600', tintBg: 'bg-green-50', tintText: 'text-green-700' };
    default: return { dot: 'bg-gray-400', accent: 'text-gray-600', tintBg: 'bg-gray-100', tintText: 'text-gray-700' };
  }
}
function rowMeta(row: RegisterRow): RowMeta {
  if (row.kind === 'exception' && row.severity) {
    const b = SEVERITY_BADGE[row.severity];
    return { label: b.label, ...metaColors(b.variant) };
  }
  if (row.tone) {
    const v = row.tone === 'critical' ? 'error' : row.tone === 'warning' ? 'warning' : row.tone === 'monitoring' ? 'info' : 'success';
    return { label: toneLabel(row.tone), ...metaColors(v) };
  }
  return { label: '', ...metaColors('default') };
}

function KindBadgeOrTone({ row }: { row: RegisterRow }): React.ReactNode {
  if (row.kind === 'exception' && row.severity) {
    return <Badge variant={SEVERITY_BADGE[row.severity].variant} dot size="sm">{SEVERITY_BADGE[row.severity].label}</Badge>;
  }
  if (row.tone) {
    const variant = row.tone === 'critical' ? 'error' : row.tone === 'warning' ? 'warning' : row.tone === 'monitoring' ? 'info' : 'success';
    return <Badge variant={variant} dot size="sm">{toneLabel(row.tone)}</Badge>;
  }
  return null;
}

function RowInner({ row, expanded = false }: { row: RegisterRow; expanded?: boolean }): React.ReactNode {
  const hasTime = row.sla != null || Boolean(row.slaBreached);
  return (
    <div className="min-w-0 space-y-1.5">
      <p className={cn(
        'min-w-0 text-gray-900',
        expanded ? 'text-balance text-base font-semibold leading-snug' : 'truncate text-sm font-medium',
      )}>{row.title}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <KindBadgeOrTone row={row} />
        {row.valueInr != null && <span className="tabular-nums text-sm font-semibold text-gray-900">{inr(row.valueInr)}</span>}
        {hasTime && (
          <span className={cn('inline-flex items-center gap-1 text-xs', row.slaBreached ? 'font-semibold text-red-600' : 'text-gray-500')}>
            <Clock className="h-3.5 w-3.5" aria-hidden /> {row.slaBreached ? 'Overdue' : `${row.sla} to act`}
          </span>
        )}
      </div>
    </div>
  );
}

const MIN_LEFT_PCT = 30;
const MAX_LEFT_PCT = 40;

function VariantSplit({ rows, initialSel, getException, getInsight, endStates, setEndState }: {
  rows: RegisterRow[];
  initialSel?: string;
  getException: (id: string) => ReturnType<typeof useRegisterRows>['getException'] extends (id: string) => infer R ? R : never;
  getInsight: (id: string) => ReturnType<typeof useRegisterRows>['getInsight'] extends (id: string) => infer R ? R : never;
  endStates: Record<string, EndState>;
  setEndState: (id: string, state: EndState) => void;
}): React.ReactNode {
  const isMobile = useIsMobile();
  const [selId, setSelId] = useState(initialSel ?? rows[0]?.id);
  const [leftPct, setLeftPct] = useState(35);
  const containerRef = useRef<HTMLDivElement>(null);
  const sel = rows.find((r) => r.id === selId) ?? rows[0];

  const handleDragStart = useCallback((e: React.MouseEvent): void => {
    e.preventDefault();
    const onMove = (ev: MouseEvent): void => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(MAX_LEFT_PCT, Math.max(MIN_LEFT_PCT, pct)));
    };
    const onUp = (): void => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  if (rows.length === 0) return <EmptyState description="No items match your current filters" />;

  return (
    <div ref={containerRef} className="flex flex-col lg:flex-row">
      {/* eslint-disable-next-line no-restricted-syntax -- dynamic pane width from the drag handle requires inline style */}
      <div className="scrollbar-thin w-full shrink-0 border-b border-gray-200 lg:max-h-[calc(100vh-16rem)] lg:overflow-y-auto lg:border-b-0" style={isMobile ? undefined : { width: `${leftPct}%` }}>
        <div className="divide-y divide-gray-100">
          {rows.map((row) => (
            <div
              key={row.id}
              className={cn('group flex items-stretch transition-colors', row.id === sel?.id ? 'bg-primary-50/50' : 'hover:bg-gray-50')}
            >
              <button
                type="button"
                onClick={() => setSelId(row.id)}
                className="block min-w-0 flex-1 p-3 text-left focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-inset focus-kb:ring-primary"
              >
                <RowInner row={row} />
              </button>
              <div className="flex shrink-0 flex-col items-end gap-1 pr-2 pt-2">
                <DrillMenu rowLabel={row.title} targets={getRegisterDrillTargets(row.category)} />
                <span className={cn(
                  'whitespace-nowrap text-[11px] text-gray-400 transition-opacity',
                  row.id === sel?.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 touch:opacity-100',
                )}>{row.age}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Resize panes — drag or use arrow keys"
        className="hidden shrink-0 w-px cursor-col-resize bg-gray-200 hover:w-1 hover:bg-gray-300 active:bg-primary transition-[width,background-color] duration-150 lg:block"
        onMouseDown={handleDragStart}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setLeftPct((p) => Math.max(MIN_LEFT_PCT, p - 2));
          if (e.key === 'ArrowRight') setLeftPct((p) => Math.min(MAX_LEFT_PCT, p + 2));
        }}
      />

      <div className="min-w-0 flex-1 p-4">
        {sel && (
          <div key={sel.id}>
            <RegisterDetail
              kind={sel.kind}
              id={sel.id}
              data={sel.kind === 'exception' ? getException(sel.id) : getInsight(sel.id)}
              endState={sel.kind === 'exception' ? (endStates[sel.id] ?? sel.endState) : undefined}
              onEndStateChange={sel.kind === 'exception' ? (state) => setEndState(sel.id, state) : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Row header content for the full-width layout: title + inline meta (badge ·
// value · SLA). Title size/weight stays constant collapsed↔expanded (wraps when
// open, truncates when collapsed) so the header is a stable anchor on toggle.
function RowHeaderContent({ row, open }: { row: RegisterRow; open: boolean }): React.ReactNode {
  const hasTime = row.sla != null || Boolean(row.slaBreached);
  return (
    <div className="min-w-0">
      <p className={cn('text-sm font-semibold text-gray-900', open ? 'text-balance leading-snug' : 'truncate')}>{row.title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <KindBadgeOrTone row={row} />
        {row.valueInr != null && <span className="tabular-nums text-sm font-semibold text-gray-900">{inr(row.valueInr)}</span>}
        {hasTime && (
          <span className={cn('inline-flex items-center gap-1 text-xs', row.slaBreached ? 'font-semibold text-red-600' : 'text-gray-500')}>
            <Clock className="h-3.5 w-3.5" aria-hidden /> {row.slaBreached ? 'Breached' : `${row.sla} to act`}
          </span>
        )}
      </div>
    </div>
  );
}

function VariantRows({ rows, initialSel, getException, getInsight, endStates, setEndState }: {
  rows: RegisterRow[];
  initialSel?: string;
  getException: (id: string) => ReturnType<typeof useRegisterRows>['getException'] extends (id: string) => infer R ? R : never;
  getInsight: (id: string) => ReturnType<typeof useRegisterRows>['getInsight'] extends (id: string) => infer R ? R : never;
  endStates: Record<string, EndState>;
  setEndState: (id: string, state: EndState) => void;
}): React.ReactNode {
  const isMobile = useIsMobile();
  const [openId, setOpenId] = useState<string | null>(
    initialSel && rows.some((r) => r.id === initialSel) ? initialSel : rows[0]?.id ?? null,
  );
  if (rows.length === 0) return <EmptyState description="No items match your current filters" />;

  return (
    <div className="divide-y divide-gray-200">
      {rows.map((row) => {
        const open = row.id === openId;
        const exc = row.kind === 'exception' ? getException(row.id) : undefined;
        const endState = exc ? (endStates[row.id] ?? row.endState) : undefined;
        return (
          <div
            key={row.id}
            className={cn(
              'relative transition-[background-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
              open ? 'z-10 bg-white shadow-sm' : 'hover:bg-gray-50',
            )}
          >
            {/* Clickable header zone — toggles across its full width; the overlay
                button is the toggle target and ActionGroup re-enables pointer
                events so it stays an independent action (no nested button). The
                header keeps the same position collapsed↔expanded (no jump). */}
            <div className="relative p-3">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : row.id)}
                aria-expanded={open}
                aria-label={open ? 'Collapse' : `Expand ${row.title}`}
                className="absolute inset-0 focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-inset focus-kb:ring-primary/40"
              />
              <div className="pointer-events-none relative flex items-start gap-3">
                <ChevronRight
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
                    open && 'rotate-90',
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <RowHeaderContent row={row} open={open} />
                    {exc && endState !== undefined && (
                      <div className="pointer-events-auto shrink-0">
                        <ActionGroup
                          exception={exc}
                          endState={endState}
                          onEndStateChange={(state) => setEndState(row.id, state)}
                          compact={isMobile}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion body — animated height + fade reveal, aligned under the
                title (chevron-gutter spacer). `inert` keeps the collapsed body out
                of tab order / the a11y tree while staying mounted for the close
                animation. */}
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
                open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
              inert={!open}
            >
              <div className="overflow-hidden">
                <div
                  className={cn(
                    'flex gap-3 px-3 pb-4 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
                    open ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
                  )}
                >
                  <div className="w-4 shrink-0" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <RegisterDetail
                      kind={row.kind}
                      id={row.id}
                      variant="inline"
                      active={open}
                      data={row.kind === 'exception' ? getException(row.id) : getInsight(row.id)}
                      endState={row.kind === 'exception' ? endState : undefined}
                      onEndStateChange={row.kind === 'exception' ? (state) => setEndState(row.id, state) : undefined}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Map filter status values → exception severity
const STATUS_TO_SEVERITY: Record<string, string> = {
  red: 'S1', amber: 'S2', green: 'S3', monitoring: 'S3',
};
// Map filter status values → insight tone
const STATUS_TO_TONE: Record<string, string> = {
  red: 'critical', amber: 'warning', green: 'on-track', monitoring: 'monitoring',
};

type LayoutMode = 'split' | 'rows';
const LAYOUTS: { v: LayoutMode; label: string; icon: typeof Columns2 }[] = [
  { v: 'rows', label: 'Full-width', icon: Rows3 },
  { v: 'split', label: 'List + detail', icon: Columns2 },
];

function LayoutSwitcher({ value, onChange }: { value: LayoutMode; onChange: (v: LayoutMode) => void }): React.ReactNode {
  return (
    <div className="hidden lg:inline-flex h-11 lg:h-8 shrink-0 items-stretch gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5" role="radiogroup" aria-label="Layout">
      {LAYOUTS.map((o) => {
        const active = value === o.v;
        return (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.v)}
            title={o.label}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-kb:ring-2 focus-kb:ring-primary/40',
              active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <o.icon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function RegisterSurface(): React.ReactNode {
  const [params, setParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [type, setType] = useState(() => params.get('type') ?? 'all');
  const [severity, setSeverity] = useState(() => params.get('severity') ?? 'all');
  const [owner, setOwner] = useState(() => params.get('owner') ?? 'all');
  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const [layout, setLayout] = useState<LayoutMode>('rows');
  const [endStates, setEndStates] = useState<Record<string, EndState>>({});
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  // Swipe-to-navigate (mobile detail): direction drives the slide-in transition.
  const [navDir, setNavDir] = useState<'next' | 'prev'>('next');
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Mobile detail selection lives in the URL (?sel) so hardware/browser Back closes it.
  const sel = params.get('sel');

  // Sync filters to the URL while preserving `sel` (and any other params).
  useEffect(() => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (type && type !== 'all') next.set('type', type); else next.delete('type');
      if (severity && severity !== 'all') next.set('severity', severity); else next.delete('severity');
      if (owner && owner !== 'all') next.set('owner', owner); else next.delete('owner');
      if (query.trim()) next.set('q', query.trim()); else next.delete('q');
      return next;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setParams is stable; re-sync only when filters change
  }, [type, severity, owner, query]);

  const selectRow = useCallback((id: string): void => {
    setParams((prev) => { const n = new URLSearchParams(prev); n.set('sel', id); return n; });
  }, [setParams]);

  const clearSel = useCallback((): void => {
    setParams((prev) => { const n = new URLSearchParams(prev); n.delete('sel'); return n; }, { replace: true });
  }, [setParams]);

  const { rows: allRows, getException, getInsight } = useRegisterRows();

  const rows = useMemo(() => {
    const kinds = type && type !== 'all' ? type.split(',') : ['insight', 'exception'];
    const q = query.trim().toLowerCase();
    const sevStatuses = severity && severity !== 'all' ? severity.split(',') : null;
    const ownerSet = owner && owner !== 'all' ? new Set(owner.split(',')) : null;

    return allRows.filter((r) => {
      if (!kinds.includes(r.kind)) return false;
      if (q && !(r.title.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))) return false;
      if (sevStatuses) {
        if (r.kind === 'exception') {
          const matchedSeverities = sevStatuses.map((s) => STATUS_TO_SEVERITY[s]).filter(Boolean);
          if (!r.severity || !matchedSeverities.includes(r.severity)) return false;
        } else {
          const matchedTones = sevStatuses.map((s) => STATUS_TO_TONE[s]).filter(Boolean);
          if (!r.tone || !matchedTones.includes(r.tone)) return false;
        }
      }
      if (r.kind === 'insight') return true;
      if (ownerSet) {
        const me = ownerSet.has('me') && r.owner === 'You';
        const unassigned = ownerSet.has('unassigned') && r.owner == null;
        if (!me && !unassigned) return false;
      }
      return true;
    });
  }, [allRows, type, query, severity, owner]);

  const setEndState = (id: string, state: EndState): void => {
    setEndStates((prev) => ({ ...prev, [id]: state }));
  };

  const hasActiveFilters = (type && type !== 'all') || (severity && severity !== 'all') || (owner && owner !== 'all') || query.trim() !== '';

  const handleClearFilters = (): void => {
    setType('all');
    setSeverity('all');
    setOwner('all');
    setQuery('');
  };

  // ── Mobile: single card layout with search + filter sheet, tap → detail ──
  if (isMobile) {
    const selRow = sel ? allRows.find((r) => r.id === sel) : undefined;

    // Full-screen detail — sticky-action layout: top bar (back + prev/next) fixed,
    // content scrolls, Create Task pinned to the bottom edge. Header mirrors the
    // list card (dot + uppercase severity + code, title, stake/time chips); the
    // body reuses RegisterDetail (variant="inline" skips its own panel header, so
    // the desktop split-view header is untouched).
    if (selRow) {
      const exc = selRow.kind === 'exception' ? getException(selRow.id) : undefined;
      const selEndState = exc ? (endStates[selRow.id] ?? selRow.endState) : undefined;
      const meta = rowMeta(selRow);
      const hasTime = selRow.sla != null || Boolean(selRow.slaBreached);
      // Prev/next walk the current filtered list; hidden if the item is filtered out.
      const selIndex = rows.findIndex((r) => r.id === selRow.id);
      const prevId = selIndex > 0 ? rows[selIndex - 1]?.id : undefined;
      const nextId = selIndex >= 0 && selIndex < rows.length - 1 ? rows[selIndex + 1]?.id : undefined;
      const goPrev = (): void => { if (prevId) { setNavDir('prev'); selectRow(prevId); } };
      const goNext = (): void => { if (nextId) { setNavDir('next'); selectRow(nextId); } };
      return (
        <div className="fixed inset-x-0 bottom-0 top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-[35] flex flex-col bg-gray-50">
          {/* eslint-disable-next-line design-system/prefer-section-header -- mobile detail title bar (back + prev/next), not a section header */}
          <nav className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5">
            <button
              type="button"
              onClick={clearSel}
              aria-label="Back to Action Register"
              className="-ml-1.5 flex min-h-11 items-center gap-2 p-1.5 text-sm font-medium text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
              Action Register
            </button>
            {rows.length > 1 && selIndex >= 0 && (
              <div className="flex items-center gap-1">
                <span className="mr-1 tabular-nums text-xs text-gray-500">{selIndex + 1} / {rows.length}</span>
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={!prevId}
                  aria-label="Previous item"
                  className="flex h-11 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!nextId}
                  aria-label="Next item"
                  className="flex h-11 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </div>
            )}
          </nav>

          <motion.div
            key={selRow.id}
            initial={{ opacity: 0, x: prefersReducedMotion ? 0 : navDir === 'next' ? 16 : -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onTouchStart={(e) => {
              const t = e.touches[0];
              swipeStartRef.current = t ? { x: t.clientX, y: t.clientY } : null;
            }}
            onTouchEnd={(e) => {
              const start = swipeStartRef.current;
              swipeStartRef.current = null;
              const t = e.changedTouches[0];
              if (!start || !t) return;
              const dx = t.clientX - start.x;
              const dy = t.clientY - start.y;
              // Horizontal swipe only — ignore vertical scrolls and diagonal drags.
              if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * SWIPE_HORIZONTAL_RATIO) return;
              if (dx < 0) goNext(); else goPrev();
            }}
            className="flex-1 overflow-y-auto p-4"
          >
            <div className="mb-4">
              {meta.label && (
                <div className="flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', meta.dot)} aria-hidden />
                  <span className={cn('text-xs font-semibold uppercase tracking-wide', meta.accent)}>{meta.label}</span>
                  <span className="tabular-nums text-xs text-gray-400">{selRow.code}</span>
                </div>
              )}
              <h1 className={cn('text-lg font-semibold leading-snug text-gray-900', meta.label && 'mt-2')}>{selRow.title}</h1>
              {(selRow.valueInr != null || hasTime) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {selRow.valueInr != null && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium tabular-nums text-gray-700">
                      <Coins className="h-4 w-4" aria-hidden /> {inr(selRow.valueInr)} at stake
                    </span>
                  )}
                  {hasTime && (
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium tabular-nums', meta.tintBg, meta.tintText)}>
                      <Clock className="h-4 w-4" aria-hidden /> {selRow.slaBreached ? 'Overdue' : `${selRow.sla} to act`}
                    </span>
                  )}
                </div>
              )}
            </div>

            <RegisterDetail
              kind={selRow.kind}
              id={selRow.id}
              variant="inline"
              hideStakeSummary
              data={selRow.kind === 'exception' ? getException(selRow.id) : getInsight(selRow.id)}
              endState={selRow.kind === 'exception' ? selEndState : undefined}
              onEndStateChange={selRow.kind === 'exception' ? (s) => setEndState(selRow.id, s) : undefined}
            />
          </motion.div>

          {exc && selEndState !== undefined && (
            <div className="shrink-0 border-t border-gray-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
              <ActionGroup
                exception={exc}
                endState={selEndState}
                onEndStateChange={(s) => setEndState(selRow.id, s)}
                fullWidth
                primary
              />
            </div>
          )}
        </div>
      );
    }

    const mobileActiveCount =
      (type !== 'all' ? type.split(',').length : 0) +
      (severity !== 'all' ? severity.split(',').length : 0) +
      (owner !== 'all' ? owner.split(',').length : 0);

    return (
      <div>
        <div className="mb-3 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <FilterSearch value={query} onChange={setQuery} placeholder="Search title or ID…" />
          </div>
          <MobileFilterTrigger activeCount={mobileActiveCount} onOpen={() => setFilterSheetOpen(true)} />
        </div>

        {rows.length === 0 ? (
          <div className="py-4">
            <EmptyState description="No items match your current filters" />
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const exc = row.kind === 'exception' ? getException(row.id) : undefined;
              const endState = exc ? (endStates[row.id] ?? row.endState) : undefined;
              const meta = rowMeta(row);
              const hasTime = row.sla != null || Boolean(row.slaBreached);
              return (
                <div key={row.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="p-4">
                    {meta.label && (
                      <div className="flex items-center gap-2">
                        <span className={cn('h-2 w-2 rounded-full', meta.dot)} aria-hidden />
                        <span className={cn('text-xs font-semibold uppercase tracking-wide', meta.accent)}>{meta.label}</span>
                      </div>
                    )}
                    <p className={cn('text-base font-semibold leading-snug text-gray-900', meta.label && 'mt-2')}>{row.title}</p>
                    {(row.valueInr != null || hasTime) && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {row.valueInr != null && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium tabular-nums text-gray-700">
                            <Coins className="h-4 w-4" aria-hidden /> {inr(row.valueInr)} at stake
                          </span>
                        )}
                        {hasTime && (
                          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium tabular-nums', meta.tintBg, meta.tintText)}>
                            <Clock className="h-4 w-4" aria-hidden /> {row.slaBreached ? 'Overdue' : `${row.sla} to act`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 p-3">
                    {exc && endState !== undefined && (
                      <ActionGroup
                        exception={exc}
                        endState={endState}
                        onEndStateChange={(s) => setEndState(row.id, s)}
                        fullWidth
                      />
                    )}
                    <Button
                      variant="primary"
                      size="md"
                      className="relative min-h-10 flex-1"
                      onClick={() => selectRow(row.id)}
                    >
                      <span className="absolute inset-x-0 top-1/2 h-11 -translate-y-1/2 lg:hidden" aria-hidden />
                      <Eye className="h-3.5 w-3.5" />
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <MobileFilterSheet
          isOpen={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
          filters={MOBILE_FILTERS}
          values={{ type, severity, owner }}
          onApply={(v) => {
            setType(v.type ?? 'all');
            setSeverity(v.severity ?? 'all');
            setOwner(v.owner ?? 'all');
          }}
          onClear={() => {
            setType('all');
            setSeverity('all');
            setOwner('all');
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn(layout === 'rows' && 'overflow-hidden')}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg border-b border-gray-200 bg-gray-50/50 px-3 py-2">
        <FilterBar className="mb-0 min-w-0 flex-1">
          <FilterMultiSelect placeholder="Type" value={type} onChange={setType} options={TYPE_OPTIONS} searchable={false} />
          <FilterMultiSelect placeholder="Severity" value={severity} onChange={setSeverity} options={SEVERITY_OPTIONS} searchable={false} />
          <FilterMultiSelect placeholder="Owner" value={owner} onChange={setOwner} options={OWNER_OPTIONS} searchable={false} />
          <FilterSearch value={query} onChange={setQuery} placeholder="Search title or ID…" />
          {hasActiveFilters && <FilterClear onClear={handleClearFilters} />}
        </FilterBar>
        <LayoutSwitcher value={layout} onChange={setLayout} />
      </div>

      {layout === 'split' ? (
        <VariantSplit rows={rows} initialSel={sel ?? undefined} getException={getException} getInsight={getInsight} endStates={endStates} setEndState={setEndState} />
      ) : (
        <VariantRows rows={rows} initialSel={sel ?? undefined} getException={getException} getInsight={getInsight} endStates={endStates} setEndState={setEndState} />
      )}
    </div>
  );
}
