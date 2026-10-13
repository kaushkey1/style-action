export type MilestoneStatus = 'completed' | 'on-track' | 'at-risk' | 'upcoming';
export type CalendarType = 'retail' | 'marketing' | 'store';

export interface Milestone {
  id: string;
  name: string;
  date: string;
  progress: number;
  status: MilestoneStatus;
  type: CalendarType;
  season?: string;
  description: string;
  linkedAgents?: string[];
}

export const mockMilestones: Milestone[] = [
  // Retail Calendar
  {
    id: 'a1b2c3d4-a001-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'AW26 Range Lock',
    date: '2026-02-19',
    progress: 92,
    status: 'on-track',
    type: 'retail',
    season: 'AW26',
    description: 'Final range selection for Autumn/Winter 2026',
    linkedAgents: ['b1e2f3a4-5c6d-4e7f-8a9b-0c1d2e3f4a5b', 'e4b5c6d7-8f9a-4b0c-1d2e-3f4a5b6c7d8e'],
  },
  {
    id: 'a1b2c3d4-a002-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'AW26 Buy Plan Freeze',
    date: '2026-03-15',
    progress: 45,
    status: 'on-track',
    type: 'retail',
    season: 'AW26',
    description: 'Buy plan quantities locked per style × vendor',
    linkedAgents: ['e4b5c6d7-8f9a-4b0c-1d2e-3f4a5b6c7d8e', 'a0d1e2f3-4b5c-4d6e-7f8a-9b0c1d2e3f4a', 'a6d7e8f9-0b1c-4d2e-3f4a-5b6c7d8e9f0a'],
  },
  {
    id: 'a1b2c3d4-a003-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'AW26 PO Drop',
    date: '2026-04-01',
    progress: 0,
    status: 'upcoming',
    type: 'retail',
    season: 'AW26',
    description: 'Purchase orders placed with vendors',
    linkedAgents: ['a6d7e8f9-0b1c-4d2e-3f4a-5b6c7d8e9f0a', 'd9a0b1c2-3e4f-4a5b-6c7d-8e9f0a1b2c3d'],
  },
  {
    id: 'a1b2c3d4-a004-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'SS26 Markdown Wave 2',
    date: '2026-03-22',
    progress: 0,
    status: 'upcoming',
    type: 'retail',
    season: 'SS26',
    description: 'Second markdown wave for Spring/Summer 2026 end-of-season',
    linkedAgents: ['c6f7a8b9-0d1e-4f2a-3b4c-5d6e7f8a9b0c', 'e4b5c6d7-8f9a-4b0c-1d2e-3f4a5b6c7d8e'],
  },
  {
    id: 'a1b2c3d4-a005-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'SS26 Season Close',
    date: '2026-04-30',
    progress: 0,
    status: 'upcoming',
    type: 'retail',
    season: 'SS26',
    description: 'Final clearance and season closeout',
    linkedAgents: ['c6f7a8b9-0d1e-4f2a-3b4c-5d6e7f8a9b0c', 'e4b5c6d7-8f9a-4b0c-1d2e-3f4a5b6c7d8e', 'f3c4d5e6-7a8b-4c9d-0e1f-2a3b4c5d6e7f'],
  },
  // Marketing Calendar
  {
    id: 'a1b2c3d4-a101-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'EOSS Campaign Launch',
    date: '2026-02-28',
    progress: 78,
    status: 'at-risk',
    type: 'marketing',
    description: 'End of Season Sale launch across all channels',
    linkedAgents: ['f9c0d1e2-3a4b-4c5d-6e7f-8a9b0c1d2e3f', 'c6f7a8b9-0d1e-4f2a-3b4c-5d6e7f8a9b0c'],
  },
  {
    id: 'a1b2c3d4-a102-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Valentine\'s Day Campaign',
    date: '2026-02-14',
    progress: 100,
    status: 'completed',
    type: 'marketing',
    description: 'Valentine\'s Day promotional campaign',
    linkedAgents: ['f9c0d1e2-3a4b-4c5d-6e7f-8a9b0c1d2e3f'],
  },
  {
    id: 'a1b2c3d4-a103-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Holi Festival Campaign',
    date: '2026-03-14',
    progress: 35,
    status: 'on-track',
    type: 'marketing',
    description: 'Holi festive collection campaign',
    linkedAgents: ['f9c0d1e2-3a4b-4c5d-6e7f-8a9b0c1d2e3f', 'b1e2f3a4-5c6d-4e7f-8a9b-0c1d2e3f4a5b'],
  },
  {
    id: 'a1b2c3d4-a104-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'New Arrivals - AW26 Preview',
    date: '2026-05-01',
    progress: 10,
    status: 'upcoming',
    type: 'marketing',
    description: 'Early preview of AW26 collection for VIP customers',
    linkedAgents: ['f9c0d1e2-3a4b-4c5d-6e7f-8a9b0c1d2e3f', 'b1e2f3a4-5c6d-4e7f-8a9b-0c1d2e3f4a5b'],
  },
  // Store Calendar
  {
    id: 'a1b2c3d4-a201-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'VM Refresh - EOSS Setup',
    date: '2026-02-25',
    progress: 60,
    status: 'on-track',
    type: 'store',
    description: 'Visual merchandising refresh for EOSS across all stores',
    linkedAgents: ['e8b9c0d1-2f3a-4b4c-5d6e-7f8a9b0c1d2e', 'b1e2f3a4-5c6d-4e7f-8a9b-0c1d2e3f4a5b'],
  },
  {
    id: 'a1b2c3d4-a202-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Store Audit - Q1',
    date: '2026-03-01',
    progress: 20,
    status: 'on-track',
    type: 'store',
    description: 'Quarterly store audit for compliance and operations',
    linkedAgents: ['e8b9c0d1-2f3a-4b4c-5d6e-7f8a9b0c1d2e'],
  },
  {
    id: 'a1b2c3d4-a203-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'New Store Launch - Phoenix Mall',
    date: '2026-03-20',
    progress: 55,
    status: 'at-risk',
    type: 'store',
    description: 'New store opening at Phoenix Mall, Bangalore',
    linkedAgents: ['e8b9c0d1-2f3a-4b4c-5d6e-7f8a9b0c1d2e', 'd7a8b9c0-1e2f-4a3b-4c5d-6e7f8a9b0c1d', 'b1e2f3a4-5c6d-4e7f-8a9b-0c1d2e3f4a5b'],
  },
  {
    id: 'a1b2c3d4-a204-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Inventory Count - All Stores',
    date: '2026-03-31',
    progress: 0,
    status: 'upcoming',
    type: 'store',
    description: 'End of quarter physical inventory count',
    linkedAgents: ['b7e8f9a0-1c2d-4e3f-4a5b-6c7d8e9f0a1b', 'd7a8b9c0-1e2f-4a3b-4c5d-6e7f8a9b0c1d'],
  },
];
