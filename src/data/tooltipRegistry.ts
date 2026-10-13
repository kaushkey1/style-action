/**
 * Tooltip Registry — structured definitions for all Store Intelligence metrics.
 *
 * Each entry provides a human-readable definition, interpretation guidance,
 * optional RAG thresholds, data source, and refresh frequency. Used by the
 * MetricTooltip component to render contextual help on hover.
 */

export interface TooltipThresholdBand {
  min?: number;
  max?: number;
  label: string;
}

export interface TooltipDefinition {
  metricKey: string;
  label: string;
  definition: string;
  interpretation: string;
  thresholds?: {
    green?: TooltipThresholdBand;
    amber?: TooltipThresholdBand;
    red?: TooltipThresholdBand;
  };
  source: string;
  refreshFrequency: string;
  /** Worked example for the Metric Glossary (authored progressively). */
  example?: string;
}

export const tooltipRegistry: Record<string, TooltipDefinition> = {
  // ── Network Overview Columns ────────────────────────────────────────

  compGap: {
    metricKey: 'compGap',
    label: 'Competitive Gap Score',
    definition:
      'Composite score (0-100) measuring how well a store\'s assortment competes with nearby rivals across six dimensions: option breadth, price ladder, size availability, newness cadence, VM display, and digital presence.',
    interpretation:
      'Higher is better. A score below 60 indicates meaningful gaps that competitors are exploiting. Above 75 signals a strong competitive position in the catchment.',
    thresholds: {
      green: { min: 75, label: 'Leader / Competitive' },
      amber: { min: 50, max: 74, label: 'Gap exists — review dimensions' },
      red: { max: 49, label: 'At risk — competitors outperforming' },
    },
    source: 'Competitive Intelligence Engine (field surveys + POS benchmarks)',
    refreshFrequency: 'Monthly',
  },

  twinGap: {
    metricKey: 'twinGap',
    label: 'Twin Gap',
    definition:
      'The difference in Sales Per Square Foot (SPSF) between this store and its best-performing peer (digital twin) within the same cluster. Expressed in absolute rupees.',
    interpretation:
      'A positive gap means the store is underperforming relative to what a similar store achieves. The larger the gap, the greater the unrealized revenue potential from operational and assortment improvements.',
    thresholds: {
      green: { max: 50, label: 'Within range of best peer' },
      amber: { min: 51, max: 150, label: 'Moderate gap — improvement possible' },
      red: { min: 151, label: 'Significant underperformance vs twin' },
    },
    source: 'Twin Analysis Engine (cluster-matched peer comparison)',
    refreshFrequency: 'Weekly',
  },

  uplift: {
    metricKey: 'uplift',
    label: 'Revenue Uplift',
    definition:
      'Annualized revenue potential (in Crores) if the store closes the gap to its best-performing twin across all key operational metrics: SPSF, GMROF, sell-through, and size accuracy.',
    interpretation:
      'This is not a forecast — it is the ceiling of improvement if best-peer practices were replicated. Use it to prioritize which stores receive investment and intervention first.',
    source: 'Twin Analysis Engine (gap-to-revenue model)',
    refreshFrequency: 'Weekly',
  },

  growthYoY: {
    metricKey: 'growthYoY',
    label: 'Growth Year-over-Year',
    definition:
      'Total revenue growth for a category at this store compared to the same period last year. Includes all factors: new floor space, changed assortment, pricing changes, and organic demand shifts.',
    interpretation:
      'Shows overall category momentum including expansion effects. Compare with LFL Growth to isolate how much growth came from organic performance vs structural changes (e.g., more space or options added).',
    thresholds: {
      green: { min: 10, label: 'Strong total growth' },
      amber: { min: 0, max: 9.9, label: 'Moderate / flat growth' },
      red: { max: -0.1, label: 'Declining — investigate drivers' },
    },
    source: 'POS data (total category revenue comparison)',
    refreshFrequency: 'Weekly',
  },

  cdi: {
    metricKey: 'cdi',
    label: 'Category Demand Index',
    definition:
      'Average revenue index across all categories at a store, benchmarked against the network average (1.0 = network average). Derived from the salesIndex field of each category\'s demand profile.',
    interpretation:
      'Above 1.0 means the store outperforms the network on average demand intensity. Below 0.9 signals weak demand that may require assortment or marketing intervention.',
    thresholds: {
      green: { min: 1.1, label: 'Above-average demand' },
      amber: { min: 0.9, max: 1.09, label: 'In line with network' },
      red: { max: 0.89, label: 'Below-average demand' },
    },
    source: 'Demand Intelligence (POS + footfall data)',
    refreshFrequency: 'Weekly',
  },

  lflGrowth: {
    metricKey: 'lflGrowth',
    label: 'Like-for-Like Growth',
    definition:
      'Year-over-year revenue growth for the store, excluding the effect of new store openings, closures, or major refurbishments. Measures organic performance improvement.',
    interpretation:
      'Positive LFL growth indicates the store is growing its customer base or increasing spend per visit. Negative LFL in a growing catchment warrants investigation into assortment fit or competitive pressure.',
    thresholds: {
      green: { min: 8, label: 'Strong organic growth' },
      amber: { min: 0, max: 7.9, label: 'Moderate / flat growth' },
      red: { max: -0.1, label: 'Declining — investigate root cause' },
    },
    source: 'POS data (same-store, same-period comparison)',
    refreshFrequency: 'Weekly',
  },

  fashionPct: {
    metricKey: 'fashionPct',
    label: 'Fashion %',
    definition:
      'Proportion of the store\'s assortment and revenue classified as "fashion" (trend-driven, seasonal styles) versus "basics" (core, evergreen styles). Expressed as a percentage of total revenue.',
    interpretation:
      'Higher fashion percentage correlates with higher margins but requires faster sell-through. A store with high catchment Fashion Forwardness but low Fashion % is likely missing margin opportunity.',
    thresholds: {
      green: { min: 25, label: 'Fashion-forward mix' },
      amber: { min: 18, max: 24, label: 'Balanced basics/fashion' },
      red: { max: 17, label: 'Basics-heavy — review catchment fit' },
    },
    source: 'Range Planning (style classification + POS)',
    refreshFrequency: 'Monthly',
  },

  threatLevel: {
    metricKey: 'threatLevel',
    label: 'Competitive Threat Level',
    definition:
      'Qualitative assessment of competitive pressure based on the number, proximity, and quality of nearby competitor stores. Derived from the gravity model combining distance, estimated SPSF, and category overlap.',
    interpretation:
      'High threat means multiple strong competitors within the immediate catchment. It does not mean the store is losing — it means the store must work harder to retain share. Low threat stores may have pricing power but less growth upside.',
    source: 'Competitive Intelligence Engine (gravity model)',
    refreshFrequency: 'Monthly',
  },

  affluence: {
    metricKey: 'affluence',
    label: 'Catchment Affluence Score',
    definition:
      'Index (0-100) measuring the spending power of the store\'s catchment population. Derived from household income data, property values, vehicle ownership, and credit card spend patterns within a 3km radius.',
    interpretation:
      'Higher scores justify deeper premium inventory and higher average MRPs. Stores with high affluence but low ASP may be under-trading on price positioning.',
    thresholds: {
      green: { min: 70, label: 'High spending power' },
      amber: { min: 50, max: 69, label: 'Moderate spending power' },
      red: { max: 49, label: 'Value-conscious catchment' },
    },
    source: 'Catchment Analytics (census + third-party data)',
    refreshFrequency: 'Quarterly',
  },

  youthIndex: {
    metricKey: 'youthIndex',
    label: 'Youth Index',
    definition:
      'Index (0-100) measuring the concentration of 18-35 year old consumers in the store\'s catchment. Based on census demographics, college proximity, IT/corporate park adjacency, and social media activity.',
    interpretation:
      'High youth index stores should carry more western wear, casual fashion, and trend-driven collections. These customers are also more responsive to social media and influencer-driven merchandising.',
    thresholds: {
      green: { min: 65, label: 'Youth-dominated catchment' },
      amber: { min: 45, max: 64, label: 'Mixed age profile' },
      red: { max: 44, label: 'Older-skewing catchment' },
    },
    source: 'Catchment Analytics (census + footfall demographics)',
    refreshFrequency: 'Quarterly',
  },

  familyIndex: {
    metricKey: 'familyIndex',
    label: 'Family Index',
    definition:
      'Index (0-100) measuring the proportion of family shoppers (parents with children) in the catchment. Based on school density, residential composition, and basket composition data.',
    interpretation:
      'High family index stores should emphasize kids wear, family-size packs, and occasion-wear (festivals, weddings). These stores typically have higher basket sizes but lower visit frequency.',
    thresholds: {
      green: { min: 65, label: 'Family-heavy catchment' },
      amber: { min: 45, max: 64, label: 'Mixed shopper profile' },
      red: { max: 44, label: 'Individual / couple shoppers' },
    },
    source: 'Catchment Analytics (census + POS basket data)',
    refreshFrequency: 'Quarterly',
  },

  fashionForwardness: {
    metricKey: 'fashionForwardness',
    label: 'Fashion Forwardness',
    definition:
      'Index (0-100) measuring the catchment\'s appetite for trend-driven, fast-fashion products. Derived from early-adoption patterns, social media engagement, competitor fashion mix in the area, and new style sell-through velocity.',
    interpretation:
      'High scores mean the catchment rewards newness and trend. Stores with high Fashion Forwardness should receive new drops first and carry a higher fashion-to-basics ratio.',
    thresholds: {
      green: { min: 70, label: 'Trend-hungry catchment' },
      amber: { min: 50, max: 69, label: 'Moderate fashion appetite' },
      red: { max: 49, label: 'Basics-first preference' },
    },
    source: 'Catchment Analytics (POS velocity + social signals)',
    refreshFrequency: 'Monthly',
  },

  destinationScore: {
    metricKey: 'destinationScore',
    label: 'Destination Score',
    definition:
      'Index (0-100) measuring the store\'s pull as a shopping destination rather than a convenience stop. Based on average travel distance of customers, dwell time, basket size, and cross-category purchase frequency.',
    interpretation:
      'High destination scores mean customers travel specifically to visit this store. These stores can support wider assortments and premium pricing. Low scores indicate the store is primarily serving walk-by traffic.',
    thresholds: {
      green: { min: 80, label: 'Strong destination pull' },
      amber: { min: 65, max: 79, label: 'Moderate draw' },
      red: { max: 64, label: 'Convenience / walk-by driven' },
    },
    source: 'Customer Analytics (loyalty + location data)',
    refreshFrequency: 'Monthly',
  },

  // ── Store Detail Metrics ────────────────────────────────────────────

  compGapRadar: {
    metricKey: 'compGapRadar',
    label: 'Competitive Gap Radar',
    definition:
      'Radar chart showing the store\'s competitive position across six dimensions: Option Breadth, Price Ladder, Size Availability, Newness Cadence, VM Display, and Digital Presence. Each axis is scored 0-100 relative to the strongest competitor in the catchment.',
    interpretation:
      'Look for "dents" in the radar — dimensions where the store significantly trails competitors. These are the highest-priority gaps for intervention. A balanced but low shape suggests systemic issues; an uneven shape suggests specific category or operational gaps.',
    source: 'Competitive Intelligence Engine (multi-dimensional benchmark)',
    refreshFrequency: 'Monthly',
  },

  competitiveIntensity: {
    metricKey: 'competitiveIntensity',
    label: 'Competitive Intensity',
    definition:
      'Gravity-model score measuring the combined competitive pressure on a store. Accounts for the number of competitors, their proximity (distance decay), their estimated SPSF (revenue strength), and category overlap with our assortment.',
    interpretation:
      'High intensity does not automatically mean poor performance — it means the market is contested and the store must continuously earn its share. Stores with high intensity and high Competitive Gap Score are performing well despite pressure.',
    source: 'Competitive Intelligence Engine (gravity model calculation)',
    refreshFrequency: 'Monthly',
  },

  sellThrough: {
    metricKey: 'sellThrough',
    label: '30-Day Sell Through Rate',
    definition:
      'Percentage of inventory received in the last 30 days that has been sold. Measures how quickly new inventory converts to revenue at the store level.',
    interpretation:
      'Higher sell-through indicates strong product-market fit and effective visual merchandising. Below 60% suggests over-buying, poor assortment match, or weak in-store execution. Above 80% may indicate under-stocking — customers may be facing stockouts.',
    thresholds: {
      green: { min: 70, label: 'Healthy conversion' },
      amber: { min: 55, max: 69, label: 'Moderate — review assortment fit' },
      red: { max: 54, label: 'Slow-moving inventory risk' },
    },
    source: 'Inventory Management System (receipts vs revenue)',
    refreshFrequency: 'Daily',
  },

  gmrof: {
    metricKey: 'gmrof',
    label: 'Gross Margin Return on Footage',
    definition:
      'Profitability metric measuring the gross margin earned per square foot of selling space. Combines both revenue productivity and margin quality into a single measure.',
    interpretation:
      'GMROF above 400 Rs/sft indicates efficient use of selling space. Below 300 suggests the space is under-earning — either through low revenue, low margins, or both. Compare within cluster to identify relative under/over-performers.',
    thresholds: {
      green: { min: 400, label: 'Efficient space utilization' },
      amber: { min: 300, max: 399, label: 'Moderate — review category mix' },
      red: { max: 299, label: 'Under-earning floor space' },
    },
    source: 'Finance + Space Planning (margin data / selling area)',
    refreshFrequency: 'Weekly',
  },

  basketDepth: {
    metricKey: 'basketDepth',
    label: 'Basket Depth Score',
    definition:
      'Average number of items per transaction, normalized against the cluster average. Measures the store\'s effectiveness at cross-selling and building larger baskets.',
    interpretation:
      'A score above 2.5 suggests effective cross-merchandising and visual display. Below 2.0 may indicate poor adjacencies, narrow assortment, or a convenience-shopping pattern. Improving basket depth is typically the fastest path to revenue growth without new footfall.',
    thresholds: {
      green: { min: 2.5, label: 'Strong cross-sell' },
      amber: { min: 2.0, max: 2.4, label: 'Average basket size' },
      red: { max: 1.9, label: 'Low cross-sell — review adjacencies' },
    },
    source: 'POS data (items per transaction)',
    refreshFrequency: 'Weekly',
  },

  newnessAbsorption: {
    metricKey: 'newnessAbsorption',
    label: 'Newness Absorption Rate',
    definition:
      'Percentage of new product introductions (last 30 days) that achieved target sell-through within their first lifecycle window. Measures how well the store\'s customer base responds to new merchandise.',
    interpretation:
      'Above 75% means the customer base actively seeks and buys new arrivals. Below 60% suggests the store may be receiving product that doesn\'t match local demand — either wrong categories, wrong price points, or insufficient awareness (VM/marketing).',
    thresholds: {
      green: { min: 75, label: 'Strong newness uptake' },
      amber: { min: 60, max: 74, label: 'Moderate absorption' },
      red: { max: 59, label: 'New product resistance — check fit' },
    },
    source: 'Demand Intelligence (new SKU performance tracking)',
    refreshFrequency: 'Weekly',
  },

  customerLoyalty: {
    metricKey: 'customerLoyalty',
    label: 'Customer Loyalty Index',
    definition:
      'Composite index measuring the store\'s ability to retain and grow its customer base. Combines repeat purchase rate, 90-day active customer count vs grade average, churn rate, and visit frequency.',
    interpretation:
      'Above 65 indicates a healthy, sticky customer base. Below 50 means the store is losing customers faster than it acquires them — typically due to inconsistent experience, stockouts, or a better competitor alternative nearby.',
    thresholds: {
      green: { min: 65, label: 'Loyal customer base' },
      amber: { min: 50, max: 64, label: 'Moderate retention' },
      red: { max: 49, label: 'High churn — investigate causes' },
    },
    source: 'Customer Analytics (loyalty program + POS matching)',
    refreshFrequency: 'Monthly',
  },

  sizeAccuracy: {
    metricKey: 'sizeAccuracy',
    label: 'Size Curve Accuracy',
    definition:
      'Percentage match between the size curve of inventory allocated to the store and the actual size demand pattern of its customers. Measures how well supply aligns with the specific size profile of local demand.',
    interpretation:
      'Above 85% means the size mix closely matches what customers want. Below 80% means meaningful lost revenue due to size stockouts — the store has inventory, but not in the sizes customers need. This is often the single largest source of preventable lost revenue.',
    thresholds: {
      green: { min: 85, label: 'Well-matched size curve' },
      amber: { min: 75, max: 84, label: 'Minor mismatches — optimize' },
      red: { max: 74, label: 'Significant lost revenue risk' },
    },
    source: 'Allocation Engine (planned vs actual size demand)',
    refreshFrequency: 'Weekly',
  },

  percentOfBest: {
    metricKey: 'percentOfBest',
    label: '% of Best Period',
    definition:
      'Current period revenue as a percentage of the store\'s historical best-performing period. Indicates how close the store is to operating at its proven peak capacity.',
    interpretation:
      'Above 90% means the store is near its demonstrated peak. Between 75-90% is typical for non-peak seasons. Below 75% during what should be a strong period (festive, seasonal) warrants investigation into what changed — competition, assortment, or customer behavior.',
    thresholds: {
      green: { min: 90, label: 'Near peak performance' },
      amber: { min: 75, max: 89, label: 'Within seasonal range' },
      red: { max: 74, label: 'Well below proven capacity' },
    },
    source: 'POS data (historical peak comparison)',
    refreshFrequency: 'Weekly',
  },

  demandSignal: {
    metricKey: 'demandSignal',
    label: 'Demand Signal Strength',
    definition:
      'Qualitative assessment of demand momentum for a category at a store. Combines revenue velocity trend, footfall-to-conversion ratio, search/browse data (where available), and seasonal pattern alignment.',
    interpretation:
      '"Very Strong" or "Strong" signals indicate categories worth investing in — more inventory, more options, better placement. "Declining" signals should trigger investigation: is the category dying locally, or is a competitor capturing the demand?',
    source: 'Demand Intelligence (multi-signal composite)',
    refreshFrequency: 'Weekly',
  },

  salesIndex: {
    metricKey: 'salesIndex',
    label: 'Revenue Index',
    definition:
      'Category demand index relative to the network average for the same period. A value of 1.0 means at par with network; above 1.0 means stronger local demand.',
    interpretation:
      'Use this to compare category strength across stores independent of absolute scale. Higher index values indicate better local demand intensity for that category.',
    source: 'Demand Intelligence (store vs network normalization)',
    refreshFrequency: 'Weekly',
  },

  bestPeriod: {
    metricKey: 'bestPeriod',
    label: 'Best Period',
    definition:
      'Historical month where the category achieved its peak revenue for this store in the available analysis window.',
    interpretation:
      'Treat this as the local benchmark period. Compare current period against this peak to understand headroom and seasonality dependency.',
    source: 'POS history (category peak-period lookup)',
    refreshFrequency: 'Weekly',
  },

  bestRevenue: {
    metricKey: 'bestRevenue',
    label: 'Best Revenue',
    definition:
      'Highest recorded category revenue for this store in the analysis window, corresponding to the Best Period.',
    interpretation:
      'Represents demonstrated peak potential for this category at this store. Use with Current Revenue to estimate upside to historical best.',
    source: 'POS history (category revenue time series)',
    refreshFrequency: 'Weekly',
  },

  currentRevenue: {
    metricKey: 'currentRevenue',
    label: 'Current Revenue',
    definition:
      'Category revenue generated in the current selected period for this store.',
    interpretation:
      'Compare against Best Revenue and Revenue Index to determine whether the category is under-performing, stable, or near peak potential.',
    source: 'Current-period POS data',
    refreshFrequency: 'Weekly',
  },

  sizeInStock: {
    metricKey: 'sizeInStock',
    label: 'Size In-Stock Rate',
    definition:
      'Percentage of SKU-size combinations that are currently available for sale. Measures how well inventory covers the full size range customers expect.',
    interpretation:
      'Above 90% means customers rarely encounter size stockouts. Below 85% indicates meaningful lost revenue — the store has product but not in the sizes customers need. Compare against competitors to identify relative disadvantage.',
    thresholds: {
      green: { min: 90, label: 'Strong size coverage' },
      amber: { min: 80, max: 89, label: 'Moderate gaps — optimize allocation' },
      red: { max: 79, label: 'Significant size stockouts' },
    },
    source: 'Inventory Management (SKU-size availability)',
    refreshFrequency: 'Daily',
  },

  optionCount: {
    metricKey: 'optionCount',
    label: 'Option Count',
    definition:
      'Total number of distinct style-color options available in a category at the store. Measures assortment breadth — a key driver of customer perception of variety and choice.',
    interpretation:
      'More options generally drive higher conversion and dwell time, but only if aligned with demand. A gap vs competitors (e.g., "-140 options vs Zara") signals that customers perceive less variety and may shift to competitors with wider assortments.',
    source: 'Range Planning (active option tracking)',
    refreshFrequency: 'Weekly',
  },
};

/**
 * Worked examples for the Metric Glossary's "Real-world example" section. Kept as a
 * separate map (merged below) so the definitions above stay terse and examples can be
 * authored progressively.
 */
const TOOLTIP_EXAMPLES: Record<string, string> = {
  compGap: 'A store scoring 58 trails its rival on size availability and newness cadence — the two weakest radar axes — so it lands in the amber "gap exists" band and is queued for an assortment review.',
  twinGap: 'This store does Rs.2,150/sft while its cluster twin does Rs.2,330/sft — a Rs.180/sft twin gap that, across 4,000 sft, is roughly Rs.86 lakh of annualized unrealized revenue.',
  uplift: 'Closing the gap to its best twin across SPSF, GMROF, sell-through and size accuracy would add an estimated Rs.1.4 Cr a year — the ceiling used to rank this store for investment.',
  growthYoY: 'Menswear here did Rs.3.3 Cr this quarter vs Rs.3.0 Cr last year — +10% total growth, though added floor space accounts for part of it (compare with LFL to isolate organic).',
  cdi: 'A store indexing at 1.15 runs 15% above the network on average demand intensity — strong enough to justify deeper buys in its top categories.',
  lflGrowth: 'Same-store revenue rose from Rs.50 Cr to Rs.54.5 Cr year-on-year — +9% like-for-like, confirming the growth is organic rather than from new openings.',
  fashionPct: 'Fashion styles drive 28% of this store\'s revenue vs a 22% network norm — a fashion-forward mix that earns higher margin but needs tight sell-through discipline.',
  threatLevel: 'Three strong rivals sit within 2 km of this store, putting it in the "High" threat band — it must keep newness and size availability sharp to defend share.',
  affluence: 'A catchment scoring 74 (high spending power) supports premium lines, yet the store\'s ASP is mid-tier — a sign it is under-trading on price positioning.',
  youthIndex: 'A store beside a large IT park scores 71 on youth index — it should over-index on western and casual wear and lean into social-led merchandising.',
  familyIndex: 'A residential-suburb store scores 68 on family index — kidswear and festive occasion-wear should anchor the floor, and baskets here run larger than the network norm.',
  fashionForwardness: 'A catchment scoring 73 rewards newness — this store should receive new drops first and carry a higher fashion-to-basics ratio than value-led locations.',
  destinationScore: 'Customers travel an average of 9 km and dwell 35 minutes, giving an 82 destination score — strong enough to support a wider assortment and premium pricing.',
  compGapRadar: 'The radar shows a deep dent on "Size Availability" (45) against a strong "VM Display" (88) — pointing intervention squarely at allocation, not store presentation.',
  competitiveIntensity: 'Four nearby rivals with high estimated SPSF and heavy category overlap push intensity to "High" — yet a 78 gap score shows this store is winning despite the pressure.',
  sellThrough: 'Of 5,000 units received in the last 30 days, 3,600 have sold — a 72% sell-through that sits in the healthy band and signals good product-market fit.',
  gmrof: 'A store earning Rs.1.8 Cr gross margin across 4,000 selling sft returns Rs.450/sft GMROF — above the 400 efficiency mark, so the floor space is well utilized.',
  basketDepth: 'Shoppers here average 2.6 items per bill vs a 2.2 cluster norm — a 2.6 basket-depth score reflecting effective cross-merchandising and adjacencies.',
  newnessAbsorption: '78 of 100 new SKUs introduced last month hit target sell-through in their first window — 78% absorption, confirming the customer base actively buys newness.',
  customerLoyalty: 'A 68 loyalty index — high repeat rate and low 90-day churn versus grade peers — marks a sticky base that rewards consistent stock and experience.',
  sizeAccuracy: 'The allocated size curve matches local demand 82% of the time; the 18% mismatch (mostly mid-sizes selling out early) is the single largest preventable revenue loss here.',
  percentOfBest: 'Current-period revenue is 88% of this store\'s all-time best month — within seasonal range, so no alarm, but festive execution could close the final 12%.',
  demandSignal: 'Womenswear shows a "Strong" demand signal — rising velocity plus high footfall-to-conversion — flagging it as a category worth more inventory and floor space.',
  salesIndex: 'Footwear indexes at 1.2 here versus the network — 20% stronger local demand, so it deserves a deeper buy than its network-average share would suggest.',
  bestPeriod: 'This store\'s ethnic-wear peak was October (Diwali) — the benchmark month every current period is measured against for headroom and seasonality.',
  bestRevenue: 'Ethnic wear peaked at Rs.62 lakh in its best period; current revenue of Rs.41 lakh implies roughly Rs.21 lakh of upside to demonstrated potential.',
  currentRevenue: 'The category is doing Rs.41 lakh this period; read alongside a Rs.62 lakh best and a 1.2 revenue index, it is under-trading its proven local potential.',
  sizeInStock: '88 of 100 SKU-size combinations are currently sellable — an 88% in-stock rate; the missing 12% are mostly the fast-selling mid-sizes customers ask for most.',
  optionCount: 'This store carries 320 womenswear options against a key rival\'s 460 — a 140-option gap customers read as "less choice", nudging them toward the wider competitor.',
};

for (const [key, example] of Object.entries(TOOLTIP_EXAMPLES)) {
  const entry = tooltipRegistry[key];
  if (entry) entry.example = example;
}

/**
 * Look up a tooltip definition by metric key.
 * Returns undefined if not found (component should handle gracefully).
 */
export function getTooltipDefinition(metricKey: string): TooltipDefinition | undefined {
  return tooltipRegistry[metricKey];
}
