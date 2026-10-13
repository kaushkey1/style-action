// Marketing Calendar — mock data for marketing events linked to drops and standalone campaigns

export interface MarketingCalendarEvent {
  id: string;
  type: 'product_story' | 'social_prebuzz' | 'influencer' | 'performance_marketing' | 'campaign' | 'promo';
  name: string;
  nDayRelative?: string;
  startDate: string;
  endDate: string;
  dropId?: string;
  agentId: string;
  autonomy: 'T1' | 'T2' | 'T3' | 'T4';
  status: 'planned' | 'active' | 'completed';
  channel?: string;
}

export const mockMarketingCalendarEvents: MarketingCalendarEvent[] = [
  // ─── SS26 MC04 (N-Day Apr 15) ────────────────────────────────────
  {
    id: 'a1b2c3d4-m001-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'product_story',
    name: "MC04 Product Story — Men's Casuals Summer Edit",
    nDayRelative: 'N-21 to N-14',
    startDate: '2026-03-25',
    endDate: '2026-04-01',
    dropId: 'd6f7a8b9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    agentId: 'e0b1c2d3-4f5a-4b6c-7d8e-9f0a1b2c3d4e',
    autonomy: 'T1',
    status: 'planned',
    channel: 'Content Studio',
  },
  {
    id: 'a1b2c3d4-m002-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'social_prebuzz',
    name: 'MC04 Social Pre-buzz — Teaser Reels & Stories',
    nDayRelative: 'N-7 to N-3',
    startDate: '2026-04-08',
    endDate: '2026-04-12',
    dropId: 'd6f7a8b9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    agentId: 'f9c0d1e2-3a4b-4c5d-6e7f-8a9b0c1d2e3f',
    autonomy: 'T2',
    status: 'planned',
    channel: 'Instagram, YouTube',
  },
  {
    id: 'a1b2c3d4-m003-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'influencer',
    name: 'MC04 Influencer Seeding — Summer Casuals',
    nDayRelative: 'N-3 to N-Day',
    startDate: '2026-04-12',
    endDate: '2026-04-15',
    dropId: 'd6f7a8b9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    agentId: 'f9c0d1e2-3a4b-4c5d-6e7f-8a9b0c1d2e3f',
    autonomy: 'T3',
    status: 'planned',
    channel: 'Instagram, YouTube',
  },
  {
    id: 'a1b2c3d4-m004-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'performance_marketing',
    name: 'MC04 Performance Marketing — Paid Launch',
    nDayRelative: 'N-Day to N+7',
    startDate: '2026-04-15',
    endDate: '2026-04-22',
    dropId: 'd6f7a8b9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    agentId: 'f9c0d1e2-3a4b-4c5d-6e7f-8a9b0c1d2e3f',
    autonomy: 'T2',
    status: 'planned',
    channel: 'Meta Ads, Google',
  },

  // ─── SS26 WIW02 (N-Day May 1) ────────────────────────────────────
  {
    id: 'a1b2c3d4-m005-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'product_story',
    name: "WIW02 Product Story — Indian Wear Summer Festive",
    nDayRelative: 'N-21 to N-14',
    startDate: '2026-04-10',
    endDate: '2026-04-17',
    dropId: 'd8b9c0d1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
    agentId: 'e0b1c2d3-4f5a-4b6c-7d8e-9f0a1b2c3d4e',
    autonomy: 'T1',
    status: 'planned',
    channel: 'Content Studio',
  },
  {
    id: 'a1b2c3d4-m006-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'social_prebuzz',
    name: "WIW02 Social Pre-buzz — Festive Teasers",
    nDayRelative: 'N-7 to N-3',
    startDate: '2026-04-24',
    endDate: '2026-04-28',
    dropId: 'd8b9c0d1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
    agentId: 'f9c0d1e2-3a4b-4c5d-6e7f-8a9b0c1d2e3f',
    autonomy: 'T2',
    status: 'planned',
    channel: 'Instagram, Pinterest',
  },

  // ─── SS26 MD12 (N-Day Mar 5) — Active ────────────────────────────
  {
    id: 'a1b2c3d4-m007-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'performance_marketing',
    name: 'MD12 Performance Marketing — Micro-Drop Push',
    nDayRelative: 'N-Day to N+7',
    startDate: '2026-03-05',
    endDate: '2026-03-12',
    dropId: 'db1e2f3a-c5d6-4e7f-8a9b-0c1d2e3f4a5b',
    agentId: 'f9c0d1e2-3a4b-4c5d-6e7f-8a9b0c1d2e3f',
    autonomy: 'T1',
    status: 'active',
    channel: 'Meta Ads, Google',
  },

  // ─── Standalone Campaigns ────────────────────────────────────────
  {
    id: 'a1b2c3d4-m008-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'campaign',
    name: 'End of Season Sale (EOSS)',
    startDate: '2026-02-28',
    endDate: '2026-03-31',
    agentId: 'c6f7a8b9-0d1e-4f2a-3b4c-5d6e7f8a9b0c',
    autonomy: 'T2',
    status: 'active',
    channel: 'Omni-channel',
  },
  {
    id: 'a1b2c3d4-m009-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'campaign',
    name: 'Holi Festival Campaign',
    startDate: '2026-03-10',
    endDate: '2026-03-16',
    agentId: 'f9c0d1e2-3a4b-4c5d-6e7f-8a9b0c1d2e3f',
    autonomy: 'T2',
    status: 'active',
    channel: 'Social, In-store',
  },
  {
    id: 'a1b2c3d4-m010-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'campaign',
    name: 'Summer Launch Campaign',
    startDate: '2026-04-15',
    endDate: '2026-04-30',
    agentId: 'f9c0d1e2-3a4b-4c5d-6e7f-8a9b0c1d2e3f',
    autonomy: 'T3',
    status: 'planned',
    channel: 'Digital, OOH',
  },

  // ─── Promos ──────────────────────────────────────────────────────
  {
    id: 'a1b2c3d4-m011-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'promo',
    name: "Mother's Day Promo — Gift Bundles",
    startDate: '2026-05-05',
    endDate: '2026-05-10',
    agentId: 'c6f7a8b9-0d1e-4f2a-3b4c-5d6e7f8a9b0c',
    autonomy: 'T2',
    status: 'planned',
    channel: 'In-store, CRM',
  },
];
