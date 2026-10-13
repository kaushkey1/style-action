import type { PersonaInsightData } from '@/modules/dashboard/data/mockPersonaDashboards';

// ── Types ──

export interface SrcHealthKpi {
  id: string;
  label: string;
  value: string;
  target: string;
  status: 'on_track' | 'warning' | 'critical';
  trendDelta: number;
  trendLabel: string;
  trendDirection: 'up' | 'down' | 'flat';
  infoKey: string;
}

// ── Tab 1: Vendor & Cluster Teams ──

export const vendorKpis: SrcHealthKpi[] = [
  { id: 'src-fr', label: 'Fill Rate', value: '87%', target: '≥95%', status: 'critical', trendDelta: -1.4, trendLabel: 'vs LW', trendDirection: 'down', infoKey: 'Fill Rate' },
  { id: 'src-otif2', label: 'Vendor OTIF', value: '84%', target: '≥90%', status: 'warning', trendDelta: -0.8, trendLabel: 'vs LW', trendDirection: 'down', infoKey: 'Vendor OTIF' },
  { id: 'src-im', label: 'Intake Margin %', value: '49.2%', target: '≥50%', status: 'warning', trendDelta: 0.3, trendLabel: 'vs LW', trendDirection: 'up', infoKey: 'Intake Margin %' },
  { id: 'src-vr', label: 'Vendors at Risk', value: '10', target: '0', status: 'critical', trendDelta: 3, trendLabel: 'vs LW', trendDirection: 'up', infoKey: 'Vendors at Risk' },
];

export const clusterScorecardRows = [
  { cluster: 'Cluster A — West', lead: 'Rajesh Mehta', vendors: 22, otif: '94%', fillRate: '92%', atRisk: 0, delayedPOs: 1, status: 'on_track' as const },
  { cluster: 'Cluster B — North', lead: 'Priya Sharma', vendors: 20, otif: '89%', fillRate: '90%', atRisk: 1, delayedPOs: 2, status: 'on_track' as const },
  { cluster: 'Cluster C — South', lead: 'Vikram Patel', vendors: 18, otif: '87%', fillRate: '88%', atRisk: 1, delayedPOs: 2, status: 'warning' as const },
  { cluster: 'Cluster D — Central', lead: 'Anita Desai', vendors: 16, otif: '86%', fillRate: '86%', atRisk: 2, delayedPOs: 3, status: 'warning' as const },
  { cluster: 'Cluster E — NE', lead: 'Suresh Kumar', vendors: 14, otif: '84%', fillRate: '84%', atRisk: 1, delayedPOs: 3, status: 'warning' as const },
  { cluster: 'Cluster F — West-2', lead: 'Meena Iyer', vendors: 15, otif: '82%', fillRate: '82%', atRisk: 2, delayedPOs: 4, status: 'warning' as const },
  { cluster: 'Cluster G — South-2', lead: 'Arjun Nair', vendors: 16, otif: '76%', fillRate: '78%', atRisk: 3, delayedPOs: 5, status: 'critical' as const },
  { cluster: 'Cluster H — North-2', lead: 'Deepa Joshi', vendors: 14, otif: '74%', fillRate: '74%', atRisk: 2, delayedPOs: 4, status: 'critical' as const },
  { cluster: 'Cluster I — East', lead: 'Ramesh Das', vendors: 13, otif: '66%', fillRate: '68%', atRisk: 4, delayedPOs: 6, status: 'critical' as const },
];

export const vendorScorecardRows = [
  { vendor: 'Page Industries', onTime: '96%', quality: '98%', fillRate: '96%', score: 'A+', cluster: 'Cluster A' },
  { vendor: 'Arvind Mills', onTime: '94%', quality: '98%', fillRate: '94%', score: 'A+', cluster: 'Cluster A' },
  { vendor: 'Welspun India', onTime: '92%', quality: '96%', fillRate: '92%', score: 'A', cluster: 'Cluster A' },
  { vendor: 'Shahi Exports', onTime: '90%', quality: '95%', fillRate: '90%', score: 'A', cluster: 'Cluster B' },
  { vendor: 'Raymond', onTime: '88%', quality: '97%', fillRate: '88%', score: 'A-', cluster: 'Cluster B' },
  { vendor: 'Pearl Global', onTime: '72%', quality: '88%', fillRate: '72%', score: 'B', cluster: 'Cluster G' },
  { vendor: 'Bombay Rayon', onTime: '68%', quality: '86%', fillRate: '68%', score: 'B-', cluster: 'Cluster G' },
  { vendor: 'Gokaldas', onTime: '64%', quality: '84%', fillRate: '64%', score: 'B-', cluster: 'Cluster G' },
  { vendor: 'INTIMI INDIA', onTime: '0%', quality: '0%', fillRate: '0%', score: 'F', cluster: 'Cluster I' },
  { vendor: 'MILA STAR', onTime: '0%', quality: '0%', fillRate: '0%', score: 'F', cluster: 'Cluster I' },
];

export const zeroFillVendorRows = [
  { vendor: 'INTIMI INDIA', cluster: 'Cluster I — East', poCount: 18, unitsOrdered: '12,400', daysSinceGRN: 62, status: 'No GRN — Escalated' },
  { vendor: 'MILA STAR', cluster: 'Cluster I — East', poCount: 16, unitsOrdered: '9,800', daysSinceGRN: 58, status: 'No GRN — Escalated' },
  { vendor: 'FASHION CRAFT LLP', cluster: 'Cluster H — North-2', poCount: 8, unitsOrdered: '4,200', daysSinceGRN: 45, status: 'No GRN — Under Review' },
  { vendor: 'SILK ROUTE TEXTILES', cluster: 'Cluster G — South-2', poCount: 6, unitsOrdered: '3,600', daysSinceGRN: 38, status: 'Partial GRN — At Risk' },
  { vendor: 'METRO GARMENTS', cluster: 'Cluster H — North-2', poCount: 4, unitsOrdered: '2,800', daysSinceGRN: 32, status: 'Partial GRN — At Risk' },
  { vendor: 'ZENITH EXPORTS', cluster: 'Cluster G — South-2', poCount: 3, unitsOrdered: '1,900', daysSinceGRN: 28, status: 'Partial GRN — Monitoring' },
];

export const vendorLoadRows = [
  { vendor: 'Page Industries', cluster: 'Cluster A', activePOs: 62, capacityMo: '60,000 units', currentLoad: '64,800 units', loadPct: 108, delayed: 3, status: 'Overloaded' },
  { vendor: 'Shahi Exports', cluster: 'Cluster B', activePOs: 58, capacityMo: '50,000 units', currentLoad: '48,200 units', loadPct: 96, delayed: 2, status: 'At Capacity' },
  { vendor: 'Arvind Mills', cluster: 'Cluster A', activePOs: 68, capacityMo: '80,000 units', currentLoad: '72,400 units', loadPct: 91, delayed: 1, status: 'At Capacity' },
  { vendor: 'Raymond', cluster: 'Cluster B', activePOs: 64, capacityMo: '70,000 units', currentLoad: '58,100 units', loadPct: 83, delayed: 1, status: 'Available' },
  { vendor: 'Welspun India', cluster: 'Cluster A', activePOs: 56, capacityMo: '55,000 units', currentLoad: '46,200 units', loadPct: 84, delayed: 0, status: 'Available' },
  { vendor: 'Bombay Rayon', cluster: 'Cluster G', activePOs: 42, capacityMo: '35,000 units', currentLoad: '38,500 units', loadPct: 110, delayed: 5, status: 'Overloaded' },
  { vendor: 'Gokaldas', cluster: 'Cluster G', activePOs: 44, capacityMo: '40,000 units', currentLoad: '44,800 units', loadPct: 112, delayed: 6, status: 'Overloaded' },
  { vendor: 'Pearl Global', cluster: 'Cluster G', activePOs: 38, capacityMo: '45,000 units', currentLoad: '32,400 units', loadPct: 72, delayed: 2, status: 'Available' },
];

export const vendorConcentrationRows = [
  { vendor: 'Page Industries', poValue: '₹18.2 Cr', share: '4.4%', categories: 'Menswear, Kids, Non-Apparel', risk: 'Low' },
  { vendor: 'Arvind Mills', poValue: '₹16.8 Cr', share: '4.1%', categories: 'Menswear, Women Western, Denim', risk: 'Low' },
  { vendor: 'Raymond', poValue: '₹15.4 Cr', share: '3.7%', categories: 'Menswear, Formal, Women Western', risk: 'Low' },
  { vendor: 'Shahi Exports', poValue: '₹14.6 Cr', share: '3.5%', categories: 'Women Western, Menswear, Kids', risk: 'Low' },
  { vendor: 'Gokaldas', poValue: '₹8.8 Cr', share: '2.1%', categories: 'Women Western, Menswear, External', risk: 'Critical' },
  { vendor: 'INTIMI INDIA', poValue: '₹5.2 Cr', share: '1.3%', categories: 'Women Indian, Non-Apparel', risk: 'Critical' },
];

export const intakeMarginByCategory = [
  { category: 'Menswear', im: '50.8%', target: '50%', compliance: '98%', posBelowTarget: 4, valueAtRisk: '₹1.2 Cr' },
  { category: 'Women Western', im: '49.6%', target: '50%', compliance: '96%', posBelowTarget: 8, valueAtRisk: '₹2.8 Cr' },
  { category: 'Women Indian', im: '48.4%', target: '50%', compliance: '94%', posBelowTarget: 12, valueAtRisk: '₹4.1 Cr' },
  { category: 'Kids', im: '51.2%', target: '50%', compliance: '99%', posBelowTarget: 2, valueAtRisk: '₹0.6 Cr' },
  { category: 'Non-Apparel', im: '47.8%', target: '48%', compliance: '96%', posBelowTarget: 6, valueAtRisk: '₹1.8 Cr' },
  { category: 'External Brands', im: '44.2%', target: '45%', compliance: '92%', posBelowTarget: 14, valueAtRisk: '₹5.4 Cr' },
];

export const vendorOnTimeTrend = [
  { week: 'W1', actual: 86, target: 90 },
  { week: 'W2', actual: 84, target: 90 },
  { week: 'W3', actual: 85, target: 90 },
  { week: 'W4', actual: 83, target: 90 },
  { week: 'W5', actual: 81, target: 90 },
  { week: 'W6', actual: 82, target: 90 },
  { week: 'W7', actual: 80, target: 90 },
  { week: 'W8', actual: 82, target: 90 },
];

// ── Tab 2: PO Pipeline ──

export const poKpis: SrcHealthKpi[] = [
  { id: 'src-total-pos', label: 'Total POs', value: '14,116', target: '-', status: 'on_track', trendDelta: 6, trendLabel: 'vs LW', trendDirection: 'up', infoKey: 'Total POs' },
  { id: 'src-delayed2', label: 'Delayed POs', value: '24', target: '≤15', status: 'critical', trendDelta: 4, trendLabel: 'vs LW', trendDirection: 'up', infoKey: 'Delayed POs' },
  { id: 'src-po-grn', label: 'PO-to-GRN', value: '32 days', target: '≤30 days', status: 'warning', trendDelta: 1.2, trendLabel: 'vs LW', trendDirection: 'up', infoKey: 'PO-to-GRN' },
  { id: 'src-grn-pending', label: 'GRN Pending', value: '186', target: '-', status: 'warning', trendDelta: 12, trendLabel: 'vs LW', trendDirection: 'up', infoKey: 'GRN Pending' },
];

export const poFunnelData = [
  { stage: 'PO Created', count: 14116 },
  { stage: 'Lots Passed', count: 12840 },
  { stage: 'Box Closed', count: 11420 },
  { stage: 'ASN Generated', count: 10890 },
  { stage: 'Invoice Generated', count: 10640 },
  { stage: 'DP Assigned', count: 9800 },
  { stage: 'Pickup Pending', count: 4322 },
  { stage: 'Manifest Closed', count: 7079 },
  { stage: 'In Transit', count: 4108 },
  { stage: 'Delivered', count: 3200 },
  { stage: 'GRN Generated', count: 2800 },
];

export const poPipelineByCategoryRows = [
  { category: 'Menswear', totalPOs: '3,842', inProduction: 680, inTransit: 420, delivered: 890, grnDone: 780, fillRate: '91%', avgLead: '28 days' },
  { category: 'Women Western', totalPOs: '2,916', inProduction: 520, inTransit: 380, delivered: 620, grnDone: 540, fillRate: '86%', avgLead: '32 days' },
  { category: 'Women Indian', totalPOs: '2,648', inProduction: 480, inTransit: 310, delivered: 480, grnDone: 420, fillRate: '82%', avgLead: '35 days' },
  { category: 'Kids', totalPOs: '2,210', inProduction: 390, inTransit: 280, delivered: 540, grnDone: 460, fillRate: '89%', avgLead: '30 days' },
  { category: 'Non-Apparel', totalPOs: '1,480', inProduction: 240, inTransit: 180, delivered: 380, grnDone: 340, fillRate: '92%', avgLead: '26 days' },
  { category: 'External Brands', totalPOs: '1,020', inProduction: 180, inTransit: 120, delivered: 290, grnDone: 260, fillRate: '78%', avgLead: '38 days' },
];

export const delayedPORows = [
  { poId: 'PO-2024-08142', vendor: 'Gokaldas', cluster: 'Cluster G', category: 'Women Western', daysDelayed: 18, stageStuck: 'Pickup Pending', value: '₹42L', action: 'Escalate to DP' },
  { poId: 'PO-2024-07986', vendor: 'Bombay Rayon', cluster: 'Cluster G', category: 'Women Indian', daysDelayed: 15, stageStuck: 'In Transit', value: '₹38L', action: 'Track Shipment' },
  { poId: 'PO-2024-08201', vendor: 'INTIMI INDIA', cluster: 'Cluster I', category: 'Non-Apparel', daysDelayed: 62, stageStuck: 'PO Created', value: '₹28L', action: 'Cancel & Reallocate' },
  { poId: 'PO-2024-08044', vendor: 'Pearl Global', cluster: 'Cluster G', category: 'Kids', daysDelayed: 12, stageStuck: 'Quality Check', value: '₹22L', action: 'Follow Up' },
  { poId: 'PO-2024-07892', vendor: 'MILA STAR', cluster: 'Cluster I', category: 'Kids', daysDelayed: 58, stageStuck: 'PO Created', value: '₹18L', action: 'Cancel & Reallocate' },
  { poId: 'PO-2024-08156', vendor: 'FASHION CRAFT', cluster: 'Cluster H', category: 'Menswear', daysDelayed: 8, stageStuck: 'DP Assigned', value: '₹15L', action: 'Monitor' },
];

// ── Tab 3: Logistics & SLA ──

export const logisticsKpis: SrcHealthKpi[] = [
  { id: 'src-dc-dwell', label: 'DC Dwell Time', value: '28 hrs', target: '≤24 hrs', status: 'warning', trendDelta: 2, trendLabel: 'vs LW', trendDirection: 'up', infoKey: 'DC Dwell Time' },
  { id: 'src-delivery-sla', label: 'Delivery SLA %', value: '88%', target: '≥95%', status: 'critical', trendDelta: -1.2, trendLabel: 'vs LW', trendDirection: 'down', infoKey: 'Delivery SLA' },
  { id: 'src-ship-exc', label: 'Shipment Exceptions', value: '42', target: '0', status: 'critical', trendDelta: 8, trendLabel: 'vs LW', trendDirection: 'up', infoKey: 'Shipment Exceptions' },
  { id: 'src-intransit', label: 'Intransit Delays', value: '18', target: '0', status: 'critical', trendDelta: 4, trendLabel: 'vs LW', trendDirection: 'up', infoKey: 'Intransit Delays' },
];

export const deliveryPartnerRows = [
  { partner: 'Delhivery', shipments: '4,280', onTime: '96%', slaMet: '97%', avgDays: 2.1, failedPickups: 0, exceptions: 2, score: 'A+' },
  { partner: 'BlueDart', shipments: '3,640', onTime: '94%', slaMet: '95%', avgDays: 2.3, failedPickups: 0, exceptions: 3, score: 'A' },
  { partner: 'Ecom Express', shipments: '2,890', onTime: '92%', slaMet: '93%', avgDays: 2.6, failedPickups: 1, exceptions: 4, score: 'A' },
  { partner: 'DTDC', shipments: '1,820', onTime: '88%', slaMet: '89%', avgDays: 3.1, failedPickups: 2, exceptions: 6, score: 'B+' },
  { partner: 'Xpressbees', shipments: '1,640', onTime: '86%', slaMet: '87%', avgDays: 3.4, failedPickups: 1, exceptions: 5, score: 'B+' },
  { partner: 'Shadowfax', shipments: '1,280', onTime: '84%', slaMet: '85%', avgDays: 3.6, failedPickups: 3, exceptions: 8, score: 'B' },
  { partner: 'Rivigo', shipments: '640', onTime: '78%', slaMet: '79%', avgDays: 4.2, failedPickups: 4, exceptions: 8, score: 'B-' },
];

export const shipmentExceptionRows = [
  { awb: 'AWB-7842916', vendor: 'Gokaldas', site: 'Mumbai DC', excType: 'Address Mismatch', daysStuck: 4, action: 'Update Address' },
  { awb: 'AWB-7843028', vendor: 'Bombay Rayon', site: 'Delhi Hub', excType: 'Customer Refused', daysStuck: 6, action: 'Reattempt Delivery' },
  { awb: 'AWB-7843142', vendor: 'Pearl Global', site: 'Bangalore DC', excType: 'Package Damaged', daysStuck: 3, action: 'Raise Claim' },
  { awb: 'AWB-7843256', vendor: 'INTIMI INDIA', site: 'Chennai Hub', excType: 'Not Traceable', daysStuck: 8, action: 'File Insurance' },
  { awb: 'AWB-7843371', vendor: 'Shahi Exports', site: 'Kolkata DC', excType: 'Weight Discrepancy', daysStuck: 2, action: 'Reweigh & Dispatch' },
  { awb: 'AWB-7843489', vendor: 'Arvind Mills', site: 'Pune Hub', excType: 'Vehicle Breakdown', daysStuck: 1, action: 'Reassign Vehicle' },
];

export const deliverySlaTrend = [
  { month: 'Oct', sla: 92, target: 95 },
  { month: 'Nov', sla: 90, target: 95 },
  { month: 'Dec', sla: 86, target: 95 },
  { month: 'Jan', sla: 88, target: 95 },
  { month: 'Feb', sla: 87, target: 95 },
  { month: 'Mar', sla: 88, target: 95 },
];

// ── Tab 4: Quality & Materials ──

export const qualityKpis: SrcHealthKpi[] = [
  { id: 'src-fpy', label: 'First-Pass Yield', value: '91%', target: '≥95%', status: 'warning', trendDelta: -0.4, trendLabel: 'vs LW', trendDirection: 'down', infoKey: 'First-Pass Yield' },
  { id: 'src-defect', label: 'Defect Rate', value: '3.2%', target: '≤2%', status: 'critical', trendDelta: 0.3, trendLabel: 'vs LW', trendDirection: 'up', infoKey: 'Defect Rate' },
  { id: 'src-fab-util', label: 'Fabric Utilization', value: '78%', target: '≤85%', status: 'on_track', trendDelta: 2.1, trendLabel: 'vs LW', trendDirection: 'up', infoKey: 'Fabric Utilization' },
];

export const qualityByVendorRows = [
  { vendor: 'Gokaldas', cluster: 'Cluster G', posInspected: 44, firstPass: '82%', defectRate: '6.2%', topDefect: 'Stitching Defect', action: 'Issue SCN & Audit' },
  { vendor: 'Bombay Rayon', cluster: 'Cluster G', posInspected: 42, firstPass: '84%', defectRate: '5.8%', topDefect: 'Fabric Flaw', action: 'Supplier Audit' },
  { vendor: 'INTIMI INDIA', cluster: 'Cluster I', posInspected: 32, firstPass: '0%', defectRate: '-', topDefect: 'No GRN', action: 'Escalate — No Delivery' },
  { vendor: 'Pearl Global', cluster: 'Cluster G', posInspected: 38, firstPass: '88%', defectRate: '3.4%', topDefect: 'Color Variation', action: 'Re-inspection' },
  { vendor: 'Shahi Exports', cluster: 'Cluster B', posInspected: 58, firstPass: '92%', defectRate: '2.8%', topDefect: 'Sizing Error', action: 'Corrective Action' },
  { vendor: 'Raymond', cluster: 'Cluster B', posInspected: 64, firstPass: '96%', defectRate: '1.6%', topDefect: 'Packaging', action: 'Monitor' },
];

export const defectBreakdownRows = [
  { type: 'Stitching', count: 284, pctOfTotal: '34%', trend: '↑', impact: 'High — Returns & rework' },
  { type: 'Fabric Flaw', count: 198, pctOfTotal: '24%', trend: '→', impact: 'High — Full rejection' },
  { type: 'Color Variation', count: 142, pctOfTotal: '17%', trend: '↓', impact: 'Medium — Partial rework' },
  { type: 'Sizing Error', count: 118, pctOfTotal: '14%', trend: '↑', impact: 'Medium — Recut required' },
  { type: 'Packaging', count: 92, pctOfTotal: '11%', trend: '→', impact: 'Low — Repackage' },
];

export const fabricPositionRows = [
  { type: 'Cotton', total: '1,200K', committed: '864K', free: '336K', utilPct: 72, atRisk: '28K', status: 'Healthy' },
  { type: 'Polyester Blend', total: '680K', committed: '578K', free: '102K', utilPct: 85, atRisk: '42K', status: 'Tight' },
  { type: 'Denim', total: '420K', committed: '269K', free: '151K', utilPct: 64, atRisk: '12K', status: 'Healthy' },
  { type: 'Linen', total: '280K', committed: '255K', free: '25K', utilPct: 91, atRisk: '32K', status: 'Critical' },
  { type: 'Viscose', total: '320K', committed: '186K', free: '134K', utilPct: 58, atRisk: '6K', status: 'Healthy' },
];

export const defectByCategoryData = [
  { name: 'Kids', value: 4.8 },
  { name: 'Women Indian', value: 4.2 },
  { name: 'External Brands', value: 3.8 },
  { name: 'Menswear', value: 2.6 },
  { name: 'Women Western', value: 2.4 },
  { name: 'Non-Apparel', value: 1.8 },
];

export const fabricUtilData = [
  { type: 'Linen', value: 91 },
  { type: 'Polyester Blend', value: 85 },
  { type: 'Cotton', value: 72 },
  { type: 'Denim', value: 64 },
  { type: 'Viscose', value: 58 },
];

// ── Morning Briefing Insights (BQ-sourced) ──

export const sourcingInsights: PersonaInsightData = {
  morningQuestion: 'What is the fill rate, which vendors are stuck, and what needs escalation?',
  summary: '836K POs across 4,122 vendors in 60 days. Fill rate at 2.04% — 88.9M units ordered, only 1.8M received. 10 vendors at 0% fill rate including INTIMI INDIA (8,634 POs) and MILA STAR (15,877 POs). No vendor concentration risk — top vendor at 4.4% of total PO value.',
  insights: [
    { id: 'src-i1', headline: 'Fill rate at 2.04% — 88.9M units ordered, 1.8M received', detail: '836K POs created in 60 days with only 2.04% fill rate. While many recent POs are still in production pipeline, the magnitude indicates systemic delays. Top vendor Fab Distributors (Rs.39.2 Cr PO value) at only 0.97% fill rate.', status: 'critical', metric: '2.04% fill rate (target: 95%)' },
    { id: 'src-i2', headline: '10 vendors at 0% fill rate — INTIMI and MILA STAR highest risk', detail: 'INTIMI INDIA (8,634 POs, 13.5K units), MILA STAR RETAIL (15,877 POs, 23.1K units) all at zero GRN. These represent the highest supply chain risk.', status: 'critical', metric: '10 vendors at 0% GRN' },
    { id: 'src-i3', headline: 'No vendor concentration risk — top vendor at 4.4% share', detail: '4,122 vendors active with diversified sourcing. Top vendor (Fab Distributors) at Rs.39.2 Cr represents only 4.4% of total PO value — well below the 20% green threshold.', status: 'on-track', metric: '4.4% max concentration (target: <20%)' },
  ],
  agentActions: [
    { agentName: 'Vendor Intelligence (VS4)', action: 'Flagged 10 zero-fill-rate vendors for escalation calls', outcome: 'Escalation list generated with contact details and PO summaries' },
    { agentName: 'Replenishment Engine (RE1)', action: 'Adjusted store allocations based on available GRN pipeline', outcome: 'Maintained stock coverage at high-velocity stores' },
    { agentName: 'OTB Guardian (A11)', action: 'Vendor concentration analysis — max at 4.4%, no single-vendor dependency', outcome: 'All vendors within safe concentration limits' },
  ],
};
