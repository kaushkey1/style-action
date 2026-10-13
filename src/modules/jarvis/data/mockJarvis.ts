// ─── Types ──────────────────────────────────────────────────────────────────

export type JourneyStage = 'walk-in' | 'browsing' | 'trial' | 'billing' | 'post-purchase';

export type SourceType = 'input' | 'cctv' | 'audio' | 'estimated' | 'unavailable';

export type SeverityLevel = 'S0' | 'S1' | 'S2' | 'positive' | 'info';

export type TrackerStage = 'identified' | 'assigned' | 'in-progress' | 'resolved' | 'verified';

export type TicketPriority = 'high' | 'medium' | 'low';

export type TicketStatus = 'open' | 'in-progress' | 'resolved';

export interface StoreInfo {
  id: string;
  name: string;
  brand: string;
  location: string;
  city: string;
  state: string;
  region: string;
  totalArea: number;
  locatedIn: string;
  openingDate: string;
  posCount: number;
  posMachines: string[];
}

export interface FunnelStage {
  stage: JourneyStage;
  label: string;
  value: number;
  source: SourceType;
  dropOff: number | null;
  dropOffReasons: string[];
}

export interface JarvisMetric {
  id: string;
  label: string;
  value: string;
  numericValue: number;
  unit?: string;
  source: SourceType;
  sourceDetail?: string;
  journeyStage: JourneyStage;
  trend?: 'up' | 'down' | 'flat';
  target?: string;
  status?: 'green' | 'amber' | 'red';
}

export interface CCTVInsight {
  id: string;
  cameraId: string;
  cameraLabel: string;
  zone: string;
  journeyStage: JourneyStage;
  date: string;
  time: string;
  observation: string;
  severity: SeverityLevel;
  videoRef: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  journeyStage: JourneyStage;
  trackerStage: TrackerStage;
  owner: { role: string; name: string };
  roi: string;
  evidence: string[];
  createdDate: string;
}

export interface SupportTicket {
  id: string;
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  raisedBy: string;
  assignedTo: string;
}

export interface NPSData {
  overallScore: number;
  totalResponses: number;
  promoters: number;
  passives: number;
  detractors: number;
  subRatings: { dimension: string; score: number }[];
}

export interface Verbatim {
  id: string;
  text: string;
  dimension: string;
  journeyStage: JourneyStage;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface DwellZone {
  id: string;
  zone: string;
  cameraId: string;
  dwellTime: string;
  behaviour: string;
  customerCount: string;
  severity: SeverityLevel;
}

export interface POSMachine {
  id: string;
  tickets: number;
  share: number;
  daysActive: number;
  avgPerDay: number;
  status: string;
}

export interface DailyFootfall {
  date: string;
  dayOfWeek: string;
  footfall: number;
  sales: number;
  isWeekend: boolean;
}

export interface MonthlyBills {
  month: string;
  bills: number;
  sales: number;
}

export interface LeadershipQuestion {
  id: string;
  question: string;
  answer: string;
  evidence: string[];
}

export interface ObjectionCategory {
  category: string;
  count: number;
  percentage: number;
}

// ─── Store Info ─────────────────────────────────────────────────────────────

export const storeInfo: StoreInfo = {
  id: '5943',
  name: 'Mumbai InfinityMalad',
  brand: 'Trends',
  location: 'Infiniti Mall, Malad (W), Mumbai',
  city: 'Mumbai',
  state: 'Maharashtra',
  region: 'WEST 1 (MH, Goa)',
  totalArea: 12938,
  locatedIn: 'Mall',
  openingDate: '25 March 2016',
  posCount: 5,
  posMachines: ['#121', '#126', '#135', '#166', '#167'],
};

// ─── Funnel Data ────────────────────────────────────────────────────────────

export const funnelStages: FunnelStage[] = [
  {
    stage: 'walk-in',
    label: 'Footfall',
    value: 10265,
    source: 'input',
    dropOff: null,
    dropOffReasons: [],
  },
  {
    stage: 'trial',
    label: 'Browsing',
    value: 7185,
    source: 'estimated',
    dropOff: -30,
    dropOffReasons: ['No staff greeting', 'BOH clutter reducing floor stock'],
  },
  {
    stage: 'trial',
    label: 'Trial / Selection',
    value: 3593,
    source: 'estimated',
    dropOff: -50,
    dropOffReasons: ['Zero staff assistance', 'Dense racks', 'Navigation friction'],
  },
  {
    stage: 'billing',
    label: 'Billing',
    value: 1383,
    source: 'input',
    dropOff: -62,
    dropOffReasons: ['Checkout friction (18% chain-wide)', 'Counter cameras not sampled'],
  },
];

// ─── Metrics ────────────────────────────────────────────────────────────────

export const commandCenterMetrics: JarvisMetric[] = [
  { id: 'cc-1', label: 'NPS Score', value: '71.4', numericValue: 71.4, source: 'input', journeyStage: 'post-purchase', status: 'green', target: '≥75' },
  { id: 'cc-2', label: 'Conversion Rate', value: '13.3%', numericValue: 13.3, unit: '%', source: 'input', journeyStage: 'billing', status: 'amber', target: '≥15%' },
  { id: 'cc-3', label: 'SPSF', value: '₹1,335', numericValue: 1335, unit: '₹/sqft', source: 'input', journeyStage: 'billing', status: 'green' },
  { id: 'cc-4', label: 'ATS', value: '₹1,959', numericValue: 1959, unit: '₹', source: 'input', journeyStage: 'billing' },
  { id: 'cc-5', label: 'Total Bills (FY)', value: '1,06,958', numericValue: 106958, source: 'input', journeyStage: 'billing' },
];

export const walkInMetrics: JarvisMetric[] = [
  { id: 'wi-1', label: 'Total Walk-ins', value: '20.6K', numericValue: 20619, source: 'input', journeyStage: 'walk-in' },
  { id: 'wi-2', label: 'Walked Out < 2 Min', value: '30%', numericValue: 30, unit: '%', source: 'estimated', journeyStage: 'walk-in', status: 'red' },
  { id: 'wi-3', label: 'Avg Engagement Time', value: '12-15 min', numericValue: 13.5, unit: 'min', source: 'estimated', journeyStage: 'walk-in' },
  { id: 'wi-4', label: 'Staff:Customer (Peak)', value: '1:12', numericValue: 12, source: 'cctv', journeyStage: 'walk-in', status: 'red' },
  { id: 'wi-5', label: 'Staff Interaction Rate', value: '~15%', numericValue: 15, unit: '%', source: 'cctv', journeyStage: 'walk-in', status: 'red' },
  { id: 'wi-6', label: 'Staff:Customer (Off-Peak)', value: '1:6', numericValue: 6, source: 'cctv', journeyStage: 'walk-in', status: 'amber' },
];

export const trialMetrics: JarvisMetric[] = [
  { id: 'tr-1', label: 'Browsing-to-Trial Rate', value: '~50%', numericValue: 50, unit: '%', source: 'estimated', journeyStage: 'trial' },
  { id: 'tr-2', label: 'Staff Assistance Rate', value: '~15%', numericValue: 15, unit: '%', source: 'cctv', journeyStage: 'trial', status: 'red' },
  { id: 'tr-3', label: 'Avg Items Tried', value: '3-4 items', numericValue: 3.5, source: 'estimated', journeyStage: 'trial' },
  { id: 'tr-4', label: 'Trial Room Wait', value: '2-5 min', numericValue: 3.5, unit: 'min', source: 'estimated', journeyStage: 'trial' },
];

export const billingMetrics: JarvisMetric[] = [
  { id: 'bl-1', label: 'Queue Time', value: '3-5 min', numericValue: 4, unit: 'min', source: 'estimated', journeyStage: 'billing' },
  { id: 'bl-2', label: 'Queue > 15 Min', value: '~1-2/day', numericValue: 1.5, source: 'estimated', journeyStage: 'billing' },
  { id: 'bl-3', label: 'Average Bill Value', value: '₹1,450', numericValue: 1450, unit: '₹', source: 'input', journeyStage: 'billing' },
  { id: 'bl-4', label: 'POS Machines Used', value: '5', numericValue: 5, source: 'input', journeyStage: 'billing' },
  { id: 'bl-5', label: 'Avg Billing Time', value: '2-3 min', numericValue: 2.5, unit: 'min', source: 'input', journeyStage: 'billing' },
  { id: 'bl-6', label: 'Returns Processed', value: '10-15/day', numericValue: 12.5, source: 'input', journeyStage: 'billing' },
];

// ─── CCTV Insights ──────────────────────────────────────────────────────────

export const cctvInsights: CCTVInsight[] = [
  {
    id: 'cctv-1',
    cameraId: 'GF_STF_ENT',
    cameraLabel: 'Staff Entry (BOH)',
    zone: 'Back-of-house/stockroom',
    journeyStage: 'walk-in',
    date: '2024-10-22',
    time: '14:30',
    observation: 'Back-of-house stockroom severely cluttered — boxes stacked floor-to-ceiling. Unprocessed stock not reaching sales floor.',
    severity: 'S0',
    videoRef: 'Video 35, 36',
  },
  {
    id: 'cctv-2',
    cameraId: 'GF_WOMENS_WEAR1',
    cameraLabel: "Women's Wear 1",
    zone: "Main women's section",
    journeyStage: 'trial',
    date: '2024-10-24',
    time: '17:45',
    observation: 'Near-zero staff assistance on floor — customers browsing independently with no staff helping. 8 of 10 floor videos show this pattern.',
    severity: 'S0',
    videoRef: 'Video 2, 3, 4, 5, 65, 66',
  },
  {
    id: 'cctv-3',
    cameraId: 'GF_WOMENS_WEAR3',
    cameraLabel: "Women's Wear 3",
    zone: "Secondary women's section",
    journeyStage: 'trial',
    date: '2024-10-22',
    time: '18:15',
    observation: 'Dense rack packing — narrow aisles making navigation difficult. Extended search behaviour observed as customers struggle to browse.',
    severity: 'S1',
    videoRef: 'Video 3, 4, 5',
  },
  {
    id: 'cctv-4',
    cameraId: 'GF_CUST_ENT1',
    cameraLabel: 'Customer Entry',
    zone: 'Store entrance',
    journeyStage: 'walk-in',
    date: '2024-10-24',
    time: '16:00',
    observation: 'No active greeting at entrance — security present but not engaging customers. Customers enter without any staff acknowledgment.',
    severity: 'S1',
    videoRef: 'Video 1, 33',
  },
  {
    id: 'cctv-5',
    cameraId: 'GF_CUST_EXT',
    cameraLabel: 'Customer Exit',
    zone: 'Exit area',
    journeyStage: 'billing',
    date: '2024-10-22',
    time: '19:00',
    observation: 'Exit area orderly — no congestion at checkout exit. Smooth customer flow observed.',
    severity: 'positive',
    videoRef: 'Video 34',
  },
  {
    id: 'cctv-6',
    cameraId: 'GF_CUST_ENT1',
    cameraLabel: 'Customer Entry',
    zone: 'Store entrance',
    journeyStage: 'walk-in',
    date: '2024-10-26',
    time: '15:30',
    observation: 'Festive display effective — Diwali weekend shows good merchandising engagement. Customers stopping to look at seasonal display.',
    severity: 'positive',
    videoRef: 'Video 33',
  },
  {
    id: 'cctv-7',
    cameraId: 'GF_WOMENS_WEAR1',
    cameraLabel: "Women's Wear 1",
    zone: "Main women's section",
    journeyStage: 'trial',
    date: '2024-10-24',
    time: '16:30',
    observation: "WEAR1 better organized than WEAR3 — moderate footfall with one staff visible. Customers browsing with less friction.",
    severity: 'positive',
    videoRef: 'Video 62',
  },
];

// ─── NPS Data ───────────────────────────────────────────────────────────────

export const npsData: NPSData = {
  overallScore: 71.4,
  totalResponses: 42,
  promoters: 33,
  passives: 6,
  detractors: 3,
  subRatings: [
    { dimension: 'Billing', score: 4.76 },
    { dimension: 'Staff', score: 4.76 },
    { dimension: 'Size Availability', score: 4.69 },
    { dimension: 'Trial Room', score: 4.69 },
    { dimension: 'Ambience', score: 4.69 },
    { dimension: 'Variety', score: 4.62 },
  ],
};

// ─── Verbatims ──────────────────────────────────────────────────────────────

export const verbatims: Verbatim[] = [
  { id: 'v-1', text: 'Didn\'t find my size in the kurta I liked. Staff didn\'t offer alternatives.', dimension: 'Size Availability', journeyStage: 'trial', sentiment: 'negative' },
  { id: 'v-2', text: 'Very limited options in ethnic wear compared to other Trends stores.', dimension: 'Product Variety', journeyStage: 'trial', sentiment: 'negative' },
  { id: 'v-3', text: 'Trial room was clean and spacious. Liked the mirror quality.', dimension: 'Trial Room', journeyStage: 'trial', sentiment: 'positive' },
  { id: 'v-4', text: 'Staff was rude when I asked for help finding a size. Felt ignored.', dimension: 'Staff Service', journeyStage: 'walk-in', sentiment: 'negative' },
  { id: 'v-5', text: 'Billing took too long. Only 2 counters open during evening rush.', dimension: 'Billing Experience', journeyStage: 'billing', sentiment: 'negative' },
  { id: 'v-6', text: 'Great collection of western wear. Found exactly what I was looking for.', dimension: 'Product Variety', journeyStage: 'trial', sentiment: 'positive' },
  { id: 'v-7', text: 'Staff was extremely helpful, especially in the men\'s section.', dimension: 'Staff Service', journeyStage: 'walk-in', sentiment: 'positive' },
  { id: 'v-8', text: 'Scanner was not working at one counter, had to switch lines.', dimension: 'Billing Experience', journeyStage: 'billing', sentiment: 'negative' },
  { id: 'v-9', text: 'Women\'s section too crowded, racks are packed. Hard to browse.', dimension: 'Ambience', journeyStage: 'trial', sentiment: 'negative' },
  { id: 'v-10', text: 'Good ambience overall. AC was working well, store was clean.', dimension: 'Ambience', journeyStage: 'walk-in', sentiment: 'positive' },
];

// ─── Dwell Zones ────────────────────────────────────────────────────────────

export const dwellZones: DwellZone[] = [
  { id: 'dz-1', zone: "Women's Wear 1 (WEAR1)", cameraId: 'GF_WOMENS_WEAR1', dwellTime: '10-15 min', behaviour: 'Moderate browsing, one staff visible. Better organized section.', customerCount: '15-20/hr', severity: 'positive' },
  { id: 'dz-2', zone: "Women's Wear 3 (WEAR3)", cameraId: 'GF_WOMENS_WEAR3', dwellTime: '15-20+ min', behaviour: 'Extended search in dense racks. Customers struggling to navigate narrow aisles.', customerCount: '20-25/hr', severity: 'S1' },
  { id: 'dz-3', zone: 'Entrance / Signage', cameraId: 'GF_CUST_ENT1', dwellTime: '<1 min', behaviour: 'Brief pause at entrance. No greeting from staff or security.', customerCount: '50+/hr peak', severity: 'S1' },
  { id: 'dz-4', zone: 'Festive Display', cameraId: 'GF_CUST_ENT1', dwellTime: '2-4 min', behaviour: 'Positive engagement with Diwali display. Customers stopping to browse seasonal merchandise.', customerCount: '10-15/hr', severity: 'positive' },
  { id: 'dz-5', zone: 'Back-of-House', cameraId: 'GF_STF_ENT', dwellTime: 'N/A', behaviour: 'Staff only area. Chronic clutter — boxes stacked floor-to-ceiling on multiple days.', customerCount: 'Staff only', severity: 'S0' },
];

// ─── POS Machines ───────────────────────────────────────────────────────────

export const posMachines: POSMachine[] = [
  { id: '#121', tickets: 225, share: 8, daysActive: 11, avgPerDay: 15, status: 'Underutilized' },
  { id: '#126', tickets: 456, share: 16, daysActive: 14, avgPerDay: 30, status: 'Normal' },
  { id: '#135', tickets: 898, share: 31, daysActive: 15, avgPerDay: 60, status: 'Highest load' },
  { id: '#166', tickets: 823, share: 29, daysActive: 14, avgPerDay: 55, status: 'High load' },
  { id: '#167', tickets: 460, share: 16, daysActive: 12, avgPerDay: 31, status: 'Normal' },
];

// ─── Daily Footfall ─────────────────────────────────────────────────────────

export const dailyFootfall: DailyFootfall[] = [
  { date: '2026-02-23', dayOfWeek: 'Sun', footfall: 2412, sales: 68500, isWeekend: true },
  { date: '2026-02-24', dayOfWeek: 'Mon', footfall: 876, sales: 28400, isWeekend: false },
  { date: '2026-02-25', dayOfWeek: 'Tue', footfall: 921, sales: 31200, isWeekend: false },
  { date: '2026-02-26', dayOfWeek: 'Wed', footfall: 845, sales: 26800, isWeekend: false },
  { date: '2026-02-27', dayOfWeek: 'Thu', footfall: 978, sales: 32100, isWeekend: false },
  { date: '2026-02-28', dayOfWeek: 'Fri', footfall: 1102, sales: 38500, isWeekend: false },
  { date: '2026-03-01', dayOfWeek: 'Sat', footfall: 2234, sales: 62300, isWeekend: true },
  { date: '2026-03-02', dayOfWeek: 'Sun', footfall: 2589, sales: 72100, isWeekend: true },
  { date: '2026-03-03', dayOfWeek: 'Mon', footfall: 912, sales: 29800, isWeekend: false },
  { date: '2026-03-04', dayOfWeek: 'Tue', footfall: 867, sales: 27500, isWeekend: false },
  { date: '2026-03-05', dayOfWeek: 'Wed', footfall: 934, sales: 30200, isWeekend: false },
  { date: '2026-03-06', dayOfWeek: 'Thu', footfall: 1023, sales: 34600, isWeekend: false },
  { date: '2026-03-07', dayOfWeek: 'Fri', footfall: 1156, sales: 41200, isWeekend: false },
  { date: '2026-03-08', dayOfWeek: 'Sat', footfall: 2198, sales: 59800, isWeekend: true },
  { date: '2026-03-09', dayOfWeek: 'Sun', footfall: 2572, sales: 70100, isWeekend: true },
];

// ─── Monthly Bills ──────────────────────────────────────────────────────────

export const monthlyBills: MonthlyBills[] = [
  { month: "Apr '24", bills: 8234, sales: 1612 },
  { month: "May '24", bills: 7856, sales: 1539 },
  { month: "Jun '24", bills: 7423, sales: 1454 },
  { month: "Jul '24", bills: 7912, sales: 1550 },
  { month: "Aug '24", bills: 8567, sales: 1678 },
  { month: "Sep '24", bills: 8234, sales: 1613 },
  { month: "Oct '24", bills: 11234, sales: 2701 },
  { month: "Nov '24", bills: 9876, sales: 1935 },
  { month: "Dec '24", bills: 8765, sales: 1717 },
  { month: "Jan '25", bills: 8432, sales: 1652 },
  { month: "Feb '25", bills: 9123, sales: 1788 },
  { month: "Mar '25", bills: 11302, sales: 2214 },
];

// ─── Action Items ───────────────────────────────────────────────────────────

export const actionItems: ActionItem[] = [
  {
    id: 'ai-1',
    title: 'Address Size Availability Gap',
    description: 'Size availability issues driving 12% of customer objections. NPS sub-rating for Size at 4.69 — lowest comfort zone.',
    severity: 'S0',
    journeyStage: 'trial',
    trackerStage: 'in-progress',
    owner: { role: 'Category Manager', name: 'Priya Sharma' },
    roi: '₹2.4L/month reduction in returns',
    evidence: ['NPS Size sub-rating 4.69', 'Verbatim: "Didn\'t find my size"'],
    createdDate: '2026-02-15',
  },
  {
    id: 'ai-2',
    title: 'Staff Greeting Protocol Training',
    description: 'CCTV shows no active greeting at entrance. Security present but not engaging customers.',
    severity: 'S1',
    journeyStage: 'walk-in',
    trackerStage: 'assigned',
    owner: { role: 'Store Manager', name: 'Rajesh Kumar' },
    roi: '5% improvement in browse-through rate',
    evidence: ['CCTV: Video 1, 33 — no greeting observed', 'NPS Staff sub-rating 4.76 but verbatims polarized'],
    createdDate: '2026-02-18',
  },
  {
    id: 'ai-3',
    title: 'Resolve Customer Disrespect Incidents',
    description: 'Multiple NPS verbatims report staff rudeness. Cross-validated with CCTV showing disengaged floor staff.',
    severity: 'S0',
    journeyStage: 'walk-in',
    trackerStage: 'in-progress',
    owner: { role: 'HR Manager', name: 'Anita Desai' },
    roi: 'Prevent detractor creation — protect NPS score',
    evidence: ['Verbatim: "Staff was rude when I asked for help"', 'CCTV: 85% customers unassisted'],
    createdDate: '2026-02-12',
  },
  {
    id: 'ai-4',
    title: 'Deploy Floor Staff During Peak Hours',
    description: 'Peak hour staff-to-customer ratio of 1:12 is critically low. 85% of customers receive no assistance.',
    severity: 'S1',
    journeyStage: 'walk-in',
    trackerStage: 'in-progress',
    owner: { role: 'Store Manager', name: 'Rajesh Kumar' },
    roi: '8-10% conversion uplift potential',
    evidence: ['CCTV: 1:12 ratio during 18:00-20:00', 'Only 15% staff interaction rate'],
    createdDate: '2026-02-20',
  },
  {
    id: 'ai-5',
    title: 'Clear Back-of-House Stockroom',
    description: 'Stockroom severely cluttered on multiple observation days. Unprocessed stock not reaching sales floor.',
    severity: 'S1',
    journeyStage: 'trial',
    trackerStage: 'assigned',
    owner: { role: 'Department Manager', name: 'Vikram Patel' },
    roi: 'Improve stock availability on floor',
    evidence: ['CCTV: Video 35, 36 — boxes stacked floor-to-ceiling'],
    createdDate: '2026-02-22',
  },
  {
    id: 'ai-6',
    title: "Reduce Rack Density in Women's Wear 3",
    description: 'Dense rack packing causing navigation difficulty. Extended search behaviour observed.',
    severity: 'S2',
    journeyStage: 'trial',
    trackerStage: 'identified',
    owner: { role: 'VM Manager', name: 'Sneha Gupta' },
    roi: 'Improved browse-through and reduced walkouts',
    evidence: ['CCTV: Video 3, 4, 5 — narrow aisles', 'Verbatim: "racks are packed"'],
    createdDate: '2026-02-25',
  },
  {
    id: 'ai-7',
    title: 'Investigate Mid-Year Conversion Dip',
    description: 'Conversion rate dropped to 10.9% in June from 18.1% peak. Need root cause analysis.',
    severity: 'S2',
    journeyStage: 'walk-in',
    trackerStage: 'identified',
    owner: { role: 'Store Manager', name: 'Rajesh Kumar' },
    roi: 'Identify systemic conversion blockers',
    evidence: ['POS data: 10.9% Jun vs 18.1% peak', 'FY avg 13.3%'],
    createdDate: '2026-03-01',
  },
  {
    id: 'ai-8',
    title: 'Review ATS Decline and Pricing Strategy',
    description: 'Average Transaction Size showing declining trend. Need pricing and upsell strategy review.',
    severity: 'S2',
    journeyStage: 'billing',
    trackerStage: 'resolved',
    owner: { role: 'Category Manager', name: 'Priya Sharma' },
    roi: '₹200 ATS improvement = ₹2.1Cr annual',
    evidence: ['POS: ATS trend declining from ₹2,100 to ₹1,959', 'Basket analysis needed'],
    createdDate: '2026-02-10',
  },
];

// ─── Support Tickets ────────────────────────────────────────────────────────

export const supportTickets: SupportTicket[] = [
  { id: 'st-1', title: 'POS #135 intermittent freezing', priority: 'high', status: 'in-progress', raisedBy: 'Billing Supervisor', assignedTo: 'IT Support' },
  { id: 'st-2', title: 'Trial room #3 lock broken', priority: 'high', status: 'open', raisedBy: 'Floor Manager', assignedTo: 'Maintenance' },
  { id: 'st-3', title: "AC not working in Women's Wear", priority: 'medium', status: 'in-progress', raisedBy: 'Store Manager', assignedTo: 'Facility Mgmt' },
  { id: 'st-4', title: 'Barcode scanner malfunction Counter 2', priority: 'medium', status: 'resolved', raisedBy: 'Cashier', assignedTo: 'IT Support' },
  { id: 'st-5', title: 'Signage update for new arrivals', priority: 'low', status: 'open', raisedBy: 'VM Manager', assignedTo: 'Design Team' },
  { id: 'st-6', title: 'Staff uniform shortage for new hires', priority: 'low', status: 'open', raisedBy: 'HR Manager', assignedTo: 'Procurement' },
];

// ─── Leadership Questions ───────────────────────────────────────────────────

export const leadershipQuestions: LeadershipQuestion[] = [
  {
    id: 'lq-1',
    question: 'Why are customers leaving without buying?',
    answer: '30% walk out within 2 minutes (no greeting, no engagement). Of those who browse, 50% leave at trial stage due to zero staff assistance (85% unassisted per CCTV) and dense rack navigation in WEAR3. Chain-wide data shows 40% of detractors cite merchandise/availability failure.',
    evidence: ['CCTV: 85% unassisted', 'NPS: 40% merchandise complaints', 'Funnel: 30% walk-in drop-off'],
  },
  {
    id: 'lq-2',
    question: 'Is the store staffed adequately during peak hours?',
    answer: 'No. Peak hour (18:00-20:00) staff-to-customer ratio is 1:12. Non-peak is 1:6. Only 15% of customers receive any staff interaction. The store needs 2-3 additional floor staff during 17:00-21:00 window.',
    evidence: ['CCTV: 1:12 peak ratio', 'CCTV: 15% interaction rate', 'Weekday avg 933 footfall, weekend 2,589'],
  },
  {
    id: 'lq-3',
    question: 'How is the store performing on sales efficiency?',
    answer: 'SPSF of ₹1,335/sqft (FY avg) is above A-grade target of ₹900. Conversion at 13.3% is below 15% target. Peak Diwali SPSF hit ₹2,090. ATS at ₹1,959 is healthy but showing declining trend.',
    evidence: ['POS: SPSF ₹1,335', 'POS: Conversion 13.3%', 'POS: ATS ₹1,959'],
  },
  {
    id: 'lq-4',
    question: 'Is the back-of-house operation impacting customer experience?',
    answer: 'Yes. CCTV on Oct 22 and Oct 24 shows BOH stockroom with boxes stacked floor-to-ceiling. This is a chronic issue preventing stock from reaching the sales floor, directly impacting product availability — the #1 customer complaint.',
    evidence: ['CCTV: Video 35, 36', 'NPS: Variety sub-rating 4.62 (lowest)', 'Chain-wide: 40% cite merchandise'],
  },
  {
    id: 'lq-5',
    question: 'What should be the immediate priorities?',
    answer: '1. Deploy 2-3 additional floor staff during peak hours (17:00-21:00). 2. Clear BOH stockroom immediately — unprocessed stock = lost sales. 3. Staff greeting protocol training. 4. Reduce rack density in WEAR3. These four actions address 80% of observed customer friction.',
    evidence: ['Cross-validated: CCTV + NPS + POS data'],
  },
];

// ─── Objection Categories ───────────────────────────────────────────────────

export const objectionCategories: ObjectionCategory[] = [
  { category: 'Process', count: 68, percentage: 29 },
  { category: 'Stock Availability', count: 49, percentage: 21 },
  { category: 'Price', count: 47, percentage: 20 },
  { category: 'Size / Fit', count: 28, percentage: 12 },
  { category: 'Product Knowledge', count: 28, percentage: 12 },
  { category: 'Quality', count: 9, percentage: 4 },
  { category: 'Miscellaneous', count: 4, percentage: 2 },
];

// ─── Chain-wide Detractor Analysis ──────────────────────────────────────────

export const chainDetractorAnalysis = [
  { category: 'Merchandise / Availability', percentage: 40 },
  { category: 'Environment', percentage: 27 },
  { category: 'Checkout / Billing', percentage: 18 },
  { category: 'Staff Interaction', percentage: 17 },
];

// ─── POS Heatmap Data (15 days × 5 POS) ────────────────────────────────────

export const posHeatmapData: { date: string; dayOfWeek: string; machines: Record<string, number> }[] = [
  { date: '2026-02-23', dayOfWeek: 'Sun', machines: { '#121': 28, '#126': 45, '#135': 92, '#166': 85, '#167': 48 } },
  { date: '2026-02-24', dayOfWeek: 'Mon', machines: { '#121': 8, '#126': 18, '#135': 42, '#166': 38, '#167': 22 } },
  { date: '2026-02-25', dayOfWeek: 'Tue', machines: { '#121': 10, '#126': 22, '#135': 48, '#166': 42, '#167': 25 } },
  { date: '2026-02-26', dayOfWeek: 'Wed', machines: { '#121': 7, '#126': 16, '#135': 38, '#166': 35, '#167': 18 } },
  { date: '2026-02-27', dayOfWeek: 'Thu', machines: { '#121': 12, '#126': 24, '#135': 52, '#166': 48, '#167': 28 } },
  { date: '2026-02-28', dayOfWeek: 'Fri', machines: { '#121': 15, '#126': 28, '#135': 58, '#166': 54, '#167': 32 } },
  { date: '2026-03-01', dayOfWeek: 'Sat', machines: { '#121': 25, '#126': 42, '#135': 88, '#166': 82, '#167': 45 } },
  { date: '2026-03-02', dayOfWeek: 'Sun', machines: { '#121': 30, '#126': 48, '#135': 95, '#166': 88, '#167': 50 } },
  { date: '2026-03-03', dayOfWeek: 'Mon', machines: { '#121': 9, '#126': 20, '#135': 45, '#166': 40, '#167': 23 } },
  { date: '2026-03-04', dayOfWeek: 'Tue', machines: { '#121': 8, '#126': 18, '#135': 40, '#166': 36, '#167': 20 } },
  { date: '2026-03-05', dayOfWeek: 'Wed', machines: { '#121': 11, '#126': 22, '#135': 46, '#166': 42, '#167': 24 } },
  { date: '2026-03-06', dayOfWeek: 'Thu', machines: { '#121': 14, '#126': 26, '#135': 54, '#166': 50, '#167': 30 } },
  { date: '2026-03-07', dayOfWeek: 'Fri', machines: { '#121': 18, '#126': 32, '#135': 62, '#166': 58, '#167': 35 } },
  { date: '2026-03-08', dayOfWeek: 'Sat', machines: { '#121': 22, '#126': 40, '#135': 85, '#166': 78, '#167': 42 } },
  { date: '2026-03-09', dayOfWeek: 'Sun', machines: { '#121': 28, '#126': 46, '#135': 93, '#166': 87, '#167': 48 } },
];
