import { useEffect, useMemo, useState } from "react";
import { Info, ArrowRight } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { METRIC_DESCRIPTIONS } from "@/data/metricDescriptions";
import { useGlossaryStore } from "@/modules/glossary/useGlossaryStore";

interface TableMetricsInfoProps {
  /** Metric keys to show descriptions for — should match keys in METRIC_DESCRIPTIONS */
  metrics: string[];
}

/**
 * Single info icon that opens a BottomSheet listing all metric descriptions for a table.
 * Place next to table title via SectionHeader title prop.
 *
 * Mobile-only — desktop tables use individual InfoHeaderIcon tooltips on `<th>`. Both
 * surfaces auto-register their metrics into the glossary, so "This page" stays complete
 * on either breakpoint, and the sheet offers a "View all definitions" entry point.
 *
 * Usage:
 *   <SectionHeader title={<>Revenue & Margin <TableMetricsInfo metrics={["Revenue", "Gross Margin", ...]} /></>} />
 */
export function TableMetricsInfo({
  metrics,
}: TableMetricsInfoProps): React.ReactNode {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const openGlossary = useGlossaryStore((s) => s.openGlossary);
  const registerMetric = useGlossaryStore((s) => s.registerMetric);
  const unregisterMetric = useGlossaryStore((s) => s.unregisterMetric);

  // Only metrics that have descriptions are shown (and registered).
  const entries = useMemo(
    () =>
      metrics
        .map((key) => {
          const entry = METRIC_DESCRIPTIONS[key];
          return entry
            ? { key, tooltip: entry.tooltip, formula: entry.formula }
            : null;
        })
        .filter(
          (e): e is { key: string; tooltip: string; formula: string } =>
            e != null,
        ),
    [metrics],
  );

  // Register this table's metrics into the glossary while mounted on mobile (this is
  // the only entry point on small screens). Depend on a stable string key so an inline
  // `metrics` array prop doesn't thrash register/unregister every render.
  const metricsKey = metrics.join("|");
  useEffect(() => {
    if (!isMobile) return;
    const valid = metricsKey
      .split("|")
      .filter((k) => k && METRIC_DESCRIPTIONS[k]);
    for (const k of valid) registerMetric(k, "table");
    return () => {
      for (const k of valid) unregisterMetric(k);
    };
  }, [isMobile, metricsKey, registerMetric, unregisterMetric]);

  // Only render on mobile — desktop uses individual InfoHeaderIcon tooltips on <th>
  if (!isMobile) return null;

  if (entries.length === 0) return null;

  const openAll = (): void => {
    setOpen(false);
    openGlossary();
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="relative inline-flex shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-1 align-middle"
        aria-label="Metric definitions"
      >
        <span className="absolute -inset-4 lg:hidden" aria-hidden="true" />
        <Info className="w-3.5 h-3.5" />
      </button>
      <BottomSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Metric Definitions"
        maxHeight="70vh"
        zIndex={80}
        footer={<Button variant="outline" className="w-full" onClick={() => setOpen(false)}>Got It</Button>}
      >
        <div className="space-y-3">
          {entries.map((e) => (
            <div
              key={e.key}
              className="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
            >
              <p className="text-sm font-medium text-gray-900">{e.key}</p>
              <p className="text-sm text-gray-600 mt-0.5">{e.tooltip}</p>
              {e.formula && (
                <p className="text-xs text-gray-500 italic mt-1">
                  Formula: {e.formula}
                </p>
              )}
            </div>
          ))}
        </div>
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
