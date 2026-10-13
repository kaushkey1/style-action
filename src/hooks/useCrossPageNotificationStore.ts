import { create } from 'zustand';

export interface CrossPageNotification {
  id: string;
  source: 'space-planning' | 'visual-merchandising';
  target: 'space-planning' | 'visual-merchandising';
  title: string;
  message: string;
  actionLink: string;
  createdAt: string;
  read: boolean;
  critical: boolean;
}

interface CrossPageNotificationState {
  notifications: CrossPageNotification[];
  markRead: (id: string) => void;
  markAllRead: (target: string) => void;
}

export const useCrossPageNotificationStore = create<CrossPageNotificationState>((set) => ({
  notifications: [
    // SP -> VM notifications
    {
      id: 'N-001',
      source: 'space-planning',
      target: 'visual-merchandising',
      title: 'Space Plan Locked — RA-Jun-26',
      message: '412 stores locked for RA cycle. Verify fixture assignments align with updated space allocations before next changeover.',
      actionLink: '/visual-merchandising',
      createdAt: '2026-04-07T09:15:00',
      read: false,
      critical: true,
    },
    {
      id: 'N-002',
      source: 'space-planning',
      target: 'visual-merchandising',
      title: 'Fixture Transfer Completed — 3x 4-ft Wall',
      message: 'Transfer STO-2026-0451 inwarded at Trends Andheri West. Update planogram for new fixture configuration.',
      actionLink: '/visual-merchandising',
      createdAt: '2026-04-06T14:30:00',
      read: false,
      critical: false,
    },
    {
      id: 'N-003',
      source: 'space-planning',
      target: 'visual-merchandising',
      title: 'New Store Opening — Trends Whitefield',
      message: 'NSO-004 fixture installation complete. Initial VM setup required before store launch on Apr 20.',
      actionLink: '/visual-merchandising',
      createdAt: '2026-04-05T11:00:00',
      read: true,
      critical: true,
    },
    // VM -> SP notifications
    {
      id: 'N-004',
      source: 'visual-merchandising',
      target: 'space-planning',
      title: 'Summer Splash Event — Fixture Capacity Alert',
      message: '23 stores need temporary fixture additions for Summer Splash event (Apr 14-May 15). Review capacity impact on space plan.',
      actionLink: '/space-planning',
      createdAt: '2026-04-07T10:00:00',
      read: false,
      critical: true,
    },
    {
      id: 'N-005',
      source: 'visual-merchandising',
      target: 'space-planning',
      title: 'EOSS Markdown Stage 2 Starting',
      message: 'EOSS moving to 40% markdown. Stock consolidation recommendations may affect fixture utilization at 12 stores.',
      actionLink: '/space-planning',
      createdAt: '2026-04-06T16:45:00',
      read: false,
      critical: false,
    },
    {
      id: 'N-006',
      source: 'visual-merchandising',
      target: 'space-planning',
      title: 'Compliance Issue — Chronic Non-Compliant Stores',
      message: '8 stores flagged as chronically non-compliant. VM recommends fixture audit to check if layout constraints cause compliance failures.',
      actionLink: '/space-planning',
      createdAt: '2026-04-04T09:30:00',
      read: true,
      critical: false,
    },
    {
      id: 'N-007',
      source: 'space-planning',
      target: 'visual-merchandising',
      title: 'Fixture Rebalancing Approved — 5 Transfers',
      message: '5 fixture rebalancing recommendations approved. Destination stores will receive new fixtures within 7 days. Plan VM accordingly.',
      actionLink: '/visual-merchandising',
      createdAt: '2026-04-03T15:20:00',
      read: true,
      critical: false,
    },
    {
      id: 'N-008',
      source: 'visual-merchandising',
      target: 'space-planning',
      title: 'Window Rotation Overdue — 32 Stores',
      message: '32 stores have not updated window displays for current rotation. May indicate fixture or access issues.',
      actionLink: '/space-planning',
      createdAt: '2026-04-02T08:15:00',
      read: true,
      critical: false,
    },
  ],
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllRead: (target) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.target === target ? { ...n, read: true } : n
      ),
    })),
}));
