export type ActionActor = 'you' | 'agent';
export type ActionType = 'approved' | 'rejected' | 'delegated' | 'auto-resolved' | 'overrode' | 'snoozed';
export type ActionStatus = 'executed' | 'pending' | 'cancelled' | 'failed';

export interface ActionRecord {
  id: string;
  actor: string;
  actorType: ActionActor;
  actionType: ActionType;
  subject: string;
  financialImpact?: string;
  executionTime: string;
  status: ActionStatus;
  timestamp: string;
  relativeTime: string;
}

export const mockActions: ActionRecord[] = [
  {
    id: 'act-001',
    actor: 'Trading Agent (A9)',
    actorType: 'agent',
    actionType: 'auto-resolved',
    subject: 'Markdown batch — ₹262 Cr, 50,000 options',
    financialImpact: '₹262 Cr',
    executionTime: 'Executed at 07:42 AM',
    status: 'executed',
    timestamp: '2026-04-05T07:42:00',
    relativeTime: '3h ago',
  },
  {
    id: 'act-002',
    actor: 'You',
    actorType: 'you',
    actionType: 'approved',
    subject: 'Foreclose 23 POs — ₹8.4 Cr',
    financialImpact: '₹8.4 Cr',
    executionTime: 'Scheduled for 09:00 AM',
    status: 'pending',
    timestamp: '2026-04-05T10:18:00',
    relativeTime: '12m ago',
  },
  {
    id: 'act-003',
    actor: 'Store Economist (A1)',
    actorType: 'agent',
    actionType: 'auto-resolved',
    subject: 'Flagged Fashion Factory for category review',
    executionTime: 'Executed at 06:15 AM',
    status: 'executed',
    timestamp: '2026-04-05T06:15:00',
    relativeTime: '4.5h ago',
  },
  {
    id: 'act-004',
    actor: 'You',
    actorType: 'you',
    actionType: 'rejected',
    subject: 'Women Indian markdown acceleration',
    financialImpact: '₹18 Cr',
    executionTime: 'Rejected — reason logged',
    status: 'executed',
    timestamp: '2026-04-05T09:30:00',
    relativeTime: '1h ago',
  },
  {
    id: 'act-005',
    actor: 'OTB Guardian (A11)',
    actorType: 'agent',
    actionType: 'auto-resolved',
    subject: 'Recalculated OTB headroom excluding aged stock',
    executionTime: 'Executed at 05:00 AM',
    status: 'executed',
    timestamp: '2026-04-05T05:00:00',
    relativeTime: '5.5h ago',
  },
];
