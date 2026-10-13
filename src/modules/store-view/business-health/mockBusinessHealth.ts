/**
 * Mock data for the Companion App → Business Health dashboard.
 * Prototype only — every number here is fabricated. Swap for live APIs later.
 */

/* ── helpers ─────────────────────────────────────────────────────────── */

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** A drifting daily series: `days` points starting at `base`, wandering ±`vol`%. */
function dailySeries(days: number, base: number, vol: number, seed: number) {
  const rnd = seededRandom(seed);
  const end = new Date('2026-08-31');
  const out: { date: string; value: number }[] = [];
  let v = base;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    v = Math.max(base * 0.4, v * (1 + (rnd() - 0.48) * vol));
    out.push({ date: d.toISOString().slice(0, 10), value: Math.round(v) });
  }
  return out;
}

function monthlySeries(base: number, seed: number) {
  const rnd = seededRandom(seed);
  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  let v = base;
  return months.map((m) => {
    v = Math.round(v * (1 + (rnd() - 0.35) * 0.18));
    return { month: m, value: v };
  });
}

const CR = 10_000_000;

/* ── Business Overview ───────────────────────────────────────────────── */

export const overviewKpis = [
  { key: 'egmv', label: 'e-GMV', value: '₹42.7 Cr', trend: '+12.4%', status: 'success' as const },
  { key: 'orders', label: 'Completed orders', value: '38,412', trend: '+8.1%', status: 'success' as const },
  { key: 'customers', label: 'Purchasing customers', value: '29,884', trend: '+6.7%', status: 'success' as const },
  { key: 'aov', label: 'Average order value', value: '₹11,120', trend: '+3.9%', status: 'success' as const },
  { key: 'units', label: 'Units sold', value: '1,86,540', trend: '+9.2%', status: 'success' as const },
  { key: 'fulfil', label: 'Fulfilment rate', value: '92.6%', trend: '-1.2%', status: 'warning' as const },
  { key: 'payfail', label: 'Payment failure rate', value: '4.8%', trend: '+0.9%', status: 'warning' as const },
  { key: 'orderingStores', label: 'Ordering / active stores', value: '1,204', trend: '+37', status: 'success' as const },
  { key: 'rating', label: 'Average customer rating', value: '4.31 / 5', trend: '+0.06', status: 'success' as const },
  { key: 'difficulty', label: 'Purchase-difficulty share', value: '7.3%', trend: '-0.4%', status: 'warning' as const },
  // Growth components (BQ: current period vs prior period)
  { key: 'egmvGrowth', label: 'e-GMV growth', value: '+12.4%', trend: 'vs prev period', status: 'success' as const },
  { key: 'orderGrowth', label: 'Order growth', value: '+8.1%', trend: 'vs prev period', status: 'success' as const },
  { key: 'customerGrowth', label: 'Purchasing-customer growth', value: '+6.7%', trend: 'vs prev period', status: 'success' as const },
  { key: 'storeGrowth', label: 'Ordering-store growth', value: '+3.2%', trend: 'vs prev period', status: 'success' as const },
];

/** Shown for the All-time preset, where there is no prior period to compare. */
export const growthUnavailableNote = 'Growth comparison unavailable for the All-time range.';

export const overviewTrends = {
  egmv: dailySeries(30, 1.4 * CR, 0.12, 11).map((d) => ({ date: d.date, value: +(d.value / CR).toFixed(2) })),
  orders: dailySeries(30, 1280, 0.14, 12),
  customers: dailySeries(30, 995, 0.13, 13),
  aov: dailySeries(30, 11120, 0.05, 14),
  orderingStores: dailySeries(30, 1180, 0.03, 15),
  fulfilment: dailySeries(30, 93, 0.02, 16).map((d) => ({ date: d.date, value: Math.min(99, d.value) })),
  paymentFailure: dailySeries(30, 4.8, 0.12, 17),
};

export const purchaseDifficultySplit = [
  { label: 'No difficulty reported', value: 27720 },
  { label: 'Some difficulty reported', value: 2164 },
];

/** 🔵 App/AI-generated — every input number is in BQ, the prose is not. */
export const aiBriefing = {
  label: 'Business briefing',
  question: 'How is Companion commerce performing, and where is money leaking?',
  summary:
    'Companion e-GMV reached **₹42.7 Cr** this period, up **12.4%** on the prior period, with **1,204 stores** placing at least one order and AOV steady at ₹11,120. Two leaks stand out: **fulfilment slipped to 92.6%** across 23 stores and the **payment-failure rate rose to 4.8%**, concentrated in 11 stores — together roughly **₹1.1 Cr of at-risk GMV**. Customer rating improved to 4.31 and purchase-difficulty fell to 7.3%.',
};

export const aiInsights = [
  {
    id: 'bi1',
    tone: 'critical' as const,
    confidence: 'High',
    title: 'Payment-failure cluster is concentrated and recent',
    body: 'Eleven stores drove **62% of failed payments** this period, all showing the spike within the last 9 days. The pattern matches a single PSP route — UPI intent on Android 14. Roughly **₹41 L** of orders abandoned at the payment step.',
    metric: '11 stores · ₹41 L at risk',
    recommendation: 'Route UPI-intent retries through the backup PSP and alert the 11 store managers to push QR fallback.',
  },
  {
    id: 'bi2',
    tone: 'watch' as const,
    title: 'Fulfilment dip is a staffing pattern, not demand',
    body: 'The 23 low-fulfilment stores share **weekday-evening** slot misses (5–8pm), not volume growth. Order-to-handover time is up **34 minutes** versus their own 4-week baseline.',
    metric: '92.6% fulfilment · +34 min handover',
    recommendation: 'Add one evening picker in the 23 stores for two weeks and re-measure.',
  },
  {
    id: 'bi3',
    tone: 'positive' as const,
    title: 'A1 stores have untapped basket headroom',
    body: 'A1-grade stores convert **13% above the network** but their AOV is only **at the network median**. Accessory attach-rate is 8 points lower than A stores despite similar footfall.',
    metric: '+13% conversion · flat AOV',
    recommendation: 'Trial an accessories cross-sell prompt in the Companion cart for A1 stores.',
  },
  {
    id: 'bi4',
    tone: 'watch' as const,
    title: 'South-zone aged inventory is dragging new-arrival sell-through',
    body: 'South zone holds **36.8% aged stock** versus 21% network-wide. New-arrival options get **40% less** Companion shelf exposure there because slots are occupied by carryover.',
    metric: '36.8% aged (network 21%)',
    recommendation: 'Mark down and clear the oldest 15% in South zone before the next drop lands.',
  },
];

export const orderLifecycle = [
  { label: 'Handed over', value: 35578, tone: 'success' as const },
  { label: 'In fulfilment', value: 1841, tone: 'info' as const },
  { label: 'Pending / incomplete', value: 1206, tone: 'warning' as const },
  { label: 'Payment failed', value: 1934, tone: 'critical' as const },
];

export const topStoresByEgmv = [
  { label: 'Trends Infinity Mall Malad', value: 2.31 },
  { label: 'Trends Phoenix Market City', value: 2.08 },
  { label: 'Trends Ambience Gurgaon', value: 1.94 },
  { label: 'Trends Forum Bengaluru', value: 1.77 },
  { label: 'Trends Nexus Koramangala', value: 1.61 },
  { label: 'Trends Lulu Kochi', value: 1.44 },
  { label: 'Trends Seawoods Navi Mumbai', value: 1.32 },
  { label: 'Trends DB City Bhopal', value: 1.19 },
];

export const topStatesByEgmv = [
  { label: 'Maharashtra', value: 9.4 },
  { label: 'Karnataka', value: 6.8 },
  { label: 'Tamil Nadu', value: 5.1 },
  { label: 'Delhi NCR', value: 4.7 },
  { label: 'Telangana', value: 3.9 },
  { label: 'Kerala', value: 3.3 },
  { label: 'Gujarat', value: 2.8 },
  { label: 'West Bengal', value: 2.4 },
];

export const ratingDistribution = [
  { label: '5★', value: 14820 },
  { label: '4★', value: 11240 },
  { label: '3★', value: 3110 },
  { label: '2★', value: 940 },
  { label: '1★', value: 610 },
];

/** Thresholds for Healthy / Watch / Attention are placeholders — agree with the business before shipping. */
export const attentionCards = [
  // Currently live
  { key: 'noOrders', title: 'Stores without orders', value: '914 stores', note: 'Eligible, zero completed orders in period', status: 'warning' as const },
  { key: 'checkoutRate', title: 'Checkout-to-payment rate', value: '61.9%', note: 'Below 70% target', status: 'warning' as const },
  { key: 'scanSuccess', title: 'Scan lookup success', value: '88.4%', note: 'Below 90% target', status: 'warning' as const },
  { key: 'catalogue', title: 'Catalogue completion', value: '74.6%', note: 'Below 80% target', status: 'warning' as const },
  // BQ-ready additions
  { key: 'egmvDecline', title: 'e-GMV decline vs previous period', value: '18 stores', note: 'e-GMV down >15% MoM', status: 'critical' as const },
  { key: 'orderDecline', title: 'Order decline vs previous period', value: '22 stores', note: 'Order count down >15% MoM', status: 'critical' as const },
  { key: 'payfail', title: 'High payment failure', value: '11 stores', note: 'Failure rate above 8%', status: 'critical' as const },
  { key: 'fulfil', title: 'Low fulfilment', value: '23 stores', note: 'Below 85% fulfilment', status: 'warning' as const },
  { key: 'scanNoOrder', title: 'Stores with scans but no orders', value: '46 stores', note: 'Scan activity, zero completed orders', status: 'warning' as const },
  { key: 'decliningActivity', title: 'Stores with declining order activity', value: '29 stores', note: 'Order count falling 3 weeks running', status: 'warning' as const },
  { key: 'difficulty', title: 'Increasing purchase difficulty', value: '9 stores', note: 'Difficulty rate above 15%', status: 'warning' as const },
];

/* ── Sales Performance ───────────────────────────────────────────────── */

export const salesKpis = [
  { key: 'orders', label: 'Completed orders', value: '38,412', trend: '+8.1%', status: 'success' as const },
  { key: 'egmv', label: 'e-GMV', value: '₹42.7 Cr', trend: '+12.4%', status: 'success' as const },
  { key: 'aov', label: 'Average order value', value: '₹11,120', trend: '+3.9%', status: 'success' as const },
  { key: 'units', label: 'Units sold', value: '1,86,540', trend: '+9.2%', status: 'success' as const },
  { key: 'upo', label: 'Units per order', value: '4.86', trend: '+0.1', status: 'success' as const },
  { key: 'customers', label: 'Purchasing customers', value: '29,884', trend: '+6.7%', status: 'success' as const },
  { key: 'fulfil', label: 'Fulfilment rate', value: '92.6%', trend: '-1.2%', status: 'warning' as const },
  { key: 'payfail', label: 'Payment failure rate', value: '4.8%', trend: '+0.9%', status: 'warning' as const },
];

export const salesStatusRibbon = [
  { label: 'Handed over to customer', value: 35578, tone: 'success' as const },
  { label: 'Pending / incomplete attempts', value: 900, tone: 'warning' as const },
  { label: 'Payment failed', value: 1934, tone: 'critical' as const },
];

export const salesTrends = {
  dailyOrders: dailySeries(30, 1280, 0.14, 21),
  dailyEgmv: dailySeries(30, 1.4 * CR, 0.12, 22).map((d) => ({ date: d.date, value: +(d.value / CR).toFixed(2) })),
  monthlyOrders: monthlySeries(28000, 23),
  monthlyEgmv: monthlySeries(31, 24),
  aov: dailySeries(30, 11120, 0.05, 25),
  customers: dailySeries(30, 995, 0.13, 26),
  fulfilment: dailySeries(30, 93, 0.02, 27).map((d) => ({ date: d.date, value: Math.min(99, d.value) })),
  paymentFailure: dailySeries(30, 4.8, 0.12, 28),
};

/** Stores ranked by completed-order count (vs storesByEgmv which ranks by revenue). */
export const storesByOrderCount = [
  { label: 'Trends Infinity Mall Malad', value: 1240 },
  { label: 'Trends Phoenix Market City', value: 1118 },
  { label: 'Trends Ambience Gurgaon', value: 1004 },
  { label: 'Trends Forum Bengaluru', value: 947 },
  { label: 'Trends Nexus Koramangala', value: 861 },
  { label: 'Trends Lulu Kochi', value: 792 },
  { label: 'Trends Seawoods Navi Mumbai', value: 703 },
  { label: 'Trends DB City Bhopal', value: 640 },
  { label: 'Trends Orion Bengaluru', value: 512 },
  { label: 'Trends VR Chennai', value: 486 },
];

export const orderValueHistogram = [
  { label: '<₹2k', value: 3120 },
  { label: '₹2–5k', value: 7480 },
  { label: '₹5–10k', value: 11890 },
  { label: '₹10–20k', value: 9240 },
  { label: '₹20–35k', value: 4180 },
  { label: '₹35–50k', value: 1620 },
  { label: '>₹50k', value: 882 },
];

export const topBrandsByEgmv = [
  { label: 'Netplay', value: 6.2 },
  { label: 'Performax', value: 5.4 },
  { label: 'Teamspirit', value: 4.1 },
  { label: 'DNMX', value: 3.7 },
  { label: 'Fig', value: 3.2 },
  { label: 'Avaasa', value: 2.9 },
  { label: 'Rio', value: 2.4 },
  { label: 'Pantaloons Kidz', value: 1.8 },
];

export const brandUnitsSold = [
  { brand: 'Netplay', units: 24310, egmv: '₹6.2 Cr' },
  { brand: 'Performax', units: 21870, egmv: '₹5.4 Cr' },
  { brand: 'Teamspirit', units: 17640, egmv: '₹4.1 Cr' },
  { brand: 'DNMX', units: 15020, egmv: '₹3.7 Cr' },
  { brand: 'Fig', units: 12880, egmv: '₹3.2 Cr' },
  { brand: 'Avaasa', units: 11540, egmv: '₹2.9 Cr' },
];

export const paymentModeShare = [
  { label: 'UPI', value: 18420 },
  { label: 'Credit card', value: 9240 },
  { label: 'Debit card', value: 5110 },
  { label: 'Net banking', value: 2870 },
  { label: 'Wallet / BNPL', value: 2772 },
];

export const revenueByState = [
  { label: 'Maharashtra', value: 9.4 },
  { label: 'Karnataka', value: 6.8 },
  { label: 'Tamil Nadu', value: 5.1 },
  { label: 'Delhi NCR', value: 4.7 },
  { label: 'Telangana', value: 3.9 },
  { label: 'Kerala', value: 3.3 },
  { label: 'Gujarat', value: 2.8 },
  { label: 'West Bengal', value: 2.4 },
  { label: 'Rajasthan', value: 2.0 },
  { label: 'Uttar Pradesh', value: 1.9 },
  { label: 'Madhya Pradesh', value: 1.6 },
  { label: 'Punjab', value: 1.3 },
];

export const ordersByState = revenueByState.map((r, i) => ({
  state: r.label,
  orders: Math.round(r.value * 900 + i * 40),
  egmv: `₹${r.value.toFixed(1)} Cr`,
}));

export const storesByEgmv = topStoresByEgmv.concat([
  { label: 'Trends Orion Bengaluru', value: 1.08 },
  { label: 'Trends VR Chennai', value: 0.97 },
  { label: 'Trends Pacific Delhi', value: 0.89 },
  { label: 'Trends Z Square Kanpur', value: 0.81 },
]);

export interface SalesRow {
  date: string;
  orderId: string;
  store: string;
  state: string;
  customer: string;
  units: number;
  egmv: string;
  payment: string;
  status: string;
}

export const salesTable: SalesRow[] = Array.from({ length: 24 }, (_, i) => {
  const rnd = seededRandom(900 + i);
  const stores = topStoresByEgmv.map((s) => s.label);
  const states = topStatesByEgmv.map((s) => s.label);
  const payments = ['UPI', 'Credit card', 'Debit card', 'Net banking', 'Wallet / BNPL'];
  const statuses = ['Handed over', 'Handed over', 'Handed over', 'Pending', 'Payment failed'];
  const d = new Date('2026-08-31');
  d.setDate(d.getDate() - Math.floor(rnd() * 28));
  return {
    date: d.toISOString().slice(0, 10),
    orderId: `CMP-${(482100 + i).toString()}`,
    store: stores[Math.floor(rnd() * stores.length)]!,
    state: states[Math.floor(rnd() * states.length)]!,
    customer: `cust_${Math.floor(rnd() * 90000 + 10000)}`,
    units: Math.floor(rnd() * 8) + 1,
    egmv: `₹${(Math.floor(rnd() * 42000) + 1800).toLocaleString('en-IN')}`,
    payment: payments[Math.floor(rnd() * payments.length)]!,
    status: statuses[Math.floor(rnd() * statuses.length)]!,
  };
});

/* ── Store Performance ───────────────────────────────────────────────── */

export const storeKpis = [
  { key: 'eligible', label: 'Eligible Companion stores', value: '2,118', trend: 'Network', status: 'success' as const },
  { key: 'active', label: 'Stores with Companion activity', value: '1,642', trend: '77.5%', status: 'success' as const },
  { key: 'ordering', label: 'Stores with completed orders', value: '1,204', trend: '+37', status: 'success' as const },
  { key: 'scanning', label: 'Stores with scans', value: '1,489', trend: '70.3%', status: 'success' as const },
  { key: 'scanOnly', label: 'Scan-only stores', value: '285', trend: 'No orders', status: 'warning' as const },
  { key: 'inactive', label: 'Stores without recent activity', value: '476', trend: '22.5%', status: 'warning' as const },
  { key: 'orders', label: 'Completed orders', value: '38,412', trend: '+8.1%', status: 'success' as const },
  { key: 'egmv', label: 'e-GMV', value: '₹42.7 Cr', trend: '+12.4%', status: 'success' as const },
  { key: 'opos', label: 'Orders per active store', value: '31.9', trend: '+1.4', status: 'success' as const },
  { key: 'scanSuccess', label: 'Scan lookup success', value: '88.4%', trend: '+0.7%', status: 'success' as const },
  { key: 'scanLookups', label: 'GA4 scan lookups', value: '3,64,200', trend: '+9.1%', status: 'success' as const },
  { key: 'noOrders', label: 'Stores with no completed orders', value: '914', trend: '43.2%', status: 'warning' as const },
  { key: 'latestDay', label: 'Stores ordering on latest complete day', value: '742', trend: '2026-08-30', status: 'success' as const },
  { key: 'ordersNoScans', label: 'Stores with orders but no scans', value: '61', trend: 'Order-only', status: 'warning' as const },
];

export const storeActivityMix = [
  { label: 'Ordering + scanning', value: 1042 },
  { label: 'Ordering only', value: 162 },
  { label: 'Scan only', value: 285 },
  { label: 'Registered, inactive', value: 476 },
  { label: 'Not onboarded', value: 153 },
];

export const storeActivityTrends = {
  activeStores: dailySeries(30, 1580, 0.03, 31),
  orderingStores: dailySeries(30, 1180, 0.03, 32),
  scans: dailySeries(30, 14200, 0.09, 33),
  scanActiveStores: dailySeries(30, 1460, 0.03, 34),
};

export const orderRecency = [
  { label: '0–3 days', value: 742 },
  { label: '4–7 days', value: 268 },
  { label: '8–14 days', value: 121 },
  { label: '15–30 days', value: 73 },
  { label: '>30 days', value: 476 },
];

export const topStoresByOrders = [
  { label: 'Trends Infinity Mall Malad', value: 1240 },
  { label: 'Trends Phoenix Market City', value: 1118 },
  { label: 'Trends Ambience Gurgaon', value: 1004 },
  { label: 'Trends Forum Bengaluru', value: 947 },
  { label: 'Trends Nexus Koramangala', value: 861 },
  { label: 'Trends Lulu Kochi', value: 792 },
  { label: 'Trends Seawoods Navi Mumbai', value: 703 },
  { label: 'Trends DB City Bhopal', value: 640 },
];

export const topStoresByScans = [
  { label: 'Trends Infinity Mall Malad', value: 4110 },
  { label: 'Trends Forum Bengaluru', value: 3806 },
  { label: 'Trends Phoenix Market City', value: 3720 },
  { label: 'Trends Ambience Gurgaon', value: 3512 },
  { label: 'Trends Nexus Koramangala', value: 3288 },
  { label: 'Trends Lulu Kochi', value: 3040 },
  { label: 'Trends Seawoods Navi Mumbai', value: 2760 },
  { label: 'Trends DB City Bhopal', value: 2515 },
];

export const stateStoreActivity = [
  { state: 'MH', ordering: 214, scanOnly: 41, inactive: 66 },
  { state: 'KA', ordering: 168, scanOnly: 33, inactive: 52 },
  { state: 'TN', ordering: 141, scanOnly: 28, inactive: 47 },
  { state: 'DL', ordering: 122, scanOnly: 19, inactive: 38 },
  { state: 'TS', ordering: 104, scanOnly: 22, inactive: 31 },
  { state: 'KL', ordering: 96, scanOnly: 17, inactive: 26 },
  { state: 'GJ', ordering: 88, scanOnly: 24, inactive: 34 },
];

export const scansVsOrders = [
  { store: 'Infinity Mall Malad', scans: 4110, orders: 1240 },
  { store: 'Forum Bengaluru', scans: 3806, orders: 947 },
  { store: 'Phoenix Market City', scans: 3720, orders: 1118 },
  { store: 'Ambience Gurgaon', scans: 3512, orders: 1004 },
  { store: 'Nexus Koramangala', scans: 3288, orders: 861 },
  { store: 'Lulu Kochi', scans: 3040, orders: 792 },
  { store: 'Seawoods Navi Mumbai', scans: 2760, orders: 703 },
  { store: 'DB City Bhopal', scans: 2515, orders: 640 },
  { store: 'Orion Bengaluru', scans: 1980, orders: 210 },
  { store: 'VR Chennai', scans: 1740, orders: 180 },
  { store: 'Z Square Kanpur', scans: 990, orders: 20 },
  { store: 'Pacific Delhi', scans: 860, orders: 0 },
];

export interface StoreDirRow {
  name: string;
  id: string;
  code: string;
  city: string;
  state: string;
  activity: string;
  orders: number;
  egmv: string;
  scans: number;
  scanSuccess: string;
  lastOrder: string;
  daysSince: number;
}

function dirRow(
  name: string, id: string, code: string, city: string, state: string, activity: string,
  orders: number, egmv: string, scans: number, scanSuccess: string, lastOrder: string, daysSince: number,
): StoreDirRow {
  return { name, id, code, city, state, activity, orders, egmv, scans, scanSuccess, lastOrder, daysSince };
}

export const storeDirectory: StoreDirRow[] = [
  dirRow('Trends Infinity Mall Malad', 'ST-5943', '5943', 'Mumbai', 'Maharashtra', 'Ordering + scanning', 1240, '₹2.31 Cr', 4110, '91.2%', '2026-08-31', 0),
  dirRow('Trends Phoenix Market City', 'ST-8088', '8088', 'Mumbai', 'Maharashtra', 'Ordering + scanning', 1118, '₹2.08 Cr', 3720, '89.6%', '2026-08-30', 1),
  dirRow('Trends Ambience Gurgaon', 'ST-8035', '8035', 'Gurugram', 'Delhi NCR', 'Ordering + scanning', 1004, '₹1.94 Cr', 3512, '90.1%', '2026-08-31', 0),
  dirRow('Trends Forum Bengaluru', 'ST-8053', '8053', 'Bengaluru', 'Karnataka', 'Ordering + scanning', 947, '₹1.77 Cr', 3806, '88.9%', '2026-08-29', 2),
  dirRow('Trends Nexus Koramangala', 'ST-8055', '8055', 'Bengaluru', 'Karnataka', 'Ordering + scanning', 861, '₹1.61 Cr', 3288, '87.4%', '2026-08-31', 0),
  dirRow('Trends Lulu Kochi', 'ST-8071', '8071', 'Kochi', 'Kerala', 'Ordering + scanning', 792, '₹1.44 Cr', 3040, '90.8%', '2026-08-28', 3),
  dirRow('Trends Seawoods Navi Mumbai', 'ST-9567', '9567', 'Navi Mumbai', 'Maharashtra', 'Ordering + scanning', 703, '₹1.32 Cr', 2760, '89.2%', '2026-08-30', 1),
  dirRow('Trends DB City Bhopal', 'ST-8072', '8072', 'Bhopal', 'Madhya Pradesh', 'Ordering + scanning', 640, '₹1.19 Cr', 2515, '86.7%', '2026-08-27', 4),
  dirRow('Trends Orion Bengaluru', 'ST-8090', '8090', 'Bengaluru', 'Karnataka', 'Ordering only', 210, '₹0.41 Cr', 1980, '85.1%', '2026-08-25', 6),
  dirRow('Trends Z Square Kanpur', 'ST-8121', '8121', 'Kanpur', 'Uttar Pradesh', 'Scan only', 0, '₹0.00 Cr', 990, '82.0%', '—', 62),
  dirRow('Trends Pacific Delhi', 'ST-8140', '8140', 'New Delhi', 'Delhi NCR', 'Scan only', 0, '₹0.00 Cr', 860, '80.4%', '—', 74),
  dirRow('Trends Amravati Rachanashri', 'ST-TKY1', 'TKY1', 'Amravati', 'Maharashtra', 'Registered, inactive', 0, '₹0.00 Cr', 0, '—', '—', 118),
];

export interface StoreDetail {
  name: string;
  code: string;
  city: string;
  state: string;
  orders: number;
  egmv: string;
  scanAttempts: number;
  scanSuccess: number;
  scanSuccessRate: string;
  lastOrder: string;
  dailyOrders: { date: string; value: number }[];
  dailyEgmv: { date: string; value: number }[];
  dailyScans: { date: string; value: number }[];
  topBrands: { label: string; value: number }[];
  paymentSplit: { label: string; value: number }[];
}

const BRAND_MIX = [
  { label: 'Netplay', w: 0.26 },
  { label: 'Performax', w: 0.22 },
  { label: 'Teamspirit', w: 0.17 },
  { label: 'DNMX', w: 0.13 },
  { label: 'Fig', w: 0.1 },
  { label: 'Avaasa', w: 0.08 },
];
const PAYMENT_MIX = [
  { label: 'UPI', w: 0.5 },
  { label: 'Credit card', w: 0.26 },
  { label: 'Debit card', w: 0.14 },
  { label: 'Net banking', w: 0.06 },
  { label: 'Wallet / BNPL', w: 0.04 },
];

function parseCr(egmv: string): number {
  const n = parseFloat(egmv.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
function codeSeed(code: string): number {
  return [...code].reduce((s, c) => s + c.charCodeAt(0), 7);
}

/** Build a per-store detail view from a directory row (mock — deterministic by store code). */
export function makeStoreDetail(row: StoreDirRow): StoreDetail {
  const seed = codeSeed(row.code);
  const egmvCr = parseCr(row.egmv);
  const egmvLakhs = egmvCr * 100; // ₹ Cr → ₹ L
  const rate = parseFloat(row.scanSuccess.replace(/[^\d.]/g, '')) || 0;
  const scanAttempts = rate > 0 ? Math.round(row.scans / (rate / 100)) : Math.round(row.scans * 1.12);

  return {
    name: row.name,
    code: row.code,
    city: row.city,
    state: row.state,
    orders: row.orders,
    egmv: row.egmv,
    scanAttempts,
    scanSuccess: row.scans,
    scanSuccessRate: row.scanSuccess === '—' ? 'N/A' : row.scanSuccess,
    lastOrder: row.lastOrder,
    dailyOrders: dailySeries(30, Math.max(1, row.orders / 30), 0.22, seed),
    dailyEgmv: dailySeries(30, Math.max(0.1, egmvLakhs / 30) * 1000, 0.2, seed + 1).map((d) => ({
      date: d.date,
      value: +(d.value / 1000).toFixed(2),
    })),
    dailyScans: dailySeries(30, Math.max(1, row.scans / 30), 0.18, seed + 2),
    topBrands: BRAND_MIX.map((b) => ({ label: b.label, value: +(egmvLakhs * b.w).toFixed(1) })),
    paymentSplit: PAYMENT_MIX.map((p) => ({ label: p.label, value: Math.round(row.orders * p.w) })),
  };
}

/** Default store shown when nothing is selected. */
export const individualStore: StoreDetail = makeStoreDetail(storeDirectory[0]!);
