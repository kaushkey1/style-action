/**
 * Client for triggering + tracking an OTB calculator run (Temporal).
 *
 * Superdry channel-led admin: after a config Save the screen offers to trigger
 * an OTB run. The run executes in the backend (Temporal workflow in the
 * `cortex-calculators` namespace) and reads the just-saved `otb_config_master`
 * config, so it is independent of the browser session.
 *
 * NOTE: intentionally OTB-specific for now. A generic, reusable
 * "calculator run" client/hook (for other orgs / screens / calculators) is
 * planned as a follow-up and is out of scope here.
 */

import { apiUrl, apiHeaders } from '@/lib/utils';

export type OtbRunStatus =
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELED'
  | 'TERMINATED'
  | 'TIMED_OUT'
  | 'CONTINUED_AS_NEW'
  | 'UNKNOWN';

export interface OtbRunHandle {
  workflow_id: string;
  run_id?: string | null;
  status: OtbRunStatus;
}

export interface OtbRunStatusResult {
  workflow_id: string;
  status: OtbRunStatus;
  result?: Record<string, unknown> | null;
  completed_at?: string | null;
}

export interface OtbCompletedRun extends OtbRunHandle {
  completed_at: string;
}

/** Latest successful completion for this org, across all seasons. */
export async function getLatestOtbRun(): Promise<OtbCompletedRun | null> {
  const res = await fetch(apiUrl('/otb/admin/otb-run/latest'), {
    headers: apiHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.detail ?? json.message ?? `API error ${res.status}`);
  }
  return (json.data as OtbCompletedRun | null) ?? null;
}

export interface TriggerOtbRunPayload {
  season?: string | null;
  run_set_ids?: string[] | null;
  config_version?: number | null;
}

/** Thrown on HTTP 409 — a run for this org/season is already in progress. */
export class OtbRunConflictError extends Error {
  constructor(message = 'An OTB run is already in progress.') {
    super(message);
    this.name = 'OtbRunConflictError';
  }
}

/** Start an OTB run for the current tenant's org. */
export async function triggerOtbRun(
  userEmail: string,
  payload: TriggerOtbRunPayload = {},
): Promise<OtbRunHandle> {
  const res = await fetch(apiUrl('/otb/admin/otb-run'), {
    method: 'POST',
    headers: {
      ...apiHeaders(),
      'x-user-data': JSON.stringify({ email: userEmail }),
    },
    body: JSON.stringify({ trigger_source: 'admin-save', ...payload }),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 409) {
    throw new OtbRunConflictError(json.message ?? undefined);
  }
  if (!res.ok) {
    throw new Error(json.detail ?? json.message ?? `API error ${res.status}`);
  }
  return json.data as OtbRunHandle;
}

/** Poll the status of a previously-triggered run. */
export async function getOtbRunStatus(workflowId: string): Promise<OtbRunStatusResult> {
  const res = await fetch(
    apiUrl(`/otb/admin/otb-run/${encodeURIComponent(workflowId)}/status`),
    { headers: apiHeaders() },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.detail ?? json.message ?? `API error ${res.status}`);
  }
  return json.data as OtbRunStatusResult;
}

/**
 * The current org's in-progress run, if any (for reload-awareness). Resolves to
 * `null` when nothing is running.
 */
export async function getActiveOtbRun(): Promise<OtbRunHandle | null> {
  const res = await fetch(apiUrl('/otb/admin/otb-run/active'), {
    headers: apiHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.detail ?? json.message ?? `API error ${res.status}`);
  }
  return (json.data as OtbRunHandle | null) ?? null;
}
