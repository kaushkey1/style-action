import type { Channel, ChannelId, PlanMonth } from '../types/aopPlanning.types';

export const CHANNELS: Channel[] = [
  { id: 'EBO', label: 'EBO', hasOTB: true, color: '#3B82F6' },
  { id: 'Distribution', label: 'Distribution', hasOTB: true, color: '#EF4444' },
  { id: 'Superdry.in', label: 'Superdry.in', hasOTB: false, color: '#8B5CF6' },
  { id: 'SIS', label: 'SIS', hasOTB: true, color: '#10B981' },
  { id: 'MBO', label: 'MBO', hasOTB: true, color: '#F59E0B' },
  { id: 'Others', label: 'Others', hasOTB: true, color: '#6B7280' },
  { id: 'Omni', label: 'Omni', hasOTB: true, color: '#14B8A6' },
];

export const PLAN_MONTHS: PlanMonth[] = [
  { id: 'apr', label: 'Apr 2026', shortLabel: 'Apr', season: 'H1', index: 0 },
  { id: 'may', label: 'May 2026', shortLabel: 'May', season: 'H1', index: 1 },
  { id: 'jun', label: 'Jun 2026', shortLabel: 'Jun', season: 'H1', index: 2 },
  { id: 'jul', label: 'Jul 2026', shortLabel: 'Jul', season: 'H1', index: 3 },
  { id: 'aug', label: 'Aug 2026', shortLabel: 'Aug', season: 'H1', index: 4 },
  { id: 'sep', label: 'Sep 2026', shortLabel: 'Sep', season: 'H1', index: 5 },
  { id: 'oct', label: 'Oct 2026', shortLabel: 'Oct', season: 'H2', index: 6 },
  { id: 'nov', label: 'Nov 2026', shortLabel: 'Nov', season: 'H2', index: 7 },
  { id: 'dec', label: 'Dec 2026', shortLabel: 'Dec', season: 'H2', index: 8 },
  { id: 'jan', label: 'Jan 2027', shortLabel: 'Jan', season: 'H2', index: 9 },
  { id: 'feb', label: 'Feb 2027', shortLabel: 'Feb', season: 'H2', index: 10 },
  { id: 'mar', label: 'Mar 2027', shortLabel: 'Mar', season: 'H2', index: 11 },
];

export const PRODUCT_CATEGORIES = [
  'Shirt', 'T-shirt', 'Polo', 'Denim', 'Jacket',
  'Sweatshirt', 'Knitwear', 'Accessories',
] as const;

export const CHANNEL_CATEGORIES: Record<ChannelId, string[]> = {
  EBO: ['Shirt', 'T-shirt', 'Polo', 'Denim', 'Jacket', 'Sweatshirt', 'Knitwear', 'Accessories'],
  Distribution: ['Shirt', 'T-shirt', 'Polo', 'Denim', 'Jacket'],
  'Superdry.in': ['Shirt', 'T-shirt', 'Polo', 'Denim', 'Jacket', 'Sweatshirt', 'Knitwear', 'Accessories'],
  SIS: ['Shirt', 'T-shirt', 'Polo', 'Denim', 'Jacket', 'Sweatshirt', 'Knitwear', 'Accessories'],
  MBO: ['Shirt', 'T-shirt', 'Polo', 'Denim', 'Jacket', 'Accessories'],
  Others: ['Shirt', 'T-shirt', 'Polo', 'Denim', 'Jacket', 'Accessories'],
  Omni: ['Shirt', 'T-shirt', 'Polo', 'Denim', 'Jacket', 'Sweatshirt', 'Knitwear', 'Accessories'],
};

export const CATEGORIES = CHANNEL_CATEGORIES;

export const DEFAULT_CATEGORY_ALLOCATION: Record<string, number> = {
  'Shirt': 18,
  'T-shirt': 20,
  'Polo': 10,
  'Denim': 15,
  'Jacket': 12,
  'Sweatshirt': 8,
  'Knitwear': 7,
  'Accessories': 10,
};
