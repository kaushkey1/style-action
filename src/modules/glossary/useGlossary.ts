/**
 * Metric Glossary state hook — derives the grouped, filtered entries the modal
 * renders from the auto-register store + the unified resolver. Owns search + scope.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  resolveMetricDefinition,
  allMetricKeys,
  type ResolvedMetric,
} from '@/data/resolveMetricDefinition';
import { useGlossaryStore, type GlossaryMetricType } from './useGlossaryStore';

/**
 * Feed the glossary breadcrumb's Tab segment. A tabbed page calls this with its
 * active tab label; it's cleared on unmount.
 */
export function useGlossaryTab(tab: string | null | undefined): void {
  const setPageTab = useGlossaryStore((s) => s.setPageTab);
  useEffect(() => {
    setPageTab(tab ?? null);
    return () => setPageTab(null);
  }, [tab, setPageTab]);
}

export type GlossaryScope = 'page' | 'all';

export interface GlossaryEntry extends ResolvedMetric {
  type: GlossaryMetricType;
}

export interface GlossaryGroup {
  type: GlossaryMetricType;
  title: string;
  entries: GlossaryEntry[];
}

export const GLOSSARY_TYPE_LABEL: Record<GlossaryMetricType, string> = {
  kpi: 'KPI',
  table: 'Table',
  chart: 'Chart',
};

const GROUP_TITLE: Record<GlossaryMetricType, string> = {
  kpi: 'KPIs',
  table: 'Table metrics',
  chart: 'Chart metrics',
};
const TYPE_ORDER: GlossaryMetricType[] = ['kpi', 'table', 'chart'];

function matches(entry: GlossaryEntry, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    entry.key.toLowerCase().includes(needle) ||
    entry.name.toLowerCase().includes(needle) ||
    entry.what.toLowerCase().includes(needle) ||
    (entry.formula?.toLowerCase().includes(needle) ?? false) ||
    (entry.example?.toLowerCase().includes(needle) ?? false)
  );
}

interface UseGlossaryResult {
  scope: GlossaryScope;
  setScope: (s: GlossaryScope) => void;
  query: string;
  setQuery: (q: string) => void;
  groups: GlossaryGroup[];
  total: number;
  pageCount: number;
  allCount: number;
}

export function useGlossary(): UseGlossaryResult {
  const mounted = useGlossaryStore((s) => s.mounted);
  const [scope, setScope] = useState<GlossaryScope>('page');
  const [query, setQuery] = useState('');

  const pageEntries = useMemo<GlossaryEntry[]>(
    () =>
      Object.entries(mounted)
        .map(([key, m]) => {
          const r = resolveMetricDefinition(key);
          return r ? { ...r, type: m.type } : null;
        })
        .filter((e): e is GlossaryEntry => e != null),
    [mounted],
  );

  const allEntries = useMemo<GlossaryEntry[]>(
    () =>
      allMetricKeys()
        .map((key) => {
          const r = resolveMetricDefinition(key);
          if (!r) return null;
          return { ...r, type: mounted[key]?.type ?? 'table' };
        })
        .filter((e): e is GlossaryEntry => e != null),
    [mounted],
  );

  const pageCount = pageEntries.length;
  const allCount = allEntries.length;

  const groups = useMemo<GlossaryGroup[]>(() => {
    const source = scope === 'page' ? pageEntries : allEntries;
    const filtered = source.filter((e) => matches(e, query));
    return TYPE_ORDER.map((type) => ({
      type,
      title: GROUP_TITLE[type],
      entries: filtered
        .filter((e) => e.type === type)
        .sort((a, b) => a.name.localeCompare(b.name)),
    })).filter((g) => g.entries.length > 0);
  }, [scope, pageEntries, allEntries, query]);

  const total = useMemo(() => groups.reduce((n, g) => n + g.entries.length, 0), [groups]);

  return { scope, setScope, query, setQuery, groups, total, pageCount, allCount };
}
