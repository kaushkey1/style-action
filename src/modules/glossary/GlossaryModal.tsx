/**
 * Metric Glossary modal — two-pane reference browser (searchable list + 3-section
 * detail). Mounted once globally (ConsoleLayout); opened from any tooltip's
 * "View all definitions" via the glossary store. Reads the auto-register store for
 * "this page" metrics; resolves definitions from all three registries.
 */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'motion/react';
import { Search, X, BookMarked, ChevronRight, ArrowLeft, LocateFixed } from 'lucide-react';
import { Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { getProductByRoute, getL1ModuleByRoute } from '@/data/navigationConfig';
import { getMetricHome } from '@/data/metricHome';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useGlossaryStore } from './useGlossaryStore';
import { useGlossary, GLOSSARY_TYPE_LABEL, type GlossaryEntry, type GlossaryScope } from './useGlossary';
import { MetricDefinitionSections } from './MetricDefinitionSections';
import { GlossaryFeedback } from './GlossaryFeedback';
import type { GlossaryMetricType } from './useGlossaryStore';

const TYPE_CHIP: Record<GlossaryMetricType, string> = {
  kpi: 'bg-indigo-50 text-primary',
  table: 'bg-gray-100 text-gray-600',
  chart: 'bg-cyan-50 text-cyan-700',
};

/** Scroll the anchor into view (if not already) and pulse a highlight ring. */
function highlightAnchor(el: HTMLElement): void {
  const rect = el.getBoundingClientRect();
  const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
  if (!inView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  // Only add classes the element doesn't already have, and remove only those — so we
  // never strip the element's own styling (e.g. a card's existing `rounded-lg`) on cleanup.
  const cls = ['animate-highlight-ring', 'ring-2', 'ring-primary', 'ring-offset-2', 'rounded-lg'];
  const added = cls.filter((c) => !el.classList.contains(c));
  el.classList.add(...added);
  window.setTimeout(() => el.classList.remove(...added), 1700);
}

/** Locate the element carrying data-glossary-anchor="<metricKey>" now; false if absent. */
function locateOnPage(metricKey: string): boolean {
  const el = document.querySelector<HTMLElement>(`[data-glossary-anchor="${metricKey}"]`);
  if (!el) return false;
  highlightAnchor(el);
  return true;
}

/**
 * Locate after navigating to another page — polls for the anchor to render
 * (handles route change, tab activation, and async data load), then highlights.
 */
function locateWithRetry(metricKey: string, tries = 30, intervalMs = 200): void {
  let n = 0;
  const tick = (): void => {
    if (locateOnPage(metricKey)) return;
    if (++n < tries) window.setTimeout(tick, intervalMs);
  };
  window.setTimeout(tick, 250);
}

export function GlossaryModal(): React.JSX.Element {
  const isOpen = useGlossaryStore((s) => s.isOpen);
  const closeGlossary = useGlossaryStore((s) => s.closeGlossary);
  const initialKey = useGlossaryStore((s) => s.initialKey);
  const isMobile = useIsMobile();

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => !o && closeGlossary()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            'fixed z-[70] bg-white shadow-2xl focus:outline-none flex flex-col overflow-hidden',
            isMobile
              ? 'bottom-0 inset-x-0 rounded-t-lg max-h-[92vh] animate-in slide-in-from-bottom duration-300'
              : 'left-1/2 top-[7vh] -translate-x-1/2 w-[min(64rem,calc(100vw-2rem))] h-[80vh] rounded-lg ring-1 ring-gray-900/5 animate-in fade-in zoom-in-95 duration-200',
          )}
        >
          <Dialog.Title className="sr-only">Metric Glossary</Dialog.Title>
          {isOpen && (
            <GlossaryBody
              isMobile={isMobile}
              initialKey={initialKey}
              onClose={closeGlossary}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function GlossaryBody({
  isMobile,
  initialKey,
  onClose,
}: {
  isMobile: boolean;
  initialKey: string | null;
  onClose: () => void;
}): React.JSX.Element {
  const { scope, setScope, query, setQuery, groups, total, pageCount, allCount } = useGlossary();
  const mounted = useGlossaryStore((s) => s.mounted);
  const [selectedKey, setSelectedKey] = useState<string | null>(initialKey);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>(initialKey ? 'detail' : 'list');
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isMobile) searchRef.current?.focus();
  }, [isMobile]);

  // Header subtitle reflects the page you're browsing from (the "you are here" context).
  const currentProduct = getProductByRoute(location.pathname);
  const currentModule = currentProduct ? getL1ModuleByRoute(currentProduct, location.pathname) : undefined;
  const moduleLabel = currentModule?.label ?? currentProduct?.label ?? 'This page';
  const goTo = (route: string): void => {
    onClose();
    navigate(route);
  };

  const flat = useMemo(() => groups.flatMap((g) => g.entries), [groups]);
  const selected: GlossaryEntry | null = useMemo(() => {
    if (selectedKey) {
      const found = flat.find((e) => e.key === selectedKey);
      if (found) return found;
    }
    return isMobile ? null : (flat[0] ?? null);
  }, [selectedKey, flat, isMobile]);

  // Per-metric breadcrumb: the metric's canonical HOME (where it comes from), shown
  // even if you've never opened that page. Falls back to the current page only when a
  // metric has no mapped home but is rendered here.
  const home = selected ? getMetricHome(selected.key) : undefined;
  const homePath = home ? home.route.split('?')[0] : undefined;
  const homeProduct = homePath ? getProductByRoute(homePath) : undefined;
  const homeModule = homeProduct && homePath ? getL1ModuleByRoute(homeProduct, homePath) : undefined;
  const isOnThisPage = selected ? !!mounted[selected.key] : false;

  const metricCrumbs = home
    ? [
        ...(homeProduct ? [{ label: homeProduct.label, route: homeProduct.defaultRoute }] : []),
        ...(homeModule ? [{ label: homeModule.label, route: homeModule.route }] : []),
        ...(home.tabLabel ? [{ label: home.tabLabel, route: home.route }] : []),
      ]
    : isOnThisPage && currentProduct
      ? [
          { label: currentProduct.label, route: currentProduct.defaultRoute },
          ...(currentModule ? [{ label: currentModule.label, route: currentModule.route }] : []),
        ]
      : [];

  // Locate: if it's on this page, scroll right away; otherwise navigate to its home
  // route (activating the right tab) and poll for the element to render, then highlight.
  const canLocate = !!home || isOnThisPage;
  const locateLabel = home && homePath !== location.pathname ? 'Go to page' : 'Show on page';
  const handleLocate = (key: string): void => {
    if (isOnThisPage) {
      onClose();
      window.setTimeout(() => locateOnPage(key), 90);
      return;
    }
    if (home) {
      onClose();
      navigate(home.route);
      locateWithRetry(key);
    }
  };

  const handleSelect = (key: string): void => {
    setSelectedKey(key);
    if (isMobile) setMobileView('detail');
  };

  const showList = !isMobile || mobileView === 'list';
  const showDetail = !isMobile || mobileView === 'detail';

  return (
    <div className="flex flex-col h-full min-h-0">
      {isMobile && (
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
      )}
      {/* Header */}
      {/* eslint-disable-next-line design-system/prefer-section-header -- modal header, not a page section */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 shrink-0">
        {isMobile && mobileView === 'detail' ? (
          <button
            type="button"
            onClick={() => setMobileView('list')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            All metrics
          </button>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-primary shrink-0">
              <BookMarked className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-900 leading-tight">Metric Glossary</h2>
              <p className="text-xs text-gray-500 truncate">Reference browser · {moduleLabel}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close glossary"
          className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors active:scale-[0.96]"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* List pane */}
        {showList && (
          <div className={cn('flex flex-col min-h-0', isMobile ? 'flex-1' : 'w-[300px] border-r border-gray-100')}>
            <div className="shrink-0 px-3 pt-3 pb-2 space-y-2 border-b border-gray-100">
              <Input
                ref={searchRef}
                className="py-1.5"
                leftIcon={<Search className="w-4 h-4" />}
                rightIcon={
                  query ? (
                    <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  ) : undefined
                }
                placeholder="Search metrics…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search metrics"
              />
              <ScopeToggle scope={scope} setScope={setScope} pageCount={pageCount} allCount={allCount} />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin py-2">
              {total === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500 text-center">
                  {scope === 'page' ? 'No metric definitions detected on this page.' : 'No metrics match.'}
                </p>
              ) : (
                groups.map((g) => (
                  <div key={g.type} className="mb-2">
                    <p className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                      {g.title} · {g.entries.length}
                    </p>
                    {g.entries.map((e) => {
                      const active = !isMobile && selected?.key === e.key;
                      return (
                        <button
                          key={e.key}
                          type="button"
                          onClick={() => handleSelect(e.key)}
                          className={cn(
                            'group w-full flex items-center gap-2 px-4 py-2 text-left transition-colors',
                            active ? 'bg-indigo-50/70' : 'hover:bg-gray-50',
                          )}
                        >
                          <span className={cn('inline-flex items-center rounded px-1 py-0.5 text-[9px] font-semibold uppercase', TYPE_CHIP[e.type])}>
                            {GLOSSARY_TYPE_LABEL[e.type]}
                          </span>
                          <span className={cn('flex-1 min-w-0 truncate text-sm', active ? 'font-semibold text-gray-900' : 'text-gray-700')}>
                            {e.name}
                          </span>
                          <ChevronRight className={cn('w-3.5 h-3.5 shrink-0', active ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500')} />
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Detail pane */}
        {showDetail && (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            {selected ? (
              <motion.div
                key={selected.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              >
                <div className="px-4 py-4 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', TYPE_CHIP[selected.type])}>
                        {GLOSSARY_TYPE_LABEL[selected.type]}
                      </span>
                      <h3 className="mt-2 text-2xl font-semibold text-gray-900 text-balance tracking-tight">{selected.name}</h3>
                      {metricCrumbs.length > 0 && (
                        <nav aria-label="Metric location" className="flex items-center flex-wrap gap-1 mt-2 text-xs text-gray-500">
                          {metricCrumbs.map((c, i) => (
                            <Fragment key={c.label}>
                              {i > 0 && <ChevronRight className="w-3 h-3 text-gray-400" aria-hidden="true" />}
                              <button
                                type="button"
                                onClick={() => goTo(c.route)}
                                className="rounded px-0.5 hover:text-primary hover:underline underline-offset-2 transition-colors focus:outline-none focus-kb:ring-2 focus-kb:ring-primary/30"
                              >
                                {c.label}
                              </button>
                            </Fragment>
                          ))}
                        </nav>
                      )}
                    </div>
                    {canLocate && (
                      <button
                        type="button"
                        onClick={() => handleLocate(selected.key)}
                        aria-label={locateLabel === 'Go to page' ? `Go to the page with ${selected.name}` : `Show ${selected.name} on the page`}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg h-9 px-2.5 text-sm font-medium text-primary bg-white ring-1 ring-inset ring-indigo-100 hover:bg-indigo-50 transition-[background-color,transform] duration-150 active:scale-[0.96] shadow-[0_1px_2px_rgba(16,24,40,0.06)]"
                      >
                        <LocateFixed className="w-4 h-4" />
                        <span className="hidden sm:inline">{locateLabel}</span>
                      </button>
                    )}
                  </div>
                </div>
                <MetricDefinitionSections entry={selected} show size="detail" className="px-4 pt-4" />
                <div className="px-4 pb-5">
                  <GlossaryFeedback metricKey={selected.key} />
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <BookMarked className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Select a metric to see its definition, formula, and a worked example.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ScopeToggle({
  scope,
  setScope,
  pageCount,
  allCount,
}: {
  scope: GlossaryScope;
  setScope: (s: GlossaryScope) => void;
  pageCount: number;
  allCount: number;
}): React.JSX.Element {
  const opts: { value: GlossaryScope; label: string; count: number }[] = [
    { value: 'page', label: 'This page', count: pageCount },
    { value: 'all', label: 'All metrics', count: allCount },
  ];
  return (
    <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5 w-full" role="group" aria-label="Glossary scope">
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setScope(o.value)}
          aria-pressed={scope === o.value}
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-2 min-h-7 text-xs font-medium transition-colors',
            scope === o.value ? 'bg-white text-gray-900 shadow-[0_1px_2px_rgba(16,24,40,0.10)]' : 'text-gray-500 hover:text-gray-700',
          )}
        >
          {o.label}
          <span
            className={cn(
              'inline-flex items-center justify-center rounded-full px-1.5 min-w-5 h-4 text-[10px] font-semibold tabular-nums',
              scope === o.value ? 'bg-indigo-50 text-primary' : 'bg-gray-200 text-gray-500',
            )}
          >
            {o.count}
          </span>
        </button>
      ))}
    </div>
  );
}
