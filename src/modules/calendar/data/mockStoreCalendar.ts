// Store Calendar — mock data for store-level events (festivals, renovations, VM changeovers, staffing)

export interface StoreCalendarEvent {
  id: string;
  type: 'festival' | 'renovation' | 'vm_changeover' | 'staffing' | 'opening' | 'closing';
  name: string;
  startDate: string;
  endDate: string;
  storeIds: string[];
  region?: string;
  footfallImpact?: number;
  agentId: string;
  status: 'planned' | 'active' | 'completed';
  linkedDropId?: string;
}

export const mockStoreCalendarEvents: StoreCalendarEvent[] = [
  // ─── Festivals ───────────────────────────────────────────────────
  {
    id: 'a1b2c3d4-f001-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'festival',
    name: 'Holi Festival',
    startDate: '2026-03-12',
    endDate: '2026-03-16',
    storeIds: ['b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', 'c4f4c8d0-1e5b-4f4e-a9c7-4d0e6b8f2a5c', '26d4a8b0-1c5f-4d4c-a9a7-4b0c6f8d2e5a', 'e6b6e0f2-3a7d-4b6a-81e9-6f2a8d0b4c7e', 'f7a3d7e9-0f4c-4210-b8d6-3e9f5c7a1bec'],
    region: 'North & West',
    footfallImpact: 35,
    agentId: 'e8b9c0d1-2f3a-4b4c-5d6e-7f8a9b0c1d2e',
    status: 'active',
  },
  {
    id: 'a1b2c3d4-f002-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'festival',
    name: 'Ugadi / Gudi Padwa',
    startDate: '2026-03-28',
    endDate: '2026-04-01',
    storeIds: ['6ed4a8b0-1c5f-4340-a9a7-4b0c6f8d2e53', '91a7d1e3-4f8c-4670-b2d0-7e3f9c1a5b86', 'b3c9f3a5-6b0e-4890-94f2-9a5b1e3c7da8', 'f7c7f1a3-4b8e-4c7b-92f0-7a3b9e1c5d8f', '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42'],
    region: 'South & West',
    footfallImpact: 28,
    agentId: 'e8b9c0d1-2f3a-4b4c-5d6e-7f8a9b0c1d2e',
    status: 'planned',
  },
  {
    id: 'a1b2c3d4-f003-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'festival',
    name: 'Eid-ul-Fitr',
    startDate: '2026-03-30',
    endDate: '2026-04-03',
    storeIds: ['b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', 'c4f4c8d0-1e5b-4f4e-a9c7-4d0e6b8f2a5c', '37e5b9c1-2d6a-4e5d-80b8-5c1d7a9e3f6b', '4cf8c2d4-5e9b-4710-a3c1-8d4e0b2f6a31', '15c3f7a9-0b4e-4c3b-98f6-3a9b5e7c1d4f', 'd5a5d9e1-2f6c-4a5f-b0d8-5e1f7c9a3b6d'],
    region: 'Pan-India',
    footfallImpact: 40,
    agentId: 'e8b9c0d1-2f3a-4b4c-5d6e-7f8a9b0c1d2e',
    status: 'planned',
  },
  {
    id: 'a1b2c3d4-f004-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'festival',
    name: 'Akshaya Tritiya',
    startDate: '2026-04-24',
    endDate: '2026-04-28',
    storeIds: ['b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', '6ed4a8b0-1c5f-4340-a9a7-4b0c6f8d2e53', '91a7d1e3-4f8c-4670-b2d0-7e3f9c1a5b86', 'e6b6e0f2-3a7d-4b6a-81e9-6f2a8d0b4c7e', 'f7c7f1a3-4b8e-4c7b-92f0-7a3b9e1c5d8f'],
    region: 'South & West',
    footfallImpact: 22,
    agentId: 'd7a8b9c0-1e2f-4a3b-4c5d-6e7f8a9b0c1d',
    status: 'planned',
  },
  {
    id: 'a1b2c3d4-f005-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'festival',
    name: "Mother's Day",
    startDate: '2026-05-08',
    endDate: '2026-05-12',
    storeIds: ['b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', 'c4f4c8d0-1e5b-4f4e-a9c7-4d0e6b8f2a5c', '26d4a8b0-1c5f-4d4c-a9a7-4b0c6f8d2e5a', '37e5b9c1-2d6a-4e5d-80b8-5c1d7a9e3f6b', 'b3c9f3a5-6b0e-4890-94f2-9a5b1e3c7da8', 'f7a3d7e9-0f4c-4210-b8d6-3e9f5c7a1bec'],
    region: 'Pan-India',
    footfallImpact: 15,
    agentId: 'e8b9c0d1-2f3a-4b4c-5d6e-7f8a9b0c1d2e',
    status: 'planned',
  },

  // ─── VM Changeovers (linked to drops) ────────────────────────────
  {
    id: 'a1b2c3d4-v001-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'vm_changeover',
    name: "SS26 MC04 VM Refresh",
    startDate: '2026-04-13',
    endDate: '2026-04-15',
    storeIds: ['b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', 'c4f4c8d0-1e5b-4f4e-a9c7-4d0e6b8f2a5c', '26d4a8b0-1c5f-4d4c-a9a7-4b0c6f8d2e5a', 'e6b6e0f2-3a7d-4b6a-81e9-6f2a8d0b4c7e'],
    region: 'Pan-India',
    agentId: 'b1e2f3a4-5c6d-4e7f-8a9b-0c1d2e3f4a5b',
    status: 'planned',
    linkedDropId: 'd6f7a8b9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
  },
  {
    id: 'a1b2c3d4-v002-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'vm_changeover',
    name: 'SS26 KW03 VM Refresh',
    startDate: '2026-04-18',
    endDate: '2026-04-20',
    storeIds: ['b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', '6ed4a8b0-1c5f-4340-a9a7-4b0c6f8d2e53', 'b3c9f3a5-6b0e-4890-94f2-9a5b1e3c7da8', 'f7a3d7e9-0f4c-4210-b8d6-3e9f5c7a1bec'],
    region: 'North & South',
    agentId: 'b1e2f3a4-5c6d-4e7f-8a9b-0c1d2e3f4a5b',
    status: 'planned',
    linkedDropId: 'd7a8b9c0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
  },
  {
    id: 'a1b2c3d4-v003-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'vm_changeover',
    name: "SS26 WIW02 VM Refresh",
    startDate: '2026-04-29',
    endDate: '2026-05-01',
    storeIds: ['b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', '91a7d1e3-4f8c-4670-b2d0-7e3f9c1a5b86', '37e5b9c1-2d6a-4e5d-80b8-5c1d7a9e3f6b', 'f7c7f1a3-4b8e-4c7b-92f0-7a3b9e1c5d8f', '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42'],
    region: 'Pan-India',
    agentId: 'b1e2f3a4-5c6d-4e7f-8a9b-0c1d2e3f4a5b',
    status: 'planned',
    linkedDropId: 'd8b9c0d1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
  },
  {
    id: 'a1b2c3d4-v004-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'vm_changeover',
    name: "AW26 MF01 VM Refresh",
    startDate: '2026-08-30',
    endDate: '2026-09-01',
    storeIds: ['b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', 'c4f4c8d0-1e5b-4f4e-a9c7-4d0e6b8f2a5c', '26d4a8b0-1c5f-4d4c-a9a7-4b0c6f8d2e5a', 'e6b6e0f2-3a7d-4b6a-81e9-6f2a8d0b4c7e', '4cf8c2d4-5e9b-4710-a3c1-8d4e0b2f6a31'],
    region: 'Pan-India',
    agentId: 'b1e2f3a4-5c6d-4e7f-8a9b-0c1d2e3f4a5b',
    status: 'planned',
    linkedDropId: 'd9c0d1e2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
  },

  // ─── Renovations ─────────────────────────────────────────────────
  {
    id: 'a1b2c3d4-r001-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'renovation',
    name: 'Phoenix Mall Bangalore - Floor 2 Renovation',
    startDate: '2026-03-01',
    endDate: '2026-04-15',
    storeIds: ['6ed4a8b0-1c5f-4340-a9a7-4b0c6f8d2e53'],
    region: 'South',
    agentId: 'e8b9c0d1-2f3a-4b4c-5d6e-7f8a9b0c1d2e',
    status: 'active',
  },
  {
    id: 'a1b2c3d4-r002-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'renovation',
    name: 'Ambience Mall Gurgaon - Full Refit',
    startDate: '2026-05-01',
    endDate: '2026-06-30',
    storeIds: ['e6b6e0f2-3a7d-4b6a-81e9-6f2a8d0b4c7e'],
    region: 'North',
    agentId: 'e8b9c0d1-2f3a-4b4c-5d6e-7f8a9b0c1d2e',
    status: 'planned',
  },

  // ─── Store Opening ───────────────────────────────────────────────
  {
    id: 'a1b2c3d4-o001-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'opening',
    name: 'Phoenix Mall Bangalore - Grand Reopening',
    startDate: '2026-04-18',
    endDate: '2026-04-20',
    storeIds: ['6ed4a8b0-1c5f-4340-a9a7-4b0c6f8d2e53'],
    region: 'South',
    footfallImpact: 30,
    agentId: 'e8b9c0d1-2f3a-4b4c-5d6e-7f8a9b0c1d2e',
    status: 'planned',
  },

  // ─── Staffing ────────────────────────────────────────────────────
  {
    id: 'a1b2c3d4-s001-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'staffing',
    name: 'Festival Season Surge Staffing',
    startDate: '2026-03-10',
    endDate: '2026-04-05',
    storeIds: ['b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', 'c4f4c8d0-1e5b-4f4e-a9c7-4d0e6b8f2a5c', '26d4a8b0-1c5f-4d4c-a9a7-4b0c6f8d2e5a', '37e5b9c1-2d6a-4e5d-80b8-5c1d7a9e3f6b', '4cf8c2d4-5e9b-4710-a3c1-8d4e0b2f6a31'],
    region: 'Pan-India',
    agentId: 'c4f5a6b7-8d9e-4f0a-1b2c-3d4e5f6a7b8c',
    status: 'active',
  },
  {
    id: 'a1b2c3d4-s002-4a5b-8c6d-7e8f9a0b1c2d',
    type: 'staffing',
    name: 'Summer Season Extended Hours',
    startDate: '2026-04-15',
    endDate: '2026-06-15',
    storeIds: ['b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', 'c4f4c8d0-1e5b-4f4e-a9c7-4d0e6b8f2a5c', '6ed4a8b0-1c5f-4340-a9a7-4b0c6f8d2e53', '26d4a8b0-1c5f-4d4c-a9a7-4b0c6f8d2e5a', '91a7d1e3-4f8c-4670-b2d0-7e3f9c1a5b86'],
    region: 'Pan-India',
    agentId: 'c4f5a6b7-8d9e-4f0a-1b2c-3d4e5f6a7b8c',
    status: 'planned',
  },
];
