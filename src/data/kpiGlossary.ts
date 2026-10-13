/**
 * KPI Glossary — human-readable definitions for all abbreviations used in the UI.
 *
 * Covers abbreviations from kpiRegistry (K002→SPSF, K013→ATS, etc.) and
 * additional domain terms (GMROF, OTB, WOS, NSV, etc.).
 */

export interface KpiGlossaryEntry {
  name: string;
  definition: string;
  formula?: string;
  uom?: string;
  /** Worked example for the Metric Glossary (authored progressively). */
  example?: string;
}

export const kpiGlossary: Record<string, KpiGlossaryEntry> = {
  // ─── From kpiRegistry ───────────────────────────────────────────────
  SPSF: {
    name: 'Sales Per Square Foot',
    definition: 'Gross revenue generated for each square foot of retail floor area.',
    formula: 'Total Gross Revenue / SQFT Area',
    uom: 'Rs./sft',
  },
  ATS: {
    name: 'Average Ticket Size',
    definition: 'Average gross revenue per transaction (bill).',
    formula: 'Gross Revenue / No. of Bills',
    uom: 'Rs.',
  },
  NPS: {
    name: 'Net Promoter Score',
    definition: 'Customer loyalty metric based on likelihood to recommend. Ranges from -100 to +100.',
    formula: '% Promoters - % Detractors',
    uom: '%',
  },
  'GM%': {
    name: 'Gross Margin Percentage',
    definition: 'Product profitability as a percentage of net revenue after deducting cost of goods.',
    formula: '(Net Revenue - COGS) / Net Revenue x 100',
    uom: '%',
  },
  IPCM: {
    name: 'Items Per Cash Memo',
    definition: 'Average number of items sold per transaction.',
    formula: 'Total Qty Sold / No. of Bills',
    uom: 'Count',
  },

  // ─── Additional UI abbreviations ────────────────────────────────────
  GMROF: {
    name: 'Gross Margin Return On Footage',
    definition: 'Profitability metric measuring gross margin earned per square foot of selling space.',
    formula: 'Gross Margin / Selling Area (sft)',
    uom: 'Rs./sft',
  },
  OTB: {
    name: 'Open-to-Buy',
    definition: 'The buying budget available for a category or period, calculated as planned purchases minus committed orders.',
    formula: 'Planned Revenue + Planned EOM Stock - BOM Stock - On Order',
    uom: 'Rs.',
  },
  WOS: {
    name: 'Weeks of Supply',
    definition: 'Number of weeks current inventory will last at the current rate of sale.',
    formula: 'Current Stock / Avg Weekly Revenue',
    uom: 'Weeks',
  },
  NSV: {
    name: 'Net Revenue Value',
    definition: 'Revenue after deducting returns, discounts, and taxes from gross revenue.',
    formula: 'Gross Revenue - Returns - Discounts - Taxes',
    uom: 'Rs.',
  },
  NOOS: {
    name: 'Not On Our Shelves',
    definition: 'Percentage of planned assortment options that are out of stock at store level.',
    formula: 'Out-of-Stock Options / Total Planned Options x 100',
    uom: '%',
  },
  MRP: {
    name: 'Maximum Retail Price',
    definition: 'The maximum price at which a product can be sold to the consumer, as printed on the product.',
    uom: 'Rs.',
  },
  STR: {
    name: 'Sell-Through Rate',
    definition: 'Percentage of received inventory that has been sold within a given period.',
    formula: 'Units Sold / (Units on Hand + Units Sold) x 100',
    uom: '%',
  },
  'Sell-Through': {
    name: 'Sell-Through Rate',
    definition: 'Percentage of received inventory that has been sold within a given period.',
    formula: 'Units Sold / (Units on Hand + Units Sold) x 100',
    uom: '%',
  },
  'Twin Gap': {
    name: 'Twin Gap Analysis',
    definition: 'Gap between plan and actual across both revenue and margin dimensions simultaneously.',
  },
  'Comp.Gap': {
    name: 'Comparable Store Gap',
    definition: 'Performance gap in comparable (like-for-like) stores versus prior year or plan.',
  },
  'Catch.': {
    name: 'Catchment',
    definition: 'The geographic area from which a store draws its customers.',
  },
  CSAT: {
    name: 'Customer Satisfaction Score',
    definition: 'Direct measure of customer satisfaction with a product, service, or interaction.',
    formula: 'Satisfied Responses / Total Responses x 100',
    uom: '%',
  },
  ASP: {
    name: 'Average Selling Price',
    definition: 'Average price at which products are sold, after discounts.',
    formula: 'Net Revenue / Units Sold',
    uom: 'Rs.',
  },
  EBITDA: {
    name: 'Earnings Before Interest, Taxes, Depreciation & Amortization',
    definition: 'Operating profitability metric excluding non-operating expenses.',
    formula: 'Revenue - COGS - Operating Expenses (excl. interest, tax, depreciation)',
    uom: 'Rs.',
  },
  ROI: {
    name: 'Return on Investment',
    definition: 'Profitability ratio measuring return relative to investment cost.',
    formula: '(Gain from Investment - Cost) / Cost x 100',
    uom: '%',
  },

  // ─── Added for UX Foundation sprint ───────────────────────────────────
  ATV: {
    name: 'Average Transaction Value',
    definition: 'Average monetary value of each customer transaction.',
    formula: 'Total Revenue / Number of Transactions',
    uom: 'Rs.',
  },
  UPT: {
    name: 'Units Per Transaction',
    definition: 'Average number of units purchased per transaction.',
    formula: 'Total Units Sold / Number of Transactions',
    uom: 'Count',
  },
  LFL: {
    name: 'Like-for-Like',
    definition: 'Growth comparison of same stores operating for at least one full year, excluding new openings and closures.',
    uom: '%',
  },
  OTIF: {
    name: 'On Time In Full',
    definition: 'Percentage of orders delivered on the agreed date with the complete quantity ordered.',
    formula: 'On-Time-In-Full Orders / Total Orders x 100',
    uom: '%',
  },
  AQL: {
    name: 'Acceptable Quality Level',
    definition: 'Maximum acceptable defect rate in a production lot during quality inspection sampling.',
    uom: '%',
  },
  SLA: {
    name: 'Service Level Agreement',
    definition: 'Committed target for service quality metrics such as response time, availability, or fill rate.',
  },
  COGS: {
    name: 'Cost of Goods Sold',
    definition: 'Direct costs attributable to the production or procurement of goods sold by the business.',
    formula: 'Opening Stock + Purchases - Closing Stock',
    uom: 'Rs.',
  },
  Markdown: {
    name: 'Markdown Percentage',
    definition: 'Percentage reduction from the original retail price, used to accelerate sell-through of slow-moving inventory.',
    formula: '(Original Price - Sale Price) / Original Price x 100',
    uom: '%',
  },
};

/**
 * Worked examples for the Metric Glossary's "Real-world example" section. Kept as a
 * separate map (merged below) so the definitions above stay terse and examples can be
 * authored progressively without churning every entry.
 */
const KPI_EXAMPLES: Record<string, string> = {
  SPSF: 'A 4,000 sft store doing Rs.1.2 Cr gross revenue in a month runs at Rs.3,000/sft — well above the Rs.2,200/sft fleet benchmark, marking it a high-productivity location.',
  ATS: 'If a store rings up Rs.8,40,000 across 1,200 bills in a day, its average ticket size is Rs.700 — so a Rs.50 lift from add-on selling adds Rs.60,000/day.',
  NPS: 'Out of 500 surveyed shoppers, 60% are promoters and 15% are detractors, giving an NPS of +45 — strong, but a 5-point drop usually traces to fitting-room or queue friction.',
  'GM%': 'A jacket selling at Rs.2,000 net with Rs.1,200 COGS earns Rs.800 margin — a 40% gross margin. Drop the discount and the same jacket at Rs.2,200 net pushes GM% to ~45%.',
  IPCM: 'A store selling 3,000 units across 1,500 bills averages 2.0 items per cash memo; a visual-merch reset that lifts it to 2.3 means 450 extra units/day on the same footfall.',
  GMROF: 'A footwear bay occupying 200 sft that earns Rs.6,00,000 gross margin a year returns Rs.3,000/sft — so replacing a Rs.1,800/sft category in that bay is a clear space-productivity win.',
  OTB: 'Womenswear plans Rs.50 Cr revenue and Rs.15 Cr closing stock, opens with Rs.10 Cr stock and Rs.8 Cr already on order — leaving Rs.47 Cr of open-to-buy to commit for the season.',
  WOS: 'A SKU with 4,800 units on hand selling 600/week has 8 weeks of supply; below the 6-week guardrail it triggers replenishment, above 14 it flags as overstock.',
  NSV: 'Rs.1,00,000 of gross sales less Rs.8,000 returns, Rs.12,000 discounts and Rs.15,000 GST nets Rs.65,000 — the figure used for true revenue and margin reporting.',
  NOOS: '120 of a planned 2,000 store-options are out of stock, a 6% NOOS — every point above the 5% threshold is roughly Rs.4 lakh/week of missed sales in that category.',
  MRP: 'A shirt tagged at Rs.1,499 MRP sold at Rs.1,199 carries a 20% markdown; the MRP is the ceiling price and the anchor all discounts are measured against.',
  STR: 'A drop of 10,000 units that has sold 6,500 with 3,500 still on hand is at 65% sell-through — healthy for mid-season, but under 40% by week 6 usually warrants a markdown.',
  'Sell-Through': 'A drop of 10,000 units that has sold 6,500 with 3,500 still on hand is at 65% sell-through — healthy for mid-season, but under 40% by week 6 usually warrants a markdown.',
  'Twin Gap': 'A category running Rs.2 Cr below revenue plan but Rs.30 lakh above margin plan has a twin gap that says "discounting less, selling slower" — a different fix than a pure revenue miss.',
  'Comp.Gap': 'Like-for-like stores trail last year by 3% while total network is up 8% — the comparable-store gap reveals that growth is coming from new stores, not the existing base.',
  'Catch.': 'A mall store drawing 70% of footfall from a 5 km radius has a tight catchment; a highway store pulling from 25 km behaves very differently on assortment and promotions.',
  CSAT: '430 of 500 post-purchase surveys rate the experience 4-5 stars, an 86% CSAT; the 14% dissatisfied cluster around stockouts of the advertised size run.',
  ASP: 'Rs.45 lakh net revenue across 5,000 units sold gives an average selling price of Rs.900 — a Rs.50 ASP erosion from over-discounting costs Rs.2.5 lakh on the same volume.',
  EBITDA: 'A region with Rs.100 Cr revenue, Rs.55 Cr COGS and Rs.30 Cr operating cost delivers Rs.15 Cr EBITDA — a 15% margin used to compare store-level operating profitability.',
  ROI: 'A Rs.20 lakh store-refit that lifts annual margin by Rs.9 lakh returns 45% in year one, comfortably clearing the 30% hurdle rate for capex approvals.',
  ATV: 'A store with Rs.12,00,000 in daily revenue across 1,500 transactions has an ATV of Rs.800; bundling accessories to lift it to Rs.880 adds Rs.1.2 lakh/day.',
  UPT: '3,300 units sold across 1,500 transactions is 2.2 units per transaction; cross-sell prompts that move it to 2.4 add ~300 units/day without new footfall.',
  LFL: 'Stores open over a year grew Rs.220 Cr vs Rs.200 Cr last year — a +10% like-for-like that strips out new openings, isolating true organic momentum.',
  OTIF: '880 of 1,000 vendor POs arrived on the committed date and complete — 88% OTIF; the 12% shortfall is what drives the stockouts showing up two weeks later on shelf.',
  AQL: 'A 1,200-piece lot inspected at a 2.5% AQL passes only if defects stay under 30 pieces; cross that and the entire lot is rejected back to the vendor.',
  SLA: 'A replenishment SLA of "98% fill within 48 hours" means a DC dispatching 9,600 of 10,000 ordered units inside two days is just meeting commitment.',
  COGS: 'Opening stock Rs.40 Cr plus Rs.70 Cr purchases minus Rs.45 Cr closing stock yields Rs.65 Cr COGS — the cost base subtracted from net revenue to get gross margin.',
  Markdown: 'A dress cut from Rs.2,500 to Rs.1,750 carries a 30% markdown; applied across 2,000 ageing units it sacrifices Rs.15 lakh of revenue to clear shelf space for the new drop.',
};

for (const [abbr, example] of Object.entries(KPI_EXAMPLES)) {
  const entry = kpiGlossary[abbr];
  if (entry) entry.example = example;
}
