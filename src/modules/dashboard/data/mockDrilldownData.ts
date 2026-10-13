export interface DrilldownItem {
  id: string;
  name: string;
  value: number;
  valueFormatted: string;
  percentage: number;
  status: 'critical' | 'warning' | 'on_track';
}

export const drilldownByFormat: DrilldownItem[] = [
  { id: 'f1', name: 'Fashion Factory', value: 82, valueFormatted: '₹82 Cr', percentage: 22, status: 'critical' },
  { id: 'f2', name: 'Trends Woman', value: 48, valueFormatted: '₹48 Cr', percentage: 19, status: 'warning' },
  { id: 'f3', name: 'Project Eve', value: 32, valueFormatted: '₹32 Cr', percentage: 18, status: 'warning' },
  { id: 'f4', name: 'Centro', value: 28, valueFormatted: '₹28 Cr', percentage: 15, status: 'warning' },
  { id: 'f5', name: 'Trends', value: 42, valueFormatted: '₹42 Cr', percentage: 11, status: 'on_track' },
  { id: 'f6', name: 'Azorte', value: 18, valueFormatted: '₹18 Cr', percentage: 9, status: 'on_track' },
];

export const drilldownByCategory: DrilldownItem[] = [
  { id: 'c1', name: 'Women Indian', value: 96, valueFormatted: '₹96 Cr', percentage: 27, status: 'critical' },
  { id: 'c2', name: 'External Brands', value: 54, valueFormatted: '₹54 Cr', percentage: 21, status: 'critical' },
  { id: 'c3', name: 'Menswear', value: 62, valueFormatted: '₹62 Cr', percentage: 17, status: 'warning' },
  { id: 'c4', name: 'Women Western', value: 38, valueFormatted: '₹38 Cr', percentage: 17, status: 'warning' },
  { id: 'c5', name: 'Non-Apparel', value: 34, valueFormatted: '₹34 Cr', percentage: 17, status: 'warning' },
  { id: 'c6', name: 'Kids', value: 22, valueFormatted: '₹22 Cr', percentage: 12, status: 'on_track' },
];

export interface DrilldownStore {
  id: string;
  code: string;
  name: string;
  format: string;
  value: number;
  valueFormatted: string;
  percentage: number;
}

export const drilldownByStore: DrilldownStore[] = [
  { id: 's1', code: 'T-MUM-042', name: 'Trends Phoenix Marketcity', format: 'Trends', value: 4.2, valueFormatted: '₹4.2 Cr', percentage: 28 },
  { id: 's2', code: 'T-DEL-018', name: 'Trends Select Citywalk', format: 'Trends', value: 3.8, valueFormatted: '₹3.8 Cr', percentage: 25 },
  { id: 's3', code: 'FF-BLR-003', name: 'Fashion Factory Whitefield', format: 'Fashion Factory', value: 3.1, valueFormatted: '₹3.1 Cr', percentage: 32 },
  { id: 's4', code: 'C-HYD-012', name: 'Centro Forum Mall', format: 'Centro', value: 2.6, valueFormatted: '₹2.6 Cr', percentage: 22 },
  { id: 's5', code: 'TW-PUN-007', name: 'Trends Woman Koregaon Park', format: 'Trends Woman', value: 2.1, valueFormatted: '₹2.1 Cr', percentage: 24 },
];

export interface DrilldownOption {
  id: string;
  code: string;
  description: string;
  ageDays: number;
  units: number;
  value: number;
  valueFormatted: string;
}

export const drilldownByOption: DrilldownOption[] = [
  { id: 'o1', code: 'OPT-28491', description: 'Men Polo Striped - Navy', ageDays: 245, units: 3200, value: 0.42, valueFormatted: '₹0.42 Cr' },
  { id: 'o2', code: 'OPT-31024', description: 'Women Kurti Printed - Coral', ageDays: 220, units: 2800, value: 0.38, valueFormatted: '₹0.38 Cr' },
  { id: 'o3', code: 'OPT-29877', description: 'Kids Tshirt Graphic - White', ageDays: 210, units: 4100, value: 0.35, valueFormatted: '₹0.35 Cr' },
  { id: 'o4', code: 'OPT-30156', description: 'Men Chino Slim - Khaki', ageDays: 198, units: 1900, value: 0.28, valueFormatted: '₹0.28 Cr' },
  { id: 'o5', code: 'OPT-27893', description: 'Women Dress Maxi - Floral', ageDays: 192, units: 1500, value: 0.25, valueFormatted: '₹0.25 Cr' },
];
