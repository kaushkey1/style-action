// ── AI Briefs Mock Data ──
// Contextual AI summaries keyed to filter combinations

export interface AIBrief {
  id: string;
  filterContext: string;
  title: string;
  summary: string;
  topActions: string[];
  generatedDate: string;
}

export const aiBriefs: Record<string, AIBrief> = {
  all: {
    id: 'brief-all',
    filterContext: 'all',
    title: 'Network Intelligence Summary',
    summary:
      'Across the full network, twin-gap analysis identifies 4 stores with SPSF gaps exceeding 150, representing a combined annual uplift opportunity of 28.4 Cr. Competitive positioning remains strong in metro clusters (C1, C6) but deteriorating in suburban formats (C3, C5) where value competitors are gaining share.',
    topActions: [
      'Prioritize Kolkata Quest Mall and Hyderabad Inorbit for immediate twin-gap interventions -- combined monthly uplift of 11.4 L.',
      'Accelerate category expansion recommendations for 5 stores with pending ethnic/western reallocation proposals.',
      'Review 3 pending reclassification triggers before Q2 planning cycle closes.',
    ],
    generatedDate: '2026-03-05T06:00:00Z',
  },
  west: {
    id: 'brief-west',
    filterContext: 'west',
    title: 'West Region Intelligence',
    summary:
      'West region stores (Mumbai, Pune, Ahmedabad) show strong competitive positioning with an average comp gap of 66/100. Mumbai Phoenix Mall leads in demand index but faces size availability pressure in Women\'s Western. Pune benefits from SmartBazaar adjacency driving cross-format traffic.',
    topActions: [
      'Address Mumbai Phoenix Mall WW size curve -- M size OOS is costing an estimated 2.4 L/month in lost sales.',
      'Leverage Pune SmartBazaar cross-traffic (1.10x multiplier) with expanded value segment options.',
      'Improve Ahmedabad newness cadence -- current refresh rate trails Westside CG Road by 13pp.',
    ],
    generatedDate: '2026-03-05T06:00:00Z',
  },
  south: {
    id: 'brief-south',
    filterContext: 'south',
    title: 'South Region Intelligence',
    summary:
      'South region stores (Bangalore, Chennai, Hyderabad) display divergent performance. Bangalore UB City is a network leader with the highest affluence score (85) and fashion-forward index (86). Chennai needs ethnic-first positioning while Hyderabad faces growing competitive pressure from a new Westside opening.',
    topActions: [
      'Expand Bangalore UB City WW allocation from 20% to 26% -- IT professional persona at 25% supports growth.',
      'Shift Chennai Express Avenue to ethnic-first positioning aligned with catchment family index of 72.',
      'Expedite Hyderabad size availability fix -- 11pp gap vs Pantaloons is the largest in the network.',
    ],
    generatedDate: '2026-03-05T06:00:00Z',
  },
  C1: {
    id: 'brief-c1',
    filterContext: 'C1',
    title: 'Metro Fashion Hub Cluster',
    summary:
      'C1 cluster stores (120 units) are the network\'s premium engines with avg SPSF of 892 and the highest competitive intensity. Twin-gap analysis shows these stores can collectively unlock 15.2 Cr annual uplift through better size accuracy and fashion mix optimization. Premium positioning is well-supported by catchment affluence averaging 76.',
    topActions: [
      'Standardize premium mix at 35%+ across C1 stores -- current 27% underserves the affluent catchment.',
      'Roll out improved WW size curves network-wide starting with C1 pilot -- projected 8-12% SPSF improvement.',
      'Close VM quality gap vs aspirational competitors (Zara, H&M) in top 5 C1 locations.',
    ],
    generatedDate: '2026-03-05T06:00:00Z',
  },
  C3: {
    id: 'brief-c3',
    filterContext: 'C3',
    title: 'Suburban Family Cluster',
    summary:
      'C3 Suburban Family stores (250 units) serve family-dominant catchments with high ethnic demand. Competitive intensity is low, creating opportunity for category ownership. However, option breadth in kids-wear and ethnic segments lags behind Pantaloons in overlapping catchments, risking share erosion.',
    topActions: [
      'Expand kids-wear allocation in C3 stores with family index above 75 -- 18 stores identified.',
      'Increase ethnic option depth by 15-20% to establish category ownership before competition enters.',
      'Reduce western/formal allocation in stores where fashion-forward score is below 50.',
    ],
    generatedDate: '2026-03-05T06:00:00Z',
  },
  'A+': {
    id: 'brief-aplus',
    filterContext: 'A+',
    title: 'A+ Grade Stores Overview',
    summary:
      'A+ stores (Mumbai, Delhi, Bangalore) are the network\'s top performers but show meaningful twin-gap variance. Mumbai and Delhi have SPSF gaps of 125 and 62 respectively, while Bangalore operates closest to its twin benchmark. All three face high-intensity competition from aspirational brands (Zara, H&M) requiring continuous assortment and VM investment.',
    topActions: [
      'Close Mumbai Phoenix twin gap through WW expansion and size curve correction -- 5.8 L/month uplift potential.',
      'Invest in Delhi Select Citywalk VM refresh to match Zara adjacency standards and improve dwell time.',
      'Use Bangalore UB City as the C6 cluster benchmark for premium positioning playbook.',
    ],
    generatedDate: '2026-03-05T06:00:00Z',
  },
  'at-risk': {
    id: 'brief-atrisk',
    filterContext: 'at-risk',
    title: 'At-Risk Stores Alert',
    summary:
      'Stores with competitive gap scores below 60 require urgent intervention. Kolkata Quest Mall (gap: 42) faces the most severe positioning challenge with option breadth deficit of 180 vs Pantaloons and declining footfall. Hyderabad Inorbit (gap: 55) is under pressure from a newly opened Westside competitor within 1km.',
    topActions: [
      'Fast-track Kolkata option breadth expansion -- add 120 options in ethnic and kids-wear within 4 weeks.',
      'Initiate Hyderabad competitive response: size availability fix + ethnic expansion to differentiate vs new Westside.',
      'Evaluate reclassification for both stores -- current grade assignments may overstate catchment potential.',
    ],
    generatedDate: '2026-03-05T06:00:00Z',
  },
};

/**
 * Resolve filter state to the best matching AI brief.
 * Checks in priority order: gapFilter, clusterFilter, gradeFilter, fallback to "all".
 */
export function getAIBrief(
  gradeFilter: string,
  clusterFilter: string,
  gapFilter: string
): AIBrief {
  // Gap filter takes highest priority
  if (gapFilter === 'at-risk') return aiBriefs['at-risk']!;

  // Cluster filter next
  if (clusterFilter !== 'all' && aiBriefs[clusterFilter]) return aiBriefs[clusterFilter]!;

  // Grade filter
  if (gradeFilter !== 'all' && aiBriefs[gradeFilter]) return aiBriefs[gradeFilter]!;

  // Fallback
  return aiBriefs['all']!;
}
