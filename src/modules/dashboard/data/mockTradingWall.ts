export interface CategoryPerformance {
  id: string;
  category: string;
  cluster: string;
  sellThrough_pct: number;
  wos: number;
  wos_band: 'under' | 'within' | 'over';
  fullPrice_pct: number;
  markdown_pct: number;
  reorder_signal: boolean;
  markdown_trigger: boolean;
  revenue_cr: number;
  target_cr: number;
  fashionMix_pct: number;
  coreMix_pct: number;
  spsf: number;
  gmrof: number;
  spaceEfficiency: number;
}

export interface SellThroughCurve {
  week: number;
  target: number;
  actual: number;
}

export const mockCategoryPerformance: CategoryPerformance[] = [
  { id: 'a1b2c3d4-3001-4a5b-8c6d-7e8f9a0b1c2d', category: 'Menswear Casual', cluster: 'Metro A', sellThrough_pct: 72, wos: 6.2, wos_band: 'within', fullPrice_pct: 68, markdown_pct: 32, reorder_signal: true, markdown_trigger: false, revenue_cr: 45, target_cr: 50, fashionMix_pct: 25, coreMix_pct: 75, spsf: 892, gmrof: 412, spaceEfficiency: 112 },
  { id: 'a1b2c3d4-3002-4a5b-8c6d-7e8f9a0b1c2d', category: 'Menswear Casual', cluster: 'Tier 1', sellThrough_pct: 58, wos: 8.5, wos_band: 'over', fullPrice_pct: 55, markdown_pct: 45, reorder_signal: false, markdown_trigger: true, revenue_cr: 32, target_cr: 38, fashionMix_pct: 35, coreMix_pct: 65, spsf: 624, gmrof: 278, spaceEfficiency: 84 },
  { id: 'a1b2c3d4-3003-4a5b-8c6d-7e8f9a0b1c2d', category: 'Womenswear Western', cluster: 'Metro A', sellThrough_pct: 78, wos: 5.1, wos_band: 'within', fullPrice_pct: 72, markdown_pct: 28, reorder_signal: true, markdown_trigger: false, revenue_cr: 38, target_cr: 42, fashionMix_pct: 40, coreMix_pct: 60, spsf: 945, gmrof: 425, spaceEfficiency: 118 },
  { id: 'a1b2c3d4-3004-4a5b-8c6d-7e8f9a0b1c2d', category: 'Womenswear Western', cluster: 'Tier 1', sellThrough_pct: 62, wos: 7.8, wos_band: 'over', fullPrice_pct: 58, markdown_pct: 42, reorder_signal: false, markdown_trigger: true, revenue_cr: 25, target_cr: 30, fashionMix_pct: 45, coreMix_pct: 55, spsf: 580, gmrof: 245, spaceEfficiency: 78 },
  { id: 'a1b2c3d4-3005-4a5b-8c6d-7e8f9a0b1c2d', category: 'Womenswear Ethnic', cluster: 'Metro A', sellThrough_pct: 82, wos: 4.5, wos_band: 'within', fullPrice_pct: 78, markdown_pct: 22, reorder_signal: true, markdown_trigger: false, revenue_cr: 52, target_cr: 55, fashionMix_pct: 20, coreMix_pct: 80, spsf: 1020, gmrof: 485, spaceEfficiency: 125 },
  { id: 'a1b2c3d4-3006-4a5b-8c6d-7e8f9a0b1c2d', category: 'Womenswear Ethnic', cluster: 'Tier 2', sellThrough_pct: 45, wos: 10.2, wos_band: 'over', fullPrice_pct: 42, markdown_pct: 58, reorder_signal: false, markdown_trigger: true, revenue_cr: 18, target_cr: 28, fashionMix_pct: 30, coreMix_pct: 70, spsf: 420, gmrof: 185, spaceEfficiency: 68 },
  { id: 'a1b2c3d4-3007-4a5b-8c6d-7e8f9a0b1c2d', category: 'Footwear', cluster: 'Metro A', sellThrough_pct: 85, wos: 3.8, wos_band: 'under', fullPrice_pct: 82, markdown_pct: 18, reorder_signal: true, markdown_trigger: false, revenue_cr: 42, target_cr: 40, fashionMix_pct: 15, coreMix_pct: 85, spsf: 1150, gmrof: 520, spaceEfficiency: 135 },
  { id: 'a1b2c3d4-3008-4a5b-8c6d-7e8f9a0b1c2d', category: 'Footwear', cluster: 'Tier 1', sellThrough_pct: 68, wos: 6.5, wos_band: 'within', fullPrice_pct: 65, markdown_pct: 35, reorder_signal: false, markdown_trigger: false, revenue_cr: 28, target_cr: 32, fashionMix_pct: 20, coreMix_pct: 80, spsf: 710, gmrof: 310, spaceEfficiency: 95 },
  { id: 'a1b2c3d4-3009-4a5b-8c6d-7e8f9a0b1c2d', category: 'Kidswear', cluster: 'Metro A', sellThrough_pct: 55, wos: 9.0, wos_band: 'over', fullPrice_pct: 50, markdown_pct: 50, reorder_signal: false, markdown_trigger: true, revenue_cr: 15, target_cr: 22, fashionMix_pct: 35, coreMix_pct: 65, spsf: 385, gmrof: 165, spaceEfficiency: 62 },
  { id: 'a1b2c3d4-300a-4a5b-8c6d-7e8f9a0b1c2d', category: 'Sportswear', cluster: 'Metro A', sellThrough_pct: 76, wos: 5.5, wos_band: 'within', fullPrice_pct: 72, markdown_pct: 28, reorder_signal: true, markdown_trigger: false, revenue_cr: 30, target_cr: 32, fashionMix_pct: 25, coreMix_pct: 75, spsf: 820, gmrof: 378, spaceEfficiency: 108 },
];

export const sellThroughCurve: SellThroughCurve[] = [
  { week: 1, target: 20, actual: 18 },
  { week: 2, target: 35, actual: 30 },
  { week: 3, target: 50, actual: 42 },
  { week: 4, target: 62, actual: 55 },
  { week: 5, target: 72, actual: 64 },
  { week: 6, target: 80, actual: 68 },
  { week: 7, target: 85, actual: 72 },
  { week: 8, target: 88, actual: 75 },
];
