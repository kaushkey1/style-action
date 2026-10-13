/**
 * Metric → canonical home map for the Metric Glossary.
 *
 * Each metric has ONE "home" — the page (and tab) it primarily belongs to. The
 * glossary breadcrumb shows this home even for a metric you've never opened, and
 * "Show on page / Go to page" navigates there to locate it. Homes are assigned by
 * the section each metric lives in (mirroring metricDescriptions.ts), the whole
 * Store-Intelligence tooltip registry, and per-abbreviation for kpiGlossary.
 *
 * `route` carries the `?tab=` so navigation activates the right tab; the breadcrumb
 * derives Product › Module from the route's pathname via navigationConfig, then
 * appends `tabLabel`.
 */
import { tooltipRegistry } from './tooltipRegistry';

export interface MetricHome {
  /** Path (+ optional ?tab=) to navigate to and derive the breadcrumb from. */
  route: string;
  /** Display label for the breadcrumb's tab/leaf segment. */
  tabLabel?: string;
}

const dash = (tab: string, label: string): MetricHome => ({
  route: `/dashboard?tab=${tab}`,
  tabLabel: label,
});

const BUSINESS_PULSE = dash('ceo-pulse', 'Business Pulse');
const INVENTORY = dash('ceo-inventory', 'Inventory Health');
const GEOGRAPHY = dash('ceo-geography', 'Geography');
const CATEGORIES = dash('ceo-categories', 'Category Performance');
const OPERATIONS = dash('ceo-supply', 'Operations & Supply Chain');
const AOP: MetricHome = { route: '/command/aop', tabLabel: 'AOP Target' };
const AOP_VARIANCE: MetricHome = { route: '/command/aop/variance-tracker', tabLabel: 'Variance Tracker' };
const STORE_INTEL: MetricHome = { route: '/command/intelligence' };
const OTB: MetricHome = { route: '/otb' };

/** Section key-lists → home. Mirrors the section comments in metricDescriptions.ts. */
const SECTION_HOMES: ReadonlyArray<readonly [MetricHome, readonly string[]]> = [
  [BUSINESS_PULSE, [
    // Business Pulse + Financial (no live Financial tab → folded into Pulse) + common labels
    'Revenue Run Rate', 'Gross Margin', 'Avg Sell-Through', 'Net Revenue vs Plan', 'Name',
    'Revenue', 'GM%', 'Sell Through', 'Aged Inv', 'Fresh', 'Grade', 'Mix', 'Markdown',
    'Format', 'Stores', 'Units Sold',
    'Intake Margin %', 'Markdown %', 'Intake Margin', 'Markdown Impact', 'Fashion Mix',
    'Season End GM% Projection', 'First-Through Velocity',
    'Volume', 'Value', 'Net Revenue', 'Gross Rev', 'Gross Revenue', 'Net Rev', 'Vol',
    'Del GM%', 'AOP GM', 'ROS', 'Rate of Sale Per Day', 'Rate of Sale of Quantity Per Day',
  ]],
  [INVENTORY, [
    'Total Inventory Value', 'Aged Stock', 'Aged Stock (>180d)', 'Aged Stock (>120d)',
    'Inventory Turns', 'Options Aged >45d', '0-30 days', '31-60 days', '61-90 days',
    '91-180 days', '>180 days', 'Category', 'Stock Value', 'Days On Hand', 'Turnover',
    'Total Options', 'Broken Sets', 'Broken', 'Value At Risk', 'Avg Missing Sizes',
    'Fresh Inventory', 'Inventory Days', 'NOOS Stockout', 'NOOS Stockout (Stores)',
    'Broken Set Options',
  ]],
  [GEOGRAPHY, [
    // Geography + Regional (store-ops compliance lives at store/geography level)
    'Total Stores', 'Avg Revenue/Store', 'Avg Aged Inventory', 'Zone', 'State', 'Rev/Store',
    'Avg SPSF', 'Avg GMROF', 'Avg GM%', 'Sell-Through%',
    'VM Score', 'Planogram', 'SOP', 'Score', 'Rev/Sqft',
  ]],
  [CATEGORIES, [
    // Categories + Category-WW additions
    'Categories On-Track', 'Markdown Triggers', 'Top-Up POs Pending', 'Sub-Category', 'Brands',
    'Sub-Class', 'Markdown Value', 'COGS', 'GM (₹)', 'Var to Plan', 'GMROI', 'Option ID',
    'Intake Date', 'ST %', 'FP ST %', 'Stage', 'Trend', 'PO #', 'Option', 'Cover %',
    'Top-Up Units', 'Receive', 'Store', 'Time', 'MD Action', 'Broken %', 'At-Risk Revenue',
    'Right-Stocked', 'Optimally Stocked', 'Overstocked', 'Understocked', 'Rev/Day',
    'From Store', 'To Store', 'Units', 'Reason', 'Est. Uplift', 'Budget', '# POs', 'Committed',
    'Open', 'Util %', 'Remaining', 'Vendor', 'Order Date', 'Expected', 'Actual', 'Status',
    'Date', 'Intake Value', 'IM %', 'GRN', 'Owner', 'Stores Carrying WW', 'Ajio SLA %',
    'Vendor Concentration', 'Sample Approval %', 'OTB Remaining', 'Options in MD Stage 3',
    'Size Completeness', 'LFL Growth %', 'Chase Consumed', 'Markdown Cost as % of Revenue',
    'Markdown Volume as % of Revenue', 'Inv Turns (annualised)', 'Days on Hand',
  ]],
  [OPERATIONS, [
    // Operations & Supply Chain + Sourcing Director + Sourcing tables
    'Vendor OT', 'Merchandise OT', 'Vendor OTIF', 'Merchandise OTIF', 'Vendor OTIF %', 'OTIF',
    'OTIF %', 'Vendor Fill Rate', 'Fill Rate', 'Fill Rate %', 'GRN On-Time', 'GRN On-Time %',
    'GRN On Time %', 'Delayed POs', 'Delayed PO', 'Vendor Code', 'Vendor Name', 'PO Qty',
    'Lead Time', 'On Time', 'Throughput', 'Lead Time Bucket', 'PO Count', 'Avg Lead Time',
    'Vendors at Risk', 'DC Dwell Time', 'GRN Pending', 'Delivery SLA', 'Shipment Exceptions',
    'Intransit Delays', 'Fabric Utilization', 'Quality Pass Rate', 'Audit Compliance',
    'Sample Approval', 'RFID Compliance', 'Total POs', 'First-Pass Yield', 'Defect Rate',
    'At-Risk Fabric', 'Available Fabric', 'Committed Fabric', 'Active Vendors', 'Pack-by-Store',
    'Open POs', 'In-Transit POs', 'Cost Compliance', 'PO-to-Shelf', 'PO-to-GRN', 'RFID Accuracy',
    'Inventory Latency', 'Quality', 'Capacity/mo', 'Current Load', 'Load %', 'Delayed',
    'PO Value', 'Share %', 'Risk', 'IM%', 'Target', 'Compliance', 'POs Below Target',
    'Value at Risk', 'In Production', 'In Transit', 'Delivered', 'GRN Done', 'Avg Lead',
    'Days Delayed', 'Stage Stuck', 'Shipments', 'SLA Met', 'Avg Days', 'Failed Pickups',
    'Exceptions', 'Days Stuck', 'POs Inspected', 'First-Pass', 'Top Defect', 'Severity',
    'Resolution', 'Count', '% of Total', 'Total', 'Free', 'At Risk', 'Cause',
  ]],
  [AOP, [
    // AOP + AOP Dashboard context + Store Performance Dashboard
    'Volume (Thousands)', 'ASP', 'Gross Revenue (Lakhs)', 'Net Revenue (Lakhs)', 'Intake GM',
    'Delivered GM%', 'Volume (Mn Units)', 'Gross Revenue (Cr)', 'Net Revenue (Cr)', 'AOP GM%',
    'AOP Volume', 'AOP ASP', 'AOP Intake GM', 'Gross Revenue AOP/Plan', 'Achievement %',
    'AOP Gross Revenue', 'AOP Net Revenue', 'Discount',
    'Gross Revenue AOP', 'Achievement', 'Avg NRM%', 'Total Sq Ft',
  ]],
  [AOP_VARIANCE, [
    'VT Volume', 'VT ASP', 'VT Gross Revenue', 'VT Net Revenue', 'VT Intake GM', 'VT GM%',
    'Rev Var', 'GM Var', 'SPSF Var', 'Turns Var',
  ]],
  [STORE_INTEL, [
    'Growth YoY', 'Fashion %', 'Affluence', 'Youth', 'Family', 'Fashion Fwd', 'Destination',
    'Signal', 'LFL 2Y CAGR', 'Cluster', 'Competitor', 'Brand/Chain', 'Tier', 'Distance',
    'Rating', 'Est. SFT', 'Threat', 'Category Strength', 'Best Period', 'Best Rev.', 'Best Rev',
    'Current Rev.', 'Current Rev', 'Revenue Index', 'ST 30d',
  ]],
];

/** kpiGlossary abbreviations not already covered by a METRIC_DESCRIPTIONS section. */
const KPI_HOMES: Record<string, MetricHome> = {
  SPSF: GEOGRAPHY, GMROF: GEOGRAPHY,
  ATS: BUSINESS_PULSE, NPS: BUSINESS_PULSE, CSAT: BUSINESS_PULSE, IPCM: BUSINESS_PULSE,
  ATV: BUSINESS_PULSE, UPT: BUSINESS_PULSE, NSV: BUSINESS_PULSE, EBITDA: BUSINESS_PULSE,
  ROI: BUSINESS_PULSE, LFL: BUSINESS_PULSE,
  OTB: OTB, 'OTB Remaining': OTB,
  WOS: INVENTORY, NOOS: INVENTORY, MRP: INVENTORY, STR: INVENTORY, 'Sell-Through': INVENTORY,
  'Twin Gap': STORE_INTEL, 'Comp.Gap': STORE_INTEL, 'Catch.': STORE_INTEL,
  AQL: OPERATIONS, SLA: OPERATIONS,
};

function buildHomeMap(): Record<string, MetricHome> {
  const map: Record<string, MetricHome> = {};
  // Sections first (METRIC_DESCRIPTIONS keys win for shared keys).
  for (const [home, keys] of SECTION_HOMES) {
    for (const key of keys) map[key] = home;
  }
  // The entire Store-Intelligence tooltip registry → Store View.
  for (const key of Object.keys(tooltipRegistry)) {
    if (!(key in map)) map[key] = STORE_INTEL;
  }
  // kpiGlossary abbreviations (don't override an existing section assignment).
  for (const [key, home] of Object.entries(KPI_HOMES)) {
    if (!(key in map)) map[key] = home;
  }
  return map;
}

const METRIC_HOME = buildHomeMap();

/** Canonical home for a metric key, or undefined if unmapped. */
export function getMetricHome(key: string): MetricHome | undefined {
  return METRIC_HOME[key];
}
