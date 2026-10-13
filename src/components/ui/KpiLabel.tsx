import { useEffect, useState } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Info, ArrowRight } from 'lucide-react';
import { kpiGlossary } from '@/data/kpiGlossary';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { BottomSheet } from './BottomSheet';
import { useGlossaryStore, type GlossaryMetricType } from '@/modules/glossary/useGlossaryStore';

interface KpiLabelProps {
  abbr: string;
  className?: string;
  /** Glossary grouping. Default "table" (KpiLabel is mostly used in headers/labels). */
  glossaryType?: GlossaryMetricType;
}

/**
 * Inline KPI abbreviation label with a glossary-aware tooltip.
 * - Desktop: hover shows definition/formula/unit + a "View all definitions" link.
 * - Mobile: tap opens a BottomSheet with the same + link.
 * - Auto-registers the abbr into the glossary and stamps a locate anchor.
 */
export function KpiLabel({ abbr, className, glossaryType = 'table' }: KpiLabelProps): React.ReactNode {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const openGlossary = useGlossaryStore((s) => s.openGlossary);
  const registerMetric = useGlossaryStore((s) => s.registerMetric);
  const unregisterMetric = useGlossaryStore((s) => s.unregisterMetric);
  const entry = kpiGlossary[abbr];

  useEffect(() => {
    if (!entry) return;
    registerMetric(abbr, glossaryType);
    return () => unregisterMetric(abbr);
  }, [abbr, entry, glossaryType, registerMetric, unregisterMetric]);

  if (!entry) {
    return <span className={className}>{abbr}</span>;
  }

  const openAll = (): void => {
    setSheetOpen(false);
    setTipOpen(false);
    openGlossary(abbr);
  };

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setSheetOpen(true); }}
          aria-label={`About ${entry.name}`}
          data-glossary-anchor={abbr}
          className={cn('relative inline-flex items-center gap-1', className)}
        >
          <span className="absolute -inset-y-4 -inset-x-1 lg:hidden" aria-hidden="true" />
          {abbr}
          <Info className="h-3 w-3 text-gray-400 shrink-0" />
        </button>
        <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title={entry.name} maxHeight="50vh" zIndex={80}>
          <p className="text-sm text-gray-700 mb-1">{entry.definition}</p>
          {entry.formula && <p className="text-xs text-gray-500 italic">Formula: {entry.formula}</p>}
          {entry.uom && <p className="text-xs text-gray-500">Unit: {entry.uom}</p>}
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
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root open={tipOpen} onOpenChange={setTipOpen}>
        <TooltipPrimitive.Trigger asChild>
          <span data-glossary-anchor={abbr} className={cn('inline-flex items-center gap-1 cursor-help', className)}>
            {abbr}
            <Info className="h-3 w-3 text-gray-400 shrink-0" />
          </span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="top"
            sideOffset={6}
            className="z-[90] w-64 bg-gray-900 text-white rounded-lg px-3 py-2.5 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          >
            <p className="font-medium text-white">{entry.name}</p>
            <p className="text-gray-100 text-xs mt-0.5 leading-relaxed">{entry.definition}</p>
            {entry.formula && <p className="text-gray-400 text-[11px] italic mt-1">Formula: {entry.formula}</p>}
            {entry.uom && <p className="text-gray-400 text-[11px] mt-0.5">Unit: {entry.uom}</p>}
            <div className="mt-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={openAll}
                className="inline-flex items-center gap-1 text-xs font-semibold text-white hover:underline underline-offset-2"
              >
                View all definitions on this page
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <TooltipPrimitive.Arrow className="fill-gray-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
