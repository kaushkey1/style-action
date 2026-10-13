/**
 * Metric Glossary store (Zustand).
 *
 * Auto-registration: every metric tooltip (InfoHeaderIcon / MetricCard / KpiLabel /
 * MetricTooltip) calls registerMetric on mount and unregisterMetric on unmount, so
 * `mounted` always reflects the metrics currently on screen ("this page"). Tooltips
 * only call the actions (they never select state), so registering never re-renders
 * them — only the open glossary modal reads `mounted`.
 */
import { create } from 'zustand';

export type GlossaryMetricType = 'kpi' | 'table' | 'chart';

interface RegisteredMetric {
  type: GlossaryMetricType;
  refs: number;
}

interface GlossaryState {
  /** Metrics currently mounted on the page, ref-counted ("this page" scope). */
  mounted: Record<string, RegisteredMetric>;
  registerMetric: (key: string, type: GlossaryMetricType) => void;
  unregisterMetric: (key: string) => void;

  /** Active tab label of the current page (kept for "this page" context). */
  pageTab: string | null;
  setPageTab: (tab: string | null) => void;

  /** Modal state. */
  isOpen: boolean;
  initialKey: string | null;
  openGlossary: (key?: string) => void;
  closeGlossary: () => void;
}

// When a metric is registered under multiple types (e.g. a KPI that's also a
// table column), keep the most prominent type.
const TYPE_RANK: Record<GlossaryMetricType, number> = { kpi: 3, chart: 2, table: 1 };

export const useGlossaryStore = create<GlossaryState>((set) => ({
  mounted: {},

  registerMetric: (key, type) =>
    set((s) => {
      const existing = s.mounted[key];
      if (existing) {
        const bestType = TYPE_RANK[type] > TYPE_RANK[existing.type] ? type : existing.type;
        return { mounted: { ...s.mounted, [key]: { type: bestType, refs: existing.refs + 1 } } };
      }
      return { mounted: { ...s.mounted, [key]: { type, refs: 1 } } };
    }),

  unregisterMetric: (key) =>
    set((s) => {
      const existing = s.mounted[key];
      if (!existing) return s;
      if (existing.refs <= 1) {
        const next = { ...s.mounted };
        delete next[key];
        return { mounted: next };
      }
      return { mounted: { ...s.mounted, [key]: { ...existing, refs: existing.refs - 1 } } };
    }),

  pageTab: null,
  setPageTab: (tab) => set({ pageTab: tab }),

  isOpen: false,
  initialKey: null,
  openGlossary: (key) => set({ isOpen: true, initialKey: key ?? null }),
  closeGlossary: () => set({ isOpen: false }),
}));

/**
 * Register a metric for the lifetime of the calling component.
 * Returns an unregister function for useEffect cleanup.
 */
export function registerGlossaryMetric(key: string, type: GlossaryMetricType): () => void {
  useGlossaryStore.getState().registerMetric(key, type);
  return () => useGlossaryStore.getState().unregisterMetric(key);
}
