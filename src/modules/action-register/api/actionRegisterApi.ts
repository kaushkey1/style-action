/**
 * Action Register API — proxied through create-costing-agent.
 */

import { ApiService } from '@/lib/api';
import { gbrainUrl } from '@/modules/agentic-brain/api/agenticBrainApi';
import type {
  Action,
  ActionListResponse,
  ActionStatsResponse,
  UpdateActionData,
  RecordOutcomeData,
} from '../data/actionRegisterTypes';

export async function fetchActions(params?: {
  status?: string;
  priority?: string;
  store?: string;
}): Promise<ActionListResponse> {
  const res = await ApiService.get(gbrainUrl('/api/gbrain/action-register'), {
    params: params ?? {},
  });
  const raw = res.data;
  // API returns { actions: [...] } or raw array
  if (Array.isArray(raw)) return { actions: raw as Action[] };
  return raw as ActionListResponse;
}

export async function fetchAction(id: string): Promise<Action> {
  const res = await ApiService.get(gbrainUrl(`/api/gbrain/action-register/${id}`));
  return res.data as Action;
}

export async function updateAction(id: string, data: UpdateActionData): Promise<void> {
  await ApiService.patch(gbrainUrl(`/api/gbrain/action-register/${id}`), { data });
}

export async function recordOutcome(id: string, data: RecordOutcomeData): Promise<void> {
  await ApiService.post(gbrainUrl(`/api/gbrain/action-register/${id}/outcome`), { data });
}

export async function fetchActionStats(): Promise<ActionStatsResponse> {
  const res = await ApiService.get(gbrainUrl('/api/gbrain/action-register/stats'));
  return res.data as ActionStatsResponse;
}

export const actionRegisterKeys = {
  all: ['action-register'] as const,
  list: (params?: Record<string, string>) => [...actionRegisterKeys.all, 'list', params] as const,
  detail: (id: string) => [...actionRegisterKeys.all, 'detail', id] as const,
  stats: () => [...actionRegisterKeys.all, 'stats'] as const,
};
