import { useEffect, useState } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Info, ArrowRight } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { METRIC_DESCRIPTIONS } from '@/data/metricDescriptions';
import { useGlossaryStore, type GlossaryMetricType } from '@/modules/glossary/useGlossaryStore';

interface InfoHeaderIconProps {
  /** The metric key — looks up description from METRIC_DESCRIPTIONS */
  metricKey: string;
  /** Override description instead of looking up from registry */
  description?: string;
  /** Extra line shown after formula (e.g. dynamic data like discount) */
  extra?: string;
  /** Glossary grouping for this tooltip (KPI cards pass "kpi"). Default "table". */
  glossaryType?: GlossaryMetricType;
}

/**
 * Info icon for table headers, KPI cards (via MetricCard), and mobile card labels.
 * - Desktop: hover shows a Radix Tooltip with the metric description + a
 *   "View all definitions on this page" link that opens the Metric Glossary.
 * - Mobile: tap opens a BottomSheet with the description + the same link.
 * - Auto-registers the metric into the glossary store and stamps a
 *   `data-glossary-anchor` so the glossary's "Show on page" can locate it.
 */
export function InfoHeaderIcon({ metricKey, description, extra, glossaryType = 'table' }: InfoHeaderIconProps): React.ReactNode {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const openGlossary = useGlossaryStore((s) => s.openGlossary);

  // Direct lookup → strip parenthetical suffix → case-insensitive — and capture
  // the CANONICAL key so the glossary (which does exact lookups) resolves it too.
  const baseKey = metricKey.replace(/\s*\(.*\)\s*$/, '').trim();
  const canonicalKey =
    METRIC_DESCRIPTIONS[metricKey] ? metricKey
    : METRIC_DESCRIPTIONS[baseKey] ? baseKey
    : Object.keys(METRIC_DESCRIPTIONS).find((k) => k.toLowerCase() === metricKey.toLowerCase())
    ?? Object.keys(METRIC_DESCRIPTIONS).find((k) => k.toLowerCase() === baseKey.toLowerCase())
    ?? null;

  const entry = canonicalKey ? METRIC_DESCRIPTIONS[canonicalKey] : undefined;
  const tooltipText = description ?? entry?.tooltip;
  const formulaText = entry?.formula;

  // Auto-register into the glossary (only when there's a resolvable definition).
  const registerMetric = useGlossaryStore((s) => s.registerMetric);
  const unregisterMetric = useGlossaryStore((s) => s.unregisterMetric);
  useEffect(() => {
    if (!canonicalKey) return;
    registerMetric(canonicalKey, glossaryType);
    return () => unregisterMetric(canonicalKey);
  }, [canonicalKey, glossaryType, registerMetric, unregisterMetric]);

  if (!tooltipText) return null;

  const openAll = (): void => {
    setSheetOpen(false);
    setTipOpen(false);
    openGlossary(canonicalKey ?? undefined);
  };

  // Stamp the locate anchor on the icon. For KPIs, MetricCard also stamps the card
  // root (earlier in the DOM), so locate prefers the whole card; tables use this.
  const anchorAttr = canonicalKey ? { 'data-glossary-anchor': canonicalKey } : {};

  const viewAllLink = (
    <button
      type="button"
      onClick={openAll}
      className="inline-flex items-center gap-1 text-xs font-semibold text-white hover:underline underline-offset-2"
    >
      View all definitions on this page
      <ArrowRight className="w-3 h-3" />
    </button>
  );

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setSheetOpen(true); }}
          className="relative inline-flex shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={`Info about ${metricKey}`}
          {...anchorAttr}
        >
          <span className="absolute -inset-4 lg:hidden" aria-hidden="true" />
          <Info className="w-3.5 h-3.5" />
        </button>
        <BottomSheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={metricKey}
          maxHeight="50vh"
          zIndex={80}
        >
          <p className="text-sm text-gray-700 mb-2">{tooltipText}</p>
          {extra && <p className="text-xs text-gray-600 mb-1">{extra}</p>}
          {formulaText && <p className="text-xs text-gray-500 italic">Formula: {formulaText}</p>}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={openAll}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline underline-offset-2 active:scale-[0.98] transition-transform"
            >
              View all definitions on this page
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </BottomSheet>
      </>
    );
  }

  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root open={tipOpen} onOpenChange={setTipOpen}>
        <TooltipPrimitive.Trigger asChild>
          <button
            type="button"
            className="inline-flex shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={`Info about ${metricKey}`}
            onClick={(e) => e.stopPropagation()}
            {...anchorAttr}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="top"
            sideOffset={6}
            collisionPadding={{ top: 72, bottom: 12, left: 12, right: 12 }}
            className="z-[90] w-64 bg-gray-900 text-white rounded-lg px-3 py-2.5 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          >
            <p className="text-xs text-gray-100 leading-relaxed">{tooltipText}</p>
            {extra && <p className="text-[11px] text-gray-300 mt-1">{extra}</p>}
            {formulaText && <p className="text-[11px] text-gray-400 italic mt-1">Formula: {formulaText}</p>}
            <div className="mt-2 pt-2 border-t border-white/10">{viewAllLink}</div>
            <TooltipPrimitive.Arrow className="fill-gray-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
