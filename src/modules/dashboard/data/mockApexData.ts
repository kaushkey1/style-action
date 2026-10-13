// Apex Persona (Apex Leadership) — Mock Data

// ─── Weekly Reviews ─────────────────────────────────────────────────

export interface WeeklyReview {
  id: string;
  leader: string;
  role: string;
  topics: string[];
  status: 'overdue' | 'due-this-week' | 'scheduled' | 'completed';
  date: string;
  lastReviewDate: string;
  lastReviewSummary: string;
  keyMetrics: { name: string; value: string; status: 'on-track' | 'warning' | 'critical' }[];
  escalationItems: string[];
}

export const weeklyReviews: WeeklyReview[] = [
  {
    id: 'wr-1',
    leader: 'Saurabh Sharma',
    role: 'Buying & Selling Head',
    topics: ['Aged inventory liquidation', 'Sell-through velocity', 'Vendor consolidation Phase 2', 'Fashion pyramid compliance'],
    status: 'overdue',
    date: '2026-02-14',
    lastReviewDate: '2026-02-07',
    lastReviewSummary: 'Committed to clearing ₹80 Cr aged stock by Feb 28. Vendor count at 142 — target 70 by May 1. Fashion cap breach in 3 categories.',
    keyMetrics: [
      { name: 'Sell-Through', value: '68%', status: 'warning' },
      { name: 'Aged Inventory', value: '₹325 Cr', status: 'critical' },
      { name: 'Vendor Count', value: '142', status: 'warning' },
      { name: 'Fashion Mix', value: '38%', status: 'critical' },
    ],
    escalationItems: [
      'Fashion pyramid breach in Menswear, Women Western, Kids — no corrective action in 14 days',
      'Vendor consolidation stalled at 142 vs 70 target — timeline slip risk',
    ],
  },
  {
    id: 'wr-2',
    leader: 'Anita Sharma',
    role: 'Category Director — Women\'s',
    topics: ['Women Indian sell-through', 'Kurta category restructure', 'Ethnic wear GM recovery'],
    status: 'completed',
    date: '2026-02-12',
    lastReviewDate: '2026-02-12',
    lastReviewSummary: 'Women Indian ST improved from 54% to 61%. Kurta pod restructured — 3 sub-pods now live. GM gap vs target: 1.8 pts. Action plan shared for ethnic wear markdown recovery.',
    keyMetrics: [
      { name: 'Women Indian ST', value: '61%', status: 'warning' },
      { name: 'Kurta Category GM', value: '39.2%', status: 'warning' },
      { name: 'Fresh %', value: '48%', status: 'critical' },
      { name: 'Options Rationalized', value: '320', status: 'on-track' },
    ],
    escalationItems: [],
  },
  {
    id: 'wr-3',
    leader: 'Vikram Mehta',
    role: 'Sourcing Director',
    topics: ['PO-to-shelf reduction', 'Fabric rationalization', 'Vendor OTIF improvement', 'Quality first-pass yield'],
    status: 'due-this-week',
    date: '2026-02-21',
    lastReviewDate: '2026-02-14',
    lastReviewSummary: 'PO-to-shelf at 32 days vs 30 target. Fabric count at 890 vs 200 target — plan to reach 400 by March. OTIF at 82% — 5 vendors below 70% flagged for exit.',
    keyMetrics: [
      { name: 'PO-to-Shelf', value: '32 days', status: 'warning' },
      { name: 'Fabric Count', value: '890', status: 'critical' },
      { name: 'Vendor OTIF', value: '82%', status: 'critical' },
      { name: 'First-Pass Yield', value: '91%', status: 'warning' },
    ],
    escalationItems: [
      '5 vendors with OTIF below 70% — exit decision pending for 3 weeks',
    ],
  },
  {
    id: 'wr-4',
    leader: 'Priya Nair',
    role: 'Marketing Director',
    topics: ['Campaign ROAS tracking', 'WhatsApp commerce scale-up', 'Loyalty program conversion', 'Content ROI'],
    status: 'overdue',
    date: '2026-02-10',
    lastReviewDate: '2026-02-03',
    lastReviewSummary: 'Blended ROAS at 3.8x vs 4.0x target. WhatsApp revenue at 3% vs 5% target. Loyalty base at 1.8M — conversion rate below target.',
    keyMetrics: [
      { name: 'Blended ROAS', value: '3.8x', status: 'warning' },
      { name: 'WhatsApp Revenue %', value: '3%', status: 'warning' },
      { name: 'Loyalty Conversion', value: '28%', status: 'warning' },
      { name: 'Campaign Revenue', value: '₹42 Cr', status: 'warning' },
    ],
    escalationItems: [
      'No review conducted for 15 days — marketing ROAS declining without course correction',
    ],
  },
  {
    id: 'wr-5',
    leader: 'Rajesh Kumar',
    role: 'Regional Director — West & South',
    topics: ['Store renovation progress', 'Bottom 20 store turnaround', 'Competition response (Zara/H&M)', 'NPS improvement plan'],
    status: 'due-this-week',
    date: '2026-02-19',
    lastReviewDate: '2026-02-12',
    lastReviewSummary: '412 renovations complete out of 920 target for West+South. Bottom 20 stores plan shared — 4 recommended for closure. Zara opened 2 new stores in catchment.',
    keyMetrics: [
      { name: 'Renovations Done', value: '412 / 920', status: 'warning' },
      { name: 'Bottom 20 Avg Score', value: '44/100', status: 'critical' },
      { name: 'NPS (Region)', value: '62', status: 'warning' },
      { name: 'VM Compliance', value: '76%', status: 'warning' },
    ],
    escalationItems: [
      'Renovation contractor delays in Mumbai cluster — 28 stores behind schedule',
    ],
  },
  {
    id: 'wr-6',
    leader: 'Sonia Patel',
    role: 'Regional Director — North & East',
    topics: ['North India expansion', 'Tier-2 store performance', 'Staff attrition in East', 'Inventory allocation gaps'],
    status: 'scheduled',
    date: '2026-02-25',
    lastReviewDate: '2026-02-11',
    lastReviewSummary: 'North cluster performing at 88% of target. East attrition at 6.2% vs 3% target — retention plan submitted. 18 Tier-2 stores below break-even.',
    keyMetrics: [
      { name: 'Revenue vs Target', value: '88%', status: 'warning' },
      { name: 'Staff Attrition', value: '6.2%', status: 'critical' },
      { name: 'Tier-2 Break-Even', value: '72%', status: 'warning' },
      { name: 'Inventory Accuracy', value: '93.2%', status: 'warning' },
    ],
    escalationItems: [],
  },
  {
    id: 'wr-7',
    leader: 'Amit Desai',
    role: 'Ops & Control Tower Lead',
    topics: ['Exception resolution SLA', 'Agent workforce effectiveness', 'Infrastructure rollout (RFID, WiFi)', 'Delivery SLA'],
    status: 'overdue',
    date: '2026-02-07',
    lastReviewDate: '2026-01-31',
    lastReviewSummary: 'Exception resolution at 8 hrs vs 4 hr target. Agent auto-resolution at 47%. RFID rollout at 98 stores vs 209 target. WiFi at 187/209.',
    keyMetrics: [
      { name: 'Exception Latency', value: '8 hrs', status: 'warning' },
      { name: 'Agent Auto-Resolve', value: '47%', status: 'warning' },
      { name: 'RFID Rollout', value: '98 / 209', status: 'critical' },
      { name: 'On-Time Delivery', value: '91%', status: 'warning' },
    ],
    escalationItems: [
      'No review conducted for 18 days — RFID rollout critically behind schedule',
      'Exception resolution SLA missed for 3 consecutive weeks',
    ],
  },
  {
    id: 'wr-8',
    leader: 'Manoj Bhargava',
    role: 'Finance & Working Capital',
    topics: ['Working capital optimization', 'Inventory days reduction', 'Vendor credit terms', 'B2B liquidation margin'],
    status: 'completed',
    date: '2026-02-13',
    lastReviewDate: '2026-02-13',
    lastReviewSummary: 'Inventory days at 95 vs 90 target. Vendor credit improved to 28 days. B2B channel clearing aged stock at 4.2% margin (above 3% floor). Working capital freed: ₹42 Cr.',
    keyMetrics: [
      { name: 'Inventory Days', value: '95 days', status: 'warning' },
      { name: 'Vendor Credit', value: '28 days', status: 'warning' },
      { name: 'B2B Margin', value: '4.2%', status: 'on-track' },
      { name: 'WC Freed', value: '₹42 Cr', status: 'on-track' },
    ],
    escalationItems: [],
  },
];

// ─── Actionables ────────────────────────────────────────────────────

export interface Actionable {
  id: string;
  metric: string;
  current: string;
  target: string;
  owner: string;
  ownerRole: string;
  deadline: string;
  status: 'on-track' | 'at-risk' | 'overdue' | 'completed';
  benchmark: string;
  benchmarkSource: string;
  escalationPath: string;
  trajectory: string;
}

export const actionables: Actionable[] = [
  {
    id: 'act-1',
    metric: 'Daily Revenue Run Rate',
    current: '₹74 Cr/day',
    target: '₹100 Cr/day',
    owner: 'Saurabh Sharma',
    ownerRole: 'Buying & Selling Head',
    deadline: '2026-06-30',
    status: 'at-risk',
    benchmark: '₹18,000/sqft (Zudio)',
    benchmarkSource: 'Zudio',
    escalationPath: 'If below ₹80 Cr/day by Mar 31 → Saurabh + Manoj escalate to Chairman',
    trajectory: '₹74 Cr → ₹82 Cr (Mar) → ₹91 Cr (May) → ₹100 Cr (Jun)',
  },
  {
    id: 'act-2',
    metric: 'Aged Inventory (>180 days)',
    current: '₹325 Cr',
    target: '₹0',
    owner: 'Saurabh Sharma',
    ownerRole: 'Buying & Selling Head',
    deadline: '2026-06-30',
    status: 'overdue',
    benchmark: '15-day turns (Zudio)',
    benchmarkSource: 'Zudio',
    escalationPath: 'Weekly tracking. If not reduced by ₹40 Cr/month → B2B liquidation at any positive margin',
    trajectory: '₹325 Cr → ₹245 Cr (Mar) → ₹165 Cr (Apr) → ₹85 Cr (May) → ₹0 (Jun)',
  },
  {
    id: 'act-3',
    metric: 'Vendor Count',
    current: '142',
    target: '70',
    owner: 'Vikram Mehta',
    ownerRole: 'Sourcing Director',
    deadline: '2026-05-01',
    status: 'at-risk',
    benchmark: '50-60 strategic partners (target)',
    benchmarkSource: 'Internal',
    escalationPath: 'If not at 100 by Mar 15 → Vikram presents exit list to Chairman',
    trajectory: '142 → 110 (Mar) → 85 (Apr) → 70 (May)',
  },
  {
    id: 'act-4',
    metric: 'Fabric Count',
    current: '890',
    target: '200',
    owner: 'Vikram Mehta',
    ownerRole: 'Sourcing Director',
    deadline: '2026-06-30',
    status: 'overdue',
    benchmark: 'Zara: ~300 core fabrics',
    benchmarkSource: 'Zara',
    escalationPath: 'If not at 400 by Mar 31 → review sourcing leadership',
    trajectory: '890 → 600 (Mar) → 400 (Apr) → 280 (May) → 200 (Jun)',
  },
  {
    id: 'act-5',
    metric: 'Store Renovations',
    current: '842 / 1,806',
    target: '1,806',
    owner: 'Rajesh Kumar',
    ownerRole: 'Regional Director',
    deadline: '2026-03-31',
    status: 'at-risk',
    benchmark: 'Daily video updates required',
    benchmarkSource: 'Internal',
    escalationPath: 'If below 1,200 by Mar 1 → contractor replacement + weekend shifts',
    trajectory: '842 → 1,100 (Mar 1) → 1,450 (Mar 15) → 1,806 (Mar 31)',
  },
  {
    id: 'act-6',
    metric: 'Fashion Pyramid Compliance',
    current: '38% fashion (cap: 30%)',
    target: '≤30% fashion',
    owner: 'Saurabh Sharma',
    ownerRole: 'Buying & Selling Head',
    deadline: '2026-03-31',
    status: 'overdue',
    benchmark: 'Zudio: 95% core/essential',
    benchmarkSource: 'Zudio',
    escalationPath: 'Immediate buying freeze on fashion above 30% cap. No exceptions.',
    trajectory: '38% → 34% (Mar) → 30% (Apr) — buying freeze enforced',
  },
  {
    id: 'act-7',
    metric: 'Sell-Through (Full Price, 90 days)',
    current: '68%',
    target: '75%',
    owner: 'Anita Sharma',
    ownerRole: 'Category Director',
    deadline: '2026-04-30',
    status: 'at-risk',
    benchmark: 'Zara: 85% full-price ST',
    benchmarkSource: 'Zara',
    escalationPath: 'If below 70% by Mar 31 → category pod restructure',
    trajectory: '68% → 70% (Mar) → 72% (Apr) → 75% (May)',
  },
  {
    id: 'act-8',
    metric: 'RFID Rollout',
    current: '98 / 209 stores',
    target: '209 stores',
    owner: 'Amit Desai',
    ownerRole: 'Ops Lead',
    deadline: '2026-04-01',
    status: 'overdue',
    benchmark: 'Inditex: 100% RFID across all stores',
    benchmarkSource: 'Zara',
    escalationPath: 'If not at 150 by Mar 1 → vendor replacement + parallel deployment teams',
    trajectory: '98 → 150 (Mar 1) → 185 (Mar 15) → 209 (Apr 1)',
  },
  {
    id: 'act-9',
    metric: 'Customer NPS',
    current: '64',
    target: '75',
    owner: 'Rajesh Kumar',
    ownerRole: 'Regional Director',
    deadline: '2026-06-30',
    status: 'on-track',
    benchmark: 'Zara India: 72',
    benchmarkSource: 'Zara',
    escalationPath: 'Monthly review. If NPS drops below 60 → store manager changes',
    trajectory: '64 → 67 (Mar) → 70 (Apr) → 73 (May) → 75 (Jun)',
  },
  {
    id: 'act-10',
    metric: 'WhatsApp Commerce Revenue %',
    current: '3%',
    target: '5%',
    owner: 'Priya Nair',
    ownerRole: 'Marketing Director',
    deadline: '2026-04-30',
    status: 'at-risk',
    benchmark: 'Meesho: 8% social commerce',
    benchmarkSource: 'Meesho',
    escalationPath: 'If below 3.5% by Mar 15 → reallocate marketing budget from Meta to WhatsApp',
    trajectory: '3% → 3.5% (Mar) → 4.2% (Apr) → 5% (May)',
  },
  {
    id: 'act-11',
    metric: 'Working Capital (Inventory Days)',
    current: '95 days',
    target: '90 days',
    owner: 'Manoj Bhargava',
    ownerRole: 'Finance Head',
    deadline: '2026-03-31',
    status: 'on-track',
    benchmark: 'Zudio: 45 days',
    benchmarkSource: 'Zudio',
    escalationPath: 'If not at 92 days by Mar 15 → vendor credit renegotiation + aged stock fire sale',
    trajectory: '95 days → 93 (Mar 1) → 91 (Mar 15) → 90 (Mar 31)',
  },
  {
    id: 'act-12',
    metric: 'Impetus Platform Adoption',
    current: '22%',
    target: '100%',
    owner: 'Amit Desai',
    ownerRole: 'Ops Lead',
    deadline: '2026-04-01',
    status: 'at-risk',
    benchmark: 'All ordering through Impetus from Apr 1',
    benchmarkSource: 'Internal',
    escalationPath: 'If below 60% by Mar 15 → mandatory training + legacy system shutdown',
    trajectory: '22% → 45% (Mar 1) → 75% (Mar 15) → 100% (Apr 1)',
  },
  {
    id: 'act-13',
    metric: 'Gross Margin',
    current: '41.7%',
    target: '≥42%',
    owner: 'Saurabh Sharma',
    ownerRole: 'Buying & Selling Head',
    deadline: '2026-03-31',
    status: 'on-track',
    benchmark: 'Zudio: 44% GM',
    benchmarkSource: 'Zudio',
    escalationPath: 'If GM drops below 41% → discount approval escalated to Chairman',
    trajectory: '41.7% → 41.9% (Mar 1) → 42.1% (Mar 15) → 42.3% (Mar 31)',
  },
  {
    id: 'act-14',
    metric: 'Staff Attrition (East Region)',
    current: '6.2%',
    target: '≤3%',
    owner: 'Sonia Patel',
    ownerRole: 'Regional Director',
    deadline: '2026-04-30',
    status: 'overdue',
    benchmark: 'Zudio: 2.8% attrition',
    benchmarkSource: 'Zudio',
    escalationPath: 'If above 5% by Mar 31 → HR leadership change for East region',
    trajectory: '6.2% → 5.0% (Mar) → 4.0% (Apr) → 3.0% (May)',
  },
];

// ─── Geography PODs ─────────────────────────────────────────────────

export interface GeographyPod {
  id: string;
  name: string;
  head: string;
  states: string;
  storeCount: number;
  revenue: string;
  revenuePerStore: string;
  sellThrough: string;
  grossMargin: string;
  agedInventory: string;
  status: 'on-track' | 'warning' | 'critical';
}

export const geographyPods: GeographyPod[] = [
  {
    id: 'gpod-1',
    name: 'West Metro',
    head: 'Arun Patil',
    states: 'Mumbai, Pune, Ahmedabad',
    storeCount: 312,
    revenue: '₹18.2 Cr/day',
    revenuePerStore: '₹5.8 L',
    sellThrough: '74%',
    grossMargin: '43.2%',
    agedInventory: '14%',
    status: 'on-track',
  },
  {
    id: 'gpod-2',
    name: 'South Metro',
    head: 'Kavitha Reddy',
    states: 'Bangalore, Chennai, Hyderabad',
    storeCount: 284,
    revenue: '₹14.8 Cr/day',
    revenuePerStore: '₹5.2 L',
    sellThrough: '72%',
    grossMargin: '42.6%',
    agedInventory: '16%',
    status: 'on-track',
  },
  {
    id: 'gpod-3',
    name: 'North Metro',
    head: 'Deepak Verma',
    states: 'Delhi, Gurgaon, Noida',
    storeCount: 248,
    revenue: '₹12.4 Cr/day',
    revenuePerStore: '₹5.0 L',
    sellThrough: '69%',
    grossMargin: '41.8%',
    agedInventory: '19%',
    status: 'warning',
  },
  {
    id: 'gpod-4',
    name: 'East Metro',
    head: 'Suresh Mohanty',
    states: 'Kolkata, Bhubaneswar',
    storeCount: 142,
    revenue: '₹5.8 Cr/day',
    revenuePerStore: '₹4.1 L',
    sellThrough: '62%',
    grossMargin: '39.4%',
    agedInventory: '26%',
    status: 'critical',
  },
  {
    id: 'gpod-5',
    name: 'West Tier-2',
    head: 'Nikhil Joshi',
    states: 'Surat, Vadodara, Rajkot, Nagpur',
    storeCount: 196,
    revenue: '₹6.2 Cr/day',
    revenuePerStore: '₹3.2 L',
    sellThrough: '66%',
    grossMargin: '41.2%',
    agedInventory: '21%',
    status: 'warning',
  },
  {
    id: 'gpod-6',
    name: 'South Tier-2',
    head: 'Meera Iyer',
    states: 'Coimbatore, Vizag, Kochi, Mysore',
    storeCount: 218,
    revenue: '₹7.4 Cr/day',
    revenuePerStore: '₹3.4 L',
    sellThrough: '67%',
    grossMargin: '41.6%',
    agedInventory: '20%',
    status: 'warning',
  },
  {
    id: 'gpod-7',
    name: 'North Tier-2',
    head: 'Rohit Saxena',
    states: 'Lucknow, Jaipur, Chandigarh',
    storeCount: 186,
    revenue: '₹5.6 Cr/day',
    revenuePerStore: '₹3.0 L',
    sellThrough: '64%',
    grossMargin: '40.8%',
    agedInventory: '23%',
    status: 'warning',
  },
  {
    id: 'gpod-8',
    name: 'East Tier-2',
    head: 'Anand Das',
    states: 'Patna, Ranchi, Guwahati',
    storeCount: 128,
    revenue: '₹3.2 Cr/day',
    revenuePerStore: '₹2.5 L',
    sellThrough: '58%',
    grossMargin: '38.6%',
    agedInventory: '28%',
    status: 'critical',
  },
  {
    id: 'gpod-9',
    name: 'Central',
    head: 'Pradeep Tiwari',
    states: 'Indore, Bhopal, Raipur',
    storeCount: 164,
    revenue: '₹4.8 Cr/day',
    revenuePerStore: '₹2.9 L',
    sellThrough: '63%',
    grossMargin: '40.4%',
    agedInventory: '22%',
    status: 'warning',
  },
  {
    id: 'gpod-10',
    name: 'New Stores & Reno',
    head: 'Vivek Nanda',
    states: 'Pan-India (new openings)',
    storeCount: 253,
    revenue: '₹2.6 Cr/day',
    revenuePerStore: '₹1.0 L',
    sellThrough: '71%',
    grossMargin: '44.1%',
    agedInventory: '8%',
    status: 'on-track',
  },
];

// ─── Category PODs ──────────────────────────────────────────────────

export interface CategoryPod {
  podNumber: number;
  category: string;
  subCategory: string;
  brands: string;
  currentRevenue: string;
  sellThrough: string;
  grossMargin: string;
  agedInventory: string;
  freshPercent: string;
  status: 'on-track' | 'warning' | 'critical';
}

export const categoryGroups = ['Menswear', 'Women Indian', 'Women Western', 'Kids', 'Non-Apparel', 'External'] as const;

export const categoryPods: CategoryPod[] = [
  // Menswear (Pods 1-6)
  { podNumber: 1, category: 'Menswear', subCategory: 'Casual Shirts', brands: 'Avaasa, Rio', currentRevenue: '₹38 Cr/mo', sellThrough: '72%', grossMargin: '43.2%', agedInventory: '14%', freshPercent: '58%', status: 'on-track' },
  { podNumber: 2, category: 'Menswear', subCategory: 'Formal & Work', brands: 'Netplay, John Miller', currentRevenue: '₹32 Cr/mo', sellThrough: '64%', grossMargin: '41.8%', agedInventory: '22%', freshPercent: '48%', status: 'warning' },
  { podNumber: 3, category: 'Menswear', subCategory: 'Denim & Trousers', brands: 'Avaasa, Performax', currentRevenue: '₹42 Cr/mo', sellThrough: '71%', grossMargin: '42.5%', agedInventory: '16%', freshPercent: '55%', status: 'on-track' },
  { podNumber: 4, category: 'Menswear', subCategory: 'T-Shirts & Polos', brands: 'Performax, Rio', currentRevenue: '₹34 Cr/mo', sellThrough: '76%', grossMargin: '44.1%', agedInventory: '11%', freshPercent: '62%', status: 'on-track' },
  { podNumber: 5, category: 'Menswear', subCategory: 'Ethnic Men', brands: 'Avaasa', currentRevenue: '₹18 Cr/mo', sellThrough: '58%', grossMargin: '39.8%', agedInventory: '28%', freshPercent: '42%', status: 'critical' },
  { podNumber: 6, category: 'Menswear', subCategory: 'Innerwear & Lounge', brands: 'Hanes, Jockey', currentRevenue: '₹24 Cr/mo', sellThrough: '82%', grossMargin: '46.2%', agedInventory: '8%', freshPercent: '72%', status: 'on-track' },

  // Women Indian (Pods 7-10)
  { podNumber: 7, category: 'Women Indian', subCategory: 'Kurtas & Kurtis', brands: 'Avaasa, Aurelia', currentRevenue: '₹48 Cr/mo', sellThrough: '61%', grossMargin: '39.2%', agedInventory: '24%', freshPercent: '46%', status: 'warning' },
  { podNumber: 8, category: 'Women Indian', subCategory: 'Sarees & Dupattas', brands: 'Avaasa', currentRevenue: '₹28 Cr/mo', sellThrough: '55%', grossMargin: '38.4%', agedInventory: '30%', freshPercent: '38%', status: 'critical' },
  { podNumber: 9, category: 'Women Indian', subCategory: 'Lehengas & Festive', brands: 'Avaasa, FI', currentRevenue: '₹14 Cr/mo', sellThrough: '52%', grossMargin: '37.6%', agedInventory: '34%', freshPercent: '34%', status: 'critical' },
  { podNumber: 10, category: 'Women Indian', subCategory: 'Bottoms & Sets', brands: 'Avaasa', currentRevenue: '₹26 Cr/mo', sellThrough: '66%', grossMargin: '41.2%', agedInventory: '18%', freshPercent: '52%', status: 'warning' },

  // Women Western (Pods 11-14)
  { podNumber: 11, category: 'Women Western', subCategory: 'Tops & Blouses', brands: 'Avaasa, Label Ritu', currentRevenue: '₹36 Cr/mo', sellThrough: '68%', grossMargin: '42.8%', agedInventory: '17%', freshPercent: '54%', status: 'warning' },
  { podNumber: 12, category: 'Women Western', subCategory: 'Dresses & Jumpsuits', brands: 'Label Ritu, FI', currentRevenue: '₹22 Cr/mo', sellThrough: '60%', grossMargin: '40.4%', agedInventory: '25%', freshPercent: '44%', status: 'warning' },
  { podNumber: 13, category: 'Women Western', subCategory: 'Jeans & Trousers', brands: 'Avaasa, Performax', currentRevenue: '₹30 Cr/mo', sellThrough: '70%', grossMargin: '43.0%', agedInventory: '15%', freshPercent: '56%', status: 'on-track' },
  { podNumber: 14, category: 'Women Western', subCategory: 'Activewear', brands: 'Performax', currentRevenue: '₹20 Cr/mo', sellThrough: '74%', grossMargin: '44.8%', agedInventory: '10%', freshPercent: '64%', status: 'on-track' },

  // Kids (Pods 15-18)
  { podNumber: 15, category: 'Kids', subCategory: 'Boys Apparel', brands: 'Palm Tree, Rio', currentRevenue: '₹28 Cr/mo', sellThrough: '69%', grossMargin: '42.0%', agedInventory: '16%', freshPercent: '56%', status: 'warning' },
  { podNumber: 16, category: 'Kids', subCategory: 'Girls Apparel', brands: 'Palm Tree, Avaasa', currentRevenue: '₹26 Cr/mo', sellThrough: '67%', grossMargin: '41.6%', agedInventory: '18%', freshPercent: '52%', status: 'warning' },
  { podNumber: 17, category: 'Kids', subCategory: 'Infant & Toddler', brands: 'Palm Tree', currentRevenue: '₹14 Cr/mo', sellThrough: '78%', grossMargin: '45.2%', agedInventory: '9%', freshPercent: '68%', status: 'on-track' },
  { podNumber: 18, category: 'Kids', subCategory: 'School & Uniform', brands: 'Palm Tree', currentRevenue: '₹12 Cr/mo', sellThrough: '84%', grossMargin: '38.4%', agedInventory: '6%', freshPercent: '76%', status: 'on-track' },

  // Non-Apparel (Pods 19-22)
  { podNumber: 19, category: 'Non-Apparel', subCategory: 'Footwear', brands: 'Avaasa, External', currentRevenue: '₹36 Cr/mo', sellThrough: '65%', grossMargin: '40.8%', agedInventory: '20%', freshPercent: '50%', status: 'warning' },
  { podNumber: 20, category: 'Non-Apparel', subCategory: 'Accessories & Bags', brands: 'Avaasa', currentRevenue: '₹18 Cr/mo', sellThrough: '72%', grossMargin: '48.2%', agedInventory: '12%', freshPercent: '62%', status: 'on-track' },
  { podNumber: 21, category: 'Non-Apparel', subCategory: 'Beauty & Personal', brands: 'External MBOs', currentRevenue: '₹16 Cr/mo', sellThrough: '80%', grossMargin: '52.4%', agedInventory: '5%', freshPercent: '78%', status: 'on-track' },
  { podNumber: 22, category: 'Non-Apparel', subCategory: 'Home & Living', brands: 'Avaasa Home', currentRevenue: '₹10 Cr/mo', sellThrough: '56%', grossMargin: '36.8%', agedInventory: '32%', freshPercent: '36%', status: 'critical' },

  // External (Pods 23-24)
  { podNumber: 23, category: 'External', subCategory: 'Premium Brands', brands: 'Levi\'s, Lee, Wrangler', currentRevenue: '₹44 Cr/mo', sellThrough: '70%', grossMargin: '34.2%', agedInventory: '18%', freshPercent: '54%', status: 'warning' },
  { podNumber: 24, category: 'External', subCategory: 'Value Brands', brands: 'Killer, Mufti, Spykar', currentRevenue: '₹22 Cr/mo', sellThrough: '63%', grossMargin: '32.8%', agedInventory: '24%', freshPercent: '46%', status: 'warning' },
];
