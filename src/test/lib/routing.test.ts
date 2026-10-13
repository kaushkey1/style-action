import { describe, it, expect } from 'vitest';
import { getInsightDrillTargets } from '@/lib/routing';
import type { Insight } from '@/modules/store-view/api/insightsApi';

function makeInsight(partial: Partial<Insight>): Insight {
  return {
    id: 'i1', sub_domain: null, title: null, headline: 'h', description: null, detail: '',
    value: null, display_value: null, status: null, metric: null, action: null, tag: null,
    delta: null, value_at_stake_cr: null, decision_owner: null, deadline_days: null, calc: null,
    category: null, relevant_formats: [], relevant_segments: [], metric_name: null,
    metric_value: null, threshold_value: null, breach_pct: null, domain: null,
    recommended_action: null, ...partial,
  };
}

describe('getInsightDrillTargets', () => {
  it('uses category when present (standard row drill)', () => {
    const t = getInsightDrillTargets(makeInsight({ category: 'MEN APPAREL' }), 'review');
    expect(t.length).toBeGreaterThan(0);
    expect(t.some((x) => x.to.includes('category=MEN%20APPAREL'))).toBe(true);
  });

  it('falls back to format when no category/segment', () => {
    const t = getInsightDrillTargets(makeInsight({ relevant_formats: ['TRENDS'], domain: 'Margin' }), 'review');
    expect(t.some((x) => x.to.includes('format=TRENDS'))).toBe(true);
  });

  it('always returns at least one target for a bare domain insight (no empty kebab)', () => {
    const t = getInsightDrillTargets(makeInsight({ sub_domain: 'Inventory' }), 'review');
    expect(t.length).toBeGreaterThanOrEqual(1);
    expect(t.every((x) => x.to !== '')).toBe(true);
  });

  it('never returns an empty array even for an unmapped domain', () => {
    const t = getInsightDrillTargets(makeInsight({ domain: 'Totally Unknown' }), 'review');
    expect(t.length).toBeGreaterThanOrEqual(1);
  });
});
