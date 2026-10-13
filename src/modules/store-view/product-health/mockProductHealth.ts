/**
 * Mock data for Companion App → Product Health. Prototype only — fabricated.
 * These reflect GA4 Companion activity (users / sessions / funnel), not sales
 * revenue. Swap for the GA4 + scanner + catalogue + CX APIs later.
 */

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function daily(days: number, base: number, vol: number, seed: number) {
  const rnd = seeded(seed);
  const end = new Date('2026-08-31');
  const out: { date: string; value: number }[] = [];
  let v = base;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    v = Math.max(base * 0.5, v * (1 + (rnd() - 0.48) * vol));
    out.push({ date: d.toISOString().slice(0, 10), value: Math.round(v) });
  }
  return out;
}

type Kpi = { key: string; label: string; value: string; trend?: string; status?: 'success' | 'warning' | 'critical' };

/* ── Product Overview ────────────────────────────────────────────────── */

export const overviewKpis: Kpi[] = [
  { key: 'au', label: 'Active users', value: '58,240', trend: '+7.9%', status: 'success' },
  { key: 'es', label: 'Engaged sessions', value: '1,04,880', trend: '+6.2%', status: 'success' },
  { key: 'esr', label: 'Engaged-session rate', value: '71.4%', trend: '+1.1%', status: 'success' },
  { key: 'spu', label: 'Sessions per active user', value: '2.52', trend: '+0.05', status: 'success' },
  { key: 'fs', label: 'Funnel-started sessions', value: '46,110', trend: '+5.4%', status: 'success' },
  { key: 'pfr', label: 'Product find rate', value: '82.7%', trend: '-0.8%', status: 'warning' },
  { key: 'atc', label: 'Add-to-cart rate', value: '48.3%', trend: '+2.0%', status: 'success' },
  { key: 'cpc', label: 'Checkout-to-payment conversion', value: '61.9%', trend: '-1.4%', status: 'warning' },
  { key: 'pss', label: 'Payment-success sessions', value: '14,820', trend: '+4.1%', status: 'success' },
  { key: 'ess', label: 'Eligible scan sessions', value: '41,780', trend: '+4.8%', status: 'success' },
  { key: 'co', label: 'Checkout sessions', value: '15,940', trend: '-0.6%', status: 'warning' },
  { key: 'sls', label: 'Scan lookup success', value: '88.4%', trend: '+0.7%', status: 'success' },
  { key: 'cc', label: 'Catalogue completion', value: '74.6%', trend: '+1.9%', status: 'success' },
  { key: 'afr', label: 'Attribute fill rate', value: '81.2%', trend: '+1.3%', status: 'success' },
  { key: 'mc', label: 'Media coverage', value: '77.9%', trend: '+0.9%', status: 'success' },
  { key: 'aer', label: 'Average experience rating', value: '4.31 / 5', trend: '+0.06', status: 'success' },
  { key: 'pd', label: 'Purchase-difficulty share', value: '7.3%', trend: '-0.4%', status: 'warning' },
];

export const overviewTrends = {
  activeUsers: daily(30, 1940, 0.1, 61),
  engagedSessions: daily(30, 3500, 0.11, 62),
  funnelStarts: daily(30, 1540, 0.12, 63),
  paymentSuccess: daily(30, 494, 0.14, 64),
  checkoutConv: daily(30, 62, 0.05, 65),
  scanSuccess: daily(30, 88, 0.03, 66),
  avgRating: daily(30, 43, 0.02, 67).map((d) => ({ date: d.date, value: +(d.value / 10).toFixed(2) })),
};

/** 🔵 App/AI-generated — inputs are GA4/scanner/catalogue/CX numbers, the prose is not. */
export const aiBriefing = {
  label: 'Product briefing',
  question: 'Where are Companion users dropping off, and what is blocking conversion?',
  summary:
    '**58,240 active users** ran **1,04,880 engaged sessions**, and **46,110** entered the shopping funnel. The biggest leak is **Product found → Added to cart**, where **15,860 sessions (42%)** are lost. Scanner health is solid at **88.4%** lookup success, but **318 EANs** are confirmed catalogue gaps. Checkout-to-payment conversion slipped to **61.9%**, below the 70% target.',
};

export const aiInsights = [
  {
    id: 'pi1',
    tone: 'critical' as const,
    confidence: 'High',
    title: 'Found → Cart drop is a PDP problem, not weak intent',
    body: 'Sessions that view a product and leave spend a **median 1m 12s** on the product page — long enough to read, short enough to bounce. **72%** had **no size selected**. Size-chart coverage is only **72%** and material info **61%**.',
    metric: '15,860 lost · 72% no size selected',
    recommendation: 'Backfill size-chart + material for the top 200 scanned EANs and add an inline size prompt on the product page.',
  },
  {
    id: 'pi2',
    tone: 'watch' as const,
    title: 'Payment step leaks disproportionately on older iOS',
    body: 'iOS 17 converts at **29.4%** versus 32%+ elsewhere and shows more checkout sessions with **no recorded payment outcome** — a likely client-side timeout.',
    metric: 'iOS 17 · 29.4% conversion',
    recommendation: 'Reproduce the checkout timeout on iOS 17 and lengthen the client payment-callback window.',
  },
  {
    id: 'pi3',
    tone: 'positive' as const,
    title: 'Scan-to-buy users are the strongest cohort',
    body: 'Sessions that start with a successful scan convert at roughly **3.4x** the rate of search-first sessions and carry a **higher AOV**. Only **41,780** of 1,04,880 engaged sessions are scan-eligible today.',
    metric: '3.4x conversion vs search-first',
    recommendation: 'Surface the scanner entry point earlier in the app home and on in-store signage.',
  },
  {
    id: 'pi4',
    tone: 'watch' as const,
    title: 'Catalogue gaps are clustered, not spread',
    body: 'The **318 gap EANs** concentrate in **41 stores** and **5 pipelines** (Home leads at 46% completion). Fixing the top 60 EANs would close **~55%** of not-found scans.',
    metric: '318 EANs · 41 stores · top-60 ≈ 55%',
    recommendation: 'Route the top-60 gap EANs to the catalogue team as one batch this week.',
  },
];

export const companyJourneyFunnel = [
  { label: 'Funnel started', value: 46110 },
  { label: 'Product found', value: 38130 },
  { label: 'Added to cart', value: 22270 },
  { label: 'Proceeded to checkout', value: 15940 },
  { label: 'Payment successful', value: 14820 },
  { label: 'Order confirmation recorded', value: 14610 },
];

export const convertedSplit = [
  { label: 'Converted sessions', value: 14820 },
  { label: 'Non-converted sessions', value: 31290 },
];

export const largestDropOffs = [
  { label: 'Product found → Added to cart', value: 15860 },
  { label: 'Funnel started → Product found', value: 7980 },
  { label: 'Added to cart → Checkout', value: 6330 },
  { label: 'Checkout → Payment successful', value: 1120 },
  { label: 'Payment → Confirmation recorded', value: 210 },
];

export const scannerOutcomes = [
  { label: 'Product found', value: 32410 },
  { label: 'Product not found', value: 2870 },
  { label: 'API error', value: 1360 },
];

export const experienceRatingDist = [
  { label: '5★', value: 14820 },
  { label: '4★', value: 11240 },
  { label: '3★', value: 3110 },
  { label: '2★', value: 940 },
  { label: '1★', value: 610 },
];

export const overviewAttention: { key: string; title: string; value: string; note: string; status: 'critical' | 'warning' }[] = [
  { key: 'drop', title: 'Largest funnel drop-off', value: 'Found → Cart', note: '15,860 sessions lost (42%)', status: 'critical' },
  { key: 'scan', title: 'High scanner error / not-found', value: '12.1%', note: 'Not-found + API error rate', status: 'warning' },
  { key: 'checkout', title: 'Low checkout conversion', value: '61.9%', note: 'Below 70% target', status: 'warning' },
  { key: 'payfail', title: 'Payment-failure increase', value: '+0.9 pp', note: 'Week-on-week', status: 'warning' },
  { key: 'gap', title: 'Catalogue-gap EANs', value: '318 EANs', note: 'Confirmed missing from catalogue', status: 'warning' },
  { key: 'activity', title: 'Declining user activity', value: '21 stores', note: 'Active users down 3 weeks running', status: 'warning' },
  { key: 'rating', title: 'Declining experience rating', value: '7 stores', note: 'Avg rating down >0.3 MoM', status: 'warning' },
];

/* ── Journey & Funnel ────────────────────────────────────────────────── */

export const journeyKpis: Kpi[] = [
  { key: 'au', label: 'Active users', value: '58,240' },
  { key: 'es', label: 'Engaged sessions', value: '1,04,880' },
  { key: 'ess', label: 'Eligible scan sessions', value: '41,780' },
  { key: 'fs', label: 'Funnel-started sessions', value: '46,110' },
  { key: 'pf', label: 'Product-found sessions', value: '38,130' },
  { key: 'atc', label: 'Added-to-cart sessions', value: '22,270' },
  { key: 'co', label: 'Checkout sessions', value: '15,940' },
  { key: 'pss', label: 'Payment-success sessions', value: '14,820' },
  { key: 'spu', label: 'Sessions per active user', value: '2.52' },
  { key: 'pfr', label: 'Product find rate', value: '82.7%' },
  { key: 'atcr', label: 'Add-to-cart rate', value: '48.3%' },
  { key: 'cc', label: 'Checkout conversion', value: '61.9%' },
  { key: 'rec', label: 'Users recovering after payment failure', value: '1,240' },
];

/** Scanner journey concentration by city (BQ: scan events grouped by store city). */
export const scannerByCity = [
  { label: 'Mumbai', value: 9840 },
  { label: 'Bengaluru', value: 8110 },
  { label: 'Delhi NCR', value: 6420 },
  { label: 'Chennai', value: 4980 },
  { label: 'Hyderabad', value: 4110 },
  { label: 'Kochi', value: 3220 },
  { label: 'Pune', value: 2870 },
];

/** Scanner funnel drop-off between opened and product-found. */
export const scannerDropOff = { count: 9280, pct: 21 };

export const funnelSessions = companyJourneyFunnel;
export const funnelUsers = companyJourneyFunnel.map((s) => ({ label: s.label, value: Math.round(s.value * 0.86) }));

export const scannerStages = [
  { label: 'Scanner opened', value: 44120 },
  { label: 'Scan attempted', value: 41780 },
  { label: 'Barcode detected', value: 39610 },
  { label: 'Product found', value: 34840 },
];

export const scannerOutcomeBars = [
  { label: 'Product not found', value: 2870 },
  { label: 'API error', value: 1360 },
];

export const scanSuccessTrend = daily(30, 88, 0.03, 71);

export const scannerStageTable = [
  { stage: 'Scanner opened', users: 30110, sessions: 44120, events: 51230 },
  { stage: 'Scan attempted', users: 28640, sessions: 41780, events: 88140 },
  { stage: 'Barcode detected', users: 27210, sessions: 39610, events: 74920 },
  { stage: 'Product found', users: 24880, sessions: 34840, events: 36110 },
  { stage: 'Product not found', users: 2410, sessions: 2870, events: 3040 },
  { stage: 'API error', users: 1180, sessions: 1360, events: 1490 },
];

export const cartCheckoutFunnel = [
  { label: 'Cart views', value: 26840 },
  { label: 'Added to cart', value: 22270 },
  { label: 'Checkout started', value: 15940 },
  { label: 'Payment successful', value: 14820 },
];

export const checkoutOutcome = [
  { label: 'Payment successful', value: 14820 },
  { label: 'Payment failed', value: 1120 },
  { label: 'Recovered after failure', value: 640 },
  { label: 'No recorded outcome', value: 320 },
];

export const cartDropOffs = [
  { label: 'Cart view → Added to cart', value: 4570 },
  { label: 'Added to cart → Checkout', value: 6330 },
  { label: 'Checkout → Payment successful', value: 1120 },
];

export const dailyConversionTrend = daily(30, 32, 0.06, 72);

export const couponStageReach = [
  { label: 'Cart viewed', value: 26840 },
  { label: 'Coupon selected', value: 14220 },
  { label: 'Coupon page viewed', value: 11380 },
  { label: 'Coupon application attempted', value: 7640 },
  { label: 'Coupon applied', value: 5180 },
];

export const couponOutcome = [
  { label: 'Coupon applied', value: 5180 },
  { label: 'Coupon failed', value: 1230 },
  { label: 'Coupon removed', value: 890 },
];

export const couponDetail = [
  { metric: 'Cart viewed', value: '26,840' },
  { metric: 'Coupon selected', value: '14,220' },
  { metric: 'Coupon page viewed', value: '11,380' },
  { metric: 'Coupon application attempted', value: '7,640' },
  { metric: 'Coupon applied', value: '5,180' },
  { metric: 'Coupon failed', value: '1,230' },
  { metric: 'Coupon removed', value: '890' },
  { metric: 'Coupon usage rate', value: '19.3%' },
];

export const sessionsByPlatform = [
  { label: 'Android app', value: 61240 },
  { label: 'iOS app', value: 34110 },
  { label: 'Mobile web', value: 9530 },
];

export const conversionByPlatform = [
  { platform: 'Android app', sessions: '61,240', conv: '32.6%' },
  { platform: 'iOS app', sessions: '34,110', conv: '31.1%' },
  { platform: 'Mobile web', sessions: '9,530', conv: '22.4%' },
];

export const sessionsByOs = [
  { label: 'Android 14', value: 34210 },
  { label: 'Android 13', value: 21040 },
  { label: 'iOS 18', value: 19880 },
  { label: 'iOS 17', value: 12760 },
  { label: 'Android 12', value: 8990 },
  { label: 'Other', value: 8000 },
];

export const conversionByOs = [
  { os: 'Android 14', sessions: '34,210', conv: '33.1%' },
  { os: 'Android 13', sessions: '21,040', conv: '31.8%' },
  { os: 'iOS 18', sessions: '19,880', conv: '32.0%' },
  { os: 'iOS 17', sessions: '12,760', conv: '29.4%' },
  { os: 'Android 12', sessions: '8,990', conv: '27.6%' },
];

/* Session & Path Diagnostics (nested in Journey & Funnel) */

export const pathKpis: Kpi[] = [
  { key: 'el', label: 'Eligible sessions', value: '46,110' },
  { key: 'ps', label: 'Sessions with payment success', value: '14,820' },
  { key: 'scr', label: 'Session conversion rate', value: '32.1%' },
  { key: 'nc', label: 'Non-converted sessions', value: '31,290' },
  { key: 'up', label: 'Unique exact paths', value: '2,884' },
  { key: 'md', label: 'Median journey duration', value: '3m 41s' },
];

export const prePathFamilies = [
  { label: 'Scan → Product → Cart → Checkout → Pay', value: 9240 },
  { label: 'Search → Product → Cart → Checkout → Pay', value: 4110 },
  { label: 'Scan → Product → Exit', value: 6870 },
  { label: 'Scan → Not found → Retry → Exit', value: 3320 },
  { label: 'Product → Cart → Exit', value: 5180 },
];

export const exactPaths = [
  { seq: 'scan_open → scan_success → pdp_view → add_to_cart → checkout → payment_success', sessions: 6120, converted: 6120, rate: '100%', median: '4m 02s', final: 'payment_success', drop: '—' },
  { seq: 'scan_open → scan_success → pdp_view → session_end', sessions: 5040, converted: 0, rate: '0%', median: '1m 12s', final: 'session_end', drop: 'pdp_view' },
  { seq: 'search → pdp_view → add_to_cart → checkout → payment_failed', sessions: 1180, converted: 0, rate: '0%', median: '5m 30s', final: 'payment_failed', drop: 'checkout' },
  { seq: 'scan_open → scan_not_found → scan_open → session_end', sessions: 2210, converted: 0, rate: '0%', median: '2m 05s', final: 'session_end', drop: 'scan_not_found' },
  { seq: 'pdp_view → add_to_cart → cart_view → session_end', sessions: 3090, converted: 0, rate: '0%', median: '1m 48s', final: 'session_end', drop: 'cart_view' },
];

export const exitPoints = [
  { label: 'Product detail page', value: 9240 },
  { label: 'Cart', value: 6110 },
  { label: 'Scan not found', value: 4320 },
  { label: 'Checkout', value: 3180 },
  { label: 'Home', value: 2140 },
];

export const journeyDurationHistogram = [
  { label: '<1m', value: 6120 },
  { label: '1–3m', value: 14210 },
  { label: '3–5m', value: 12880 },
  { label: '5–10m', value: 8240 },
  { label: '10–20m', value: 3180 },
  { label: '>20m', value: 1480 },
];

export const canonicalCoverage = [
  { event: 'scan_open', sessions: '44,120', coverage: '98%' },
  { event: 'scan_success', sessions: '34,840', coverage: '96%' },
  { event: 'pdp_view', sessions: '38,130', coverage: '99%' },
  { event: 'add_to_cart', sessions: '22,270', coverage: '97%' },
  { event: 'checkout', sessions: '15,940', coverage: '95%' },
  { event: 'payment_success', sessions: '14,820', coverage: '99%' },
];

/* ── Discovery & Catalogue ───────────────────────────────────────────── */

export const catalogueKpis: Kpi[] = [
  { key: 'cc', label: 'Overall catalogue completion', value: '74.6%', status: 'success' },
  { key: 'tp', label: 'Total products', value: '2,84,110' },
  { key: 'cp', label: 'Completed products', value: '2,11,940' },
  { key: 'mp', label: 'Missing / incomplete products', value: '72,170', status: 'warning' },
  { key: 'afr', label: 'Attribute fill rate', value: '81.2%' },
  { key: 'mc', label: 'Media coverage', value: '77.9%' },
];

export const catalogueCompletionPct = 74.6;

export const pipelineOverview = [
  { pipeline: 'Apparel', total: '1,42,000', completed: '1,18,200', pct: '83%' },
  { pipeline: 'Footwear', total: '58,400', completed: '41,600', pct: '71%' },
  { pipeline: 'Accessories', total: '46,900', completed: '31,100', pct: '66%' },
  { pipeline: 'Beauty', total: '21,300', completed: '13,900', pct: '65%' },
  { pipeline: 'Home', total: '15,510', completed: '7,140', pct: '46%' },
];

export const pipelineCompletion = [
  { pipeline: 'Apparel', value: 83 },
  { pipeline: 'Footwear', value: 71 },
  { pipeline: 'Accessories', value: 66 },
  { pipeline: 'Beauty', value: 65 },
  { pipeline: 'Home', value: 46 },
];

export const attributeFill = [
  { label: 'Title', pct: 99 },
  { label: 'Brand', pct: 96 },
  { label: 'Category', pct: 94 },
  { label: 'Colour', pct: 88 },
  { label: 'Size chart', pct: 72 },
  { label: 'Material / composition', pct: 61 },
  { label: 'Care instructions', pct: 54 },
];

export const mediaCoverageByPipeline = [
  { pipeline: 'Apparel', primary: 96, gallery: 78 },
  { pipeline: 'Footwear', primary: 91, gallery: 64 },
  { pipeline: 'Accessories', primary: 84, gallery: 52 },
  { pipeline: 'Beauty', primary: 80, gallery: 48 },
  { pipeline: 'Home', primary: 62, gallery: 33 },
];

export const missingByPipeline = [
  { pipeline: 'Apparel', missing: '23,800', topGap: 'Size chart' },
  { pipeline: 'Footwear', missing: '16,800', topGap: 'Gallery media' },
  { pipeline: 'Accessories', missing: '15,800', topGap: 'Material' },
  { pipeline: 'Beauty', missing: '7,400', topGap: 'Care instructions' },
  { pipeline: 'Home', missing: '8,370', topGap: 'Primary image' },
];

export const scanKpis: Kpi[] = [
  { key: 'ts', label: 'Total scans', value: '3,64,200' },
  { key: 'ss', label: 'Scan sessions', value: '41,780' },
  { key: 'suc', label: 'Successful scans', value: '3,22,010' },
  { key: 'sr', label: 'Scan success rate', value: '88.4%', status: 'success' },
  { key: 'ean', label: 'Unique valid EANs', value: '96,410' },
  { key: 'nf', label: 'Product-not-found scans', value: '31,180', status: 'warning' },
  { key: 'err', label: 'API-error scans', value: '11,010', status: 'warning' },
  { key: 'gap', label: 'Confirmed catalogue-gap EANs', value: '318', status: 'warning' },
];

export const dailyScanVolume = daily(30, 12100, 0.09, 81);
export const dailyScanSuccess = daily(30, 88, 0.03, 82);

export const scanOutcomeStacked = daily(14, 12000, 0.08, 83).map((d) => ({
  date: d.date,
  found: Math.round(d.value * 0.88),
  notFound: Math.round(d.value * 0.085),
  apiError: Math.round(d.value * 0.035),
}));

export const topScannedEans = [
  { ean: '8901030812345', product: 'Netplay Slim Fit Shirt', scans: 4120, found: 'Yes' },
  { ean: '8901030899221', product: 'Performax Training Tee', scans: 3880, found: 'Yes' },
  { ean: '8901030744109', product: 'Teamspirit Joggers', scans: 3240, found: 'Yes' },
  { ean: '8901030655310', product: 'DNMX Slim Jeans', scans: 2910, found: 'Yes' },
  { ean: '8901030512094', product: 'Fig Kurta', scans: 2510, found: 'Partial' },
];

export const topGapEans = [
  { ean: '8904223110455', scans: 812, stores: 41, firstSeen: '2026-07-14' },
  { ean: '8904223998120', scans: 640, stores: 33, firstSeen: '2026-07-22' },
  { ean: '8904223441002', scans: 511, stores: 28, firstSeen: '2026-08-01' },
  { ean: '8904223774318', scans: 447, stores: 24, firstSeen: '2026-08-05' },
  { ean: '8904223220917', scans: 389, stores: 19, firstSeen: '2026-08-09' },
];

export const gapStores = [
  { store: 'Trends Infinity Mall Malad', state: 'Maharashtra', gapScans: 210, gapEans: 34 },
  { store: 'Trends Forum Bengaluru', state: 'Karnataka', gapScans: 188, gapEans: 29 },
  { store: 'Trends Phoenix Market City', state: 'Maharashtra', gapScans: 164, gapEans: 26 },
  { store: 'Trends Ambience Gurgaon', state: 'Delhi NCR', gapScans: 141, gapEans: 22 },
  { store: 'Trends Lulu Kochi', state: 'Kerala', gapScans: 119, gapEans: 18 },
];

export const scanOutcomesBar = [
  { label: 'Found', value: 322010 },
  { label: 'Not found', value: 31180 },
  { label: 'API error', value: 11010 },
];

/* ── Customer Experience ─────────────────────────────────────────────── */

export const cxKpis: Kpi[] = [
  { key: 'sr', label: 'Survey responses', value: '31,240' },
  { key: 'ur', label: 'Unique respondents', value: '27,880' },
  { key: 'rs', label: 'Responding stores', value: '1,142' },
  { key: 'ad', label: 'Active deployments', value: '1,318' },
  { key: 'ar', label: 'Average rating', value: '4.31 / 5', status: 'success' },
  { key: 'pos', label: 'Positive-rating share', value: '83.6%', status: 'success' },
  { key: 'pd', label: 'Purchase-difficulty share', value: '7.3%', status: 'warning' },
  { key: 'wf', label: 'Written-feedback count & participation', value: '9,410 · 30.1%' },
];

export const cxTrends = {
  dailyResponses: daily(30, 1040, 0.12, 91),
  ratingOverTime: daily(30, 43, 0.02, 92).map((d) => ({ date: d.date, value: +(d.value / 10).toFixed(2) })),
  difficultyOverTime: daily(30, 73, 0.08, 93).map((d) => ({ date: d.date, value: +(d.value / 10).toFixed(1) })),
};

/** Purchase-difficulty share per store (BQ: difficulty responses ÷ responses, grouped by store). */
export const difficultyByStore = [
  { label: 'Trends Forum Bengaluru', value: 8.2 },
  { label: 'Trends Nexus Koramangala', value: 7.0 },
  { label: 'Trends Phoenix Market City', value: 6.4 },
  { label: 'Trends Ambience Gurgaon', value: 5.8 },
  { label: 'Trends Infinity Mall Malad', value: 5.1 },
  { label: 'Trends Lulu Kochi', value: 4.6 },
  { label: 'Trends DB City Bhopal', value: 4.2 },
];

/** Survey deployment inventory (BQ: deployment records per store). */
export const surveyDeploymentInventory = [
  { store: 'Trends Infinity Mall Malad', code: '5943', channel: 'Kiosk + SMS', deployedOn: '2026-03-11', status: 'Active', responses: '1,120' },
  { store: 'Trends Phoenix Market City', code: '8088', channel: 'Kiosk', deployedOn: '2026-03-11', status: 'Active', responses: '980' },
  { store: 'Trends Ambience Gurgaon', code: '8035', channel: 'SMS', deployedOn: '2026-04-02', status: 'Active', responses: '910' },
  { store: 'Trends Forum Bengaluru', code: '8053', channel: 'Kiosk + SMS', deployedOn: '2026-03-25', status: 'Active', responses: '870' },
  { store: 'Trends Z Square Kanpur', code: '8121', channel: 'SMS', deployedOn: '2026-05-14', status: 'Paused', responses: '210' },
  { store: 'Trends Amravati Rachanashri', code: 'TKY1', channel: 'Kiosk', deployedOn: '2026-06-01', status: 'Inactive', responses: '0' },
];

export const cxRatingDist = [
  { label: '5★', value: 15820 },
  { label: '4★', value: 10290 },
  { label: '3★', value: 3110 },
  { label: '2★', value: 1240 },
  { label: '1★', value: 780 },
];

export const purchaseDifficultySplit = [
  { label: 'No difficulty', value: 28960 },
  { label: 'Some difficulty', value: 2280 },
];

export const difficultyCategories = [
  { label: 'Could not find item', value: 940 },
  { label: 'Size unavailable', value: 720 },
  { label: 'Long billing queue', value: 380 },
  { label: 'Staff unavailable', value: 160 },
  { label: 'Payment issue', value: 80 },
];

export const writtenFeedbackParticipation = [
  { label: 'Left written feedback', value: 9410 },
  { label: 'Rating only', value: 21830 },
];

export const feedbackByStore = [
  { label: 'Trends Infinity Mall Malad', value: 1120 },
  { label: 'Trends Phoenix Market City', value: 980 },
  { label: 'Trends Ambience Gurgaon', value: 910 },
  { label: 'Trends Forum Bengaluru', value: 870 },
  { label: 'Trends Nexus Koramangala', value: 760 },
  { label: 'Trends Lulu Kochi', value: 690 },
  { label: 'Trends Seawoods Navi Mumbai', value: 610 },
  { label: 'Trends DB City Bhopal', value: 540 },
  { label: 'Trends Orion Bengaluru', value: 480 },
  { label: 'Trends VR Chennai', value: 420 },
];

export const feedbackByState = [
  { label: 'Maharashtra', value: 7240 },
  { label: 'Karnataka', value: 5110 },
  { label: 'Tamil Nadu', value: 3880 },
  { label: 'Delhi NCR', value: 3410 },
  { label: 'Telangana', value: 2760 },
  { label: 'Kerala', value: 2380 },
  { label: 'Gujarat', value: 1960 },
  { label: 'West Bengal', value: 1540 },
];

export const cxFeedbackTable = [
  { store: 'Trends Infinity Mall Malad', state: 'Maharashtra', responses: '1,120', avg: '4.42', positive: '86%', difficulty: '5.1%', wfp: '33%' },
  { store: 'Trends Phoenix Market City', state: 'Maharashtra', responses: '980', avg: '4.28', positive: '82%', difficulty: '6.4%', wfp: '31%' },
  { store: 'Trends Ambience Gurgaon', state: 'Delhi NCR', responses: '910', avg: '4.35', positive: '84%', difficulty: '5.8%', wfp: '29%' },
  { store: 'Trends Forum Bengaluru', state: 'Karnataka', responses: '870', avg: '4.19', positive: '79%', difficulty: '8.2%', wfp: '28%' },
  { store: 'Trends Nexus Koramangala', state: 'Karnataka', responses: '760', avg: '4.24', positive: '81%', difficulty: '7.0%', wfp: '30%' },
  { store: 'Trends Lulu Kochi', state: 'Kerala', responses: '690', avg: '4.40', positive: '85%', difficulty: '4.6%', wfp: '34%' },
];
