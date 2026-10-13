/**
 * Action Register — TypeScript types matching the actual API response.
 */

export type ActionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'DONE' | 'MEASURED';

export interface Action {
  id: string;
  priority: ActionPriority;
  action: string;
  rule: string;
  owner: string;
  expected_outcome: string;
  likelihood: {
    value: number;
    confidence: string;
  };
  human_in_loop: boolean;
  clockspeed: string;
  store_code: string;
  report_ref: string;
  status: ActionStatus;
  created_at: string;
  updated_at: string;
  reason?: string;
  outcome?: string;
  effectiveness?: number;
}

export interface ActionListResponse {
  actions: Action[];
}

export interface ActionStatsResponse {
  total: number;
  proposed: number;
  approved: number;
  rejected: number;
  measured: number;
  avg_effectiveness: string;
  approval_rate: string;
}

export interface UpdateActionData {
  status?: ActionStatus;
  reason?: string;
  action?: string;
  priority?: ActionPriority;
  owner?: string;
}

export interface RecordOutcomeData {
  outcome: string;
  effectiveness: number;
}

export const PRIORITY_CONFIG: Record<ActionPriority, { label: string; variant: 'error' | 'warning' | 'info' | 'default' }> = {
  CRITICAL: { label: 'Critical', variant: 'error' },
  HIGH: { label: 'High', variant: 'warning' },
  MEDIUM: { label: 'Medium', variant: 'info' },
  LOW: { label: 'Low', variant: 'default' },
};

export const STATUS_CONFIG: Record<ActionStatus, { label: string; variant: 'default' | 'primary' | 'error' | 'warning' | 'success' | 'info' }> = {
  PROPOSED: { label: 'Proposed', variant: 'default' },
  APPROVED: { label: 'Approved', variant: 'primary' },
  REJECTED: { label: 'Rejected', variant: 'error' },
  IN_PROGRESS: { label: 'In Progress', variant: 'warning' },
  DONE: { label: 'Done', variant: 'success' },
  MEASURED: { label: 'Measured', variant: 'info' },
};
