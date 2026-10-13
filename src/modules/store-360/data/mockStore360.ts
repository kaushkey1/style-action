// src/data/mockStore360.ts
// ── Store 360 Hub — Operations & Customer Mock Data ──

// ── Types ──

export interface CCTVAnalysis {
  storeId: string;
  date: string;
  footfall: number;
  avgDwellMinutes: number;
  conversionRate: number;
  hotZones: { zone: string; traffic: 'high' | 'medium' | 'low' }[];
  alerts: { time: string; type: string; severity: 'info' | 'warning' | 'critical' }[];
}

export interface StoreHygieneReport {
  storeId: string;
  auditDate: string;
  overallScore: number; // 0-100
  categories: {
    category: string;
    score: number;
    status: 'pass' | 'fail' | 'warning';
    notes: string;
  }[];
  images: { id: string; label: string; timestamp: string; status: 'compliant' | 'non-compliant' }[];
}

export interface StoreCommunication {
  id: string;
  storeId: string;
  type: 'vm-directive' | 'promotion-brief' | 'compliance-notice' | 'planogram-update';
  title: string;
  date: string;
  status: 'acknowledged' | 'pending' | 'overdue';
  sentBy: string;
}

export interface NPSData {
  storeId: string;
  period: string;
  npsScore: number;
  responseCount: number;
  promoters: number;
  passives: number;
  detractors: number;
  trend: { month: string; score: number }[];
}

export interface SilentNPSData {
  storeId: string;
  period: string;
  silentNpsScore: number;
  factors: { factor: string; score: number; weight: number; trend: 'up' | 'down' | 'stable' }[];
}

// ── CCTV Analysis Data ──

export const cctvAnalyses: CCTVAnalysis[] = [
  {
    storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', // Phoenix Palladium, Mumbai
    date: '2026-03-22',
    footfall: 2847,
    avgDwellMinutes: 18.5,
    conversionRate: 32.4,
    hotZones: [
      { zone: 'Women Indian Wear', traffic: 'high' },
      { zone: 'Menswear Casual', traffic: 'high' },
      { zone: 'Women Western Wear', traffic: 'medium' },
      { zone: 'Kidswear', traffic: 'low' },
    ],
    alerts: [
      { time: '14:32', type: 'Queue buildup at cash counter 2', severity: 'warning' },
      { time: '16:45', type: 'Trial room occupancy at 95%', severity: 'info' },
    ],
  },
  {
    storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', // Select Citywalk, Delhi
    date: '2026-03-22',
    footfall: 2634,
    avgDwellMinutes: 17.2,
    conversionRate: 29.8,
    hotZones: [
      { zone: 'Menswear Formal', traffic: 'high' },
      { zone: 'Women Western Wear', traffic: 'high' },
      { zone: 'Menswear Casual', traffic: 'medium' },
      { zone: 'Kidswear', traffic: 'low' },
    ],
    alerts: [
      { time: '12:15', type: 'Spillage detected near trial rooms', severity: 'critical' },
      { time: '15:20', type: 'Stock replenishment needed - WWW Zone', severity: 'warning' },
    ],
  },
  {
    storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', // UB City Mall, Bangalore
    date: '2026-03-22',
    footfall: 2215,
    avgDwellMinutes: 16.8,
    conversionRate: 28.5,
    hotZones: [
      { zone: 'Women Western Wear', traffic: 'high' },
      { zone: 'Women Indian Wear', traffic: 'high' },
      { zone: 'Menswear Formal', traffic: 'medium' },
      { zone: 'Menswear Casual', traffic: 'medium' },
    ],
    alerts: [
      { time: '11:45', type: 'Peak hour staffing alert', severity: 'warning' },
      { time: '17:30', type: 'Window display adjustment needed', severity: 'info' },
    ],
  },
  {
    storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', // Express Avenue, Chennai
    date: '2026-03-22',
    footfall: 1892,
    avgDwellMinutes: 19.3,
    conversionRate: 31.2,
    hotZones: [
      { zone: 'Women Indian Wear', traffic: 'high' },
      { zone: 'Menswear Casual', traffic: 'medium' },
      { zone: 'Women Western Wear', traffic: 'medium' },
      { zone: 'Kidswear', traffic: 'medium' },
    ],
    alerts: [
      { time: '13:10', type: 'Air conditioning adjustment needed', severity: 'info' },
      { time: '16:00', type: 'Queue buildup at cash counter 1', severity: 'warning' },
    ],
  },
  {
    storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', // Inorbit Mall, Hyderabad
    date: '2026-03-22',
    footfall: 1745,
    avgDwellMinutes: 18.7,
    conversionRate: 27.3,
    hotZones: [
      { zone: 'Women Indian Wear', traffic: 'high' },
      { zone: 'Menswear Casual', traffic: 'medium' },
      { zone: 'Women Western Wear', traffic: 'medium' },
      { zone: 'Kidswear', traffic: 'low' },
    ],
    alerts: [
      { time: '10:30', type: 'Store opening checklist pending', severity: 'warning' },
      { time: '14:50', type: 'Stockroom access clearance needed', severity: 'info' },
    ],
  },
  {
    storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', // Phoenix Marketcity, Pune
    date: '2026-03-22',
    footfall: 1623,
    avgDwellMinutes: 15.9,
    conversionRate: 25.8,
    hotZones: [
      { zone: 'Women Western Wear', traffic: 'high' },
      { zone: 'Menswear Casual', traffic: 'medium' },
      { zone: 'Women Indian Wear', traffic: 'medium' },
      { zone: 'Menswear Formal', traffic: 'low' },
    ],
    alerts: [
      { time: '12:40', type: 'Fixture rearrangement in progress', severity: 'info' },
      { time: '15:55', type: 'Trial room cleaning cycle due', severity: 'info' },
    ],
  },
  {
    storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', // Quest Mall, Kolkata
    date: '2026-03-22',
    footfall: 1384,
    avgDwellMinutes: 20.1,
    conversionRate: 26.7,
    hotZones: [
      { zone: 'Women Indian Wear', traffic: 'high' },
      { zone: 'Women Western Wear', traffic: 'medium' },
      { zone: 'Menswear Casual', traffic: 'medium' },
      { zone: 'Kidswear', traffic: 'low' },
    ],
    alerts: [
      { time: '11:20', type: 'Lighting adjustment needed - WIW zone', severity: 'warning' },
      { time: '16:35', type: 'Customer feedback kiosk offline', severity: 'critical' },
    ],
  },
  {
    storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', // Palladium, Ahmedabad
    date: '2026-03-22',
    footfall: 1297,
    avgDwellMinutes: 17.6,
    conversionRate: 28.9,
    hotZones: [
      { zone: 'Women Indian Wear', traffic: 'high' },
      { zone: 'Menswear Casual', traffic: 'medium' },
      { zone: 'Women Western Wear', traffic: 'medium' },
      { zone: 'Menswear Formal', traffic: 'low' },
    ],
    alerts: [
      { time: '13:45', type: 'Promotional signage update required', severity: 'info' },
    ],
  },
  {
    storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', // World Trade Park, Jaipur
    date: '2026-03-22',
    footfall: 1152,
    avgDwellMinutes: 21.4,
    conversionRate: 30.5,
    hotZones: [
      { zone: 'Women Indian Wear', traffic: 'high' },
      { zone: 'Menswear Casual', traffic: 'medium' },
      { zone: 'Women Western Wear', traffic: 'medium' },
      { zone: 'Kidswear', traffic: 'low' },
    ],
    alerts: [
      { time: '14:10', type: 'Staff break rotation adjustment', severity: 'info' },
      { time: '17:15', type: 'End-of-day inventory count reminder', severity: 'info' },
    ],
  },
  {
    storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', // Lulu Mall, Lucknow
    date: '2026-03-22',
    footfall: 1089,
    avgDwellMinutes: 19.8,
    conversionRate: 24.3,
    hotZones: [
      { zone: 'Women Indian Wear', traffic: 'high' },
      { zone: 'Menswear Casual', traffic: 'medium' },
      { zone: 'Kidswear', traffic: 'medium' },
      { zone: 'Women Western Wear', traffic: 'low' },
    ],
    alerts: [
      { time: '10:50', type: 'Music system volume adjustment', severity: 'info' },
      { time: '15:40', type: 'Queue buildup at cash counter 1', severity: 'warning' },
    ],
  },
];

// ── Store Hygiene Reports ──

export const hygieneReports: StoreHygieneReport[] = [
  {
    storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', // Phoenix Palladium, Mumbai
    auditDate: '2026-03-20',
    overallScore: 92,
    categories: [
      { category: 'Floor Cleanliness', score: 95, status: 'pass', notes: 'Excellent upkeep. Minor scuff marks near entrance.' },
      { category: 'Display Compliance', score: 90, status: 'pass', notes: 'All VM guidelines followed. One fixture tag missing.' },
      { category: 'Trial Room', score: 88, status: 'warning', notes: 'Mirror cleaning needed. Hook replacement in room 3.' },
      { category: 'Signage', score: 94, status: 'pass', notes: 'Clear and compliant. Promotion board updated.' },
      { category: 'Stockroom', score: 93, status: 'pass', notes: 'Well-organized. FIFO maintained.' },
    ],
    images: [
      { id: 'HYG-PP-001', label: 'Floor - Main Entrance', timestamp: '2026-03-20T10:15:00', status: 'compliant' },
      { id: 'HYG-PP-002', label: 'Display - WIW Zone', timestamp: '2026-03-20T10:22:00', status: 'compliant' },
      { id: 'HYG-PP-003', label: 'Trial Room 3', timestamp: '2026-03-20T10:35:00', status: 'non-compliant' },
      { id: 'HYG-PP-004', label: 'Stockroom', timestamp: '2026-03-20T10:48:00', status: 'compliant' },
    ],
  },
  {
    storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', // Select Citywalk, Delhi
    auditDate: '2026-03-19',
    overallScore: 85,
    categories: [
      { category: 'Floor Cleanliness', score: 80, status: 'warning', notes: 'Spillage response time needs improvement.' },
      { category: 'Display Compliance', score: 88, status: 'warning', notes: 'Two fixtures not aligned with planogram.' },
      { category: 'Trial Room', score: 90, status: 'pass', notes: 'Clean and well-maintained.' },
      { category: 'Signage', score: 82, status: 'warning', notes: 'Price tags outdated on 3 racks.' },
      { category: 'Stockroom', score: 85, status: 'warning', notes: 'Box stacking height exceeds safety limit.' },
    ],
    images: [
      { id: 'HYG-SC-001', label: 'Floor - Near Trial Rooms', timestamp: '2026-03-19T11:05:00', status: 'non-compliant' },
      { id: 'HYG-SC-002', label: 'Display - MF Zone', timestamp: '2026-03-19T11:18:00', status: 'non-compliant' },
      { id: 'HYG-SC-003', label: 'Trial Room Area', timestamp: '2026-03-19T11:30:00', status: 'compliant' },
      { id: 'HYG-SC-004', label: 'Stockroom', timestamp: '2026-03-19T11:42:00', status: 'non-compliant' },
    ],
  },
  {
    storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', // UB City Mall, Bangalore
    auditDate: '2026-03-18',
    overallScore: 89,
    categories: [
      { category: 'Floor Cleanliness', score: 92, status: 'pass', notes: 'Consistently excellent.' },
      { category: 'Display Compliance', score: 87, status: 'warning', notes: 'WWW zone needs fixture consolidation per new planogram.' },
      { category: 'Trial Room', score: 91, status: 'pass', notes: 'Clean with proper lighting.' },
      { category: 'Signage', score: 88, status: 'warning', notes: 'Brand hierarchy signage update pending.' },
      { category: 'Stockroom', score: 87, status: 'warning', notes: 'Old season stock needs clearance tagging.' },
    ],
    images: [
      { id: 'HYG-UB-001', label: 'Floor - Main Aisle', timestamp: '2026-03-18T09:50:00', status: 'compliant' },
      { id: 'HYG-UB-002', label: 'Display - WWW Zone', timestamp: '2026-03-18T10:05:00', status: 'non-compliant' },
      { id: 'HYG-UB-003', label: 'Trial Room Area', timestamp: '2026-03-18T10:20:00', status: 'compliant' },
      { id: 'HYG-UB-004', label: 'Stockroom', timestamp: '2026-03-18T10:35:00', status: 'non-compliant' },
    ],
  },
  {
    storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', // Express Avenue, Chennai
    auditDate: '2026-03-21',
    overallScore: 94,
    categories: [
      { category: 'Floor Cleanliness', score: 96, status: 'pass', notes: 'Spotless. Team consistently exceeds standard.' },
      { category: 'Display Compliance', score: 93, status: 'pass', notes: 'WIW zone exemplary. Minor adjustments in MC.' },
      { category: 'Trial Room', score: 95, status: 'pass', notes: 'Excellent upkeep and customer feedback.' },
      { category: 'Signage', score: 92, status: 'pass', notes: 'All signage current and compliant.' },
      { category: 'Stockroom', score: 94, status: 'pass', notes: 'Best-in-zone organization.' },
    ],
    images: [
      { id: 'HYG-EA-001', label: 'Floor - Entrance', timestamp: '2026-03-21T10:00:00', status: 'compliant' },
      { id: 'HYG-EA-002', label: 'Display - WIW Zone', timestamp: '2026-03-21T10:15:00', status: 'compliant' },
      { id: 'HYG-EA-003', label: 'Trial Room Area', timestamp: '2026-03-21T10:30:00', status: 'compliant' },
      { id: 'HYG-EA-004', label: 'Stockroom', timestamp: '2026-03-21T10:45:00', status: 'compliant' },
    ],
  },
  {
    storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', // Inorbit Mall, Hyderabad
    auditDate: '2026-03-17',
    overallScore: 87,
    categories: [
      { category: 'Floor Cleanliness', score: 89, status: 'warning', notes: 'Good overall. High traffic areas need more frequent cleaning.' },
      { category: 'Display Compliance', score: 85, status: 'warning', notes: 'KW zone display height not per VM guideline.' },
      { category: 'Trial Room', score: 88, status: 'warning', notes: 'Lighting bulb replacement needed in room 2.' },
      { category: 'Signage', score: 90, status: 'pass', notes: 'Clear and updated.' },
      { category: 'Stockroom', score: 83, status: 'warning', notes: 'Inventory tagging incomplete for new arrivals.' },
    ],
    images: [
      { id: 'HYG-IM-001', label: 'Floor - Main Aisle', timestamp: '2026-03-17T11:10:00', status: 'compliant' },
      { id: 'HYG-IM-002', label: 'Display - KW Zone', timestamp: '2026-03-17T11:25:00', status: 'non-compliant' },
      { id: 'HYG-IM-003', label: 'Trial Room 2', timestamp: '2026-03-17T11:40:00', status: 'non-compliant' },
      { id: 'HYG-IM-004', label: 'Stockroom', timestamp: '2026-03-17T11:55:00', status: 'non-compliant' },
    ],
  },
  {
    storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', // Phoenix Marketcity, Pune
    auditDate: '2026-03-16',
    overallScore: 81,
    categories: [
      { category: 'Floor Cleanliness', score: 78, status: 'warning', notes: 'Cleaning frequency needs increase during peak hours.' },
      { category: 'Display Compliance', score: 80, status: 'warning', notes: 'Multiple fixtures underutilized. Consolidation pending.' },
      { category: 'Trial Room', score: 85, status: 'warning', notes: 'Mirror streaks. Deep cleaning required.' },
      { category: 'Signage', score: 83, status: 'warning', notes: 'Promotional posters faded. Replacement needed.' },
      { category: 'Stockroom', score: 79, status: 'warning', notes: 'FIFO not maintained for seasonal stock.' },
    ],
    images: [
      { id: 'HYG-PM-001', label: 'Floor - Peak Hour', timestamp: '2026-03-16T14:20:00', status: 'non-compliant' },
      { id: 'HYG-PM-002', label: 'Display - MC Zone', timestamp: '2026-03-16T14:35:00', status: 'non-compliant' },
      { id: 'HYG-PM-003', label: 'Trial Room Area', timestamp: '2026-03-16T14:50:00', status: 'non-compliant' },
      { id: 'HYG-PM-004', label: 'Stockroom', timestamp: '2026-03-16T15:05:00', status: 'non-compliant' },
    ],
  },
  {
    storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', // Quest Mall, Kolkata
    auditDate: '2026-03-15',
    overallScore: 90,
    categories: [
      { category: 'Floor Cleanliness', score: 93, status: 'pass', notes: 'Well-maintained throughout the day.' },
      { category: 'Display Compliance', score: 88, status: 'warning', notes: 'WIW zone excellent. MC zone needs minor adjustments.' },
      { category: 'Trial Room', score: 92, status: 'pass', notes: 'Clean and customer-friendly.' },
      { category: 'Signage', score: 89, status: 'warning', notes: 'Brand logo placement needs correction at entrance.' },
      { category: 'Stockroom', score: 88, status: 'warning', notes: 'Good organization. Aisle markings faded.' },
    ],
    images: [
      { id: 'HYG-QM-001', label: 'Floor - Main Area', timestamp: '2026-03-15T10:30:00', status: 'compliant' },
      { id: 'HYG-QM-002', label: 'Display - WIW Zone', timestamp: '2026-03-15T10:45:00', status: 'compliant' },
      { id: 'HYG-QM-003', label: 'Trial Room Area', timestamp: '2026-03-15T11:00:00', status: 'compliant' },
      { id: 'HYG-QM-004', label: 'Stockroom', timestamp: '2026-03-15T11:15:00', status: 'non-compliant' },
    ],
  },
  {
    storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', // Palladium, Ahmedabad
    auditDate: '2026-03-14',
    overallScore: 88,
    categories: [
      { category: 'Floor Cleanliness', score: 91, status: 'pass', notes: 'Consistently good standards.' },
      { category: 'Display Compliance', score: 86, status: 'warning', notes: 'Fixture spacing in WWW zone needs adjustment.' },
      { category: 'Trial Room', score: 90, status: 'pass', notes: 'Clean and well-lit.' },
      { category: 'Signage', score: 87, status: 'warning', notes: 'Promotion end-date tags need removal.' },
      { category: 'Stockroom', score: 86, status: 'warning', notes: 'Inventory labels partially missing.' },
    ],
    images: [
      { id: 'HYG-PA-001', label: 'Floor - Main Entrance', timestamp: '2026-03-14T09:45:00', status: 'compliant' },
      { id: 'HYG-PA-002', label: 'Display - WWW Zone', timestamp: '2026-03-14T10:00:00', status: 'non-compliant' },
      { id: 'HYG-PA-003', label: 'Trial Room Area', timestamp: '2026-03-14T10:15:00', status: 'compliant' },
      { id: 'HYG-PA-004', label: 'Stockroom', timestamp: '2026-03-14T10:30:00', status: 'non-compliant' },
    ],
  },
  {
    storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', // World Trade Park, Jaipur
    auditDate: '2026-03-13',
    overallScore: 91,
    categories: [
      { category: 'Floor Cleanliness', score: 94, status: 'pass', notes: 'Excellent standards maintained.' },
      { category: 'Display Compliance', score: 90, status: 'pass', notes: 'WIW zone is exemplary. All guidelines followed.' },
      { category: 'Trial Room', score: 89, status: 'warning', notes: 'Minor touch-ups needed in room 1.' },
      { category: 'Signage', score: 92, status: 'pass', notes: 'Clear, updated, and compliant.' },
      { category: 'Stockroom', score: 90, status: 'pass', notes: 'Well-organized with proper labeling.' },
    ],
    images: [
      { id: 'HYG-WT-001', label: 'Floor - Main Aisle', timestamp: '2026-03-13T10:10:00', status: 'compliant' },
      { id: 'HYG-WT-002', label: 'Display - WIW Zone', timestamp: '2026-03-13T10:25:00', status: 'compliant' },
      { id: 'HYG-WT-003', label: 'Trial Room 1', timestamp: '2026-03-13T10:40:00', status: 'non-compliant' },
      { id: 'HYG-WT-004', label: 'Stockroom', timestamp: '2026-03-13T10:55:00', status: 'compliant' },
    ],
  },
  {
    storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', // Lulu Mall, Lucknow
    auditDate: '2026-03-12',
    overallScore: 84,
    categories: [
      { category: 'Floor Cleanliness', score: 86, status: 'warning', notes: 'Good but inconsistent during peak hours.' },
      { category: 'Display Compliance', score: 82, status: 'warning', notes: 'Fixture consolidation pending per new planogram.' },
      { category: 'Trial Room', score: 87, status: 'warning', notes: 'Ventilation improvement needed.' },
      { category: 'Signage', score: 84, status: 'warning', notes: 'Price tags need standardization.' },
      { category: 'Stockroom', score: 81, status: 'warning', notes: 'Space utilization needs optimization.' },
    ],
    images: [
      { id: 'HYG-LM-001', label: 'Floor - Peak Hour', timestamp: '2026-03-12T15:30:00', status: 'non-compliant' },
      { id: 'HYG-LM-002', label: 'Display - MC Zone', timestamp: '2026-03-12T15:45:00', status: 'non-compliant' },
      { id: 'HYG-LM-003', label: 'Trial Room Area', timestamp: '2026-03-12T16:00:00', status: 'non-compliant' },
      { id: 'HYG-LM-004', label: 'Stockroom', timestamp: '2026-03-12T16:15:00', status: 'non-compliant' },
    ],
  },
];

// ── Store Communications ──

export const storeCommunications: StoreCommunication[] = [
  // Phoenix Palladium, Mumbai
  { id: 'COMM-001', storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', type: 'planogram-update', title: 'AW26 Planogram Update - WIW Zone', date: '2026-03-15', status: 'acknowledged', sentBy: 'VM Team HQ' },
  { id: 'COMM-002', storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', type: 'promotion-brief', title: 'Weekend Sale Campaign - March 22-24', date: '2026-03-18', status: 'acknowledged', sentBy: 'Marketing Team' },
  { id: 'COMM-003', storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', type: 'compliance-notice', title: 'Hygiene Audit Follow-up - Trial Room 3', date: '2026-03-20', status: 'pending', sentBy: 'Store Operations' },
  { id: 'COMM-004', storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', type: 'vm-directive', title: 'Window Display Refresh - Spring Collection', date: '2026-03-21', status: 'acknowledged', sentBy: 'VM Team HQ' },

  // Select Citywalk, Delhi
  { id: 'COMM-005', storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', type: 'compliance-notice', title: 'URGENT: Hygiene Audit Action Items', date: '2026-03-19', status: 'overdue', sentBy: 'Store Operations' },
  { id: 'COMM-006', storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', type: 'planogram-update', title: 'MF Zone Fixture Realignment Required', date: '2026-03-17', status: 'pending', sentBy: 'VM Team HQ' },
  { id: 'COMM-007', storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', type: 'promotion-brief', title: 'End of Season Clearance - KW Segment', date: '2026-03-20', status: 'acknowledged', sentBy: 'Marketing Team' },
  { id: 'COMM-008', storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', type: 'vm-directive', title: 'Price Tag Standardization - All Zones', date: '2026-03-21', status: 'pending', sentBy: 'VM Team HQ' },

  // UB City Mall, Bangalore
  { id: 'COMM-009', storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', type: 'planogram-update', title: 'Fixture Consolidation - WWW Zone', date: '2026-03-16', status: 'pending', sentBy: 'VM Team HQ' },
  { id: 'COMM-010', storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', type: 'vm-directive', title: 'Brand Hierarchy Signage Update', date: '2026-03-18', status: 'acknowledged', sentBy: 'VM Team HQ' },
  { id: 'COMM-011', storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', type: 'promotion-brief', title: 'Flash Sale - Tech Week Special', date: '2026-03-19', status: 'acknowledged', sentBy: 'Marketing Team' },
  { id: 'COMM-012', storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', type: 'compliance-notice', title: 'Stockroom Clearance Tagging Required', date: '2026-03-20', status: 'pending', sentBy: 'Store Operations' },

  // Express Avenue, Chennai
  { id: 'COMM-013', storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', type: 'vm-directive', title: 'Best Practice Sharing - WIW Display Excellence', date: '2026-03-15', status: 'acknowledged', sentBy: 'VM Team HQ' },
  { id: 'COMM-014', storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', type: 'promotion-brief', title: 'Avaasa Brand Spotlight Week', date: '2026-03-18', status: 'acknowledged', sentBy: 'Marketing Team' },
  { id: 'COMM-015', storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', type: 'planogram-update', title: 'MC Zone Minor Adjustments', date: '2026-03-21', status: 'acknowledged', sentBy: 'VM Team HQ' },

  // Inorbit Mall, Hyderabad
  { id: 'COMM-016', storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', type: 'compliance-notice', title: 'Hygiene Audit Follow-up Actions', date: '2026-03-17', status: 'pending', sentBy: 'Store Operations' },
  { id: 'COMM-017', storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', type: 'vm-directive', title: 'KW Display Height Correction Required', date: '2026-03-18', status: 'pending', sentBy: 'VM Team HQ' },
  { id: 'COMM-018', storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', type: 'promotion-brief', title: 'WIW Ethnic Collection Launch', date: '2026-03-20', status: 'acknowledged', sentBy: 'Marketing Team' },
  { id: 'COMM-019', storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', type: 'planogram-update', title: 'New Arrivals Inventory Tagging Protocol', date: '2026-03-22', status: 'acknowledged', sentBy: 'Store Operations' },

  // Phoenix Marketcity, Pune
  { id: 'COMM-020', storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', type: 'compliance-notice', title: 'URGENT: Hygiene Improvement Plan Required', date: '2026-03-16', status: 'overdue', sentBy: 'Store Operations' },
  { id: 'COMM-021', storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', type: 'planogram-update', title: 'Fixture Consolidation - Underutilized Assets', date: '2026-03-18', status: 'pending', sentBy: 'VM Team HQ' },
  { id: 'COMM-022', storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', type: 'vm-directive', title: 'Trial Room Deep Cleaning Schedule', date: '2026-03-19', status: 'acknowledged', sentBy: 'Store Operations' },
  { id: 'COMM-023', storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', type: 'promotion-brief', title: 'Promotional Signage Replacement - All Zones', date: '2026-03-21', status: 'pending', sentBy: 'Marketing Team' },

  // Quest Mall, Kolkata
  { id: 'COMM-024', storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', type: 'vm-directive', title: 'MC Zone Display Adjustments', date: '2026-03-14', status: 'acknowledged', sentBy: 'VM Team HQ' },
  { id: 'COMM-025', storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', type: 'promotion-brief', title: 'Durga Puja Pre-Season WIW Launch', date: '2026-03-16', status: 'acknowledged', sentBy: 'Marketing Team' },
  { id: 'COMM-026', storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', type: 'compliance-notice', title: 'Stockroom Aisle Marking Refresh', date: '2026-03-18', status: 'pending', sentBy: 'Store Operations' },
  { id: 'COMM-027', storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', type: 'vm-directive', title: 'Entrance Brand Logo Placement Correction', date: '2026-03-20', status: 'pending', sentBy: 'VM Team HQ' },

  // Palladium, Ahmedabad
  { id: 'COMM-028', storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', type: 'planogram-update', title: 'WWW Zone Fixture Spacing Adjustment', date: '2026-03-13', status: 'acknowledged', sentBy: 'VM Team HQ' },
  { id: 'COMM-029', storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', type: 'compliance-notice', title: 'Expired Promotion Tag Removal Required', date: '2026-03-15', status: 'pending', sentBy: 'Store Operations' },
  { id: 'COMM-030', storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', type: 'promotion-brief', title: 'Navratri Collection Pre-Launch', date: '2026-03-19', status: 'acknowledged', sentBy: 'Marketing Team' },
  { id: 'COMM-031', storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', type: 'vm-directive', title: 'Stockroom Inventory Label Update', date: '2026-03-21', status: 'acknowledged', sentBy: 'Store Operations' },

  // World Trade Park, Jaipur
  { id: 'COMM-032', storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', type: 'vm-directive', title: 'WIW Zone Exemplary Display Recognition', date: '2026-03-12', status: 'acknowledged', sentBy: 'VM Team HQ' },
  { id: 'COMM-033', storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', type: 'promotion-brief', title: 'Tourist Season Special Campaign', date: '2026-03-14', status: 'acknowledged', sentBy: 'Marketing Team' },
  { id: 'COMM-034', storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', type: 'compliance-notice', title: 'Trial Room 1 Maintenance', date: '2026-03-16', status: 'acknowledged', sentBy: 'Store Operations' },
  { id: 'COMM-035', storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', type: 'planogram-update', title: 'Seasonal Stock Rotation - All Segments', date: '2026-03-20', status: 'acknowledged', sentBy: 'VM Team HQ' },

  // Lulu Mall, Lucknow
  { id: 'COMM-036', storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', type: 'compliance-notice', title: 'Hygiene Audit Improvement Plan', date: '2026-03-12', status: 'pending', sentBy: 'Store Operations' },
  { id: 'COMM-037', storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', type: 'planogram-update', title: 'Fixture Consolidation - New Planogram', date: '2026-03-15', status: 'pending', sentBy: 'VM Team HQ' },
  { id: 'COMM-038', storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', type: 'vm-directive', title: 'Price Tag Standardization Initiative', date: '2026-03-18', status: 'acknowledged', sentBy: 'VM Team HQ' },
  { id: 'COMM-039', storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', type: 'promotion-brief', title: 'Value Segment Campaign - MC & WIW', date: '2026-03-20', status: 'acknowledged', sentBy: 'Marketing Team' },
  { id: 'COMM-040', storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', type: 'compliance-notice', title: 'Trial Room Ventilation Improvement', date: '2026-03-22', status: 'pending', sentBy: 'Store Operations' },
];

// ── NPS Data ──

export const npsData: NPSData[] = [
  {
    storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', // Phoenix Palladium, Mumbai
    period: 'Q1 2026',
    npsScore: 58,
    responseCount: 342,
    promoters: 218,
    passives: 89,
    detractors: 35,
    trend: [
      { month: '2025-10', score: 52 },
      { month: '2025-11', score: 54 },
      { month: '2025-12', score: 56 },
      { month: '2026-01', score: 57 },
      { month: '2026-02', score: 58 },
      { month: '2026-03', score: 58 },
    ],
  },
  {
    storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', // Select Citywalk, Delhi
    period: 'Q1 2026',
    npsScore: 51,
    responseCount: 298,
    promoters: 182,
    passives: 91,
    detractors: 25,
    trend: [
      { month: '2025-10', score: 49 },
      { month: '2025-11', score: 48 },
      { month: '2025-12', score: 50 },
      { month: '2026-01', score: 51 },
      { month: '2026-02', score: 52 },
      { month: '2026-03', score: 51 },
    ],
  },
  {
    storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', // UB City Mall, Bangalore
    period: 'Q1 2026',
    npsScore: 55,
    responseCount: 285,
    promoters: 189,
    passives: 78,
    detractors: 18,
    trend: [
      { month: '2025-10', score: 53 },
      { month: '2025-11', score: 54 },
      { month: '2025-12', score: 55 },
      { month: '2026-01', score: 56 },
      { month: '2026-02', score: 55 },
      { month: '2026-03', score: 55 },
    ],
  },
  {
    storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', // Express Avenue, Chennai
    period: 'Q1 2026',
    npsScore: 62,
    responseCount: 267,
    promoters: 183,
    passives: 71,
    detractors: 13,
    trend: [
      { month: '2025-10', score: 59 },
      { month: '2025-11', score: 60 },
      { month: '2025-12', score: 61 },
      { month: '2026-01', score: 62 },
      { month: '2026-02', score: 63 },
      { month: '2026-03', score: 62 },
    ],
  },
  {
    storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', // Inorbit Mall, Hyderabad
    period: 'Q1 2026',
    npsScore: 53,
    responseCount: 241,
    promoters: 152,
    passives: 74,
    detractors: 15,
    trend: [
      { month: '2025-10', score: 50 },
      { month: '2025-11', score: 51 },
      { month: '2025-12', score: 52 },
      { month: '2026-01', score: 53 },
      { month: '2026-02', score: 54 },
      { month: '2026-03', score: 53 },
    ],
  },
  {
    storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', // Phoenix Marketcity, Pune
    period: 'Q1 2026',
    npsScore: 47,
    responseCount: 229,
    promoters: 128,
    passives: 82,
    detractors: 19,
    trend: [
      { month: '2025-10', score: 48 },
      { month: '2025-11', score: 46 },
      { month: '2025-12', score: 45 },
      { month: '2026-01', score: 46 },
      { month: '2026-02', score: 47 },
      { month: '2026-03', score: 47 },
    ],
  },
  {
    storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', // Quest Mall, Kolkata
    period: 'Q1 2026',
    npsScore: 56,
    responseCount: 203,
    promoters: 134,
    passives: 59,
    detractors: 10,
    trend: [
      { month: '2025-10', score: 54 },
      { month: '2025-11', score: 55 },
      { month: '2025-12', score: 56 },
      { month: '2026-01', score: 57 },
      { month: '2026-02', score: 56 },
      { month: '2026-03', score: 56 },
    ],
  },
  {
    storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', // Palladium, Ahmedabad
    period: 'Q1 2026',
    npsScore: 54,
    responseCount: 187,
    promoters: 119,
    passives: 59,
    detractors: 9,
    trend: [
      { month: '2025-10', score: 52 },
      { month: '2025-11', score: 53 },
      { month: '2025-12', score: 54 },
      { month: '2026-01', score: 55 },
      { month: '2026-02', score: 54 },
      { month: '2026-03', score: 54 },
    ],
  },
  {
    storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', // World Trade Park, Jaipur
    period: 'Q1 2026',
    npsScore: 59,
    responseCount: 174,
    promoters: 118,
    passives: 49,
    detractors: 7,
    trend: [
      { month: '2025-10', score: 57 },
      { month: '2025-11', score: 58 },
      { month: '2025-12', score: 59 },
      { month: '2026-01', score: 60 },
      { month: '2026-02', score: 59 },
      { month: '2026-03', score: 59 },
    ],
  },
  {
    storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', // Lulu Mall, Lucknow
    period: 'Q1 2026',
    npsScore: 50,
    responseCount: 162,
    promoters: 95,
    passives: 57,
    detractors: 10,
    trend: [
      { month: '2025-10', score: 48 },
      { month: '2025-11', score: 49 },
      { month: '2025-12', score: 49 },
      { month: '2026-01', score: 50 },
      { month: '2026-02', score: 51 },
      { month: '2026-03', score: 50 },
    ],
  },
];

// ── Silent NPS Data ──

export const silentNpsData: SilentNPSData[] = [
  {
    storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', // Phoenix Palladium, Mumbai
    period: 'Q1 2026',
    silentNpsScore: 72,
    factors: [
      { factor: 'Availability', score: 78, weight: 0.25, trend: 'up' },
      { factor: 'Visual Merchandising', score: 74, weight: 0.20, trend: 'stable' },
      { factor: 'Staff Responsiveness', score: 70, weight: 0.20, trend: 'up' },
      { factor: 'Checkout Speed', score: 68, weight: 0.20, trend: 'stable' },
      { factor: 'Store Ambience', score: 76, weight: 0.15, trend: 'up' },
    ],
  },
  {
    storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', // Select Citywalk, Delhi
    period: 'Q1 2026',
    silentNpsScore: 66,
    factors: [
      { factor: 'Availability', score: 71, weight: 0.25, trend: 'stable' },
      { factor: 'Visual Merchandising', score: 64, weight: 0.20, trend: 'down' },
      { factor: 'Staff Responsiveness', score: 68, weight: 0.20, trend: 'up' },
      { factor: 'Checkout Speed', score: 62, weight: 0.20, trend: 'stable' },
      { factor: 'Store Ambience', score: 67, weight: 0.15, trend: 'stable' },
    ],
  },
  {
    storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', // UB City Mall, Bangalore
    period: 'Q1 2026',
    silentNpsScore: 70,
    factors: [
      { factor: 'Availability', score: 73, weight: 0.25, trend: 'stable' },
      { factor: 'Visual Merchandising', score: 69, weight: 0.20, trend: 'down' },
      { factor: 'Staff Responsiveness', score: 72, weight: 0.20, trend: 'up' },
      { factor: 'Checkout Speed', score: 68, weight: 0.20, trend: 'stable' },
      { factor: 'Store Ambience', score: 73, weight: 0.15, trend: 'stable' },
    ],
  },
  {
    storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', // Express Avenue, Chennai
    period: 'Q1 2026',
    silentNpsScore: 78,
    factors: [
      { factor: 'Availability', score: 82, weight: 0.25, trend: 'up' },
      { factor: 'Visual Merchandising', score: 79, weight: 0.20, trend: 'stable' },
      { factor: 'Staff Responsiveness', score: 76, weight: 0.20, trend: 'up' },
      { factor: 'Checkout Speed', score: 75, weight: 0.20, trend: 'stable' },
      { factor: 'Store Ambience', score: 80, weight: 0.15, trend: 'up' },
    ],
  },
  {
    storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', // Inorbit Mall, Hyderabad
    period: 'Q1 2026',
    silentNpsScore: 68,
    factors: [
      { factor: 'Availability', score: 72, weight: 0.25, trend: 'stable' },
      { factor: 'Visual Merchandising', score: 66, weight: 0.20, trend: 'down' },
      { factor: 'Staff Responsiveness', score: 70, weight: 0.20, trend: 'up' },
      { factor: 'Checkout Speed', score: 65, weight: 0.20, trend: 'stable' },
      { factor: 'Store Ambience', score: 69, weight: 0.15, trend: 'stable' },
    ],
  },
  {
    storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', // Phoenix Marketcity, Pune
    period: 'Q1 2026',
    silentNpsScore: 62,
    factors: [
      { factor: 'Availability', score: 65, weight: 0.25, trend: 'down' },
      { factor: 'Visual Merchandising', score: 58, weight: 0.20, trend: 'down' },
      { factor: 'Staff Responsiveness', score: 64, weight: 0.20, trend: 'stable' },
      { factor: 'Checkout Speed', score: 60, weight: 0.20, trend: 'down' },
      { factor: 'Store Ambience', score: 66, weight: 0.15, trend: 'stable' },
    ],
  },
  {
    storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', // Quest Mall, Kolkata
    period: 'Q1 2026',
    silentNpsScore: 71,
    factors: [
      { factor: 'Availability', score: 74, weight: 0.25, trend: 'stable' },
      { factor: 'Visual Merchandising', score: 72, weight: 0.20, trend: 'stable' },
      { factor: 'Staff Responsiveness', score: 70, weight: 0.20, trend: 'up' },
      { factor: 'Checkout Speed', score: 68, weight: 0.20, trend: 'stable' },
      { factor: 'Store Ambience', score: 74, weight: 0.15, trend: 'up' },
    ],
  },
  {
    storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', // Palladium, Ahmedabad
    period: 'Q1 2026',
    silentNpsScore: 69,
    factors: [
      { factor: 'Availability', score: 72, weight: 0.25, trend: 'stable' },
      { factor: 'Visual Merchandising', score: 68, weight: 0.20, trend: 'down' },
      { factor: 'Staff Responsiveness', score: 70, weight: 0.20, trend: 'up' },
      { factor: 'Checkout Speed', score: 67, weight: 0.20, trend: 'stable' },
      { factor: 'Store Ambience', score: 71, weight: 0.15, trend: 'stable' },
    ],
  },
  {
    storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', // World Trade Park, Jaipur
    period: 'Q1 2026',
    silentNpsScore: 74,
    factors: [
      { factor: 'Availability', score: 77, weight: 0.25, trend: 'up' },
      { factor: 'Visual Merchandising', score: 75, weight: 0.20, trend: 'stable' },
      { factor: 'Staff Responsiveness', score: 73, weight: 0.20, trend: 'up' },
      { factor: 'Checkout Speed', score: 71, weight: 0.20, trend: 'stable' },
      { factor: 'Store Ambience', score: 76, weight: 0.15, trend: 'up' },
    ],
  },
  {
    storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', // Lulu Mall, Lucknow
    period: 'Q1 2026',
    silentNpsScore: 65,
    factors: [
      { factor: 'Availability', score: 68, weight: 0.25, trend: 'stable' },
      { factor: 'Visual Merchandising', score: 62, weight: 0.20, trend: 'down' },
      { factor: 'Staff Responsiveness', score: 66, weight: 0.20, trend: 'stable' },
      { factor: 'Checkout Speed', score: 64, weight: 0.20, trend: 'down' },
      { factor: 'Store Ambience', score: 67, weight: 0.15, trend: 'stable' },
    ],
  },
];

// ── Helper Function ──

export function getStore360Data(storeId: string): {
  cctv: CCTVAnalysis;
  hygiene: StoreHygieneReport;
  communications: StoreCommunication[];
  nps: NPSData;
  silentNps: SilentNPSData;
} {
  return {
    cctv: cctvAnalyses.find(c => c.storeId === storeId) ?? cctvAnalyses[0]!,
    hygiene: hygieneReports.find(h => h.storeId === storeId) ?? hygieneReports[0]!,
    communications: storeCommunications.filter(c => c.storeId === storeId),
    nps: npsData.find(n => n.storeId === storeId) ?? npsData[0]!,
    silentNps: silentNpsData.find(s => s.storeId === storeId) ?? silentNpsData[0]!,
  };
}
