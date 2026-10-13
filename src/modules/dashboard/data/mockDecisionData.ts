/**
 * Decision Card enrichment data — overlaid onto S1 exceptions from mockExceptions.ts
 * to create the Decision Queue. Each entry maps an exception ID to additional
 * fields needed for the Decision Card UI.
 */

export interface DecisionCardFields {
  threshold: number;
  thresholdDirection: 'above' | 'below';
  metricValue: number;
  metricUnit: string;
  primaryActionLabel: string;
  procuroDeepLink: string | null;
  hasDrilldown: boolean;
  agentId: string;
  agentRecommendationFull: string;
  financialImpactFormatted: string;
}

/** S1 exceptions enriched with decision card data — ordered by financial impact desc */
export const decisionCardOverrides: Record<string, DecisionCardFields> = {
  // Fabric delay cascade risk — ₹2.1 Cr
  'a1b2c3d4-e001-4a5b-8c6d-7e8f9a0b1c2d': {
    threshold: 10.5,
    thresholdDirection: 'above',
    metricValue: 13.85,
    metricUnit: '%',
    primaryActionLabel: 'Approve Re-route',
    procuroDeepLink: null,
    hasDrilldown: true,
    agentId: 'VS4',
    agentRecommendationFull:
      'Re-route pending orders to backup supplier (Vendor V-012). Estimated transit: 3 days vs 14-day delay. Cost differential: ₹0.8 Cr but prevents ₹2.1 Cr revenue loss across 50 stores.',
    financialImpactFormatted: '₹2.1 Cr',
  },
  // OTB breach on Menswear Casual — ₹3.3 Cr
  'a1b2c3d4-e002-4a5b-8c6d-7e8f9a0b1c2d': {
    threshold: 100,
    thresholdDirection: 'above',
    metricValue: 107,
    metricUnit: '%',
    primaryActionLabel: 'Approve Reallocation',
    procuroDeepLink: '/procuro/pos?batch=MW-CASUAL-2026',
    hasDrilldown: true,
    agentId: 'A11',
    agentRecommendationFull:
      'Reallocate ₹33 Cr from WWW Pod 1 (at 82% utilization) to Menswear Casual. 23 POs currently blocked. Without action, 4 key styles miss the season window entirely.',
    financialImpactFormatted: '₹3.3 Cr',
  },
  // NOOS Stockout — Classic White Oxford
  'EXC-INV-001': {
    threshold: 0,
    thresholdDirection: 'below',
    metricValue: 0,
    metricUnit: 'units',
    primaryActionLabel: 'Approve Replenishment',
    procuroDeepLink: null,
    hasDrilldown: true,
    agentId: 'A4',
    agentRecommendationFull:
      'Emergency DC replenishment dispatched for 6 A+/A1 stores. 480 units available at Bhiwandi DC. Estimated delivery: 48 hours. NOOS style — cannot afford stockout.',
    financialImpactFormatted: '₹4.8 L',
  },
  // OTB Budget Breach — MW Pod 3
  'EXC-OTB-001': {
    threshold: 100,
    thresholdDirection: 'above',
    metricValue: 107,
    metricUnit: '%',
    primaryActionLabel: 'Approve Budget Extension',
    procuroDeepLink: '/procuro/pos?batch=MW-POD3-TSHIRTS',
    hasDrilldown: true,
    agentId: 'A11',
    agentRecommendationFull:
      'Extend Pod 3 T-Shirts OTB by 7% (₹2.3 Cr). Strong sell-through at 78% justifies the overshoot. Without extension, 12 high-velocity styles will not be replenished.',
    financialImpactFormatted: '₹2.3 Cr',
  },
};

/**
 * Critical KPI cards that appear in the Decision Queue alongside S1 exceptions.
 * These are KPIs in critical status that directly block Revenue vs AOP.
 */
export interface CriticalKpiDecision {
  id: string;
  domain: string;
  title: string;
  metricValue: number;
  metricUnit: string;
  threshold: number;
  thresholdDirection: 'above' | 'below';
  financialImpact: number;
  financialImpactFormatted: string;
  agentRecommendation: string;
  agentId: string;
  primaryActionLabel: string;
  triggeredAt: string;
  relativeTime: string;
  hasDrilldown: boolean;
}

export const criticalKpiDecisions: CriticalKpiDecision[] = [
  {
    id: 'kpi-aged-inventory',
    domain: 'Aged Inventory',
    title: '₹262 Cr trapped in stock older than 180 days',
    metricValue: 13.85,
    metricUnit: '%',
    threshold: 10.5,
    thresholdDirection: 'above',
    financialImpact: 262_00_00_000,
    financialImpactFormatted: '₹262 Cr',
    agentRecommendation:
      'Accelerate markdown on the oldest 50,000 options across 206,000 aged styles. Estimated markdown cost: ₹18 Cr. Without action, aged stock reaches ~16% within 60 days.',
    agentId: 'A9',
    primaryActionLabel: 'Approve Markdown',
    triggeredAt: '2026-04-05T01:30:00',
    relativeTime: '6h ago',
    hasDrilldown: true,
  },
  {
    id: 'kpi-revenue-run-rate',
    domain: 'Revenue Run Rate',
    title: 'Revenue tracking ₹26 Cr/day below AOP target',
    metricValue: 74,
    metricUnit: 'Cr/day',
    threshold: 100,
    thresholdDirection: 'below',
    financialImpact: 26_00_00_000,
    financialImpactFormatted: '₹26 Cr/day gap',
    agentRecommendation:
      'Activate flash promotion on 3 top categories (Menswear, Women Western, Kids). Projected uplift: ₹8-12 Cr/day. Kids Wear and Fashion Factory are the primary drags.',
    agentId: 'A12',
    primaryActionLabel: 'Review Promotion',
    triggeredAt: '2026-04-05T03:00:00',
    relativeTime: '4h ago',
    hasDrilldown: true,
  },
];
