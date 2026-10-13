export interface ProductInsight {
  id: string;
  headline: string;
  status: 'critical' | 'warning' | 'on-track' | null;
  metric: string | null;
}

export interface ProductInsightsData {
  question: string;
  summary: string;
  insights: ProductInsight[];
}

export const STORE_PRODUCT_INSIGHTS: ProductInsightsData = {
  question: 'Which product lines need attention in this store?',
  summary: '12 options are off-target on sell-through. 2 products aged beyond 90 days need markdown or transfer action. Menswear Casual tops are outperforming — consider chase replenishment.',
  insights: [
    { id: 'spi-1', headline: '3 Core grade options in Menswear Casual have ST above 85% at D30 — chase candidates for replenishment before stockout', status: 'on-track', metric: 'Avg ST: 89% vs 58% target' },
    { id: 'spi-2', headline: 'Zip-Up Hoodie (MC-HD-013) has zero ROS in trailing 14-day window — stagnant at 110 days, recommend markdown or transfer to Fashion Factory', status: 'critical', metric: 'ROS: 0 · Stock: 47 units' },
    { id: 'spi-3', headline: 'Womenswear Ethnic kurtas showing strong demand but M and L sizes broken across 2 options — size rebalance opportunity', status: 'warning', metric: 'Fill rate: 67% (2 sizes OOS)' },
  ],
};

export const PRODUCT_DETAIL_INSIGHTS: ProductInsightsData = {
  question: 'What does this product\'s performance trajectory suggest?',
  summary: 'Velocity tracking against grade target curve. Current sell-through and stock position analyzed against similar options in the same category and grade.',
  insights: [
    { id: 'pdi-1', headline: 'Sell-through is tracking 8% below grade target at current age — if the trend continues, this option will miss D60 milestone', status: 'warning', metric: null },
    { id: 'pdi-2', headline: 'Size M accounts for 40% of demand in this category but has the lowest stock depth — rebalance from XS/XXL', status: 'warning', metric: null },
    { id: 'pdi-3', headline: 'Similar options in this grade that received markdown at this age saw 2.3x ROS improvement within 7 days', status: 'on-track', metric: null },
  ],
};
