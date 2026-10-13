import type { TaskStatus } from '../types/task.types';

/**
 * Single source of truth for Kanban lanes — shared by the board
 * (`TaskListKanbanView`), the pointer-drag hook (`useKanbanDrag`), and the
 * task-actions menus (`TaskActionsMenu` / `TaskActionsSheet`). Previously each
 * of these carried its own copy of the lane config, which drifted.
 */
export type LaneId = 'pending' | 'in_progress' | 'blocked' | 'review' | 'done';

export interface LaneConfig {
  id: LaneId;
  label: string;
  /** Pastel column background. */
  tint: string;
  /** Status dot colour. */
  dot: string;
  /** Status a task takes when moved into this lane. */
  status: TaskStatus;
}

/** Board lanes in display order. */
export const LANES: readonly LaneConfig[] = [
  { id: 'pending',     label: 'Pending',     tint: 'bg-gray-50',  dot: 'bg-gray-400',  status: 'open' },
  { id: 'in_progress', label: 'In Progress', tint: 'bg-amber-50', dot: 'bg-amber-500', status: 'in_progress' },
  { id: 'blocked',     label: 'Blocked',     tint: 'bg-red-50',   dot: 'bg-red-500',   status: 'blocked' },
  { id: 'review',      label: 'Review',      tint: 'bg-blue-50',  dot: 'bg-blue-500',  status: 'in_review' },
  { id: 'done',        label: 'Done',        tint: 'bg-green-50', dot: 'bg-green-500', status: 'done' },
];

/** Every task status maps onto the lane it belongs to. */
export const STATUS_TO_LANE: Record<TaskStatus, LaneId> = {
  pending: 'pending',
  open: 'pending',
  reopened: 'pending',
  in_progress: 'in_progress',
  blocked: 'blocked',
  in_review: 'review',
  done: 'done',
  cancelled: 'done',
};

/** Lane → the status a card takes when dropped there. */
export const LANE_TO_STATUS: Record<LaneId, TaskStatus> = {
  pending: 'open',
  in_progress: 'in_progress',
  blocked: 'blocked',
  review: 'in_review',
  done: 'done',
};

/** Resolve the lane a task currently sits in. */
export function laneForStatus(status: TaskStatus): LaneId {
  return STATUS_TO_LANE[status];
}
