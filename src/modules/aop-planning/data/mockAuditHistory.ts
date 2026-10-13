import type { AuditEntry, ReviewEntry, UserTask } from '../types/aopPlanning.types';

export const MOCK_AUDIT_ENTRIES: AuditEntry[] = [
  { id: 'aud-1', cycleId: 'cycle-1', timestamp: '2025-10-15T09:00:00Z', actor: 'System', action: 'Cycle created', entityType: 'cycle', entityId: 'cycle-1', description: 'FY26 annual plan cycle auto-created', oldValue: null, newValue: 'DRAFT' },
  { id: 'aud-2', cycleId: 'cycle-1', timestamp: '2025-11-02T10:15:00Z', actor: 'R. Head', action: 'Store classified', entityType: 'grid_cell', entityId: 'ebo-s2', description: 'Store B reclassified from ANNUALISED to NEW', oldValue: 'ANNUALISED', newValue: 'NEW' },
  { id: 'aud-3', cycleId: 'cycle-1', timestamp: '2025-11-10T14:30:00Z', actor: 'Planner', action: 'Cell edited', entityType: 'grid_cell', entityId: 'ebo-s1:oct', description: 'Store A Oct value adjusted', oldValue: '₹0.52 Cr', newValue: '₹0.58 Cr' },
  { id: 'aud-4', cycleId: 'cycle-1', timestamp: '2025-11-10T14:31:00Z', actor: 'Planner', action: 'Cell pinned', entityType: 'grid_cell', entityId: 'ebo-s1:oct', description: 'Store A Oct pinned — remainder redistributed across 11 months', oldValue: null, newValue: '₹0.58 Cr (pinned)' },
  { id: 'aud-5', cycleId: 'cycle-1', timestamp: '2025-12-01T09:45:00Z', actor: 'System', action: 'Exception raised', entityType: 'exception', entityId: 'exc-1', description: 'Hard exception: channel reconciliation off for SIS/Mens', oldValue: null, newValue: 'HARD — CHANNEL_RECON' },
  { id: 'aud-6', cycleId: 'cycle-1', timestamp: '2025-12-05T11:20:00Z', actor: 'R. Head', action: 'Scenario created', entityType: 'scenario', entityId: 'scenario-optimistic', description: 'Optimistic scenario created with +17.2% growth', oldValue: null, newValue: 'Optimistic' },
  { id: 'aud-7', cycleId: 'cycle-1', timestamp: '2025-12-08T16:00:00Z', actor: 'C. Finance', action: 'Projection method set', entityType: 'grid_cell', entityId: 'ebo-s8', description: 'Store H projection set to Waterfall, acknowledged', oldValue: 'reference', newValue: 'waterfall' },
  { id: 'aud-8', cycleId: 'cycle-1', timestamp: '2025-12-15T10:00:00Z', actor: 'Planner', action: 'Exception acknowledged', entityType: 'exception', entityId: 'exc-5', description: 'GM% below floor acknowledged for Distribution/B2B', oldValue: 'open', newValue: 'acknowledged' },
  { id: 'aud-9', cycleId: 'cycle-1', timestamp: '2026-01-05T09:00:00Z', actor: 'R. Head', action: 'Submitted for review', entityType: 'cycle', entityId: 'cycle-1', description: 'Plan submitted — v3, first cut', oldValue: 'DRAFT', newValue: 'SUBMITTED' },
  { id: 'aud-10', cycleId: 'cycle-1', timestamp: '2026-01-08T14:00:00Z', actor: 'C. Finance', action: 'Revision requested', entityType: 'approval', entityId: 'cycle-1', description: 'EBO growth too high — rework channel target', oldValue: 'IN_REVIEW', newValue: 'REVISION_REQUESTED' },
  { id: 'aud-11', cycleId: 'cycle-1', timestamp: '2026-01-10T09:30:00Z', actor: 'Planner', action: 'Cell edited', entityType: 'grid_cell', entityId: 'EBO', description: 'EBO channel target reduced', oldValue: '₹340 Cr', newValue: '₹320 Cr' },
  { id: 'aud-12', cycleId: 'cycle-1', timestamp: '2026-01-12T14:30:00Z', actor: 'R. Head', action: 'Resubmitted', entityType: 'cycle', entityId: 'cycle-1', description: 'Revised plan resubmitted after EBO adjustment', oldValue: 'REVISION_REQUESTED', newValue: 'SUBMITTED' },
];

export const MOCK_REVIEWS: ReviewEntry[] = [
  { id: 'rev-1', cycleId: 'cycle-1', action: 'submitted', actor: 'R. Head', actorRole: 'Regional Head', timestamp: '2026-01-05T09:00:00Z', comment: 'First cut — ready for review', version: 3 },
  { id: 'rev-2', cycleId: 'cycle-1', action: 'comment', actor: 'C. Finance', actorRole: 'Central Finance', timestamp: '2026-01-06T11:00:00Z', comment: 'EBO growth at 11.4% is well above the 7% band ceiling. Please review.', version: 3 },
  { id: 'rev-3', cycleId: 'cycle-1', action: 'revision_requested', actor: 'C. Finance', actorRole: 'Central Finance', timestamp: '2026-01-08T14:00:00Z', comment: 'EBO too high — rework the channel target down to within +7% growth band.', version: 3 },
  { id: 'rev-4', cycleId: 'cycle-1', action: 'submitted', actor: 'R. Head', actorRole: 'Regional Head', timestamp: '2026-01-12T14:30:00Z', comment: 'Revised EBO down to ₹320 Cr (+6.2%). Resubmitting.', version: 3 },
];

export const MOCK_USER_TASKS: UserTask[] = [
  { id: 'task-1', cycleId: 'cycle-1', cycleName: 'Superdry · FY26', type: 'resolve_exception', description: 'Clear 1 hard exception — SIS/Mens reconciliation', priority: 'high', deepLink: '/sales-plan/workspace/cycle-1' },
  { id: 'task-2', cycleId: 'cycle-1', cycleName: 'Superdry · FY26', type: 'resolve_exception', description: 'Acknowledge new-store variance — Store B Δ31%', priority: 'medium', deepLink: '/sales-plan/workspace/cycle-1' },
  { id: 'task-3', cycleId: 'cycle-1', cycleName: 'Superdry · FY26', type: 'review', description: 'Review revised plan after EBO adjustment', priority: 'high', deepLink: '/sales-plan/review/cycle-1' },
  { id: 'task-4', cycleId: 'cycle-1', cycleName: 'Superdry · FY26', type: 'submit', description: 'Submit once all hard exceptions cleared', priority: 'medium', deepLink: '/sales-plan/workspace/cycle-1' },
];
