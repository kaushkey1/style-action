/**
 * Unified metric-definition resolver for the Metric Glossary.
 *
 * Tooltips in the app are backed by THREE separate registries (intentionally not
 * merged): METRIC_DESCRIPTIONS (InfoHeaderIcon / MetricCard), kpiGlossary
 * (KpiLabel), and tooltipRegistry (MetricTooltip). This resolver normalizes any
 * of them into one shape at read time so the glossary can present them uniformly.
 *
 * Lookup priority: METRIC_DESCRIPTIONS → kpiGlossary → tooltipRegistry.
 */
import { METRIC_DESCRIPTIONS } from './metricDescriptions';
import { kpiGlossary } from './kpiGlossary';
import { tooltipRegistry } from './tooltipRegistry';

export interface ResolvedMetric {
  /** Lookup key (the metricKey / abbr used at the call site). */
  key: string;
  /** Human-readable display name. */
  name: string;
  /** "What this metric means". */
  what: string;
  /** "How we calculate it" — absent for some registries. */
  formula?: string;
  /** Worked example (authored progressively). */
  example?: string;
}

/** Resolve a metric key from any registry into the unified shape. */
export function resolveMetricDefinition(key: string): ResolvedMetric | null {
  const md = METRIC_DESCRIPTIONS[key];
  if (md) {
    return { key, name: key, what: md.tooltip, formula: md.formula, example: md.example };
  }
  const kg = kpiGlossary[key];
  if (kg) {
    return { key, name: kg.name, what: kg.definition, formula: kg.formula, example: kg.example };
  }
  const tt = tooltipRegistry[key];
  if (tt) {
    return { key, name: tt.label, what: tt.definition, example: tt.example };
  }
  return null;
}

/** Every metric key known across all three registries (deduped). */
export function allMetricKeys(): string[] {
  return Array.from(
    new Set([
      ...Object.keys(METRIC_DESCRIPTIONS),
      ...Object.keys(kpiGlossary),
      ...Object.keys(tooltipRegistry),
    ]),
  );
}
