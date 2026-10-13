import { useState, useEffect } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Info, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { getTooltipDefinition } from '@/data/tooltipRegistry';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { useGlossaryStore } from '@/modules/glossary/useGlossaryStore';

interface MetricTooltipProps {
  metricKey: string;
  children: React.ReactNode;
  value?: number;
  className?: string;
}

/**
 * Contextual tooltip for Store Intelligence metrics.
 *
 * Desktop: hover shows Radix Tooltip with rich content.
 * Mobile: tap opens BottomSheet with the same content.
 */
export function MetricTooltip({ metricKey, children, value, className }: MetricTooltipProps) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const definition = getTooltipDefinition(metricKey);
  const openGlossary = useGlossaryStore((s) => s.openGlossary);
  const registerMetric = useGlossaryStore((s) => s.registerMetric);
  const unregisterMetric = useGlossaryStore((s) => s.unregisterMetric);

  useEffect(() => {
    if (!definition) return;
    registerMetric(metricKey, 'table');
    return () => unregisterMetric(metricKey);
  }, [metricKey, definition, registerMetric, unregisterMetric]);

  // Graceful fallback — render children without tooltip if key not found
  if (!definition) {
    return <span className={className}>{children}</span>;
  }

  const openAll = (): void => {
    setSheetOpen(false);
    setTipOpen(false);
    openGlossary(metricKey);
  };

  const thresholdBand = value !== undefined && definition.thresholds
    ? getThresholdBand(value, definition.thresholds)
    : null;

  const tooltipBody = (
    <>
      <p className={cn(isMobile ? 'text-sm text-gray-700' : 'mt-1.5 text-gray-700 text-xs', 'leading-relaxed')}>
        {definition.definition}
      </p>
      <p className={cn(isMobile ? 'text-xs text-gray-500 italic mt-1' : 'mt-1.5 text-gray-500 text-xs leading-relaxed italic')}>
        {definition.interpretation}
      </p>
      {thresholdBand && (
        <div className={cn('mt-2 flex items-center gap-1.5 text-xs rounded px-2 py-1', thresholdBand.colorClasses)}>
          <span className={cn('inline-block w-2 h-2 rounded-full shrink-0', thresholdBand.dotClass)} />
          <span>{thresholdBand.label}</span>
        </div>
      )}
      <div className={cn(isMobile ? 'mt-3 pt-2' : 'mt-2 pt-1.5', 'border-t border-gray-100 flex items-center justify-between text-xs text-gray-400')}>
        <span>{definition.source}</span>
        <span className="shrink-0 ml-2">{definition.refreshFrequency}</span>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={openAll}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline underline-offset-2"
        >
          View all definitions on this page
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setSheetOpen(true); }}
          data-glossary-anchor={metricKey}
          className={cn('inline-flex items-center gap-1', className)}
        >
          {children}
          <Info className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        </button>
        <BottomSheet
          isOpen={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={definition.label}
          maxHeight="50vh"
          footer={<Button variant="outline" className="w-full" onClick={() => setSheetOpen(false)}>Got It</Button>}
        >
          {tooltipBody}
        </BottomSheet>
      </>
    );
  }

  return (
    <TooltipPrimitive.Root delayDuration={300} open={tipOpen} onOpenChange={setTipOpen}>
      <TooltipPrimitive.Trigger asChild>
        <span data-glossary-anchor={metricKey} className={cn('inline-flex items-center gap-1 cursor-default', className)}>
          {children}
          <Info className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        </span>
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="top"
          align="end"
          sideOffset={4}
          className={cn(
            'z-50 bg-white text-gray-900 text-sm rounded-lg shadow-lg max-w-xs',
            'border border-gray-200 px-3 py-2.5',
            'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          )}
        >
          <p className="font-semibold text-gray-900 text-sm leading-tight">{definition.label}</p>
          {tooltipBody}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

// ── Threshold helpers ──────────────────────────────────────────────────

interface ThresholdResult {
  label: string;
  colorClasses: string;
  dotClass: string;
}

function getThresholdBand(
  value: number,
  thresholds: NonNullable<ReturnType<typeof getTooltipDefinition>>['thresholds'],
): ThresholdResult | null {
  if (!thresholds) return null;

  const { green, amber, red } = thresholds;

  if (green && isInBand(value, green)) {
    return {
      label: green.label,
      colorClasses: 'bg-green-50 text-green-700',
      dotClass: 'bg-green-500',
    };
  }

  if (amber && isInBand(value, amber)) {
    return {
      label: amber.label,
      colorClasses: 'bg-amber-50 text-amber-700',
      dotClass: 'bg-amber-500',
    };
  }

  if (red && isInBand(value, red)) {
    return {
      label: red.label,
      colorClasses: 'bg-red-50 text-red-700',
      dotClass: 'bg-red-500',
    };
  }

  return null;
}

function isInBand(value: number, band: { min?: number; max?: number }): boolean {
  const aboveMin = band.min === undefined || value >= band.min;
  const belowMax = band.max === undefined || value <= band.max;
  return aboveMin && belowMax;
}
