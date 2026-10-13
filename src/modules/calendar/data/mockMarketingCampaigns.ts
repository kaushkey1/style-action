// ─── Marketing Campaign, Audience, Content, Promo mock data ────────

export interface Campaign {
  id: string;
  name: string;
  type: 'brand' | 'performance' | 'seasonal' | 'launch';
  status: 'active' | 'planned' | 'completed' | 'paused';
  startDate: string;
  endDate: string;
  budgetLakh: number;
  spendLakh: number;
  roas: number;
  impressions: number;
  conversions: number;
  channel: string;
}

export interface AudienceSegment {
  id: string;
  name: string;
  size: number;
  avgSpend: number;
  engagementRate: number;
  growthPct: number;
  segment: 'premium' | 'value' | 'aspirational' | 'loyalist' | 'lapsed';
}

export interface ContentItem {
  id: string;
  title: string;
  type: 'editorial' | 'social' | 'video' | 'influencer' | 'email';
  status: 'published' | 'scheduled' | 'draft' | 'in-review';
  scheduledDate: string;
  platform: string;
  engagement: number;
  creator: string;
}

export interface PromoItem {
  id: string;
  name: string;
  type: 'discount' | 'bogo' | 'bundle' | 'loyalty' | 'flash';
  status: 'active' | 'scheduled' | 'expired' | 'paused';
  startDate: string;
  endDate: string;
  discountPct: number;
  redemptions: number;
  guardrailStatus: 'compliant' | 'warning' | 'breach';
  pg1Action: string;
}

// ─── Mock Campaigns ───────────────────────────────────────────────

export const mockCampaigns: Campaign[] = [
  {
    id: 'a1b2c3d4-5001-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'SS26 Menswear Launch',
    type: 'launch',
    status: 'active',
    startDate: '2026-02-15',
    endDate: '2026-03-15',
    budgetLakh: 45,
    spendLakh: 28,
    roas: 4.2,
    impressions: 2_800_000,
    conversions: 12_400,
    channel: 'Meta + Google',
  },
  {
    id: 'a1b2c3d4-5002-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Holi Festive Collection',
    type: 'seasonal',
    status: 'active',
    startDate: '2026-02-28',
    endDate: '2026-03-14',
    budgetLakh: 30,
    spendLakh: 18,
    roas: 3.8,
    impressions: 1_950_000,
    conversions: 8_200,
    channel: 'Instagram + YouTube',
  },
  {
    id: 'a1b2c3d4-5003-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Women Western Brand Awareness',
    type: 'brand',
    status: 'active',
    startDate: '2026-01-15',
    endDate: '2026-03-31',
    budgetLakh: 60,
    spendLakh: 42,
    roas: 2.9,
    impressions: 5_400_000,
    conversions: 15_800,
    channel: 'Multi-channel',
  },
  {
    id: 'a1b2c3d4-5004-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Kids Summer Preview',
    type: 'performance',
    status: 'planned',
    startDate: '2026-03-10',
    endDate: '2026-04-10',
    budgetLakh: 20,
    spendLakh: 0,
    roas: 0,
    impressions: 0,
    conversions: 0,
    channel: 'Google + Ajio',
  },
  {
    id: 'a1b2c3d4-5005-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Ethnic Wear Heritage',
    type: 'brand',
    status: 'completed',
    startDate: '2026-01-01',
    endDate: '2026-02-14',
    budgetLakh: 35,
    spendLakh: 34,
    roas: 3.5,
    impressions: 3_100_000,
    conversions: 10_200,
    channel: 'TV + Digital',
  },
  {
    id: 'a1b2c3d4-5006-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Flash Friday Performance',
    type: 'performance',
    status: 'active',
    startDate: '2026-02-20',
    endDate: '2026-03-20',
    budgetLakh: 15,
    spendLakh: 9,
    roas: 5.1,
    impressions: 980_000,
    conversions: 5_600,
    channel: 'Google Ads',
  },
];

// ─── Mock Audience Segments ──────────────────────────────────────

export const mockAudienceSegments: AudienceSegment[] = [
  { id: 'a1b2c3d4-5101-4a5b-8c6d-7e8f9a0b1c2d', name: 'Premium Loyalists', size: 185_000, avgSpend: 8_500, engagementRate: 42, growthPct: 8.2, segment: 'premium' },
  { id: 'a1b2c3d4-5102-4a5b-8c6d-7e8f9a0b1c2d', name: 'Aspirational Millennials', size: 420_000, avgSpend: 3_200, engagementRate: 35, growthPct: 15.4, segment: 'aspirational' },
  { id: 'a1b2c3d4-5103-4a5b-8c6d-7e8f9a0b1c2d', name: 'Value Seekers', size: 680_000, avgSpend: 1_800, engagementRate: 22, growthPct: 5.1, segment: 'value' },
  { id: 'a1b2c3d4-5104-4a5b-8c6d-7e8f9a0b1c2d', name: 'Brand Loyalists', size: 310_000, avgSpend: 5_400, engagementRate: 48, growthPct: 3.7, segment: 'loyalist' },
  { id: 'a1b2c3d4-5105-4a5b-8c6d-7e8f9a0b1c2d', name: 'Lapsed Customers', size: 245_000, avgSpend: 2_100, engagementRate: 8, growthPct: -12.3, segment: 'lapsed' },
  { id: 'a1b2c3d4-5106-4a5b-8c6d-7e8f9a0b1c2d', name: 'Gen-Z Trendsetters', size: 195_000, avgSpend: 2_800, engagementRate: 55, growthPct: 22.1, segment: 'aspirational' },
];

// ─── Mock Content Items ──────────────────────────────────────────

export const mockContentItems: ContentItem[] = [
  { id: 'a1b2c3d4-5201-4a5b-8c6d-7e8f9a0b1c2d', title: 'SS26 Lookbook — Men Formal', type: 'editorial', status: 'published', scheduledDate: '2026-02-20', platform: 'Website + App', engagement: 45_200, creator: 'In-house' },
  { id: 'a1b2c3d4-5202-4a5b-8c6d-7e8f9a0b1c2d', title: 'Holi Style Guide Reels', type: 'video', status: 'published', scheduledDate: '2026-02-28', platform: 'Instagram', engagement: 128_000, creator: 'Studio Team' },
  { id: 'a1b2c3d4-5203-4a5b-8c6d-7e8f9a0b1c2d', title: 'Celebrity Collab — Alia Collection', type: 'influencer', status: 'scheduled', scheduledDate: '2026-03-08', platform: 'YouTube + Insta', engagement: 0, creator: 'Alia Bhatt' },
  { id: 'a1b2c3d4-5204-4a5b-8c6d-7e8f9a0b1c2d', title: 'Sustainable Fashion Story', type: 'editorial', status: 'in-review', scheduledDate: '2026-03-12', platform: 'Blog + LinkedIn', engagement: 0, creator: 'Content Team' },
  { id: 'a1b2c3d4-5205-4a5b-8c6d-7e8f9a0b1c2d', title: 'Kids Summer Collection Teaser', type: 'social', status: 'draft', scheduledDate: '2026-03-15', platform: 'All Social', engagement: 0, creator: 'Agency' },
  { id: 'a1b2c3d4-5206-4a5b-8c6d-7e8f9a0b1c2d', title: 'Weekly Style Tips Newsletter', type: 'email', status: 'published', scheduledDate: '2026-03-01', platform: 'Email', engagement: 34_500, creator: 'CRM Team' },
  { id: 'a1b2c3d4-5207-4a5b-8c6d-7e8f9a0b1c2d', title: 'Micro-influencer Ethnic Wear Campaign', type: 'influencer', status: 'scheduled', scheduledDate: '2026-03-10', platform: 'Instagram', engagement: 0, creator: '12 Micro-influencers' },
];

// ─── Mock Promos ─────────────────────────────────────────────────

export const mockPromos: PromoItem[] = [
  { id: 'a1b2c3d4-5301-4a5b-8c6d-7e8f9a0b1c2d', name: 'Holi Festive 20% Off', type: 'discount', status: 'active', startDate: '2026-02-28', endDate: '2026-03-14', discountPct: 20, redemptions: 8_450, guardrailStatus: 'compliant', pg1Action: 'Auto-approved by PG1' },
  { id: 'a1b2c3d4-5302-4a5b-8c6d-7e8f9a0b1c2d', name: 'Buy 2 Get 1 — Men Casual', type: 'bogo', status: 'active', startDate: '2026-03-01', endDate: '2026-03-10', discountPct: 33, redemptions: 3_200, guardrailStatus: 'warning', pg1Action: 'Margin impact flagged — under review' },
  { id: 'a1b2c3d4-5303-4a5b-8c6d-7e8f9a0b1c2d', name: 'Loyalty 2X Points Week', type: 'loyalty', status: 'scheduled', startDate: '2026-03-10', endDate: '2026-03-17', discountPct: 0, redemptions: 0, guardrailStatus: 'compliant', pg1Action: 'Pre-approved' },
  { id: 'a1b2c3d4-5304-4a5b-8c6d-7e8f9a0b1c2d', name: 'Flash Friday — 40% Off Select', type: 'flash', status: 'active', startDate: '2026-02-28', endDate: '2026-03-01', discountPct: 40, redemptions: 12_100, guardrailStatus: 'breach', pg1Action: 'Exceeded discount cap — escalated to S2' },
  { id: 'a1b2c3d4-5305-4a5b-8c6d-7e8f9a0b1c2d', name: 'Ethnic Bundle — Kurta + Dupatta', type: 'bundle', status: 'active', startDate: '2026-02-25', endDate: '2026-03-15', discountPct: 15, redemptions: 2_800, guardrailStatus: 'compliant', pg1Action: 'Auto-approved by PG1' },
  { id: 'a1b2c3d4-5306-4a5b-8c6d-7e8f9a0b1c2d', name: 'Kids Summer Early Access', type: 'discount', status: 'scheduled', startDate: '2026-03-12', endDate: '2026-03-20', discountPct: 15, redemptions: 0, guardrailStatus: 'compliant', pg1Action: 'Pre-approved' },
];

// ─── Summary KPIs ────────────────────────────────────────────────

export const marketingSummary = {
  activeCampaigns: mockCampaigns.filter(c => c.status === 'active').length,
  avgROAS: +(mockCampaigns.filter(c => c.roas > 0).reduce((s, c) => s + c.roas, 0) / mockCampaigns.filter(c => c.roas > 0).length).toFixed(1),
  totalRevenueLakh: 284,
  conversionRate: 3.2,
  totalAudienceSize: mockAudienceSegments.reduce((s, a) => s + a.size, 0),
  repeatPurchaseRate: 34.5,
  crmActiveMembers: 1_240_000,
  loyaltyTier1Pct: 18,
  contentItemsPerMonth: 24,
  socialEngagement: 892_000,
  influencerCollabs: 14,
  contentROI: 3.8,
  activePromos: mockPromos.filter(p => p.status === 'active').length,
  guardrailBreaches: mockPromos.filter(p => p.guardrailStatus === 'breach').length,
};
